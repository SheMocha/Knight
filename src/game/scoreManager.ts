import { getBreakableSpec } from './BreakableCatalog';
import { getSpecialNpcSpec } from './SpecialNpcs';
import {
  BossConfig,
  BreakableKind,
  EnemyKind,
  LevelConfig,
  LevelEventKind,
  SpawnPatternKind,
  SpecialNpcKind,
} from './types';

/**
 * MERKEZİ SKOR SİSTEMİ (ScoreManager)
 * -------------------------------------------------------------------------
 * Oyundaki tüm puan hesaplamalarını, kombo eğrisini, bonus katkısını,
 * tekil varlık çift-puan engellemesini (deduplication) ve gerçek bölüm
 * maksimum skor üst sınırını (maxScore) tek bir merkezden yönetir.
 *
 * Kurallar:
 * 1. Çarpanlar üstel olarak birikmez; toplamsal (additive) havuz + kesin
 *    üst çarpan tavanı (MAX_TOTAL_SCORE_MULTIPLIER = 2.15x) uygulanır.
 * 2. Her bölümün kendi `scoreTarget` ve `maxScore` sınırı vardır (~1.21x).
 * 3. `score >= maxScore` olduğunda puan ekleme GERÇEK hesaplama katmanında
 *    durur; oyun akışı, saldırılar, animasyonlar ve altın toplama sürer.
 * 4. Aynı hedef / olay bir kez puanlanır (`dedupeKey`).
 */

export const MAX_TOTAL_SCORE_MULTIPLIER = 2.15;
export const MIN_TOTAL_SCORE_MULTIPLIER = 0.75;
export const MAX_COMBO_BONUS_LEVEL = 15;

export const ENEMY_BASE_POINTS: Record<EnemyKind, number> = {
  villager: 90,
  merchant: 125,
  guard: 155,
  witch: 0,
};

export function getEnemyBasePoints(kind: EnemyKind, isSprinter: boolean): number {
  const base = ENEMY_BASE_POINTS[kind] ?? 0;
  if (base <= 0) return 0;
  return isSprinter ? Math.round(base * 1.25) : base;
}

/**
 * Kontrollü, azalan getirili kombo puan yüzdesi (en fazla +%41).
 * Hem oyun motoru hem de HUD bu tek fonksiyonu kullanır.
 */
export function getComboScoreBonusPct(combo: number): number {
  const c = Math.max(0, Math.floor(combo));
  if (c <= 1) return 0;
  if (c <= 5) {
    // x2: +4%, x3: +8%, x4: +12%, x5: +16%
    return (c - 1) * 4;
  }
  if (c <= 10) {
    // x6: +19%, x7: +22%, x8: +25%, x9: +28%, x10: +31%
    return 16 + (c - 5) * 3;
  }
  // x11: +33%, x12: +35%, x13: +37%, x14: +39%, x15+: +41%
  return 31 + Math.min(5, c - 10) * 2;
}

export interface HitScoreParams {
  basePoints: number;
  levelScoreScale: number;
  swingPower: number; // 0..1
  isCrit: boolean;
  combo: number;
  weaponPowerMult: number;
  hasPowerSurge: boolean;
  doubleScoreActive: boolean;
}

export function calculateHitScoreMultiplier(params: Omit<HitScoreParams, 'basePoints' | 'levelScoreScale'>): number {
  const powerMod = params.isCrit
    ? 0.25
    : -0.15 + Math.max(0, Math.min(1, params.swingPower)) * 0.25;
  const comboMod = getComboScoreBonusPct(params.combo) / 100;
  const weaponMod = Math.max(0, params.weaponPowerMult - 1) * 0.12;
  const surgeMod = params.hasPowerSurge ? 0.1 : 0;
  const doubleMod = params.doubleScoreActive ? 0.85 : 0;

  const rawMult = 1 + powerMod + comboMod + weaponMod + surgeMod + doubleMod;
  return Math.max(MIN_TOTAL_SCORE_MULTIPLIER, Math.min(MAX_TOTAL_SCORE_MULTIPLIER, rawMult));
}

export function calculateHitPoints(params: HitScoreParams): number {
  if (params.basePoints <= 0) return 0;
  const mult = calculateHitScoreMultiplier(params);
  return Math.max(15, Math.round(params.basePoints * params.levelScoreScale * mult));
}

export function calculateSpecialNpcPoints(
  basePoints: number,
  levelScoreScale: number,
  doubleScoreActive: boolean,
): number {
  if (basePoints <= 0) return 0;
  const mult = doubleScoreActive ? 1.45 : 1.0;
  return Math.max(20, Math.round(basePoints * levelScoreScale * mult));
}

