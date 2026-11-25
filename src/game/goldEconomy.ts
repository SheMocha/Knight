import {
  BossConfig,
  BreakableKind,
  EnemyKind,
  LevelConfig,
  LevelEventKind,
  PlayerUpgrades,
  SpawnPatternKind,
  SpecialNpcKind,
  WeaponId,
} from './types';

/**
 * MERKEZİ ALTIN EKONOMİSİ VE GEÇİCİ BÖLÜM ÖDÜL YÖNETİCİSİ (GoldEconomyManager)
 * ---------------------------------------------------------------------------
 * Oyundaki TÜM altın kaynaklarını, 60 bölümün kalibrasyonunu, tekil-varlık
 * çift-ödül engellemesini (deduplication), bölüm bazlı geçici altın bakiyesini
 * ve bölüm başarısına bağlı tek-seferlik (idempotent) ödül aktarımını yönetir.
 *
 * Temel İlkeler:
 * 1. SKOR VE ALTIN TAMAMEN AYRIDIR: Kombo çarpanı, 2X Çift Skor, Süper Güç
 *    ve Ekstra Puan bonusları altın kazancını ASLA artırmaz.
 * 2. ÇARPAN ÜST ÜSTE BİNMEZ: Altın çarpanı toplamsal (additive) havuz + kesin
 *    üst tavan (MAX_GOLD_MULTIPLIER = 1.65x) ile sınırlıdır.
 * 3. ÇİFT ÖDÜL ENGELLENİR: Her düşman, kırılabilir nesne, özel NPC, TNT
 *    zincir patlaması, bonus nesnesi, boss yenilgisi ve sikke toplaması
 *    benzersiz anahtarla (`allocatedSourceKeys`, `collectedPickupKeys`) yalnızca
 *    BİR KEZ hesaplanır.
 * 4. GEÇİCİ vs KALICI BAKİYE AYRIMI: Bölüm içinde toplanan altınlar yalnızca
 *    bellek içi geçici bakiyede (`temporaryGold`) tutulur; bölüm başarıyla
 *    tamamlanmadan kalıcı oyuncu bakiyesine (`walletGold`) ASLA eklenmez ve
 *    `localStorage`'a yazılmaz.
 * 5. BAŞARISIZLIKTA SİLİNİR / BAŞARIDA TEK İŞLEMDE AKTARILIR: Bölüm kaybında
 *    geçici bakiye tamamen sıfırlanır. Bölüm zaferinde `temporaryGold +
 *    completionBonusGold` tek bir atomik aktarımla kalıcı bakiyeye verilir ve
 *    aynı `runId` ikinci kez aktarılamaz.
 */

export const MAX_GOLD_MULTIPLIER = 1.65;
export const MIN_GOLD_MULTIPLIER = 1.0;

/**
 * Silah başına kontrollü altın bonusu (savaş hasarındaki `powerMult`'tan ayrılmıştır).
 * Toplam mağaza ekonomisi (43.150 altın) ile uyumlu dengeli ilerleme sağlar.
 */
export const WEAPON_GOLD_BONUS: Record<WeaponId, number> = {
  club: 0,
  mallet: 0.07,
  hammer: 0.14,
  axe: 0.22,
  excalibur: 0.32,
  mace: 0.44,
};

export const LUCKY_AMULET_BONUS_PER_LEVEL = 0.06; // +6% / +12% / +18%
export const CRIT_GOLD_BONUS = 0.08; // %100 şarj kritik vuruşta +8% (tavan 1.65x içinde)

export const ENEMY_BASE_GOLD: Record<EnemyKind, number> = {
  villager: 5,
  merchant: 9,
  guard: 11,
  witch: 0,
};

export const SPECIAL_NPC_BASE_GOLD: Record<SpecialNpcKind, number> = {
  princess: 0,
  king: 0,
  priest: 0,
  child: 0,
  gold_merchant: 32,
  chicken: 8,
  traveler: 16,
};

