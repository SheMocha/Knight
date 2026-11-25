import * as THREE from 'three';

function finalizeTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, anisotropy);
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

export function createSkyTexture(
  top: string,
  mid: string,
  bottom: string,
  sunColor: string,
  hasMoon: boolean | undefined,
  isInterior: boolean | undefined,
  anisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, top);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (isInterior) {
    // Grand royal hall gothic arched windows & vaulted stone backdrop
    ctx.strokeStyle = 'rgba(11, 22, 44, 0.55)';
    ctx.lineWidth = 10;
    for (let x = 90; x < canvas.width; x += 220) {
      ctx.fillStyle = 'rgba(120, 175, 255, 0.16)';
      ctx.beginPath();
      ctx.moveTo(x - 45, 360);
      ctx.lineTo(x - 45, 130);
      ctx.quadraticCurveTo(x, 45, x + 45, 130);
      ctx.lineTo(x + 45, 360);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mullion crossbars
      ctx.strokeStyle = 'rgba(15, 28, 54, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 78);
      ctx.lineTo(x, 360);
      ctx.moveTo(x - 45, 190);
      ctx.lineTo(x + 45, 190);
      ctx.moveTo(x - 45, 275);
      ctx.lineTo(x + 45, 275);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(11, 22, 44, 0.55)';
      ctx.lineWidth = 10;
    }
    return finalizeTexture(canvas, anisotropy);
  }

  // Radiant cartoon sun or harvest moon
  const sunX = 760;
  const sunY = 128;
  const sunRad = hasMoon ? 58 : 72;

  const halo = ctx.createRadialGradient(sunX, sunY, sunRad * 0.5, sunX, sunY, sunRad * 2.5);
  halo.addColorStop(0, sunColor);
  halo.addColorStop(0.38, hasMoon ? 'rgba(235,245,195,0.45)' : 'rgba(255,248,140,0.55)');
  halo.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRad * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 5;
  ctx.stroke();

  if (hasMoon) {
    ctx.fillStyle = 'rgba(145, 165, 125, 0.28)';
    ctx.beginPath();
    ctx.arc(sunX - 18, sunY - 12, 13, 0, Math.PI * 2);
    ctx.arc(sunX + 18, sunY + 14, 17, 0, Math.PI * 2);
    ctx.arc(sunX + 6, sunY - 22, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft 2005-Flash-style layered horizon clouds
  const cloudColor = hasMoon ? 'rgba(130, 175, 170, 0.25)' : 'rgba(255, 255, 255, 0.42)';
  ctx.fillStyle = cloudColor;
  const puffs = [
    [130, 310, 95],
    [250, 295, 115],
    [390, 318, 92],
    [540, 290, 120],
    [680, 316, 105],
    [840, 292, 122],
    [970, 312, 95],
  ];
  ctx.beginPath();
  for (const [cx, cy, cr] of puffs) {
    ctx.moveTo(cx + cr, cy);
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  }
  ctx.fill();

  // Floating upper clouds
  ctx.fillStyle = hasMoon ? 'rgba(155, 195, 195, 0.22)' : 'rgba(255, 255, 255, 0.65)';
  const drawCloud = (cx: number, cy: number, s: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 24 * s, 0, Math.PI * 2);
    ctx.arc(cx + 26 * s, cy - 8 * s, 30 * s, 0, Math.PI * 2);
    ctx.arc(cx + 56 * s, cy, 22 * s, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCloud(140, 110, 1.15);
  drawCloud(420, 82, 0.9);
  drawCloud(860, 180, 1.0);

  return finalizeTexture(canvas, anisotropy);
}

export function createCobbleRoadTexture(
  tint: string,
  isCarpet: boolean | undefined,
  anisotropy: number,
  repeatX = 16,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  if (isCarpet) {
    // Royal crimson throne carpet with ornate golden border
    ctx.fillStyle = '#8b1420';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 26, 512, 204);

    // Gold trim stripes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 14, 512, 14);
    ctx.fillRect(0, 228, 512, 14);

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 14, 512, 14);
    ctx.strokeRect(0, 228, 512, 14);

    // Subtle royal diamond weave
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
    ctx.lineWidth = 3;
    for (let x = 0; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x + 32, 60);
      ctx.lineTo(x + 56, 128);
      ctx.lineTo(x + 32, 196);
      ctx.lineTo(x + 8, 128);
      ctx.closePath();
      ctx.stroke();
    }
    return finalizeTexture(canvas, anisotropy, repeatX, 1);
  }

  // Cartoon medieval cobblestone street with curb
  ctx.fillStyle = '#5c5852';
  ctx.fillRect(0, 0, 512, 256);

  // Top curb strip
  ctx.fillStyle = '#d4d0c8';
  ctx.fillRect(0, 0, 512, 34);
  ctx.strokeStyle = '#231f20';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 34);
  ctx.lineTo(512, 34);
  ctx.stroke();

  for (let x = 0; x < 512; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 34);
    ctx.stroke();
  }

  // Cobble blocks
  const rows = 4;
  const rowH = (256 - 34) / rows;
  for (let r = 0; r < rows; r++) {
    const y = 34 + r * rowH;
    const offset = (r % 2) * 42;
    for (let x = -42; x < 540; x += 84) {
      const shade = ((r * 7 + x) % 3) * 10 - 10;
      ctx.fillStyle = tint;
      ctx.fillRect(x + offset + 3, y + 3, 78, rowH - 6);
      ctx.fillStyle = shade > 0 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(x + offset + 3, y + 3, 78, rowH - 6);
      ctx.strokeStyle = '#262324';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + offset + 3, y + 3, 78, rowH - 6);
    }
  }

  return finalizeTexture(canvas, anisotropy, repeatX, 1);
}

