import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GameplayAchievementEvent } from './achievementManager';
import { audioEngine } from './audio';
import { getLevelConfig } from './levels';
import {
  createBridgeBay,
  createCoinMesh,
  createContactShadow,
  createGoldBagMesh,
  createMaterialBank,
  createStarburstMesh,
  createThronePillar,
  MaterialBank,
} from './models';
import { BlackKnight } from './BlackKnight';
import {
  BonusEntityRig,
  createBonusEntityMesh,
  createDarkFantasyBreakable,
  createDarkFantasyEnemyRig,
  DarkFantasyEnemyRig,
  updateDarkFantasyEnemyRig,
} from './DarkFantasyMobs';
import {
  createDarkFantasyRoadTex,
  createDarkFantasySkyTex,
  createForestCanopyLayerTex,
  createHandPaintedGothicBuilding,
  createHandPaintedTree,
  createLightShaftTex,
  createMistBandTex,
  createMountainLayerTex,
  createRoadsideLanternAndRocks,
  getDarkFantasyPalette,
} from './DarkFantasyWorld';
import {
  createInitialUpgrades,
  getChargeRate,
  getDizzyDuration,
  getGoldMultiplier,
  getWeaponSpec,
} from './shop';
import { createBridgeStoneWallTexture } from './textures';
import { getEnemyBasePoints, ScoreAddResult, ScoreManager } from './scoreManager';
import { BossController, disposeBossTextureCache } from './BossSystem';
import {
  createCatalogBreakableMesh,
  disposeBreakableCatalogCache,
  getBreakableSpec,
} from './BreakableCatalog';
import {
  createSpecialNpcMesh,
  disposeSpecialNpcCache,
  getSpecialNpcSpec,
} from './SpecialNpcs';
import { getWorldConfig, TOTAL_LEVELS } from './worlds';
import {
  BonusBanner,
  BonusKind,
  BreakableKind,
  EnemyKind,
  FloatingPopup,
  GameScreen,
  HudSnapshot,
  KnightAnimState,
  LevelConfig,
  LevelResult,
  PlayerUpgrades,
  ScreenEffectKind,
  ScreenEffectState,
  SpecialNpcKind,
  TutorialSnapshot,
  TutorialStage,
} from './types';

const LEGACY_DARK_FANTASY_BREAKABLES = new Set<BreakableKind>([
  'barrel',
  'crate',
  'stall',
  'chest',
  'special_treasure',
  'pottery',
  'banner_stand',
  'hay_cart',
]);

interface ScrollingTarget {
  id: number;
  category: 'breakable' | 'character' | 'special_npc';
  breakableKind?: BreakableKind;
  enemyKind?: EnemyKind;
  specialNpcKind?: SpecialNpcKind;
  mesh: THREE.Group;
  rig?: DarkFantasyEnemyRig;
  x: number;
  y: number;
  zOffset: number;
  vx: number;
  vy: number;
  rotZ: number;
  rotSpeed: number;
  width: number;
  baseGold: number;
  basePoints: number;
  extraSpeed: number;
  animTime: number;
  hitsTaken: number;
  maxHits: number;
  slowTimer: number;
  tumbling: boolean;
  isSprinter: boolean;
  dustAccum: number;
  smashed: boolean;
  removed: boolean;
}

interface InteractiveFx {
  active: boolean;
  kind: 'bee' | 'bird' | 'ghost' | 'firework' | 'egg' | 'feather' | 'fish';
  mesh: THREE.Mesh;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  life: number;
  maxLife: number;
  bursted: boolean;
}

interface PickupEntity {
  id: number;
  isBag: boolean;
  mesh: THREE.Group;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  value: number;
  age: number;
  scatterDelay: number;
  bounces: number;
  magnetized: boolean;
  spinSpeed: number;
  life: number;
  collected: boolean;
}

interface ParallaxItem {
  obj: THREE.Object3D;
  speedFactor: number;
  span: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  gravity: number;
  active: boolean;
}

interface StarburstFx {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  active: boolean;
}

interface AmbientMote {
  mesh: THREE.Mesh;
  isLeaf: boolean;
  vx: number;
  vy: number;
  phase: number;
  amp: number;
  rotSpeed: number;
  baseScale: number;
}

interface DebrisShard {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  gravity: number;
  bounces: number;
  baseScaleX: number;
  baseScaleY: number;
  active: boolean;
}

interface BonusEntity {
  id: number;
  kind: BonusKind;
  rig: BonusEntityRig;
  x: number;
  y: number;
  baseY: number;
  vx: number;
  vy: number;
  age: number;
  fromBreakable: boolean;
  magnetized: boolean;
  collected: boolean;
  sparkleAccum: number;
}

export interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onPopup: (popup: FloatingPopup) => void;
  onLevelEnd: (result: LevelResult) => void;
  onTutorialUpdate?: (snapshot: TutorialSnapshot) => void;
  onTutorialComplete?: () => void;
  onAchievementEvent?: (event: GameplayAchievementEvent) => void;
}

const PORTRAIT_VIEW_WIDTH = 10.6;
const GROUND_Y = 0;
const GRAVITY = -32;
const PIG_DURATION = 3.0;
const PARALLAX_SPAN = 44;
// Kısa ve heyecanlı kombo penceresi: yeni hedefe hızla vurulmazsa kombo sıfırlanır
const COMBO_DECAY_DURATION = 2.2;
const DOUBLE_SCORE_DURATION = 7.0;
const POWER_SURGE_DURATION = 6.5;
const BONUS_BANNER_DURATION = 1.45;
const ALL_BONUS_KINDS: BonusKind[] = ['gold_rush', 'double_score', 'power_surge', 'extra_points'];

const _projVec = new THREE.Vector3();

function detectSoftwareGl(): boolean {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return false;
  }
}

