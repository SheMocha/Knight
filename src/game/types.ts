export type GameScreen =
  | 'TITLE'
  | 'PLAYING'
  | 'TUTORIAL'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'SHOP'
  | 'VICTORY'
  | 'GAME_OVER';

export type ShopOrigin = 'TITLE' | 'LEVEL_CLEAR' | 'GAME_OVER';

export type KnightAnimState =
  | 'run'
  | 'charge'
  | 'smash'
  | 'dizzy'
  | 'pig';

export type WeaponId =
  | 'club'
  | 'mallet'
  | 'hammer'
  | 'axe'
  | 'excalibur'
  | 'mace';

export type CharmId = 'luckyAmulet' | 'armorOil' | 'strengthTonic';

export type BreakableKind =
  // Temel ahşap & seramik
  | 'barrel'
  | 'crate'
  | 'wood_fence'
  | 'signpost'
  | 'hay_cart'
  | 'pottery'
  // Pazar & kasaba
  | 'stall'
  | 'apple_basket'
  | 'bread_basket'
  | 'fish_crate'
  | 'flour_sack'
  // Hazine & kraliyet
  | 'chest'
  | 'special_treasure'
  | 'jewel_box'
  // Orman
  | 'mushroom'
  | 'stump'
  | 'magic_plant'
  // Kale & şövalye
  | 'banner_stand'
  | 'shield_stand'
  | 'weapon_rack'
  | 'armor_dummy'
  // Buz krallığı
  | 'ice_chest'
  | 'ice_statue'
  | 'snow_globe'
  // Çöl krallığı
  | 'cactus'
  | 'sand_sack'
  | 'ancient_vase'
  // Korsan limanı
  | 'fishing_net'
  | 'rope_spool'
  // Lanetli mezarlık
  | 'tombstone'
  | 'broken_coffin'
  // Ejderha kalesi
  | 'lava_rock'
  | 'dragon_egg'
  | 'fire_crystal'
  | 'dark_chest'
  // 13 Özel Etkileşimli Nesne
  | 'tnt_crate'
  | 'balloon'
  | 'golden_statue'
  | 'magic_chest'
  | 'beehive'
  | 'bird_nest'
  | 'ice_block'
  | 'pumpkin'
  | 'firework_box'
  | 'pirate_barrel'
  | 'bone_pile'
  | 'ghost_jar'
  | 'egg_basket';

export type SpecialNpcKind =
  | 'princess'
  | 'king'
  | 'priest'
  | 'child'
  | 'gold_merchant'
  | 'chicken'
  | 'traveler';

export type BonusKind =
  | 'gold_rush'
  | 'double_score'
  | 'power_surge'
  | 'extra_points';

export interface BonusBanner {
  id: number;
  kind: BonusKind;
  title: string;
  subtitle: string;
}

export type EnemyKind =
  | 'villager'
  | 'merchant'
  | 'guard'
  | 'witch';

export type LevelTheme =
  | 'village'
  | 'market'
  | 'forest'
  | 'castle'
  | 'throne'
  | 'ice'
  | 'desert'
  | 'pirate'
  | 'graveyard'
  | 'dragon';

export type BossId =
  | 'market_baron'
  | 'iron_commander'
  | 'royal_golem'
  | 'desert_pharaoh'
  | 'grave_lord'
  | 'crimson_dragon';

export type SpawnPatternKind =
  | 'balanced'
  | 'swarm'
  | 'treasure_run'
  | 'hazard_gauntlet'
  | 'sprinter_rush'
  | 'boss';

export type LevelEventKind =
  | 'none'
  | 'gold_rain'
  | 'sprinter_wave'
  | 'tnt_chain'
  | 'ghost_mist'
  | 'meteor_shower';

export type AmbientParticleKind =
  | 'fireflies'
  | 'embers'
  | 'snow'
  | 'sand'
  | 'sea_spray'
  | 'souls'
  | 'ash';

export interface BossConfig {
  id: BossId;
  name: string;
  title: string;
  maxHp: number;
  phases: number;
  rewardGold: number;
  rewardScore: number;
  primaryColor: string;
  accentColor: string;
  introQuote: string;
  attackSpeed: number;
}

export type ScreenEffectKind =
  | 'chicken_feathers'
  | 'mushroom_dizzy'
  | 'fireworks'
  | 'ice_frost'
  | 'bee_swarm'
  | 'ghost_spook'
  | 'egg_splat'
  | 'explosion_flash'
  | 'gold_confetti'
  | 'damage_vignette';

