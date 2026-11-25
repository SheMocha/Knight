export const VICTORY_CINEMATIC_DURATION = 3.0;
export const VICTORY_CINEMATIC_FAILSAFE_MS = 3600;

export interface VictoryCinematicStartOptions {
  startX: number;
  startY: number;
  cameraRight: number;
  minSafeMarginRight?: number;
  desiredTravelDistance?: number;
}

export interface VictoryCinematicFrame {
  active: boolean;
  completed: boolean;
  justCompleted: boolean;
  elapsed: number;
  progress: number;
  knightX: number;
  knightY: number;
  walkAnimSpeed: number;
  worldScrollScale: number;
  envDim: number;
  silhouetteBrightness: number;
  screenFadeAlpha: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/**
 * Bölüm başarıyla tamamlandığında 3 saniyelik sinematik bitiş animasyonunu
 * frame-rate bağımsız (delta-time) olarak yönetir.
 *
 * 0.0 - 1.0 sn: Şövalye doğal yürüyüşle ileri yürür (sahne normal parlaklıkta).
 * 1.0 - 2.0 sn: Şövalye yürümeye devam eder, çevre ve sahne ışığı yumuşakça kararır.
 * 2.0 - 3.0 sn: Şövalye silüeti karanlıkta kaybolur, ekran tamamen siyaha geçer.
 */
export class VictoryCinematicController {
  private active = false;
  private completed = false;
  private completionEmitted = false;
  private elapsed = 0;

  private startX = 0;
  private targetX = 0;
  private startY = 0;
  private travelRatio = 1;

  public isActive(): boolean {
    return this.active;
  }

  public isCompleted(): boolean {
    return this.completed;
  }

  public getElapsed(): number {
    return this.elapsed;
  }

  public reset(): void {
    this.active = false;
    this.completed = false;
    this.completionEmitted = false;
    this.elapsed = 0;
    this.startX = 0;
    this.targetX = 0;
    this.startY = 0;
    this.travelRatio = 1;
  }

  /**
   * Sinematik çıkışı yalnızca bir kez başlatır; aktifken veya tamamlanmışken tekrar çağrılırsa yoksayılır.
   */
  public start(options: VictoryCinematicStartOptions): boolean {
    if (this.active || this.completed) {
      return false;
    }

    const safeMargin = options.minSafeMarginRight ?? 1.75;
    const desiredTravel = options.desiredTravelDistance ?? 3.6;
    const maxSafeX = options.cameraRight - safeMargin;

    this.startX = options.startX;
    this.startY = Math.max(0, options.startY);

    // Şövalye asla ekran dışına çıkmaz veya sahne sınırına sıkışmaz
    const clampedTarget = Math.min(this.startX + desiredTravel, maxSafeX);
    this.targetX = Math.max(this.startX, clampedTarget);

    const actualTravel = Math.max(0, this.targetX - this.startX);
    this.travelRatio = desiredTravel > 0 ? clamp01(actualTravel / desiredTravel) : 0;

    this.active = true;
    this.completed = false;
    this.completionEmitted = false;
    this.elapsed = 0;
    return true;
  }

  public step(dt: number): VictoryCinematicFrame {
    if (!this.active && !this.completed) {
      return {
        active: false,
        completed: false,
        justCompleted: false,
        elapsed: 0,
        progress: 0,
        knightX: this.startX,
        knightY: 0,
        walkAnimSpeed: 0,
        worldScrollScale: 0,
        envDim: 0,
        silhouetteBrightness: 1,
        screenFadeAlpha: 0,
      };
    }

    if (this.active) {
      const safeDt = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.15) : 0;
      this.elapsed = Math.min(VICTORY_CINEMATIC_DURATION, this.elapsed + safeDt);
      if (this.elapsed >= VICTORY_CINEMATIC_DURATION) {
        this.active = false;
        this.completed = true;
      }
    }

    const justCompleted = this.completed && !this.completionEmitted;
    if (justCompleted) {
      this.completionEmitted = true;
    }

    return this.evaluate(justCompleted);
  }

  /**
   * Sekme arka plana alındığında veya RAF geciktiğinde kilitlenmeyi önlemek için güvenli bitiş.
   */
  public forceComplete(): VictoryCinematicFrame {
    if (!this.active && !this.completed) {
      return this.step(0);
    }
    this.elapsed = VICTORY_CINEMATIC_DURATION;
    this.active = false;
    this.completed = true;
    const justCompleted = !this.completionEmitted;
    this.completionEmitted = true;
    return this.evaluate(justCompleted);
  }

  public getCurrentFrame(): VictoryCinematicFrame {
    return this.evaluate(false);
  }

  private evaluate(justCompleted: boolean): VictoryCinematicFrame {
    const t = this.elapsed;
    const progress = clamp01(t / VICTORY_CINEMATIC_DURATION);

    // Doğal ve akıcı ileri yürüyüş: başta net ivme, sonda yumuşak sönümleme
    const walkEase = 1 - Math.pow(1 - progress, 1.45);
    const knightX = this.startX + (this.targetX - this.startX) * walkEase;

    // Eğer şövalye havada zafer kazandıysa (ör. boss zıplaması) ilk 0.28 saniyede yumuşakça zemine iner
    const groundBlend = smoothstep(0, 0.28, t);
    const knightY = this.startY * (1 - groundBlend);

    // 0-1sn: 0.88x doğal yürüyüş, 1-2sn: 0.82x, 2-3sn: 0.52x'e yumuşakça yavaşlama
    const walkAnimSpeed =
      t < 1.0
        ? 0.88
        : t < 2.0
          ? 0.88 - smoothstep(1.0, 2.0, t) * 0.08
          : 0.8 - smoothstep(2.0, 3.0, t) * 0.28;

    // Şövalye sağ sınıra yakınsa dünya paralaksı hafifçe daha fazla akar, böylece yürüyüş hissi asla takılmaz
    const baseScroll = 0.24 + (1 - this.travelRatio) * 0.26;
    const worldScrollScale = baseScroll * (1 - smoothstep(1.75, 2.95, t));

    // 1-2sn: Arka plan, çevre ve sahne ışığı kademeli kararır (0 -> 0.78), 2-3sn: 0.78 -> 1.0
    const phase2Env = smoothstep(1.0, 2.0, t) * 0.78;
    const phase3Env = smoothstep(2.0, 2.85, t) * 0.22;
    const envDim = clamp01(phase2Env + phase3Env);

    // 0-1sn: 1.0, 1-2sn: 1.0 -> 0.72 (arka plan kararırken silüet belirgin kalır), 2-3sn: 0.72 -> 0.0
    const silhouetteBrightness =
      t <= 1.0
        ? 1.0
        : t <= 2.0
          ? 1.0 - smoothstep(1.0, 2.0, t) * 0.28
          : 0.72 * (1 - smoothstep(2.0, 2.85, t));

    // 0-1.15sn: 0, 1.15-2.0sn: 0 -> 0.22 (yumuşak giriş), 2.0-2.95sn: 0.22 -> 1.0 (tam siyah)
    const screenFadeAlpha = clamp01(
      smoothstep(1.15, 2.0, t) * 0.22 + smoothstep(2.0, 2.95, t) * 0.78,
    );

    return {
      active: this.active,
      completed: this.completed,
      justCompleted,
      elapsed: t,
      progress,
      knightX,
      knightY,
      walkAnimSpeed,
      worldScrollScale,
      envDim,
      silhouetteBrightness: clamp01(silhouetteBrightness),
      screenFadeAlpha,
    };
  }
}
