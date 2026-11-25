import * as THREE from 'three';
import { BossConfig, BossHudState, BossId } from './types';

const INK = '#0a0910';

interface BossHazard {
  active: boolean;
  kind: 'shockwave' | 'projectile' | 'meteor' | 'fire_breath';
  mesh: THREE.Mesh;
  warnRing: THREE.Mesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  telegraph: number; // >0 iken uyarı aşaması, zarar vermez
}

export interface BossUpdateContext {
  dt: number;
  elapsed: number;
  knightX: number;
  knightY: number;
  knightStunned: boolean;
  knightInvuln: boolean;
  onKnightHitHazard: (pushDir: number, label: string) => void;
  onBossPopup: (text: string, x: number, y: number, color: string, scale?: number) => void;
  onBossRoar: () => void;
  onBossDefeated: (x: number, y: number) => void;
}

const bossTexCache = new Map<string, THREE.CanvasTexture>();

function createBossTexture(boss: BossConfig): THREE.CanvasTexture {
  const key = `boss_${boss.id}`;
  const cached = bossTexCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const cx = 256;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 10;

  // Güçlü gölge
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, 474, 150, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  if (boss.id === 'crimson_dragon') {
    // 60. BÖLÜM FİNAL BOSS: KADİM KIZIL EJDERHA LORDU!
    // Devasa açılmış ejderha kanatları
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(256, 220);
    ctx.lineTo(44, 70);
    ctx.lineTo(86, 230);
    ctx.lineTo(148, 198);
    ctx.lineTo(176, 268);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(256, 220);
    ctx.lineTo(476, 62);
    ctx.lineTo(436, 240);
    ctx.lineTo(366, 202);
    ctx.lineTo(340, 272);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kuyruk
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(310, 380);
    ctx.quadraticCurveTo(430, 410, 470, 320);
    ctx.lineTo(430, 354);
    ctx.quadraticCurveTo(395, 438, 300, 426);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gövde & altın karın zırhı
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(270, 332, 98, 118, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(238, 344, 52, 86, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Uzun boyun ve sola bakan dev ejderha kafası
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(196, 270);
    ctx.quadraticCurveTo(146, 210, 152, 146);
    ctx.lineTo(222, 146);
    ctx.quadraticCurveTo(234, 216, 262, 262);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ejderha başı + boynuzlar + alevli çene
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(58, 162);
    ctx.lineTo(156, 118);
    ctx.lineTo(232, 148);
    ctx.lineTo(212, 206);
    ctx.lineTo(74, 204);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boynuzlar
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(188, 128);
    ctx.lineTo(256, 54);
    ctx.lineTo(222, 144);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parlayan göz ve ağız içi kor alev
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(134, 152, 16, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(82, 192, 16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // 5 Destansı İnsansı / Golem Boss (Pazar Baronu, Demir Komutan, Altın Golem, Çöl Firavunu, Mezarlık Lordu)
    // Geniş pelerin
    ctx.fillStyle = boss.id === 'grave_lord' ? '#3b0764' : boss.id === 'desert_pharaoh' ? '#78350f' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(152, 184);
    ctx.lineTo(360, 184);
    ctx.lineTo(418, 464);
    ctx.lineTo(94, 464);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dev zırhlı gövde
    ctx.fillStyle = boss.primaryColor;
    ctx.beginPath();
    ctx.roundRect(142, 180, 228, 212, 34);
    ctx.fill();
    ctx.stroke();

    // Dev omuzluklar
    ctx.fillStyle = boss.accentColor;
    ctx.beginPath();
    ctx.arc(138, 212, 52, 0, Math.PI * 2);
    ctx.arc(374, 212, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Göğüs amblemi / çekirdek
    ctx.fillStyle = boss.accentColor;
    ctx.beginPath();
    ctx.moveTo(cx, 228);
    ctx.lineTo(cx + 42, 286);
    ctx.lineTo(cx, 344);
    ctx.lineTo(cx - 42, 286);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bacaklar
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(168, 384, 62, 84);
    ctx.strokeRect(168, 384, 62, 84);
    ctx.fillRect(282, 384, 62, 84);
    ctx.strokeRect(282, 384, 62, 84);

    // Boss Kafası & Taç/Miğfer
    ctx.fillStyle = boss.id === 'grave_lord' ? '#e2e8f0' : boss.primaryColor;
    ctx.beginPath();
    ctx.arc(cx, 134, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Taç / başlık
    ctx.fillStyle = boss.accentColor;
    ctx.beginPath();
    ctx.moveTo(192, 92);
    ctx.lineTo(208, 26);
    ctx.lineTo(cx, 66);
    ctx.lineTo(304, 26);
    ctx.lineTo(320, 92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parlayan öfkeli gözler (sola bakar)
    ctx.fillStyle = boss.id === 'royal_golem' || boss.id === 'desert_pharaoh' ? '#22d3ee' : '#fef08a';
    ctx.beginPath();
    ctx.ellipse(224, 136, 15, 10, 0.2, 0, Math.PI * 2);
    ctx.ellipse(268, 136, 15, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Sola uzanan dev Boss Silahı (balta / asa / gürz)
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(126, 260);
    ctx.lineTo(48, 128);
    ctx.stroke();
    ctx.fillStyle = boss.accentColor;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(48, 118, 38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  bossTexCache.set(key, tex);
  return tex;
}

export class BossController {
  private readonly parent: THREE.Object3D;
  private readonly config: BossConfig;
  private readonly root: THREE.Group;
  private readonly spriteMat: THREE.MeshBasicMaterial;
  private readonly auraRing: THREE.Mesh;
  private readonly hazards: BossHazard[] = [];
  private readonly sharedGeos: THREE.BufferGeometry[] = [];
  private readonly sharedMats: THREE.Material[] = [];

  public hp: number;
  public readonly maxHp: number;
  public x = 5.6;
  public y = 0;
  public phase = 1;
  public defeated = false;

  private homeX = 5.6;
  private hitFlash = 0;
  private attackCooldown = 2.0;
  private activeAttack: 'idle' | 'charge' | 'slam' | 'volley' | 'meteor' | 'breath' = 'idle';
  private attackTimer = 0;
  private attackDidStrike = false;
  private warningText: string | null = null;
  private patternIndex = 0;

  constructor(parent: THREE.Object3D, config: BossConfig) {
    this.parent = parent;
    this.config = config;
    this.hp = config.maxHp;
    this.maxHp = config.maxHp;

    this.root = new THREE.Group();
    const isDragon = config.id === 'crimson_dragon';
    const size = isDragon ? 6.4 : 5.2;
    const planeGeo = new THREE.PlaneGeometry(size, size);
    planeGeo.translate(0, size * 0.48, 0);
    this.sharedGeos.push(planeGeo);

    const tex = createBossTexture(config);
    this.spriteMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sharedMats.push(this.spriteMat);
    this.root.add(new THREE.Mesh(planeGeo, this.spriteMat));

    const auraGeo = new THREE.RingGeometry(1.5, 2.05, 28);
    auraGeo.rotateX(-Math.PI / 2);
    this.sharedGeos.push(auraGeo);
    const auraMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.accentColor),
      transparent: true,
      opacity: 0.52,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sharedMats.push(auraMat);
    this.auraRing = new THREE.Mesh(auraGeo, auraMat);
    this.auraRing.position.y = 0.06;
    this.root.add(this.auraRing);

    this.root.position.set(this.x, 0, -0.15);
    this.parent.add(this.root);

    // Pooled Boss saldırı tehlikeleri (sıfır frame-içi allocation, mobil 60 FPS!)
    const orbGeo = new THREE.SphereGeometry(0.45, 10, 8);
    const ringGeo = new THREE.RingGeometry(0.55, 0.95, 20);
    ringGeo.rotateX(-Math.PI / 2);
    this.sharedGeos.push(orbGeo, ringGeo);

    const hazardColor = new THREE.Color(config.accentColor);
    const warnMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sharedMats.push(warnMat);

    for (let i = 0; i < 12; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: hazardColor,
        transparent: true,
        opacity: 0.95,
      });
      this.sharedMats.push(mat);
      const mesh = new THREE.Mesh(orbGeo, mat);
      mesh.visible = false;
      this.parent.add(mesh);

      const warnRing = new THREE.Mesh(ringGeo, warnMat);
      warnRing.visible = false;
      warnRing.position.y = 0.06;
      this.parent.add(warnRing);

      this.hazards.push({
        active: false,
        kind: 'projectile',
        mesh,
        warnRing,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 0.65,
        life: 0,
        maxLife: 2,
        telegraph: 0,
      });
    }
  }

  public getHudState(playerHp = 5, playerMaxHp = 5, playerInvuln = false): BossHudState {
    return {
      id: this.config.id,
      name: this.config.name,
      title: this.config.title,
      hp: Math.max(0, Math.ceil(this.hp)),
      maxHp: this.maxHp,
      phase: this.phase,
      maxPhases: this.config.phases,
      warningText: this.warningText,
      enraged: this.phase >= this.config.phases,
      playerHp,
      playerMaxHp,
      playerInvuln,
    };
  }

  public getHitRadius(): number {
    return this.config.id === 'crimson_dragon' ? 2.85 : 2.35;
  }

  public takeDamage(
    amount: number,
    ctx: Pick<BossUpdateContext, 'onBossPopup' | 'onBossRoar' | 'onBossDefeated'>,
  ): boolean {
    if (this.defeated) return false;
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 0.22;

    // Faz geçişi kontrolü
    const hpRatio = this.hp / this.maxHp;
    const targetPhase =
      this.config.phases === 3
        ? hpRatio <= 0.34
          ? 3
          : hpRatio <= 0.68
            ? 2
            : 1
        : hpRatio <= 0.5
          ? 2
          : 1;

    if (targetPhase > this.phase && this.hp > 0) {
      this.phase = targetPhase;
      ctx.onBossRoar();
      ctx.onBossPopup(
        `FAZ ${this.phase}! ÖFKELENDİ!`,
        this.x,
        3.9,
        '#fb923c',
        1.45,
      );
      this.attackCooldown = Math.min(this.attackCooldown, 0.9);
    }

    if (this.hp <= 0) {
      this.defeated = true;
      this.warningText = null;
      this.clearHazards();
      ctx.onBossDefeated(this.x, 2.2);
      return true;
    }
    return false;
  }

  private clearHazards(): void {
    for (const h of this.hazards) {
      h.active = false;
      h.mesh.visible = false;
      h.warnRing.visible = false;
    }
  }

  private spawnHazard(
    kind: BossHazard['kind'],
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    maxLife: number,
    telegraph = 0,
    colorHex?: number,
  ): void {
    const slot = this.hazards.find((h) => !h.active);
    if (!slot) return;
    slot.active = true;
    slot.kind = kind;
    slot.x = x;
    slot.y = y;
    slot.vx = vx;
    slot.vy = vy;
    slot.radius = radius;
    slot.life = maxLife;
    slot.maxLife = maxLife;
    slot.telegraph = telegraph;
    const mat = slot.mesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(
      colorHex ??
        (kind === 'fire_breath'
          ? 0xf97316
          : kind === 'meteor'
            ? 0xef4444
            : kind === 'shockwave'
              ? 0xfacc15
              : new THREE.Color(this.config.accentColor).getHex()),
    );
    slot.mesh.scale.set(
      kind === 'shockwave' ? 1.55 : radius * 1.35,
      kind === 'shockwave' ? 0.55 : radius * 1.35,
      radius * 1.1,
    );
    slot.mesh.position.set(x, y, 0.2);
    slot.mesh.visible = telegraph <= 0;
    slot.warnRing.position.set(x, 0.08, 0.15);
    slot.warnRing.visible = telegraph > 0;
  }

  private chooseNextPattern(bossId: BossId): 'charge' | 'slam' | 'volley' | 'meteor' | 'breath' {
    const sequences: Record<BossId, ('charge' | 'slam' | 'volley' | 'meteor' | 'breath')[]> = {
      market_baron: ['slam', 'volley', 'charge'],
      iron_commander: ['charge', 'slam', 'volley'],
      royal_golem: ['slam', 'meteor', 'charge'],
      desert_pharaoh: ['volley', 'meteor', 'slam'],
      grave_lord: ['volley', 'meteor', 'charge'],
      crimson_dragon: ['breath', 'meteor', 'charge', 'slam'],
    };
    const seq = sequences[bossId];
    const next = seq[this.patternIndex % seq.length];
    this.patternIndex++;
    return next;
  }

  public update(ctx: BossUpdateContext): void {
    const { dt, elapsed, knightX } = ctx;

    if (this.defeated) {
      this.root.position.y = Math.max(-4, this.root.position.y - dt * 2.8);
      this.root.rotation.z -= dt * 1.8;
      this.spriteMat.opacity = Math.max(0, this.spriteMat.opacity - dt * 0.9);
      return;
    }

    const speedScale = this.config.attackSpeed * (1 + (this.phase - 1) * 0.18);

    // Hit flash
    if (this.hitFlash > 0) {
      this.hitFlash = Math.max(0, this.hitFlash - dt);
      this.spriteMat.color.setHex(this.hitFlash > 0.08 ? 0xff9999 : 0xffffff);
      this.root.scale.set(1.06, 0.94, 1);
    } else {
      this.spriteMat.color.setHex(0xffffff);
      const bob = Math.sin(elapsed * (this.config.id === 'crimson_dragon' ? 5.2 : 3.2)) * 0.04;
      this.root.scale.set(1 - bob * 0.5, 1 + bob, 1);
    }

    this.auraRing.rotation.z = elapsed * (1.2 + this.phase * 0.6);

    // Boss saldırı durum makinesi
    if (this.activeAttack === 'idle') {
      this.warningText = null;
      // Yumuşak tehditkâr gezinme (oyuncuya makul mesafede kalır, vurulabilir!)
      const desiredX = THREE.MathUtils.clamp(
        this.homeX + Math.sin(elapsed * 1.35) * 1.8,
        1.5,
        7.0,
      );
      this.x += (desiredX - this.x) * Math.min(1, dt * 2.4);
      this.y = this.config.id === 'crimson_dragon' ? 0.35 + Math.sin(elapsed * 4.5) * 0.3 : 0;

      this.attackCooldown -= dt * speedScale;
      if (this.attackCooldown <= 0) {
        this.activeAttack = this.chooseNextPattern(this.config.id);
        this.attackTimer = 0;
        this.attackDidStrike = false;
        ctx.onBossRoar();
      }
    } else if (this.activeAttack === 'charge') {
      this.attackTimer += dt;
      if (this.attackTimer < 0.72) {
        this.warningText = '⚠️ HÜCUM GELİYOR! ZIPLA VEYA GERİ ÇEKİL!';
        this.x += dt * 1.6;
        this.root.rotation.z = -0.14;
      } else if (this.attackTimer < 1.48) {
        this.warningText = '💥 BOSS HÜCUMU! ÜSTÜNDEN ZIPLA!';
        this.x -= dt * (11.5 + this.phase * 1.4);
        this.root.rotation.z = 0.12;
        // Zıplayarak hücumun üstünden sıyrılabilirsin (knightY > 1.55)
        if (!ctx.knightInvuln && Math.abs(this.x - knightX) < 1.55 && ctx.knightY < 1.55) {
          ctx.onKnightHitHazard(-1, 'BOSS DARBESİ! -1 CAN!');
        }
      } else {
        this.x += (this.homeX - this.x) * Math.min(1, dt * 4.2);
        this.root.rotation.z = 0;
        if (this.attackTimer > 2.15) {
          this.activeAttack = 'idle';
          this.attackCooldown = Math.max(1.4, 2.5 - this.phase * 0.3);
        }
      }
    } else if (this.activeAttack === 'slam') {
      this.attackTimer += dt;
      if (this.attackTimer < 0.78) {
        this.warningText = '⚠️ YER SARSINTISI! ÜSTÜNDEN ZIPLA!';
        this.y = Math.sin((this.attackTimer / 0.78) * Math.PI) * 1.6;
      } else {
        this.y = 0;
        if (!this.attackDidStrike) {
          this.attackDidStrike = true;
          this.spawnHazard('shockwave', this.x - 1.2, 0.42, -(8.2 + this.phase * 1.2), 0, 0.85, 2.2, 0);
          if (this.phase >= 2) {
            this.spawnHazard('shockwave', this.x - 1.2, 0.42, -(5.4 + this.phase * 0.9), 0, 0.75, 2.6, 0);
          }
        }
        if (this.attackTimer > 1.55) {
          this.activeAttack = 'idle';
          this.attackCooldown = Math.max(1.3, 2.3 - this.phase * 0.25);
        }
      }
    } else if (this.activeAttack === 'volley') {
      this.attackTimer += dt;
      this.warningText = '⚠️ ENERJİ ATIŞI! KAÇIN!';
      if (!this.attackDidStrike && this.attackTimer >= 0.55) {
        this.attackDidStrike = true;
        const count = this.phase >= 3 ? 3 : 2;
        for (let i = 0; i < count; i++) {
          this.spawnHazard(
            'projectile',
            this.x - 1.3 - i * 0.7,
            1.25 + (i % 2) * 0.5,
            -(8.0 + i * 1.6 + this.phase * 0.8),
            0,
            0.55,
            2.4,
            0,
          );
        }
      }
      if (this.attackTimer > 1.45) {
        this.activeAttack = 'idle';
        this.attackCooldown = Math.max(1.35, 2.3 - this.phase * 0.25);
      }
    } else if (this.activeAttack === 'meteor') {
      this.attackTimer += dt;
      this.warningText = '☄️ GÖKTEN METEOR YAĞIYOR! KIRMIZI ALANDAN KAÇ!';
      if (!this.attackDidStrike && this.attackTimer >= 0.42) {
        this.attackDidStrike = true;
        const count = Math.min(4, 2 + this.phase);
        for (let i = 0; i < count; i++) {
          const targetX = THREE.MathUtils.clamp(
            knightX + (i - (count - 1) * 0.5) * 2.4 + (Math.random() - 0.5) * 0.8,
            -6.8,
            4.5,
          );
          this.spawnHazard('meteor', targetX, 8.8, 0, -14.5, 0.85, 2.1, 0.78 + i * 0.14, 0xef4444);
        }
      }
      if (this.attackTimer > 1.75) {
        this.activeAttack = 'idle';
        this.attackCooldown = Math.max(1.4, 2.4 - this.phase * 0.25);
      }
    } else if (this.activeAttack === 'breath') {
      // Kadim Kızıl Ejderha Alev Nefesi!
      this.attackTimer += dt;
      this.warningText = '🔥 EJDERHA ALEV NEFESİ! GERİ ÇEKİL!';
      this.y = 0.6 + Math.sin(elapsed * 8) * 0.2;
      if (this.attackTimer > 0.55 && this.attackTimer < 1.65) {
        if (Math.floor(this.attackTimer * 9) !== Math.floor((this.attackTimer - dt) * 9)) {
          this.spawnHazard(
            'fire_breath',
            this.x - 2.1,
            1.55,
            -(9.5 + this.phase * 1.4),
            -2.4,
            0.72,
            1.4,
            0,
            0xf97316,
          );
        }
      }
      if (this.attackTimer > 2.05) {
        this.activeAttack = 'idle';
        this.attackCooldown = Math.max(1.3, 2.2 - this.phase * 0.25);
      }
    }

    this.root.position.set(this.x, this.y, -0.15);

    // Tüm pooled Boss tehlikelerini güncelle
    for (const h of this.hazards) {
      if (!h.active) continue;
      if (h.telegraph > 0) {
        h.telegraph -= dt;
        const pulse = 0.85 + Math.sin(elapsed * 22) * 0.2;
        h.warnRing.scale.set(pulse, pulse, 1);
        if (h.telegraph <= 0) {
          h.mesh.visible = true;
        }
        continue;
      }

      h.life -= dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;

      if (h.kind === 'meteor' && h.y <= 0.45) {
        h.y = 0.45;
        h.vy = 0;
        h.life = Math.min(h.life, 0.22);
        h.warnRing.visible = false;
      } else if (h.kind === 'fire_breath' && h.y < 0.4) {
        h.y = 0.4;
        h.vy = 0;
      }

      h.mesh.position.set(h.x, h.y, 0.22);
      h.mesh.rotation.z += dt * 7;

      // Boss savaşında zıplama destekli dikey & yatay hasar kontrolü
      const knightBottom = ctx.knightY;
      const knightTop = ctx.knightY + 2.15;
      const hazardBottom = h.y - h.radius * 0.85;
      const hazardTop = h.y + h.radius * 0.85;
      const verticalOverlap = knightBottom <= hazardTop && knightTop >= hazardBottom;

      if (
        !ctx.knightInvuln &&
        Math.abs(h.x - knightX) < h.radius + 0.5 &&
        verticalOverlap
      ) {
        h.active = false;
        h.mesh.visible = false;
        h.warnRing.visible = false;
        ctx.onKnightHitHazard(-1, 'İSABET ALDIN! -1 CAN!');
        continue;
      }

      if (h.life <= 0 || h.x < -12) {
        h.active = false;
        h.mesh.visible = false;
        h.warnRing.visible = false;
      }
    }
  }

  public dispose(): void {
    this.parent.remove(this.root);
    for (const h of this.hazards) {
      this.parent.remove(h.mesh);
      this.parent.remove(h.warnRing);
    }
    for (const g of this.sharedGeos) g.dispose();
    for (const m of this.sharedMats) m.dispose();
  }
}

export function disposeBossTextureCache(): void {
  bossTexCache.forEach((tex) => tex.dispose());
  bossTexCache.clear();
}