export function createWoodPlankTexture(
  baseHex: string,
  darkHex: string,
  anisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal cartoon wood planks
  for (let y = 0; y < 256; y += 64) {
    ctx.fillStyle = (y / 64) % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, 256, 64);

    // Subtle grain streaks
    ctx.strokeStyle = darkHex;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, y + 22);
    ctx.quadraticCurveTo(128, y + 14, 240, y + 26);
    ctx.moveTo(24, y + 46);
    ctx.quadraticCurveTo(150, y + 54, 232, y + 42);
    ctx.stroke();

    // Bold cartoon plank seam
    ctx.strokeStyle = '#1f1612';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Border frame
  ctx.strokeStyle = '#1f1612';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);

  return finalizeTexture(canvas, anisotropy);
}

export function createHalfTimberTexture(
  plasterHex: string,
  timberHex: string,
  anisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = plasterHex;
  ctx.fillRect(0, 0, 256, 256);

  // Timber frame beams
  ctx.fillStyle = timberHex;
  ctx.fillRect(0, 0, 256, 22);
  ctx.fillRect(0, 234, 256, 22);
  ctx.fillRect(0, 118, 256, 18);
  ctx.fillRect(0, 0, 20, 256);
  ctx.fillRect(236, 0, 20, 256);
  ctx.fillRect(118, 0, 18, 256);

  // Diagonal timber braces
  ctx.strokeStyle = timberHex;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(16, 126);
  ctx.lineTo(124, 18);
  ctx.moveTo(240, 126);
  ctx.lineTo(132, 18);
  ctx.stroke();

  // Warm cozy cartoon window
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(148, 42, 62, 58);
  ctx.strokeStyle = '#291c14';
  ctx.lineWidth = 6;
  ctx.strokeRect(148, 42, 62, 58);
  ctx.beginPath();
  ctx.moveTo(179, 42);
  ctx.lineTo(179, 100);
  ctx.moveTo(148, 71);
  ctx.lineTo(210, 71);
  ctx.stroke();

  return finalizeTexture(canvas, anisotropy);
}

export function createCastleStoneTexture(
  baseHex: string,
  anisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  for (let row = 0; row < 4; row++) {
    const y = row * 64;
    const offset = (row % 2) * 32;
    for (let x = -32; x < 288; x += 64) {
      ctx.fillStyle = (row + x) % 3 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x + offset + 3, y + 3, 58, 58);
      ctx.strokeStyle = 'rgba(15, 20, 30, 0.55)';
      ctx.lineWidth = 4;
      ctx.strokeRect(x + offset + 2, y + 2, 60, 60);
    }
  }

  return finalizeTexture(canvas, anisotropy);
}