export interface ScreenEffectState {
  id: number;
  kind: ScreenEffectKind;
  timeLeft: number;
  duration: number;
}

export interface BossHudState {
  id: BossId;
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  phase: number;
  maxPhases: number;
  warningText: string | null;
  enraged: boolean;
  playerHp: number;
  playerMaxHp: number;
  playerInvuln: boolean;
}

export interface WorldConfig {
  id: number; // 1..10
  roman: string;
  name: string;
  shortName: string;
  theme: LevelTheme;
  description: string;
  lockedHint: string;
  artwork: string;
  fallbackGradient: string;
  accentHex: string;
  badgeBg: string;
  ambientParticle: AmbientParticleKind;
  levelStart: number;
  levelEnd: number;
  bossLevel: number | null;
}

export interface ShopWeapon {
  id: WeaponId;
  name: string;
  cost: number;
  powerMult: number; // Vuruş gücü ve altın çarpanı
  hitRange: number; // Yatay vuruş menzili
  description: string;
}

export interface ShopCharm {
  id: CharmId;
  name: string;
  costs: [number, number, number]; // 3 seviye için dengeli fiyatlar
  maxLevel: number;
  description: string;
}

export interface PlayerUpgrades {
  ownedWeapons: WeaponId[];
  equippedWeapon: WeaponId;
  luckyAmulet: number; // 0..3 (vuruş başına daha fazla altın)
  armorOil: number; // 0..3 (ıskalayınca daha hızlı toparlanma)
  strengthTonic: number; // 0..3 (daha hızlı şarj)
}

export interface LevelConfig {
  id: number; // 1..60
  worldId: number; // 1..10
  levelInWorld: number; // 1..6
  roman: string;
  name: string;
  subtitle: string;
  atmosphere: string;
  lockedMystery: string;
  artwork: string;
  fallbackGradient: string;
  theme: LevelTheme;
  bgVariant: number; // 0..5 her dünya içinde benzersiz yerleşim & atmosfer
  lightingTint: string; // Bölüm özel renk dokunuşu
  difficulty: number; // 1..10
  scoreTarget: number; // Her bölümde 0'dan başlayarak ulaşılması gereken skor hedefi
  maxScore: number; // Bölümün gerçek üst skor sınırı (aşılamaz)
  levelScoreScale: number; // Bölümün düşman yoğunluğu ve süresine göre kalibre puan ölçeği
  timeLimit: number; // saniye
  scrollSpeed: number; // kayma hızı
  goldScale: number; // bölüm kalibre altın ölçeği (skordan tamamen bağımsız)
  expectedLevelGold: number; // bölüm içi beklenen geçici altın kazancı
  maxInLevelGold: number; // bölüm içi geçici altın üst tavanı
  completionBonusGold: number; // yalnızca bölüm başarıyla tamamlandığında eklenen bonus altın
  spawnInterval: number; // hedeflerin geliş sıklığı
  witchChance: number; // cadı çıkma olasılığı
  specialObjectChance: number; // etkileşimli özel obje olasılığı
  specialNpcChance: number; // özel NPC olasılığı
  spawnPattern: SpawnPatternKind;
  levelEvent: LevelEventKind;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunColor: string;
  fogColor: string;
  hillColorFar: string;
  hillColorMid: string;
  roadTint: string;
  hasMoon?: boolean;
  isInterior?: boolean;
  isBossLevel: boolean;
  boss?: BossConfig;
  objectPool: BreakableKind[];
  specialObjectPool: BreakableKind[];
  characterPool: EnemyKind[];
  specialNpcPool: SpecialNpcKind[];
}

export interface FloatingPopup {
  id: number;
  text: string;
  screenX: number; // 0..100 yüzde
  screenY: number; // 0..100 yüzde
  color: string;
  scale?: number;
}