export const BREAKABLE_BASE_GOLD: Record<BreakableKind, number> = {
  // Temel ahşap & seramik
  wood_fence: 5,
  barrel: 6,
  signpost: 6,
  flour_sack: 6,
  crate: 7,
  pottery: 7,
  hay_cart: 9,

  // Pazar & kasaba
  apple_basket: 8,
  bread_basket: 8,
  fish_crate: 8,
  stall: 11,

  // Hazine & kraliyet
  chest: 16,
  jewel_box: 18,
  special_treasure: 24,

  // Orman
  mushroom: 6,
  stump: 6,
  magic_plant: 10,

  // Kale & şövalye
  banner_stand: 9,
  shield_stand: 10,
  weapon_rack: 10,
  armor_dummy: 11,

  // Buz krallığı
  snow_globe: 11,
  ice_statue: 13,
  ice_chest: 16,

  // Çöl krallığı
  cactus: 7,
  sand_sack: 7,
  ancient_vase: 13,

  // Korsan limanı
  fishing_net: 7,
  rope_spool: 7,

  // Lanetli mezarlık
  tombstone: 10,
  broken_coffin: 11,

  // Ejderha kalesi
  lava_rock: 11,
  fire_crystal: 15,
  dragon_egg: 20,
  dark_chest: 22,

  // 13 Özel Etkileşimli Nesne (tek ödeme — çift ödeme kesinlikle yok)
  bird_nest: 8,
  beehive: 9,
  egg_basket: 9,
  bone_pile: 9,
  tnt_crate: 10,
  ice_block: 10,
  firework_box: 11,
  ghost_jar: 12,
  balloon: 15,
  pumpkin: 16,
  pirate_barrel: 16,
  magic_chest: 16,
  golden_statue: 24, // + 2 ara vuruş parçası (6 + 6) = toplam 36 taban altın
};

export const GOLDEN_STATUE_CHIP_BASE_GOLD = 6;

/**
 * Etkileşimli efekti kendi altın saçılımını yöneten kırılabilir nesneler.
 * Engine bu nesneler için genel `burstCoins` çağırmaz; ödül YALNIZCA tek seferde
 * etkileşimli efekt içinden dağıtılır (çift ödeme engellenir).
 */
export const SELF_DISTRIBUTING_GOLD_BREAKABLES: ReadonlySet<BreakableKind> = new Set<BreakableKind>([
  'balloon',
  'golden_statue',
  'pumpkin',
  'pirate_barrel',
]);

export function getEnemyBaseGold(kind: EnemyKind, isSprinter: boolean): number {
  const base = ENEMY_BASE_GOLD[kind] ?? 0;
  if (base <= 0) return 0;
  return isSprinter ? Math.round(base * 1.2) : base;
}

export function getBreakableBaseGold(kind: BreakableKind): number {
  return BREAKABLE_BASE_GOLD[kind] ?? 6;
}

export function getSpecialNpcBaseGold(kind: SpecialNpcKind): number {
  return SPECIAL_NPC_BASE_GOLD[kind] ?? 0;
}

export function getWeaponGoldBonusPct(weaponId: WeaponId): number {
  return Math.round((WEAPON_GOLD_BONUS[weaponId] ?? 0) * 100);
}

/**
 * Merkezi Altın Çarpanı Hesaplayıcısı:
 * - Yalnızca donatılan silahın altın bonusu + Şans Muskası (+%6/svy) + isteğe bağlı
 *   %100 kritik vuruş bonusu (+%8) toplamsal olarak birleşir.
 * - Kombo, 2X Çift Skor ve Süper Güç bu hesaba HİÇBİR ZAMAN girmez.
 * - Maksimum tavan: 1.65x.
 */
export function calculateGoldMultiplier(upgrades: PlayerUpgrades, isCrit = false): number {
  const weaponBonus = WEAPON_GOLD_BONUS[upgrades.equippedWeapon] ?? 0;
  const amuletLevel = Math.max(0, Math.min(3, Math.floor(upgrades.luckyAmulet || 0)));
  const amuletBonus = amuletLevel * LUCKY_AMULET_BONUS_PER_LEVEL;
  const critBonus = isCrit ? CRIT_GOLD_BONUS : 0;

  const raw = 1 + weaponBonus + amuletBonus + critBonus;
  return Number(Math.max(MIN_GOLD_MULTIPLIER, Math.min(MAX_GOLD_MULTIPLIER, raw)).toFixed(3));
}

export interface LevelGoldCalibrationInput {
  id: number;
  totalLevels: number;
  timeLimit: number;
  spawnInterval: number;
  witchChance: number;
  specialObjectChance: number;
  specialNpcChance: number;
  spawnPattern: SpawnPatternKind;
  levelEvent: LevelEventKind;
  objectPool: BreakableKind[];
  specialObjectPool: BreakableKind[];
  characterPool: EnemyKind[];
  specialNpcPool: SpecialNpcKind[];
  isBossLevel: boolean;
  boss?: BossConfig;
}

