import { createInitialUpgrades } from './shop';
import { PlayerUpgrades, SaveData, WeaponId } from './types';
import { TOTAL_LEVELS } from './worlds';

const STORAGE_KEY = 'black_knight_get_medieval_save_v4';

const VALID_WEAPONS: WeaponId[] = ['club', 'mallet', 'hammer', 'axe', 'excalibur', 'mace'];

function sanitizeUpgrades(raw: unknown): PlayerUpgrades {
  const base = createInitialUpgrades();
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Partial<PlayerUpgrades>;
  const owned = Array.isArray(obj.ownedWeapons)
    ? Array.from(
        new Set<WeaponId>([
          'club',
          ...obj.ownedWeapons.filter((w): w is WeaponId =>
            VALID_WEAPONS.includes(w as WeaponId),
          ),
        ]),
      )
    : ['club' as WeaponId];
  const equipped =
    obj.equippedWeapon && owned.includes(obj.equippedWeapon) ? obj.equippedWeapon : 'club';
  return {
    ownedWeapons: owned,
    equippedWeapon: equipped,
    luckyAmulet: Math.max(0, Math.min(3, Math.floor(Number(obj.luckyAmulet) || 0))),
    armorOil: Math.max(0, Math.min(3, Math.floor(Number(obj.armorOil) || 0))),
    strengthTonic: Math.max(0, Math.min(3, Math.floor(Number(obj.strengthTonic) || 0))),
  };
}

function sanitizeCompletedLevels(raw: unknown, unlockedLevel: number): number[] {
  const set = new Set<number>();
  // Eski kayıtlarla tam uyumluluk: açılmış seviyenin altındaki tüm bölümler zaten geçilmiştir
  for (let i = 1; i < unlockedLevel; i++) {
    set.add(i);
  }
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const n = Math.floor(Number(item));
      if (n >= 1 && n <= TOTAL_LEVELS) set.add(n);
    }
  }
  return Array.from(set).sort((a, b) => a - b);
}

const MAX_SETTLED_RUN_IDS = 50;

function sanitizeSettledRunIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set<string>();
  for (const item of raw) {
    if (typeof item === 'string' && item.trim().length > 0) {
      unique.add(item.trim());
    }
  }
  return Array.from(unique).slice(-MAX_SETTLED_RUN_IDS);
}

function createDefaultSave(): SaveData {
  return {
    unlockedLevel: 1,
    completedLevels: [],
    bestScores: {},
    bestGold: {},
    walletGold: 0,
    settledRunIds: [],
    upgrades: createInitialUpgrades(),
    soundEnabled: true,
    tutorialCompleted: false,
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const unlockedLevel = Math.max(1, Math.min(TOTAL_LEVELS, Number(parsed.unlockedLevel) || 1));
    return {
      unlockedLevel,
      completedLevels: sanitizeCompletedLevels(parsed.completedLevels, unlockedLevel),
      bestScores:
        parsed.bestScores && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
      bestGold: parsed.bestGold && typeof parsed.bestGold === 'object' ? parsed.bestGold : {},
      walletGold: Math.max(0, Math.floor(Number(parsed.walletGold) || 0)),
      settledRunIds: sanitizeSettledRunIds(parsed.settledRunIds),
      upgrades: sanitizeUpgrades(parsed.upgrades),
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
      tutorialCompleted: Boolean(parsed.tutorialCompleted),
    };
  } catch {
    return createDefaultSave();
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Depolama kotası veya gizli mod hatalarını yok say
  }
}

export interface RecordLevelResultInput {
  runId: string;
  levelId: number;
  score: number;
  collectedLevelGold: number;
  completionBonusGold: number;
  won: boolean;
}

export interface RecordLevelResultOutcome {
  next: SaveData;
  isNewBest: boolean;
  newlyUnlockedLevel: number | null;
  goldAwarded: number;
  duplicateBlocked: boolean;
}

/**
 * BÖLÜM SONU KALICI KAYIT VE ATOMİK ALTIN AKTARIMI
 * - Başarısızlıkta (`won === false`): Kalıcı altın bakiyesi (`walletGold`) ve `bestGold`
 *   KESİNLİKLE artırılmaz; geçici bölüm altını tamamen kaybolur.
 * - Başarıda (`won === true`): Aynı `runId` daha önce işlendiyse çift aktarım engellenir.
 *   İlk kez işleniyorsa `collectedLevelGold + completionBonusGold` TEK İŞLEMDE kalıcı
 *   bakiyeye eklenir ve `settledRunIds` kaydına işlenir.
 */
