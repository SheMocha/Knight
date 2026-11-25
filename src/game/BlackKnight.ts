import * as THREE from 'three';
import { KnightAnimState, WeaponId } from './types';

type KnightFaceMood = 'normal' | 'fierce' | 'dizzy';

const INK = '#0c0a12';

// Silah kademesine göre aura ve vuruş izi renkleri
const WEAPON_FX_COLOR: Record<WeaponId, { aura: number; slash: number }> = {
  club: { aura: 0xfacc15, slash: 0xfff8dc },
  mallet: { aura: 0xfb923c, slash: 0xfef08a },
  hammer: { aura: 0xfde047, slash: 0xfef9c3 },
  axe: { aura: 0x38bdf8, slash: 0xe0f2fe },
  excalibur: { aura: 0x60a5fa, slash: 0xffffff },
  mace: { aura: 0xf43f5e, slash: 0xfde047 },
};

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
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function makePartMesh(
  tex: THREE.CanvasTexture,
  worldW: number,
  worldH: number,
  offsetX: number,
  offsetY: number,
  renderOrder: number,
  ownedGeos: THREE.BufferGeometry[],
  ownedMats: THREE.Material[],
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(worldW, worldH);
  geo.translate(offsetX, offsetY, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.03,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  ownedGeos.push(geo);
  ownedMats.push(mat);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = renderOrder;
  return mesh;
}

/* ============================================================================
 * YÜKSEK KALİTELİ, HEYBETLİ KARA ŞÖVALYE (JUGGERNAUT) DOKU ÇİZİMLERİ
 * ============================================================================ */

function drawCapeUpperTex(): THREE.CanvasTexture {
  return makeTex(320, 320, (ctx) => {
    const grad = ctx.createLinearGradient(260, 30, 30, 290);
    grad.addColorStop(0, '#27131a');
    grad.addColorStop(0.35, '#191b26');
    grad.addColorStop(0.75, '#11131b');
    grad.addColorStop(1, '#3b1018');

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(260, 38);
    ctx.bezierCurveTo(170, 56, 86, 118, 32, 236);
    ctx.quadraticCurveTo(106, 272, 188, 258);
    ctx.quadraticCurveTo(234, 248, 276, 206);
    ctx.bezierCurveTo(286, 134, 282, 74, 260, 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Altın pelerin şeridi
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(48, 224);
    ctx.quadraticCurveTo(126, 254, 262, 198);
    ctx.stroke();

    // Kumaş kat gölgeleri
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(234, 68);
    ctx.quadraticCurveTo(154, 128, 102, 214);
    ctx.stroke();
  });
}

function drawCapeLowerTex(): THREE.CanvasTexture {
  return makeTex(300, 240, (ctx) => {
    const grad = ctx.createLinearGradient(250, 20, 24, 210);
    grad.addColorStop(0, '#161923');
    grad.addColorStop(0.55, '#101219');
    grad.addColorStop(1, '#45121d');

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(256, 28);
    ctx.lineTo(74, 42);
    ctx.bezierCurveTo(44, 96, 22, 148, 18, 196);
    ctx.quadraticCurveTo(88, 222, 152, 192);
    ctx.quadraticCurveTo(208, 212, 268, 174);
    ctx.bezierCurveTo(274, 118, 270, 68, 256, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Altın işlemeli etek kenarı
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(28, 184);
    ctx.quadraticCurveTo(92, 208, 152, 180);
    ctx.quadraticCurveTo(206, 198, 258, 166);
    ctx.stroke();
  });
}

function drawTorsoTex(): THREE.CanvasTexture {
  return makeTex(420, 440, (ctx) => {
    // 1. Geniş zırhlı etek (tassets)
    const tassetGrad = ctx.createLinearGradient(80, 270, 340, 410);
    tassetGrad.addColorStop(0, '#363d4e');
    tassetGrad.addColorStop(0.5, '#1d212c');
    tassetGrad.addColorStop(1, '#0e1017');

    ctx.fillStyle = tassetGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(86, 278);
    ctx.lineTo(334, 278);
    ctx.lineTo(356, 386);
    ctx.quadraticCurveTo(214, 416, 68, 382);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tasset altın kenar şeritleri
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(78, 370);
    ctx.quadraticCurveTo(214, 398, 346, 372);
    ctx.stroke();

    // 2. Devasa geniş heybetli göğüs zırhı (Juggernaut cuirass)
    const chestGrad = ctx.createLinearGradient(44, 34, 366, 320);
    chestGrad.addColorStop(0, '#5a657d');
    chestGrad.addColorStop(0.24, '#323847');
    chestGrad.addColorStop(0.62, '#181c26');
    chestGrad.addColorStop(1, '#0c0e14');

    ctx.fillStyle = chestGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(70, 74);
    ctx.quadraticCurveTo(210, 18, 348, 72);
    ctx.bezierCurveTo(386, 146, 376, 236, 338, 294);
    ctx.quadraticCurveTo(210, 326, 82, 294);
    ctx.bezierCurveTo(44, 236, 36, 148, 70, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Çelik göğüs yansımaları (parlak cel-shaded vurgu)
    ctx.fillStyle = 'rgba(203, 224, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(134, 146, 34, 74, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.ellipse(278, 138, 22, 54, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Zırh kas/plaka çizgileri
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(92, 182);
    ctx.quadraticCurveTo(228, 212, 342, 176);
    ctx.moveTo(100, 236);
    ctx.quadraticCurveTo(226, 260, 330, 232);
    ctx.stroke();

    // Gösterişli Altın Kraliyet Filigranı (3/4 sağa dönük merkez)
    ctx.save();
    ctx.translate(234, 178);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(0, -82);
    ctx.lineTo(0, 84);
    ctx.moveTo(-66, -26);
    ctx.quadraticCurveTo(0, -6, 66, -26);
    ctx.moveTo(-46, 26);
    ctx.bezierCurveTo(-78, 8, -78, -32, -46, -40);
    ctx.moveTo(46, 26);
    ctx.bezierCurveTo(78, 8, 78, -32, 46, -40);
    ctx.stroke();

    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-3, -76);
    ctx.lineTo(-3, 78);
    ctx.stroke();
    ctx.restore();

    // Altın boyun zırhı (Gorget)
    const goldGrad = ctx.createLinearGradient(76, 46, 348, 108);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.5, '#facc15');
    goldGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = goldGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(84, 62);
    ctx.quadraticCurveTo(216, 114, 342, 64);
    ctx.lineTo(328, 104);
    ctx.quadraticCurveTo(216, 150, 98, 102);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ağır altın kemer & yakut toka
    ctx.fillStyle = goldGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(74, 270);
    ctx.quadraticCurveTo(216, 300, 346, 270);
    ctx.lineTo(340, 316);
    ctx.quadraticCurveTo(216, 344, 80, 316);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Kemer yakutu
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.roundRect(204, 276, 52, 44, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.roundRect(214, 285, 16, 12, 4);
    ctx.fill();

    // Ortadaki kırmızı kraliyet pelerin şeridi (Tabard)
    ctx.fillStyle = '#991b1b';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(198, 322);
    ctx.lineTo(264, 322);
    ctx.lineTo(254, 418);
    ctx.lineTo(231, 396);
    ctx.lineTo(208, 418);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(210, 330);
    ctx.lineTo(216, 398);
    ctx.moveTo(252, 330);
    ctx.lineTo(246, 398);
    ctx.stroke();
  });
}

function drawHeadTex(mood: KnightFaceMood): THREE.CanvasTexture {
  return makeTex(380, 360, (ctx) => {
    // Arka çelik ense zırhı
    ctx.fillStyle = '#191d28';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.roundRect(82, 184, 174, 114, 30);
    ctx.fill();
    ctx.stroke();

    // Güçlü savaşçı yüzü
    const skinGrad = ctx.createLinearGradient(148, 146, 294, 290);
    skinGrad.addColorStop(0, '#cf8350');
    skinGrad.addColorStop(0.55, '#ad6437');
    skinGrad.addColorStop(1, '#7c411e');

    ctx.fillStyle = skinGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(148, 146, 146, 144, 38);
    ctx.fill();
    ctx.stroke();

    // Heybetli gür koyu sakal
    ctx.fillStyle = '#201513';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(154, 228);
    ctx.quadraticCurveTo(172, 312, 236, 310);
    ctx.quadraticCurveTo(288, 304, 296, 238);
    ctx.lineTo(276, 226);
    ctx.quadraticCurveTo(232, 248, 178, 222);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Burun
    ctx.fillStyle = '#bf7343';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(256, 210, 18, 13, -0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Yüz ifadesi (normal / fierce / dizzy)
    if (mood === 'dizzy') {
      const drawSpiral = (cx: number, cy: number) => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4.4; a += 0.25) {
          const r = a * 1.2;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawSpiral(204, 190);
      drawSpiral(266, 190);

      // Şaşkın ağız + pembe dil
      ctx.fillStyle = '#4c0519';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(240, 258, 24, 18, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.ellipse(244, 268, 13, 14, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      const isFierce = mood === 'fierce';
      const drawEye = (cx: number, cy: number) => {
        ctx.fillStyle = isFierce ? '#fef08a' : '#ffffff';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 16, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isFierce ? '#ea580c' : '#0f0c14';
        ctx.beginPath();
        ctx.arc(cx + 4, cy, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(204, 192);
      drawEye(264, 192);

      // Kalın çatık savaşçı kaşları
      ctx.strokeStyle = '#180f0d';
      ctx.lineWidth = 12;
      ctx.beginPath();
      if (isFierce) {
        ctx.moveTo(182, 166);
        ctx.lineTo(224, 182);
        ctx.moveTo(284, 166);
        ctx.lineTo(246, 182);
      } else {
        ctx.moveTo(182, 174);
        ctx.quadraticCurveTo(204, 164, 224, 174);
        ctx.moveTo(246, 174);
        ctx.quadraticCurveTo(266, 164, 286, 174);
      }
      ctx.stroke();

      // Savaşçı gülüşü veya kükreme
      if (isFierce) {
        ctx.fillStyle = '#5c0a16';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.roundRect(202, 236, 70, 42, 12);
        ctx.fill();
        ctx.stroke();

        // Üst-alt dişler
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(210, 240, 54, 12);
        ctx.fillRect(212, 264, 50, 10);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(202, 240);
        ctx.quadraticCurveTo(238, 250, 274, 238);
        ctx.quadraticCurveTo(268, 272, 238, 272);
        ctx.quadraticCurveTo(208, 272, 202, 240);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Yanak zırhı plakası
    ctx.fillStyle = '#242a38';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(124, 146);
    ctx.lineTo(172, 160);
    ctx.lineTo(166, 262);
    ctx.lineTo(118, 242);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Miğfer yan boynuz/diken süsü
    const hornGrad = ctx.createLinearGradient(130, 82, 62, 34);
    hornGrad.addColorStop(0, '#eab308');
    hornGrad.addColorStop(0.6, '#fef08a');
    hornGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = hornGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(124, 126);
    ctx.quadraticCurveTo(78, 96, 62, 46);
    ctx.quadraticCurveTo(106, 68, 148, 94);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Devasa perçinli siyah çelik miğfer kubbesi
    const helmGrad = ctx.createRadialGradient(168, 100, 18, 196, 134, 138);
    helmGrad.addColorStop(0, '#78869e');
    helmGrad.addColorStop(0.32, '#333b4d');
    helmGrad.addColorStop(0.76, '#151924');
    helmGrad.addColorStop(1, '#0b0d14');

    ctx.fillStyle = helmGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(198, 158, 98, Math.PI * 1.03, Math.PI * 1.98);
    ctx.lineTo(302, 168);
    ctx.quadraticCurveTo(212, 148, 102, 174);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Parlak çelik ışık yay çizgisi
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(198, 156, 76, Math.PI * 1.18, Math.PI * 1.56);
    ctx.stroke();

    // Altın taçlı miğfer kaş bandı
    const goldBand = ctx.createLinearGradient(104, 140, 304, 172);
    goldBand.addColorStop(0, '#fef08a');
    goldBand.addColorStop(0.5, '#facc15');
    goldBand.addColorStop(1, '#b45309');

    ctx.fillStyle = goldBand;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(104, 158);
    ctx.quadraticCurveTo(210, 132, 302, 156);
    ctx.lineTo(296, 178);
    ctx.quadraticCurveTo(210, 156, 108, 180);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Perçinler
    ctx.fillStyle = '#fef9c3';
    for (const [rx, ry] of [
      [138, 163],
      [182, 155],
      [228, 154],
      [272, 160],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Üst tüy yuvası
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(196, 60, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawPlumeTex(): THREE.CanvasTexture {
  return makeTex(280, 220, (ctx) => {
    const grad = ctx.createLinearGradient(236, 156, 22, 42);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.52, '#b91c1c');
    grad.addColorStop(1, '#7f1d1d');

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(242, 168);
    ctx.bezierCurveTo(250, 56, 156, 10, 56, 48);
    ctx.bezierCurveTo(96, 56, 106, 74, 18, 104);
    ctx.bezierCurveTo(82, 122, 78, 142, 36, 170);
    ctx.bezierCurveTo(122, 174, 168, 142, 218, 182);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(222, 142);
    ctx.bezierCurveTo(192, 72, 132, 52, 76, 66);
    ctx.moveTo(208, 156);
    ctx.bezierCurveTo(166, 106, 112, 98, 58, 118);
    ctx.stroke();
  });
}

/** Üst bacak (kalça -> diz) */
function drawThighTex(isFront: boolean): THREE.CanvasTexture {
  return makeTex(190, 220, (ctx) => {
    const grad = ctx.createLinearGradient(44, 16, 152, 200);
    grad.addColorStop(0, isFront ? '#4b556b' : '#2d3342');
    grad.addColorStop(0.55, isFront ? '#222735' : '#171b24');
    grad.addColorStop(1, '#0e1017');

    ctx.fillStyle = grad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.roundRect(46, 22, 98, 168, 36);
    ctx.fill();
    ctx.stroke();

    // Altın uyluk süslemesi
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(64, 58);
    ctx.quadraticCurveTo(98, 46, 126, 72);
    ctx.stroke();
  });
}

/** Alt bacak + dizlik + dev zırhlı çizme (diz -> ayak tabanı) */
function drawShinBootTex(isFront: boolean): THREE.CanvasTexture {
  return makeTex(250, 260, (ctx) => {
    // Alt baldır zırhı (greave)
    const shinGrad = ctx.createLinearGradient(54, 34, 156, 198);
    shinGrad.addColorStop(0, isFront ? '#475166' : '#2c3240');
    shinGrad.addColorStop(0.55, isFront ? '#1f2430' : '#151821');
    shinGrad.addColorStop(1, '#0d0f16');

    ctx.fillStyle = shinGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.roundRect(56, 36, 92, 146, 26);
    ctx.fill();
    ctx.stroke();

    // Devasa zırhlı sabaton çizmesi
    const bootGrad = ctx.createLinearGradient(48, 160, 220, 240);
    bootGrad.addColorStop(0, isFront ? '#525c73' : '#313746');
    bootGrad.addColorStop(0.5, isFront ? '#232836' : '#161a24');
    bootGrad.addColorStop(1, '#0c0e15');

    ctx.fillStyle = bootGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(46, 166);
    ctx.lineTo(156, 166);
    ctx.quadraticCurveTo(218, 174, 224, 218);
    ctx.lineTo(220, 238);
    ctx.lineTo(44, 238);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Altın bilek şeridi & burun zırhı
    ctx.fillStyle = '#eab308';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(50, 150, 102, 22, 8);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(156, 174);
    ctx.quadraticCurveTo(198, 184, 212, 222);
    ctx.stroke();

    // İri Altın Dizlik Plakası (eklemi pürüzsüz kapatır!)
    const goldGrad = ctx.createLinearGradient(56, 12, 164, 82);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.5, '#facc15');
    goldGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = goldGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(58, 34);
    ctx.quadraticCurveTo(116, 4, 164, 42);
    ctx.lineTo(154, 82);
    ctx.quadraticCurveTo(106, 98, 56, 74);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/** Üst kol + devasa dikenli altın omuzluk (Pauldron) */
function drawUpperArmTex(isFront: boolean): THREE.CanvasTexture {
  return makeTex(300, 290, (ctx) => {
    // Üst kol zırhı
    const armGrad = ctx.createLinearGradient(96, 110, 206, 260);
    armGrad.addColorStop(0, isFront ? '#4f5a70' : '#2d3444');
    armGrad.addColorStop(0.55, isFront ? '#232836' : '#181c26');
    armGrad.addColorStop(1, '#0e1017');

    ctx.fillStyle = armGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.roundRect(104, 116, 92, 146, 32);
    ctx.fill();
    ctx.stroke();

    // Omuzluk dikenleri (3 dev altın/çelik diken)
    const drawSpike = (x1: number, y1: number, tx: number, ty: number, x2: number, y2: number) => {
      const spGrad = ctx.createLinearGradient(x1, y1, tx, ty);
      spGrad.addColorStop(0, '#ca8a04');
      spGrad.addColorStop(0.55, '#fef08a');
      spGrad.addColorStop(1, '#ffffff');
      ctx.fillStyle = spGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(tx, ty);
      ctx.lineTo(x2, y2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };
    drawSpike(82, 102, 24, 42, 118, 76);
    drawSpike(128, 72, 152, 10, 174, 72);
    drawSpike(184, 78, 262, 42, 218, 108);

    // Devasa heybetli omuzluk kubbesi (Pauldron)
    const paulGrad = ctx.createRadialGradient(132, 96, 14, 150, 122, 92);
    paulGrad.addColorStop(0, '#fef08a');
    paulGrad.addColorStop(0.42, '#facc15');
    paulGrad.addColorStop(0.84, '#ca8a04');
    paulGrad.addColorStop(1, '#854d0e');

    ctx.fillStyle = paulGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(150, 134, 78, Math.PI * 0.94, Math.PI * 2.06);
    ctx.quadraticCurveTo(150, 176, 72, 146);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Siyah zırh omuzluk göbeği + altın nakış
    ctx.fillStyle = isFront ? '#1e2433' : '#141822';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 136, 48, Math.PI * 1.02, Math.PI * 1.98);
    ctx.quadraticCurveTo(150, 158, 102, 140);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

/** Ön kol + ağır demir eldiven (Gauntlet) */
function drawForearmTex(isFront: boolean): THREE.CanvasTexture {
  return makeTex(220, 250, (ctx) => {
    const steelGrad = ctx.createLinearGradient(58, 20, 166, 210);
    steelGrad.addColorStop(0, isFront ? '#546078' : '#303747');
    steelGrad.addColorStop(0.55, isFront ? '#242a38' : '#181c26');
    steelGrad.addColorStop(1, '#0e1017');

    // Dirsek koruyucu + ön kol vambrace
    ctx.fillStyle = steelGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.roundRect(64, 24, 92, 138, 30);
    ctx.fill();
    ctx.stroke();

    // Altın dirsek ve bilek kelepçesi
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(56, 128, 108, 30, 10);
    ctx.fill();
    ctx.stroke();

    // Dev zırhlı yumruk (Gauntlet)
    ctx.fillStyle = isFront ? '#31384a' : '#1f2430';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(110, 186, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Altın parmak boğum perçinleri
    ctx.fillStyle = '#fde047';
    for (const kx of [88, 110, 132]) {
      ctx.beginPath();
      ctx.arc(kx, 194, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** 6 Ayrı Dev El Çizimi Mağaza Silahı */
function drawWeaponTex(weapon: WeaponId): THREE.CanvasTexture {
  return makeTex(360, 560, (ctx) => {
    const cx = 180;
    if (weapon === 'club') {
      const woodGrad = ctx.createLinearGradient(cx - 56, 54, cx + 56, 490);
      woodGrad.addColorStop(0, '#c57a34');
      woodGrad.addColorStop(0.5, '#8f4f1c');
      woodGrad.addColorStop(1, '#582c0d');

      ctx.fillStyle = woodGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(cx - 20, 505);
      ctx.lineTo(cx - 58, 120);
      ctx.quadraticCurveTo(cx - 62, 42, cx, 40);
      ctx.quadraticCurveTo(cx + 62, 42, cx + 58, 120);
      ctx.lineTo(cx + 20, 505);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Demir çemberler ve çiviler
      ctx.fillStyle = '#475569';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(cx - 60, 126, 120, 32, 10);
      ctx.roundRect(cx - 46, 240, 92, 26, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(cx - 24, 434, 48, 66, 10);
      ctx.fill();
      ctx.stroke();
    } else if (weapon === 'mallet') {
      ctx.fillStyle = '#7c4319';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.roundRect(cx - 19, 154, 38, 354, 12);
      ctx.fill();
      ctx.stroke();

      const headGrad = ctx.createLinearGradient(cx - 128, 44, cx + 128, 206);
      headGrad.addColorStop(0, '#c87e36');
      headGrad.addColorStop(0.5, '#924f1d');
      headGrad.addColorStop(1, '#5a2d0d');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.roundRect(cx - 130, 48, 260, 152, 32);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(cx - 132, 46, 40, 156, 14);
      ctx.roundRect(cx + 92, 46, 40, 156, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(cx - 28, 194, 56, 28, 8);
      ctx.fill();
      ctx.stroke();
    } else if (weapon === 'hammer') {
      ctx.fillStyle = '#7c3f18';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.roundRect(cx - 20, 174, 40, 336, 12);
      ctx.fill();
      ctx.stroke();

      // Alt ve üst çelik dikenler
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(cx - 24, 500);
      ctx.lineTo(cx, 542);
      ctx.lineTo(cx + 24, 500);
      ctx.closePath();
      ctx.moveTo(cx - 26, 62);
      ctx.lineTo(cx, 14);
      ctx.lineTo(cx + 26, 62);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Dev rünlü çelik çekiç kafası
      const steelGrad = ctx.createLinearGradient(cx - 132, 46, cx + 132, 210);
      steelGrad.addColorStop(0, '#94a3b8');
      steelGrad.addColorStop(0.45, '#475569');
      steelGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = steelGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 122, 60);
      ctx.lineTo(cx + 122, 60);
      ctx.lineTo(cx + 146, 90);
      ctx.lineTo(cx + 146, 178);
      ctx.lineTo(cx + 122, 208);
      ctx.lineTo(cx - 122, 208);
      ctx.lineTo(cx - 146, 178);
      ctx.lineTo(cx - 146, 90);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Parlayan altın rünler
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 56, 108);
      ctx.lineTo(cx - 56, 160);
      ctx.lineTo(cx - 24, 108);
      ctx.lineTo(cx - 24, 160);
      ctx.moveTo(cx + 12, 134);
      ctx.lineTo(cx + 36, 106);
      ctx.lineTo(cx + 60, 134);
      ctx.lineTo(cx + 36, 162);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(cx - 30, 202, 60, 30, 8);
      ctx.fill();
      ctx.stroke();
    } else if (weapon === 'axe') {
      ctx.fillStyle = '#6b3818';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.roundRect(cx - 18, 92, 36, 422, 10);
      ctx.fill();
      ctx.stroke();

      const bladeGrad = ctx.createLinearGradient(cx - 154, 44, cx + 154, 248);
      bladeGrad.addColorStop(0, '#f8fafc');
      bladeGrad.addColorStop(0.5, '#94a3b8');
      bladeGrad.addColorStop(1, '#334155');
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(cx - 22, 108);
      ctx.quadraticCurveTo(cx - 102, 92, cx - 146, 42);
      ctx.quadraticCurveTo(cx - 166, 152, cx - 142, 260);
      ctx.quadraticCurveTo(cx - 98, 212, cx - 22, 198);
      ctx.closePath();
      ctx.moveTo(cx + 22, 108);
      ctx.quadraticCurveTo(cx + 102, 92, cx + 146, 42);
      ctx.quadraticCurveTo(cx + 166, 152, cx + 142, 260);
      ctx.quadraticCurveTo(cx + 98, 212, cx + 22, 198);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(cx - 22, 98);
      ctx.lineTo(cx, 16);
      ctx.lineTo(cx + 22, 98);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(cx - 32, 118, 64, 68, 14);
      ctx.fill();
      ctx.stroke();
    } else if (weapon === 'excalibur') {
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.roundRect(cx - 18, 412, 36, 98, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, 518, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const bladeGrad = ctx.createLinearGradient(cx - 56, 22, cx + 56, 405);
      bladeGrad.addColorStop(0, '#ffffff');
      bladeGrad.addColorStop(0.46, '#e2e8f0');
      bladeGrad.addColorStop(0.54, '#94a3b8');
      bladeGrad.addColorStop(1, '#cbd5e1');

      ctx.fillStyle = bladeGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.moveTo(cx - 46, 402);
      ctx.lineTo(cx - 38, 96);
      ctx.lineTo(cx, 14);
      ctx.lineTo(cx + 38, 96);
      ctx.lineTo(cx + 46, 402);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(cx - 9, 118, 18, 268, 8);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(cx - 116, 392);
      ctx.quadraticCurveTo(cx, 376, cx + 116, 392);
      ctx.lineTo(cx + 102, 428);
      ctx.quadraticCurveTo(cx, 416, cx - 102, 428);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(cx, 386);
      ctx.lineTo(cx + 22, 408);
      ctx.lineTo(cx, 430);
      ctx.lineTo(cx - 22, 408);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Dikenli Gürz (Morningstar)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.roundRect(cx - 18, 214, 36, 304, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(cx - 26, 444, 52, 64, 10);
      ctx.roundRect(cx - 30, 222, 60, 30, 10);
      ctx.fill();
      ctx.stroke();

      const cy = 142;
      const spikes = 8;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const bx1 = cx + Math.cos(a - 0.25) * 66;
        const by1 = cy + Math.sin(a - 0.25) * 66;
        const bx2 = cx + Math.cos(a + 0.25) * 66;
        const by2 = cy + Math.sin(a + 0.25) * 66;
        const tx = cx + Math.cos(a) * 134;
        const ty = cy + Math.sin(a) * 134;

        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(bx1, by1);
        ctx.lineTo(tx, ty);
        ctx.lineTo(bx2, by2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      const ballGrad = ctx.createRadialGradient(cx - 26, cy - 26, 12, cx, cy, 86);
      ballGrad.addColorStop(0, '#64748b');
      ballGrad.addColorStop(0.5, '#334155');
      ballGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = ballGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.arc(cx, cy, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
}

function drawPigBodyTex(): THREE.CanvasTexture {
  return makeTex(360, 300, (ctx) => {
    // Kıvrık domuz kuyruğu
    ctx.strokeStyle = INK;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(46, 166, 20, 0.3, Math.PI * 1.8);
    ctx.stroke();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 7;
    ctx.stroke();

    // Tombul pembe gövde
    const bodyGrad = ctx.createRadialGradient(142, 146, 26, 160, 174, 122);
    bodyGrad.addColorStop(0, '#fbcfe8');
    bodyGrad.addColorStop(0.6, '#f472b6');
    bodyGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.ellipse(156, 176, 98, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kafa
    ctx.fillStyle = '#f9a8d4';
    ctx.beginPath();
    ctx.arc(250, 160, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Kulak
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(214, 112);
    ctx.quadraticCurveTo(196, 76, 238, 90);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Domuz burnu
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(310, 166, 25, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.ellipse(305, 165, 5, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(319, 165, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Şaşkın göz
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(270, 144, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(274, 144, 7, 0, Math.PI * 2);
    ctx.fill();

    // Şövalyenin küçük miğferi domuzun kafasında!
    ctx.fillStyle = '#202634';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(248, 112, 42, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.fillRect(208, 104, 80, 14);
    ctx.strokeRect(208, 104, 80, 14);

    // Kırmızı miğfer tüyü
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(240, 70);
    ctx.quadraticCurveTo(202, 22, 166, 56);
    ctx.quadraticCurveTo(206, 68, 228, 82);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

function drawPigLegTex(): THREE.CanvasTexture {
  return makeTex(90, 130, (ctx) => {
    ctx.fillStyle = '#f472b6';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.roundRect(24, 14, 42, 82, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3b242c';
    ctx.beginPath();
    ctx.roundRect(20, 82, 50, 32, 10);
    ctx.fill();
    ctx.stroke();
  });
}

function drawSmoothAuraTex(): THREE.CanvasTexture {
  return makeTex(256, 256, (ctx) => {
    const cx = 128;
    const cy = 128;
    const grad = ctx.createRadialGradient(cx, cy, 14, cx, cy, 124);
    grad.addColorStop(0, 'rgba(255, 250, 210, 0.92)');
    grad.addColorStop(0.4, 'rgba(250, 204, 21, 0.56)');
    grad.addColorStop(0.74, 'rgba(249, 115, 22, 0.18)');
    grad.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = 'rgba(255, 252, 220, 0.48)';
    ctx.lineWidth = 5;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 52, cy + Math.sin(a) * 52);
      ctx.lineTo(cx + Math.cos(a) * 114, cy + Math.sin(a) * 114);
      ctx.stroke();
    }
  });
}

function drawPowerRingTex(): THREE.CanvasTexture {
  return makeTex(256, 256, (ctx) => {
    const cx = 128;
    const cy = 128;
    const grad = ctx.createRadialGradient(cx, cy, 76, cx, cy, 122);
    grad.addColorStop(0, 'rgba(255, 248, 180, 0)');
    grad.addColorStop(0.45, 'rgba(253, 224, 71, 0.85)');
    grad.addColorStop(0.72, 'rgba(255, 255, 255, 0.96)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 122, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawSlashArcTex(): THREE.CanvasTexture {
  return makeTex(256, 256, (ctx) => {
    const cx = 84;
    const cy = 128;
    const grad = ctx.createRadialGradient(cx, cy, 42, cx, cy, 148);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.45, 'rgba(253, 224, 71, 0.35)');
    grad.addColorStop(0.76, 'rgba(254, 240, 138, 0.88)');
    grad.addColorStop(0.92, 'rgba(255, 255, 255, 0.98)');
    grad.addColorStop(1, 'rgba(250, 204, 21, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 146, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.arc(cx, cy, 68, Math.PI * 0.42, -Math.PI * 0.42, true);
    ctx.closePath();
    ctx.fill();

    // Hız çizgileri (el boyaması keskin kılıç darbesi izi)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 132, -Math.PI * 0.44, Math.PI * 0.4);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 108, -Math.PI * 0.36, Math.PI * 0.32);
    ctx.stroke();
  });
}

function drawSlashCoreTex(): THREE.CanvasTexture {
  return makeTex(256, 256, (ctx) => {
    const cx = 84;
    const cy = 128;
    const grad = ctx.createRadialGradient(cx, cy, 86, cx, cy, 148);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.92)');
    grad.addColorStop(0.85, 'rgba(255, 251, 235, 1)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 146, -Math.PI * 0.44, Math.PI * 0.44);
    ctx.arc(cx, cy, 114, Math.PI * 0.38, -Math.PI * 0.38, true);
    ctx.closePath();
    ctx.fill();
  });
}

function drawShieldTex(): THREE.CanvasTexture {
  return makeTex(256, 288, (ctx) => {
    // Karanlık fantastik perçinli demir ve altın süslemeli gotik şövalye kalkanı
    const bodyGrad = ctx.createLinearGradient(34, 26, 222, 260);
    bodyGrad.addColorStop(0, '#5a6378');
    bodyGrad.addColorStop(0.45, '#2b303f');
    bodyGrad.addColorStop(1, '#12151e');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(46, 36);
    ctx.quadraticCurveTo(128, 18, 210, 36);
    ctx.lineTo(206, 134);
    ctx.quadraticCurveTo(200, 216, 128, 266);
    ctx.quadraticCurveTo(56, 216, 50, 134);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Altın metal çerçeve şeridi
    ctx.strokeStyle = '#d4a11e';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(60, 48);
    ctx.quadraticCurveTo(128, 34, 196, 48);
    ctx.lineTo(192, 132);
    ctx.quadraticCurveTo(186, 202, 128, 248);
    ctx.quadraticCurveTo(70, 202, 64, 132);
    ctx.closePath();
    ctx.stroke();

    // Kızıl şövalye arması (ortada karanlık yakut şerit)
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(108, 48);
    ctx.lineTo(148, 48);
    ctx.lineTo(146, 228);
    ctx.lineTo(128, 244);
    ctx.lineTo(110, 228);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(66, 108, 124, 34);

    // Ortada altın kabartmalı kalkan göbeği (boss)
    const bossGrad = ctx.createRadialGradient(122, 120, 4, 128, 125, 28);
    bossGrad.addColorStop(0, '#fef08a');
    bossGrad.addColorStop(0.5, '#eab308');
    bossGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = bossGrad;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(128, 125, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Çelik savaş çizikleri ve ay ışığı kenar parıltısı
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(74, 70);
    ctx.lineTo(102, 92);
    ctx.moveTo(154, 162);
    ctx.lineTo(182, 144);
    ctx.stroke();

    // Köşe perçinleri
    ctx.fillStyle = '#fde047';
    for (const [rx, ry] of [
      [70, 58],
      [186, 58],
      [74, 152],
      [182, 152],
      [128, 234],
    ]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawGroundRuneTex(): THREE.CanvasTexture {
  return makeTex(256, 256, (ctx) => {
    const cx = 128;
    const cy = 128;
    const glow = ctx.createRadialGradient(cx, cy, 42, cx, cy, 120);
    glow.addColorStop(0, 'rgba(250, 204, 21, 0.08)');
    glow.addColorStop(0.7, 'rgba(250, 204, 21, 0.36)');
    glow.addColorStop(0.88, 'rgba(254, 240, 138, 0.85)');
    glow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.92)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 102, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Gotik rün çentikleri
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80);
      ctx.lineTo(cx + Math.cos(a) * 102, cy + Math.sin(a) * 102);
      ctx.stroke();
    }
  });
}

function drawDizzyStarTex(): THREE.CanvasTexture {
  return makeTex(128, 128, (ctx) => {
    const cx = 64;
    const cy = 64;
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 48 : 21;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
}

export interface BlackKnightRenderState {
  x: number;
  y: number;
  hopY: number;
  animState: KnightAnimState;
  animTime: number;
  charge: number; // 0..1
  swingProgress: number; // 0..1
  dt: number;
}

/**
 * İri, heybetli, tam eklemli (2 kemikli bacaklar, dirsekli kollar, 2 parçalı dalgalanan pelerin,
 * 3 yüz ifadeli miğfer ve 6 değiştirilebilir dev mağaza silahı) Kara Şövalye sınıfı.
 *
 * Tüm eklemler kesinlikle 1:1 UNIFORM ölçekte çalışır; şarj veya tam güçte asla esneme/bozulma olmaz.
 */
export class BlackKnight {
  public readonly root = new THREE.Group();
  private readonly shadow: THREE.Mesh;

  // Ana heybetli karakter grubu (büyük 1.32x juggernaut ölçeği)
  private readonly knightGroup = new THREE.Group();
  private readonly bodyGroup = new THREE.Group();
  private readonly capeUpper = new THREE.Group();
  private readonly capeLower = new THREE.Group();

  // 2 kemikli (kalça + diz) gerçek koşu bacakları
  private readonly backHip = new THREE.Group();
  private readonly backKnee = new THREE.Group();
  private readonly frontHip = new THREE.Group();
  private readonly frontKnee = new THREE.Group();

  // Baş & dalgalanan tüy
  private readonly headGroup = new THREE.Group();
  private readonly headMesh: THREE.Mesh;
  private readonly headTextures: Record<KnightFaceMood, THREE.CanvasTexture>;
  private readonly plumePivot = new THREE.Group();

  // 2 kemikli (omuz + dirsek) kollar + silah
  private readonly backShoulder = new THREE.Group();
  private readonly backElbow = new THREE.Group();
  private readonly frontShoulder = new THREE.Group();
  private readonly frontElbow = new THREE.Group();
  private readonly weaponPivot = new THREE.Group();
  private readonly weaponMesh: THREE.Mesh;
  private readonly weaponTextures: Record<WeaponId, THREE.CanvasTexture>;

  // Eklemli pembe domuz dönüşümü
  private readonly pigGroup = new THREE.Group();
  private readonly pigLegs: THREE.Group[] = [];

  // Güç aurası, tam şarj halkası, zemin rün çemberi, çift katmanlı vuruş yayı ve sersemlik yıldızları
  private readonly powerAura: THREE.Mesh;
  private readonly fullPowerRing: THREE.Mesh;
  private readonly chargeRune: THREE.Mesh;
  private readonly slashArc: THREE.Mesh;
  private readonly slashCore: THREE.Mesh;
  private readonly dizzyGroup = new THREE.Group();

  private readonly ownedTextures: THREE.Texture[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly ownedGeometries: THREE.BufferGeometry[] = [];

  private activeWeapon: WeaponId;
  private currentMood: KnightFaceMood = 'normal';
  private knightPartMaterials: THREE.MeshBasicMaterial[] = [];
  private shadowBaseOpacity = 1;
  private cinematicBrightness = 1;

  constructor(shadowMesh: THREE.Mesh, initialWeapon: WeaponId) {
    this.shadow = shadowMesh;
    this.activeWeapon = initialWeapon;
    this.root.add(this.shadow);

    const trackTex = <T extends THREE.Texture>(t: T): T => {
      this.ownedTextures.push(t);
      return t;
    };

    // 1. Güç Aurası (arkada pürüzsüz altın parıltı)
    const auraTex = trackTex(drawSmoothAuraTex());
    const auraGeo = new THREE.PlaneGeometry(4.6, 4.6);
    const auraMat = new THREE.MeshBasicMaterial({
      map: auraTex,
      color: 0xfde047,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ownedGeometries.push(auraGeo);
    this.ownedMaterials.push(auraMat);
    this.powerAura = new THREE.Mesh(auraGeo, auraMat);
    this.powerAura.position.set(0.05, 1.85, -0.35);
    this.powerAura.renderOrder = 2;
    this.powerAura.visible = false;
    this.root.add(this.powerAura);

    // 2. Tam Şarj (%100) Enerji Halkası
    const ringTex = trackTex(drawPowerRingTex());
    const ringGeo = new THREE.PlaneGeometry(3.9, 3.9);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ownedGeometries.push(ringGeo);
    this.ownedMaterials.push(ringMat);
    this.fullPowerRing = new THREE.Mesh(ringGeo, ringMat);
    this.fullPowerRing.position.set(0.05, 1.85, -0.3);
    this.fullPowerRing.renderOrder = 3;
    this.fullPowerRing.visible = false;
    this.root.add(this.fullPowerRing);

    // 2b. Şarj Sırasında Ayakların Altında Dönen Gotik Güç Rünü
    const runeTex = trackTex(drawGroundRuneTex());
    const runeGeo = new THREE.PlaneGeometry(3.15, 1.35);
    const runeMat = new THREE.MeshBasicMaterial({
      map: runeTex,
      color: 0xfde047,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ownedGeometries.push(runeGeo);
    this.ownedMaterials.push(runeMat);
    this.chargeRune = new THREE.Mesh(runeGeo, runeMat);
    this.chargeRune.rotation.x = -Math.PI / 2;
    this.chargeRune.position.set(0.02, 0.05, 0);
    this.chargeRune.renderOrder = 2;
    this.chargeRune.visible = false;
    this.root.add(this.chargeRune);

    // 3. Heybetli Dev Kara Şövalye İskeleti (1.30x iri Juggernaut oranı -> ~3.55 birim boy!)
    this.knightGroup.scale.setScalar(1.3);
    this.root.add(this.knightGroup);

    // Kalça/gövde merkezi yerden 1.24 birim yukarıda (bacaklar tam zemine basar)
    this.bodyGroup.position.set(0, 1.24, 0);
    this.knightGroup.add(this.bodyGroup);

    // 3a. 2 Parçalı Dalgalanan Pelerin
    this.capeUpper.position.set(-0.4, 0.56, -0.24);
    const capeUpMesh = makePartMesh(
      trackTex(drawCapeUpperTex()),
      1.32,
      1.32,
      -0.44,
      -0.48,
      4,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.capeUpper.add(capeUpMesh);

    this.capeLower.position.set(-0.66, -0.74, -0.02);
    const capeLoMesh = makePartMesh(
      trackTex(drawCapeLowerTex()),
      1.26,
      1.02,
      -0.36,
      -0.38,
      4,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.capeLower.add(capeLoMesh);
    this.capeUpper.add(this.capeLower);
    this.bodyGroup.add(this.capeUpper);

    // 3b. Arka Kol (omuz + dirsek)
    this.backShoulder.position.set(0.32, 0.44, -0.18);
    const backUpArm = makePartMesh(
      trackTex(drawUpperArmTex(false)),
      0.98,
      0.96,
      0,
      -0.14,
      5,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.backShoulder.add(backUpArm);

    this.backElbow.position.set(0.02, -0.44, -0.01);
    const backForearm = makePartMesh(
      trackTex(drawForearmTex(false)),
      0.66,
      0.76,
      0,
      -0.28,
      5,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.backElbow.add(backForearm);

    // Arka kola monte perçinli demir ve altın süslemeli gotik şövalye kalkanı
    const shieldMesh = makePartMesh(
      trackTex(drawShieldTex()),
      1.18,
      1.32,
      0.16,
      -0.36,
      6,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    shieldMesh.position.set(0, 0, 0.04);
    this.backElbow.add(shieldMesh);

    this.backShoulder.add(this.backElbow);
    this.bodyGroup.add(this.backShoulder);

    // 3c. Arka Bacak (kalça -> diz -> çizme)
    this.backHip.position.set(-0.18, -0.34, -0.14);
    const backThigh = makePartMesh(
      trackTex(drawThighTex(false)),
      0.62,
      0.72,
      0,
      -0.26,
      6,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.backHip.add(backThigh);

    this.backKnee.position.set(0.02, -0.46, 0.01);
    const backShin = makePartMesh(
      trackTex(drawShinBootTex(false)),
      0.86,
      0.88,
      0.16,
      -0.32,
      6,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.backKnee.add(backShin);
    this.backHip.add(this.backKnee);
    this.bodyGroup.add(this.backHip);

    // 3d. Ön Bacak (kalça -> diz -> çizme)
    this.frontHip.position.set(0.16, -0.34, -0.06);
    const frontThigh = makePartMesh(
      trackTex(drawThighTex(true)),
      0.64,
      0.74,
      0,
      -0.26,
      7,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.frontHip.add(frontThigh);

    this.frontKnee.position.set(0.02, -0.46, 0.02);
    const frontShin = makePartMesh(
      trackTex(drawShinBootTex(true)),
      0.88,
      0.9,
      0.16,
      -0.32,
      7,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.frontKnee.add(frontShin);
    this.frontHip.add(this.frontKnee);
    this.bodyGroup.add(this.frontHip);

    // 3e. Devasa Göğüs Zırhı (Cuirass)
    const torsoMesh = makePartMesh(
      trackTex(drawTorsoTex()),
      1.54,
      1.62,
      0.04,
      0.04,
      8,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    torsoMesh.position.set(0, 0, 0.02);
    this.bodyGroup.add(torsoMesh);

    // 3f. Heybetli Miğfer, 3 Yüz İfadesi ve Dalgalanan Kırmızı Tüy
    this.headGroup.position.set(0.06, 0.64, 0.08);
    this.bodyGroup.add(this.headGroup);

    this.headTextures = {
      normal: trackTex(drawHeadTex('normal')),
      fierce: trackTex(drawHeadTex('fierce')),
      dizzy: trackTex(drawHeadTex('dizzy')),
    };
    this.headMesh = makePartMesh(
      this.headTextures.normal,
      1.36,
      1.3,
      0.04,
      0.34,
      9,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.headGroup.add(this.headMesh);

    this.plumePivot.position.set(-0.04, 0.86, -0.02);
    const plumeMesh = makePartMesh(
      trackTex(drawPlumeTex()),
      1.18,
      0.94,
      -0.46,
      0.14,
      8,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.plumePivot.add(plumeMesh);
    this.headGroup.add(this.plumePivot);

    // 3g. Ön Silah Kolu (dev dikenli omuzluk -> dirsek/demir eldiven -> dev silah)
    this.frontShoulder.position.set(-0.3, 0.44, 0.16);
    this.bodyGroup.add(this.frontShoulder);

    const frontUpArm = makePartMesh(
      trackTex(drawUpperArmTex(true)),
      1.08,
      1.04,
      0,
      -0.14,
      11,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.frontShoulder.add(frontUpArm);

    this.frontElbow.position.set(0.02, -0.46, 0.02);
    this.frontShoulder.add(this.frontElbow);

    // Silah doğrudan zırhlı eldivenin içine monte edilir
    this.weaponPivot.position.set(0.02, -0.44, -0.02);
    this.frontElbow.add(this.weaponPivot);

    this.weaponTextures = {
      club: trackTex(drawWeaponTex('club')),
      mallet: trackTex(drawWeaponTex('mallet')),
      hammer: trackTex(drawWeaponTex('hammer')),
      axe: trackTex(drawWeaponTex('axe')),
      excalibur: trackTex(drawWeaponTex('excalibur')),
      mace: trackTex(drawWeaponTex('mace')),
    };
    this.weaponMesh = makePartMesh(
      this.weaponTextures[initialWeapon],
      1.46,
      2.28,
      0,
      0.86,
      10,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.weaponPivot.add(this.weaponMesh);

    // Ön kol & eldiven silah sapının önünde durur (gerçekçi kavrama!)
    const frontForearm = makePartMesh(
      trackTex(drawForearmTex(true)),
      0.7,
      0.8,
      0,
      -0.28,
      12,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    frontForearm.position.set(0, 0, 0.03);
    this.frontElbow.add(frontForearm);

    // 4. Çift Katmanlı Parlayan Vuruş İz Yay Efekti (dış enerji + beyaz keskin çekirdek)
    const slashTex = trackTex(drawSlashArcTex());
    const slashGeo = new THREE.PlaneGeometry(4.5, 4.5);
    slashGeo.translate(0.78, 0, 0);
    const slashMat = new THREE.MeshBasicMaterial({
      map: slashTex,
      color: 0xfffde7,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ownedGeometries.push(slashGeo);
    this.ownedMaterials.push(slashMat);
    this.slashArc = new THREE.Mesh(slashGeo, slashMat);
    this.slashArc.position.set(0.62, 1.78, 0.35);
    this.slashArc.renderOrder = 14;
    this.slashArc.visible = false;

    const coreTex = trackTex(drawSlashCoreTex());
    const coreGeo = new THREE.PlaneGeometry(4.65, 4.65);
    coreGeo.translate(0.8, 0, 0.02);
    const coreMat = new THREE.MeshBasicMaterial({
      map: coreTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.ownedGeometries.push(coreGeo);
    this.ownedMaterials.push(coreMat);
    this.slashCore = new THREE.Mesh(coreGeo, coreMat);
    this.slashCore.renderOrder = 15;
    this.slashArc.add(this.slashCore);
    this.root.add(this.slashArc);

    // 5. Boşa Sallama Sersemlik Yıldızları (miğferin üzerinde döner)
    const starTex = trackTex(drawDizzyStarTex());
    const starGeo = new THREE.PlaneGeometry(0.46, 0.46);
    const starMat = new THREE.MeshBasicMaterial({
      map: starTex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.ownedGeometries.push(starGeo);
    this.ownedMaterials.push(starMat);
    this.dizzyGroup.position.set(0.08, 3.65, 0.35);
    this.dizzyGroup.visible = false;
    for (let i = 0; i < 3; i++) {
      const star = new THREE.Mesh(starGeo, starMat);
      const angle = (i / 3) * Math.PI * 2;
      star.position.set(Math.cos(angle) * 0.85, Math.sin(angle) * 0.16, Math.sin(angle) * 0.25);
      star.renderOrder = 15;
      this.dizzyGroup.add(star);
    }
    this.root.add(this.dizzyGroup);

    // 6. Eklemli 4 Bacaklı Pembe Domuz Dönüşümü (Cadı Laneti)
    this.pigGroup.visible = false;
    this.root.add(this.pigGroup);

    const pigBodyMesh = makePartMesh(
      trackTex(drawPigBodyTex()),
      2.28,
      1.9,
      0.08,
      1.04,
      8,
      this.ownedGeometries,
      this.ownedMaterials,
    );
    this.pigGroup.add(pigBodyMesh);

    const pigLegTex = trackTex(drawPigLegTex());
    const legCoords: [number, number, number, number][] = [
      [-0.44, 0.52, -0.08, 6], // arka sol
      [0.42, 0.52, -0.08, 6], // ön sol
      [-0.24, 0.52, 0.08, 9], // arka sağ
      [0.6, 0.52, 0.08, 9], // ön sağ
    ];
    for (const [lx, ly, lz, order] of legCoords) {
      const legPivot = new THREE.Group();
      legPivot.position.set(lx, ly, lz);
      const legMesh = makePartMesh(
        pigLegTex,
        0.38,
        0.56,
        0,
        -0.22,
        order,
        this.ownedGeometries,
        this.ownedMaterials,
      );
      legPivot.add(legMesh);
      this.pigGroup.add(legPivot);
      this.pigLegs.push(legPivot);
    }

    this.knightGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshBasicMaterial) {
        this.knightPartMaterials.push(obj.material);
      }
    });
    const shadowMat = this.shadow.material as THREE.MeshBasicMaterial;
    if (shadowMat && typeof shadowMat.opacity === 'number') {
      this.shadowBaseOpacity = shadowMat.opacity;
    }

    this.setWeapon(initialWeapon);
  }

  private setMood(mood: KnightFaceMood): void {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    const mat = this.headMesh.material as THREE.MeshBasicMaterial;
    mat.map = this.headTextures[mood];
    mat.needsUpdate = true;
  }

  public setWeapon(weapon: WeaponId): void {
    this.activeWeapon = weapon;
    const mat = this.weaponMesh.material as THREE.MeshBasicMaterial;
    mat.map = this.weaponTextures[weapon];
    mat.needsUpdate = true;

    const fx = WEAPON_FX_COLOR[weapon];
    (this.powerAura.material as THREE.MeshBasicMaterial).color.setHex(fx.aura);
    (this.chargeRune.material as THREE.MeshBasicMaterial).color.setHex(fx.aura);
    (this.slashArc.material as THREE.MeshBasicMaterial).color.setHex(fx.slash);
  }

  public getWeapon(): WeaponId {
    return this.activeWeapon;
  }

  public setCinematicBrightness(factor: number): void {
    const clamped = Math.max(0, Math.min(1, factor));
    if (Math.abs(clamped - this.cinematicBrightness) < 0.0005) return;
    this.cinematicBrightness = clamped;
    for (let i = 0; i < this.knightPartMaterials.length; i++) {
      this.knightPartMaterials[i].color.setScalar(clamped);
    }
    const shadowMat = this.shadow.material as THREE.MeshBasicMaterial;
    if (shadowMat && typeof shadowMat.opacity === 'number') {
      shadowMat.opacity = this.shadowBaseOpacity * clamped;
    }
  }

  public resetPose(x: number, y: number): void {
    this.root.position.set(x, y, 0);
    this.root.rotation.set(0, 0, 0);
    this.knightGroup.visible = true;
    this.pigGroup.visible = false;
    this.powerAura.visible = false;
    this.fullPowerRing.visible = false;
    this.chargeRune.visible = false;
    this.slashArc.visible = false;
    this.dizzyGroup.visible = false;
    this.setCinematicBrightness(1);
    this.setMood('normal');
  }

  public update(state: BlackKnightRenderState): void {
    const { x, y, hopY, animState, animTime, charge, swingProgress, dt } = state;

    this.root.position.set(x, y, 0);
    this.root.rotation.set(0, 0, 0);

    // Zemin gölgesi
    this.shadow.position.y = -hopY + 0.03;
    this.shadow.scale.setScalar(Math.max(0.48, 1 - hopY * 0.12));

    // Efektleri sıfırla
    this.powerAura.visible = false;
    this.fullPowerRing.visible = false;
    this.chargeRune.visible = false;
    this.slashArc.visible = false;
    this.dizzyGroup.visible = false;

    // 1. DOMUZ LANETİ (gerçek 4 bacaklı tırıs koşusu!)
    if (animState === 'pig') {
      this.knightGroup.visible = false;
      this.pigGroup.visible = true;
      const t = animTime * 20;
      const trot = Math.sin(t);
      this.pigGroup.position.y = Math.abs(trot) * 0.18;
      this.pigGroup.rotation.z = trot * 0.09;
      this.pigLegs[0].rotation.z = Math.sin(t) * 0.72;
      this.pigLegs[1].rotation.z = -Math.sin(t) * 0.72;
      this.pigLegs[2].rotation.z = -Math.sin(t + 0.5) * 0.72;
      this.pigLegs[3].rotation.z = Math.sin(t + 0.5) * 0.72;
      return;
    }

    // Şövalye görünür, kesinlikle 1:1 UNIFORM ölçek (sıfır yamulma/esneme!)
    this.pigGroup.visible = false;
    this.knightGroup.visible = true;
    this.bodyGroup.scale.setScalar(1);
    this.headGroup.rotation.set(0, 0, 0);

    // Gerçek 2 kemikli koşu döngüsü hesaplayıcısı (kalça + diz bükülmesi!)
    const applyRunLegs = (freq: number, strideAmp: number) => {
      const phase = animTime * freq;
      const frontSwing = Math.sin(phase);
      const backSwing = Math.sin(phase + Math.PI);

      // Kalça ileri-geri salınımı
      this.frontHip.rotation.z = frontSwing * strideAmp;
      this.backHip.rotation.z = backSwing * strideAmp;

      // Diz bükülmesi: bacak arkadan öne gelirken diz doğal olarak geriye kırılır (- açı)
      const frontLift = Math.max(0, Math.cos(phase));
      const backLift = Math.max(0, Math.cos(phase + Math.PI));
      this.frontKnee.rotation.z = -0.14 - frontLift * 0.85;
      this.backKnee.rotation.z = -0.14 - backLift * 0.85;

      // Her adımda ağır zırhlı gövde yaylanması
      return Math.abs(Math.sin(phase));
    };

    // Pelerin ve tüy rüzgar dalgalanması (çift harmonikli akıcı kumaş hareketi)
    const capeWave = Math.sin(animTime * 11.5) + Math.sin(animTime * 23.0) * 0.28;
    const capeTrail = Math.sin(animTime * 11.5 - 1.1) + Math.cos(animTime * 22.0) * 0.34;
    this.capeUpper.rotation.z = 0.08 + capeWave * 0.14;
    this.capeLower.rotation.z = 0.06 + capeTrail * 0.22;
    this.plumePivot.rotation.z =
      Math.sin(animTime * 12.5 - 0.5) * 0.16 + Math.sin(animTime * 25.0) * 0.05;

    // 2. KOŞMA / YÜRÜME ANİMASYONU (RUN)
    if (animState === 'run') {
      this.setMood('normal');
      const bounce = applyRunLegs(11.8, 0.68);
      const stride = Math.sin(animTime * 11.8);

      this.bodyGroup.position.y = 1.24 + bounce * 0.13;
      this.bodyGroup.rotation.z = -0.09 + stride * 0.03;
      this.headGroup.rotation.z = 0.06 - bounce * 0.04;

      // Arka kol karşı adımla güçlü biçimde sallanır
      this.backShoulder.rotation.z = -stride * 0.55;
      this.backElbow.rotation.z = 0.42 + Math.max(0, -stride) * 0.28;

      // Ön kol ve silah ağır savaşçı yürüyüşüyle sallanır
      this.frontShoulder.rotation.z = 0.26 + stride * 0.24;
      this.frontElbow.rotation.z = 0.52 + stride * 0.14;
      this.weaponPivot.rotation.z = -0.78 + stride * 0.12;
      return;
    }

    // 3. GÜÇ TOPLAMA / ŞARJ ANİMASYONU (CHARGE — sıfır bozulma, güçlü geriye kurulum!)
    if (animState === 'charge') {
      this.setMood('fierce');
      const clamped = Math.max(0, Math.min(1, charge));
      const eased = 1 - Math.pow(1 - clamped, 2);
      const isFull = clamped >= 0.96;
      const breathe = isFull ? Math.sin(animTime * 7.5) * 0.035 : 0;

      // Koşu adımları şarj sırasında da kararlı savaş yürüyüşüyle devam eder
      const bounce = applyRunLegs(11.2, 0.58);

      this.bodyGroup.position.y = 1.24 + bounce * 0.1;
      // Gövde en fazla ~9 derece geriye kurulur (asla yamulmaz)
      this.bodyGroup.rotation.z = -0.04 + eased * 0.17;
      // Baş hedefe kilitli kalır
      this.headGroup.rotation.z = -eased * 0.12;

      // Arka kol denge için öne açılır
      this.backShoulder.rotation.z = 0.35 + eased * 0.42;
      this.backElbow.rotation.z = 0.38;

      // Ön silah kolu ve dirsek omzun üstüne heybetle kalkar
      this.frontShoulder.rotation.z = 0.32 + eased * 1.18 + breathe;
      this.frontElbow.rotation.z = 0.45 - eased * 0.24;
      this.weaponPivot.rotation.z = -0.68 + eased * 0.72;

      // Pelerin geriye doğru dalgalanır
      this.capeUpper.rotation.z = 0.24 + capeWave * 0.16;
      this.capeLower.rotation.z = 0.2 + capeTrail * 0.24;

      // Altın güç aurası ve ayak altı gotik rün çemberi %16'dan itibaren ışıldar
      if (clamped > 0.16) {
        const auraRatio = (clamped - 0.16) / 0.84;
        this.powerAura.visible = true;
        this.powerAura.position.set(-0.08, 1.9 + bounce * 0.1, -0.35);
        this.powerAura.rotation.z -= dt * (isFull ? 2.4 : 1.1);
        const auraScale =
          (0.75 + auraRatio * 0.48) * (isFull ? 1 + Math.sin(animTime * 8) * 0.06 : 1);
        this.powerAura.scale.setScalar(auraScale);
        (this.powerAura.material as THREE.MeshBasicMaterial).opacity = Math.min(
          0.92,
          auraRatio * (isFull ? 0.92 : 0.58),
        );

        this.chargeRune.visible = true;
        this.chargeRune.position.set(0.05, -hopY + 0.05, 0);
        this.chargeRune.rotation.z += dt * (isFull ? 2.6 : 1.3);
        const runeScale = 0.72 + auraRatio * 0.42 + (isFull ? Math.sin(animTime * 9) * 0.05 : 0);
        this.chargeRune.scale.setScalar(runeScale);
        (this.chargeRune.material as THREE.MeshBasicMaterial).opacity = Math.min(
          0.88,
          auraRatio * (isFull ? 0.88 : 0.52),
        );
      }

      // %100 dolunca ritmik enerji halkası
      if (isFull) {
        const pulse = (animTime * 1.9) % 1;
        this.fullPowerRing.visible = true;
        this.fullPowerRing.position.set(-0.08, 1.9 + bounce * 0.1, -0.3);
        this.fullPowerRing.scale.setScalar(0.8 + pulse * 0.78);
        (this.fullPowerRing.material as THREE.MeshBasicMaterial).opacity = (1 - pulse) * 0.74;
      }
      return;
    }

    // 4. ZIMBA GİBİ HAVADA İLERİ VURUŞ ANİMASYONU (SMASH)
    if (animState === 'smash') {
      this.setMood('fierce');
      const p = Math.max(0, Math.min(1, swingProgress));

      // Havada güçlü zıplama bacak duruşu
      this.frontHip.rotation.z = 0.62 - p * 0.35;
      this.frontKnee.rotation.z = -0.82 + p * 0.35;
      this.backHip.rotation.z = -0.58 + p * 0.28;
      this.backKnee.rotation.z = -0.68 + p * 0.3;

      this.bodyGroup.position.y = 1.24;

      if (p < 0.16) {
        // Kısa sıçrama gerilmesi
        const k = p / 0.16;
        this.bodyGroup.rotation.z = 0.14 + k * 0.08;
        this.frontShoulder.rotation.z = 1.48 + k * 0.18;
        this.frontElbow.rotation.z = 0.22;
        this.weaponPivot.rotation.z = 0.06;
        this.backShoulder.rotation.z = 0.65;
        this.backElbow.rotation.z = 0.35;
      } else {
        // Patlayıcı aşağı indirme (cleave) ve takip
        const t = Math.min(1, (p - 0.16) / 0.42);
        const easedSmash = 1 - Math.pow(1 - t, 3);

        this.bodyGroup.rotation.z = 0.22 - easedSmash * 0.46;
        this.headGroup.rotation.z = easedSmash * 0.16;

        // Silah baş üstünden yere doğru 150 derece iniyor!
        this.frontShoulder.rotation.z = 1.66 - easedSmash * 2.52;
        this.frontElbow.rotation.z = 0.22 + easedSmash * 0.28;
        this.weaponPivot.rotation.z = 0.06 - easedSmash * 1.18;

        // Arka kol denge için geriye savrulur
        this.backShoulder.rotation.z = 0.65 - easedSmash * 1.35;
        this.backElbow.rotation.z = 0.3;

        // Pelerin havalanır
        this.capeUpper.rotation.z = 0.42;
        this.capeLower.rotation.z = 0.36;

        // Dev çift katmanlı parlayan vuruş yayı efekti
        const showSlash = p >= 0.16 && p <= 0.74;
        this.slashArc.visible = showSlash;
        if (showSlash) {
          const slashAlpha = Math.sin(Math.min(1, (p - 0.16) / 0.58) * Math.PI);
          this.slashArc.rotation.z = 1.08 - easedSmash * 1.92;
          this.slashArc.scale.setScalar(0.92 + slashAlpha * 0.34);
          (this.slashArc.material as THREE.MeshBasicMaterial).opacity = 0.96 * slashAlpha;
          (this.slashCore.material as THREE.MeshBasicMaterial).opacity = Math.min(1, slashAlpha * 1.2);
        }
      }
      return;
    }

    // 5. SERSEMLEME ANİMASYONU (DIZZY — boşa sallama cezası)
    this.setMood('dizzy');
    const bounce = applyRunLegs(8.2, 0.38);
    const wob = Math.sin(animTime * 11);

    this.bodyGroup.position.y = 1.2 + bounce * 0.06;
    this.bodyGroup.rotation.z = wob * 0.18;
    this.headGroup.rotation.z = -wob * 0.26;
    this.plumePivot.rotation.z = -0.35 + wob * 0.16;

    // Kollar ve silah halsizce aşağı sarkar
    this.backShoulder.rotation.z = -0.25 + wob * 0.2;
    this.backElbow.rotation.z = 0.15;
    this.frontShoulder.rotation.z = -0.35 - wob * 0.16;
    this.frontElbow.rotation.z = 0.12;
    this.weaponPivot.rotation.z = -1.28;

    // Miğferin üstünde dönen 3 yıldız
    this.dizzyGroup.visible = true;
    this.dizzyGroup.rotation.y += dt * 6.8;
  }

  public dispose(): void {
    this.ownedGeometries.forEach((g) => g.dispose());
    this.ownedMaterials.forEach((m) => m.dispose());
    this.ownedTextures.forEach((t) => t.dispose());
  }
}
