import * as THREE from 'three';
import { BonusKind, BreakableKind, EnemyKind } from './types';

const INK = '#0a0910';

function makeTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function makePart(
  tex: THREE.CanvasTexture,
  w: number,
  h: number,
  ox: number,
  oy: number,
  renderOrder: number,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(ox, oy, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.03,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = renderOrder;
  return mesh;
}

function createGroundedShadow(width: number): THREE.Mesh {
  const tex = makeTex(128, 64, (ctx) => {
    const grad = ctx.createRadialGradient(64, 32, 6, 64, 32, 58);
    grad.addColorStop(0, 'rgba(6, 5, 10, 0.72)');
    grad.addColorStop(0.65, 'rgba(6, 5, 10, 0.30)');
    grad.addColorStop(1, 'rgba(6, 5, 10, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 64);
  });
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * 0.42),
    new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.03, 0);
  mesh.renderOrder = 1;
  return mesh;
}

/* ============================================================================
 * 1. ARTICULATED 2D HAND-PAINTED DARK FANTASY ENEMY RIGS
 *    Her düşmanın kendine özgü zırhı, kıyafeti, silahı, silueti ve animasyonu vardır!
 * ============================================================================ */

export interface DarkFantasyEnemyRig {
  kind: EnemyKind;
  variant: number;
  root: THREE.Group;
  actor: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  backLeg: THREE.Group;
  frontLeg: THREE.Group;
  backArm: THREE.Group;
  frontArm: THREE.Group;
  cloak?: THREE.Group;
  auraMesh?: THREE.Mesh;
  shadow: THREE.Mesh;
  attackPhase: number;
}

// Doku önbelleği (moblar saniyeler içinde tekrar tekrar doğduğu için sıfır gecikme ve maksimum FPS!)
const texCache = new Map<string, THREE.CanvasTexture>();
function cachedTex(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const existing = texCache.get(key);
  if (existing) return existing;
  const created = makeTex(w, h, draw);
  texCache.set(key, created);
  return created;
}