export interface LevelGoldCalibration {
  levelGoldScale: number;
  expectedLevelGold: number;
  maxInLevelGold: number;
  completionBonusGold: number;
}

function roundTo10(v: number): number {
  return Math.max(10, Math.round(v / 10) * 10);
}

/**
 * 60 Bölümün Tamamı İçin Analitik Altın Ekonomisi Kalibrasyonu:
 * - Bölüm süresi, spawn sıklığı, nesne/düşman havuzu ve zorluk eğrisine göre
 *   her bölümde hedeflenen gerçekçi altın kazancını (`expectedLevelGold`),
 *   üst sınırı (`maxInLevelGold`) ve yalnızca başarıda verilen bölüm tamamlama
 *   bonusunu (`completionBonusGold`) hesaplar.
 * - Yüksek yoğunluklu/uzun bölümlerde `levelGoldScale` otomatik dengelenir;
 *   böylece geç bölümlerde altın patlaması yaşanmaz.
 */
export function computeLevelGoldCalibration(
  input: LevelGoldCalibrationInput,
): LevelGoldCalibration {
  const progress = (input.id - 1) / Math.max(1, input.totalLevels - 1); // 0..1

  // Boss Bölümleri (10, 20, 30, 40, 50, 60)
  if (input.isBossLevel && input.boss) {
    const expectedLevelGold = Math.max(200, Math.round(input.boss.rewardGold));
    const maxInLevelGold = roundTo10(expectedLevelGold * 1.15);
    // Boss tamamlama bonusu (~%36-%38, final boss için +%38)
    const bonusRatio = input.id >= input.totalLevels ? 0.385 : 0.355;
    const completionBonusGold = roundTo10(expectedLevelGold * bonusRatio);
    const levelGoldScale = Number((0.9 + progress * 0.7).toFixed(3));
    return {
      levelGoldScale,
      expectedLevelGold,
      maxInLevelGold,
      completionBonusGold,
    };
  }

  // Normal Bölümler (1..59 arası 54 bölüm)
  // 1. Bölüm ~120 -> 30. civarı ~460 -> 59. Bölüm ~880 taban bölüm içi altın hedefi
  const patternTargetBonus =
    input.spawnPattern === 'treasure_run'
      ? 1.07
      : input.levelEvent === 'gold_rain'
        ? 1.04
        : 1.0;

  const baseTargetCurve = 120 + Math.pow(progress, 1.16) * 750;
  const expectedLevelGold = roundTo10(baseTargetCurve * patternTargetBonus);
  const maxInLevelGold = roundTo10(expectedLevelGold * 1.35);
  const completionBonusGold = roundTo10(expectedLevelGold * 0.25);

  // Bölümün ham altın üretim yoğunluğunu analitik olarak hesapla (scale = 1.0 iken)
  const effectivePlayTime = Math.max(20, input.timeLimit - 2.5);
  const spawnTicks = effectivePlayTime / Math.max(0.55, input.spawnInterval);

  const avgEnemyBase =
    input.characterPool.length > 0
      ? input.characterPool.reduce((acc, k) => acc + getEnemyBaseGold(k, false), 0) /
        input.characterPool.length
      : 6;

  const avgObjBase =
    input.objectPool.length > 0
      ? input.objectPool.reduce((acc, k) => acc + getBreakableBaseGold(k), 0) /
        input.objectPool.length
      : 7;

  const avgSpecialObjBase =
    input.specialObjectPool.length > 0
      ? input.specialObjectPool.reduce((acc, k) => {
          const base = getBreakableBaseGold(k);
          return acc + (k === 'golden_statue' ? base + GOLDEN_STATUE_CHIP_BASE_GOLD * 2 : base);
        }, 0) / input.specialObjectPool.length
      : avgObjBase;

  const rewardNpcs = input.specialNpcPool.filter((k) => getSpecialNpcBaseGold(k) > 0);
  const avgRewardNpcBase =
    rewardNpcs.length > 0
      ? rewardNpcs.reduce((acc, k) => acc + getSpecialNpcBaseGold(k), 0) / rewardNpcs.length
      : 0;
  const rewardNpcRatio =
    input.specialNpcPool.length > 0 ? rewardNpcs.length / input.specialNpcPool.length : 0;

  const characterBias =
    input.spawnPattern === 'treasure_run'
      ? 0.34
      : input.spawnPattern === 'swarm' || input.spawnPattern === 'sprinter_rush'
        ? 0.66
        : 0.52;
  const avgGroupSize = input.spawnPattern === 'swarm' ? 2.22 : 1.84;

  const npcProb = input.specialNpcChance;
  const witchProb = (1 - npcProb) * input.witchChance;
  const normalProb = Math.max(0, 1 - npcProb - witchProb);
  const charProb = normalProb * characterBias;
  const objProb = normalProb * (1 - characterBias);

  const avgEffectiveObjBase =
    avgObjBase * (1 - input.specialObjectChance) + avgSpecialObjBase * input.specialObjectChance;

  const expectedRawTargetGold =
    spawnTicks *
    (charProb * avgGroupSize * avgEnemyBase * 1.07 +
      objProb * avgEffectiveObjBase +
      npcProb * rewardNpcRatio * avgRewardNpcBase * 0.85);

  // Bölüm içi bonus (gold_rush ~%25 olasılıkla her ~11 sn) + gold_rain etkinliği katkısı
  const expectedGoldRushCount = (effectivePlayTime / 11.2) * 0.25;
  const expectedGoldRainCount = input.levelEvent === 'gold_rain' ? effectivePlayTime / 22 : 0;
  const expectedRawExtraGold = expectedGoldRushCount * 22 + expectedGoldRainCount * 24;

  // Ortalama oyuncu isabet oranı (~%72) ve tipik orta seviye ekipman çarpanı (~1.16x)
  const expectedRawCollected = (expectedRawTargetGold * 0.72 + expectedRawExtraGold) * 1.16;

  const rawScale = expectedLevelGold / Math.max(1, expectedRawCollected);
  const levelGoldScale = Number(Math.max(0.42, Math.min(2.45, rawScale)).toFixed(3));

  return {
    levelGoldScale,
    expectedLevelGold,
    maxInLevelGold,
    completionBonusGold,
  };
}

