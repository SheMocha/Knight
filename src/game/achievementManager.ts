import {
  ACHIEVEMENT_BY_KEY,
  ACHIEVEMENTS_CATALOG,
  AchievementDefinition,
  AchievementKey,
  isConfiguredGooglePlayId,
} from './achievementsConfig';
import {
  playGamesBridge,
  PlayGamesConnectionSnapshot,
  RemotePlayAchievement,
} from './playGamesBridge';
import { BossId } from './types';

const PROGRESS_STORAGE_KEY = 'black_knight_achievements_progress_v2';
const MAX_PROCESSED_KEYS = 250;

export type AchievementSyncState =
  | 'LOCKED'
  | 'PLAY_GAMES_UNLOCKED'
  | 'PENDING_SYNC'
  | 'MISSING_CONSOLE_ID'
  | 'LOCAL_ONLY_OFFLINE'
  | 'LOCAL_ONLY_NOT_SIGNED_IN'
  | 'LOCAL_ONLY_WEB';

export interface GameplayAchievementStats {
  completedLevelsCount: number;
  enemiesDefeated: number;
  maxCombo: number;
  bestAccuracyPct: number;
  totalGoldEarned: number;
  breakablesDestroyed: number;
  tntMultiBlasts: number;
  specialRewardsCollected: number;
  defeatedBossIds: BossId[];
  flawlessVictories: number;
  princessProtectedCount: number;
  kingProtectedCount: number;
  comboHoldMaxSec: number;
  maxSingleLevelScore: number;
  gameCompleted: boolean;
}

export interface PendingSyncEntry {
  key: AchievementKey;
  type: 'STANDARD' | 'INCREMENTAL';
  steps: number;
  queuedAt: number;
}

export interface PersistedAchievementData {
  stats: GameplayAchievementStats;
  /** Oyuncunun gerçek oyun içi koşulu ilk kez sağladığı zaman damgası (yerel kayıt, Play Games onayı DEĞİLDİR) */
  localCriteriaMetAt: Partial<Record<AchievementKey, number>>;
  /** Yalnızca gerçek Google Play Games SDK v2 sunucusundan onaylanan durumlar */
  remoteConfirmed: Partial<
    Record<
      AchievementKey,
      {
        unlocked: boolean;
        currentSteps: number;
        totalSteps: number;
        lastSyncedAt: number;
      }
    >
  >;
  /** Çevrimdışı veya geçici hata anında bekletilen idempotent gönderim kuyruğu */
  pendingSync: Partial<Record<AchievementKey, PendingSyncEntry>>;
  /** Aynı olayın iki kez işlenmesini önleyen tekil olay anahtarları */
  processedEventKeys: string[];
}

export interface AchievementViewItem {
  def: AchievementDefinition;
  /** Yerel gerçek oyun ilerlemesi (0..targetSteps) */
  localSteps: number;
  /** Google Play Games sunucusundan doğrulanmış adım sayısı (bağlı değilse null) */
  remoteSteps: number | null;
  /** Gösterilecek birleşik ilerleme (sunucu varsa max(local, remote)) */
  displaySteps: number;
  percent: number;
  localCriteriaMet: boolean;
  /** Yalnızca Google Play Games sunucusu gerçekten onayladıysa true */
  playGamesUnlocked: boolean;
  syncState: AchievementSyncState;
  consoleIdConfigured: boolean;
  unlockedAt: number | null;
}

export interface AchievementToastPayload {
  id: number;
  key: AchievementKey;
  name: string;
  description: string;
  iconPath: string;
  points: number;
  tier: AchievementDefinition['tier'];
  syncedToPlayGames: boolean;
  statusLabel: string;
}

export interface AchievementManagerSnapshot {
  connection: PlayGamesConnectionSnapshot;
  items: AchievementViewItem[];
  playGamesUnlockedCount: number;
  localCriteriaMetCount: number;
  totalCount: number;
  pendingSyncCount: number;
  isSyncing: boolean;
  lastError: string | null;
}