export function calculateChipPoints(
  kind: 'low_power_crack' | 'statue_chip',
  levelScoreScale: number,
): number {
  const raw = kind === 'statue_chip' ? 45 : 16;
  return Math.max(10, Math.round(raw * levelScoreScale));
}

export function calculateMultiSmashBonus(
  smashedCount: number,
  levelScoreScale: number,
): number {
  if (smashedCount < 2) return 0;
  const raw = smashedCount >= 3 ? 60 : 32;
  return Math.max(15, Math.round(raw * levelScoreScale));
}

export function calculateTntBlastTargetPoints(
  targetBasePoints: number,
  levelScoreScale: number,
): number {
  if (targetBasePoints <= 0) return 0;
  return Math.max(15, Math.round(targetBasePoints * 0.65 * levelScoreScale));
}

export function calculateExtraPointsPickup(
  scoreTarget: number,
  doubleScoreActive: boolean,
): number {
  const ratio = doubleScoreActive ? 0.055 : 0.04;
  return Math.max(80, Math.round((scoreTarget * ratio) / 10) * 10);
}

export function calculateBossHitPoints(damage: number): number {
  return Math.max(10, Math.round(damage * 0.75));
}

export type ScoreSource =
  | 'enemy_hit'
  | 'breakable_smash'
  | 'special_npc'
  | 'multi_hit_chip'
  | 'low_power_crack'
  | 'multi_smash_bonus'
  | 'tnt_blast'
  | 'interactive_flavor'
  | 'extra_points_bonus'
  | 'boss_hit'
  | 'boss_defeat';

export interface ScoreAddResult {
  added: number;
  requested: number;
  totalScore: number;
  maxScore: number;
  scoreTarget: number;
  remainingToTarget: number;
  capped: boolean;
  justCapped: boolean;
  duplicateBlocked: boolean;
}

export class ScoreManager {
  private score = 0;
  private scoreTarget = 3000;
  private maxScore = 3600;
  private levelScoreScale = 1.0;
  private isBossLevel = false;
  private scoredKeys = new Set<string>();

  public reset(
    config: Pick<LevelConfig, 'scoreTarget' | 'maxScore' | 'levelScoreScale' | 'isBossLevel'>,
  ): void {
    this.score = 0;
    this.scoreTarget = Math.max(1, Math.round(config.scoreTarget));
    this.maxScore = Math.max(this.scoreTarget, Math.round(config.maxScore));
    this.levelScoreScale = Math.max(0.25, config.levelScoreScale || 1.0);
    this.isBossLevel = Boolean(config.isBossLevel);
    this.scoredKeys.clear();
  }

  public getScore(): number {
    return this.score;
  }

  public getScoreTarget(): number {
    return this.scoreTarget;
  }

  public getMaxScore(): number {
    return this.maxScore;
  }

  public getLevelScoreScale(): number {
    return this.levelScoreScale;
  }

  public getRemainingToTarget(): number {
    return Math.max(0, this.scoreTarget - this.score);
  }

  public isTargetMet(): boolean {
    return this.score >= this.scoreTarget;
  }

  public isCapped(): boolean {
    return this.score >= this.maxScore;
  }

  public hasScoredKey(key: string): boolean {
    return this.scoredKeys.has(key);
  }

  public addPoints(
    rawAmount: number,
    _source: ScoreSource,
    dedupeKey?: string,
  ): ScoreAddResult {
    const requested = Math.max(0, Math.round(rawAmount));
    if (dedupeKey && this.scoredKeys.has(dedupeKey)) {
      return {
        added: 0,
        requested,
        totalScore: this.score,
        maxScore: this.maxScore,
        scoreTarget: this.scoreTarget,
        remainingToTarget: this.getRemainingToTarget(),
        capped: this.isCapped(),
        justCapped: false,
        duplicateBlocked: true,
      };
    }

    if (dedupeKey) {
      this.scoredKeys.add(dedupeKey);
    }

    const wasCapped = this.score >= this.maxScore;
    const headroom = Math.max(0, this.maxScore - this.score);
    const added = Math.min(requested, headroom);
    this.score += added;
    const nowCapped = this.score >= this.maxScore;

    return {
      added,
      requested,
      totalScore: this.score,
      maxScore: this.maxScore,
      scoreTarget: this.scoreTarget,
      remainingToTarget: this.getRemainingToTarget(),
      capped: nowCapped,
      justCapped: !wasCapped && nowCapped,
      duplicateBlocked: false,
    };
  }

  public addHitScore(
    params: Omit<HitScoreParams, 'levelScoreScale'>,
    source: 'enemy_hit' | 'breakable_smash',
    entityId: number,
  ): ScoreAddResult {
    const pts = calculateHitPoints({
      ...params,
      levelScoreScale: this.levelScoreScale,
    });
    return this.addPoints(pts, source, `target_${entityId}`);
  }