export function recordLevelResult(
  current: SaveData,
  input: RecordLevelResultInput,
): RecordLevelResultOutcome {
  const { runId, levelId, score, collectedLevelGold, completionBonusGold, won } = input;
  const safeScore = Math.max(0, Math.floor(score));
  const prevBest = current.bestScores[levelId] || 0;
  const isNewBest = safeScore > prevBest;
  const existingSettled = sanitizeSettledRunIds(current.settledRunIds);

  // 1) BÖLÜM BAŞARISIZ: Kalıcı altın bakiyesi ve en iyi altın rekoru KESİNLİKLE değişmez!
  if (!won) {
    const next: SaveData = {
      ...current,
      walletGold: current.walletGold,
      settledRunIds: existingSettled,
      bestScores: {
        ...current.bestScores,
        [levelId]: Math.max(prevBest, safeScore),
      },
      bestGold: { ...current.bestGold },
    };
    persistSaveData(next);
    return {
      next,
      isNewBest,
      newlyUnlockedLevel: null,
      goldAwarded: 0,
      duplicateBlocked: false,
    };
  }

  // 2) ÇİFT ÖDÜL KORUMASI: Aynı bölüm koşusunun ödülü ikinci kez ASLA aktarılmaz!
  const normalizedRunId = runId.trim();
  if (normalizedRunId.length > 0 && existingSettled.includes(normalizedRunId)) {
    return {
      next: current,
      isNewBest: false,
      newlyUnlockedLevel: null,
      goldAwarded: 0,
      duplicateBlocked: true,
    };
  }

  let unlockedLevel = current.unlockedLevel;
  let newlyUnlockedLevel: number | null = null;
  if (levelId < TOTAL_LEVELS && unlockedLevel <= levelId) {
    unlockedLevel = levelId + 1;
    newlyUnlockedLevel = unlockedLevel;
  }

  const completedSet = new Set<number>(current.completedLevels || []);
  if (levelId >= 1 && levelId <= TOTAL_LEVELS) {
    completedSet.add(levelId);
  }
  const completedLevels = Array.from(completedSet).sort((a, b) => a - b);

  // 3) TEK İŞLEMDE ATOMİK AKTARIM: Bölüm içi geçici altın + Bölüm tamamlama bonusu
  const safeCollected = Math.max(0, Math.floor(collectedLevelGold));
  const safeBonus = Math.max(0, Math.floor(completionBonusGold));
  const totalAwarded = safeCollected + safeBonus;
  const bankedWallet = current.walletGold + totalAwarded;
  const prevGold = current.bestGold[levelId] || 0;

  const nextSettled =
    normalizedRunId.length > 0
      ? [...existingSettled, normalizedRunId].slice(-MAX_SETTLED_RUN_IDS)
      : existingSettled;

  const next: SaveData = {
    ...current,
    unlockedLevel,
    completedLevels,
    walletGold: bankedWallet,
    settledRunIds: nextSettled,
    bestScores: {
      ...current.bestScores,
      [levelId]: Math.max(prevBest, safeScore),
    },
    bestGold: {
      ...current.bestGold,
      [levelId]: Math.max(prevGold, totalAwarded),
    },
  };

  persistSaveData(next);
  return {
    next,
    isNewBest,
    newlyUnlockedLevel,
    goldAwarded: totalAwarded,
    duplicateBlocked: false,
  };
}

/**
 * ÖDÜLLÜ REKLAM KALICI ALTIN AKTARIMI
 * - Bölüm içi geçici altın havuzundan tamamen bağımsızdır.
 * - Yalnızca AdMob `OnUserEarnedRewardListener` tarafından doğrulanmış benzersiz
 *   `grantToken` ile kalıcı bakiyeye tek seferde aktarılır.
 */
export function creditPermanentRewardedAdGold(
  current: SaveData,
  goldAmount: number,
  grantToken: string | null,
): { next: SaveData; credited: number; duplicateBlocked: boolean } {
  const safeGold = Math.max(0, Math.floor(goldAmount));
  if (safeGold <= 0) {
    return { next: current, credited: 0, duplicateBlocked: false };
  }

  const existingSettled = sanitizeSettledRunIds(current.settledRunIds);
  const tokenKey = grantToken && grantToken.trim().length > 0 ? `ad_${grantToken.trim()}` : '';
  if (tokenKey.length > 0 && existingSettled.includes(tokenKey)) {
    return { next: current, credited: 0, duplicateBlocked: true };
  }

  const nextSettled =
    tokenKey.length > 0
      ? [...existingSettled, tokenKey].slice(-MAX_SETTLED_RUN_IDS)
      : existingSettled;

  const next: SaveData = {
    ...current,
    walletGold: current.walletGold + safeGold,
    settledRunIds: nextSettled,
  };
  persistSaveData(next);
  return { next, credited: safeGold, duplicateBlocked: false };
}

export function markTutorialCompleted(current: SaveData): SaveData {
  if (current.tutorialCompleted) return current;
  const next: SaveData = {
    ...current,
    tutorialCompleted: true,
  };
  persistSaveData(next);
  return next;
}

export function shouldAutoStartTutorial(data: SaveData): boolean {
  return (
    !data.tutorialCompleted &&
    data.completedLevels.length === 0 &&
    Object.keys(data.bestScores).length === 0
  );
}