export type GameplayAchievementEvent =
  | { type: 'enemy_defeated'; count: number; eventKey?: string }
  | { type: 'breakable_destroyed'; count: number; eventKey?: string }
  | { type: 'tnt_multi_blast'; blastedCount: number; eventKey?: string }
  | { type: 'gold_earned'; amount: number; eventKey?: string }
  | { type: 'special_reward'; count: number; eventKey?: string }
  | { type: 'combo_updated'; combo: number; holdSeconds: number }
  | { type: 'boss_defeated'; bossId: BossId; eventKey?: string }
  | {
      type: 'level_completed';
      runId: string;
      levelId: number;
      completedLevelsCount: number;
      levelScore: number;
      swings: number;
      hits: number;
      mistakes: number;
      sawPrincess: boolean;
      sawKing: boolean;
      isFinalLevel: boolean;
      bossId?: BossId;
    };

function createEmptyStats(): GameplayAchievementStats {
  return {
    completedLevelsCount: 0,
    enemiesDefeated: 0,
    maxCombo: 0,
    bestAccuracyPct: 0,
    totalGoldEarned: 0,
    breakablesDestroyed: 0,
    tntMultiBlasts: 0,
    specialRewardsCollected: 0,
    defeatedBossIds: [],
    flawlessVictories: 0,
    princessProtectedCount: 0,
    kingProtectedCount: 0,
    comboHoldMaxSec: 0,
    maxSingleLevelScore: 0,
    gameCompleted: false,
  };
}

function createDefaultStore(): PersistedAchievementData {
  return {
    stats: createEmptyStats(),
    localCriteriaMetAt: {},
    remoteConfirmed: {},
    pendingSync: {},
    processedEventKeys: [],
  };
}

type SnapshotListener = (snapshot: AchievementManagerSnapshot) => void;
type ToastListener = (toast: AchievementToastPayload) => void;

class AchievementManager {
  private store: PersistedAchievementData;
  private connection: PlayGamesConnectionSnapshot = {
    state: 'INITIALIZING',
    isNativeAndroid: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
    player: null,
    statusMessage: 'Google Play Games Services v2 durumu kontrol ediliyor...',
    lastSyncedAt: null,
  };
  private isSyncing = false;
  private lastError: string | null = null;
  private listeners = new Set<SnapshotListener>();
  private toastListeners = new Set<ToastListener>();
  private toastSeq = 1;
  private initialized = false;
  private syncTimer: number | null = null;

  constructor() {
    this.store = this.loadStore();
  }