export class BlackKnightEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private mats: MaterialBank;
  private envTex: THREE.Texture | null = null;
  private maxAnisotropy = 1;

  // World groups
  private worldGroup = new THREE.Group();
  private skyMesh: THREE.Mesh | null = null;
  private skyTexture: THREE.Texture | null = null;
  private roadTexture: THREE.Texture | null = null;
  private wallTexture: THREE.Texture | null = null;
  private mountainTexture: THREE.Texture | null = null;
  private forestTexture: THREE.Texture | null = null;
  private mistTexture: THREE.Texture | null = null;
  private shaftTexture: THREE.Texture | null = null;
  private torchFlames: THREE.Mesh[] = [];
  private lanternGlows: THREE.Mesh[] = [];
  private lightShafts: THREE.Mesh[] = [];
  private parallaxItems: ParallaxItem[] = [];
  private lastCoinSoundTime = 0;

  // Actors & pooled FX
  private knight: BlackKnight;
  private targets: ScrollingTarget[] = [];
  private pickups: PickupEntity[] = [];
  private bonuses: BonusEntity[] = [];
  private particles: Particle[] = [];
  private debrisPool: DebrisShard[] = [];
  private interactiveFxPool: InteractiveFx[] = [];
  private starbursts: StarburstFx[] = [];
  private ambientMotes: AmbientMote[] = [];
  private boss: BossController | null = null;
  private bossMoveInput = 0;
  private bossJumpY = 0;
  private bossJumpVy = 0;
  private bossGrounded = true;
  private bossPlayerHp = 5;
  private readonly bossPlayerMaxHp = 5;
  private bossPlayerInvulnTimer = 0;
  private bossVictoryDelay = 0;
  private screenEffects: ScreenEffectState[] = [];
  private nextScreenEffectId = 1;
  private activeEventBanner: string | null = null;
  private eventBannerTimer = 0;
  private levelEventCooldown = 14;
  private critWaveMesh: THREE.Mesh;
  private critWaveLife = 0;
  private critWaveActive = false;
  private comboWaveMesh: THREE.Mesh;
  private comboWaveLife = 0;
  private comboWaveActive = false;
  private particleGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
  private interactiveFxGeo = new THREE.SphereGeometry(0.24, 8, 6);
  private debrisPlankGeo = new THREE.BoxGeometry(0.46, 0.14, 0.08);
  private debrisChunkGeo = new THREE.BoxGeometry(0.26, 0.24, 0.12);
  private debrisClothGeo = new THREE.PlaneGeometry(0.44, 0.32);
  private ambientLeafGeo = new THREE.PlaneGeometry(0.28, 0.16);
  private ambientFireflyGeo = new THREE.PlaneGeometry(0.18, 0.18);
  private footstepDustAccum = 0;
  private wasAirborne = false;

  // State
  private screen: GameScreen = 'TITLE';
  private level: LevelConfig = getLevelConfig(1);
  private upgrades: PlayerUpgrades = createInitialUpgrades();
  private nextEntityId = 1;
  private nextPopupId = 1;
  private elapsed = 0;
  private lastTimestamp = 0;
  private frameId = 0;
  private disposed = false;

  // Portrait camera & Knight anchor + real horizontal movement + hop & combat state
  private baseCamY = 4.4;
  private anchorX = -2.75;
  private moveOffsetX = 0;
  private moveInput: -1 | 0 | 1 = 0;
  private hopOffsetX = 0;
  private hopY = 0;
  private animState: KnightAnimState = 'run';
  private animTime = 0;
  private isCharging = false;
  private charge = 0;
  private fullChargeChimed = false;
  private chargeTickAccum = 0;
  private fullChargeSparkAccum = 0;
  private swingTimer = 0;
  private swingDuration = 0.36;
  private swingPower = 0;
  private swingHitChecked = false;
  private dizzyTimer = 0;
  private dizzyDuration = 1.5;
  private pigTimer = 0;
  private getMedievalFlashTimer = 0;

  // Economy & Score:
  // - levelGold & levelScore ALWAYS reset to 0 on every new level / new game!
  // - walletGold is the player's spendable gold purse for Ye Olde Weapon Shoppe.
  private levelGold = 0;
  private walletGold = 0;
  private goldBags = 0;
  private readonly scoreManager = new ScoreManager();
  private maxScoreAnnounced = false;
  private swingSeq = 0;
  private timeLeft = 50;
  private combo = 0;
  private comboTimer = 0;
  private doubleScoreTimer = 0;
  private powerSurgeTimer = 0;
  private powerAuraAccum = 0;
  private bonusSpawnTimer = 7.0;
  private activeBonusBanner: BonusBanner | null = null;
  private bonusBannerTimer = 0;
  private nextBonusBannerId = 1;
  private quotaAnnounced = false;
  private levelEnding = false;
  private spawnTimer = 0.8;
  private spawnSeed = 1;
  private surpriseWitchesRemaining = 0;
  private surpriseWitchCooldown = 10;

  // Gerçek başarım takibi için bölüm bazlı istatistikler (oynanış mekaniğini değiştirmez)
  private roundSeq = 0;
  private currentRunId = '';
  private roundSwings = 0;
  private roundHits = 0;
  private roundMistakes = 0;
  private roundSawPrincess = false;
  private roundSawKing = false;
  private comboHoldSeconds = 0;
  private comboHoldAchievementSent = false;

  // Isolated Interactive Tutorial state (never alters real progression or walletGold)
  private isTutorialMode = false;
  private tutorialStage: TutorialStage = 1;
  private tutorialPendingStage: TutorialStage | null = null;
  private tutorialStageFlashTimer = 0;
  private tutorialChargePracticed = false;
  private tutorialSwingPracticed = false;
  private tutorialPigStarted = false;
  private readonly tutorialInnocentOrder: ('princess' | 'king' | 'priest')[] = [
    'princess',
    'king',
    'priest',
  ];
  private tutorialInnocentsSpared = 0;
  private tutorialForbiddenWarningTimer = 0;
  private tutorialForbiddenWarningText: string | null = null;
  private tutorialMerchantHit = false;
  private tutorialGold = 0;
  private tutorialGoldGoal = 60;
  private tutorialScore = 0;
  private tutorialScoreGoal = 150;
  private tutorialCompleteNotified = false;
  private tutorialEmitAccum = 0;

  // Juice
  private camShake = 0;
  private hitstopTimer = 0;
  private hudEmitAccum = 0;

  private onResizeBound: () => void;
  private onContextLostBound: (e: Event) => void;
  private onContextRestoredBound: () => void;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareGl();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101824);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = this.envTex;
    pmrem.dispose();

    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);
    this.camera = new THREE.OrthographicCamera(-5.3, 5.3, 9.4, -9.4, 0.1, 120);
    this.updateCameraProjection(width, height);
    this.renderer.setSize(width, height, false);

    // Karanlık fantastik ay ışığı + sıcak fener ışık dengesi
    const hemi = new THREE.HemisphereLight(0xa8c8f0, 0x222938, 1.05);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe8f0ff, 1.75);
    keyLight.position.set(12, 24, 18);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -18;
    keyLight.shadow.camera.right = 18;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xffb36b, 0.78);
    rimLight.position.set(-14, 10, -10);
    this.scene.add(rimLight);

    this.mats = createMaterialBank(this.maxAnisotropy);
    this.scene.add(this.worldGroup);

    const knightShadow = createContactShadow(this.mats, 2.55, 1.12);
    this.knight = new BlackKnight(knightShadow, this.upgrades.equippedWeapon);
    this.scene.add(this.knight.root);

    const ringGeo = new THREE.RingGeometry(0.65, 1.25, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfde047,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.critWaveMesh = new THREE.Mesh(ringGeo, ringMat);
    this.critWaveMesh.visible = false;
    this.scene.add(this.critWaveMesh);

    const comboRingGeo = new THREE.RingGeometry(0.55, 1.05, 24);
    const comboRingMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.comboWaveMesh = new THREE.Mesh(comboRingGeo, comboRingMat);
    this.comboWaveMesh.visible = false;
    this.comboWaveMesh.renderOrder = 18;
    this.scene.add(this.comboWaveMesh);

    this.initPools();
    this.loadLevel(1, 'TITLE', 0, this.upgrades);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.onResizeBound = this.handleResize.bind(this);
    this.onContextLostBound = (e: Event) => e.preventDefault();
    this.onContextRestoredBound = () => this.handleResize();
    window.addEventListener('resize', this.onResizeBound);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestoredBound);

    this.lastTimestamp = performance.now();
    this.scheduleNextFrame();
  }

  private updateCameraProjection(width: number, height: number): void {
    const aspect = Math.max(0.4, width / Math.max(1, height));
    // Dikey (Portrait) sahnede yatay görüş alanını koruyarak gelen hedeflere bol tepki süresi ver
    const halfW = PORTRAIT_VIEW_WIDTH / 2;
    const halfH = Math.max(5.8, halfW / Math.min(aspect, 0.92));

    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();

    // Zemin (y = 0) ekranın altından ~%27 yukarıda konumlanır; altta başparmak şarj alanı rahatça kalır
    this.baseCamY = Math.max(3.6, halfH * 0.45);
    this.camera.position.set(0, this.baseCamY, 22);
    this.camera.lookAt(0, this.baseCamY, 0);
    this.updateKnightAnchorX();
  }

  private updateKnightAnchorX(): void {
    const viewWidth = this.camera.right - this.camera.left;
    this.anchorX = this.camera.left + viewWidth * 0.25;
  }

  private initPools(): void {
    const colors = [0xfacc15, 0x9a5b25, 0xfff8dc, 0xc026d3, 0x4ade80, 0xf97316];
    for (let i = 0; i < 76; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const mesh = new THREE.Mesh(this.particleGeo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rotSpeed: 0,
        life: 0,
        maxLife: 0.45,
        gravity: -24,
        active: false,
      });
    }

    for (let i = 0; i < 8; i++) {
      const mesh = createStarburstMesh(this.mats, i % 2 === 1);
      mesh.visible = false;
      this.scene.add(mesh);
      this.starbursts.push({ mesh, life: 0, maxLife: 0.18, active: false });
    }

    // Parçalanabilir çevre objeleri için sıfır-alloc havuzlanmış tahta/seramik/kumaş enkaz parçaları
    for (let i = 0; i < 56; i++) {
      const geo =
        i % 3 === 0
          ? this.debrisPlankGeo
          : i % 3 === 1
            ? this.debrisChunkGeo
            : this.debrisClothGeo;
      const mat = new THREE.MeshBasicMaterial({
        color: 0x9a5b25,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.renderOrder = 15;
      this.scene.add(mesh);
      this.debrisPool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        rotSpeed: 0,
        life: 0,
        maxLife: 0.75,
        gravity: -28,
        bounces: 0,
        baseScaleX: 1,
        baseScaleY: 1,
        active: false,
      });
    }

    // Atmosferik havada süzülen karanlık orman yaprakları ve parlayan ateş böcekleri/tozlar
    for (let i = 0; i < 24; i++) {
      const isLeaf = i < 12;
      const mat = new THREE.MeshBasicMaterial({
        color: isLeaf ? 0x3b624d : 0xfde68a,
        transparent: true,
        opacity: isLeaf ? 0.78 : 0.7,
        blending: isLeaf ? THREE.NormalBlending : THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(
        isLeaf ? this.ambientLeafGeo : this.ambientFireflyGeo,
        mat,
      );
      const x = (Math.random() - 0.5) * 14;
      const y = 0.7 + Math.random() * 10.5;
      const z = isLeaf ? -1.4 + Math.random() * 2.8 : -2.6 + Math.random() * 4.0;
      const baseScale = isLeaf ? 0.75 + Math.random() * 0.75 : 0.45 + Math.random() * 0.75;
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(baseScale);
      mesh.renderOrder = isLeaf ? 16 : 13;
      this.scene.add(mesh);

      this.ambientMotes.push({
        mesh,
        isLeaf,
        vx: isLeaf ? -(1.4 + Math.random() * 2.0) : -(0.5 + Math.random() * 1.1),
        vy: isLeaf ? -(0.38 + Math.random() * 0.55) : (Math.random() - 0.5) * 0.28,
        phase: Math.random() * Math.PI * 2,
        amp: isLeaf ? 0.45 + Math.random() * 0.45 : 0.25 + Math.random() * 0.4,
        rotSpeed: isLeaf ? (Math.random() - 0.5) * 5.2 : 0,
        baseScale,
      });
    }

    // 13 Etkileşimli Nesne için sıfır-alloc havuzlanmış arı/kuş/hayalet/fişek/yumurta/tüy efektleri
    for (let i = 0; i < 24; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.interactiveFxGeo, mat);
      mesh.visible = false;
      mesh.renderOrder = 17;
      this.scene.add(mesh);
      this.interactiveFxPool.push({
        active: false,
        kind: 'bee',
        mesh,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        phase: 0,
        life: 0,
        maxLife: 1.5,
        bursted: false,
      });
    }
  }

  public setScreen(screen: GameScreen): void {
    this.screen = screen;
    if (screen === 'PLAYING' || screen === 'TUTORIAL') {
      audioEngine.startMusic();
    } else {
      this.isCharging = false;
      this.moveInput = 0;
      audioEngine.stopMusic();
    }
  }

  public syncUpgradesAndWallet(upgrades: PlayerUpgrades, walletGold: number): void {
    this.upgrades = {
      ...upgrades,
      ownedWeapons: [...upgrades.ownedWeapons],
    };
    this.walletGold = walletGold;
    this.knight.setWeapon(this.upgrades.equippedWeapon);
    this.emitHud();
  }

  public startLevelRun(levelId: number, upgrades: PlayerUpgrades, currentWalletGold: number): void {
    this.isTutorialMode = false;
    this.loadLevel(levelId, 'PLAYING', currentWalletGold, upgrades);
    audioEngine.startMusic();
  }

  public startTutorial(upgrades: PlayerUpgrades): void {
    this.isTutorialMode = true;
    this.tutorialStage = 1;
    this.tutorialPendingStage = null;
    this.tutorialStageFlashTimer = 0;
    this.tutorialChargePracticed = false;
    this.tutorialSwingPracticed = false;
    this.tutorialPigStarted = false;
    this.tutorialInnocentsSpared = 0;
    this.tutorialForbiddenWarningTimer = 0;
    this.tutorialForbiddenWarningText = null;
    this.tutorialMerchantHit = false;
    this.tutorialGold = 0;
    this.tutorialGoldGoal = 60;
    this.tutorialScore = 0;
    this.tutorialScoreGoal = 150;
    this.tutorialCompleteNotified = false;
    this.tutorialEmitAccum = 0;

    // Eğitim alanı gerçek oyunun 1. bölüm dünyasını izole olarak kullanır
    this.loadLevel(1, 'TUTORIAL', 0, upgrades);
    this.setupTutorialStage(1);
    audioEngine.startMusic();
    this.emitTutorialSnapshot();
  }

  public exitTutorial(upgrades: PlayerUpgrades, walletGold: number): void {
    this.isTutorialMode = false;
    this.tutorialPendingStage = null;
    this.tutorialStageFlashTimer = 0;
    this.moveInput = 0;
    this.moveOffsetX = 0;
    this.returnToTitle(upgrades, walletGold);
  }

  public returnToTitle(upgrades?: PlayerUpgrades, walletGold = 0): void {
    this.isTutorialMode = false;
    this.moveInput = 0;
    this.moveOffsetX = 0;
    audioEngine.stopMusic();
    this.loadLevel(1, 'TITLE', walletGold, upgrades ?? this.upgrades);
  }

  public setMoveInput(dir: -1 | 0 | 1): void {
    // Normal bölümlerde hareket YOKTUR; yalnızca Boss bölümlerinde veya Eğitim Aşama 6'da aktiftir!
    if (this.screen === 'PLAYING' && this.level.isBossLevel) {
      this.bossMoveInput = dir;
      return;
    }
    if (!(this.screen === 'TUTORIAL' && this.tutorialStage === 6)) {
      this.moveInput = 0;
      this.bossMoveInput = 0;
      return;
    }
    this.moveInput = dir;
  }

  public setBossMoveInput(vx: number): void {
    if (this.screen === 'PLAYING' && this.level.isBossLevel) {
      this.bossMoveInput = Math.max(-1, Math.min(1, vx));
    } else {
      this.bossMoveInput = 0;
    }
  }

  public triggerBossJump(): void {
    if (
      this.screen !== 'PLAYING' ||
      !this.level.isBossLevel ||
      !this.bossGrounded ||
      this.pigTimer > 0 ||
      this.levelEnding
    ) {
      return;
    }
    this.bossJumpVy = 14.4;
    this.bossGrounded = false;
    audioEngine.playJump();
    this.spawnDustPuff(this.getKnightX(), GROUND_Y, 6);
  }

  private triggerScreenEffect(kind: ScreenEffectKind, duration: number): void {
    // Aynı türde aktif efekt varsa tazele (ekranı yormaz)
    this.screenEffects = this.screenEffects.filter((e) => e.kind !== kind);
    this.screenEffects.push({
      id: this.nextScreenEffectId++,
      kind,
      timeLeft: duration,
      duration,
    });
    this.emitHud();
  }

  public nudgeMoveX(deltaWorldX: number): void {
    if (!(this.screen === 'TUTORIAL' && this.tutorialStage === 6)) return;
    this.moveOffsetX = Math.max(-1.45, Math.min(3.85, this.moveOffsetX + deltaWorldX));
  }

  private getKnightBaseX(): number {
    return this.anchorX + this.moveOffsetX;
  }

  private getKnightX(): number {
    return this.anchorX + this.moveOffsetX + this.hopOffsetX;
  }

  public startCharge(): void {
    if (this.screen === 'TUTORIAL') {
      if (
        this.tutorialStage === 6 ||
        this.tutorialStage === 8 ||
        this.tutorialStageFlashTimer > 0
      ) {
        return;
      }
    } else if (this.screen !== 'PLAYING' || this.levelEnding) {
      return;
    }

    if (this.pigTimer > 0) {
      audioEngine.playPigOink();
      this.spawnPopup(this.getKnightBaseX() + 0.3, 1.9, 'OİNK!', '#f472b6', 1.0);
      return;
    }
    if (this.dizzyTimer > 0 || this.swingTimer > 0) return;

    this.isCharging = true;
    this.charge = Math.max(this.charge, 0.08);
    this.fullChargeChimed = false;
    this.chargeTickAccum = 0;
  }

  public releaseSmash(): void {
    const canAttack =
      (this.screen === 'PLAYING' && !this.levelEnding) ||
      (this.screen === 'TUTORIAL' &&
        this.tutorialStage !== 6 &&
        this.tutorialStage !== 8 &&
        this.tutorialStageFlashTimer <= 0);
    if (!canAttack) {
      this.isCharging = false;
      return;
    }
    if (!this.isCharging) return;

    this.isCharging = false;
    if (this.pigTimer > 0 || this.dizzyTimer > 0 || this.swingTimer > 0) {
      this.charge = 0;
      return;
    }

    this.swingPower = Math.max(0.15, Math.min(1, this.charge));
    this.charge = 0;
    this.swingTimer = this.swingDuration;
    this.swingHitChecked = false;
    audioEngine.playSwing(this.swingPower);
    if (this.isTutorialMode) {
      this.emitTutorialSnapshot();
    } else {
      this.emitHud();
    }
  }

  public cancelCharge(): void {
    this.isCharging = false;
    this.charge = 0;
    this.moveInput = 0;
  }

  public finishRoundEarlyIfQuotaMet(): void {
    if (this.screen !== 'PLAYING' || this.levelEnding) return;
    if (this.scoreManager.isTargetMet()) {
      this.finishLevel(true);
    }
  }

  private handleScoreResult(res: ScoreAddResult): void {
    if (res.justCapped && !this.maxScoreAnnounced && !this.isTutorialMode) {
      this.maxScoreAnnounced = true;
      this.spawnPopup(0, 4.95, '🏆 MAKSİMUM BÖLÜM SKORU!', '#fde047', 1.25);
    }
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
  }

  private loadLevel(
    levelId: number,
    targetScreen: GameScreen,
    currentWalletGold: number,
    upgrades: PlayerUpgrades,
  ): void {
    this.level = getLevelConfig(levelId);
    this.screen = targetScreen;
    this.upgrades = { ...upgrades, ownedWeapons: [...upgrades.ownedWeapons] };
    this.levelEnding = false;
    this.quotaAnnounced = false;

    this.clearGroup(this.worldGroup);
    this.parallaxItems = [];
    this.torchFlames = [];
    this.lanternGlows = [];
    this.lightShafts = [];

    for (const t of this.targets) this.scene.remove(t.mesh);
    for (const p of this.pickups) this.scene.remove(p.mesh);
    for (const b of this.bonuses) this.scene.remove(b.rig.group);
    this.targets = [];
    this.pickups = [];
    this.bonuses = [];

    for (const pt of this.particles) {
      pt.active = false;
      pt.mesh.visible = false;
    }
    for (const d of this.debrisPool) {
      d.active = false;
      d.mesh.visible = false;
    }
    for (const sb of this.starbursts) {
      sb.active = false;
      sb.mesh.visible = false;
    }
    this.critWaveActive = false;
    this.critWaveMesh.visible = false;
    this.comboWaveActive = false;
    this.comboWaveMesh.visible = false;

    const disposeTex = (tex: THREE.Texture | null) => {
      if (tex) tex.dispose();
      return null;
    };
    this.skyTexture = disposeTex(this.skyTexture);
    this.roadTexture = disposeTex(this.roadTexture);
    this.wallTexture = disposeTex(this.wallTexture);
    this.mountainTexture = disposeTex(this.mountainTexture);
    this.forestTexture = disposeTex(this.forestTexture);
    this.mistTexture = disposeTex(this.mistTexture);
    this.shaftTexture = disposeTex(this.shaftTexture);

    if (this.boss) {
      this.boss.dispose();
      this.boss = null;
    }
    this.bossMoveInput = 0;
    this.bossJumpY = 0;
    this.bossJumpVy = 0;
    this.bossGrounded = true;
    this.bossPlayerHp = this.bossPlayerMaxHp;
    this.bossPlayerInvulnTimer = 0;
    this.knight.root.visible = true;
    this.bossVictoryDelay = 0;
    this.screenEffects = [];
    this.activeEventBanner = null;
    this.eventBannerTimer = 0;
    this.levelEventCooldown = 13 + Math.random() * 5;
    for (const fx of this.interactiveFxPool) {
      fx.active = false;
      fx.mesh.visible = false;
    }

    // Reset knight combat & movement state
    this.moveOffsetX = 0;
    this.moveInput = 0;
    this.hopOffsetX = 0;
    this.hopY = 0;
    this.animState = 'run';
    this.animTime = 0;
    this.isCharging = false;
    this.charge = 0;
    this.fullChargeChimed = false;
    this.swingTimer = 0;
    this.swingPower = 0;
    this.swingHitChecked = false;
    this.dizzyTimer = 0;
    this.dizzyDuration = getDizzyDuration(this.upgrades);
    this.pigTimer = 0;
    this.getMedievalFlashTimer = 0;
    this.footstepDustAccum = 0;
    this.wasAirborne = false;

    this.knight.setWeapon(this.upgrades.equippedWeapon);
    this.knight.resetPose(this.anchorX, GROUND_Y);

    // CRITICAL FIX: Every new level/game strictly resets levelGold & ScoreManager to 0!
    // Spendable walletGold carries over for Ye Olde Weapon Shoppe.
    this.levelGold = 0;
    this.scoreManager.reset(this.level);
    this.maxScoreAnnounced = false;
    this.swingSeq = 0;
    this.walletGold = currentWalletGold;
    this.goldBags = 0;
    this.timeLeft = this.level.timeLimit;
    this.combo = 0;
    this.comboTimer = 0;
    this.roundSeq += 1;
    this.currentRunId = `run_${this.level.id}_${Date.now()}_${this.roundSeq}`;
    this.roundSwings = 0;
    this.roundHits = 0;
    this.roundMistakes = 0;
    this.roundSawPrincess = false;
    this.roundSawKing = false;
    this.comboHoldSeconds = 0;
    this.comboHoldAchievementSent = false;
    this.doubleScoreTimer = 0;
    this.powerSurgeTimer = 0;
    this.powerAuraAccum = 0;
    this.activeBonusBanner = null;
    this.bonusBannerTimer = 0;
    this.bonusSpawnTimer =
      targetScreen === 'PLAYING' && !this.level.isBossLevel ? 6.0 + Math.random() * 3.0 : 999;
    this.camShake = 0;
    this.hitstopTimer = 0;
    this.spawnTimer = 0.6;
    // Her normal bölümde oyuncuyu şaşırtmak için 2-3 defa sürpriz hızlı koşan cadı planlanır (Boss bölümlerinde yok)
    this.surpriseWitchesRemaining =
      targetScreen === 'PLAYING' && !this.level.isBossLevel ? (Math.random() < 0.5 ? 2 : 3) : 0;
    this.surpriseWitchCooldown = 7 + Math.random() * 5.5;

    const palette = getDarkFantasyPalette(this.level.theme);
    this.scene.background = new THREE.Color(palette.fogHex);
    this.scene.fog = new THREE.Fog(palette.fogHex, 30, 68);

    // 10 Dünyanın atmosferine özel havada süzülen kar/kum/kül/ruh/yaprak parçacıkları
    const leafHexMap: Record<LevelConfig['theme'], number> = {
      village: 0x3b624d,
      market: 0x7c4a26,
      forest: 0x2f6b56,
      castle: 0x475569,
      throne: 0xfacc15,
      ice: 0xe0f2fe,
      desert: 0xf59e0b,
      pirate: 0x99f6e4,
      graveyard: 0xc084fc,
      dragon: 0xf97316,
    };
    const fireflyHexMap: Record<LevelConfig['theme'], number> = {
      village: 0xfdba74,
      market: 0xfbbf24,
      forest: 0x5eead4,
      castle: 0xfdba74,
      throne: 0xfef08a,
      ice: 0x7dd3fc,
      desert: 0xfde68a,
      pirate: 0x2dd4bf,
      graveyard: 0xd8b4fe,
      dragon: 0xef4444,
    };
    const leafHex = leafHexMap[this.level.theme] ?? 0x3b624d;
    const fireflyHex = fireflyHexMap[this.level.theme] ?? 0xfdba74;
    for (const mote of this.ambientMotes) {
      const mat = mote.mesh.material as THREE.MeshBasicMaterial;
      if (mote.isLeaf) {
        mote.mesh.visible = !this.level.isInterior;
        mat.color.setHex(leafHex);
      } else {
        mote.mesh.visible = true;
        mat.color.setHex(fireflyHex);
      }
    }

    this.buildInfiniteParallaxWorld();
    if (targetScreen === 'PLAYING' && this.level.isBossLevel && this.level.boss) {
      this.boss = new BossController(this.scene, this.level.boss);
      this.activeEventBanner = `BOSS SAVAŞI: ${this.level.boss.name.toUpperCase()}`;
      this.eventBannerTimer = 2.6;
      audioEngine.playBossRoar();
      this.spawnPopup(3.2, 4.1, this.level.boss.name.toUpperCase(), '#facc15', 1.4);
    } else if (targetScreen !== 'TUTORIAL') {
      this.spawnRoadTarget(this.camera.right - 2.5);
      this.spawnRoadTarget(this.camera.right + 4.8);
    }
    this.emitHud();
  }

  private buildInfiniteParallaxWorld(): void {
    const lvl = this.level;

    // 1. El boyaması alacakaranlık / dolunay karanlık fantastik gökyüzü
    this.skyTexture = createDarkFantasySkyTex(lvl, this.maxAnisotropy);
    const skyMat = new THREE.MeshBasicMaterial({
      map: this.skyTexture,
      depthWrite: false,
      fog: false,
    });
    this.skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), skyMat);
    this.skyMesh.position.set(0, 8.2, -18);
    this.worldGroup.add(this.skyMesh);

    // 2. El boyaması ıslak ay ışıklı taş yol / kraliyet kadife halı
    this.roadTexture = createDarkFantasyRoadTex(
      lvl.theme,
      lvl.isInterior,
      this.maxAnisotropy,
      10,
    );
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.84, 5.2),
      new THREE.MeshStandardMaterial({
        map: this.roadTexture,
        roughness: 0.86,
        metalness: 0.06,
      }),
    );
    road.position.set(0, -0.42, 0);
    road.receiveShadow = true;
    this.worldGroup.add(road);

    // Yol altı oymalı taş silme pervaz
    const roadCornice = new THREE.Mesh(
      new THREE.BoxGeometry(36, 0.24, 5.42),
      lvl.isInterior ? this.mats.goldTrim : this.mats.castleStone,
    );
    roadCornice.position.set(0, -0.94, 0);
    this.worldGroup.add(roadCornice);

    // Platform altı el boyaması kale taş duvarı
    this.wallTexture = createBridgeStoneWallTexture(
      lvl.theme,
      lvl.isInterior,
      this.maxAnisotropy,
      8,
      2.4,
    );
    const foundationMat = new THREE.MeshStandardMaterial({
      map: this.wallTexture,
      roughness: 0.92,
      metalness: 0.05,
    });
    const foundation = new THREE.Mesh(new THREE.BoxGeometry(36, 10.6, 5.1), foundationMat);
    foundation.position.set(0, -6.34, 0);
    this.worldGroup.add(foundation);

    // Koyu karanlık orman / taş kenar şeridi
    const vergeColor = lvl.isInterior
      ? 0x0f172a
      : lvl.theme === 'market'
        ? 0x261f1a
        : lvl.theme === 'forest'
          ? 0x0c1e1a
          : 0x131f22;
    const verge = new THREE.Mesh(
      new THREE.PlaneGeometry(54, 5.2),
      new THREE.MeshStandardMaterial({ color: vergeColor, roughness: 0.95, metalness: 0.0 }),
    );
    verge.rotation.x = -Math.PI / 2;
    verge.position.set(0, -0.02, -4.6);
    this.worldGroup.add(verge);

    const addParallax = (obj: THREE.Object3D, speedFactor: number, span = PARALLAX_SPAN) => {
      this.worldGroup.add(obj);
      this.parallaxItems.push({ obj, speedFactor, span });
    };

    // 3. Platform altı heykelsi ortaçağ köprü kemerleri, payandalar ve duvar meşaleleri
    const bridgeBayCount = 8;
    const bayWidth = PARALLAX_SPAN / bridgeBayCount;
    for (let i = 0; i < bridgeBayCount; i++) {
      const hasTorch = i % 2 === 0;
      const bay = createBridgeBay(this.mats, bayWidth, Boolean(lvl.isInterior), hasTorch);
      bay.group.position.set(-PARALLAX_SPAN / 2 + (i + 0.5) * bayWidth, 0, 2.55);
      addParallax(bay.group, 1.0, PARALLAX_SPAN);
      this.torchFlames.push(...bay.flames);
    }

    // 4. Hareketli volümetrik sis ve çapraz ay ışığı hüzmeleri
    this.mistTexture = createMistBandTex(lvl.theme);
    this.shaftTexture = createLightShaftTex(lvl.theme);

    if (lvl.isInterior) {
      // Kraliyet Gotik Hazine Salonu sütunları, vitray ışık hüzmeleri ve altın fenerler
      for (let i = 0; i < 6; i++) {
        const x = -PARALLAX_SPAN / 2 + i * (PARALLAX_SPAN / 6);
        const pillar = createThronePillar(this.mats);
        pillar.position.set(x, 0, -5.2);
        addParallax(pillar, 0.52);
      }

      for (let i = 0; i < 4; i++) {
        const x = -PARALLAX_SPAN / 2 + (i + 0.5) * (PARALLAX_SPAN / 4);
        const shaftMat = new THREE.MeshBasicMaterial({
          map: this.shaftTexture,
          transparent: true,
          opacity: 0.36,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const shaft = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 16.5), shaftMat);
        shaft.position.set(x, 7.6, -6.8);
        shaft.rotation.z = -0.22;
        addParallax(shaft, 0.36);
        this.lightShafts.push(shaft);
      }

      for (let i = 0; i < 4; i++) {
        const x = -PARALLAX_SPAN / 2 + (i + 0.5) * (PARALLAX_SPAN / 4);
        const lantern = createRoadsideLanternAndRocks(lvl.theme, true, this.maxAnisotropy);
        lantern.group.position.set(x, 0, -2.25);
        addParallax(lantern.group, 1.0);
        if (lantern.glowMesh) this.lanternGlows.push(lantern.glowMesh);
      }

      for (let i = 0; i < 3; i++) {
        const x = -PARALLAX_SPAN / 2 + i * (PARALLAX_SPAN / 3);
        const mist = new THREE.Mesh(
          new THREE.PlaneGeometry(16.5, 3.2),
          new THREE.MeshBasicMaterial({
            map: this.mistTexture,
            transparent: true,
            opacity: 0.22,
            depthWrite: false,
          }),
        );
        mist.position.set(x, 0.9, -1.7);
        addParallax(mist, 0.68);
      }
      return;
    }

    // 5. Dış Mekan Çok Katmanlı Karanlık Fantastik Orman & Dağ Paralaksı
    // Katman A: Uzak gotik dağlar ve yıkık kale kuleleri silueti
    this.mountainTexture = createMountainLayerTex(lvl.theme, this.maxAnisotropy);
    const mountainPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 12.6),
      new THREE.MeshBasicMaterial({
        map: this.mountainTexture,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
    );
    mountainPlane.position.set(0, 5.6, -15.2);
    this.worldGroup.add(mountainPlane);

    // Katman B: Orta-uzak sisli kadim çam ormanı katmanı
    this.forestTexture = createForestCanopyLayerTex(lvl.theme, this.maxAnisotropy);
    const forestPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 11.4),
      new THREE.MeshBasicMaterial({
        map: this.forestTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    forestPlane.position.set(0, 4.9, -11.4);
    this.worldGroup.add(forestPlane);

    // Katman C: Orta mesafe süzülen volümetrik sis şeridi
    const midMistPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 4.8),
      new THREE.MeshBasicMaterial({
        map: this.mistTexture,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
    );
    midMistPlane.position.set(0, 2.0, -8.2);
    this.worldGroup.add(midMistPlane);

    // Katman D: Ağaç tepelerinden süzülen çapraz ay ışığı hüzmeleri
    for (let i = 0; i < 4; i++) {
      const x = -PARALLAX_SPAN / 2 + (i + 0.4) * (PARALLAX_SPAN / 4);
      const shaftMat = new THREE.MeshBasicMaterial({
        map: this.shaftTexture,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 16.5), shaftMat);
      shaft.position.set(x, 7.6, -7.0);
      shaft.rotation.z = -0.24;
      addParallax(shaft, 0.34);
      this.lightShafts.push(shaft);
    }

    // Katman E: El boyaması budaklı kadim ağaçlar ve gotik yapılar
    for (let i = 0; i < 8; i++) {
      const x = -PARALLAX_SPAN / 2 + i * (PARALLAX_SPAN / 8);
      if (lvl.theme === 'village') {
        const isHouse = i % 2 === 0;
        const prop = isHouse
          ? createHandPaintedGothicBuilding(lvl.theme, i, this.maxAnisotropy)
          : createHandPaintedTree(
              lvl.theme,
              i,
              1.02 + (i % 3) * 0.14,
              this.maxAnisotropy,
            );
        prop.position.set(x, 0, isHouse ? -5.1 : -4.2 - (i % 2) * 0.6);
        addParallax(prop, isHouse ? 0.54 : 0.6);
      } else if (lvl.theme === 'market') {
        const isTree = i % 3 === 1;
        const prop = isTree
          ? createHandPaintedTree(lvl.theme, i, 1.0 + (i % 2) * 0.16, this.maxAnisotropy)
          : createHandPaintedGothicBuilding(lvl.theme, i + 1, this.maxAnisotropy);
        prop.position.set(x, 0, isTree ? -4.3 : -5.1);
        addParallax(prop, isTree ? 0.6 : 0.54);
      } else if (lvl.theme === 'forest') {
        const tree = createHandPaintedTree(
          lvl.theme,
          i,
          1.08 + (i % 3) * 0.18,
          this.maxAnisotropy,
        );
        tree.position.set(x, 0, -3.9 - (i % 2) * 1.45);
        addParallax(tree, i % 2 === 0 ? 0.62 : 0.5);
      } else {
        const isTower = i % 2 === 0;
        const prop = isTower
          ? createHandPaintedGothicBuilding(lvl.theme, 2, this.maxAnisotropy)
          : createHandPaintedTree(lvl.theme, i + 2, 1.06 + (i % 2) * 0.15, this.maxAnisotropy);
        prop.position.set(x, 0, isTower ? -5.3 : -4.4);
        addParallax(prop, isTower ? 0.54 : 0.6);
      }
    }

    // Katman F: Yol kenarı yosunlu kayalar, çalılar ve sıcak ışık yayan dövme demir sokak fenerleri
    for (let i = 0; i < 7; i++) {
      const x = -PARALLAX_SPAN / 2 + i * (PARALLAX_SPAN / 7) + 1.1;
      const hasLantern = i % 2 === 0;
      const prop = createRoadsideLanternAndRocks(lvl.theme, hasLantern, this.maxAnisotropy);
      prop.group.position.set(x, 0, -2.08);
      addParallax(prop.group, 1.0);
      if (prop.glowMesh) {
        this.lanternGlows.push(prop.glowMesh);
      }
    }

    // Katman G: Yol üstünden hafifçe süzülen yakın yer sisi
    for (let i = 0; i < 3; i++) {
      const x = -PARALLAX_SPAN / 2 + i * (PARALLAX_SPAN / 3);
      const nearMist = new THREE.Mesh(
        new THREE.PlaneGeometry(16.8, 3.1),
        new THREE.MeshBasicMaterial({
          map: this.mistTexture,
          transparent: true,
          opacity: 0.34,
          depthWrite: false,
        }),
      );
      nearMist.position.set(x, 0.82, -1.55);
      addParallax(nearMist, 0.72);
    }
  }

  private spawnRoadTarget(spawnX: number): number {
    const lvl = this.level;
    this.spawnSeed++;

    const lastTarget = this.targets[this.targets.length - 1];
    const lastWasSensitive =
      lastTarget &&
      (lastTarget.enemyKind === 'witch' || lastTarget.category === 'special_npc');

    // 1) ÖZEL KARAKTERLER (Prenses, Kral, Rahip, Çocuk -> Vurma! | Altın Tüccarı, Tavuk, Gezgin -> Bonus!)
    // Adil mesafe için her zaman tek başına ve başka bir hassas karakterin hemen arkasından gelmez
    if (
      this.screen === 'PLAYING' &&
      !lastWasSensitive &&
      lvl.specialNpcPool.length > 0 &&
      Math.random() < lvl.specialNpcChance
    ) {
      const npcKind =
        lvl.specialNpcPool[Math.floor(Math.random() * lvl.specialNpcPool.length)];
      if (npcKind === 'princess') this.roundSawPrincess = true;
      if (npcKind === 'king') this.roundSawKing = true;
      const spec = getSpecialNpcSpec(npcKind);
      const mesh = createSpecialNpcMesh(npcKind);
      mesh.position.set(spawnX, GROUND_Y, 0);
      this.scene.add(mesh);

      this.targets.push({
        id: this.nextEntityId++,
        category: 'special_npc',
        specialNpcKind: npcKind,
        mesh,
        x: spawnX,
        y: GROUND_Y,
        zOffset: 0,
        vx: 0,
        vy: 0,
        rotZ: 0,
        rotSpeed: 0,
        width: spec.width * 0.78,
        baseGold: Math.round(spec.bonusGold * lvl.goldScale),
        basePoints: spec.bonusPoints,
        extraSpeed: (spec.speedMult - 1) * 2.2,
        animTime: Math.random() * 6,
        hitsTaken: 0,
        maxHits: 1,
        slowTimer: 0,
        tumbling: false,
        isSprinter: npcKind === 'chicken',
        dustAccum: 0,
        smashed: false,
        removed: false,
      });
      return 1;
    }

    // 2) Cadılar her zaman tek başına ve adil mesafeyle gelir
    const allowWitch = this.screen === 'PLAYING' && !lastWasSensitive;
    if (allowWitch && Math.random() < lvl.witchChance) {
      const rig = createDarkFantasyEnemyRig('witch', this.spawnSeed);
      rig.root.position.set(spawnX, GROUND_Y, 0);
      this.scene.add(rig.root);
      this.targets.push({
        id: this.nextEntityId++,
        category: 'character',
        enemyKind: 'witch',
        mesh: rig.root,
        rig,
        x: spawnX,
        y: GROUND_Y,
        zOffset: 0,
        vx: 0,
        vy: 0,
        rotZ: 0,
        rotSpeed: 0,
        width: 1.1,
        baseGold: 0,
        basePoints: 0,
        extraSpeed: 0.75,
        animTime: Math.random() * 6,
        hitsTaken: 0,
        maxHits: 1,
        slowTimer: 0,
        tumbling: false,
        isSprinter: false,
        dustAccum: 0,
        smashed: false,
        removed: false,
      });
      return 1;
    }

    const characterBias =
      lvl.spawnPattern === 'treasure_run'
        ? 0.34
        : lvl.spawnPattern === 'swarm' || lvl.spawnPattern === 'sprinter_rush'
          ? 0.66
          : 0.52;
    const spawnCharacter = Math.random() < characterBias;
    if (spawnCharacter) {
      // Dinamik kalabalık dalga sistemi: 1'li, 2'li veya 3'lü rastgele mob grupları + aradan hızlı fırlayan koşucular!
      let groupCount = 1;
      if (this.screen === 'PLAYING') {
        const waveRoll = Math.random();
        if (lvl.spawnPattern === 'swarm') {
          groupCount = waveRoll < 0.2 ? 1 : waveRoll < 0.58 ? 2 : 3;
        } else if (waveRoll < 0.4) {
          groupCount = 1;
        } else if (waveRoll < 0.76) {
          groupCount = 2;
        } else {
          groupCount = 3;
        }
      }

      let sprinterIdx = -1;
      if (this.screen === 'PLAYING') {
        const sprintChance =
          lvl.spawnPattern === 'sprinter_rush'
            ? 0.68
            : groupCount === 3
              ? 0.52
              : groupCount === 2
                ? 0.38
                : 0.32;
        if (Math.random() < sprintChance) {
          sprinterIdx =
            groupCount === 1
              ? 0
              : Math.min(groupCount - 1, Math.floor(Math.random() * groupCount));
        }
      }

      const baseGoldMap: Record<EnemyKind, number> = {
        villager: 8,
        merchant: 15,
        guard: 18,
        witch: 0,
      };

      const zLayouts: Record<number, number[]> = {
        1: [0],
        2: [-0.24, 0.24],
        3: [-0.34, 0.04, 0.36],
      };
      const zOffsets = zLayouts[groupCount] ?? [0];

      let cursorX = spawnX;
      for (let i = 0; i < groupCount; i++) {
        this.spawnSeed++;
        const kind = lvl.characterPool[Math.floor(Math.random() * lvl.characterPool.length)];
        const isSprinter = i === sprinterIdx;
        const zOffset = zOffsets[i] ?? 0;
        const rig = createDarkFantasyEnemyRig(kind, this.spawnSeed);
        rig.root.position.set(cursorX, GROUND_Y, zOffset);
        this.scene.add(rig.root);

        const baseWalkExtra = kind === 'guard' ? 1.05 : 0.65;
        const sprintBonus = isSprinter ? 2.85 + Math.random() * 1.1 : (Math.random() - 0.5) * 0.25;

        this.targets.push({
          id: this.nextEntityId++,
          category: 'character',
          enemyKind: kind,
          mesh: rig.root,
          rig,
          x: cursorX,
          y: GROUND_Y,
          zOffset,
          vx: 0,
          vy: 0,
          rotZ: isSprinter ? 0.14 : 0,
          rotSpeed: 0,
          width: 1.15,
          baseGold: Math.round(baseGoldMap[kind] * lvl.goldScale),
          basePoints: getEnemyBasePoints(kind, isSprinter),
          extraSpeed: Math.max(0.35, baseWalkExtra + sprintBonus),
          animTime: Math.random() * 6,
          hitsTaken: 0,
          maxHits: 1,
          slowTimer: 0,
          tumbling: false,
          isSprinter,
          dustAccum: 0,
          smashed: false,
          removed: false,
        });

        cursorX += 1.05 + Math.random() * 0.48;
      }
      return groupCount;
    } else {
      // 3) Kırılabilir Çevre Objeleri & 13 Özel Etkileşimli Nesne
      const useSpecial =
        this.screen === 'PLAYING' &&
        lvl.specialObjectPool.length > 0 &&
        Math.random() < lvl.specialObjectChance;
      const pool = useSpecial ? lvl.specialObjectPool : lvl.objectPool;
      const kind = pool[Math.floor(Math.random() * pool.length)];
      const spec = getBreakableSpec(kind);

      const mesh = LEGACY_DARK_FANTASY_BREAKABLES.has(kind)
        ? createDarkFantasyBreakable(kind, this.spawnSeed)
        : createCatalogBreakableMesh(kind);
      mesh.position.set(spawnX, GROUND_Y + spec.floatY, 0);
      this.scene.add(mesh);

      this.targets.push({
        id: this.nextEntityId++,
        category: 'breakable',
        breakableKind: kind,
        mesh,
        x: spawnX,
        y: GROUND_Y + spec.floatY,
        zOffset: 0,
        vx: 0,
        vy: 0,
        rotZ: 0,
        rotSpeed: 0,
        width: spec.width * 1.15,
        baseGold: Math.round(spec.baseGold * lvl.goldScale),
        basePoints: spec.basePoints,
        extraSpeed: 0,
        animTime: Math.random() * 6,
        hitsTaken: 0,
        maxHits: spec.maxHits,
        slowTimer: 0,
        tumbling: false,
        isSprinter: false,
        dustAccum: 0,
        smashed: false,
        removed: false,
      });
      return 1;
    }
  }

  private spawnSpecificBreakable(kind: BreakableKind, spawnX: number): void {
    this.spawnSeed++;
    const spec = getBreakableSpec(kind);
    const mesh = LEGACY_DARK_FANTASY_BREAKABLES.has(kind)
      ? createDarkFantasyBreakable(kind, this.spawnSeed)
      : createCatalogBreakableMesh(kind);
    mesh.position.set(spawnX, GROUND_Y + spec.floatY, 0);
    this.scene.add(mesh);

    this.targets.push({
      id: this.nextEntityId++,
      category: 'breakable',
      breakableKind: kind,
      mesh,
      x: spawnX,
      y: GROUND_Y + spec.floatY,
      zOffset: 0,
      vx: 0,
      vy: 0,
      rotZ: 0,
      rotSpeed: 0,
      width: spec.width * 1.15,
      baseGold: Math.round(spec.baseGold * this.level.goldScale),
      basePoints: spec.basePoints,
      extraSpeed: 0,
      animTime: Math.random() * 6,
      hitsTaken: 0,
      maxHits: spec.maxHits,
      slowTimer: 0,
      tumbling: false,
      isSprinter: false,
      dustAccum: 0,
      smashed: false,
      removed: false,
    });
  }

  private burstCoins(x: number, y: number, totalGold: number, bags: number): void {
    let remaining = Math.max(4, Math.round(totalGold));

    // Altın kesesi yalnızca toplam ganimet yeterliyse payından düşülerek atılır (asla ekstra altın uydurmaz)
    for (let i = 0; i < bags; i++) {
      if (remaining < 10) break;
      const bagVal = Math.max(4, Math.min(remaining - 3, Math.round(remaining * 0.28)));
      remaining -= bagVal;
      this.spawnPickup(
        x + 0.15 + Math.random() * 0.45,
        y + 0.85,
        4.2 + Math.random() * 3.2,
        10.2 + Math.random() * 2.8,
        bagVal,
        true,
        0.46 + Math.random() * 0.14,
      );
    }

    // Düşen toplam altın miktarını birebir koruyarak 4-15 adet gösterişli sikkeye böler
    const desiredCoins = Math.round(3 + totalGold * 0.16);
    const coinCount = Math.max(1, Math.min(15, remaining, Math.max(4, desiredCoins)));

    if (remaining > 0) {
      const baseVal = Math.floor(remaining / coinCount);
      let extra = remaining - baseVal * coinCount;
      for (let i = 0; i < coinCount; i++) {
        const val = baseVal + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
        if (val <= 0) continue;

        const frac = coinCount > 1 ? i / (coinCount - 1) : 0.5;
        // Tüm altınlar ölen hedeften İLERİYE (+X) doğru yelpaze gibi fırlatılır
        const vx = 3.2 + frac * 6.4 + (Math.random() - 0.5) * 1.4;
        const vy = 7.4 + Math.sin(frac * Math.PI) * 4.2 + Math.random() * 2.6;
        const scatterDelay = 0.34 + frac * 0.2 + Math.random() * 0.08;

        this.spawnPickup(
          x + (Math.random() - 0.25) * 0.6,
          y + 0.72 + Math.random() * 0.25,
          vx,
          vy,
          val,
          false,
          scatterDelay,
        );
      }
    }
  }

  private spawnPickup(
    x: number,
    y: number,
    vx: number,
    vy: number,
    value: number,
    isBag: boolean,
    scatterDelay = 0.4,
  ): void {
    const mesh = isBag ? createGoldBagMesh(this.mats) : createCoinMesh(this.mats);
    const z = (Math.random() - 0.5) * 1.15;
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.pickups.push({
      id: this.nextEntityId++,
      isBag,
      mesh,
      x,
      y,
      z,
      vx,
      vy,
      value,
      age: 0,
      scatterDelay,
      bounces: 0,
      magnetized: false,
      spinSpeed: isBag ? 3.5 : 8 + Math.random() * 5,
      life: 4.5,
      collected: false,
    });
  }

  private spawnParticles(x: number, y: number, count: number, colorHex: number, speed = 7): void {
    let spawned = 0;
    for (const pt of this.particles) {
      if (pt.active) continue;
      pt.active = true;
      pt.life = 0;
      pt.maxLife = 0.32 + Math.random() * 0.34;
      pt.vx = (Math.random() - 0.25) * speed * 1.9;
      pt.vy = 2.8 + Math.random() * speed;
      pt.vz = (Math.random() - 0.5) * 2.5;
      pt.rotSpeed = (Math.random() - 0.5) * 14;
      pt.gravity = -22;
      pt.mesh.position.set(x, y, 0.35);
      pt.mesh.scale.setScalar(0.9 + Math.random() * 0.85);
      (pt.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      pt.mesh.visible = true;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private spawnDustPuff(x: number, y: number, count = 3): void {
    let spawned = 0;
    for (const pt of this.particles) {
      if (pt.active) continue;
      pt.active = true;
      pt.life = 0;
      pt.maxLife = 0.24 + Math.random() * 0.18;
      pt.vx = -(1.8 + Math.random() * 2.6);
      pt.vy = 0.9 + Math.random() * 1.6;
      pt.vz = (Math.random() - 0.5) * 0.6;
      pt.rotSpeed = (Math.random() - 0.5) * 6;
      pt.gravity = -4.5;
      pt.mesh.position.set(x + (Math.random() - 0.5) * 0.4, y + 0.12, 0.22);
      pt.mesh.scale.setScalar(0.65 + Math.random() * 0.55);
      (pt.mesh.material as THREE.MeshBasicMaterial).color.setHex(
        Math.random() > 0.4 ? 0x94a3b8 : 0x64748b,
      );
      pt.mesh.visible = true;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private spawnStarburst(x: number, y: number, scale = 1.1): void {
    for (const sb of this.starbursts) {
      if (sb.active) continue;
      sb.active = true;
      sb.life = 0;
      sb.maxLife = 0.18;
      sb.mesh.position.set(x, y, 1.35);
      sb.mesh.rotation.z = Math.random() * Math.PI;
      sb.mesh.scale.setScalar(scale * 0.5);
      sb.mesh.visible = true;
      break;
    }
  }

  private spawnPopup(
    worldX: number,
    worldY: number,
    text: string,
    color = '#fde047',
    scale = 1,
  ): void {
    _projVec.set(worldX, worldY, 0.5).project(this.camera);
    const screenX = Math.max(10, Math.min(90, (_projVec.x * 0.5 + 0.5) * 100));
    const screenY = Math.max(14, Math.min(80, (-_projVec.y * 0.5 + 0.5) * 100));
    this.callbacks.onPopup({
      id: this.nextPopupId++,
      text,
      screenX,
      screenY,
      color,
      scale,
    });
  }

  private scheduleNextFrame(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => this.tick());
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(): void {
    if (this.disposed) return;

    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    if (this.screen === 'TITLE') {
      this.updateTitleAttract(dt);
    } else if (this.screen === 'PLAYING') {
      this.updateGameplay(dt);
    } else if (this.screen === 'TUTORIAL') {
      this.updateTutorial(dt);
    } else {
      this.elapsed += dt * 0.25;
      this.scrollWorld(dt * 0.25);
    }

    this.updateCameraShake(dt);
    this.renderer.render(this.scene, this.camera);
    this.scheduleNextFrame();
  }

  private scrollWorld(dt: number): void {
    const speed = this.level.scrollSpeed;

    if (this.roadTexture) {
      this.roadTexture.offset.x = (this.roadTexture.offset.x + (speed * dt) / 5.2) % 1;
    }
    if (this.wallTexture) {
      this.wallTexture.offset.x = (this.wallTexture.offset.x + (speed * dt) / 4.5) % 1;
    }
    if (this.mountainTexture) {
      this.mountainTexture.offset.x = (this.mountainTexture.offset.x + speed * dt * 0.012) % 1;
    }
    if (this.forestTexture) {
      this.forestTexture.offset.x = (this.forestTexture.offset.x + speed * dt * 0.028) % 1;
    }
    if (this.mistTexture) {
      this.mistTexture.offset.x = (this.mistTexture.offset.x + speed * dt * 0.042) % 1;
    }

    for (let i = 0; i < this.torchFlames.length; i++) {
      const flame = this.torchFlames[i];
      const pulse =
        1 +
        Math.sin(this.elapsed * 14 + i * 2.1) * 0.14 +
        Math.cos(this.elapsed * 23 + i * 1.3) * 0.08;
      flame.scale.set(1 + (pulse - 1) * 0.4, pulse, 1);
    }

    for (let i = 0; i < this.lanternGlows.length; i++) {
      const glow = this.lanternGlows[i];
      const flicker =
        0.56 +
        Math.sin(this.elapsed * 7.5 + i * 1.9) * 0.1 +
        Math.cos(this.elapsed * 15.2 + i * 2.7) * 0.05;
      glow.scale.setScalar(0.95 + (flicker - 0.56) * 0.8);
      (glow.material as THREE.MeshBasicMaterial).opacity = flicker;
    }

    for (let i = 0; i < this.lightShafts.length; i++) {
      const shaft = this.lightShafts[i];
      const shimmer = 0.3 + Math.sin(this.elapsed * 1.6 + i * 1.4) * 0.09;
      (shaft.material as THREE.MeshBasicMaterial).opacity = shimmer;
    }

    for (const item of this.parallaxItems) {
      item.obj.position.x -= speed * item.speedFactor * dt;
      const halfSpan = item.span / 2;
      if (item.obj.position.x < -halfSpan) {
        item.obj.position.x += item.span;
      }
    }

    // Uçuşan karanlık orman yaprakları ve parlayan ateş böcekleri
    const leftEdge = this.camera.left - 1.5;
    const rightEdge = this.camera.right + 1.5;
    for (const m of this.ambientMotes) {
      if (!m.mesh.visible) continue;
      m.phase += dt * (m.isLeaf ? 3.2 : 2.1);
      m.mesh.position.x += (m.vx - speed * (m.isLeaf ? 0.35 : 0.18)) * dt;
      m.mesh.position.y += (m.vy + Math.sin(m.phase) * m.amp) * dt;
      if (m.isLeaf) {
        m.mesh.rotation.z += m.rotSpeed * dt;
        m.mesh.rotation.x = Math.sin(m.phase * 1.3) * 0.65;
      } else {
        const pulse = 0.38 + Math.abs(Math.sin(m.phase * 1.5)) * 0.56;
        (m.mesh.material as THREE.MeshBasicMaterial).opacity = pulse;
        m.mesh.scale.setScalar(m.baseScale * (0.75 + pulse * 0.45));
      }

      if (m.mesh.position.x < leftEdge || m.mesh.position.y < 0.25) {
        m.mesh.position.x = rightEdge + Math.random() * 2.5;
        m.mesh.position.y = m.isLeaf ? 5.5 + Math.random() * 6.5 : 0.8 + Math.random() * 8.5;
      }
    }
  }

  private updateTitleAttract(dt: number): void {
    this.elapsed += dt;
    this.animTime += dt;
    this.scrollWorld(dt * 0.85);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 1.6;
      this.spawnRoadTarget(this.camera.right + 2.5);
    }

    const knightX = this.anchorX;
    for (const t of this.targets) {
      if (t.removed) continue;
      if (!t.smashed) {
        t.x -= (this.level.scrollSpeed * 0.85 + t.extraSpeed) * dt;
        const yPos =
          t.enemyKind === 'witch' ? 0.22 + Math.sin(t.animTime * 4.5) * 0.16 : GROUND_Y;
        t.mesh.position.set(t.x, yPos, 0);
        if (t.rig) {
          t.animTime += dt;
          updateDarkFantasyEnemyRig(t.rig, t.animTime, t.x - knightX, yPos);
        }
        if (t.x > knightX + 0.8 && t.x < knightX + 2.75 && this.swingTimer <= 0) {
          this.swingPower = 0.85;
          this.swingTimer = this.swingDuration;
          this.swingHitChecked = true;
          t.smashed = true;
          t.vx = 14;
          t.vy = 11;
          t.rotSpeed = -12;
          this.burstCoins(t.x, 0.7, 36, 0);
          this.spawnStarburst(t.x, 1.1, 1.1);
          this.spawnParticles(t.x, 1.0, 8, 0xfacc15, 7);
        }
      } else {
        t.vy += GRAVITY * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.rotZ += t.rotSpeed * dt;
        t.mesh.position.set(t.x, t.y, 0);
        t.mesh.rotation.z = t.rotZ;
      }

      if (t.x < this.camera.left - 4 || t.x > this.camera.right + 10 || t.y < -5) {
        t.removed = true;
        this.scene.remove(t.mesh);
      }
    }
    this.targets = this.targets.filter((t) => !t.removed);

    if (this.swingTimer > 0) {
      this.swingTimer = Math.max(0, this.swingTimer - dt);
      const p = 1 - this.swingTimer / this.swingDuration;
      this.hopOffsetX = Math.sin(p * Math.PI) * 1.15;
      this.hopY = Math.sin(p * Math.PI) * 1.05;
      this.animState = 'smash';
    } else {
      this.hopOffsetX = 0;
      this.hopY = 0;
      this.animState = 'run';
    }

    this.updatePickups(dt, false);
    this.updateParticlesAndFx(dt);
    this.animateKnightRig(dt);
  }

  private updateGameplay(dt: number): void {
    this.elapsed += dt;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.updateParticlesAndFx(dt * 0.25);
      return;
    }

    if (this.getMedievalFlashTimer > 0) {
      this.getMedievalFlashTimer = Math.max(0, this.getMedievalFlashTimer - dt);
    }

    // Kısa kombo süresi sayacı: süre dolarsa kombo anında sıfırlanır
    if (this.combo > 0) {
      if (this.combo >= 2 && !this.isTutorialMode) {
        this.comboHoldSeconds += dt;
        if (!this.comboHoldAchievementSent && this.comboHoldSeconds >= 15) {
          this.comboHoldAchievementSent = true;
          this.callbacks.onAchievementEvent?.({
            type: 'combo_updated',
            combo: this.combo,
            holdSeconds: this.comboHoldSeconds,
          });
        }
      }
      this.comboTimer = Math.max(0, this.comboTimer - dt);
      if (this.comboTimer <= 0) {
        this.combo = 0;
        this.comboTimer = 0;
        this.comboHoldSeconds = 0;
      }
    }

    // Aktif Bonus süreleri ve ekrandaki büyük bilgilendirme bandı sayacı
    if (this.doubleScoreTimer > 0) {
      this.doubleScoreTimer = Math.max(0, this.doubleScoreTimer - dt);
    }
    if (this.powerSurgeTimer > 0) {
      this.powerSurgeTimer = Math.max(0, this.powerSurgeTimer - dt);
      this.powerAuraAccum += dt;
      if (this.powerAuraAccum >= 0.14) {
        this.powerAuraAccum = 0;
        const kx = this.getKnightX();
        this.spawnParticles(kx + 0.15, 1.35 + this.hopY, 2, 0xf97316, 4.2);
      }
    }
    if (this.bonusBannerTimer > 0) {
      this.bonusBannerTimer = Math.max(0, this.bonusBannerTimer - dt);
      if (this.bonusBannerTimer <= 0) {
        this.activeBonusBanner = null;
      }
    }

    if (this.eventBannerTimer > 0) {
      this.eventBannerTimer = Math.max(0, this.eventBannerTimer - dt);
      if (this.eventBannerTimer <= 0) {
        this.activeEventBanner = null;
      }
    }

    // Tam ekran eğlenceli görsel efekt sayaçlarını güncelle
    if (this.screenEffects.length > 0) {
      let fxChanged = false;
      for (const fx of this.screenEffects) {
        fx.timeLeft = Math.max(0, fx.timeLeft - dt);
        if (fx.timeLeft <= 0) fxChanged = true;
      }
      if (fxChanged) {
        this.screenEffects = this.screenEffects.filter((fx) => fx.timeLeft > 0);
      }
    }

    // BOSS SAVAŞI BÖLÜMÜ (10, 20, 30, 40, 50, 60)
    if (this.level.isBossLevel && this.boss) {
      if (this.bossVictoryDelay > 0) {
        this.bossVictoryDelay -= dt;
        this.scrollWorld(dt * 0.1);
        this.updatePickups(dt);
        this.updateParticlesAndFx(dt);
        if (this.bossVictoryDelay <= 0) {
          this.finishLevel(true);
        }
        return;
      }

      if (!this.levelEnding) {
        this.timeLeft = Math.max(0, this.timeLeft - dt);
        if (this.timeLeft <= 0 && !this.boss.defeated) {
          this.finishLevel(
            false,
            'SÜRE DOLDU!',
            `${this.level.boss?.name || 'Boss'} zamanında yenilemedi. Tekrar dene!`,
          );
          return;
        }
      }

      this.scrollWorld(dt * 0.16);
      this.updateKnight(dt);
      this.boss.update({
        dt,
        elapsed: this.elapsed,
        knightX: this.getKnightX(),
        knightY: this.bossJumpY + this.hopY,
        knightStunned: this.dizzyTimer > 0,
        knightInvuln: this.bossPlayerInvulnTimer > 0,
        onKnightHitHazard: (pushDir, label) => {
          if (this.bossPlayerInvulnTimer > 0 || this.levelEnding) return;
          this.roundMistakes += 1;
          this.bossPlayerHp = Math.max(0, this.bossPlayerHp - 1);
          this.bossPlayerInvulnTimer = 1.15;
          this.dizzyDuration = 0.5;
          this.dizzyTimer = 0.5;
          this.isCharging = false;
          this.charge = 0;
          this.swingTimer = 0;
          this.moveOffsetX = Math.max(-2.1, this.moveOffsetX + pushDir * 1.25);
          this.camShake = 0.58;
          audioEngine.playPlayerHurt();
          this.triggerScreenEffect('damage_vignette', 0.55);
          this.spawnParticles(this.getKnightX(), 1.3 + this.bossJumpY, 14, 0xef4444, 8.5);
          this.spawnPopup(this.getKnightX(), 2.6 + this.bossJumpY, label, '#fb7185', 1.24);

          if (this.bossPlayerHp <= 0) {
            this.knight.root.visible = true;
            this.spawnParticles(this.getKnightX(), 1.2, 26, 0xef4444, 11);
            audioEngine.playFailForbidden();
            this.finishLevel(
              false,
              'BOSS SENİ YENDİ!',
              `${this.level.boss?.name || 'Boss'} karşısında canın tükendi! Saldırılardan zıplayarak kaçmayı dene.`,
            );
            return;
          }
          this.emitHud();
        },
        onBossPopup: (text, x, y, color, scale = 1.2) => {
          this.spawnPopup(x, y, text, color, scale);
        },
        onBossRoar: () => {
          audioEngine.playBossRoar();
          this.camShake = Math.max(this.camShake, 0.35);
        },
        onBossDefeated: (bx, by) => {
          audioEngine.playBossVictory();
          this.camShake = 0.9;
          this.spawnParticles(bx, by, 34, 0xfacc15, 11);
          this.spawnParticles(bx, by + 0.5, 22, 0xf97316, 10);
          this.spawnStarburst(bx, by, 2.2);
          if (this.level.boss) {
            this.handleScoreResult(
              this.scoreManager.addBossDefeatScore(
                this.level.boss.rewardScore,
                this.level.boss.id,
              ),
            );
            this.levelGold += this.level.boss.rewardGold;
            this.walletGold += this.level.boss.rewardGold;
            this.callbacks.onAchievementEvent?.({
              type: 'boss_defeated',
              bossId: this.level.boss.id,
              eventKey: `boss_${this.currentRunId}_${this.level.boss.id}`,
            });
            this.callbacks.onAchievementEvent?.({
              type: 'gold_earned',
              amount: this.level.boss.rewardGold,
              eventKey: `boss_gold_${this.currentRunId}`,
            });
            this.burstCoins(bx, by, 90, 2);
            this.spawnPopup(
              bx,
              3.5,
              `${this.level.boss.name.toUpperCase()} YENİLDİ!`,
              '#4ade80',
              1.48,
            );
          }
          this.bossVictoryDelay = 1.35;
          this.emitHud();
        },
      });
      this.updatePickups(dt);
      this.updateParticlesAndFx(dt);

      this.hudEmitAccum += dt;
      if (this.hudEmitAccum >= 0.045) {
        this.hudEmitAccum = 0;
        this.emitHud();
      }
      return;
    }

    // NORMAL BÖLÜMLER: Süre kontrolü: yalnızca BU bölümde kazanılan SKOR hedefe ulaştıysa bölüm geçilir!
    if (!this.levelEnding) {
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft <= 0) {
        const won = this.scoreManager.isTargetMet();
        this.finishLevel(won);
        return;
      }
    }

    this.scrollWorld(dt);

    // Bölüme özgü mini etkinlikler (Altın Yağmuru, TNT Zinciri, Hızlı Dalga)
    if (this.level.levelEvent !== 'none' && this.timeLeft > 6 && !this.levelEnding) {
      this.levelEventCooldown -= dt;
      if (this.levelEventCooldown <= 0) {
        this.levelEventCooldown = 19 + Math.random() * 6;
        if (this.level.levelEvent === 'gold_rain') {
          this.activeEventBanner = '✨ ALTIN YAĞMURU BAŞLADI!';
          this.eventBannerTimer = 2.4;
          for (let i = 0; i < 6; i++) {
            this.spawnPickup(
              this.getKnightX() + 1.8 + i * 0.9,
              6.2 + i * 0.4,
              -1.2,
              -2.5,
              Math.round(8 * this.level.goldScale),
              false,
              0.2,
            );
          }
        } else if (this.level.levelEvent === 'tnt_chain') {
          this.activeEventBanner = '💥 PATLAYICI DALGA! TNT GELİYOR!';
          this.eventBannerTimer = 2.2;
          this.spawnSpecificBreakable('tnt_crate', this.camera.right + 2.2);
        } else if (this.level.levelEvent === 'sprinter_wave') {
          this.activeEventBanner = '⚡ HIZLI DÜŞMAN DALGASI!';
          this.eventBannerTimer = 2.2;
        }
      }
    }

    // Bölümler boyunca rastgele bonus nesneleri yerleştir
    if (this.timeLeft > 4 && !this.levelEnding) {
      this.bonusSpawnTimer -= dt;
      if (this.bonusSpawnTimer <= 0) {
        this.bonusSpawnTimer = 9.0 + Math.random() * 4.2;
        this.spawnBonus(this.camera.right + 1.9, 1.38, undefined, false);
      }
    }

    // Her bölümde 2-3 kez oyuncuyu korkutmak için sürpriz hızlı koşan cadı!
    if (this.surpriseWitchesRemaining > 0 && this.timeLeft > 4) {
      this.surpriseWitchCooldown -= dt;
      const hasActiveWitch = this.targets.some(
        (t) => !t.removed && !t.smashed && t.enemyKind === 'witch',
      );
      if (this.surpriseWitchCooldown <= 0 && !hasActiveWitch) {
        this.surpriseWitchesRemaining--;
        this.surpriseWitchCooldown = 10.5 + Math.random() * 7.5;
        this.spawnSurpriseSprintWitch();
        this.spawnTimer = Math.max(this.spawnTimer, 0.72);
      }
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const spawnedCount = this.spawnRoadTarget(this.camera.right + 2.4);
      const jitter = (Math.random() - 0.35) * 0.42;
      const groupBreathing = spawnedCount === 3 ? 0.5 : spawnedCount === 2 ? 0.24 : 0;
      this.spawnTimer = Math.max(0.55, this.level.spawnInterval + jitter + groupBreathing);
    }

    this.updateKnight(dt);
    this.updateTargets(dt);
    this.updatePickups(dt);
    this.updateBonuses(dt);
    this.updateParticlesAndFx(dt);

    if (!this.quotaAnnounced && this.scoreManager.isTargetMet()) {
      this.quotaAnnounced = true;
      this.spawnPopup(0, 4.6, 'SKOR HEDEFİ TAMAM! DEVAM ET!', '#4ade80', 1.25);
      audioEngine.playGoldBag();
      this.emitHud();
    }

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.045) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  }

  private updateKnight(dt: number): void {
    this.animTime += dt;

    // Normal bölümlerde şövalye SABİT KONUMDA durur.
    // Serbest yatay hareket ve ZIPLAMA YALNIZCA Boss Bölümlerinde (10,20,30,40,50,60) aktiftir!
    if (this.screen === 'PLAYING' && this.level.isBossLevel) {
      if (Math.abs(this.bossMoveInput) > 0.04 && this.dizzyTimer <= 0) {
        const moveSpeed = 6.2;
        this.moveOffsetX = Math.max(
          -2.1,
          Math.min(5.2, this.moveOffsetX + this.bossMoveInput * moveSpeed * dt),
        );
      }
      // Boss Arenası Zıplama Fiziği
      if (!this.bossGrounded || this.bossJumpY > 0 || this.bossJumpVy !== 0) {
        this.bossJumpVy -= 34 * dt;
        this.bossJumpY += this.bossJumpVy * dt;
        if (this.bossJumpY <= 0) {
          this.bossJumpY = 0;
          this.bossJumpVy = 0;
          this.bossGrounded = true;
          this.spawnDustPuff(this.getKnightX(), GROUND_Y, 5);
        }
      }
      // Boss Hasar Dokunulmazlık (i-frame) Yanıp Sönmesi
      if (this.bossPlayerInvulnTimer > 0) {
        this.bossPlayerInvulnTimer = Math.max(0, this.bossPlayerInvulnTimer - dt);
        this.knight.root.visible = Math.floor(this.bossPlayerInvulnTimer * 18) % 2 === 0;
      } else {
        this.knight.root.visible = true;
      }
    } else if (this.isTutorialMode && this.tutorialStage === 6 && this.moveInput !== 0) {
      this.moveOffsetX = Math.max(
        -1.45,
        Math.min(3.85, this.moveOffsetX + this.moveInput * 5.2 * dt),
      );
      this.bossJumpY = 0;
      this.bossJumpVy = 0;
      this.bossGrounded = true;
      this.knight.root.visible = true;
    } else {
      this.moveInput = 0;
      this.bossMoveInput = 0;
      this.bossJumpY = 0;
      this.bossJumpVy = 0;
      this.bossGrounded = true;
      this.bossPlayerInvulnTimer = 0;
      this.knight.root.visible = true;
      if (Math.abs(this.moveOffsetX) > 0.005) {
        this.moveOffsetX += (0 - this.moveOffsetX) * (1 - Math.exp(-8 * dt));
      } else {
        this.moveOffsetX = 0;
      }
    }
    const knightBaseX = this.getKnightBaseX();

    // 1. Cadı Laneti: TAM 3 saniye pembe domuz (hareket edip tehlikelerden uzaklaşabilirsin!)
    if (this.pigTimer > 0) {
      this.pigTimer -= dt;
      this.isCharging = false;
      this.charge = 0;
      this.hopOffsetX += (0 - this.hopOffsetX) * (1 - Math.exp(-12 * dt));
      this.hopY = 0;
      if (this.pigTimer <= 0) {
        this.pigTimer = 0;
        this.spawnParticles(knightBaseX, 1.0, 14, 0xc026d3, 6.5);
        this.spawnPopup(knightBaseX + 0.4, 2.3, 'ŞÖVALYEYE DÖNDÜN!', '#fde047', 1.15);
        audioEngine.playSmash('magic');
        if (this.isTutorialMode) {
          this.emitTutorialSnapshot();
        } else {
          this.emitHud();
        }
      }
      this.animState = this.pigTimer > 0 ? 'pig' : 'run';
      this.animateKnightRig(dt);
      return;
    }

    // 2. Boşa Sallama Sersemleme Cezası (~1.5sn)
    if (this.dizzyTimer > 0) {
      this.dizzyTimer = Math.max(0, this.dizzyTimer - dt);
      this.isCharging = false;
      this.charge = 0;
      this.hopOffsetX += (0 - this.hopOffsetX) * (1 - Math.exp(-10 * dt));
      this.hopY = 0;
      this.animState = 'dizzy';
      this.animateKnightRig(dt);
      return;
    }

    // 3. İleri Zıplayarak Vuruş
    if (this.swingTimer > 0) {
      this.swingTimer = Math.max(0, this.swingTimer - dt);
      const p = 1 - this.swingTimer / this.swingDuration;
      const hopReach = 1.05 + this.swingPower * 1.1;
      const hopHeight = 0.85 + this.swingPower * 0.95;
      this.hopOffsetX = Math.sin(p * Math.PI) * hopReach;
      this.hopY = Math.sin(p * Math.PI) * hopHeight;

      if (!this.swingHitChecked && p >= 0.24 && p <= 0.65) {
        this.swingHitChecked = true;
        this.resolveSmashImpact();
      }

      if (this.swingTimer <= 0) {
        this.hopOffsetX = 0;
        this.hopY = 0;
        if (this.wasAirborne) {
          this.wasAirborne = false;
          this.spawnDustPuff(knightBaseX + 0.15, GROUND_Y, 5);
        }
      } else {
        this.wasAirborne = true;
      }

      this.animState = 'smash';
      this.animateKnightRig(dt);
      return;
    }

    // 4. Güç Toplama (Şarj)
    if (this.isCharging) {
      const surgeMult = this.powerSurgeTimer > 0 ? 1.65 : 1.0;
      const rate = getChargeRate(this.upgrades) * surgeMult;
      const prevCharge = this.charge;
      this.charge = Math.min(1, this.charge + rate * dt);
      this.chargeTickAccum += dt;
      if (this.charge < 1 && this.chargeTickAccum >= 0.13) {
        this.chargeTickAccum = 0;
        audioEngine.playChargeTick(this.charge);
      }
      if (prevCharge < 1 && this.charge >= 1 && !this.fullChargeChimed) {
        this.fullChargeChimed = true;
        audioEngine.playFullChargeReady();
        this.spawnParticles(knightBaseX + 0.1, 1.85, 8, 0xfde047, 4.5);
      }
      if (this.charge >= 0.98) {
        this.fullChargeSparkAccum += dt;
        if (this.fullChargeSparkAccum >= 0.22) {
          this.fullChargeSparkAccum = 0;
          this.spawnParticles(knightBaseX - 0.1, 2.0, 2, 0xfef08a, 3.2);
        }
      }
      this.animState = 'charge';
    } else {
      this.charge = 0;
      this.fullChargeSparkAccum = 0;
      this.animState = 'run';
    }

    // Yürüyüş / koşu adım toz efektleri
    this.footstepDustAccum += dt;
    if (this.footstepDustAccum >= 0.24) {
      this.footstepDustAccum = 0;
      this.spawnDustPuff(knightBaseX - 0.15, GROUND_Y, 2);
    }

    this.hopOffsetX += (0 - this.hopOffsetX) * (1 - Math.exp(-14 * dt));
    this.hopY = 0;
    this.animateKnightRig(dt);
  }

  private resolveSmashImpact(): void {
    const weaponSpec = getWeaponSpec(this.upgrades.equippedWeapon);
    const knightPos = this.getKnightX();
    const isCrit = this.swingPower >= 0.97;
    const hasPowerSurge = !this.isTutorialMode && this.powerSurgeTimer > 0;
    const reachMin = knightPos - 0.55;
    const reachMax =
      knightPos +
      weaponSpec.hitRange +
      (isCrit ? 0.55 : 0) +
      (hasPowerSurge ? 0.75 : 0) +
      (this.isTutorialMode ? 0.45 : 0);

    // === BOSS SAVAŞI VURUŞ KONTROLÜ ===
    if (!this.isTutorialMode && this.level.isBossLevel && this.boss && !this.boss.defeated) {
      this.roundSwings += 1;
      const bossHitEdge = this.boss.x - this.boss.getHitRadius();
      const bossRightEdge = this.boss.x + this.boss.getHitRadius();
      if (reachMax >= bossHitEdge && reachMin <= bossRightEdge) {
        this.roundHits += 1;
        this.combo += 1;
        this.comboTimer = COMBO_DECAY_DURATION;
        if (this.combo === 10 || this.combo === 25) {
          this.callbacks.onAchievementEvent?.({
            type: 'combo_updated',
            combo: this.combo,
            holdSeconds: this.comboHoldSeconds,
          });
        }
        const dmgBase = 92 * weaponSpec.powerMult * (0.55 + this.swingPower * 0.95);
        const critMult = isCrit ? 1.65 : 1.0;
        const comboMult = 1 + Math.min(this.combo, 12) * 0.06;
        const damage = Math.round(dmgBase * critMult * comboMult);
        const hitX = Math.max(knightPos + 1.2, bossHitEdge + 0.5);

        this.hitstopTimer = isCrit ? 0.06 : 0.032;
        this.camShake = isCrit ? 0.65 : 0.34;
        if (isCrit) {
          this.getMedievalFlashTimer = 0.95;
          audioEngine.playGetMedieval();
        } else {
          audioEngine.playBossHit();
        }

        this.spawnStarburst(hitX, 1.5, isCrit ? 1.65 : 1.15);
        this.spawnParticles(hitX, 1.45, isCrit ? 18 : 10, isCrit ? 0xfacc15 : 0xf97316, 9.5);
        this.burstCoins(hitX, 1.0, Math.round(14 * this.level.goldScale), 0);
        this.handleScoreResult(
          this.scoreManager.addBossHitScore(damage, this.level.boss?.rewardScore ?? 0),
        );
        this.spawnPopup(
          this.boss.x,
          3.1,
          isCrit ? `KRİTİK! -${damage}` : `-${damage}`,
          isCrit ? '#fde047' : '#fb923c',
          isCrit ? 1.4 : 1.15,
        );

        this.boss.takeDamage(damage, {
          onBossPopup: (text, x, y, color, scale = 1.25) => this.spawnPopup(x, y, text, color, scale),
          onBossRoar: () => audioEngine.playBossRoar(),
          onBossDefeated: (bx, by) => {
            audioEngine.playBossVictory();
            this.camShake = 0.9;
            this.spawnParticles(bx, by, 34, 0xfacc15, 11);
            this.spawnParticles(bx, by + 0.5, 22, 0xf97316, 10);
            this.spawnStarburst(bx, by, 2.2);
            if (this.level.boss) {
              this.handleScoreResult(
                this.scoreManager.addBossDefeatScore(
                  this.level.boss.rewardScore,
                  this.level.boss.id,
                ),
              );
              this.levelGold += this.level.boss.rewardGold;
              this.walletGold += this.level.boss.rewardGold;
              this.callbacks.onAchievementEvent?.({
                type: 'boss_defeated',
                bossId: this.level.boss.id,
                eventKey: `boss_${this.currentRunId}_${this.level.boss.id}`,
              });
              this.callbacks.onAchievementEvent?.({
                type: 'gold_earned',
                amount: this.level.boss.rewardGold,
                eventKey: `boss_gold_${this.currentRunId}`,
              });
              this.burstCoins(bx, by, 90, 2);
              this.spawnPopup(
                bx,
                3.5,
                `${this.level.boss.name.toUpperCase()} YENİLDİ!`,
                '#4ade80',
                1.48,
              );
            }
            this.bossVictoryDelay = 1.35;
          },
        });
        this.emitHud();
        return;
      }

      // Boss savaşında boşa sallanırsa kısa bir toparlanma, sersemleme adil tutulur
      this.roundMistakes += 1;
      this.combo = 0;
      this.comboTimer = 0;
      this.comboHoldSeconds = 0;
      this.spawnPopup(knightPos + 0.6, 2.2, 'YAKLAŞIP VUR!', '#fbbf24', 1.0);
      this.emitHud();
      return;
    }

    if (!this.isTutorialMode) {
      this.roundSwings += 1;
    }

    // Vuruş menzilindeki bonus nesnelerini hemen topla (ıska cezası yaratmaz)
    let collectedBonusOnSwing = 0;
    if (!this.isTutorialMode) {
      for (const b of this.bonuses) {
        if (b.collected) continue;
        if (b.x + 0.7 >= reachMin && b.x - 0.7 <= reachMax) {
          this.collectBonus(b);
          collectedBonusOnSwing++;
        }
      }
      if (collectedBonusOnSwing > 0) {
        this.bonuses = this.bonuses.filter((b) => !b.collected);
      }
    }

    const hitTargets: ScrollingTarget[] = [];
    for (const t of this.targets) {
      if (t.removed || t.smashed) continue;
      // Yeni ileri fırlatılmış ve henüz yükselen nesneyi aynı anda çift sayma
      if (t.tumbling && t.vy > 0) continue;
      if (t.x + t.width * 0.5 >= reachMin && t.x - t.width * 0.5 <= reachMax) {
        hitTargets.push(t);
      }
    }

    // Aşama 1: Yalnızca basılı tutup güç toplama ve bırakıp vurma alıştırması (ıska cezası yok!)
    if (this.isTutorialMode && this.tutorialStage === 1) {
      if (this.swingPower >= 0.45) {
        this.tutorialChargePracticed = true;
        this.tutorialSwingPracticed = true;
        this.camShake = 0.28;
        this.spawnStarburst(knightPos + 1.45, 1.25, 1.25);
        this.spawnParticles(knightPos + 1.45, 1.2, 14, 0xfde047, 8.5);
        audioEngine.playSmash('wood');
        this.spawnPopup(knightPos + 1.1, 2.35, 'HARİKA VURUŞ!', '#fde047', 1.22);
        if (this.tutorialPendingStage === null) {
          this.advanceTutorialStage(2);
        }
      } else {
        this.spawnParticles(knightPos + 1.1, 1.1, 6, 0xfdba74, 5.0);
        this.spawnPopup(knightPos + 0.6, 2.35, 'BİRAZ DAHA BASILI TUT!', '#fbbf24', 1.05);
      }
      this.emitTutorialSnapshot();
      return;
    }

    // Yalnızca bonus toplandıysa sersemleme cezası verme
    if (hitTargets.length === 0 && collectedBonusOnSwing > 0) {
      if (!this.isTutorialMode) this.roundHits += 1;
      this.emitHud();
      return;
    }

    // Boşa sallama cezası -> Sersemleme!
    if (hitTargets.length === 0) {
      if (!this.isTutorialMode) this.roundMistakes += 1;
      this.dizzyDuration = this.isTutorialMode ? 0.48 : getDizzyDuration(this.upgrades);
      this.dizzyTimer = this.dizzyDuration;
      this.swingTimer = 0;
      this.hopOffsetX = 0;
      this.hopY = 0;
      this.combo = 0;
      this.comboTimer = 0;
      this.comboHoldSeconds = 0;
      audioEngine.playDizzy();
      this.spawnPopup(knightPos + 0.3, 2.5, 'ISKA! SERSEMLEDİN!', '#fb923c', 1.15);
      if (this.isTutorialMode) {
        this.emitTutorialSnapshot();
      } else {
        this.emitHud();
      }
      return;
    }

    // ÖZEL YASAKLI KARAKTERLER (Prenses, Kral, Rahip, Çocuk): Vurulduğunda BÖLÜM ANINDA BAŞARISIZ OLUR!
    const forbiddenNpc = hitTargets.find(
      (t) =>
        t.category === 'special_npc' &&
        t.specialNpcKind &&
        getSpecialNpcSpec(t.specialNpcKind).forbidden,
    );
    if (forbiddenNpc && forbiddenNpc.specialNpcKind) {
      const spec = getSpecialNpcSpec(forbiddenNpc.specialNpcKind);
      forbiddenNpc.smashed = true;
      forbiddenNpc.vx = 8;
      forbiddenNpc.vy = 9;
      forbiddenNpc.rotSpeed = -9;
      this.camShake = 0.8;
      audioEngine.playFailForbidden();
      this.spawnParticles(forbiddenNpc.x, 1.3, 18, 0xef4444, 8.5);
      if (this.isTutorialMode) {
        // Eğitim modunda bölümü bitirme; oyuncuyu açıkça uyar ve aynı masumu tekrar gönder!
        this.spawnPopup(
          forbiddenNpc.x,
          2.9,
          `SAKIN VURMA! ${spec.label.toUpperCase()} ÖLDÜRÜLMEZ!`,
          '#f87171',
          1.35,
        );
        this.tutorialForbiddenWarningText = `SAKIN VURMA! ${spec.label} öldürülmemelidir! Gerçek oyunda bölüm anında kaybedilir. Tekrar dene: dokunmadan geçmesini bekle!`;
        this.tutorialForbiddenWarningTimer = 3.8;
        if (this.tutorialStage === 4 && this.tutorialPendingStage === null) {
          this.spawnTutorialSpecialNpc(forbiddenNpc.specialNpcKind, this.camera.right + 1.25);
        }
        this.emitTutorialSnapshot();
        return;
      }
      this.spawnPopup(
        forbiddenNpc.x,
        2.9,
        spec.failTitle || 'MASUM BİRİNE VURDUN!',
        '#f87171',
        1.45,
      );
      this.finishLevel(false, spec.failTitle, spec.failReason);
      return;
    }

    // Cadıya vurma cezası -> 3 saniye Domuz Laneti!
    const witchTarget = hitTargets.find((t) => t.enemyKind === 'witch');
    if (witchTarget) {
      if (!this.isTutorialMode) this.roundMistakes += 1;
      witchTarget.smashed = true;
      witchTarget.vx = 10;
      witchTarget.vy = 8;
      witchTarget.rotSpeed = -10;
      if (this.isTutorialMode && this.tutorialStage === 3) {
        this.tutorialPigStarted = true;
      }
      this.transformIntoPig();
      return;
    }

    if (!this.isTutorialMode) {
      this.roundHits += 1;
    }

    // Geçerli hedef vuruldu! SKOR (merkezi ScoreManager) ve ALTIN (düşen sikkeler) tamamen ayrıdır:
    const goldMult = getGoldMultiplier(this.upgrades);
    const goldPowerScale = isCrit ? 1.25 : 0.75 + this.swingPower * 0.25;
    const doubleScoreActive = !this.isTutorialMode && this.doubleScoreTimer > 0;
    this.swingSeq += 1;

    if (isCrit) {
      this.getMedievalFlashTimer = 1.05;
      this.hitstopTimer = 0.062;
      this.camShake = 0.65;
      audioEngine.playGetMedieval();
      this.critWaveActive = true;
      this.critWaveLife = 0;
      this.critWaveMesh.position.set(knightPos + 1.4, 1.3, 1.4);
      this.critWaveMesh.scale.setScalar(0.5);
      this.critWaveMesh.visible = true;
    } else {
      this.hitstopTimer = 0.025 + this.swingPower * 0.028;
      this.camShake = Math.max(this.camShake, 0.2 + this.swingPower * 0.3);
    }

    let smashedCount = 0;
    const prevCombo = this.combo;

    for (const t of hitTargets) {
      // TNT zincir patlaması aynı vuruş döngüsünde sonraki hedefleri zaten parçaladıysa çift puanlama engellenir!
      if (t.smashed || t.removed) continue;

      // ÖZEL ÖDÜL NPC'LERİ: Altın Tüccarı, Tavuk, Gezgin!
      if (t.category === 'special_npc' && t.specialNpcKind) {
        smashedCount++;
        this.combo += 1;
        this.comboTimer = COMBO_DECAY_DURATION;
        t.smashed = true;
        t.vx = 11 + this.swingPower * 12;
        t.vy = 9 + this.swingPower * 7;
        t.rotSpeed = -11;

        let earnedScore = 0;
        if (!this.isTutorialMode) {
          const npcScoreRes = this.scoreManager.addSpecialNpcScore(
            t.basePoints,
            doubleScoreActive,
            t.id,
          );
          this.handleScoreResult(npcScoreRes);
          earnedScore = npcScoreRes.added;
        }
        const goldPayout = this.isTutorialMode
          ? 150
          : Math.max(12, Math.round(t.baseGold * goldMult));

        if (t.specialNpcKind === 'gold_merchant') {
          audioEngine.playGoldBag();
          this.burstCoins(t.x, 0.9, goldPayout, this.isTutorialMode ? 3 : 2);
          this.spawnParticles(t.x, 1.3, this.isTutorialMode ? 24 : 16, 0xfacc15, 9.5);
          if (!this.isTutorialMode) {
            this.triggerScreenEffect('gold_confetti', 2.3);
          } else {
            this.tutorialMerchantHit = true;
          }
          this.spawnPopup(
            t.x,
            2.5,
            this.isTutorialMode
              ? `ALTIN TÜCCARI! +${goldPayout} ALTIN YAĞDI!`
              : `ALTIN TÜCCARI! +${goldPayout} ALTIN!`,
            '#fde047',
            1.35,
          );
        } else if (t.specialNpcKind === 'chicken') {
          audioEngine.playChickenSquawk();
          this.burstCoins(t.x, 0.8, goldPayout, 0);
          for (let f = 0; f < 10; f++) {
            this.spawnInteractiveFx('feather', t.x, 1.1);
          }
          // Komple ekran tavuk tüyü efekti!
          this.triggerScreenEffect('chicken_feathers', 3.6);
          const chickenTxt =
            earnedScore > 0 ? `GIDAAAK! TÜYLER UÇUŞTU! +${earnedScore}` : 'GIDAAAK! TÜYLER UÇUŞTU!';
          this.spawnPopup(t.x, 2.3, chickenTxt, '#fb923c', 1.3);
        } else {
          // Gezgin: %50 sürpriz Bonus, %50 komik tepki + altın
          audioEngine.playBonk();
          if (Math.random() < 0.5) {
            this.spawnBonus(t.x + 0.3, 1.2, undefined, true);
            this.spawnPopup(t.x, 2.4, `GEZGİN SÜRPRİZİ! BONUS!`, '#38bdf8', 1.28);
          } else {
            this.burstCoins(t.x, 0.8, goldPayout, 1);
            const travTxt =
              earnedScore > 0 ? `HEY! ŞAPKAM UÇTU! +${earnedScore}` : 'HEY! ŞAPKAM UÇTU!';
            this.spawnPopup(t.x, 2.4, travTxt, '#7dd3fc', 1.22);
          }
        }
        if (!this.isTutorialMode) {
          this.callbacks.onAchievementEvent?.({
            type: 'special_reward',
            count: 1,
            eventKey: `npc_reward_${this.currentRunId}_${t.id}`,
          });
        }
        this.spawnStarburst(t.x, 1.2, 1.3);
        continue;
      }

      // ÇOK VURUŞLU ÖZEL NESNE (örn. Altın Heykel - 3 vuruşta kırılır!)
      if (
        !this.isTutorialMode &&
        t.category === 'breakable' &&
        t.maxHits > 1 &&
        t.hitsTaken + 1 < t.maxHits &&
        !hasPowerSurge
      ) {
        t.hitsTaken += 1;
        t.tumbling = true;
        t.vx = 6.4;
        t.vy = 8.4;
        t.rotSpeed = -10.5;
        const remainingHits = t.maxHits - t.hitsTaken;
        const chipRes = this.scoreManager.addChipScore('statue_chip', t.id, t.hitsTaken);
        this.handleScoreResult(chipRes);
        this.combo += 1;
        this.comboTimer = COMBO_DECAY_DURATION;
        audioEngine.playSmash('metal');
        this.burstCoins(t.x, 0.9, Math.round(18 * this.level.goldScale), 0);
        this.spawnParticles(t.x, 1.1, 10, 0xfacc15, 7.5);
        this.spawnStarburst(t.x, 1.15, 1.0);
        this.spawnPopup(t.x, 2.2, `ALTIN HEYKEL! (${remainingHits} VURUŞ KALDI)`, '#fde047', 1.18);
        continue;
      }

      // DÜŞÜK GÜÇ (<%60) İLE VARİL / KUTU / SANDIK VURUŞU:
      // İlk vuruşta kırılmaz; havada takla atıp ileriye fırlar, ikinci vuruşta parçalanır!
      // (TNT, Balon ve Geçici Güç aktifken tek vuruşta patlar/parçalanır)
      if (
        !this.isTutorialMode &&
        !hasPowerSurge &&
        t.category === 'breakable' &&
        t.breakableKind !== 'tnt_crate' &&
        t.breakableKind !== 'balloon' &&
        t.breakableKind !== 'mushroom' &&
        t.breakableKind !== 'firework_box' &&
        t.hitsTaken === 0 &&
        this.swingPower < 0.6
      ) {
        t.hitsTaken = 1;
        t.tumbling = true;
        t.vx = 6.8 + this.swingPower * 3.8;
        t.vy = 9.0 + this.swingPower * 2.4;
        t.rotSpeed = -13.2;

        if (this.combo > 0) {
          this.comboTimer = COMBO_DECAY_DURATION;
        }
        const chipRes = this.scoreManager.addChipScore('low_power_crack', t.id, 1);
        this.handleScoreResult(chipRes);

        const bSpec = t.breakableKind ? getBreakableSpec(t.breakableKind) : null;
        if (bSpec?.audio === 'ceramic') {
          audioEngine.playCeramicBreak();
        } else if (bSpec?.audio === 'ice') {
          audioEngine.playIceShatter();
        } else {
          audioEngine.playSmash(bSpec?.audio === 'metal' ? 'metal' : 'wood');
        }
        this.spawnStarburst(t.x, 1.05, 0.75);
        this.spawnParticles(t.x, 0.95, 7, bSpec?.shatterColors[0] ?? 0x9a5b25, 6.5);
        this.spawnDustPuff(t.x, GROUND_Y, 4);
        const crackTxt = chipRes.added > 0 ? `ÇATLADI! +${chipRes.added}` : 'ÇATLADI!';
        this.spawnPopup(t.x, 1.95, crackTxt, '#fbbf24', 1.04);
        continue;
      }

      smashedCount++;
      this.combo += 1;
      this.comboTimer = COMBO_DECAY_DURATION;

      t.hitsTaken += 1;
      t.tumbling = false;
      t.smashed = true;

      // 1) SKOR: merkezi ScoreManager ile dengeli, tavanlı ve tekil-kimlik korumalı hesaplama
      let earnedScore = 0;
      if (this.isTutorialMode) {
        const tutScore = Math.max(40, Math.round(t.basePoints * (isCrit ? 1.25 : 1.0)));
        earnedScore = tutScore;
        if (this.tutorialStage === 7) {
          this.tutorialScore += tutScore;
        }
      } else {
        const scoreRes = this.scoreManager.addHitScore(
          {
            basePoints: t.basePoints,
            swingPower: this.swingPower,
            isCrit,
            combo: this.combo,
            weaponPowerMult: weaponSpec.powerMult,
            hasPowerSurge,
            doubleScoreActive,
          },
          t.category === 'character' ? 'enemy_hit' : 'breakable_smash',
          t.id,
        );
        this.handleScoreResult(scoreRes);
        earnedScore = scoreRes.added;
      }

      // 2) ALTIN: fiziksel sikkeler olarak ileriye saçılır, şövalye toplayınca altın kesesine eklenir
      const goldPayout = Math.max(4, Math.round(t.baseGold * goldPowerScale * goldMult));
      const bags =
        t.breakableKind === 'chest' ||
        t.breakableKind === 'special_treasure' ||
        t.breakableKind === 'magic_chest' ||
        t.breakableKind === 'golden_statue' ||
        t.breakableKind === 'dark_chest' ||
        t.enemyKind === 'merchant'
          ? 1
          : 0;

      if (!this.isTutorialMode) {
        this.burstCoins(t.x, 0.7, goldPayout, bags);
      } else {
        this.burstCoins(t.x, 0.7, 16, 0);
      }
      this.spawnStarburst(
        t.x,
        1.15,
        isCrit || hasPowerSurge ? 1.55 : 0.85 + this.swingPower * 0.5,
      );

      const isChar = t.category === 'character';
      if (isChar) {
        t.vx = 9 + this.swingPower * 16 + (isCrit ? 6 : 0) + Math.random() * 3;
        t.vy = 7.5 + this.swingPower * 10 + (isCrit ? 4.5 : 0) + Math.random() * 2.5;
        t.rotSpeed = -(7 + this.swingPower * 14);
        if (!this.isTutorialMode) {
          this.callbacks.onAchievementEvent?.({
            type: 'enemy_defeated',
            count: 1,
            eventKey: `enemy_${this.currentRunId}_${t.id}`,
          });
        }
      } else if (t.breakableKind) {
        const bSpec = getBreakableSpec(t.breakableKind);
        this.spawnBreakableShatter(
          t.x,
          0.92 + bSpec.floatY,
          t.breakableKind,
          Math.max(this.swingPower, hasPowerSurge ? 0.85 : 0),
        );
        t.removed = true;
        this.scene.remove(t.mesh);
        if (!this.isTutorialMode) {
          this.callbacks.onAchievementEvent?.({
            type: 'breakable_destroyed',
            count: 1,
            eventKey: `brk_${this.currentRunId}_${t.id}`,
          });
        }

        // MANTAR VURUŞU: 3 saniye şövalye + ekran komple sersemleme efekti!
        if (!this.isTutorialMode && t.breakableKind === 'mushroom') {
          this.roundMistakes += 1;
          this.dizzyDuration = 3.0;
          this.dizzyTimer = 3.0;
          this.isCharging = false;
          this.charge = 0;
          this.camShake = 0.45;
          audioEngine.playMushroomDizzy();
          this.triggerScreenEffect('mushroom_dizzy', 3.0);
          this.spawnParticles(t.x, 1.2, 18, 0xc084fc, 8.5);
          this.spawnPopup(t.x, 2.55, '🍄 ZEHİRLİ MANTAR! 3sn SERSEM!', '#e879f9', 1.32);
        } else if (!this.isTutorialMode && bSpec.effect !== 'none') {
          // 13 ÖZEL ETKİLEŞİMLİ NESNE MEKANİKLERİ!
          this.triggerInteractiveBreakableEffect(t.x, 0.92 + bSpec.floatY, t.breakableKind, t.id);
        } else if (!this.isTutorialMode && Math.random() < bSpec.bonusDropChance) {
          this.spawnBonus(t.x + 0.2, 1.0, undefined, true);
        }
      }

      if (!isCrit) {
        if (isChar && (t.enemyKind === 'villager' || t.enemyKind === 'merchant')) {
          audioEngine.playBonk();
        } else if (t.breakableKind) {
          const aKind = getBreakableSpec(t.breakableKind).audio;
          if (aKind === 'explosion') audioEngine.playExplosion();
          else if (aKind === 'balloon') audioEngine.playBalloonPop();
          else if (aKind === 'ice') audioEngine.playIceShatter();
          else if (aKind === 'firework') audioEngine.playFirework();
          else if (aKind === 'ghost') audioEngine.playGhostSpooky();
          else if (aKind === 'ceramic') audioEngine.playCeramicBreak();
          else if (aKind === 'metal' || aKind === 'magic') audioEngine.playSmash(aKind);
          else audioEngine.playSmash('wood');
        } else {
          audioEngine.playSmash(t.enemyKind === 'guard' ? 'metal' : 'wood');
        }
      }

      const partColor = t.breakableKind
        ? getBreakableSpec(t.breakableKind).shatterColors[0]
        : t.enemyKind === 'guard'
          ? 0xcbd5e1
          : 0xef4444;
      this.spawnParticles(t.x, 1.05, isCrit ? 16 : 9, isCrit ? 0xfacc15 : partColor, isCrit ? 10 : 7.5);
      this.spawnParticles(
        t.x,
        1.15,
        isCrit || hasPowerSurge ? 8 : 4,
        hasPowerSurge ? 0xf97316 : 0xfef08a,
        isCrit ? 8.5 : 5.5,
      );
      this.spawnDustPuff(t.x, GROUND_Y, 4);

      const doubleTag = doubleScoreActive && earnedScore > 0 ? ' (2X!)' : '';
      const quip =
        earnedScore > 0
          ? isCrit
            ? `KRİTİK! +${earnedScore}${doubleTag}`
            : t.isSprinter
              ? `HIZLI AV! +${earnedScore}${doubleTag}`
              : `+${earnedScore} PUAN${doubleTag}`
          : isCrit
            ? 'KRİTİK VURUŞ!'
            : 'PARÇALANDI!';
      this.spawnPopup(
        t.x,
        1.9,
        quip,
        doubleScoreActive && earnedScore > 0
          ? '#38bdf8'
          : isCrit
            ? '#fef08a'
            : t.isSprinter
              ? '#34d399'
              : '#7dd3fc',
        isCrit || (doubleScoreActive && earnedScore > 0) ? 1.28 : 1.02,
      );
    }

    // YÜKSEK KOMBO ÖZEL GÖRSEL VE SES EFEKTLERİ (x4+ Alevli Kombo, x7+ Efsanevi Kombo)
    if (!this.isTutorialMode && smashedCount > 0 && this.combo >= 4) {
      const isEpicCombo = this.combo >= 7;
      this.comboWaveActive = true;
      this.comboWaveLife = 0;
      this.comboWaveMesh.position.set(knightPos + 1.35, 1.25, 1.5);
      this.comboWaveMesh.scale.setScalar(0.5);
      (this.comboWaveMesh.material as THREE.MeshBasicMaterial).color.setHex(
        isEpicCombo ? 0xef4444 : 0xf97316,
      );
      this.comboWaveMesh.visible = true;

      this.spawnParticles(
        knightPos + 1.35,
        1.35,
        isEpicCombo ? 14 : 8,
        isEpicCombo ? 0xfef08a : 0xf97316,
        isEpicCombo ? 10.5 : 8.2,
      );
      this.camShake = Math.max(this.camShake, isEpicCombo ? 0.52 : 0.34);

      const hitMilestone =
        (prevCombo < 4 && this.combo >= 4) ||
        (prevCombo < 7 && this.combo >= 7) ||
        (this.combo >= 10 && Math.floor(this.combo / 3) > Math.floor(prevCombo / 3));
      if (hitMilestone) {
        audioEngine.playComboTier(this.combo);
        const comboLabel =
          this.combo >= 7 ? `🔥 x${this.combo} EFSANE KOMBO!` : `⚡ x${this.combo} ALEV KOMBO!`;
        this.spawnPopup(
          knightPos + 0.9,
          3.25,
          comboLabel,
          this.combo >= 7 ? '#fb7185' : '#fb923c',
          this.combo >= 7 ? 1.35 : 1.22,
        );
      }
    }

    // Kombo başarımları (x10, x25) gerçek oyun içi komboya bağlı
    if (!this.isTutorialMode && this.combo >= 10 && prevCombo < this.combo) {
      this.callbacks.onAchievementEvent?.({
        type: 'combo_updated',
        combo: this.combo,
        holdSeconds: this.comboHoldSeconds,
      });
    }

    // Aynı anda 2 veya 3 hedefi tek vuruşta biçince dengeli çoklu vuruş bonusu
    if (!this.isTutorialMode && smashedCount >= 2) {
      const multiRes = this.scoreManager.addMultiSmashBonus(smashedCount, this.swingSeq);
      this.handleScoreResult(multiRes);
      const multiLabel =
        multiRes.added > 0
          ? smashedCount >= 3
            ? `ÜÇLÜ VURUŞ! +${multiRes.added}`
            : `ÇİFTE VURUŞ! +${multiRes.added}`
          : smashedCount >= 3
            ? 'ÜÇLÜ VURUŞ!'
            : 'ÇİFTE VURUŞ!';
      this.spawnPopup(knightPos + 0.9, 2.85, multiLabel, '#fde047', 1.24);
    }

    if (this.isTutorialMode) {
      if (this.tutorialStage === 2 && this.tutorialPendingStage === null) {
        this.advanceTutorialStage(3);
      } else if (
        this.tutorialStage === 5 &&
        this.tutorialMerchantHit &&
        this.tutorialPendingStage === null
      ) {
        // Altın Tüccarından saçılan bol altın yağmurunu izlemek için kısa gösterim süresi
        this.advanceTutorialStage(6, 1.5);
      } else if (this.tutorialStage === 7 && this.tutorialPendingStage === null) {
        if (this.tutorialScore >= this.tutorialScoreGoal) {
          this.advanceTutorialStage(8);
        } else {
          this.spawnTutorialEnemy('villager', this.camera.right + 1.0, 110);
        }
      }
      this.emitTutorialSnapshot();
    } else {
      this.emitHud();
    }
  }

  private spawnInteractiveFx(
    kind: InteractiveFx['kind'],
    x: number,
    y: number,
    customColor?: number,
  ): void {
    const slot = this.interactiveFxPool.find((f) => !f.active);
    if (!slot) return;
    slot.active = true;
    slot.kind = kind;
    slot.x = x;
    slot.y = y;
    slot.phase = Math.random() * Math.PI * 2;
    slot.life = 0;
    slot.bursted = false;

    const mat = slot.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = 1;

    if (kind === 'bee') {
      slot.vx = (Math.random() - 0.3) * 8.5;
      slot.vy = 2.5 + Math.random() * 4.5;
      slot.maxLife = 1.65;
      mat.color.setHex(Math.random() > 0.35 ? 0xfacc15 : 0x18181b);
      slot.mesh.scale.set(0.75, 0.55, 0.55);
    } else if (kind === 'bird') {
      slot.vx = 3.2 + Math.random() * 5.2;
      slot.vy = 4.2 + Math.random() * 3.8;
      slot.maxLife = 1.85;
      mat.color.setHex(Math.random() > 0.5 ? 0x38bdf8 : 0xfde047);
      slot.mesh.scale.set(1.1, 0.65, 0.65);
    } else if (kind === 'ghost') {
      slot.vx = (Math.random() - 0.5) * 1.4;
      slot.vy = 3.4;
      slot.maxLife = 2.0;
      mat.color.setHex(0x5eead4);
      slot.mesh.scale.set(1.85, 2.2, 1.0);
    } else if (kind === 'firework') {
      slot.vx = (Math.random() - 0.5) * 3.2;
      slot.vy = 11.5 + Math.random() * 3.5;
      slot.maxLife = 0.72 + Math.random() * 0.25;
      mat.color.setHex(customColor ?? 0xec4899);
      slot.mesh.scale.set(0.65, 1.35, 0.65);
    } else if (kind === 'egg') {
      slot.vx = 3.2 + Math.random() * 5.4;
      slot.vy = 5.2 + Math.random() * 3.4;
      slot.maxLife = 1.65;
      mat.color.setHex(Math.random() > 0.3 ? 0xfef9c3 : 0xfacc15);
      slot.mesh.scale.set(0.78, 1.05, 0.78);
    } else if (kind === 'feather') {
      slot.vx = (Math.random() - 0.2) * 7.2;
      slot.vy = 4.5 + Math.random() * 4.5;
      slot.maxLife = 1.75;
      mat.color.setHex(Math.random() > 0.25 ? 0xffffff : 0xfb923c);
      slot.mesh.scale.set(1.15, 0.42, 0.42);
    } else {
      // bouncing fish
      slot.vx = 4.5 + Math.random() * 3.8;
      slot.vy = 7.5 + Math.random() * 2.5;
      slot.maxLife = 1.55;
      mat.color.setHex(0x38bdf8);
      slot.mesh.scale.set(1.35, 0.72, 0.72);
    }

    slot.mesh.position.set(x, y, 0.55);
    slot.mesh.visible = true;
  }

  private triggerInteractiveBreakableEffect(
    x: number,
    y: number,
    kind: BreakableKind,
    sourceEntityId: number,
  ): void {
    const spec = getBreakableSpec(kind);
    switch (spec.effect) {
      case 'tnt_blast': {
        this.camShake = 0.75;
        this.critWaveActive = true;
        this.critWaveLife = 0;
        this.critWaveMesh.position.set(x, y, 1.45);
        this.critWaveMesh.scale.setScalar(0.6);
        this.critWaveMesh.visible = true;
        this.spawnParticles(x, y, 22, 0xf97316, 11.5);
        this.spawnParticles(x, y, 14, 0xfde047, 9.5);
        this.triggerScreenEffect('explosion_flash', 1.2);
        let blasted = 0;
        for (const other of this.targets) {
          if (other.removed || other.smashed) continue;
          // Yasaklı NPC'leri ve Cadıyı TNT kazara patlatmasın (oyuncu için adil!)
          if (other.category === 'special_npc' || other.enemyKind === 'witch') continue;
          if (Math.abs(other.x - x) <= 4.6) {
            other.smashed = true;
            blasted++;
            this.handleScoreResult(
              this.scoreManager.addTntBlastTargetScore(other.basePoints, other.id),
            );
            this.burstCoins(other.x, 0.75, Math.max(8, other.baseGold), 0);
            if (other.category === 'breakable' && other.breakableKind) {
              this.spawnBreakableShatter(other.x, 0.9, other.breakableKind, 0.95);
              other.removed = true;
              this.scene.remove(other.mesh);
              this.callbacks.onAchievementEvent?.({
                type: 'breakable_destroyed',
                count: 1,
                eventKey: `tnt_brk_${this.currentRunId}_${other.id}`,
              });
            } else {
              other.vx = 14 + Math.random() * 5;
              other.vy = 11 + Math.random() * 4;
              other.rotSpeed = -13;
              if (other.category === 'character') {
                this.callbacks.onAchievementEvent?.({
                  type: 'enemy_defeated',
                  count: 1,
                  eventKey: `tnt_enemy_${this.currentRunId}_${other.id}`,
                });
              }
            }
          }
        }
        if (blasted >= 2) {
          this.callbacks.onAchievementEvent?.({
            type: 'tnt_multi_blast',
            blastedCount: blasted,
            eventKey: `tnt_multi_${this.currentRunId}_${Math.round(x * 10)}_${blasted}`,
          });
        }
        this.spawnPopup(
          x,
          2.6,
          blasted > 0 ? `💥 BOOM! +${blasted} ZİNCİR PATLAMA!` : '💥 TNT PATLADI!',
          '#fb923c',
          1.36,
        );
        break;
      }
      case 'balloon_gold_rain': {
        for (let i = 0; i < 7; i++) {
          this.spawnPickup(
            x + (i - 3) * 0.45,
            y + 1.2 + Math.random() * 0.8,
            2.2 + (i - 3) * 0.8,
            5.5 + Math.random() * 2.5,
            Math.round(8 * this.level.goldScale),
            false,
            0.25,
          );
        }
        this.triggerScreenEffect('gold_confetti', 2.4);
        this.spawnPopup(x, y + 1.4, '🎈 BALON PATLADI! ALTIN YAĞMURU!', '#fde047', 1.25);
        break;
      }
      case 'golden_statue_multi': {
        this.burstCoins(x, 1.0, Math.round(90 * this.level.goldScale), 2);
        this.spawnParticles(x, 1.4, 24, 0xfacc15, 10.5);
        this.triggerScreenEffect('gold_confetti', 2.6);
        this.spawnPopup(x, 2.7, '🏆 ALTIN HEYKEL PARÇALANDI!', '#fef08a', 1.4);
        break;
      }
      case 'magic_chest_bonus': {
        this.spawnBonus(x + 0.25, 1.15, undefined, true);
        this.spawnParticles(x, 1.2, 18, 0xc084fc, 9);
        this.triggerScreenEffect('gold_confetti', 2.2);
        this.spawnPopup(x, 2.5, '✨ SİHİRLİ SANDIK! BONUS ÇIKTI!', '#e879f9', 1.3);
        break;
      }
      case 'beehive_swarm': {
        for (let i = 0; i < 8; i++) this.spawnInteractiveFx('bee', x, y + 0.3);
        this.triggerScreenEffect('bee_swarm', 2.8);
        this.spawnPopup(x, 2.4, '🐝 ARILAR DAĞILDI!', '#facc15', 1.22);
        break;
      }
      case 'bird_nest_flock': {
        for (let i = 0; i < 5; i++) this.spawnInteractiveFx('bird', x, y + 0.4);
        this.spawnPopup(x, 2.4, '🐦 KUŞLAR UÇTU!', '#7dd3fc', 1.2);
        break;
      }
      case 'ice_shatter_slow': {
        for (const other of this.targets) {
          if (!other.removed && !other.smashed && other.category === 'character') {
            other.slowTimer = 3.6;
          }
        }
        this.spawnParticles(x, y, 18, 0x38bdf8, 9);
        this.triggerScreenEffect('ice_frost', 3.4);
        this.spawnPopup(x, 2.5, '❄️ BUZ PATLADI! DÜŞMANLAR DONDU!', '#7dd3fc', 1.26);
        break;
      }
      case 'pumpkin_coins': {
        this.burstCoins(x, 0.85, Math.round(52 * this.level.goldScale), 1);
        this.triggerScreenEffect('gold_confetti', 2.0);
        this.spawnPopup(x, 2.35, '🎃 KABAKTAN ALTIN FIŞKIRDI!', '#fb923c', 1.24);
        break;
      }
      case 'firework_sky': {
        const fwCols = [0xec4899, 0xfacc15, 0x22d3ee];
        for (let i = 0; i < 4; i++) {
          this.spawnInteractiveFx('firework', x + (i - 1.5) * 0.4, y + 0.3, fwCols[i % fwCols.length]);
        }
        this.triggerScreenEffect('fireworks', 2.8);
        this.spawnPopup(x, 2.6, '🎆 HAVAİ FİŞEK ŞÖLENİ!', '#f472b6', 1.35);
        break;
      }
      case 'pirate_surprise': {
        this.triggerScreenEffect('explosion_flash', 1.0);
        const roll = Math.random();
        if (roll < 0.35) {
          this.spawnBonus(x + 0.2, 1.1, undefined, true);
          this.spawnPopup(x, 2.45, '🏴‍☠️ KORSAN GANİMETİ! BONUS!', '#2dd4bf', 1.28);
        } else if (roll < 0.7) {
          this.burstCoins(x, 0.85, Math.round(64 * this.level.goldScale), 1);
          this.spawnPopup(x, 2.45, '🏴‍☠️ KORSAN ALTINLARI!', '#facc15', 1.28);
        } else {
          for (let i = 0; i < 3; i++) this.spawnInteractiveFx('fish', x, y + 0.2);
          const fishRes = this.scoreManager.addInteractiveFlavorScore(
            60,
            `pirate_fish_${sourceEntityId}`,
          );
          this.handleScoreResult(fishRes);
          this.spawnPopup(
            x,
            2.45,
            fishRes.added > 0 ? `🐟 BALIK YAĞMURU! +${fishRes.added}` : '🐟 BALIK YAĞMURU!',
            '#38bdf8',
            1.24,
          );
        }
        break;
      }
      case 'bone_scatter': {
        this.spawnParticles(x, y, 16, 0xf8fafc, 9.5);
        this.spawnPopup(x, 2.35, '💀 KEMİKLER SAÇILDI!', '#e2e8f0', 1.2);
        break;
      }
      case 'ghost_release': {
        this.spawnInteractiveFx('ghost', x, y + 0.4);
        this.triggerScreenEffect('ghost_spook', 2.6);
        this.spawnPopup(x, 2.55, '👻 HAYALET SERBEST!', '#5eead4', 1.28);
        break;
      }
      case 'egg_spill': {
        for (let i = 0; i < 5; i++) this.spawnInteractiveFx('egg', x, y + 0.25);
        this.triggerScreenEffect('egg_splat', 3.0);
        this.spawnPopup(x, 2.3, '🥚 YUMURTALAR KAMERAYA YAPIŞTI!', '#fef08a', 1.24);
        break;
      }
      default:
        break;
    }
  }

  // PARÇALANABİLİR ÇEVRE: Her nesne türüne özel parça/kıymık/kumaş/seramik/buz kırılma animasyonu
  private spawnBreakableShatter(
    x: number,
    y: number,
    kind: BreakableKind,
    power: number,
  ): void {
    const spec = getBreakableSpec(kind);
    const colors = spec.shatterColors;
    const count = spec.isSpecialInteractive ? 14 : 11;
    const speed = spec.audio === 'explosion' ? 12.5 : 10.0;
    const powerBoost = 0.85 + power * 0.55;
    let spawned = 0;

    for (const d of this.debrisPool) {
      if (d.active) continue;
      const color = colors[spawned % colors.length];
      d.active = true;
      d.life = 0;
      d.maxLife = 0.62 + Math.random() * 0.42;
      d.bounces = 0;
      const spread = (spawned / Math.max(1, count - 1)) * 2 - 1;
      d.vx = (2.8 + Math.random() * speed + spread * 3.5) * powerBoost;
      d.vy = (4.8 + Math.random() * 7.8) * powerBoost;
      d.vz = (Math.random() - 0.5) * 2.2;
      d.rotSpeed = (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 14);
      d.gravity = kind === 'hay_cart' || kind === 'banner_stand' || kind === 'balloon' ? -16 : -28;

      const isFlat = kind === 'banner_stand' || kind === 'hay_cart' || kind === 'fishing_net';
      d.baseScaleX = (isFlat ? 1.15 : 0.85) + Math.random() * 0.65;
      d.baseScaleY = (spec.audio === 'ceramic' || spec.audio === 'ice' ? 0.95 : 0.75) + Math.random() * 0.55;
      d.mesh.position.set(
        x + (Math.random() - 0.5) * 0.75,
        y + (Math.random() - 0.35) * 0.75,
        0.35 + (Math.random() - 0.5) * 0.4,
      );
      d.mesh.rotation.set(
        Math.random() * 0.8,
        Math.random() * 0.8,
        Math.random() * Math.PI * 2,
      );
      d.mesh.scale.set(d.baseScaleX, d.baseScaleY, 1);
      const mat = d.mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity = 1;
      d.mesh.visible = true;

      spawned++;
      if (spawned >= count) break;
    }
  }

  private pickRandomBonusKind(): BonusKind {
    // Halihazırda aktif olan süreli bonus yerine farklı çeşitlerin gelmesini hafifçe teşvik et
    const weights = ALL_BONUS_KINDS.map((k) => {
      if (k === 'double_score' && this.doubleScoreTimer > 2) return 0.35;
      if (k === 'power_surge' && this.powerSurgeTimer > 2) return 0.35;
      return 1.0;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < ALL_BONUS_KINDS.length; i++) {
      r -= weights[i];
      if (r <= 0) return ALL_BONUS_KINDS[i];
    }
    return ALL_BONUS_KINDS[0];
  }

  private spawnBonus(
    x: number,
    y: number,
    explicitKind?: BonusKind,
    fromBreakable = false,
  ): void {
    if (this.bonuses.length >= 4) return;
    const kind = explicitKind ?? this.pickRandomBonusKind();
    const rig = createBonusEntityMesh(kind);
    rig.group.position.set(x, y, 0.35);
    this.scene.add(rig.group);

    this.bonuses.push({
      id: this.nextEntityId++,
      kind,
      rig,
      x,
      y,
      baseY: fromBreakable ? 1.15 : y,
      vx: fromBreakable ? 4.8 + Math.random() * 2.4 : 0,
      vy: fromBreakable ? 8.8 + Math.random() * 1.8 : 0,
      age: 0,
      fromBreakable,
      magnetized: false,
      collected: false,
      sparkleAccum: 0,
    });
  }

  private collectBonus(b: BonusEntity): void {
    if (b.collected) return;
    b.collected = true;
    this.scene.remove(b.rig.group);
    this.callbacks.onAchievementEvent?.({
      type: 'special_reward',
      count: 1,
      eventKey: `bonus_${this.currentRunId}_${b.id}`,
    });

    const knightX = this.getKnightX();
    const knightY = this.hopY + 1.35;
    audioEngine.playBonusPickup(b.kind);

    let title = '';
    let subtitle = '';
    let burstHex = 0xfacc15;

    if (b.kind === 'gold_rush') {
      const goldReward = Math.round((30 + Math.random() * 14) * this.level.goldScale);
      this.burstCoins(knightX + 0.9, 1.15, goldReward, 1);
      title = 'ALTIN BONUSU!';
      subtitle = `+${goldReward} ALTIN SAÇILDI!`;
      burstHex = 0xfacc15;
    } else if (b.kind === 'double_score') {
      this.doubleScoreTimer = DOUBLE_SCORE_DURATION;
      title = '2X ÇİFT SKOR!';
      subtitle = '7 SN BOYUNCA TÜM PUANLAR 2 KAT!';
      burstHex = 0x38bdf8;
    } else if (b.kind === 'power_surge') {
      this.powerSurgeTimer = POWER_SURGE_DURATION;
      title = 'GEÇİCİ GÜÇ!';
      subtitle = 'HIZLI ŞARJ + TEK VURUŞTA PARÇALAMA!';
      burstHex = 0xfb7185;
    } else {
      const extraRes = this.scoreManager.addExtraPointsBonus(this.doubleScoreTimer > 0, b.id);
      this.handleScoreResult(extraRes);
      title = 'EKSTRA PUAN!';
      subtitle =
        extraRes.added > 0
          ? `+${extraRes.added.toLocaleString('tr-TR')} ANINDA BÖLÜM PUANI!`
          : 'MAKSİMUM BÖLÜM SKORUNA ULAŞILDI!';
      burstHex = 0x34d399;
    }

    this.activeBonusBanner = {
      id: this.nextBonusBannerId++,
      kind: b.kind,
      title,
      subtitle,
    };
    this.bonusBannerTimer = BONUS_BANNER_DURATION;

    this.spawnParticles(b.x, b.y, 16, burstHex, 8.8);
    this.spawnParticles(knightX + 0.25, knightY, 8, 0xfef08a, 6.2);
    this.spawnStarburst(b.x, b.y, 1.35);
    this.camShake = Math.max(this.camShake, 0.28);

    this.comboWaveActive = true;
    this.comboWaveLife = 0;
    this.comboWaveMesh.position.set(b.x, b.y, 1.5);
    this.comboWaveMesh.scale.setScalar(0.45);
    (this.comboWaveMesh.material as THREE.MeshBasicMaterial).color.setHex(burstHex);
    this.comboWaveMesh.visible = true;

    this.emitHud();
  }

  private updateBonuses(dt: number): void {
    if (this.bonuses.length === 0) return;

    const scrollSpeed = this.level.scrollSpeed;
    const knightX = this.getKnightX() + 0.25;
    const knightY = this.hopY + 1.3;
    const rightBound = this.camera.right - 0.65;
    let removedAny = false;

    for (const b of this.bonuses) {
      if (b.collected) continue;
      b.age += dt;

      if (b.fromBreakable && !b.magnetized) {
        b.vy += GRAVITY * 0.72 * dt;
        b.x += (b.vx - scrollSpeed * 0.22) * dt;
        b.y += b.vy * dt;
        if (b.x > rightBound && b.vx > 0) {
          b.x = rightBound;
          b.vx *= -0.2;
        }
        if (b.y <= b.baseY && b.vy <= 0) {
          b.y = b.baseY;
          b.vy = 0;
          b.vx = 0;
          b.fromBreakable = false;
        }
      } else if (!b.magnetized) {
        b.x -= scrollSpeed * 0.94 * dt;
        b.y = b.baseY + Math.sin(b.age * 5.2 + b.id) * 0.24;
      }

      // Şövalye yaklaştığında manyetik olarak çekilir ve zahmetsizce toplanır
      const dist = Math.hypot(knightX - b.x, knightY - b.y);
      if (!b.magnetized && (!b.fromBreakable || b.age > 0.32)) {
        if (dist < 2.35 || (b.x <= knightX + 1.95 && b.x >= knightX - 1.2)) {
          b.magnetized = true;
        }
      }

      if (b.magnetized) {
        const dx = knightX - b.x;
        const dy = knightY - b.y;
        const d = Math.hypot(dx, dy);
        const pull = 22 * dt;
        if (d > 0.001) {
          const step = Math.min(d, pull);
          b.x += (dx / d) * step;
          b.y += (dy / d) * step;
        }
      }

      // Bonus türüne özgü parıldayan dönen hale + nefes alan rozet animasyonu
      b.rig.group.position.set(b.x, b.y, 0.42);
      b.rig.halo.rotation.z += dt * 2.4;
      const pulse = 0.92 + Math.sin(b.age * 7.5 + b.id) * 0.14;
      b.rig.halo.scale.setScalar(pulse);
      b.rig.emblem.rotation.z = Math.sin(b.age * 4.5 + b.id) * 0.12;
      b.rig.emblem.scale.setScalar(1 + Math.sin(b.age * 6.0) * 0.06);

      b.sparkleAccum += dt;
      if (b.sparkleAccum >= 0.2) {
        b.sparkleAccum = 0;
        const sparkHex =
          b.kind === 'gold_rush'
            ? 0xfacc15
            : b.kind === 'double_score'
              ? 0x38bdf8
              : b.kind === 'power_surge'
                ? 0xfb7185
                : 0x34d399;
        this.spawnParticles(b.x, b.y, 1, sparkHex, 3.2);
      }

      const finalDist = Math.hypot(knightX - b.x, knightY - b.y);
      if (finalDist < 1.35) {
        this.collectBonus(b);
        removedAny = true;
      } else if (b.x < this.camera.left - 2.0) {
        b.collected = true;
        this.scene.remove(b.rig.group);
        removedAny = true;
      }
    }

    if (removedAny) {
      this.bonuses = this.bonuses.filter((b) => !b.collected);
    }
  }

  private spawnSurpriseSprintWitch(): void {
    this.spawnSeed++;
    const spawnX = this.camera.right + 2.0;
    const rig = createDarkFantasyEnemyRig('witch', this.spawnSeed);
    rig.root.position.set(spawnX, GROUND_Y, 0);
    this.scene.add(rig.root);

    this.targets.push({
      id: this.nextEntityId++,
      category: 'character',
      enemyKind: 'witch',
      mesh: rig.root,
      rig,
      x: spawnX,
      y: GROUND_Y,
      zOffset: 0,
      vx: 0,
      vy: 0,
      rotZ: 0.22,
      rotSpeed: 0,
      width: 1.1,
      baseGold: 0,
      basePoints: 0,
      extraSpeed: 4.15 + Math.random() * 1.15,
      animTime: 0,
      hitsTaken: 0,
      maxHits: 1,
      slowTimer: 0,
      tumbling: false,
      isSprinter: true,
      dustAccum: 0,
      smashed: false,
      removed: false,
    });

    // Sağ kenarda ani mor kıvılcım ve ürkütücü-eğlenceli uyarı!
    this.spawnParticles(this.camera.right - 0.5, 1.5, 10, 0xc026d3, 6.5);
    this.spawnPopup(this.camera.right - 1.3, 2.75, 'SÜRPRİZ CADI! VURMA!', '#f472b6', 1.18);
    audioEngine.playSmash('magic');
  }

  private transformIntoPig(): void {
    const knightX = this.getKnightBaseX();
    this.pigTimer = PIG_DURATION;
    this.swingTimer = 0;
    this.isCharging = false;
    this.charge = 0;
    this.hopOffsetX = 0;
    this.hopY = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.camShake = 0.5;
    this.animState = 'pig';
    audioEngine.playPigTransform();
    this.spawnParticles(knightX + 0.5, 1.0, 22, 0xc026d3, 8);
    this.spawnPopup(knightX + 0.5, 2.5, 'CADI LANETİ! OİNK!', '#f472b6', 1.3);
    if (this.isTutorialMode) {
      this.emitTutorialSnapshot();
    } else {
      this.emitHud();
    }
  }

  private updateTargets(dt: number): void {
    const scrollSpeed = this.level.scrollSpeed;
    const knightX = this.getKnightX();
    const rightTumbleBound = this.camera.right - 0.85;

    for (const t of this.targets) {
      if (t.removed) continue;

      if (!t.smashed) {
        if (t.tumbling) {
          // Düşük güçle vurulan varil/kutu/sandık ileriye takla atar ve yola inip sonraki vuruşta kırılmayı bekler
          t.vy += GRAVITY * dt;
          t.x += (t.vx - scrollSpeed * 0.14) * dt;
          t.y += t.vy * dt;
          t.rotZ += t.rotSpeed * dt;

          if (t.x > rightTumbleBound && t.vx > 0) {
            t.x = rightTumbleBound;
            t.vx *= -0.18;
          }

          if (t.y <= GROUND_Y) {
            t.y = GROUND_Y;
            if (Math.abs(t.vy) > 4.4) {
              t.vy = -t.vy * 0.28;
              t.vx *= 0.42;
              t.rotSpeed *= 0.35;
              this.spawnDustPuff(t.x, GROUND_Y, 4);
            } else {
              t.vy = 0;
              t.vx = 0;
              t.rotSpeed = 0;
              t.tumbling = false;
              t.rotZ = -0.14;
              this.spawnDustPuff(t.x, GROUND_Y, 3);
            }
          }

          t.mesh.position.set(t.x, t.y, t.zOffset);
          t.mesh.rotation.z = t.rotZ;
        } else {
          if (t.slowTimer > 0) {
            t.slowTimer = Math.max(0, t.slowTimer - dt);
          }
          const slowMult = t.slowTimer > 0 ? 0.46 : 1.0;
          t.x -= (scrollSpeed + t.extraSpeed) * slowMult * dt;
          t.animTime += dt * (t.isSprinter ? 1.95 : 1.0) * slowMult;

          const floatBase =
            t.breakableKind ? getBreakableSpec(t.breakableKind).floatY : 0;
          const yPos =
            t.enemyKind === 'witch'
              ? 0.22 + Math.sin(t.animTime * 4.5) * 0.16
              : t.breakableKind === 'balloon'
                ? floatBase + Math.sin(t.animTime * 4.2) * 0.28
                : t.breakableKind === 'special_treasure' || t.breakableKind === 'magic_chest'
                  ? Math.sin(t.animTime * 3.2) * 0.08
                  : t.category === 'special_npc'
                    ? Math.abs(Math.sin(t.animTime * 6.0)) * 0.12
                    : GROUND_Y + floatBase;
          t.mesh.position.set(t.x, yPos, t.zOffset);

          if (t.category === 'special_npc') {
            const aura = t.mesh.getObjectByName('npcAura');
            if (aura) {
              const p = 0.92 + Math.sin(t.animTime * 9) * 0.14;
              aura.scale.set(p, p, 1);
            }
          }

          if (t.category === 'breakable' && t.hitsTaken > 0) {
            t.mesh.rotation.z = -0.12 + Math.sin(t.animTime * 14) * 0.06;
          } else if (t.isSprinter) {
            t.mesh.rotation.z = t.enemyKind === 'witch' ? 0.22 : 0.14;
            t.dustAccum += dt;
            if (t.dustAccum >= (t.enemyKind === 'witch' ? 0.11 : 0.18)) {
              t.dustAccum = 0;
              if (t.enemyKind === 'witch') {
                this.spawnParticles(t.x + 0.3, yPos + 1.05, 3, 0xc026d3, 4.2);
              } else {
                this.spawnDustPuff(t.x + 0.35, GROUND_Y, 2);
              }
            }
          }

          if (t.rig) {
            updateDarkFantasyEnemyRig(t.rig, t.animTime, t.x - knightX, yPos);
          }
        }
      } else {
        t.vy += GRAVITY * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.rotZ += t.rotSpeed * dt;
        t.mesh.position.set(t.x, t.y, 0.35 + t.zOffset);
        t.mesh.rotation.z = t.rotZ;
        if (t.rig) {
          t.rig.shadow.visible = false;
        }
      }

      if (t.x < this.camera.left - 4.5 || t.x > this.camera.right + 12 || t.y < -6) {
        t.removed = true;
        this.scene.remove(t.mesh);
      }
    }

    if (this.targets.length > 34) {
      this.targets = this.targets.filter((t) => !t.removed);
    }
  }

  private updatePickups(dt: number, awardLoot = true): void {
    const knightX = this.getKnightX() + 0.15;
    const knightY = this.hopY + 1.25;
    const rightBound = this.camera.right - 0.45;
    const isTutorialCoinStage = this.isTutorialMode && this.tutorialStage === 6;
    const scrollSpeed = isTutorialCoinStage
      ? 0
      : this.level.scrollSpeed * (awardLoot ? 1.0 : 0.85);

    let waveTriggered = false;
    let collectedAny = false;

    for (const p of this.pickups) {
      if (p.collected) continue;
      p.age += dt;
      if (!isTutorialCoinStage) {
        p.life -= dt;
      }

      if (!p.magnetized) {
        if (!isTutorialCoinStage) {
          // İleriye doğru fırlama ve taş yolda zıplama fiziği
          p.vy += GRAVITY * 0.88 * dt;
          const roadDrift = p.bounces > 0 ? scrollSpeed : scrollSpeed * 0.18;
          p.x += (p.vx - roadDrift) * dt;
          p.y += p.vy * dt;

          // Sağ ekran kenarından dışarı taşmasın; yolda görünür şekilde sekip kalsın
          if (p.x > rightBound && p.vx > 0) {
            p.x = rightBound;
            p.vx *= -0.25;
          }

          const floorY = p.isBag ? 0.36 : 0.32;
          if (p.y <= floorY) {
            p.y = floorY;
            if (Math.abs(p.vy) > 2.4) {
              p.vy = -p.vy * 0.46;
              p.vx *= 0.48;
              p.bounces++;
            } else {
              p.vy = 0;
              p.vx *= Math.exp(-7 * dt);
              p.bounces = Math.max(1, p.bounces);
            }
          }
        }

        // Şövalye saçılan altınlara yaklaştığında manyetik toplama başlar
        const dist = Math.hypot(knightX - p.x, knightY - p.y);
        if (isTutorialCoinStage) {
          if (Math.abs(knightX - p.x) < 1.35 || dist < 1.65) {
            p.magnetized = true;
          }
        } else if (
          p.age >= p.scatterDelay &&
          (p.x <= knightX + 3.9 || dist < 4.1 || p.life < 1.5)
        ) {
          p.magnetized = true;
          waveTriggered = true;
        }
      }
    }

    // Aynı anda toplama dalgası: öndeki altınlar yakalandığında yakın kümedeki diğer altınlar da birlikte uçar
    if (waveTriggered && !isTutorialCoinStage) {
      for (const p of this.pickups) {
        if (p.collected || p.magnetized) continue;
        if (p.age >= 0.28 && p.x <= knightX + 4.75) {
          p.magnetized = true;
        }
      }
    }

    for (const p of this.pickups) {
      if (p.collected) continue;

      if (p.magnetized) {
        const dx = knightX - p.x;
        const dy = knightY - p.y;
        const dist = Math.hypot(dx, dy);
        const pullSpeed = isTutorialCoinStage
          ? 18
          : 24 + Math.min(20, Math.max(0, p.age - p.scatterDelay) * 26);
        const step = Math.min(dist, pullSpeed * dt);
        if (dist > 0.001) {
          p.x += (dx / dist) * step;
          p.y += (dy / dist) * step;
        }
        p.z += (0.2 - p.z) * (1 - Math.exp(-12 * dt));
      }

      const hoverBob =
        !p.magnetized && p.bounces > 0 && p.vy === 0
          ? Math.sin(this.elapsed * 9 + p.id) * 0.08
          : 0;
      p.mesh.position.set(p.x, p.y + hoverBob, p.z);
      p.mesh.rotation.y += dt * (p.magnetized ? p.spinSpeed * 1.65 : p.spinSpeed);

      const finalDist = Math.hypot(knightX - p.x, knightY - p.y);
      const collectRadius = isTutorialCoinStage ? 1.15 : 1.55;
      if (finalDist < collectRadius || p.x < this.camera.left - 1.2 || p.life <= 0) {
        p.collected = true;
        collectedAny = true;
        this.scene.remove(p.mesh);

        if (isTutorialCoinStage) {
          // Eğitimde yalnızca eğitim altın sayacını artır (gerçek cüzdan asla etkilenmez)
          this.tutorialGold += p.value;
          audioEngine.playCoin(Math.floor(this.tutorialGold / 10));
          this.spawnParticles(knightX + 0.1, knightY, 5, 0xfde047, 5.2);
          this.spawnPopup(knightX + 0.15, knightY + 0.85, `+${p.value} ALTIN`, '#fde047', 1.05);
        } else if (awardLoot && !this.isTutorialMode) {
          // Altın toplama yalnızca altın kesesini artırır, skoru asla değiştirmez
          this.levelGold += p.value;
          this.walletGold += p.value;
          this.callbacks.onAchievementEvent?.({
            type: 'gold_earned',
            amount: p.value,
          });
          if (p.isBag) {
            this.goldBags += 1;
            audioEngine.playGoldBag();
            this.callbacks.onAchievementEvent?.({
              type: 'special_reward',
              count: 1,
            });
          } else if (this.elapsed - this.lastCoinSoundTime >= 0.042) {
            this.lastCoinSoundTime = this.elapsed;
            audioEngine.playCoin(this.combo);
          }
          this.spawnParticles(knightX + 0.1, knightY, p.isBag ? 6 : 3, 0xfde047, 4.6);
        } else if (this.isTutorialMode) {
          // Aşama 2/5/7 kozmetik altın parçacığı ve sesi (gerçek cüzdan etkilenmez)
          if (this.elapsed - this.lastCoinSoundTime >= 0.055) {
            this.lastCoinSoundTime = this.elapsed;
            audioEngine.playCoin(this.tutorialStage === 5 ? 5 : 2);
          }
          this.spawnParticles(knightX + 0.1, knightY, p.isBag ? 6 : 3, 0xfde047, 4.4);
        }
      }
    }

    if (collectedAny) {
      this.pickups = this.pickups.filter((p) => !p.collected);
      if (this.isTutorialMode) {
        if (
          isTutorialCoinStage &&
          this.tutorialPendingStage === null &&
          (this.tutorialGold >= this.tutorialGoldGoal || this.pickups.length === 0)
        ) {
          this.tutorialGold = Math.max(this.tutorialGold, this.tutorialGoldGoal);
          this.advanceTutorialStage(7);
        }
        this.emitTutorialSnapshot();
      } else if (awardLoot) {
        this.emitHud();
      }
    }
  }

  private updateParticlesAndFx(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        pt.active = false;
        pt.mesh.visible = false;
        continue;
      }
      pt.vy += pt.gravity * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.z += pt.rotSpeed * dt;
      const fade = 1 - pt.life / pt.maxLife;
      pt.mesh.scale.setScalar(Math.max(0.05, fade));
    }

    // Parçalanan çevre objelerinin havuzlanmış fiziksel enkaz parçaları
    for (const d of this.debrisPool) {
      if (!d.active) continue;
      d.life += dt;
      if (d.life >= d.maxLife) {
        d.active = false;
        d.mesh.visible = false;
        continue;
      }
      d.vy += d.gravity * dt;
      d.mesh.position.x += (d.vx - this.level.scrollSpeed * 0.25) * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.mesh.rotation.z += d.rotSpeed * dt;
      d.mesh.rotation.x += d.rotSpeed * 0.45 * dt;

      if (d.mesh.position.y <= GROUND_Y + 0.08 && d.vy < 0) {
        d.mesh.position.y = GROUND_Y + 0.08;
        if (d.bounces < 1 && Math.abs(d.vy) > 3.2) {
          d.vy = -d.vy * 0.36;
          d.vx *= 0.55;
          d.rotSpeed *= 0.55;
          d.bounces++;
        } else {
          d.vy = 0;
          d.vx *= Math.exp(-6 * dt);
          d.rotSpeed *= 0.85;
        }
      }

      const remaining = 1 - d.life / d.maxLife;
      const alpha = remaining < 0.32 ? remaining / 0.32 : 1;
      (d.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      const s = 0.72 + alpha * 0.28;
      d.mesh.scale.set(d.baseScaleX * s, d.baseScaleY * s, 1);
    }

    for (const sb of this.starbursts) {
      if (!sb.active) continue;
      sb.life += dt;
      if (sb.life >= sb.maxLife) {
        sb.active = false;
        sb.mesh.visible = false;
        continue;
      }
      const p = sb.life / sb.maxLife;
      sb.mesh.scale.setScalar(0.55 + Math.sin(p * Math.PI) * 1.1);
    }

    if (this.critWaveActive) {
      this.critWaveLife += dt;
      const p = this.critWaveLife / 0.42;
      if (p >= 1) {
        this.critWaveActive = false;
        this.critWaveMesh.visible = false;
      } else {
        this.critWaveMesh.scale.setScalar(0.6 + p * 5.8);
        (this.critWaveMesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.9;
      }
    }

    if (this.comboWaveActive) {
      this.comboWaveLife += dt;
      const p = this.comboWaveLife / 0.36;
      if (p >= 1) {
        this.comboWaveActive = false;
        this.comboWaveMesh.visible = false;
      } else {
        this.comboWaveMesh.scale.setScalar(0.55 + p * 4.9);
        (this.comboWaveMesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.82;
      }
    }

    // 13 Etkileşimli Nesne ve Tavuk için havuzlanmış görsel efekt güncellemesi
    for (const fx of this.interactiveFxPool) {
      if (!fx.active) continue;
      fx.life += dt;
      if (fx.life >= fx.maxLife) {
        if (fx.kind === 'firework' && !fx.bursted) {
          fx.bursted = true;
          const col = (fx.mesh.material as THREE.MeshBasicMaterial).color.getHex();
          this.spawnParticles(fx.x, fx.y, 14, col, 9.5);
          this.spawnStarburst(fx.x, fx.y, 1.35);
        }
        fx.active = false;
        fx.mesh.visible = false;
        continue;
      }

      fx.phase += dt * 14;
      if (fx.kind === 'bee') {
        fx.x += fx.vx * dt;
        fx.y += (fx.vy + Math.sin(fx.phase) * 4.5) * dt;
      } else if (fx.kind === 'bird') {
        fx.x += fx.vx * dt;
        fx.y += (fx.vy + Math.sin(fx.phase * 0.8) * 2.2) * dt;
        fx.mesh.scale.y = 0.55 + Math.abs(Math.sin(fx.phase)) * 0.35;
      } else if (fx.kind === 'ghost') {
        fx.x += Math.sin(fx.phase * 0.35) * 2.2 * dt;
        fx.y += fx.vy * dt;
        (fx.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          (1 - fx.life / fx.maxLife) * 0.85,
        );
      } else if (fx.kind === 'firework') {
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
      } else if (fx.kind === 'egg' || fx.kind === 'fish') {
        fx.vy += GRAVITY * 0.85 * dt;
        fx.x += fx.vx * dt;
        fx.y += fx.vy * dt;
        if (fx.y <= 0.25 && fx.vy < 0) {
          fx.y = 0.25;
          fx.vy = -fx.vy * 0.52;
          fx.vx *= 0.82;
        }
        fx.mesh.rotation.z -= dt * 11;
      } else if (fx.kind === 'feather') {
        fx.vy = Math.max(-2.2, fx.vy - 9.5 * dt);
        fx.x += (fx.vx * 0.65 + Math.sin(fx.phase * 0.45) * 2.6) * dt;
        fx.y += fx.vy * dt;
        fx.mesh.rotation.z = Math.sin(fx.phase * 0.5) * 0.9;
        (fx.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(
          0,
          1 - fx.life / fx.maxLife,
        );
      }

      fx.mesh.position.set(fx.x, fx.y, 0.55);
    }
  }

  private animateKnightRig(dt: number): void {
    const swingProgress =
      this.swingTimer > 0 ? 1 - this.swingTimer / Math.max(0.01, this.swingDuration) : 0;
    const totalHopY = this.bossJumpY + this.hopY;

    this.knight.update({
      x: this.getKnightX(),
      y: GROUND_Y + totalHopY,
      hopY: totalHopY,
      animState: this.animState,
      animTime: this.animTime,
      charge: this.charge,
      swingProgress,
      dt,
    });
  }

  // ============================================================================
  // ETKİLEŞİMLİ EĞİTİM MODU (8 AŞAMA) - GERÇEK OYUN MEKANİKLERİ, İZOLE İLERLEME
  // ============================================================================
  private advanceTutorialStage(nextStage: TutorialStage, flashDuration = 0.95): void {
    if (this.tutorialPendingStage !== null) return;
    this.tutorialPendingStage = nextStage;
    this.tutorialStageFlashTimer = flashDuration;
    this.isCharging = false;
    this.charge = 0;
    audioEngine.playGoldBag();
    this.emitTutorialSnapshot();
  }

  private setupTutorialStage(stage: TutorialStage): void {
    this.tutorialStage = stage;
    this.tutorialPendingStage = null;
    this.tutorialStageFlashTimer = 0;
    this.isCharging = false;
    this.charge = 0;
    this.dizzyTimer = 0;
    this.tutorialForbiddenWarningTimer = 0;
    this.tutorialForbiddenWarningText = null;

    // Önceki aşamanın artık hedeflerini ve paralarını temizle
    for (const t of this.targets) this.scene.remove(t.mesh);
    for (const p of this.pickups) this.scene.remove(p.mesh);
    this.targets = [];
    this.pickups = [];

    if (stage === 1) {
      this.moveOffsetX = 0;
      this.moveInput = 0;
      this.tutorialChargePracticed = false;
      this.tutorialSwingPracticed = false;
    } else if (stage === 2) {
      this.moveOffsetX = 0;
      this.moveInput = 0;
      this.spawnTutorialEnemy('villager', this.camera.right + 0.9, 85);
    } else if (stage === 3) {
      this.moveOffsetX = 0;
      this.moveInput = 0;
      this.tutorialPigStarted = false;
      this.spawnTutorialEnemy('witch', this.camera.right + 1.0, 0);
    } else if (stage === 4) {
      // Aşama 4: Kral, Prenses ve Rahip'e ASLA vurulmamalı — güvenle geçmelerini bekle!
      this.moveOffsetX = 0;
      this.moveInput = 0;
      this.tutorialInnocentsSpared = 0;
      this.spawnTutorialSpecialNpc(this.tutorialInnocentOrder[0], this.camera.right + 0.95);
    } else if (stage === 5) {
      // Aşama 5: Altın Tüccarı — vurunca çok fazla altın saçar!
      this.moveOffsetX = 0;
      this.moveInput = 0;
      this.tutorialMerchantHit = false;
      this.spawnTutorialSpecialNpc('gold_merchant', this.camera.right + 0.95);
    } else if (stage === 6) {
      // Şövalyeyi sol-orta başlangıca alıp önüne parıldayan altın dizisi ser
      this.moveOffsetX = -0.35;
      this.moveInput = 0;
      this.tutorialGold = 0;
      this.tutorialGoldGoal = 60;
      this.spawnTutorialCoins();
    } else if (stage === 7) {
      this.moveOffsetX = 0;
      this.moveInput = 0;
      this.tutorialScore = 0;
      this.tutorialScoreGoal = 150;
      this.spawnTutorialEnemy('guard', this.camera.right + 1.0, 185);
    } else if (stage === 8) {
      this.moveInput = 0;
      audioEngine.playLevelComplete();
      if (!this.tutorialCompleteNotified) {
        this.tutorialCompleteNotified = true;
        this.callbacks.onTutorialComplete?.();
      }
    }

    this.emitTutorialSnapshot();
  }

  private spawnTutorialSpecialNpc(kind: SpecialNpcKind, spawnX: number): void {
    const spec = getSpecialNpcSpec(kind);
    const mesh = createSpecialNpcMesh(kind);
    mesh.position.set(spawnX, GROUND_Y, 0);
    this.scene.add(mesh);
    this.targets.push({
      id: this.nextEntityId++,
      category: 'special_npc',
      specialNpcKind: kind,
      mesh,
      x: spawnX,
      y: GROUND_Y,
      zOffset: 0,
      vx: 0,
      vy: 0,
      rotZ: 0,
      rotSpeed: 0,
      width: Math.max(1.25, spec.width * 0.85),
      baseGold: kind === 'gold_merchant' ? 150 : 0,
      basePoints: spec.bonusPoints,
      extraSpeed: 0,
      animTime: 0,
      hitsTaken: 0,
      maxHits: 1,
      slowTimer: 0,
      tumbling: false,
      isSprinter: false,
      dustAccum: 0,
      smashed: false,
      removed: false,
    });
  }

  private spawnTutorialEnemy(kind: EnemyKind, spawnX: number, basePoints: number): void {
    this.spawnSeed++;
    const rig = createDarkFantasyEnemyRig(kind, this.spawnSeed);
    rig.root.position.set(spawnX, GROUND_Y, 0);
    this.scene.add(rig.root);
    this.targets.push({
      id: this.nextEntityId++,
      category: 'character',
      enemyKind: kind,
      mesh: rig.root,
      rig,
      x: spawnX,
      y: GROUND_Y,
      zOffset: 0,
      vx: 0,
      vy: 0,
      rotZ: 0,
      rotSpeed: 0,
      width: kind === 'witch' ? 1.25 : 1.25,
      baseGold: kind === 'witch' ? 0 : 12,
      basePoints,
      extraSpeed: 0,
      animTime: 0,
      hitsTaken: 0,
      maxHits: 1,
      slowTimer: 0,
      tumbling: false,
      isSprinter: false,
      dustAccum: 0,
      smashed: false,
      removed: false,
    });
  }

  private spawnTutorialCoins(): void {
    const startX = this.getKnightBaseX() + 1.75;
    const count = 6;
    const spacing = 0.68;
    for (let i = 0; i < count; i++) {
      const cx = Math.min(this.camera.right - 0.75, startX + i * spacing);
      const mesh = createCoinMesh(this.mats);
      const z = i % 2 === 0 ? 0.14 : -0.14;
      mesh.position.set(cx, 0.52, z);
      mesh.rotation.y = i * 0.6;
      this.scene.add(mesh);
      this.pickups.push({
        id: this.nextEntityId++,
        isBag: false,
        mesh,
        x: cx,
        y: 0.52,
        z,
        vx: 0,
        vy: 0,
        value: 10,
        age: 1,
        scatterDelay: 0,
        bounces: 1,
        magnetized: false,
        spinSpeed: 6.2,
        life: 99,
        collected: false,
      });
    }
  }

  private updateTutorial(dt: number): void {
    this.elapsed += dt;

    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.updateParticlesAndFx(dt * 0.25);
      return;
    }

    if (this.tutorialForbiddenWarningTimer > 0) {
      this.tutorialForbiddenWarningTimer = Math.max(0, this.tutorialForbiddenWarningTimer - dt);
      if (this.tutorialForbiddenWarningTimer <= 0) {
        this.tutorialForbiddenWarningText = null;
      }
    }

    // Aşama 6 (Altın Toplama) sırasında zemin hafif akarken oyuncu altınlara doğru yürür
    const worldScrollMult =
      this.tutorialStage === 6 ? 0.16 : this.tutorialStage === 8 ? 0.45 : 0.62;
    this.scrollWorld(dt * worldScrollMult);

    this.updateKnight(dt);

    // Aşama geçiş flaşı sayacı
    if (this.tutorialStageFlashTimer > 0) {
      this.tutorialStageFlashTimer = Math.max(0, this.tutorialStageFlashTimer - dt);
      if (this.tutorialStageFlashTimer <= 0 && this.tutorialPendingStage !== null) {
        const nextStage = this.tutorialPendingStage;
        this.setupTutorialStage(nextStage);
        return;
      }
    }

    const knightBaseX = this.getKnightBaseX();

    // Aşama 1: Basılı tutarak güç toplama takibi
    if (this.tutorialStage === 1 && this.tutorialPendingStage === null) {
      if (this.charge >= 0.45 && !this.tutorialChargePracticed) {
        this.tutorialChargePracticed = true;
        this.emitTutorialSnapshot();
      }
    }

    // Eğitim hedefleri: Yasaklı masumlar güvenle yürüyüp geçer; düşmanlar, cadı ve Altın Tüccarı menzilde bekler
    const newlySparedInnocents: SpecialNpcKind[] = [];
    for (const t of this.targets) {
      if (t.removed) continue;
      if (!t.smashed) {
        t.animTime += dt;
        const isForbiddenInnocent =
          t.category === 'special_npc' &&
          t.specialNpcKind &&
          getSpecialNpcSpec(t.specialNpcKind).forbidden;

        if (isForbiddenInnocent && t.specialNpcKind) {
          // Prenses, Kral ve Rahip şövalyenin önünden geçip yoluna devam eder
          t.x -= 3.85 * dt;
          const yPos = Math.abs(Math.sin(t.animTime * 6.0)) * 0.12;
          t.mesh.position.set(t.x, yPos, 0);
          const aura = t.mesh.getObjectByName('npcAura');
          if (aura) {
            const p = 0.92 + Math.sin(t.animTime * 9) * 0.14;
            aura.scale.set(p, p, 1);
          }

          if (
            this.tutorialStage === 4 &&
            t.hitsTaken === 0 &&
            t.x < knightBaseX - 1.55
          ) {
            t.hitsTaken = 1;
            newlySparedInnocents.push(t.specialNpcKind);
          }
        } else {
          const desiredHoldX = Math.min(
            this.camera.right - 1.15,
            knightBaseX + (t.enemyKind === 'witch' ? 2.0 : 1.95),
          );
          const diff = desiredHoldX - t.x;
          const approachSpeed =
            t.enemyKind === 'witch'
              ? 4.4
              : t.specialNpcKind === 'gold_merchant'
                ? 4.3
                : 4.1;
          if (Math.abs(diff) > 0.08) {
            t.x += Math.sign(diff) * Math.min(Math.abs(diff), approachSpeed * dt);
          }

          const yPos =
            t.enemyKind === 'witch'
              ? 0.28 + Math.sin(t.animTime * 4.8) * 0.18
              : t.category === 'special_npc'
                ? Math.abs(Math.sin(t.animTime * 6.0)) * 0.12
                : GROUND_Y;
          t.mesh.position.set(t.x, yPos, 0);

          if (t.category === 'special_npc') {
            const aura = t.mesh.getObjectByName('npcAura');
            if (aura) {
              const p = 0.92 + Math.sin(t.animTime * 9) * 0.14;
              aura.scale.set(p, p, 1);
            }
          }

          if (t.rig) {
            updateDarkFantasyEnemyRig(t.rig, t.animTime, t.x - this.getKnightX(), yPos);
          }
        }
      } else {
        t.vy += GRAVITY * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
        t.rotZ += t.rotSpeed * dt;
        t.mesh.position.set(t.x, t.y, 0.35);
        t.mesh.rotation.z = t.rotZ;
        if (t.rig) {
          t.rig.shadow.visible = false;
        }
      }

      if (t.x < this.camera.left - 4.5 || t.x > this.camera.right + 12 || t.y < -6) {
        t.removed = true;
        this.scene.remove(t.mesh);
      }
    }
    this.targets = this.targets.filter((t) => !t.removed);

    // Aşama 4: Güvenle geçirilen Prenses, Kral ve Rahip takibi
    if (
      this.tutorialStage === 4 &&
      newlySparedInnocents.length > 0 &&
      this.tutorialPendingStage === null
    ) {
      for (const sparedKind of newlySparedInnocents) {
        const spec = getSpecialNpcSpec(sparedKind);
        this.tutorialInnocentsSpared = Math.min(
          this.tutorialInnocentOrder.length,
          this.tutorialInnocentsSpared + 1,
        );
        audioEngine.playCoin(this.tutorialInnocentsSpared + 2);
        this.spawnPopup(
          knightBaseX + 0.15,
          2.45,
          `${spec.label.toUpperCase()} KURTULDU!`,
          '#4ade80',
          1.2,
        );
        if (this.tutorialInnocentsSpared < this.tutorialInnocentOrder.length) {
          this.spawnTutorialSpecialNpc(
            this.tutorialInnocentOrder[this.tutorialInnocentsSpared],
            this.camera.right + 0.95,
          );
        } else {
          this.advanceTutorialStage(5);
        }
      }
      this.emitTutorialSnapshot();
    }

    // Aşama 3: Cadıya vurulduktan sonra tam 3 saniyelik domuz laneti bitip şövalyeye geri dönüldüğünde Aşama 4'e geç!
    if (
      this.tutorialStage === 3 &&
      this.tutorialPigStarted &&
      this.pigTimer <= 0 &&
      this.tutorialPendingStage === null
    ) {
      this.advanceTutorialStage(4);
    }

    this.updatePickups(dt, false);
    this.updateParticlesAndFx(dt);

    this.tutorialEmitAccum += dt;
    if (this.tutorialEmitAccum >= 0.045) {
      this.tutorialEmitAccum = 0;
      this.emitTutorialSnapshot();
    }
  }

  private projectWorldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    _projVec.set(worldX, worldY, 0.25).project(this.camera);
    return {
      x: Math.max(8, Math.min(92, (_projVec.x * 0.5 + 0.5) * 100)),
      y: Math.max(14, Math.min(84, (-_projVec.y * 0.5 + 0.5) * 100)),
    };
  }

  private emitTutorialSnapshot(): void {
    if (!this.callbacks.onTutorialUpdate) return;

    const knightX = this.getKnightX();
    const knightScreen = this.projectWorldToScreen(knightX, 1.35 + this.hopY);

    let focusWorldX = knightX;
    let focusWorldY = 1.35 + this.hopY;
    let focusVisible = this.tutorialStage !== 8 && this.tutorialStageFlashTimer <= 0;
    let currentInnocentKind: 'princess' | 'king' | 'priest' | null = null;

    if (this.tutorialStage === 2 || this.tutorialStage === 5 || this.tutorialStage === 7) {
      const target = this.targets.find((t) => !t.removed && !t.smashed);
      if (target) {
        focusWorldX = target.x;
        focusWorldY = 1.3;
      } else {
        focusVisible = false;
      }
    } else if (this.tutorialStage === 3) {
      if (this.pigTimer > 0) {
        focusWorldX = knightX;
        focusWorldY = 0.85;
      } else {
        const witch = this.targets.find((t) => !t.removed && !t.smashed && t.enemyKind === 'witch');
        if (witch) {
          focusWorldX = witch.x;
          focusWorldY = 1.5;
        }
      }
    } else if (this.tutorialStage === 4) {
      const innocent = this.targets.find(
        (t) =>
          !t.removed &&
          !t.smashed &&
          t.hitsTaken === 0 &&
          t.category === 'special_npc' &&
          (t.specialNpcKind === 'princess' ||
            t.specialNpcKind === 'king' ||
            t.specialNpcKind === 'priest'),
      );
      if (innocent && innocent.specialNpcKind) {
        currentInnocentKind = innocent.specialNpcKind as 'princess' | 'king' | 'priest';
        focusWorldX = innocent.x;
        focusWorldY = 1.35;
      } else {
        currentInnocentKind =
          this.tutorialInnocentOrder[
            Math.min(this.tutorialInnocentsSpared, this.tutorialInnocentOrder.length - 1)
          ] ?? null;
        focusVisible = false;
      }
    } else if (this.tutorialStage === 6) {
      let nearest: PickupEntity | null = null;
      let bestDist = Infinity;
      for (const p of this.pickups) {
        if (p.collected) continue;
        const d = Math.abs(p.x - knightX);
        if (d < bestDist) {
          bestDist = d;
          nearest = p;
        }
      }
      if (nearest) {
        focusWorldX = nearest.x;
        focusWorldY = nearest.y + 0.25;
      } else {
        focusVisible = false;
      }
    }

    const focusScreen = this.projectWorldToScreen(focusWorldX, focusWorldY);
    const weaponSpec = getWeaponSpec(this.upgrades.equippedWeapon);

    this.callbacks.onTutorialUpdate({
      stage: this.tutorialStage,
      stageCompletedFlash: this.tutorialStageFlashTimer > 0,
      chargePracticed: this.tutorialChargePracticed,
      swingPracticed: this.tutorialSwingPracticed,
      pigActive: this.pigTimer > 0,
      pigCountdown: this.pigTimer > 0 ? Math.max(1, Math.min(3, Math.ceil(this.pigTimer))) : 0,
      pigTimeLeft: this.pigTimer,
      pigDuration: PIG_DURATION,
      innocentsSpared: this.tutorialInnocentsSpared,
      innocentsTotal: this.tutorialInnocentOrder.length,
      currentInnocentKind,
      forbiddenWarningText: this.tutorialForbiddenWarningText,
      merchantHit: this.tutorialMerchantHit,
      goldCollected: this.tutorialGold,
      goldGoal: this.tutorialGoldGoal,
      tutorialScore: this.tutorialScore,
      scoreGoal: this.tutorialScoreGoal,
      charge: this.charge,
      isCharging: this.isCharging,
      equippedWeapon: this.upgrades.equippedWeapon,
      weaponName: weaponSpec.name,
      focusX: focusScreen.x,
      focusY: focusScreen.y,
      focusVisible,
      knightScreenX: knightScreen.x,
      knightScreenY: knightScreen.y,
    });
  }

  private updateCameraShake(dt: number): void {
    let sx = 0;
    let sy = 0;
    if (this.camShake > 0.005) {
      sx = (Math.random() - 0.5) * this.camShake;
      sy = (Math.random() - 0.5) * this.camShake;
      this.camShake *= Math.exp(-14 * dt);
    } else {
      this.camShake = 0;
    }
    this.camera.position.set(sx, this.baseCamY + sy, 22);
    this.camera.lookAt(sx, this.baseCamY + sy, 0);
  }

  private finishLevel(won: boolean, failTitle?: string, failReason?: string): void {
    if (this.levelEnding) return;
    this.levelEnding = true;
    this.isCharging = false;
    this.charge = 0;
    this.bossMoveInput = 0;
    audioEngine.stopMusic();

    if (won) {
      if (!this.level.isBossLevel) {
        audioEngine.playLevelComplete();
      }
      this.screen = this.level.id >= TOTAL_LEVELS ? 'VICTORY' : 'LEVEL_CLEAR';
    } else {
      if (!failTitle) {
        audioEngine.playGameOver();
      }
      this.screen = 'GAME_OVER';
    }

    const world = getWorldConfig(this.level.worldId);
    this.emitHud();
    this.callbacks.onLevelEnd({
      won,
      levelId: this.level.id,
      worldId: this.level.worldId,
      worldName: world.name,
      levelName: this.level.name,
      levelGold: this.levelGold,
      walletGold: this.walletGold,
      goldBags: this.goldBags,
      timeRemaining: Math.ceil(this.timeLeft),
      levelScore: this.scoreManager.getScore(),
      scoreTarget: this.scoreManager.getScoreTarget(),
      maxScore: this.scoreManager.getMaxScore(),
      isNewBest: false,
      isFinalLevel: this.level.id >= TOTAL_LEVELS,
      isBossLevel: this.level.isBossLevel,
      bossId: this.level.boss?.id,
      bossName: this.level.boss?.name,
      failTitle,
      failReason,
      runId: this.currentRunId,
      swings: this.roundSwings,
      hits: this.roundHits,
      mistakes: this.roundMistakes,
      sawPrincess: this.roundSawPrincess,
      sawKing: this.roundSawKing,
    });
  }

  private emitHud(): void {
    const weaponSpec = getWeaponSpec(this.upgrades.equippedWeapon);
    const world = getWorldConfig(this.level.worldId);
    this.callbacks.onHudUpdate({
      levelId: this.level.id,
      worldId: this.level.worldId,
      worldName: world.name,
      levelName: this.level.name,
      isBossLevel: this.level.isBossLevel,
      boss: this.boss
        ? this.boss.getHudState(
            this.bossPlayerHp,
            this.bossPlayerMaxHp,
            this.bossPlayerInvulnTimer > 0,
          )
        : null,
      activeEventBanner: this.activeEventBanner,
      equippedWeapon: this.upgrades.equippedWeapon,
      weaponName: weaponSpec.name,
      levelGold: this.levelGold,
      walletGold: this.walletGold,
      goldBags: this.goldBags,
      levelScore: this.scoreManager.getScore(),
      scoreTarget: this.scoreManager.getScoreTarget(),
      maxScore: this.scoreManager.getMaxScore(),
      scoreCapped: this.scoreManager.isCapped(),
      timeLeft: this.timeLeft,
      timeLimit: this.level.timeLimit,
      charge: this.charge,
      isCharging: this.isCharging,
      getMedievalFlash: this.getMedievalFlashTimer,
      dizzyTimeLeft: this.dizzyTimer,
      dizzyDuration: this.dizzyDuration,
      pigTimeLeft: this.pigTimer,
      pigDuration: PIG_DURATION,
      combo: this.combo,
      comboTimeLeft: this.comboTimer,
      comboDuration: COMBO_DECAY_DURATION,
      doubleScoreTimeLeft: this.doubleScoreTimer,
      doubleScoreDuration: DOUBLE_SCORE_DURATION,
      powerSurgeTimeLeft: this.powerSurgeTimer,
      powerSurgeDuration: POWER_SURGE_DURATION,
      activeBonusBanner: this.activeBonusBanner,
      screenEffects: this.screenEffects.map((fx) => ({ ...fx })),
      quotaMet: this.level.isBossLevel
        ? Boolean(this.boss?.defeated)
        : this.scoreManager.isTargetMet(),
    });
  }

  public handleResize(): void {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth || window.innerWidth);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight);
    this.updateCameraProjection(width, height);
    this.renderer.setSize(width, height, false);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    window.clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResizeBound);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLostBound);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestoredBound);

    audioEngine.stopMusic();
    if (this.boss) {
      this.boss.dispose();
      this.boss = null;
    }
    this.knight.dispose();
    this.particleGeo.dispose();
    this.interactiveFxGeo.dispose();
    this.debrisPlankGeo.dispose();
    this.debrisChunkGeo.dispose();
    this.debrisClothGeo.dispose();
    this.ambientLeafGeo.dispose();
    this.ambientFireflyGeo.dispose();
    this.particles.forEach((p) => (p.mesh.material as THREE.Material).dispose());
    this.interactiveFxPool.forEach((fx) => (fx.mesh.material as THREE.Material).dispose());
    this.debrisPool.forEach((d) => (d.mesh.material as THREE.Material).dispose());
    this.ambientMotes.forEach((m) => (m.mesh.material as THREE.Material).dispose());
    this.critWaveMesh.geometry.dispose();
    (this.critWaveMesh.material as THREE.Material).dispose();
    this.comboWaveMesh.geometry.dispose();
    (this.comboWaveMesh.material as THREE.Material).dispose();
    if (this.skyTexture) this.skyTexture.dispose();
    if (this.roadTexture) this.roadTexture.dispose();
    if (this.wallTexture) this.wallTexture.dispose();
    if (this.mountainTexture) this.mountainTexture.dispose();
    if (this.forestTexture) this.forestTexture.dispose();
    if (this.mistTexture) this.mistTexture.dispose();
    if (this.shaftTexture) this.shaftTexture.dispose();
    if (this.envTex) this.envTex.dispose();
    disposeBreakableCatalogCache();
    disposeSpecialNpcCache();
    disposeBossTextureCache();
    this.mats.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
