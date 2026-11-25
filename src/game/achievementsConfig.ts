export type AchievementCategory = 'level' | 'combat' | 'economy' | 'special';

export type AchievementType = 'STANDARD' | 'INCREMENTAL';

export type AchievementKey =
  | 'ach_level_1'
  | 'ach_level_5'
  | 'ach_level_10'
  | 'ach_level_20'
  | 'ach_level_30'
  | 'ach_level_40'
  | 'ach_level_50'
  | 'ach_level_60'
  | 'ach_enemy_1'
  | 'ach_enemy_100'
  | 'ach_enemy_1000'
  | 'ach_enemy_5000'
  | 'ach_combo_10'
  | 'ach_combo_25'
  | 'ach_accuracy_master'
  | 'ach_gold_1'
  | 'ach_gold_100'
  | 'ach_gold_1000'
  | 'ach_gold_10000'
  | 'ach_breakable_100'
  | 'ach_tnt_master'
  | 'ach_special_rewards_50'
  | 'ach_boss_1'
  | 'ach_boss_6'
  | 'ach_flawless_victory'
  | 'ach_princess_guard'
  | 'ach_royal_guard'
  | 'ach_patient_knight'
  | 'ach_big_hunt'
  | 'ach_true_legend';

export interface AchievementDefinition {
  order: number;
  key: AchievementKey;
  category: AchievementCategory;
  name: string;
  description: string;
  type: AchievementType;
  targetSteps: number;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'mythic';
  iconPath: string;
  /**
   * Google Play Console -> Play Games Services -> Başarımlar ekranında üretilen
   * gerçek Achievement ID (örn: CgkI...).
   * Ortam değişkeni (VITE_PGS_ACH_*) veya doğrudan bu tabloya gerçek değer girilmelidir.
   * Yer tutucu değerler (`REPLACE_WITH_...`) asla sahte başarım olarak kabul edilmez.
   */
  googlePlayId: string;
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

function resolveConsoleAchievementId(envKey: string, key: AchievementKey): string {
  const fromEnv = env[envKey]?.trim();
  if (fromEnv && !fromEnv.startsWith('REPLACE_WITH_')) {
    return fromEnv;
  }
  return `REPLACE_WITH_PLAY_CONSOLE_ID_${key.toUpperCase()}`;
}

export function isConfiguredGooglePlayId(id: string | null | undefined): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  return trimmed.length > 0 && !trimmed.startsWith('REPLACE_WITH_');
}

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'level', label: 'Bölüm' },
  { id: 'combat', label: 'Savaş' },
  { id: 'economy', label: 'Ekonomi' },
  { id: 'special', label: 'Özel' },
];

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  // === BÖLÜM BAŞARIMLARI (8) ===
  {
    order: 1,
    key: 'ach_level_1',
    category: 'level',
    name: 'İlk Adım',
    description: 'İlk bölümü tamamla.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 10,
    tier: 'bronze',
    iconPath: '/achievements/icons/ach_01_ach_level_1.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_1', 'ach_level_1'),
  },
  {
    order: 2,
    key: 'ach_level_5',
    category: 'level',
    name: 'Köyün Kahramanı',
    description: '5 bölüm tamamla.',
    type: 'INCREMENTAL',
    targetSteps: 5,
    points: 20,
    tier: 'bronze',
    iconPath: '/achievements/icons/ach_02_ach_level_5.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_5', 'ach_level_5'),
  },
  {
    order: 3,
    key: 'ach_level_10',
    category: 'level',
    name: 'Tecrübeli Şövalye',
    description: '10 bölüm tamamla.',
    type: 'INCREMENTAL',
    targetSteps: 10,
    points: 25,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_03_ach_level_10.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_10', 'ach_level_10'),
  },
  {
    order: 4,
    key: 'ach_level_20',
    category: 'level',
    name: 'Orta Çağ Efsanesi',
    description: '20 bölüm tamamla.',
    type: 'INCREMENTAL',
    targetSteps: 20,
    points: 30,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_04_ach_level_20.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_20', 'ach_level_20'),
  },
  {
    order: 5,
    key: 'ach_level_30',
    category: 'level',
    name: 'Krallığın Koruyucusu',
    description: '30 bölüm tamamla.',
    type: 'INCREMENTAL',
    targetSteps: 30,
    points: 35,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_05_ach_level_30.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_30', 'ach_level_30'),
  },
  {
    order: 6,
    key: 'ach_level_40',
    category: 'level',
    name: 'Efsanevi Savaşçı',
    description: '40 bölüm tamamla.',
    type: 'INCREMENTAL',
    targetSteps: 40,
    points: 40,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_06_ach_level_40.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_40', 'ach_level_40'),
  },
  {
    order: 7,
    key: 'ach_level_50',
    category: 'level',
    name: 'Karanlığın Fatihi',
    description: '50 bölüm tamamla.',
    type: 'INCREMENTAL',
    targetSteps: 50,
    points: 45,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_07_ach_level_50.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_50', 'ach_level_50'),
  },
  {
    order: 8,
    key: 'ach_level_60',
    category: 'level',
    name: 'Krallığın Kurtarıcısı',
    description: '60 bölümün tamamını bitir.',
    type: 'INCREMENTAL',
    targetSteps: 60,
    points: 50,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_08_ach_level_60.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_LEVEL_60', 'ach_level_60'),
  },

  // === SAVAŞ BAŞARIMLARI (7) ===
  {
    order: 9,
    key: 'ach_enemy_1',
    category: 'combat',
    name: 'İlk Kan',
    description: 'İlk düşmanı etkisiz hale getir.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 10,
    tier: 'bronze',
    iconPath: '/achievements/icons/ach_09_ach_enemy_1.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_ENEMY_1', 'ach_enemy_1'),
  },
  {
    order: 10,
    key: 'ach_enemy_100',
    category: 'combat',
    name: 'Yüzlük Kulüp',
    description: '100 düşmanı etkisiz hale getir.',
    type: 'INCREMENTAL',
    targetSteps: 100,
    points: 25,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_10_ach_enemy_100.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_ENEMY_100', 'ach_enemy_100'),
  },
  {
    order: 11,
    key: 'ach_enemy_1000',
    category: 'combat',
    name: 'Bin Savaş',
    description: '1.000 düşmanı etkisiz hale getir.',
    type: 'INCREMENTAL',
    targetSteps: 1000,
    points: 45,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_11_ach_enemy_1000.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_ENEMY_1000', 'ach_enemy_1000'),
  },
  {
    order: 12,
    key: 'ach_enemy_5000',
    category: 'combat',
    name: 'Durdurulamaz',
    description: '5.000 düşmanı etkisiz hale getir.',
    type: 'INCREMENTAL',
    targetSteps: 5000,
    points: 50,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_12_ach_enemy_5000.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_ENEMY_5000', 'ach_enemy_5000'),
  },
  {
    order: 13,
    key: 'ach_combo_10',
    category: 'combat',
    name: 'Kombo Ustası',
    description: 'Arka arkaya x10 kombo yap.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 25,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_13_ach_combo_10.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_COMBO_10', 'ach_combo_10'),
  },
  {
    order: 14,
    key: 'ach_combo_25',
    category: 'combat',
    name: 'Kombo Efsanesi',
    description: 'Arka arkaya x25 kombo yap.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 45,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_14_ach_combo_25.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_COMBO_25', 'ach_combo_25'),
  },
  {
    order: 15,
    key: 'ach_accuracy_master',
    category: 'combat',
    name: 'Kusursuz Zamanlama',
    description: 'Bir bölümü en az 10 vuruş ve %90 üzeri isabetle tamamla.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 30,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_15_ach_accuracy_master.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_ACCURACY_MASTER', 'ach_accuracy_master'),
  },

  // === EKONOMİ BAŞARIMLARI (5) ===
  {
    order: 16,
    key: 'ach_gold_1',
    category: 'economy',
    name: 'İlk Altın',
    description: 'İlk altınını kazan.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 10,
    tier: 'bronze',
    iconPath: '/achievements/icons/ach_16_ach_gold_1.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_GOLD_1', 'ach_gold_1'),
  },
  {
    order: 17,
    key: 'ach_gold_100',
    category: 'economy',
    name: 'Küçük Servet',
    description: 'Toplam 100 altın kazan.',
    type: 'INCREMENTAL',
    targetSteps: 100,
    points: 20,
    tier: 'bronze',
    iconPath: '/achievements/icons/ach_17_ach_gold_100.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_GOLD_100', 'ach_gold_100'),
  },
  {
    order: 18,
    key: 'ach_gold_1000',
    category: 'economy',
    name: 'Altın Avcısı',
    description: 'Toplam 1.000 altın kazan.',
    type: 'INCREMENTAL',
    targetSteps: 1000,
    points: 35,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_18_ach_gold_1000.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_GOLD_1000', 'ach_gold_1000'),
  },
  {
    order: 19,
    key: 'ach_gold_10000',
    category: 'economy',
    name: 'Kralın Hazinesi',
    description: 'Toplam 10.000 altın kazan.',
    type: 'INCREMENTAL',
    targetSteps: 10000,
    points: 50,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_19_ach_gold_10000.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_GOLD_10000', 'ach_gold_10000'),
  },
  {
    order: 20,
    key: 'ach_breakable_100',
    category: 'economy',
    name: 'Kırıcı',
    description: '100 kırılabilir çevre nesnesi parçala.',
    type: 'INCREMENTAL',
    targetSteps: 100,
    points: 30,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_20_ach_breakable_100.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_BREAKABLE_100', 'ach_breakable_100'),
  },

  // === ÖZEL BAŞARIMLAR (10) ===
  {
    order: 21,
    key: 'ach_tnt_master',
    category: 'special',
    name: 'Patlama Ustası',
    description: 'TNT sandığıyla aynı anda birden fazla hedefi parçala.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 25,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_21_ach_tnt_master.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_TNT_MASTER', 'ach_tnt_master'),
  },
  {
    order: 22,
    key: 'ach_special_rewards_50',
    category: 'special',
    name: 'Hazine Avcısı',
    description: '50 özel ödül, bonus veya ganimet kesesi kazan.',
    type: 'INCREMENTAL',
    targetSteps: 50,
    points: 35,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_22_ach_special_rewards_50.png',
    googlePlayId: resolveConsoleAchievementId(
      'VITE_PGS_ACH_SPECIAL_REWARDS_50',
      'ach_special_rewards_50',
    ),
  },
  {
    order: 23,
    key: 'ach_boss_1',
    category: 'special',
    name: 'Boss Avcısı',
    description: 'İlk bölüm sonu boss’unu yen.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 30,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_23_ach_boss_1.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_BOSS_1', 'ach_boss_1'),
  },
  {
    order: 24,
    key: 'ach_boss_6',
    category: 'special',
    name: 'Boss Efsanesi',
    description: '6 özel boss’un tamamını yen.',
    type: 'INCREMENTAL',
    targetSteps: 6,
    points: 50,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_24_ach_boss_6.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_BOSS_6', 'ach_boss_6'),
  },
  {
    order: 25,
    key: 'ach_flawless_victory',
    category: 'special',
    name: 'Kusursuz Zafer',
    description: 'Hiç ıska, lanet veya hasar yaşamadan bir bölümü tamamla.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 35,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_25_ach_flawless_victory.png',
    googlePlayId: resolveConsoleAchievementId(
      'VITE_PGS_ACH_FLAWLESS_VICTORY',
      'ach_flawless_victory',
    ),
  },
  {
    order: 26,
    key: 'ach_princess_guard',
    category: 'special',
    name: 'Prensesin Koruyucusu',
    description: 'Prensesin çıktığı bir bölümü ona vurmadan tamamla.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 25,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_26_ach_princess_guard.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_PRINCESS_GUARD', 'ach_princess_guard'),
  },
  {
    order: 27,
    key: 'ach_royal_guard',
    category: 'special',
    name: 'Kraliyet Muhafızı',
    description: 'Kralın çıktığı bir bölümü ona vurmadan tamamla.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 25,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_27_ach_royal_guard.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_ROYAL_GUARD', 'ach_royal_guard'),
  },
  {
    order: 28,
    key: 'ach_patient_knight',
    category: 'special',
    name: 'Sabırlı Şövalye',
    description: '15 saniye boyunca kombo kaybetmeden hedefleri vur.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 30,
    tier: 'silver',
    iconPath: '/achievements/icons/ach_28_ach_patient_knight.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_PATIENT_KNIGHT', 'ach_patient_knight'),
  },
  {
    order: 29,
    key: 'ach_big_hunt',
    category: 'special',
    name: 'Büyük Av',
    description: 'Tek bölümde 10.000 veya üzeri skor topla.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 35,
    tier: 'gold',
    iconPath: '/achievements/icons/ach_29_ach_big_hunt.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_BIG_HUNT', 'ach_big_hunt'),
  },
  {
    order: 30,
    key: 'ach_true_legend',
    category: 'special',
    name: 'Gerçek Efsane',
    description: '60. bölümü tamamlayarak Kızıl Ejderha’yı yen ve oyunu bitir.',
    type: 'STANDARD',
    targetSteps: 1,
    points: 80,
    tier: 'mythic',
    iconPath: '/achievements/icons/ach_30_ach_true_legend.png',
    googlePlayId: resolveConsoleAchievementId('VITE_PGS_ACH_TRUE_LEGEND', 'ach_true_legend'),
  },
];

export const ACHIEVEMENT_BY_KEY: Record<AchievementKey, AchievementDefinition> =
  ACHIEVEMENTS_CATALOG.reduce(
    (acc, item) => {
      acc[item.key] = item;
      return acc;
    },
    {} as Record<AchievementKey, AchievementDefinition>,
  );