  private loadStore(): PersistedAchievementData {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) return createDefaultStore();
      const parsed = JSON.parse(raw) as Partial<PersistedAchievementData>;
      return {
        stats: {
          ...createEmptyStats(),
          ...(parsed.stats ?? {}),
          defeatedBossIds: Array.isArray(parsed.stats?.defeatedBossIds)
            ? Array.from(new Set(parsed.stats.defeatedBossIds))
            : [],
        },
        localCriteriaMetAt: parsed.localCriteriaMetAt ?? {},
        remoteConfirmed: parsed.remoteConfirmed ?? {},
        pendingSync: parsed.pendingSync ?? {},
        processedEventKeys: Array.isArray(parsed.processedEventKeys)
          ? parsed.processedEventKeys.slice(-MAX_PROCESSED_KEYS)
          : [],
      };
    } catch {
      return createDefaultStore();
    }
  }

  private persistStore(): void {
    try {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(this.store));
    } catch {
      // Depolama kotası veya gizli modda oyunu çökertme
    }
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onToast(listener: ToastListener): () => void {
    this.toastListeners.add(listener);
    return () => {
      this.toastListeners.delete(listener);
    };
  }

  private emitSnapshot(): void {
    const snap = this.getSnapshot();
    for (const l of this.listeners) {
      l(snap);
    }
  }

  private emitToast(def: AchievementDefinition, syncedToPlayGames: boolean): void {
    let statusLabel = 'Google Play Games’e kaydedildi';
    if (!syncedToPlayGames) {
      if (!this.connection.isNativeAndroid) {
        statusLabel = 'Yerel ilerleme · Android Play Games senkronu bekliyor';
      } else if (!isConfiguredGooglePlayId(def.googlePlayId)) {
        statusLabel = 'Yerel ilerleme · Console ID bekleniyor';
      } else if (!this.connection.isOnline) {
        statusLabel = 'Çevrimdışı · Bağlantı gelince senkronize edilecek';
      } else {
        statusLabel = 'Yerel ilerleme · Google Play girişi bekleniyor';
      }
    }

    const payload: AchievementToastPayload = {
      id: this.toastSeq++,
      key: def.key,
      name: def.name,
      description: def.description,
      iconPath: def.iconPath,
      points: def.points,
      tier: def.tier,
      syncedToPlayGames,
      statusLabel,
    };
    for (const l of this.toastListeners) {
      l(payload);
    }
  }

  /**
   * Uygulama açıldığında çağrılır:
   * - Mevcut kayıtlı bölüm sayısını (SaveData) senkronize eder
   * - Android üzerinde gerçek Google Play Games v2 otomatik doğrulamasını başlatır
   * - Online / visibility olaylarında bekleyen başarımları otomatik senkronize eder
   */
  public async initialize(completedLevelsCount: number): Promise<void> {
    if (completedLevelsCount > this.store.stats.completedLevelsCount) {
      this.store.stats.completedLevelsCount = completedLevelsCount;
      this.evaluateAllAchievements(false);
    }

    if (!this.initialized && typeof window !== 'undefined') {
      this.initialized = true;
      window.addEventListener('online', this.handleNetworkOnline);
      window.addEventListener('offline', this.handleNetworkOffline);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    await this.refreshPlayGamesConnection(false);
  }

  private handleNetworkOnline = (): void => {
    this.connection = { ...this.connection, isOnline: true };
    void this.refreshPlayGamesConnection(true);
  };

  private handleNetworkOffline = (): void => {
    this.connection = {
      ...this.connection,
      isOnline: false,
      state: this.connection.isNativeAndroid ? 'OFFLINE' : this.connection.state,
      statusMessage: this.connection.isNativeAndroid
        ? 'İnternet kesildi. İlerlemen güvenle saklanıyor; bağlantı dönünce senkronize edilecek.'
        : this.connection.statusMessage,
    };
    this.emitSnapshot();
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.connection.isNativeAndroid) {
      void this.refreshPlayGamesConnection(false);
    }
  };

  public async refreshPlayGamesConnection(forceReloadRemote = false): Promise<void> {
    this.lastError = null;
    const auth = await playGamesBridge.checkAuthentication();
    this.connection = auth;
    this.emitSnapshot();

    if (auth.state === 'AUTHENTICATED') {
      await this.syncWithPlayGamesServer(forceReloadRemote);
    }
  }

  public async signInToPlayGames(): Promise<PlayGamesConnectionSnapshot> {
    this.lastError = null;
    const auth = await playGamesBridge.signIn();
    this.connection = auth;
    this.emitSnapshot();

    if (auth.state === 'AUTHENTICATED') {
      await this.syncWithPlayGamesServer(true);
    }
    return this.connection;
  }

  public async openNativeAchievementsUi(): Promise<{ ok: boolean; message?: string }> {
    const res = await playGamesBridge.showNativeAchievementsUi();
    if (!res.success) {
      this.lastError =
        res.message || 'Google Play Games başarımlar ekranı şu anda açılamıyor.';
      this.emitSnapshot();
      return { ok: false, message: this.lastError };
    }
    // Kullanıcı resmi Play Games ekranından döndüğünde güncel sunucu verisini çek
    void this.syncWithPlayGamesServer(true);
    return { ok: true };
  }

  /**
   * Gerçek oyun olaylarını alır, çift işlemeyi engeller ve ilgili başarımları değerlendirir.
   */
  public recordEvent(event: GameplayAchievementEvent): void {
    // Tekil olay anahtarı varsa aynı olayın ikinci kez sayılmasını kesin olarak engelle
    if ('eventKey' in event && event.eventKey) {
      if (this.store.processedEventKeys.includes(event.eventKey)) {
        return;
      }
      this.store.processedEventKeys.push(event.eventKey);
      if (this.store.processedEventKeys.length > MAX_PROCESSED_KEYS) {
        this.store.processedEventKeys = this.store.processedEventKeys.slice(-MAX_PROCESSED_KEYS);
      }
    }

    const s = this.store.stats;
    switch (event.type) {
      case 'enemy_defeated':
        if (event.count > 0) s.enemiesDefeated += Math.floor(event.count);
        break;
      case 'breakable_destroyed':
        if (event.count > 0) s.breakablesDestroyed += Math.floor(event.count);
        break;
      case 'tnt_multi_blast':
        if (event.blastedCount >= 2) s.tntMultiBlasts += 1;
        break;
      case 'gold_earned':
        if (event.amount > 0) s.totalGoldEarned += Math.floor(event.amount);
        break;
      case 'special_reward':
        if (event.count > 0) s.specialRewardsCollected += Math.floor(event.count);
        break;
      case 'combo_updated':
        if (event.combo > s.maxCombo) s.maxCombo = event.combo;
        if (event.holdSeconds > s.comboHoldMaxSec) s.comboHoldMaxSec = event.holdSeconds;
        break;
      case 'boss_defeated':
        if (!s.defeatedBossIds.includes(event.bossId)) {
          s.defeatedBossIds = [...s.defeatedBossIds, event.bossId];
        }
        break;
      case 'level_completed': {
        const key = `level_completed:${event.runId}`;
        if (this.store.processedEventKeys.includes(key)) return;
        this.store.processedEventKeys.push(key);
        if (this.store.processedEventKeys.length > MAX_PROCESSED_KEYS) {
          this.store.processedEventKeys = this.store.processedEventKeys.slice(-MAX_PROCESSED_KEYS);
        }

        s.completedLevelsCount = Math.max(s.completedLevelsCount, event.completedLevelsCount);
        if (event.levelScore > s.maxSingleLevelScore) {
          s.maxSingleLevelScore = event.levelScore;
        }
        if (event.swings >= 10) {
          const pct = Math.round((event.hits / Math.max(1, event.swings)) * 100);
          if (pct > s.bestAccuracyPct) s.bestAccuracyPct = pct;
        }
        if (event.mistakes === 0) {
          s.flawlessVictories += 1;
        }
        if (event.sawPrincess) {
          s.princessProtectedCount += 1;
        }
        if (event.sawKing) {
          s.kingProtectedCount += 1;
        }
        if (event.bossId && !s.defeatedBossIds.includes(event.bossId)) {
          s.defeatedBossIds = [...s.defeatedBossIds, event.bossId];
        }
        if (event.isFinalLevel || event.levelId >= 60) {
          s.gameCompleted = true;
        }
        break;
      }
    }

    this.evaluateAllAchievements(true);
  }

  private getLocalProgressForKey(key: AchievementKey): number {
    const s = this.store.stats;
    switch (key) {
      // Bölüm Başarımları
      case 'ach_level_1':
        return s.completedLevelsCount >= 1 ? 1 : 0;
      case 'ach_level_5':
        return Math.min(5, s.completedLevelsCount);
      case 'ach_level_10':
        return Math.min(10, s.completedLevelsCount);
      case 'ach_level_20':
        return Math.min(20, s.completedLevelsCount);
      case 'ach_level_30':
        return Math.min(30, s.completedLevelsCount);
      case 'ach_level_40':
        return Math.min(40, s.completedLevelsCount);
      case 'ach_level_50':
        return Math.min(50, s.completedLevelsCount);
      case 'ach_level_60':
        return Math.min(60, s.completedLevelsCount);

      // Savaş Başarımları
      case 'ach_enemy_1':
        return s.enemiesDefeated >= 1 ? 1 : 0;
      case 'ach_enemy_100':
        return Math.min(100, s.enemiesDefeated);
      case 'ach_enemy_1000':
        return Math.min(1000, s.enemiesDefeated);
      case 'ach_enemy_5000':
        return Math.min(5000, s.enemiesDefeated);
      case 'ach_combo_10':
        return s.maxCombo >= 10 ? 1 : 0;
      case 'ach_combo_25':
        return s.maxCombo >= 25 ? 1 : 0;
      case 'ach_accuracy_master':
        return s.bestAccuracyPct >= 90 ? 1 : 0;

      // Ekonomi Başarımları
      case 'ach_gold_1':
        return s.totalGoldEarned >= 1 ? 1 : 0;
      case 'ach_gold_100':
        return Math.min(100, s.totalGoldEarned);
      case 'ach_gold_1000':
        return Math.min(1000, s.totalGoldEarned);
      case 'ach_gold_10000':
        return Math.min(10000, s.totalGoldEarned);
      case 'ach_breakable_100':
        return Math.min(100, s.breakablesDestroyed);

      // Özel Başarımlar
      case 'ach_tnt_master':
        return s.tntMultiBlasts >= 1 ? 1 : 0;
      case 'ach_special_rewards_50':
        return Math.min(50, s.specialRewardsCollected);
      case 'ach_boss_1':
        return s.defeatedBossIds.length >= 1 ? 1 : 0;
      case 'ach_boss_6':
        return Math.min(6, s.defeatedBossIds.length);
      case 'ach_flawless_victory':
        return s.flawlessVictories >= 1 ? 1 : 0;
      case 'ach_princess_guard':
        return s.princessProtectedCount >= 1 ? 1 : 0;
      case 'ach_royal_guard':
        return s.kingProtectedCount >= 1 ? 1 : 0;
      case 'ach_patient_knight':
        return s.comboHoldMaxSec >= 15 ? 1 : 0;
      case 'ach_big_hunt':
        return s.maxSingleLevelScore >= 10000 ? 1 : 0;
      case 'ach_true_legend':
        return s.gameCompleted ? 1 : 0;
    }
  }

  private evaluateAllAchievements(allowToasts: boolean): void {
    const newlyCompleted: AchievementDefinition[] = [];
    let needsRemoteFlush = false;

    for (const def of ACHIEVEMENTS_CATALOG) {
      const localSteps = this.getLocalProgressForKey(def.key);
      const remote = this.store.remoteConfirmed[def.key];
      const metNow = localSteps >= def.targetSteps;

      if (metNow && !this.store.localCriteriaMetAt[def.key]) {
        this.store.localCriteriaMetAt[def.key] = Date.now();
        if (allowToasts && !remote?.unlocked) {
          newlyCompleted.push(def);
        }
      }

      // Google Play sunucusu henüz bu adımı/açılışı onaylamadıysa idempotent senkron kuyruğuna yaz
      if (def.type === 'STANDARD') {
        if (metNow && !remote?.unlocked) {
          this.store.pendingSync[def.key] = {
            key: def.key,
            type: 'STANDARD',
            steps: 1,
            queuedAt: Date.now(),
          };
          needsRemoteFlush = true;
        }
      } else {
        const confirmedSteps = remote?.currentSteps ?? 0;
        const alreadyUnlocked = Boolean(remote?.unlocked);
        if (!alreadyUnlocked && localSteps > confirmedSteps && localSteps > 0) {
          const prevQueued = this.store.pendingSync[def.key]?.steps ?? 0;
          if (localSteps > prevQueued) {
            this.store.pendingSync[def.key] = {
              key: def.key,
              type: 'INCREMENTAL',
              steps: Math.min(def.targetSteps, localSteps),
              queuedAt: Date.now(),
            };
            needsRemoteFlush = true;
          }
        }
      }
    }

    this.persistStore();
    this.emitSnapshot();

    // Yeni kazanılan başarımları hemen Play Games sunucusuna göndermeyi dene; sonra bildirim göster
    if (newlyCompleted.length > 0) {
      void this.handleNewlyCompleted(newlyCompleted);
    } else if (needsRemoteFlush && this.connection.state === 'AUTHENTICATED') {
      this.scheduleDebouncedSync();
    }
  }

  private async handleNewlyCompleted(defs: AchievementDefinition[]): Promise<void> {
    if (this.connection.state === 'AUTHENTICATED' && this.connection.isOnline) {
      await this.flushPendingSyncQueue();
    }
    for (const def of defs) {
      const confirmed = Boolean(this.store.remoteConfirmed[def.key]?.unlocked);
      this.emitToast(def, confirmed);
    }
  }

  private scheduleDebouncedSync(): void {
    if (this.syncTimer !== null) return;
    this.syncTimer = window.setTimeout(() => {
      this.syncTimer = null;
      void this.flushPendingSyncQueue();
    }, 900);
  }

  /**
   * 1) Google Play sunucusundan mevcut gerçek başarım durumlarını çeker
   * 2) Bekleyen çevrimdışı/yerel ilerlemeleri idempotent olarak Play Games'e gönderir
   */
  public async syncWithPlayGamesServer(forceReload = false): Promise<void> {
    if (this.isSyncing) return;
    if (this.connection.state !== 'AUTHENTICATED' || !this.connection.isOnline) return;

    this.isSyncing = true;
    this.lastError = null;
    this.emitSnapshot();

    try {
      const remoteRes = await playGamesBridge.loadRemoteAchievements(forceReload);
      if (remoteRes.success) {
        this.mergeRemoteAchievements(remoteRes.achievements);
      } else if (remoteRes.statusCode === 'OFFLINE') {
        this.connection = { ...this.connection, state: 'OFFLINE', isOnline: false };
      } else if (remoteRes.message) {
        this.lastError = remoteRes.message;
      }

      await this.flushPendingSyncQueue();
      this.connection = { ...this.connection, lastSyncedAt: Date.now() };
    } finally {
      this.isSyncing = false;
      this.persistStore();
      this.emitSnapshot();
    }
  }

  private mergeRemoteAchievements(remoteList: RemotePlayAchievement[]): void {
    const idToDef = new Map<string, AchievementDefinition>();
    for (const def of ACHIEVEMENTS_CATALOG) {
      if (isConfiguredGooglePlayId(def.googlePlayId)) {
        idToDef.set(def.googlePlayId, def);
      }
    }

    const now = Date.now();
    for (const r of remoteList) {
      const def = idToDef.get(r.id);
      if (!def) continue;
      const unlocked = r.state === 'UNLOCKED';
      this.store.remoteConfirmed[def.key] = {
        unlocked,
        currentSteps: unlocked ? def.targetSteps : Math.max(0, r.currentSteps),
        totalSteps: r.totalSteps || def.targetSteps,
        lastSyncedAt: now,
      };
      // Sunucu zaten açtıysa bekleyen kuyruktan temizle
      if (unlocked) {
        delete this.store.pendingSync[def.key];
      } else {
        const pending = this.store.pendingSync[def.key];
        if (pending && pending.steps <= r.currentSteps) {
          delete this.store.pendingSync[def.key];
        }
      }
    }
  }

  private async flushPendingSyncQueue(): Promise<void> {
    if (this.connection.state !== 'AUTHENTICATED' || !this.connection.isOnline) return;

    const entries = Object.values(this.store.pendingSync).filter(
      (e): e is PendingSyncEntry => Boolean(e),
    );
    if (entries.length === 0) return;

    for (const entry of entries) {
      const def = ACHIEVEMENT_BY_KEY[entry.key];
      if (!def) continue;

      // Daha önce Play Games üzerinde açıldıysa tekrar gönderme
      if (this.store.remoteConfirmed[entry.key]?.unlocked) {
        delete this.store.pendingSync[entry.key];
        continue;
      }

      if (entry.type === 'STANDARD') {
        const res = await playGamesBridge.unlockAchievement(def.googlePlayId, def.key);
        if (res.success || res.alreadyUnlocked) {
          this.store.remoteConfirmed[entry.key] = {
            unlocked: true,
            currentSteps: 1,
            totalSteps: 1,
            lastSyncedAt: Date.now(),
          };
          delete this.store.pendingSync[entry.key];
        } else if (res.statusCode === 'OFFLINE') {
          this.connection = { ...this.connection, state: 'OFFLINE', isOnline: false };
          break;
        } else if (res.statusCode !== 'MISSING_CONSOLE_ID') {
          this.lastError = res.message || 'Google Play senkronizasyon hatası.';
        }
      } else {
        const clampedSteps = Math.max(1, Math.min(def.targetSteps, entry.steps));
        const res = await playGamesBridge.setStepsAchievement(
          def.googlePlayId,
          def.key,
          clampedSteps,
        );
        if (res.success || res.alreadyUnlocked) {
          const unlocked = Boolean(res.unlocked || res.alreadyUnlocked || clampedSteps >= def.targetSteps);
          this.store.remoteConfirmed[entry.key] = {
            unlocked,
            currentSteps: unlocked ? def.targetSteps : clampedSteps,
            totalSteps: def.targetSteps,
            lastSyncedAt: Date.now(),
          };
          delete this.store.pendingSync[entry.key];
        } else if (res.statusCode === 'OFFLINE') {
          this.connection = { ...this.connection, state: 'OFFLINE', isOnline: false };
          break;
        } else if (res.statusCode !== 'MISSING_CONSOLE_ID') {
          this.lastError = res.message || 'Google Play artımlı ilerleme gönderilemedi.';
        }
      }
    }

    this.persistStore();
    this.emitSnapshot();
  }

  public getSnapshot(): AchievementManagerSnapshot {
    let playGamesUnlockedCount = 0;
    let localCriteriaMetCount = 0;

    const items: AchievementViewItem[] = ACHIEVEMENTS_CATALOG.map((def) => {
      const localSteps = this.getLocalProgressForKey(def.key);
      const remote = this.store.remoteConfirmed[def.key];
      const remoteSteps = remote ? remote.currentSteps : null;
      const playGamesUnlocked = Boolean(remote?.unlocked);
      const localCriteriaMet = Boolean(this.store.localCriteriaMetAt[def.key]) || localSteps >= def.targetSteps;
      const displaySteps = Math.min(
        def.targetSteps,
        Math.max(localSteps, remoteSteps ?? 0),
      );
      const percent = Math.min(100, Math.round((displaySteps / Math.max(1, def.targetSteps)) * 100));
      const consoleIdConfigured = isConfiguredGooglePlayId(def.googlePlayId);

      if (playGamesUnlocked) playGamesUnlockedCount++;
      if (localCriteriaMet) localCriteriaMetCount++;

      let syncState: AchievementSyncState = 'LOCKED';
      if (playGamesUnlocked) {
        syncState = 'PLAY_GAMES_UNLOCKED';
      } else if (localCriteriaMet || localSteps > 0) {
        if (!this.connection.isNativeAndroid) {
          syncState = 'LOCAL_ONLY_WEB';
        } else if (!consoleIdConfigured) {
          syncState = 'MISSING_CONSOLE_ID';
        } else if (!this.connection.isOnline) {
          syncState = 'LOCAL_ONLY_OFFLINE';
        } else if (this.connection.state !== 'AUTHENTICATED') {
          syncState = 'LOCAL_ONLY_NOT_SIGNED_IN';
        } else if (this.store.pendingSync[def.key]) {
          syncState = 'PENDING_SYNC';
        }
      }

      return {
        def,
        localSteps,
        remoteSteps,
        displaySteps,
        percent,
        localCriteriaMet,
        playGamesUnlocked,
        syncState,
        consoleIdConfigured,
        unlockedAt: this.store.localCriteriaMetAt[def.key] ?? remote?.lastSyncedAt ?? null,
      };
    });

    return {
      connection: this.connection,
      items,
      playGamesUnlockedCount,
      localCriteriaMetCount,
      totalCount: ACHIEVEMENTS_CATALOG.length,
      pendingSyncCount: Object.keys(this.store.pendingSync).length,
      isSyncing: this.isSyncing,
      lastError: this.lastError,
    };
  }
}

export const achievementManager = new AchievementManager();
