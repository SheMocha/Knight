import { GameScreen } from '../types';
import {
  ACTIVE_AD_ENVIRONMENT,
  AD_FREQUENCY_CONFIG,
  AD_PRIVACY_CONFIG,
  getActiveAdUnitIds,
  RewardedPlacement,
} from './adConfig';
import { AdFreeManager, adFreeManager } from './adFreeManager';
import { AdMobBridgeAdapter, adMobBridge, ConsentStatus } from './adMobBridge';
import { PurchaseManager, purchaseManager } from './purchaseManager';

interface PersistedAdState {
  totalCompletedLevelsForAds: number;
  completedSinceLastInterstitial: number;
  lastInterstitialShownAt: number;
  rewardedDateKey: string;
  rewardedCountToday: number;
  dailyBonusClaimedDateKey: string;
  lastRewardedShownAt: number;
  claimedGrantTokens: string[];
}

export interface AdManagerSnapshot {
  environment: 'test' | 'production';
  isNativeAndroid: boolean;
  isOnline: boolean;
  sdkInitialized: boolean;
  consentChecked: boolean;
  canRequestAds: boolean;
  consentStatus: ConsentStatus;
  privacyOptionsRequired: boolean;
  nonPersonalizedOnly: boolean;
  isAdFree: boolean;
  billingConnected: boolean;
  bannerVisible: boolean;
  bannerHeightPx: number;
  interstitialReady: boolean;
  rewardedReady: boolean;
  rewardedLoading: boolean;
  rewardedRemainingToday: number;
  rewardedDailyLimit: number;
  dailyBonusClaimedToday: boolean;
  isShowingFullScreenAd: boolean;
  lastStatusMessage: string | null;
}

export interface RewardedAdOutcome {
  shown: boolean;
  rewarded: boolean;
  goldAmount: number;
  placement: RewardedPlacement;
  grantToken: string | null;
  statusCode: string;
  message: string;
}

export interface InterstitialOutcome {
  shown: boolean;
  statusCode: string;
}

type AdSnapshotListener = (snapshot: AdManagerSnapshot) => void;
type FullScreenAdAudioCallback = (isAdOpen: boolean) => void;

const AD_STATE_STORAGE_KEY = 'black_knight_ad_manager_state_v1';