/* ---------- ORTAK BACAĞI ÇİZİM YARDIMCISI ---------- */
function getLegTex(style: 'peasant' | 'merchant' | 'guard' | 'witch'): THREE.CanvasTexture {
  return cachedTex(`leg_${style}`, 120, 190, (ctx) => {
    if (style === 'guard') {
      // Zırhlı dizlikli çelik bot
      const grad = ctx.createLinearGradient(24, 14, 96, 174);
      grad.addColorStop(0, '#78849b');
      grad.addColorStop(0.5, '#3b4254');
      grad.addColorStop(1, '#181c26');
      ctx.fillStyle = grad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(36, 16, 46, 114, 16);
      ctx.fill();
      ctx.stroke();

      // Altın diz koruması
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(54, 82, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Zırhlı çizme (sola bakan)
      ctx.fillStyle = '#252a38';
      ctx.beginPath();
      ctx.moveTo(36, 126);
      ctx.lineTo(82, 126);
      ctx.lineTo(84, 174);
      ctx.lineTo(14, 174);
      ctx.quadraticCurveTo(14, 146, 36, 142);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (style === 'merchant') {
      // Koyu kadife pantolon & tokalı deri çizme
      ctx.fillStyle = '#3b1c2c';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(36, 16, 46, 108, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3c2418';
      ctx.beginPath();
      ctx.moveTo(36, 118);
      ctx.lineTo(82, 118);
      ctx.lineTo(84, 174);
      ctx.lineTo(16, 174);
      ctx.quadraticCurveTo(18, 148, 36, 142);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(36, 142, 18, 12);
    } else if (style === 'witch') {
      // Sivri burunlu siyah cadı çizmesi
      ctx.fillStyle = '#1b1326';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(40, 16, 36, 112, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#120c1a';
      ctx.beginPath();
      ctx.moveTo(40, 124);
      ctx.lineTo(76, 124);
      ctx.lineTo(78, 170);
      ctx.lineTo(10, 170);
      ctx.quadraticCurveTo(14, 148, 40, 144);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Yamalı köylü pantolonu & çamurlu deri çizme
      ctx.fillStyle = '#473c32';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.roundRect(38, 16, 44, 108, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#2d1e15';
      ctx.beginPath();
      ctx.moveTo(38, 120);
      ctx.lineTo(82, 120);
      ctx.lineTo(84, 174);
      ctx.lineTo(18, 174);
      ctx.quadraticCurveTo(20, 148, 38, 144);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
}

/* ---------- 1. KÖYLÜ / MİLİS (2 FARKLI EL BOYAMASI VARYANT) ---------- */
function getVillagerTorsoTex(variant: number): THREE.CanvasTexture {
  const v = variant % 2;
  return cachedTex(`villager_torso_${v}`, 240, 260, (ctx) => {
    const grad = ctx.createLinearGradient(44, 24, 196, 236);
    if (v === 0) {
      grad.addColorStop(0, '#5a6e47');
      grad.addColorStop(0.6, '#39472c');
      grad.addColorStop(1, '#202819');
    } else {
      grad.addColorStop(0, '#7c4c34');
      grad.addColorStop(0.6, '#523020');
      grad.addColorStop(1, '#2d1a11');
    }

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(64, 34);
    ctx.quadraticCurveTo(120, 18, 176, 36);
    ctx.lineTo(192, 218);
    ctx.quadraticCurveTo(120, 238, 48, 218);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kumaş kat kırışıklıkları ve omuz pelerini
    ctx.fillStyle = v === 0 ? '#3b2b20' : '#2d3440';
    ctx.beginPath();
    ctx.moveTo(52, 36);
    ctx.quadraticCurveTo(120, 74, 188, 36);
    ctx.lineTo(198, 92);
    ctx.quadraticCurveTo(120, 126, 44, 92);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Deri kemer & pirinç toka + küçük kese
    ctx.fillStyle = '#291a12';
    ctx.fillRect(52, 152, 136, 24);
    ctx.strokeRect(52, 152, 136, 24);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(88, 148, 28, 32);
    ctx.strokeRect(88, 148, 28, 32);
  });
}

function getVillagerHeadTex(variant: number): THREE.CanvasTexture {
  const v = variant % 2;
  return cachedTex(`villager_head_${v}`, 220, 220, (ctx) => {
    // Yüz (sola bakan 3/4 profil)
    const skin = ctx.createRadialGradient(94, 118, 10, 108, 124, 56);
    skin.addColorStop(0, '#f0c49a');
    skin.addColorStop(0.65, '#cfa074');
    skin.addColorStop(1, '#9c6f4a');
    ctx.fillStyle = skin;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(108, 124, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kaş, göz & sakal ifadesi
    ctx.fillStyle = '#18131a';
    ctx.beginPath();
    ctx.arc(82, 122, 6, 0, Math.PI * 2);
    ctx.arc(108, 122, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3d281c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(72, 108);
    ctx.lineTo(94, 114);
    ctx.moveTo(100, 114);
    ctx.lineTo(120, 108);
    ctx.stroke();

    // Sakal / çene gölgesi
    ctx.fillStyle = v === 0 ? '#523422' : '#3a322d';
    ctx.beginPath();
    ctx.arc(98, 148, 30, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.fill();

    if (v === 0) {
      // Yıpranmış ortaçağ köylü başlığı / kapüşonu
      ctx.fillStyle = '#473626';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(42, 112);
      ctx.quadraticCurveTo(56, 36, 126, 38);
      ctx.quadraticCurveTo(174, 42, 178, 116);
      ctx.quadraticCurveTo(116, 86, 42, 112);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Geniş kenarlı hasır / keçe köylü şapkası
      ctx.fillStyle = '#785a32';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(110, 96, 86, 22, -0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(64, 92);
      ctx.quadraticCurveTo(106, 22, 154, 92);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
}

function getVillagerWeaponArmTex(variant: number): THREE.CanvasTexture {
  const v = variant % 2;
  return cachedTex(`villager_arm_${v}`, 240, 260, (ctx) => {
    // Kol & eldiven
    ctx.fillStyle = v === 0 ? '#495a38' : '#653c28';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(118, 86, 42, 92, 16);
    ctx.fill();
    ctx.stroke();

    // Sola uzanan yaba (pitchfork) veya meşale
    if (v === 0) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 15;
      ctx.beginPath();
      ctx.moveTo(154, 210);
      ctx.lineTo(54, 52);
      ctx.stroke();
      ctx.strokeStyle = '#6b4226';
      ctx.lineWidth = 8;
      ctx.stroke();

      // 3 dişli paslı demir yaba ucu
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(54, 52);
      ctx.lineTo(28, 18);
      ctx.moveTo(42, 62);
      ctx.lineTo(14, 34);
      ctx.moveTo(68, 42);
      ctx.lineTo(44, 12);
      ctx.stroke();
    } else {
      // Yanan köylü meşalesi
      ctx.strokeStyle = INK;
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.moveTo(132, 182);
      ctx.lineTo(74, 86);
      ctx.stroke();
      ctx.strokeStyle = '#5c381f';
      ctx.lineWidth = 9;
      ctx.stroke();

      const flame = ctx.createRadialGradient(64, 62, 4, 64, 64, 34);
      flame.addColorStop(0, '#fef08a');
      flame.addColorStop(0.5, '#f97316');
      flame.addColorStop(1, 'rgba(220, 38, 38, 0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.arc(64, 62, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    // Yumruk el
    ctx.fillStyle = '#d9a97c';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(132, 166, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

/* ---------- 2. ZENGİN LONCA TÜCCARI ---------- */
function getMerchantTorsoTex(): THREE.CanvasTexture {
  return cachedTex('merchant_torso', 280, 280, (ctx) => {
    // Geniş kadife bordo-altın işlemeli lonca kaftanı
    const grad = ctx.createLinearGradient(34, 24, 246, 252);
    grad.addColorStop(0, '#881c36');
    grad.addColorStop(0.5, '#591224');
    grad.addColorStop(1, '#2b0812');

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(74, 34);
    ctx.quadraticCurveTo(140, 14, 206, 36);
    ctx.bezierCurveTo(246, 112, 244, 198, 224, 244);
    ctx.quadraticCurveTo(140, 268, 56, 244);
    ctx.bezierCurveTo(36, 196, 38, 110, 74, 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kürk yakalık
    ctx.fillStyle = '#d6c7b2';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(58, 36);
    ctx.quadraticCurveTo(140, 92, 222, 36);
    ctx.quadraticCurveTo(234, 72, 212, 92);
    ctx.quadraticCurveTo(140, 134, 68, 92);
    ctx.quadraticCurveTo(46, 72, 58, 36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Altın brokar şerit ve yakutlu kuşak
    ctx.fillStyle = '#eab308';
    ctx.fillRect(122, 96, 24, 152);
    ctx.strokeRect(122, 96, 24, 152);

    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.roundRect(48, 166, 184, 32, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(134, 182, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function getMerchantHeadTex(): THREE.CanvasTexture {
  return cachedTex('merchant_head', 220, 220, (ctx) => {
    const skin = ctx.createRadialGradient(92, 122, 8, 108, 128, 56);
    skin.addColorStop(0, '#f7cda5');
    skin.addColorStop(0.65, '#d6a476');
    skin.addColorStop(1, '#9e6e48');
    ctx.fillStyle = skin;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(108, 128, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // İri bıyık & şaşkın tüccar gözleri
    ctx.fillStyle = '#141118';
    ctx.beginPath();
    ctx.arc(82, 124, 6, 0, Math.PI * 2);
    ctx.arc(108, 124, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#472d1c';
    ctx.beginPath();
    ctx.ellipse(84, 146, 18, 9, -0.2, 0, Math.PI * 2);
    ctx.ellipse(106, 146, 18, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Tüylü altın işlemeli kadife bere
    ctx.fillStyle = '#7f1d38';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(112, 82, 70, 32, 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Altın şerit & yakut broş + beyaz tüy
    ctx.fillStyle = '#facc15';
    ctx.fillRect(58, 90, 104, 14);
    ctx.strokeRect(58, 90, 104, 14);

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(142, 74);
    ctx.quadraticCurveTo(192, 24, 206, 48);
    ctx.quadraticCurveTo(182, 76, 146, 86);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function getMerchantArmTex(): THREE.CanvasTexture {
  return cachedTex('merchant_arm', 220, 240, (ctx) => {
    ctx.fillStyle = '#72172e';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(108, 42, 46, 104, 18);
    ctx.fill();
    ctx.stroke();

    // Taşan altın dolu ağır deri kese
    const bagGrad = ctx.createRadialGradient(78, 174, 8, 86, 180, 52);
    bagGrad.addColorStop(0, '#a16207');
    bagGrad.addColorStop(0.65, '#713f12');
    bagGrad.addColorStop(1, '#3b1d08');
    ctx.fillStyle = bagGrad;
    ctx.beginPath();
    ctx.arc(88, 178, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kese ağzından parlayan altınlar
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(82, 134, 12, 0, Math.PI * 2);
    ctx.arc(98, 136, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

/* ---------- 3. ZIRHLI KALE MUHAFIZI (HALBERDIER) ---------- */
function getGuardTorsoTex(): THREE.CanvasTexture {
  return cachedTex('guard_torso', 260, 280, (ctx) => {
    // Çelik plaka göğüs zırhı
    const armorGrad = ctx.createLinearGradient(44, 20, 216, 250);
    armorGrad.addColorStop(0, '#8a98b0');
    armorGrad.addColorStop(0.42, '#475269');
    armorGrad.addColorStop(0.8, '#232938');
    armorGrad.addColorStop(1, '#11141d');

    ctx.fillStyle = armorGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(56, 36);
    ctx.quadraticCurveTo(130, 14, 204, 36);
    ctx.lineTo(192, 232);
    ctx.quadraticCurveTo(130, 256, 68, 232);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kraliyet kızıl-altın armalı cübbe şeridi (tabard)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(92, 54, 68, 186);
    ctx.strokeRect(92, 54, 68, 186);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(126, 86);
    ctx.lineTo(144, 124);
    ctx.lineTo(126, 162);
    ctx.lineTo(108, 124);
    ctx.closePath();
    ctx.fill();

    // Omuzluk & zırh kemeri
    ctx.fillStyle = '#eab308';
    ctx.fillRect(58, 166, 144, 24);
    ctx.strokeRect(58, 166, 144, 24);
  });
}

function getGuardHeadTex(): THREE.CanvasTexture {
  return cachedTex('guard_head', 240, 240, (ctx) => {
    // Kızıl sorguç (crest)
    ctx.fillStyle = '#b91c1c';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(108, 56);
    ctx.quadraticCurveTo(168, 16, 214, 72);
    ctx.quadraticCurveTo(176, 98, 134, 88);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Gotik çelik miğfer (sallet helm)
    const steel = ctx.createLinearGradient(54, 46, 174, 190);
    steel.addColorStop(0, '#a8b5cc');
    steel.addColorStop(0.5, '#4e5970');
    steel.addColorStop(1, '#1d2230');

    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(56, 126);
    ctx.quadraticCurveTo(60, 48, 124, 48);
    ctx.quadraticCurveTo(186, 52, 188, 148);
    ctx.lineTo(164, 182);
    ctx.lineTo(66, 174);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Göz yarığı ve soğuk parlayan göz
    ctx.fillStyle = '#09090d';
    ctx.fillRect(62, 114, 62, 18);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(74, 119, 14, 7);
    ctx.fillRect(100, 119, 12, 7);

    // Altın miğfer kenar şeridi
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(64, 168);
    ctx.lineTo(162, 176);
    ctx.stroke();
  });
}

function getGuardHalberdArmTex(): THREE.CanvasTexture {
  return cachedTex('guard_arm', 280, 320, (ctx) => {
    // Zırhlı kol ve omuzluk
    ctx.fillStyle = '#535f78';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(176, 116, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect(148, 124, 44, 96, 16);
    ctx.fill();
    ctx.stroke();

    // Uzun gotik teber / mızrak (halberd)
    ctx.strokeStyle = INK;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(222, 286);
    ctx.lineTo(54, 46);
    ctx.stroke();
    ctx.strokeStyle = '#4e3120';
    ctx.lineWidth = 9;
    ctx.stroke();

    // Parlak çelik balta + mızrak başı
    const blade = ctx.createLinearGradient(12, 12, 92, 110);
    blade.addColorStop(0, '#f1f5f9');
    blade.addColorStop(0.5, '#94a3b8');
    blade.addColorStop(1, '#334155');
    ctx.fillStyle = blade;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(54, 46);
    ctx.lineTo(22, 8);
    ctx.lineTo(74, 34);
    ctx.quadraticCurveTo(96, 74, 52, 108);
    ctx.quadraticCurveTo(44, 76, 54, 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/* ---------- 4. KARANLIK ORMAN CADISI (ARCANE HEX HAG) ---------- */
function getWitchRobeTex(): THREE.CanvasTexture {
  return cachedTex('witch_robe', 280, 320, (ctx) => {
    // Dalgalı yırtık gece moru cübbe + rünlü etek
    const grad = ctx.createLinearGradient(50, 24, 230, 300);
    grad.addColorStop(0, '#3b1c54');
    grad.addColorStop(0.5, '#211033');
    grad.addColorStop(1, '#0e0718');

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(96, 30);
    ctx.lineTo(184, 30);
    ctx.bezierCurveTo(212, 124, 234, 212, 254, 284);
    ctx.lineTo(204, 266);
    ctx.lineTo(174, 298);
    ctx.lineTo(132, 272);
    ctx.lineTo(94, 300);
    ctx.lineTo(42, 276);
    ctx.bezierCurveTo(64, 198, 76, 116, 96, 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parlayan eflatun rün kemeri ve cübbe işlemeleri
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(86, 138);
    ctx.quadraticCurveTo(140, 158, 194, 138);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(216, 180, 254, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(64, 262);
    ctx.lineTo(96, 278);
    ctx.lineTo(132, 254);
    ctx.lineTo(174, 278);
    ctx.lineTo(222, 260);
    ctx.stroke();
  });
}

function getWitchHeadTex(): THREE.CanvasTexture {
  return cachedTex('witch_head', 260, 260, (ctx) => {
    // Solgun yeşilimsi cadı yüzü + kanca burun
    ctx.fillStyle = '#77a37a';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(124, 166, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kanca burun (sola uzanan)
    ctx.beginPath();
    ctx.moveTo(82, 160);
    ctx.lineTo(54, 174);
    ctx.lineTo(86, 178);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parlayan büyücü gözleri
    ctx.fillStyle = '#e879f9';
    ctx.beginPath();
    ctx.ellipse(98, 160, 8, 5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // İkonik kıvrık gotik cadı şapkası
    const hatGrad = ctx.createLinearGradient(50, 14, 210, 150);
    hatGrad.addColorStop(0, '#311a47');
    hatGrad.addColorStop(0.55, '#190d26');
    hatGrad.addColorStop(1, '#0b0612');
    ctx.fillStyle = hatGrad;

    // Geniş şapka kenarı
    ctx.beginPath();
    ctx.ellipse(126, 134, 102, 24, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kıvrık sivri külah
    ctx.beginPath();
    ctx.moveTo(76, 128);
    ctx.quadraticCurveTo(108, 44, 168, 18);
    ctx.quadraticCurveTo(212, 28, 198, 54);
    ctx.quadraticCurveTo(164, 62, 174, 128);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parlayan mor şapka kuşağı ve altın toka
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(82, 114, 88, 16);
    ctx.strokeRect(82, 114, 88, 16);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(102, 111, 22, 22);
    ctx.strokeRect(102, 111, 22, 22);
  });
}

function getWitchStaffArmTex(): THREE.CanvasTexture {
  return cachedTex('witch_arm', 240, 320, (ctx) => {
    // Cübbe kolu
    ctx.fillStyle = '#2d1542';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(128, 134, 44, 86, 16);
    ctx.fill();
    ctx.stroke();

    // Budaklı karanlık büyü asası
    ctx.strokeStyle = INK;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(154, 304);
    ctx.quadraticCurveTo(118, 190, 84, 72);
    ctx.stroke();
    ctx.strokeStyle = '#4a2d1d';
    ctx.lineWidth = 9;
    ctx.stroke();

    // Parlayan eflatun lanet kristali + hale
    const glow = ctx.createRadialGradient(78, 62, 6, 78, 62, 58);
    glow.addColorStop(0, '#f5d0fe');
    glow.addColorStop(0.35, 'rgba(192, 38, 211, 0.72)');
    glow.addColorStop(1, 'rgba(192, 38, 211, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(78, 62, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d946ef';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(78, 24);
    ctx.lineTo(104, 60);
    ctx.lineTo(78, 94);
    ctx.lineTo(52, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/* ============================================================================
 * DÜŞMAN RIG OLUŞTURUCU
 * ============================================================================ */
export function createDarkFantasyEnemyRig(kind: EnemyKind, seed = 0): DarkFantasyEnemyRig {
  const variant = Math.abs(seed) % 2;
  const root = new THREE.Group();
  const shadow = createGroundedShadow(kind === 'merchant' ? 1.85 : 1.55);
  root.add(shadow);

  const actor = new THREE.Group();
  const scale = kind === 'guard' ? 1.12 : kind === 'merchant' ? 1.08 : kind === 'witch' ? 1.12 : 1.0;
  actor.scale.setScalar(scale);
  root.add(actor);

  const legStyle =
    kind === 'guard'
      ? 'guard'
      : kind === 'merchant'
        ? 'merchant'
        : kind === 'witch'
          ? 'witch'
          : 'peasant';
  const legTex = getLegTex(legStyle);

  const backLeg = new THREE.Group();
  backLeg.position.set(0.14, 0.72, -0.06);
  backLeg.add(makePart(legTex, 0.56, 0.86, -0.04, -0.36, 10));

  const frontLeg = new THREE.Group();
  frontLeg.position.set(-0.1, 0.72, 0.06);
  frontLeg.add(makePart(legTex, 0.56, 0.86, -0.04, -0.36, 13));

  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.72, 0);

  let torsoTex: THREE.CanvasTexture;
  let headTex: THREE.CanvasTexture;
  let armTex: THREE.CanvasTexture;

  if (kind === 'guard') {
    torsoTex = getGuardTorsoTex();
    headTex = getGuardHeadTex();
    armTex = getGuardHalberdArmTex();
  } else if (kind === 'merchant') {
    torsoTex = getMerchantTorsoTex();
    headTex = getMerchantHeadTex();
    armTex = getMerchantArmTex();
  } else if (kind === 'witch') {
    torsoTex = getWitchRobeTex();
    headTex = getWitchHeadTex();
    armTex = getWitchStaffArmTex();
  } else {
    torsoTex = getVillagerTorsoTex(variant);
    headTex = getVillagerHeadTex(variant);
    armTex = getVillagerWeaponArmTex(variant);
  }

  const torsoW = kind === 'merchant' ? 1.24 : kind === 'witch' ? 1.28 : 1.08;
  const torsoH = kind === 'witch' ? 1.48 : 1.18;
  torsoGroup.add(makePart(torsoTex, torsoW, torsoH, 0, kind === 'witch' ? 0.42 : 0.52, 12));

  const headGroup = new THREE.Group();
  headGroup.position.set(-0.04, kind === 'witch' ? 1.16 : 1.04, 0.05);
  const headSize = kind === 'witch' ? 1.12 : 0.9;
  headGroup.add(makePart(headTex, headSize, headSize, 0, 0.34, 14));
  torsoGroup.add(headGroup);

  const backArm = new THREE.Group();
  backArm.position.set(0.24, 0.84, -0.08);
  torsoGroup.add(backArm);

  const frontArm = new THREE.Group();
  frontArm.position.set(-0.18, 0.86, 0.12);
  const armW = kind === 'guard' ? 1.45 : kind === 'witch' ? 1.25 : 1.15;
  const armH = kind === 'guard' ? 1.65 : kind === 'witch' ? 1.65 : 1.25;
  frontArm.add(makePart(armTex, armW, armH, -0.28, 0.06, 15));
  torsoGroup.add(frontArm);

  let auraMesh: THREE.Mesh | undefined;
  if (kind === 'witch') {
    // Cadının altında nabız gibi atan mistik mor uyarı çemberi (oyuncu hemen ayırt eder!)
    const auraTex = cachedTex('witch_aura', 192, 192, (ctx) => {
      const grad = ctx.createRadialGradient(96, 96, 16, 96, 96, 92);
      grad.addColorStop(0, 'rgba(217, 70, 239, 0.45)');
      grad.addColorStop(0.62, 'rgba(168, 85, 247, 0.25)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 192, 192);

      ctx.strokeStyle = 'rgba(232, 121, 249, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(96, 96, 72, 0, Math.PI * 2);
      ctx.stroke();
    });
    auraMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 2.1),
      new THREE.MeshBasicMaterial({
        map: auraTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    auraMesh.rotation.x = -Math.PI / 2;
    auraMesh.position.set(0, 0.06, 0);
    auraMesh.renderOrder = 3;
    root.add(auraMesh);
  }

  actor.add(backLeg, frontLeg, torsoGroup);

  return {
    kind,
    variant,
    root,
    actor,
    torsoGroup,
    headGroup,
    backLeg,
    frontLeg,
    backArm,
    frontArm,
    auraMesh,
    shadow,
    attackPhase: 0,
  };
}

/* ============================================================================
 * DÜŞMAN ANİMASYON GÜNCELLEYİCİ (YÜRÜME / SALDIRI HAZIRLIĞI / KAÇIŞ / LANET)
 * ============================================================================ */
export function updateDarkFantasyEnemyRig(
  rig: DarkFantasyEnemyRig,
  animTime: number,
  distToKnight: number,
  yPos: number,
): void {
  const isNearKnight = distToKnight > 0 && distToKnight < 4.6;
  const nearFactor = isNearKnight ? Math.min(1, (4.6 - distToKnight) / 2.2) : 0;

  if (rig.kind === 'witch') {
    // Havada süzülme + şövalyeye yaklaşınca asayı kaldırıp büyü yapma animasyonu
    const floatBob = Math.sin(animTime * 4.4) * 0.12;
    rig.actor.position.y = floatBob;
    rig.torsoGroup.rotation.z = Math.sin(animTime * 2.6) * 0.06 + nearFactor * 0.08;
    rig.headGroup.rotation.z = Math.sin(animTime * 3.1) * 0.06;
    rig.backLeg.rotation.z = -0.22 + Math.sin(animTime * 3.4) * 0.1;
    rig.frontLeg.rotation.z = -0.14 - Math.sin(animTime * 3.4) * 0.1;
    rig.frontArm.rotation.z =
      Math.sin(animTime * 5) * 0.12 - nearFactor * (0.48 + Math.sin(animTime * 14) * 0.12);
    if (rig.auraMesh) {
      rig.auraMesh.rotation.z = animTime * 1.4;
      const s = 0.94 + Math.sin(animTime * 6) * 0.1 + nearFactor * 0.18;
      rig.auraMesh.scale.setScalar(s);
    }
    rig.shadow.position.y = -yPos + 0.03;
    return;
  }

  const speed = rig.kind === 'guard' ? 8.4 : rig.kind === 'merchant' ? 10.6 : 9.4;
  const phase = animTime * speed;
  const stride = Math.sin(phase);
  const bounce = Math.abs(Math.cos(phase));

  // Akıcı bacak adımları ve gövde yaylanması
  rig.backLeg.rotation.z = stride * 0.56;
  rig.frontLeg.rotation.z = -stride * 0.56;
  rig.actor.position.y = bounce * 0.09;

  if (rig.kind === 'guard') {
    // Muhafız: ağır zırhlı yürüyüş + yaklaşınca mızrak/teber saplama hamlesi!
    rig.torsoGroup.rotation.z = 0.06 + Math.sin(phase) * 0.04 + nearFactor * 0.12;
    rig.headGroup.rotation.z = -0.04 - nearFactor * 0.06;
    const thrust = nearFactor > 0.15 ? Math.sin(animTime * 13) * 0.32 * nearFactor : 0;
    rig.frontArm.rotation.z = -stride * 0.2 + nearFactor * 0.48 + thrust;
  } else if (rig.kind === 'merchant') {
    // Tüccar: paytak hızlı koşu + yaklaşınca altın kesesini göğsüne bastırıp panikleme!
    rig.torsoGroup.rotation.z = -0.04 + Math.sin(phase) * 0.09 - nearFactor * 0.14;
    rig.headGroup.rotation.z = Math.sin(animTime * 12) * 0.08 * nearFactor;
    rig.frontArm.rotation.z = stride * 0.24 - nearFactor * 0.35;
  } else {
    // Köylü: hızlı yürüyüş + yaklaşınca yabayı/meşaleyi savurma animasyonu!
    rig.torsoGroup.rotation.z = 0.05 + Math.sin(phase) * 0.06 + nearFactor * 0.1;
    rig.headGroup.rotation.z = Math.cos(phase) * 0.05;
    rig.frontArm.rotation.z =
      -stride * 0.32 + nearFactor * (0.35 + Math.sin(animTime * 15) * 0.32);
  }

  rig.shadow.position.y = -yPos + 0.03;
}

/* ============================================================================
 * 2. EL BOYAMASI KARANLIK FANTASTİK KIRILABİLİR ÇEVRE OBJELERİ
 * ============================================================================ */
export function createDarkFantasyBreakable(kind: BreakableKind, variant = 0): THREE.Group {
  const g = new THREE.Group();
  const shadowW =
    kind === 'stall'
      ? 3.2
      : kind === 'hay_cart'
        ? 2.6
        : kind === 'chest'
          ? 2.35
          : 2.05;
  g.add(createGroundedShadow(shadowW));

  const tex = cachedTex(`breakable_${kind}_${variant % 2}`, 320, 320, (ctx) => {
    if (kind === 'barrel') {
      // Demir çemberli meşe şarap fıçısı
      const grad = ctx.createLinearGradient(70, 56, 250, 290);
      grad.addColorStop(0, '#85512a');
      grad.addColorStop(0.5, '#573319');
      grad.addColorStop(1, '#2b180b');

      ctx.fillStyle = grad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(96, 74);
      ctx.quadraticCurveTo(160, 56, 224, 74);
      ctx.bezierCurveTo(256, 146, 256, 214, 224, 286);
      ctx.quadraticCurveTo(160, 304, 96, 286);
      ctx.bezierCurveTo(64, 214, 64, 146, 96, 74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ahşap tahta yarıkları
      ctx.strokeStyle = 'rgba(14, 8, 5, 0.65)';
      ctx.lineWidth = 4;
      for (const bx of [126, 160, 194]) {
        ctx.beginPath();
        ctx.moveTo(bx, 72);
        ctx.quadraticCurveTo(bx + (bx - 160) * 0.16, 180, bx, 288);
        ctx.stroke();
      }

      // 2 perçinli dövme demir çember
      ctx.fillStyle = '#3f4756';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.fillRect(76, 114, 168, 24);
      ctx.strokeRect(76, 114, 168, 24);
      ctx.fillRect(76, 222, 168, 24);
      ctx.strokeRect(76, 222, 168, 24);

      ctx.fillStyle = '#cbd5e1';
      for (const rx of [98, 160, 222]) {
        ctx.beginPath();
        ctx.arc(rx, 126, 4.5, 0, Math.PI * 2);
        ctx.arc(rx, 234, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'crate') {
      // Demir köşebentli erzak sandığı
      const grad = ctx.createLinearGradient(56, 70, 264, 290);
      grad.addColorStop(0, '#8c6036');
      grad.addColorStop(0.55, '#5c3c1f');
      grad.addColorStop(1, '#311e0f');

      ctx.fillStyle = grad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(62, 82, 196, 206, 10);
      ctx.fill();
      ctx.stroke();

      // Çapraz destek tahtası
      ctx.strokeStyle = '#3d2513';
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.moveTo(82, 102);
      ctx.lineTo(238, 268);
      ctx.stroke();

      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.strokeRect(80, 100, 160, 170);

      // Demir köşe perçinleri
      ctx.fillStyle = '#475569';
      for (const [cx, cy] of [
        [62, 82],
        [224, 82],
        [62, 254],
        [224, 254],
      ]) {
        ctx.fillRect(cx, cy, 34, 34);
        ctx.strokeRect(cx, cy, 34, 34);
      }
    } else if (kind === 'stall') {
      // Karanlık fantastik pazar / iksir tezgahı
      ctx.fillStyle = '#4c2f1a';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.fillRect(24, 178, 272, 114);
      ctx.strokeRect(24, 178, 272, 114);

      // Ahşap direkler
      ctx.fillStyle = '#331e10';
      ctx.fillRect(36, 74, 20, 108);
      ctx.strokeRect(36, 74, 20, 108);
      ctx.fillRect(264, 74, 20, 108);
      ctx.strokeRect(264, 74, 20, 108);

      // Tezgah üstü iksir şişeleri ve meyveler
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(96, 164, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(140, 164, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(196, 164, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Çizgili yıpranmış ortaçağ tentesi
      const stripeA = variant % 2 === 0 ? '#7f1d1d' : '#1e3a8a';
      const stripeB = '#d6cfc2';
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = i % 2 === 0 ? stripeA : stripeB;
        ctx.beginPath();
        ctx.moveTo(16 + i * 48, 38);
        ctx.lineTo(16 + (i + 1) * 48, 38);
        ctx.lineTo(16 + (i + 1) * 48, 96);
        ctx.quadraticCurveTo(16 + (i + 0.5) * 48, 114, 16 + i * 48, 96);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (kind === 'chest') {
      // Parlayan altın kemerli kraliyet hazine sandığı
      const halo = ctx.createRadialGradient(160, 180, 18, 160, 180, 138);
      halo.addColorStop(0, 'rgba(250, 204, 21, 0.42)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 320, 320);

      const wood = ctx.createLinearGradient(50, 108, 270, 286);
      wood.addColorStop(0, '#6e3f1c');
      wood.addColorStop(0.55, '#42230f');
      wood.addColorStop(1, '#221107');

      ctx.fillStyle = wood;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(54, 286);
      ctx.lineTo(54, 152);
      ctx.quadraticCurveTo(160, 88, 266, 152);
      ctx.lineTo(266, 286);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Altın bantlar ve kraliyet kilidi
      ctx.fillStyle = '#facc15';
      ctx.fillRect(88, 124, 26, 162);
      ctx.strokeRect(88, 124, 26, 162);
      ctx.fillRect(206, 124, 26, 162);
      ctx.strokeRect(206, 124, 26, 162);
      ctx.fillRect(54, 168, 212, 20);
      ctx.strokeRect(54, 168, 212, 20);

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(140, 160, 40, 46, 8);
      ctx.fill();
      ctx.stroke();
    } else if (kind === 'pottery') {
      // Orta Çağ Terracotta Amfora ve Sıralı Testi Kümesi
      const jugGrad = ctx.createLinearGradient(58, 86, 200, 286);
      jugGrad.addColorStop(0, '#e07a42');
      jugGrad.addColorStop(0.55, '#b84c23');
      jugGrad.addColorStop(1, '#6c2410');

      // Arka büyük amfora
      ctx.fillStyle = jugGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(106, 98);
      ctx.lineTo(154, 98);
      ctx.lineTo(146, 134);
      ctx.bezierCurveTo(198, 152, 202, 248, 162, 286);
      ctx.lineTo(98, 286);
      ctx.bezierCurveTo(58, 248, 62, 152, 114, 134);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Amfora kulpları
      ctx.strokeStyle = '#8b3515';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(82, 166, 22, Math.PI * 0.55, Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(178, 166, 22, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();

      // Dekoratif zikzak şerit
      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(86, 198);
      ctx.lineTo(104, 184);
      ctx.lineTo(122, 198);
      ctx.lineTo(140, 184);
      ctx.lineTo(158, 198);
      ctx.lineTo(174, 184);
      ctx.stroke();

      // Ön küçük çömlek testi
      const smallGrad = ctx.createLinearGradient(178, 178, 266, 288);
      smallGrad.addColorStop(0, '#f09a54');
      smallGrad.addColorStop(0.6, '#c45d2a');
      smallGrad.addColorStop(1, '#782c12');
      ctx.fillStyle = smallGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(222, 244, 42, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(202, 186, 40, 22);
      ctx.strokeRect(202, 186, 40, 22);
    } else if (kind === 'banner_stand') {
      // Kraliyet Sancak ve Zırh Askılığı
      // Ahşap taban ve mızrak direği
      ctx.fillStyle = '#4a2c15';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.roundRect(96, 266, 128, 26, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5c381b';
      ctx.fillRect(150, 56, 20, 214);
      ctx.strokeRect(150, 56, 20, 214);

      // Yatay sancak çubuğu
      ctx.fillRect(72, 86, 176, 16);
      ctx.strokeRect(72, 86, 176, 16);

      // Altın mızrak tepeliği
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(160, 24);
      ctx.lineTo(178, 62);
      ctx.lineTo(160, 54);
      ctx.lineTo(142, 62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hanedan kumaş sancağı (kırmızı / lacivert varyant)
      const clothA = variant % 2 === 0 ? '#991b1b' : '#1d4ed8';
      const clothB = variant % 2 === 0 ? '#dc2626' : '#2563eb';
      const clothGrad = ctx.createLinearGradient(88, 100, 232, 250);
      clothGrad.addColorStop(0, clothB);
      clothGrad.addColorStop(1, clothA);
      ctx.fillStyle = clothGrad;
      ctx.beginPath();
      ctx.moveTo(88, 100);
      ctx.lineTo(232, 100);
      ctx.lineTo(226, 244);
      ctx.lineTo(160, 216);
      ctx.lineTo(94, 244);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Altın arma kalkanı + kılıç deseni
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(132, 128);
      ctx.lineTo(188, 128);
      ctx.lineTo(184, 170);
      ctx.lineTo(160, 194);
      ctx.lineTo(136, 170);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(160, 156, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'hay_cart') {
      // Orta Çağ Saman Balyası ve Ahşap Araba Tekerleği
      const hayGrad = ctx.createLinearGradient(44, 128, 256, 286);
      hayGrad.addColorStop(0, '#facc15');
      hayGrad.addColorStop(0.55, '#ca8a04');
      hayGrad.addColorStop(1, '#713f12');

      ctx.fillStyle = hayGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.roundRect(42, 134, 194, 150, 24);
      ctx.fill();
      ctx.stroke();

      // Saman ipleri ve sap dokuları
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(96, 136);
      ctx.lineTo(96, 282);
      ctx.moveTo(182, 136);
      ctx.lineTo(182, 282);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      for (const [sx, sy] of [
        [62, 166],
        [116, 198],
        [146, 162],
        [204, 212],
        [72, 234],
      ]) {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 22, sy - 9);
        ctx.stroke();
      }

      // Yaslanmış ahşap tekerlek
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.fillStyle = '#5c381b';
      ctx.beginPath();
      ctx.arc(224, 224, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#18141c';
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(224, 224, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      ctx.strokeStyle = '#784821';
      ctx.lineWidth = 10;
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(224 - Math.cos(ang) * 46, 224 - Math.sin(ang) * 46);
        ctx.lineTo(224 + Math.cos(ang) * 46, 224 + Math.sin(ang) * 46);
        ctx.stroke();
      }
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(224, 224, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Efsanevi Kraliyet Yakut Tacı ve Taş Sunağı
      const halo = ctx.createRadialGradient(160, 118, 14, 160, 118, 132);
      halo.addColorStop(0, 'rgba(251, 191, 36, 0.55)');
      halo.addColorStop(0.5, 'rgba(239, 68, 68, 0.25)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, 320, 320);

      // Taş sunak kaidesi
      const stone = ctx.createLinearGradient(80, 165, 240, 290);
      stone.addColorStop(0, '#64748b');
      stone.addColorStop(0.55, '#334155');
      stone.addColorStop(1, '#1e293b');
      ctx.fillStyle = stone;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(86, 290);
      ctx.lineTo(100, 174);
      ctx.lineTo(220, 174);
      ctx.lineTo(234, 290);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Kadife yastık
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(88, 148, 144, 30, 12);
      ctx.fill();
      ctx.stroke();

      // Altın kraliyet tacı ve parlayan dev yakut
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(104, 152);
      ctx.lineTo(94, 86);
      ctx.lineTo(132, 116);
      ctx.lineTo(160, 62);
      ctx.lineTo(188, 116);
      ctx.lineTo(226, 86);
      ctx.lineTo(216, 152);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(160, 92);
      ctx.lineTo(176, 118);
      ctx.lineTo(160, 140);
      ctx.lineTo(144, 118);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });

  const w =
    kind === 'stall'
      ? 3.25
      : kind === 'hay_cart'
        ? 2.85
        : kind === 'chest'
          ? 2.65
          : kind === 'special_treasure'
            ? 2.7
            : kind === 'banner_stand'
              ? 2.35
              : 2.25;
  const h =
    kind === 'stall'
      ? 3.2
      : kind === 'banner_stand'
        ? 3.15
        : kind === 'special_treasure'
          ? 2.95
          : 2.45;
  const mesh = makePart(tex, w, h, 0, h * 0.45, 11);
  g.add(mesh);
  return g;
}

/* ============================================================================
 * 3. COLLECTIBLE CARTOON-MEDIEVAL BONUS / POWER-UP EMBLEMS
 * ============================================================================ */

export interface BonusEntityRig {
  group: THREE.Group;
  halo: THREE.Mesh;
  emblem: THREE.Mesh;
}

export function createBonusEntityMesh(kind: BonusKind): BonusEntityRig {
  const group = new THREE.Group();

  const haloColor =
    kind === 'gold_rush'
      ? '#facc15'
      : kind === 'double_score'
        ? '#38bdf8'
        : kind === 'power_surge'
          ? '#fb7185'
          : '#34d399';

  const haloTex = cachedTex(`bonus_halo_${kind}`, 256, 256, (ctx) => {
    const grad = ctx.createRadialGradient(128, 128, 14, 128, 128, 122);
    grad.addColorStop(0, `${haloColor}dd`);
    grad.addColorStop(0.45, `${haloColor}55`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Dönen yıldız ışınları
    ctx.strokeStyle = `${haloColor}cc`;
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(128 + Math.cos(a) * 58, 128 + Math.sin(a) * 58);
      ctx.lineTo(128 + Math.cos(a) * 106, 128 + Math.sin(a) * 106);
      ctx.stroke();
    }
  });

  const halo = makePart(haloTex, 1.95, 1.95, 0, 0, 14);
  (halo.material as THREE.MeshBasicMaterial).blending = THREE.AdditiveBlending;
  group.add(halo);

  const emblemTex = cachedTex(`bonus_emblem_${kind}`, 256, 256, (ctx) => {
    // Dış ortaçağ rozet madalyonu
    const bgGrad = ctx.createRadialGradient(112, 92, 16, 128, 128, 98);
    if (kind === 'gold_rush') {
      bgGrad.addColorStop(0, '#fef08a');
      bgGrad.addColorStop(0.55, '#f59e0b');
      bgGrad.addColorStop(1, '#92400e');
    } else if (kind === 'double_score') {
      bgGrad.addColorStop(0, '#bae6fd');
      bgGrad.addColorStop(0.55, '#0284c7');
      bgGrad.addColorStop(1, '#1e3a8a');
    } else if (kind === 'power_surge') {
      bgGrad.addColorStop(0, '#fed7aa');
      bgGrad.addColorStop(0.55, '#ef4444');
      bgGrad.addColorStop(1, '#7f1d1d');
    } else {
      bgGrad.addColorStop(0, '#bbf7d0');
      bgGrad.addColorStop(0.55, '#10b981');
      bgGrad.addColorStop(1, '#064e3b');
    }

    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(128, 128, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Altın iç çerçeve
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(128, 128, 76, 0, Math.PI * 2);
    ctx.stroke();

    // Bonus türüne özel büyük karikatürize ikon
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    if (kind === 'gold_rush') {
      // Taşan altın kesesi / sikke yığını
      ctx.fillStyle = '#fde047';
      for (const [cx, cy] of [
        [96, 148],
        [156, 148],
        [126, 112],
      ]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fef9c3';
        ctx.beginPath();
        ctx.arc(cx - 8, cy - 8, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
      }
    } else if (kind === 'double_score') {
      // Dev "2X" ortaçağ nişanı
      ctx.font = '900 94px "Pirata One", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 14;
      ctx.strokeStyle = INK;
      ctx.strokeText('2X', 128, 134);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('2X', 128, 134);
    } else if (kind === 'power_surge') {
      // Alevli Şimşek / Güç İksiri
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(146, 54);
      ctx.lineTo(86, 136);
      ctx.lineTo(126, 136);
      ctx.lineTo(106, 204);
      ctx.lineTo(174, 114);
      ctx.lineTo(134, 114);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Parlayan Kraliyet Yıldızı (+PUAN)
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 58 : 26;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = 128 + Math.cos(a) * r;
        const py = 128 + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });

  const emblem = makePart(emblemTex, 1.32, 1.32, 0, 0, 15);
  group.add(emblem);
  return { group, halo, emblem };
}