export function createAwningTexture(
  stripeA: string,
  stripeB: string,
  anisotropy: number,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const stripeW = 32;
  for (let x = 0; x < 256; x += stripeW) {
    ctx.fillStyle = (x / stripeW) % 2 === 0 ? stripeA : stripeB;
    ctx.fillRect(x, 0, stripeW, 128);
  }
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 5;
  ctx.strokeRect(2, 2, 252, 124);

  return finalizeTexture(canvas, anisotropy);
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(10, 8, 12, 0.55)');
  grad.addColorStop(0.65, 'rgba(10, 8, 12, 0.25)');
  grad.addColorStop(1, 'rgba(10, 8, 12, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createCoinTexture(anisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(64, 64, 60, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 64, 68);

  return finalizeTexture(canvas, anisotropy);
}

export function createBridgeStoneWallTexture(
  theme:
    | 'village'
    | 'market'
    | 'forest'
    | 'castle'
    | 'throne'
    | 'ice'
    | 'desert'
    | 'pirate'
    | 'graveyard'
    | 'dragon',
  isInterior: boolean | undefined,
  anisotropy: number,
  repeatX = 8,
  repeatY = 2.4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const palette = isInterior
    ? {
        mortar: '#0d1220',
        stones: ['#283452', '#222d47', '#313f63', '#1e273e'],
        hi: 'rgba(186, 210, 255, 0.14)',
        moss: null as string | null,
      }
    : theme === 'ice'
      ? {
          mortar: '#0e2438',
          stones: ['#4d85ab', '#3f7399', '#619bc2', '#356285'],
          hi: 'rgba(224, 247, 255, 0.3)',
          moss: 'rgba(224, 242, 254, 0.45)',
        }
      : theme === 'desert'
        ? {
            mortar: '#2e180b',
            stones: ['#a86f3c', '#945e30', '#ba7f49', '#824f25'],
            hi: 'rgba(254, 243, 199, 0.22)',
            moss: null as string | null,
          }
        : theme === 'pirate'
          ? {
              mortar: '#14191e',
              stones: ['#5a4533', '#4b3828', '#68513d', '#3e2d20'],
              hi: 'rgba(186, 230, 253, 0.15)',
              moss: 'rgba(45, 140, 120, 0.34)',
            }
          : theme === 'graveyard'
            ? {
                mortar: '#110c1c',
                stones: ['#3e3454', '#332a47', '#4a3f63', '#29213b'],
                hi: 'rgba(216, 180, 254, 0.16)',
                moss: 'rgba(88, 128, 72, 0.3)',
              }
            : theme === 'dragon'
              ? {
                  mortar: '#1c0909',
                  stones: ['#362428', '#2a1b1f', '#452b30', '#211417'],
                  hi: 'rgba(251, 146, 60, 0.22)',
                  moss: 'rgba(239, 68, 68, 0.35)',
                }
              : theme === 'forest'
                ? {
                    mortar: '#141917',
                    stones: ['#4a534f', '#3d4642', '#57615c', '#353e3a'],
                    hi: 'rgba(220, 238, 220, 0.13)',
                    moss: 'rgba(65, 118, 58, 0.42)',
                  }
                : theme === 'castle'
                  ? {
                      mortar: '#16161c',
                      stones: ['#565864', '#484a55', '#636673', '#3f414b'],
                      hi: 'rgba(235, 240, 255, 0.13)',
                      moss: 'rgba(72, 102, 62, 0.22)',
                    }
                  : {
                      mortar: '#1c1816',
                      stones: ['#736c63', '#635c53', '#81796e', '#59524a'],
                      hi: 'rgba(255, 246, 224, 0.16)',
                      moss: 'rgba(78, 118, 56, 0.30)',
                    };

  ctx.fillStyle = palette.mortar;
  ctx.fillRect(0, 0, 512, 512);

  // Deterministic pseudo-random helper for organic medieval stone variation
  const hash = (a: number, b: number) => {
    const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const rows = 8;
  const rowH = 512 / rows;
  const widths = [96, 128, 64, 128, 96];

  for (let r = 0; r < rows; r++) {
    const y = r * rowH;
    let x = -((r * 58) % 128);
    let col = 0;
    while (x < 512) {
      const w = widths[(r * 3 + col) % widths.length];
      const pad = 3.5;
      const bx = x + pad;
      const by = y + pad;
      const bw = w - pad * 2;
      const bh = rowH - pad * 2;

      const idx = Math.floor(hash(r + 1, col + 2) * palette.stones.length);
      ctx.fillStyle = palette.stones[idx];
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 5);
      ctx.fill();

      // Top light bevel
      ctx.fillStyle = palette.hi;
      ctx.fillRect(bx + 4, by + 3, bw - 8, 6);

      // Bottom stone shadow edge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
      ctx.fillRect(bx + 4, by + bh - 8, bw - 8, 6);

      // Subtle weathered crack on selected stones
      if (hash(r + 11, col + 7) > 0.68) {
        ctx.strokeStyle = 'rgba(15, 12, 12, 0.45)';
        ctx.lineWidth = 2;
        const cx = bx + bw * (0.28 + hash(r, col) * 0.44);
        ctx.beginPath();
        ctx.moveTo(cx, by + 2);
        ctx.lineTo(cx + 6, by + bh * 0.42);
        ctx.lineTo(cx - 4, by + bh * 0.72);
        ctx.stroke();
      }

      // Subtle moss tucked in upper mortar joints for exterior themes
      if (palette.moss && r <= 2 && hash(r + 5, col + 19) > 0.52) {
        ctx.fillStyle = palette.moss;
        ctx.beginPath();
        ctx.ellipse(bx + bw * 0.45, by + 4, bw * 0.34, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bold ink outline matching game art style
      ctx.strokeStyle = palette.mortar;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 5);
      ctx.stroke();

      x += w;
      col++;
    }
  }

  // Deepening shadow gradient downward for architectural depth
  const depthGrad = ctx.createLinearGradient(0, 0, 0, 512);
  depthGrad.addColorStop(0, 'rgba(0, 0, 0, 0.36)');
  depthGrad.addColorStop(0.14, 'rgba(0, 0, 0, 0.04)');
  depthGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.16)');
  depthGrad.addColorStop(1, 'rgba(6, 7, 12, 0.58)');
  ctx.fillStyle = depthGrad;
  ctx.fillRect(0, 0, 512, 512);

  return finalizeTexture(canvas, anisotropy, repeatX, repeatY);
}