export interface LevelVictorySettlement {
  runId: string;
  alreadySettled: boolean;
  collectedLevelGold: number;
  completionBonusGold: number;
  totalAwardedGold: number;
}

export interface LevelFailureSettlement {
  runId: string;
  lostTemporaryGold: number;
}

export class GoldEconomyManager {
  private runId = '';
  private levelId = 1;
  private isBossLevel = false;
  private levelGoldScale = 1.0;
  private expectedLevelGold = 120;
  private maxInLevelGold = 160;
  private completionBonusGold = 30;

  // YALNIZCA RAM'de tutulan bölüm içi geçici altın bakiyesi (kalıcı bakiyeye asla doğrudan eklenmez)
  private temporaryGold = 0;
  // Arenada henüz toplanmamış uçan sikkelerin tahsis edilen toplam değeri
  private pendingPickupGold = 0;
  // Boss vuruşlarından dağıtılan toplam altın (bütçe sınırını aşamaz)
  private bossHitGoldAllocated = 0;
  private bossHitGoldBudget = 0;
  private bossDefeatGoldBudget = 0;

  private sessionActive = false;
  private sessionSettled = false;
  private sessionFailed = false;

  // Çift ödeme / zincir patlama / aynı bölüm ödülü koruması
  private readonly allocatedSourceKeys = new Set<string>();
  private readonly collectedPickupKeys = new Set<string>();
  private readonly settledRunIds = new Set<string>();

  public beginLevelSession(runId: string, level: LevelConfig): void {
    this.runId = runId;
    this.levelId = level.id;
    this.isBossLevel = level.isBossLevel;
    this.levelGoldScale = Math.max(0.3, level.goldScale || 1.0);
    this.expectedLevelGold = Math.max(60, Math.round(level.expectedLevelGold || 120));
    this.maxInLevelGold = Math.max(
      this.expectedLevelGold,
      Math.round(level.maxInLevelGold || this.expectedLevelGold * 1.35),
    );
    this.completionBonusGold = Math.max(0, Math.round(level.completionBonusGold || 0));

    // Her yeni bölüm veya yeniden başlatmada geçici bakiye kesinlikle 0'lanır
    this.temporaryGold = 0;
    this.pendingPickupGold = 0;
    this.bossHitGoldAllocated = 0;
    if (level.isBossLevel && level.boss) {
      // Boss toplam bölüm içi altın bütçesi: %25 vuruşlardan + %75 yenilgi patlamasından
      const totalBossInLevel = Math.max(120, Math.round(level.boss.rewardGold));
      this.bossHitGoldBudget = Math.round(totalBossInLevel * 0.25);
      this.bossDefeatGoldBudget = Math.max(60, totalBossInLevel - this.bossHitGoldBudget);
    } else {
      this.bossHitGoldBudget = 0;
      this.bossDefeatGoldBudget = 0;
    }

    this.sessionActive = true;
    this.sessionSettled = false;
    this.sessionFailed = false;
    this.allocatedSourceKeys.clear();
    this.collectedPickupKeys.clear();
  }