  public addSpecialNpcScore(
    basePoints: number,
    doubleScoreActive: boolean,
    entityId: number,
  ): ScoreAddResult {
    const pts = calculateSpecialNpcPoints(basePoints, this.levelScoreScale, doubleScoreActive);
    return this.addPoints(pts, 'special_npc', `target_${entityId}`);
  }

  public addChipScore(
    kind: 'low_power_crack' | 'statue_chip',
    entityId: number,
    hitIndex: number,
  ): ScoreAddResult {
    const pts = calculateChipPoints(kind, this.levelScoreScale);
    return this.addPoints(
      pts,
      kind === 'statue_chip' ? 'multi_hit_chip' : 'low_power_crack',
      `chip_${kind}_${entityId}_${hitIndex}`,
    );
  }

  public addMultiSmashBonus(smashedCount: number, swingSeq: number): ScoreAddResult {
    const pts = calculateMultiSmashBonus(smashedCount, this.levelScoreScale);
    return this.addPoints(pts, 'multi_smash_bonus', `multi_${swingSeq}`);
  }

  public addTntBlastTargetScore(targetBasePoints: number, targetEntityId: number): ScoreAddResult {
    const pts = calculateTntBlastTargetPoints(targetBasePoints, this.levelScoreScale);
    return this.addPoints(pts, 'tnt_blast', `target_${targetEntityId}`);
  }

  public addInteractiveFlavorScore(rawBase: number, entityKey: string): ScoreAddResult {
    const pts = Math.max(15, Math.round(rawBase * this.levelScoreScale));
    return this.addPoints(pts, 'interactive_flavor', entityKey);
  }

  public addExtraPointsBonus(doubleScoreActive: boolean, bonusEntityId: number): ScoreAddResult {
    const pts = calculateExtraPointsPickup(this.scoreTarget, doubleScoreActive);
    return this.addPoints(pts, 'extra_points_bonus', `bonus_${bonusEntityId}`);
  }

  public addBossHitScore(damage: number, bossRewardScore: number): ScoreAddResult {
    const pts = calculateBossHitPoints(damage);
    // Boss ölmeden önceki vuruş skorları, zafer ödülüne yer kalacak şekilde dengelenir
    const preDefeatCap = this.isBossLevel
      ? Math.max(this.score, this.maxScore - Math.round(bossRewardScore * 0.72))
      : this.maxScore;
    const allowed = Math.max(0, Math.min(pts, preDefeatCap - this.score));
    return this.addPoints(allowed, 'boss_hit');
  }

  public addBossDefeatScore(bossRewardScore: number, bossId: string): ScoreAddResult {
    return this.addPoints(bossRewardScore, 'boss_defeat', `boss_defeat_${bossId}`);
  }
}

/**
 * 60 BÖLÜMÜN TAMAMI İÇİN ANALİTİK SKOR KALİBRASYONU
 * -------------------------------------------------------------------------
 * Her bölümün gerçek süresini, spawn aralığını, dalga desenini (swarm,
 * treasure_run, sprinter_rush, hazard_gauntlet), cadı/yasaklı NPC oranını ve
 * obje/düşman havuzlarını hesaba katarak:
 * - `scoreTarget`: Adil, kademeli bölüm hedefi (örn. Bölüm 35: 19.000)
 * - `maxScore`: Kesin üst skor sınırı (~1.21x -> 19.000 için 23.000)
 * - `levelScoreScale`: Ortalama oyunda ~%82-%94, iyi oyunda ~%100-%112,
 *   çok iyi oyunda ~%112-%121 (tavan) getirecek kalibrasyon ölçeği.
 */