export interface HudSnapshot {
  levelId: number;
  worldId: number;
  worldName: string;
  levelName: string;
  isBossLevel: boolean;
  boss: BossHudState | null;
  activeEventBanner: string | null;
  equippedWeapon: WeaponId;
  weaponName: string;
  levelGold: number; // Yalnızca bu bölümün GEÇİCİ altın bakiyesi (bölüm bitmeden kalıcı bakiyeye eklenmez)
  walletGold: number; // Oyuncunun KALICI altın bakiyesi (bölüm oynanırken artmaz)
  maxInLevelGold?: number; // Bu bölümde toplanabilecek geçici altın üst tavanı
  completionBonusGold?: number; // Başarılı tamamlamada eklenecek bölüm bonusu
  goldBags: number;
  levelScore: number; // Sadece bu bölümün vuruş skoru (her bölümde 0'dan başlar)
  scoreTarget: number; // Bu bölümü geçmek için gereken skor hedefi
  maxScore: number; // Bu bölümde ulaşılabilecek maksimum skor üst sınırı
  scoreCapped: boolean; // Maksimum skor sınırına ulaşıldı mı
  timeLeft: number;
  timeLimit: number;
  charge: number; // 0..1
  isCharging: boolean;
  getMedievalFlash: number; // 100% kritik vuruşta görünür
  dizzyTimeLeft: number; // Boşa sallayınca sersemleme süresi
  dizzyDuration: number;
  pigTimeLeft: number; // Cadıya vurunca domuz laneti süresi
  pigDuration: number;
  combo: number;
  comboTimeLeft: number; // Kısa kombo sıfırlanma geri sayımı
  comboDuration: number;
  doubleScoreTimeLeft: number; // 2x Çift Skor aktif süresi
  doubleScoreDuration: number;
  powerSurgeTimeLeft: number; // Geçici Güç aktif süresi
  powerSurgeDuration: number;
  activeBonusBanner: BonusBanner | null;
  screenEffects: ScreenEffectState[];
  quotaMet: boolean;
  victoryCinematicActive?: boolean;
  victoryFadeAlpha?: number;
}

export interface LevelResult {
  won: boolean;
  levelId: number;
  worldId: number;
  worldName: string;
  levelName: string;
  levelGold: number; // Başarıda aktarılan bölüm içi toplanan altın (başarısızlıkta 0)
  completionBonusGold: number; // Yalnızca başarıda eklenen bölüm tamamlama altın bonusu (başarısızlıkta 0)
  totalGoldAwarded: number; // Kalıcı bakiyeye tek işlemde aktarılan toplam altın (levelGold + completionBonusGold)
  lostTemporaryGold: number; // Başarısızlıkta silinen geçici bölüm altını (başarıda 0)
  alreadySettled?: boolean; // Aynı bölüm ödülü ikinci kez tetiklenirse true
  walletGold: number; // İşlem sonrası kalıcı oyuncu altın bakiyesi
  goldBags: number;
  timeRemaining: number;
  levelScore: number; // Bu bölümün skoru
  scoreTarget: number; // Bu bölümün skor hedefi
  maxScore: number; // Bu bölümün maksimum skor üst sınırı
  isNewBest: boolean;
  isFinalLevel: boolean;
  isBossLevel?: boolean;
  bossId?: BossId;
  bossName?: string;
  failTitle?: string;
  failReason?: string;
  newlyUnlockedLevel?: number | null;
  runId?: string;
  swings?: number;
  hits?: number;
  mistakes?: number;
  sawPrincess?: boolean;
  sawKing?: boolean;
}

export interface SaveData {
  unlockedLevel: number; // 1..60
  completedLevels: number[]; // Tamamlanan bölüm kimlikleri (kayıtlı ilerleme korunur)
  bestScores: Record<number, number>;
  bestGold: Record<number, number>;
  walletGold: number;
  settledRunIds?: string[]; // Aynı bölüm ödülünün ikinci kez kalıcı bakiyeye aktarılmasını engelleyen koruma
  upgrades: PlayerUpgrades;
  soundEnabled: boolean;
  tutorialCompleted: boolean;
}

export type TutorialStage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TutorialSnapshot {
  stage: TutorialStage;
  stageCompletedFlash: boolean;
  chargePracticed: boolean;
  swingPracticed: boolean;
  pigActive: boolean;
  pigCountdown: number; // 0 değilse 3, 2, 1
  pigTimeLeft: number;
  pigDuration: number;
  innocentsSpared: number; // Aşama 4: güvenle geçirilen masum sayısı (0..3)
  innocentsTotal: number; // 3 (Prenses, Kral, Rahip)
  currentInnocentKind: 'princess' | 'king' | 'priest' | null;
  forbiddenWarningText: string | null;
  merchantHit: boolean; // Aşama 5: Altın Tüccarı vuruldu mu
  goldCollected: number;
  goldGoal: number;
  tutorialScore: number;
  scoreGoal: number;
  charge: number;
  isCharging: boolean;
  equippedWeapon: WeaponId;
  weaponName: string;
  focusX: number; // 0..100 yüzde
  focusY: number; // 0..100 yüzde
  focusVisible: boolean;
  knightScreenX: number; // 0..100 yüzde
  knightScreenY: number; // 0..100 yüzde
}