  public resetSession(): void {
    this.runId = '';
    this.temporaryGold = 0;
    this.pendingPickupGold = 0;
    this.bossHitGoldAllocated = 0;
    this.bossHitGoldBudget = 0;
    this.bossDefeatGoldBudget = 0;
    this.sessionActive = false;
    this.sessionSettled = false;
    this.sessionFailed = false;
    this.allocatedSourceKeys.clear();
    this.collectedPickupKeys.clear();
  }

  public getRunId(): string {
    return this.runId;
  }

  public getLevelId(): number {
    return this.levelId;
  }

  public getTemporaryGold(): number {
    return this.temporaryGold;
  }

  public getPendingPickupGold(): number {
    return this.pendingPickupGold;
  }

  public getMaxInLevelGold(): number {
    return this.maxInLevelGold;
  }

  public getCompletionBonusGold(): number {
    return this.completionBonusGold;
  }

  public isSessionActive(): boolean {
    return this.sessionActive && !this.sessionSettled && !this.sessionFailed;
  }

  /**
   * Kalan bölüm içi geçici altın bütçesi (toplanan + havadaki sikkeler tavanı aşamaz).
   */
  private getRemainingCapBudget(): number {
    return Math.max(0, this.maxInLevelGold - (this.temporaryGold + this.pendingPickupGold));
  }

  private reserveAllocation(sourceKey: string, rawAmount: number): number {
    if (!this.isSessionActive()) return 0;
    if (!sourceKey || this.allocatedSourceKeys.has(sourceKey)) return 0;

    const remaining = this.getRemainingCapBudget();
    if (remaining <= 0) {
      this.allocatedSourceKeys.add(sourceKey);
      return 0;
    }

    const amount = Math.max(0, Math.min(remaining, Math.round(rawAmount)));
    this.allocatedSourceKeys.add(sourceKey);
    if (amount <= 0) return 0;

    this.pendingPickupGold += amount;
    return amount;
  }

  /**
   * Normal / Hızlı Düşman altın tahsisi.
   * Aynı hedef `target_${entityId}` anahtarıyla hem vuruş hem TNT patlamasında
   * yalnızca BİR KEZ altın üretebilir.
   */
  public allocateEnemyGold(
    entityId: number,
    kind: EnemyKind,
    isSprinter: boolean,
    upgrades: PlayerUpgrades,
    isCrit: boolean,
  ): number {
    const base = getEnemyBaseGold(kind, isSprinter);
    if (base <= 0) return 0;
    const mult = calculateGoldMultiplier(upgrades, isCrit);
    const raw = Math.max(2, Math.round(base * this.levelGoldScale * mult));
    return this.reserveAllocation(`target_${entityId}`, raw);
  }

  /**
   * Kırılabilir Nesne & Hazine Sandığı altın tahsisi (tekil ödeme, çift ödeme engelli).
   */
  public allocateBreakableGold(
    entityId: number,
    kind: BreakableKind,
    upgrades: PlayerUpgrades,
    isCrit: boolean,
    portion = 1.0,
  ): number {
    const base = getBreakableBaseGold(kind);
    if (base <= 0 || portion <= 0) return 0;
    const mult = calculateGoldMultiplier(upgrades, isCrit);
    const raw = Math.max(2, Math.round(base * portion * this.levelGoldScale * mult));
    return this.reserveAllocation(`target_${entityId}`, raw);
  }

  /**
   * Altın Heykel ara vuruşları (1. ve 2. vuruş) için küçük tekil parça altını.
   */
  public allocateBreakableChipGold(entityId: number, hitIndex: number): number {
    const raw = Math.max(2, Math.round(GOLDEN_STATUE_CHIP_BASE_GOLD * this.levelGoldScale));
    return this.reserveAllocation(`chip_${entityId}_${hitIndex}`, raw);
  }