export interface LevelCalibrationInput {
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

export interface LevelScoreCalibration {
  scoreTarget: number;
  maxScore: number;
  levelScoreScale: number;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function estimateExpectedRawBasePoints(input: LevelCalibrationInput): number {
  // Son ~3.2 saniyede doğan hedefler şövalyeye yetişemeden süre biter;
  // ayrıca bölüm başına ortalama 2.5 sürpriz cadı ~0.72sn bekleme ekler.
  const activeTime = Math.max(18, input.timeLimit - 3.2 - 2.5 * 0.72);

  // Dalga başına ortalama grup büyüklüğü ve nefes alma süresi
  const characterBias =
    input.spawnPattern === 'treasure_run'
      ? 0.34
      : input.spawnPattern === 'swarm' || input.spawnPattern === 'sprinter_rush'
        ? 0.66
        : 0.52;

  const avgGroupSize = input.spawnPattern === 'swarm' ? 0.2 * 1 + 0.38 * 2 + 0.42 * 3 : 0.4 * 1 + 0.36 * 2 + 0.24 * 3;
  const avgGroupBreathing =
    input.spawnPattern === 'swarm'
      ? 0.38 * 0.24 + 0.42 * 0.5
      : 0.36 * 0.24 + 0.24 * 0.5;

  // Özel NPC ve cadı arka arkaya gelmediğinden efektif olasılıklar biraz düşer
  const effSpecialNpcProb = input.specialNpcPool.length > 0 ? input.specialNpcChance * 0.88 : 0;
  const effWitchProb = (1 - effSpecialNpcProb) * input.witchChance * 0.88;
  const normalWaveProb = Math.max(0.25, 1 - effSpecialNpcProb - effWitchProb);

  const avgWaveDuration = Math.max(
    0.62,
    input.spawnInterval + 0.06 + normalWaveProb * characterBias * avgGroupBreathing,
  );
  const totalWaves = activeTime / avgWaveDuration;

  // 1) Özel ödül NPC'lerinden beklenen ham puan
  const avgNpcPts = avg(
    input.specialNpcPool.map((k) => {
      const spec = getSpecialNpcSpec(k);
      return spec.forbidden ? 0 : spec.bonusPoints;
    }),
  );

  // 2) Düşman dalgalarından beklenen ham puan
  const sprintRate = input.spawnPattern === 'sprinter_rush' ? 0.68 : 0.42;
  const avgEnemyPts = avg(
    input.characterPool.map((k) => {
      const base = ENEMY_BASE_POINTS[k] ?? 0;
      return base * (1 + (sprintRate / avgGroupSize) * 0.25);
    }),
  );
  const avgEnemyWavePts = avgGroupSize * avgEnemyPts;

  // 3) Kırılabilir çevre + 13 özel etkileşimli objeden beklenen ham puan
  const avgNormalObjPts = avg(input.objectPool.map((k) => getBreakableSpec(k).basePoints));
  const avgSpecialObjPts =
    input.specialObjectPool.length > 0
      ? avg(input.specialObjectPool.map((k) => getBreakableSpec(k).basePoints))
      : avgNormalObjPts;
  const avgObjPts =
    avgNormalObjPts * (1 - input.specialObjectChance) +
    avgSpecialObjPts * input.specialObjectChance;

  const expectedPerWave =
    effSpecialNpcProb * avgNpcPts +
    normalWaveProb * (characterBias * avgEnemyWavePts + (1 - characterBias) * avgObjPts);

  // Etkinlik katkısı (tnt_chain biraz daha fazla obje getirir)
  const eventFactor = input.levelEvent === 'tnt_chain' ? 1.05 : 1.0;

  return Math.max(1500, totalWaves * expectedPerWave * eventFactor);
}

export function computeLevelScoreCalibration(input: LevelCalibrationInput): LevelScoreCalibration {
  if (input.isBossLevel && input.boss) {
    // Boss bölümlerinde hedef = boss zafer puanı + temel hasar puanı, üst sınır = ~1.18x
    const expectedHitPts = Math.round(input.boss.maxHp * 0.72);
    const scoreTarget = Math.round((input.boss.rewardScore + expectedHitPts * 0.5) / 100) * 100;
    const maxScore = Math.round((scoreTarget * 1.18) / 100) * 100;
    return {
      scoreTarget,
      maxScore,
      levelScoreScale: 1.0,
    };
  }

  const progress = (input.id - 1) / Math.max(1, input.totalLevels - 1);
  // Kademeli 60 bölüm eğrisi:
  // Bölüm 1: 3.000 | Bölüm 18: ~10.800 | Bölüm 35: 19.000 (maks 23.000) | Bölüm 59: 31.000
  const rawTarget = 3000 + (input.id - 1) * 415 + Math.pow(progress, 1.35) * 3950;
  const scoreTarget = Math.round(rawTarget / 100) * 100;

  // Her bölümde maksimum skor, hedefin ~%121'idir (19.000 -> 23.000)
  const maxScore = Math.round((scoreTarget * 1.21) / 100) * 100;

  // Kalibrasyon faktörü:
  // İyi bir oyuncu (~%80 isabet, ortalama ~1.22x çarpan + ~%6 bonus/çoklu vuruş)
  // rawBasePoints * 1.04 civarında ham getiri yakalar -> hedefi makul performansla geçer.
  const expectedRawPool = estimateExpectedRawBasePoints(input);
  const GOOD_PLAY_CAPTURE_RATIO = 1.06;
  const levelScoreScale = Number(
    Math.max(0.45, scoreTarget / Math.max(1, expectedRawPool * GOOD_PLAY_CAPTURE_RATIO)).toFixed(3),
  );

  return {
    scoreTarget,
    maxScore,
    levelScoreScale,
  };
}
