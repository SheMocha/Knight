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

function createDefaultSave(): SaveData {
  return {
    unlockedLevel: 1,
    completedLevels: [],
    bestScores: {},
    bestGold: {},
    walletGold: 0,
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

export function recordLevelResult(
  current: SaveData,
  levelId: number,
  score: number,
  gold: number,
  _nextWalletGold: number,
  won: boolean,
): { next: SaveData; isNewBest: boolean; newlyUnlockedLevel: number | null } {
  const prevBest = current.bestScores[levelId] || 0;
  const isNewBest = score > prevBest;
  const prevGold = current.bestGold[levelId] || 0;

  let unlockedLevel = current.unlockedLevel;
  let newlyUnlockedLevel: number | null = null;
  if (won && levelId < TOTAL_LEVELS && unlockedLevel <= levelId) {
    unlockedLevel = levelId + 1;
    newlyUnlockedLevel = unlockedLevel;
  }

  const completedSet = new Set<number>(current.completedLevels || []);
  if (won && levelId >= 1 && levelId <= TOTAL_LEVELS) {
    completedSet.add(levelId);
  }
  const completedLevels = Array.from(completedSet).sort((a, b) => a - b);

  // Altın kesesi yalnızca o bölümde yerden toplanan gerçek altın kadar artar (ekstra çarpım veya bonus yok).
  const earnedGold = Math.max(0, Math.floor(gold));
  const bankedWallet = won ? current.walletGold + earnedGold : current.walletGold;

  const next: SaveData = {
    ...current,
    unlockedLevel,
    completedLevels,
    walletGold: bankedWallet,
    bestScores: {
      ...current.bestScores,
      [levelId]: Math.max(prevBest, score),
    },
    bestGold: {
      ...current.bestGold,
      [levelId]: Math.max(prevGold, gold),
    },
  };

  persistSaveData(next);
  return { next, isNewBest, newlyUnlockedLevel };
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