  /**
   * Özel Ödül NPC'leri (Altın Tüccarı, Tavuk, Gezgin).
   * Yasaklı NPC'ler (Prenses, Kral, Rahip, Çocuk) her zaman 0 döner.
   */
  public allocateSpecialNpcGold(
    entityId: number,
    kind: SpecialNpcKind,
    upgrades: PlayerUpgrades,
    isCrit: boolean,
  ): number {
    const base = getSpecialNpcBaseGold(kind);
    if (base <= 0) return 0;
    const mult = calculateGoldMultiplier(upgrades, isCrit);
    const raw = Math.max(4, Math.round(base * this.levelGoldScale * mult));
    return this.reserveAllocation(`target_${entityId}`, raw);
  }

  /**
   * TNT ve Zincirleme Patlama altın tahsisi.
   * Düşman/kırılabilir nesneyle AYNI `target_${targetEntityId}` anahtarını kullanır:
   * - Aynı hedef hem vuruşla hem TNT ile iki kez altın veremez.
   * - Üst üste binen zincir patlamalarda her nesne yalnızca 1 kez hesaplanır.
   * - Kombo veya skor bonusları uygulanmaz (%65 taban değer * levelGoldScale).
   */
  public allocateTntBlastGold(
    targetEntityId: number,
    kind: { enemyKind?: EnemyKind; breakableKind?: BreakableKind; isSprinter?: boolean },
  ): number {
    let base = 0;
    if (kind.enemyKind) {
      base = getEnemyBaseGold(kind.enemyKind, Boolean(kind.isSprinter));
    } else if (kind.breakableKind) {
      base = getBreakableBaseGold(kind.breakableKind);
    }
    if (base <= 0) return 0;
    const raw = Math.max(2, Math.round(base * 0.65 * this.levelGoldScale));
    return this.reserveAllocation(`target_${targetEntityId}`, raw);
  }

  /**
   * `gold_rush` (Altın Bonusu) yerden alma ödülü — tek seferlik, üst üste katlanmaz.
   */
  public allocateBonusGold(bonusEntityId: number): number {
    // Bölüm hedeflenen altınının ~%8-%10'u kadar dengeli tekil bonus
    const raw = Math.max(12, Math.min(95, Math.round(this.expectedLevelGold * 0.085)));
    return this.reserveAllocation(`bonus_${bonusEntityId}`, raw);
  }

  /**
   * `gold_rain` bölüm etkinliği için 6 sikkeden oluşan toplam dengeli yağmur bütçesi.
   */
  public allocateGoldRainEventGold(eventSeq: number): number {
    const raw = Math.max(14, Math.min(90, Math.round(this.expectedLevelGold * 0.08)));
    return this.reserveAllocation(`event_gold_rain_${eventSeq}`, raw);
  }

  /**
   * Boss vuruşu başına saçılan altın (boss vuruş bütçesi ile sınırlıdır;
   * sınırsız vuruşla altın kasma engellenir).
   */
  public allocateBossHitGold(hitSeq: number, upgrades: PlayerUpgrades, isCrit: boolean): number {
    if (!this.isSessionActive() || !this.isBossLevel) return 0;
    const remainingBossHitBudget = Math.max(0, this.bossHitGoldBudget - this.bossHitGoldAllocated);
    if (remainingBossHitBudget <= 0) return 0;

    const mult = calculateGoldMultiplier(upgrades, isCrit);
    const perHitBase = Math.max(4, Math.round((this.bossHitGoldBudget / 12) * mult));
    const capped = Math.min(remainingBossHitBudget, perHitBase);
    const allocated = this.reserveAllocation(`boss_hit_${hitSeq}`, capped);
    this.bossHitGoldAllocated += allocated;
    return allocated;
  }

  /**
   * Boss yenilgi ödülü (yalnızca geçici bölüm bakiyesi için tahsis edilir;
   * kalıcı bakiyeye ancak bölüm zaferi onaylandığında aktarılır!).
   * Aynı boss iki kez öldürülse veya iki callback tetiklense bile yalnızca 1 kez verilir.
   */
  public allocateBossDefeatGold(bossId: string, upgrades: PlayerUpgrades): number {
    if (!this.isSessionActive() || !this.isBossLevel) return 0;
    // Silah / muska bonusu boss yenilgisinde kontrollü +%0..+%15 tavan uygular
    const gearMult = 1 + Math.min(0.15, (calculateGoldMultiplier(upgrades, false) - 1) * 0.25);
    // Vuruş bütçesinden kullanılmamış pay da yenilgi patlamasına eklenerek oyuncu adil ödül alır
    const unusedHitBudget = Math.max(0, this.bossHitGoldBudget - this.bossHitGoldAllocated);
    const targetRaw = Math.round((this.bossDefeatGoldBudget + unusedHitBudget) * gearMult);
    return this.reserveAllocation(`boss_defeat_${bossId}`, targetRaw);
  }