function getTodayDateKey(nowMs: number): string {
  const d = new Date(nowMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function createDefaultPersistedState(nowMs: number): PersistedAdState {
  return {
    totalCompletedLevelsForAds: 0,
    completedSinceLastInterstitial: 0,
    lastInterstitialShownAt: 0,
    rewardedDateKey: getTodayDateKey(nowMs),
    rewardedCountToday: 0,
    dailyBonusClaimedDateKey: '',
    lastRewardedShownAt: 0,
    claimedGrantTokens: [],
  };
}

/**
 * MERKEZİ REKLAM YÖNETİCİSİ (AdManager)
 * =====================================
 * - Tüm banner, interstitial ve rewarded kararlarını tek merkezden yönetir.
 * - Her reklam çağrısından ÖNCE `AdFreeManager` kontrolünü çalıştırır.
 * - SDK'yı uygulama ömründe yalnızca 1 kez (UMP gizlilik kontrolünden sonra) başlatır.
 * - İnternet yokken veya reklam yüklenemediğinde oyunu ASLA dondurmaz/kilitlemez.
 * - Ödüllü reklamlarda ödülü YALNIZCA gerçek AdMob `OnUserEarnedRewardListener`
 *   tetiklendiğinde ve daha önce işlenmemiş benzersiz `grantToken` ile verir.
 */
export class AdManager {
  private readonly bridge: AdMobBridgeAdapter;
  private readonly adFree: AdFreeManager;
  private readonly purchases: PurchaseManager;
  private readonly nowFn: () => number;
  private readonly storageKey: string;

  private state: PersistedAdState;
  private claimedTokens = new Set<string>();

  private initialized = false;
  private initializingPromise: Promise<void> | null = null;
  private consentChecked = false;
  private canRequestAds = false;
  private consentStatus: ConsentStatus = 'UNKNOWN';
  private privacyOptionsRequired = false;
  private nonPersonalizedOnly = true;

  private currentScreen: GameScreen = 'TITLE';
  private bannerVisible = false;
  private bannerHeightPx = 0;

  private interstitialReady = false;
  private interstitialLoading = false;
  private interstitialRetryIndex = 0;
  private interstitialRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private rewardedReady = false;
  private rewardedLoading = false;
  private rewardedRetryIndex = 0;
  private rewardedRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private isShowingFullScreenAd = false;
  private lastStatusMessage: string | null = null;

  private listeners = new Set<AdSnapshotListener>();
  private audioDuckCallback: FullScreenAdAudioCallback | null = null;
  private nativeListenersBound = false;
  private networkListenersBound = false;

  constructor(deps?: {
    bridge?: AdMobBridgeAdapter;
    adFree?: AdFreeManager;
    purchases?: PurchaseManager;
    nowFn?: () => number;
    storageKey?: string;
  }) {
    this.bridge = deps?.bridge ?? adMobBridge;
    this.adFree = deps?.adFree ?? adFreeManager;
    this.purchases = deps?.purchases ?? purchaseManager;
    this.nowFn = deps?.nowFn ?? (() => Date.now());
    this.storageKey = deps?.storageKey ?? AD_STATE_STORAGE_KEY;

    this.state = this.loadState();
    for (const token of this.state.claimedGrantTokens) {
      this.claimedTokens.add(token);
    }

    // Reklam kaldırma hakkı değiştiğinde (örn. ileride Play Billing satın alımı) anında tepki ver
    this.adFree.subscribe(() => {
      if (!this.adFree.shouldShowBanner() && this.bannerVisible) {
        void this.removeBannerInternal();
      }
      if (!this.adFree.shouldShowInterstitial()) {
        this.clearInterstitialRetry();
      }
      this.emit();
    });
  }

  private loadState(): PersistedAdState {
    const fallback = createDefaultPersistedState(this.nowFn());
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<PersistedAdState>;
      const merged: PersistedAdState = {
        totalCompletedLevelsForAds: Math.max(0, Math.floor(Number(parsed.totalCompletedLevelsForAds) || 0)),
        completedSinceLastInterstitial: Math.max(
          0,
          Math.floor(Number(parsed.completedSinceLastInterstitial) || 0),
        ),
        lastInterstitialShownAt: Math.max(0, Number(parsed.lastInterstitialShownAt) || 0),
        rewardedDateKey:
          typeof parsed.rewardedDateKey === 'string' && parsed.rewardedDateKey.length > 0
            ? parsed.rewardedDateKey
            : fallback.rewardedDateKey,
        rewardedCountToday: Math.max(0, Math.floor(Number(parsed.rewardedCountToday) || 0)),
        dailyBonusClaimedDateKey:
          typeof parsed.dailyBonusClaimedDateKey === 'string' ? parsed.dailyBonusClaimedDateKey : '',
        lastRewardedShownAt: Math.max(0, Number(parsed.lastRewardedShownAt) || 0),
        claimedGrantTokens: Array.isArray(parsed.claimedGrantTokens)
          ? parsed.claimedGrantTokens.filter((t): t is string => typeof t === 'string').slice(-60)
          : [],
      };
      this.rolloverDailyCountersIfNeeded(merged);
      return merged;
    } catch {
      return fallback;
    }
  }

  private rolloverDailyCountersIfNeeded(target: PersistedAdState = this.state): void {
    const today = getTodayDateKey(this.nowFn());
    if (target.rewardedDateKey !== today) {
      target.rewardedDateKey = today;
      target.rewardedCountToday = 0;
    }
  }

  private persistState(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      this.state.claimedGrantTokens = Array.from(this.claimedTokens).slice(-60);
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch {
      // Depolama hatalarını yok say
    }
  }

  private emit(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  public setAudioDuckCallback(cb: FullScreenAdAudioCallback | null): void {
    this.audioDuckCallback = cb;
  }

  public subscribe(listener: AdSnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): AdManagerSnapshot {
    this.rolloverDailyCountersIfNeeded();
    const today = getTodayDateKey(this.nowFn());
    const remaining = Math.max(
      0,
      AD_FREQUENCY_CONFIG.rewardedDailyLimit - this.state.rewardedCountToday,
    );
    return {
      environment: ACTIVE_AD_ENVIRONMENT,
      isNativeAndroid: this.bridge.isNativeAndroidReady(),
      isOnline: this.bridge.isOnline(),
      sdkInitialized: this.initialized,
      consentChecked: this.consentChecked,
      canRequestAds: this.canRequestAds,
      consentStatus: this.consentStatus,
      privacyOptionsRequired: this.privacyOptionsRequired,
      nonPersonalizedOnly: this.nonPersonalizedOnly,
      isAdFree: this.adFree.isAdFree(),
      billingConnected: this.purchases.isBillingConnected(),
      bannerVisible: this.bannerVisible,
      bannerHeightPx: this.bannerVisible ? this.bannerHeightPx : 0,
      interstitialReady: this.interstitialReady,
      rewardedReady: this.rewardedReady,
      rewardedLoading: this.rewardedLoading,
      rewardedRemainingToday: remaining,
      rewardedDailyLimit: AD_FREQUENCY_CONFIG.rewardedDailyLimit,
      dailyBonusClaimedToday: this.state.dailyBonusClaimedDateKey === today,
      isShowingFullScreenAd: this.isShowingFullScreenAd,
      lastStatusMessage: this.lastStatusMessage,
    };
  }

  /**
   * Uygulama açılışında bir kez çağrılır:
   * 1) İleride bağlıysa Play Billing haklarını senkronize eder.
   * 2) Google UMP gizlilik onayını alır.
   * 3) İzin uygunsa Google Mobile Ads SDK'sını bir kez başlatır ve reklamları önceden yükler.
   */
  public async initialize(initialScreen: GameScreen = 'TITLE'): Promise<void> {
    this.currentScreen = initialScreen;
    if (this.initialized) {
      await this.syncBannerForScreen(this.currentScreen);
      return;
    }
    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.bindNetworkListeners();

    this.initializingPromise = (async () => {
      try {
        await this.purchases.initializeAndSyncEntitlements();

        if (!this.bridge.isNativeAndroidReady()) {
          this.consentChecked = true;
          this.canRequestAds = false;
          this.lastStatusMessage =
            'Web önizleme modundasınız. Gerçek Google AdMob reklamları yalnızca Android uygulamasında gösterilir.';
          this.emit();
          return;
        }

        await this.bindNativeListeners();

        // Adım 1: Google UMP gizlilik / izin kontrolü (EEA, UK, CH, TR)
        const consentRes = await this.bridge.requestConsentInfo({
          tagForUnderAgeOfConsent: AD_PRIVACY_CONFIG.tagForUnderAgeOfConsent,
          debugGeography: AD_PRIVACY_CONFIG.debugGeography,
          testDeviceHashedIds: [...AD_PRIVACY_CONFIG.testDeviceHashedIds],
        });

        this.consentChecked = true;
        this.canRequestAds = consentRes.canRequestAds;
        this.consentStatus = consentRes.consentStatus;
        this.privacyOptionsRequired = consentRes.privacyOptionsRequired;
        this.nonPersonalizedOnly = consentRes.nonPersonalizedOnly;

        if (!consentRes.canRequestAds) {
          this.lastStatusMessage =
            consentRes.message || 'Gizlilik onayı olmadan reklam talebi gönderilmiyor.';
          this.emit();
          return;
        }

        // Adım 2: Google Mobile Ads SDK tek seferlik başlatma
        const initRes = await this.bridge.initializeAds({
          maxAdContentRating: AD_PRIVACY_CONFIG.maxAdContentRating,
          testDeviceHashedIds: [...AD_PRIVACY_CONFIG.testDeviceHashedIds],
        });

        this.initialized = initRes.initialized;
        if (!initRes.initialized) {
          this.lastStatusMessage = initRes.message || 'AdMob SDK başlatılamadı.';
          this.emit();
          return;
        }

        this.lastStatusMessage = null;
        this.emit();

        // Adım 3: Gerektiği kadar önceden yükleme
        if (this.adFree.shouldShowInterstitial()) {
          void this.preloadInterstitial();
        }
        if (this.adFree.shouldAllowRewarded()) {
          void this.preloadRewarded();
        }
        await this.syncBannerForScreen(this.currentScreen);
      } catch (err) {
        this.lastStatusMessage =
          err instanceof Error ? err.message : 'Reklam servisi başlatılamadı.';
        this.emit();
      } finally {
        this.initializingPromise = null;
      }
    })();

    return this.initializingPromise;
  }

  private bindNetworkListeners(): void {
    if (this.networkListenersBound || typeof window === 'undefined') return;
    this.networkListenersBound = true;

    window.addEventListener('online', () => {
      this.emit();
      if (!this.bridge.isNativeAndroidReady()) return;
      if (!this.initialized) {
        void this.initialize(this.currentScreen);
        return;
      }
      if (this.adFree.shouldShowInterstitial() && !this.interstitialReady) {
        this.interstitialRetryIndex = 0;
        void this.preloadInterstitial();
      }
      if (this.adFree.shouldAllowRewarded() && !this.rewardedReady) {
        this.rewardedRetryIndex = 0;
        void this.preloadRewarded();
      }
      void this.syncBannerForScreen(this.currentScreen);
    });

    window.addEventListener('offline', () => {
      this.emit();
    });
  }

  private async bindNativeListeners(): Promise<void> {
    if (this.nativeListenersBound) return;
    this.nativeListenersBound = true;

    await this.bridge.addListener('bannerLoaded', (data) => {
      const h = Number(data.heightPx) || 0;
      if (this.bannerVisible) {
        this.bannerHeightPx = h;
        this.emit();
      }
    });

    await this.bridge.addListener('bannerFailedToLoad', () => {
      this.bannerVisible = false;
      this.bannerHeightPx = 0;
      this.emit();
    });

    await this.bridge.addListener('interstitialOpened', () => {
      this.isShowingFullScreenAd = true;
      this.interstitialReady = false;
      this.audioDuckCallback?.(true);
      this.emit();
    });

    await this.bridge.addListener('interstitialClosed', () => {
      this.isShowingFullScreenAd = false;
      this.audioDuckCallback?.(false);
      this.emit();
    });

    await this.bridge.addListener('rewardedOpened', () => {
      this.isShowingFullScreenAd = true;
      this.rewardedReady = false;
      this.audioDuckCallback?.(true);
      this.emit();
    });

    await this.bridge.addListener('rewardedClosed', () => {
      this.isShowingFullScreenAd = false;
      this.audioDuckCallback?.(false);
      this.emit();
    });
  }

  /**
   * Kullanıcı istediği zaman gizlilik ve reklam tercihlerini güncelleyebilir (UMP).
   */
  public async openPrivacyOptions(): Promise<{ success: boolean; message: string }> {
    const res = await this.bridge.showPrivacyOptionsForm();
    if (res.statusCode === 'UNSUPPORTED_WEB') {
      return {
        success: false,
        message:
          res.message ||
          'Gizlilik tercihleri ekranı (Google UMP) yalnızca Android uygulamasında açılır.',
      };
    }

    this.canRequestAds = res.canRequestAds;
    this.consentStatus = res.consentStatus;
    this.privacyOptionsRequired = res.privacyOptionsRequired;
    this.nonPersonalizedOnly = res.nonPersonalizedOnly;

    if (!this.canRequestAds && this.bannerVisible) {
      await this.removeBannerInternal();
    } else if (this.canRequestAds && !this.initialized) {
      await this.initialize(this.currentScreen);
    }

    this.emit();
    return {
      success: res.success,
      message: res.success
        ? 'Gizlilik ve reklam tercihleriniz güncellendi.'
        : res.message || 'Gizlilik formu şu an kullanılamıyor.',
    };
  }

  /**
   * Ekran değişimlerinde Banner görünürlüğünü merkezi olarak yönetir.
   * Oyun içi (`PLAYING`, `TUTORIAL`, `PAUSED`) ve sonuç ekranlarında banner ASLA gösterilmez.
   */
  public async syncBannerForScreen(screen: GameScreen): Promise<void> {
    this.currentScreen = screen;
    const screenAllowsBanner = AD_FREQUENCY_CONFIG.bannerEnabledScreens.includes(screen);

    // 1) AdFreeManager kontrolü HER ZAMAN ilk sırada!
    if (
      !screenAllowsBanner ||
      !this.adFree.shouldShowBanner() ||
      !this.initialized ||
      !this.canRequestAds ||
      !this.bridge.isOnline()
    ) {
      if (this.bannerVisible) {
        await this.hideBannerInternal();
      }
      return;
    }

    if (this.bannerVisible) {
      return;
    }

    const ids = getActiveAdUnitIds();
    const res = await this.bridge.showBanner(ids.banner);
    if (res.shown) {
      this.bannerVisible = true;
      this.bannerHeightPx = res.heightPx ?? this.bannerHeightPx;
    } else {
      this.bannerVisible = false;
      this.bannerHeightPx = 0;
    }
    this.emit();
  }

  private async hideBannerInternal(): Promise<void> {
    this.bannerVisible = false;
    this.bannerHeightPx = 0;
    await this.bridge.hideBanner();
    this.emit();
  }

  private async removeBannerInternal(): Promise<void> {
    this.bannerVisible = false;
    this.bannerHeightPx = 0;
    await this.bridge.removeBanner();
    this.emit();
  }

  /**
   * Bir bölüm başarıyla tamamlandığında çağrılır (oyun akışını asla bölmez).
   */
  public recordLevelCompleted(_levelId: number): void {
    this.state.totalCompletedLevelsForAds += 1;
    this.state.completedSinceLastInterstitial += 1;
    this.persistState();

    // Sonraki geçişte ihtiyaç olabilecek geçiş reklamını arka planda hazırla
    if (
      this.initialized &&
      this.canRequestAds &&
      this.adFree.shouldShowInterstitial() &&
      !this.interstitialReady &&
      !this.interstitialLoading &&
      this.bridge.isOnline()
    ) {
      void this.preloadInterstitial();
    }
  }

  /**
   * Geçiş reklamının şu an gösterilmeye uygun olup olmadığını tüm kurallarla değerlendirir.
   */
  public canShowInterstitialNow(): { eligible: boolean; reason: string } {
    // 1) AdFreeManager kontrolü en önce!
    if (!this.adFree.shouldShowInterstitial()) {
      return { eligible: false, reason: 'AD_FREE_ENTITLEMENT' };
    }
    if (!this.bridge.isNativeAndroidReady()) {
      return { eligible: false, reason: 'UNSUPPORTED_WEB' };
    }
    if (!this.initialized || !this.canRequestAds) {
      return { eligible: false, reason: 'SDK_OR_CONSENT_NOT_READY' };
    }
    if (!this.bridge.isOnline()) {
      return { eligible: false, reason: 'OFFLINE' };
    }
    if (this.isShowingFullScreenAd) {
      return { eligible: false, reason: 'AD_ALREADY_SHOWING' };
    }
    if (
      this.state.totalCompletedLevelsForAds <
      AD_FREQUENCY_CONFIG.interstitialMinCompletedLevelsForFirstAd
    ) {
      return { eligible: false, reason: 'MIN_PROGRESS_NOT_REACHED' };
    }
    if (
      this.state.completedSinceLastInterstitial <
      AD_FREQUENCY_CONFIG.interstitialEveryCompletedLevels
    ) {
      return { eligible: false, reason: 'FREQUENCY_NOT_REACHED' };
    }
    const elapsedSec = (this.nowFn() - this.state.lastInterstitialShownAt) / 1000;
    if (
      this.state.lastInterstitialShownAt > 0 &&
      elapsedSec < AD_FREQUENCY_CONFIG.interstitialMinCooldownSec
    ) {
      return { eligible: false, reason: 'COOLDOWN_ACTIVE' };
    }
    if (!this.interstitialReady) {
      return { eligible: false, reason: 'NOT_PRELOADED' };
    }
    return { eligible: true, reason: 'READY' };
  }

  /**
   * Oyuncu sonuç ekranını gördükten sonra "SONRAKİ BÖLÜM" butonuna bastığında çağrılır.
   * Reklam hazır değilse, uygun değilse veya internet yoksa BEKLEMEZ — oyun anında devam eder.
   */
  public async maybeShowInterstitialBeforeNextLevel(): Promise<InterstitialOutcome> {
    const check = this.canShowInterstitialNow();
    if (!check.eligible) {
      if (
        check.reason === 'NOT_PRELOADED' &&
        this.adFree.shouldShowInterstitial() &&
        this.initialized &&
        this.canRequestAds &&
        this.bridge.isOnline()
      ) {
        void this.preloadInterstitial();
      }
      return { shown: false, statusCode: check.reason };
    }

    this.isShowingFullScreenAd = true;
    this.audioDuckCallback?.(true);
    this.emit();

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    try {
      const showPromise = this.bridge.showInterstitial();
      const timeoutPromise = new Promise<InterstitialOutcome>((resolve) => {
        timeoutHandle = setTimeout(() => {
          resolve({ shown: false, statusCode: 'TIMEOUT' });
        }, AD_FREQUENCY_CONFIG.interstitialShowTimeoutMs);
      });

      const res = await Promise.race([showPromise, timeoutPromise]);
      this.interstitialReady = false;

      if (res.shown) {
        this.state.completedSinceLastInterstitial = 0;
        this.state.lastInterstitialShownAt = this.nowFn();
        this.persistState();
      }

      // Arka planda bir sonraki geçiş reklamını yükle
      if (this.adFree.shouldShowInterstitial() && this.bridge.isOnline()) {
        this.interstitialRetryIndex = 0;
        void this.preloadInterstitial();
      }

      return { shown: res.shown, statusCode: res.statusCode };
    } catch {
      this.interstitialReady = false;
      return { shown: false, statusCode: 'SHOW_EXCEPTION' };
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.isShowingFullScreenAd = false;
      this.audioDuckCallback?.(false);
      this.emit();
    }
  }

  public async preloadInterstitial(): Promise<boolean> {
    if (
      !this.adFree.shouldShowInterstitial() ||
      !this.bridge.isNativeAndroidReady() ||
      !this.initialized ||
      !this.canRequestAds ||
      !this.bridge.isOnline()
    ) {
      return false;
    }
    if (this.interstitialReady) return true;
    if (this.interstitialLoading) return false;

    this.clearInterstitialRetry();
    this.interstitialLoading = true;
    this.emit();

    const ids = getActiveAdUnitIds();
    const res = await this.bridge.loadInterstitial(ids.interstitial);
    this.interstitialLoading = false;

    if (res.loaded) {
      this.interstitialReady = true;
      this.interstitialRetryIndex = 0;
      this.emit();
      return true;
    }

    this.interstitialReady = false;
    this.scheduleInterstitialRetry();
    this.emit();
    return false;
  }

  private scheduleInterstitialRetry(): void {
    if (this.interstitialRetryIndex >= AD_FREQUENCY_CONFIG.retryBackoffMs.length) {
      return;
    }
    const delay = AD_FREQUENCY_CONFIG.retryBackoffMs[this.interstitialRetryIndex++];
    this.clearInterstitialRetry();
    this.interstitialRetryTimer = setTimeout(() => {
      this.interstitialRetryTimer = null;
      void this.preloadInterstitial();
    }, delay);
  }

  private clearInterstitialRetry(): void {
    if (this.interstitialRetryTimer) {
      clearTimeout(this.interstitialRetryTimer);
      this.interstitialRetryTimer = null;
    }
  }

  public async preloadRewarded(): Promise<boolean> {
    if (
      !this.adFree.shouldAllowRewarded() ||
      !this.bridge.isNativeAndroidReady() ||
      !this.initialized ||
      !this.canRequestAds ||
      !this.bridge.isOnline()
    ) {
      return false;
    }
    if (this.rewardedReady) return true;
    if (this.rewardedLoading) return false;

    this.clearRewardedRetry();
    this.rewardedLoading = true;
    this.emit();

    const ids = getActiveAdUnitIds();
    const res = await this.bridge.loadRewarded(ids.rewarded);
    this.rewardedLoading = false;

    if (res.loaded) {
      this.rewardedReady = true;
      this.rewardedRetryIndex = 0;
      this.emit();
      return true;
    }

    this.rewardedReady = false;
    this.scheduleRewardedRetry();
    this.emit();
    return false;
  }

  private scheduleRewardedRetry(): void {
    if (this.rewardedRetryIndex >= AD_FREQUENCY_CONFIG.retryBackoffMs.length) {
      return;
    }
    const delay = AD_FREQUENCY_CONFIG.retryBackoffMs[this.rewardedRetryIndex++];
    this.clearRewardedRetry();
    this.rewardedRetryTimer = setTimeout(() => {
      this.rewardedRetryTimer = null;
      void this.preloadRewarded();
    }, delay);
  }

  private clearRewardedRetry(): void {
    if (this.rewardedRetryTimer) {
      clearTimeout(this.rewardedRetryTimer);
      this.rewardedRetryTimer = null;
    }
  }

  public computeRewardGold(placement: RewardedPlacement, levelGoldEarned = 0): number {
    if (placement === 'daily_bonus') {
      return AD_FREQUENCY_CONFIG.rewardedGold.daily_bonus;
    }
    if (placement === 'level_clear_bonus') {
      const scaled = Math.round(
        Math.max(0, levelGoldEarned) * AD_FREQUENCY_CONFIG.rewardedGold.level_clear_bonus_ratio,
      );
      return Math.min(
        AD_FREQUENCY_CONFIG.rewardedGold.level_clear_bonus_max,
        Math.max(AD_FREQUENCY_CONFIG.rewardedGold.level_clear_bonus_min, scaled),
      );
    }
    return AD_FREQUENCY_CONFIG.rewardedGold.extra_gold_shop;
  }

  /**
   * İsteğe bağlı Ödüllü Reklam gösterimi.
   * ÖDÜL GARANTİSİ:
   * - Yalnızca AdMob SDK'sının gerçek `OnUserEarnedRewardListener` geri çağrısı
   *   `rewarded: true` ve benzersiz bir `grantToken` ile döndüğünde ödül verilir.
   * - Reklamın yarıda kapatılması, yüklenememesi veya hata vermesi ödül vermez.
   * - Aynı `grantToken` iki kez asla ödül vermez.
   */
  public async showRewardedAd(
    placement: RewardedPlacement,
    levelGoldEarned = 0,
  ): Promise<RewardedAdOutcome> {
    this.rolloverDailyCountersIfNeeded();
    const today = getTodayDateKey(this.nowFn());
    const expectedGold = this.computeRewardGold(placement, levelGoldEarned);

    // 1) AdFreeManager politikası kontrolü
    if (!this.adFree.shouldAllowRewarded()) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'DISABLED_BY_AD_FREE_POLICY',
        message: 'Reklamsız sürüm ayarınız gereği ödüllü reklamlar kapalı.',
      };
    }

    // 2) Günlük bonus ve günlük ödüllü limit kontrolü
    if (placement === 'daily_bonus' && this.state.dailyBonusClaimedDateKey === today) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'DAILY_BONUS_ALREADY_CLAIMED',
        message: 'Bugünkü Günlük Bonus ödülünü zaten aldın. Yarın tekrar gel!',
      };
    }

    if (this.state.rewardedCountToday >= AD_FREQUENCY_CONFIG.rewardedDailyLimit) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'DAILY_LIMIT_REACHED',
        message: `Günlük ödüllü reklam sınırına (${AD_FREQUENCY_CONFIG.rewardedDailyLimit}/${AD_FREQUENCY_CONFIG.rewardedDailyLimit}) ulaştın.`,
      };
    }

    const sinceLastSec = (this.nowFn() - this.state.lastRewardedShownAt) / 1000;
    if (
      this.state.lastRewardedShownAt > 0 &&
      sinceLastSec < AD_FREQUENCY_CONFIG.rewardedCooldownSec
    ) {
      const waitSec = Math.ceil(AD_FREQUENCY_CONFIG.rewardedCooldownSec - sinceLastSec);
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'REWARDED_COOLDOWN',
        message: `Yeni bir ödüllü reklam izlemek için ${waitSec} saniye bekle.`,
      };
    }

    // 3) Ortam, bağlantı ve gizlilik izni kontrolü
    if (!this.bridge.isNativeAndroidReady()) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'UNSUPPORTED_WEB',
        message:
          'Gerçek Google AdMob ödüllü reklamları yalnızca Android uygulamasında çalışır (web önizlemede sahte ödül verilmez).',
      };
    }

    if (!this.bridge.isOnline()) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'OFFLINE',
        message: 'Ödüllü reklam izlemek için internet bağlantısı gerekiyor.',
      };
    }

    if (!this.initialized || !this.canRequestAds) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'CONSENT_OR_SDK_NOT_READY',
        message: 'Reklam servisi hazır değil veya gizlilik izni verilmedi.',
      };
    }

    if (this.isShowingFullScreenAd) {
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'AD_ALREADY_SHOWING',
        message: 'Şu anda başka bir reklam açık.',
      };
    }

    // Önceden yüklenmemişse tek seferlik yüklemeyi dene (hata verirse kilitlenmeden çık)
    if (!this.rewardedReady) {
      const loadedNow = await this.preloadRewarded();
      if (!loadedNow) {
        return {
          shown: false,
          rewarded: false,
          goldAmount: 0,
          placement,
          grantToken: null,
          statusCode: 'AD_NOT_AVAILABLE',
          message: 'Şu an uygun ödüllü reklam bulunamadı. Biraz sonra tekrar dene.',
        };
      }
    }

    this.isShowingFullScreenAd = true;
    this.audioDuckCallback?.(true);
    this.emit();

    try {
      const res = await this.bridge.showRewarded();
      this.rewardedReady = false;

      // Arka planda bir sonraki ödüllü reklamı hazırla
      if (this.bridge.isOnline() && this.adFree.shouldAllowRewarded()) {
        this.rewardedRetryIndex = 0;
        void this.preloadRewarded();
      }

      // KRİTİK: Yalnızca gerçek AdMob OnUserEarnedRewardListener tetiklendiyse ve token benzersizse ödül ver!
      const token = typeof res.grantToken === 'string' ? res.grantToken.trim() : '';
      if (!res.shown || !res.rewarded || token.length === 0) {
        return {
          shown: res.shown,
          rewarded: false,
          goldAmount: 0,
          placement,
          grantToken: null,
          statusCode: res.statusCode || 'DISMISSED_WITHOUT_REWARD',
          message: res.shown
            ? 'Reklam tamamlanmadan kapatıldığı için ödül verilmedi.'
            : res.message || 'Ödüllü reklam gösterilemedi.',
        };
      }

      if (this.claimedTokens.has(token)) {
        return {
          shown: true,
          rewarded: false,
          goldAmount: 0,
          placement,
          grantToken: token,
          statusCode: 'DUPLICATE_REWARD_BLOCKED',
          message: 'Bu reklamın ödülü zaten teslim edildi.',
        };
      }

      this.claimedTokens.add(token);
      this.state.rewardedCountToday += 1;
      this.state.lastRewardedShownAt = this.nowFn();
      if (placement === 'daily_bonus') {
        this.state.dailyBonusClaimedDateKey = today;
      }
      this.persistState();

      return {
        shown: true,
        rewarded: true,
        goldAmount: expectedGold,
        placement,
        grantToken: token,
        statusCode: 'REWARD_EARNED',
        message: `Tebrikler! +${expectedGold} Altın kesene eklendi!`,
      };
    } catch {
      this.rewardedReady = false;
      return {
        shown: false,
        rewarded: false,
        goldAmount: 0,
        placement,
        grantToken: null,
        statusCode: 'SHOW_EXCEPTION',
        message: 'Ödüllü reklam gösterilirken bir hata oluştu.',
      };
    } finally {
      this.isShowingFullScreenAd = false;
      this.audioDuckCallback?.(false);
      this.emit();
    }
  }
}

export const adManager = new AdManager({
  bridge: adMobBridge,
  adFree: adFreeManager,
  purchases: purchaseManager,
});