  /**
   * Şövalye yerden/havadan bir sikke veya kese topladığında yalnızca geçici bakiyeyi artırır.
   * Kalıcı bakiyeye ASLA dokunmaz. Aynı pickup kimliği ikinci kez toplanamaz.
   */
  public collectPickupGold(pickupId: number, value: number): number {
    if (!this.isSessionActive()) return 0;
    const key = `pickup_${pickupId}`;
    if (this.collectedPickupKeys.has(key)) return 0;
    this.collectedPickupKeys.add(key);

    const safeVal = Math.max(0, Math.round(value));
    if (safeVal <= 0) return 0;

    this.pendingPickupGold = Math.max(0, this.pendingPickupGold - safeVal);
    const headroom = Math.max(0, this.maxInLevelGold - this.temporaryGold);
    const added = Math.min(headroom, safeVal);
    this.temporaryGold += added;
    return added;
  }

  /**
   * Bölüm başarıyla tamamlandığında havada şövalyeye uçmakta olan sikkeleri
   * geçici bakiyeye tek seferde dahil eder (çift toplama olmadan).
   */
  public flushRemainingPickupsOnVictory(
    remainingPickups: ReadonlyArray<{ id: number; value: number; collected: boolean }>,
  ): number {
    if (!this.isSessionActive()) return 0;
    let totalAdded = 0;
    for (const p of remainingPickups) {
      if (p.collected || p.value <= 0) continue;
      totalAdded += this.collectPickupGold(p.id, p.value);
    }
    this.pendingPickupGold = 0;
    return totalAdded;
  }

  /**
   * BÖLÜM BAŞARILI TAMAMLANDIĞINDA TEK SEFERLİK ATOMİK ÖDÜL HESAPLAMASI:
   * - `collectedLevelGold` (geçici bakiye) + `completionBonusGold` toplamını döndürür.
   * - Aynı `runId` için ikinci kez çağrılırsa `alreadySettled: true` ve `0` döner.
   * - Aktarım sonrasında geçici bakiye temizlenir.
   */
  public settleLevelVictory(runId: string = this.runId): LevelVictorySettlement {
    const effectiveRunId = runId || this.runId;
    if (
      !effectiveRunId ||
      this.sessionSettled ||
      this.sessionFailed ||
      this.settledRunIds.has(effectiveRunId)
    ) {
      return {
        runId: effectiveRunId,
        alreadySettled: true,
        collectedLevelGold: 0,
        completionBonusGold: 0,
        totalAwardedGold: 0,
      };
    }

    const collectedLevelGold = Math.max(0, Math.floor(this.temporaryGold));
    const completionBonusGold = Math.max(0, Math.floor(this.completionBonusGold));
    const totalAwardedGold = collectedLevelGold + completionBonusGold;

    this.settledRunIds.add(effectiveRunId);
    this.sessionSettled = true;
    this.sessionActive = false;
    this.temporaryGold = 0;
    this.pendingPickupGold = 0;

    return {
      runId: effectiveRunId,
      alreadySettled: false,
      collectedLevelGold,
      completionBonusGold,
      totalAwardedGold,
    };
  }

  /**
   * BÖLÜM BAŞARISIZ OLDUĞUNDA:
   * - O bölümde toplanan TÜM geçici altınlar tamamen silinir.
   * - Kalıcı bakiyeye HİÇBİR şey aktarılmaz.
   * - Aynı `runId` sonradan yanlışlıkla başarıyla kapatılamaz.
   */
  public failLevelSession(): LevelFailureSettlement {
    const lostTemporaryGold = Math.max(0, Math.floor(this.temporaryGold));
    this.temporaryGold = 0;
    this.pendingPickupGold = 0;
    this.sessionFailed = true;
    this.sessionActive = false;
    return {
      runId: this.runId,
      lostTemporaryGold,
    };
  }
}
