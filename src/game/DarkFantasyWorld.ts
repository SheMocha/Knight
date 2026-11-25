import * as THREE from 'three';
import { LevelConfig, LevelTheme } from './types';

const INK = '#0a0910';

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  anisotropy = 4,
  repeatX = 1,
  repeatY = 1,
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
  tex.anisotropy = Math.max(1, anisotropy);
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function hash(n: number): number {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
}

interface ThemePalette {
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  moonCore: string;
  moonGlow: string;
  mountainFar: string;
  mountainRim: string;
  forestFar: string;
  forestMid: string;
  mistColor: string;
  rayColor: string;
  foliageDark: string;
  foliageMid: string;
  foliageHi: string;
  barkDark: string;
  barkMid: string;
  lanternGlow: string;
  fogHex: number;
}

export function getDarkFantasyPalette(theme: LevelTheme): ThemePalette {
  switch (theme) {
    case 'village':
      // Alacakaranlık karanlık fantastik orman köyü (zengin gece mavisi, sisli zümrüt ve sıcak meşale)
      return {
        skyTop: '#0b1021',
        skyMid: '#18253d',
        skyHorizon: '#3c4d5e',
        moonCore: '#f8f3d8',
        moonGlow: 'rgba(186, 220, 245, 0.35)',
        mountainFar: '#121b2d',
        mountainRim: 'rgba(148, 188, 224, 0.25)',
        forestFar: '#0f1c25',
        forestMid: '#122526',
        mistColor: 'rgba(165, 206, 215, 0.22)',
        rayColor: 'rgba(186, 225, 245, 0.16)',
        foliageDark: '#0f241f',
        foliageMid: '#1d4034',
        foliageHi: '#3d6e58',
        barkDark: '#1b1412',
        barkMid: '#3a2b24',
        lanternGlow: '#ffb347',
        fogHex: 0x162230,
      };
    case 'market':
      // Kızıl gün batımı ortaçağ pazarı (kehribar sis, koyu mor dağlar, sıcak fenerler)
      return {
        skyTop: '#140d1e',
        skyMid: '#321c2e',
        skyHorizon: '#6e3f35',
        moonCore: '#ffe2a8',
        moonGlow: 'rgba(255, 174, 96, 0.38)',
        mountainFar: '#1e1424',
        mountainRim: 'rgba(255, 168, 108, 0.28)',
        forestFar: '#1a131f',
        forestMid: '#241a21',
        mistColor: 'rgba(235, 165, 118, 0.20)',
        rayColor: 'rgba(255, 198, 130, 0.17)',
        foliageDark: '#1f1d18',
        foliageMid: '#3b3724',
        foliageHi: '#6b5a34',
        barkDark: '#1e1513',
        barkMid: '#402c22',
        lanternGlow: '#ff9d2e',
        fogHex: 0x261a24,
      };
    case 'forest':
      // Derin lanetli karanlık orman (ay ışığı yeşili, puslu gölgeler, parlak ateş böcekleri)
      return {
        skyTop: '#060c14',
        skyMid: '#0e222a',
        skyHorizon: '#204547',
        moonCore: '#e2f7eb',
        moonGlow: 'rgba(124, 228, 198, 0.34)',
        mountainFar: '#0a1820',
        mountainRim: 'rgba(110, 214, 194, 0.26)',
        forestFar: '#091a1c',
        forestMid: '#0d2624',
        mistColor: 'rgba(128, 218, 200, 0.23)',
        rayColor: 'rgba(148, 238, 216, 0.16)',
        foliageDark: '#091c18',
        foliageMid: '#15382e',
        foliageHi: '#2f6b56',
        barkDark: '#131618',
        barkMid: '#28312e',
        lanternGlow: '#5eead4',
        fogHex: 0x0e2326,
      };
    case 'castle':
      // Fırtınalı gotik kale surları (çelik mavisi bulutlar, bakır ay ışığı)
      return {
        skyTop: '#0b0e19',
        skyMid: '#1c243a',
        skyHorizon: '#47455c',
        moonCore: '#f6d9b8',
        moonGlow: 'rgba(220, 178, 152, 0.34)',
        mountainFar: '#141826',
        mountainRim: 'rgba(176, 186, 220, 0.25)',
        forestFar: '#121724',
        forestMid: '#1a202e',
        mistColor: 'rgba(176, 184, 214, 0.21)',
        rayColor: 'rgba(210, 215, 240, 0.14)',
        foliageDark: '#151c24',
        foliageMid: '#24313c',
        foliageHi: '#425666',
        barkDark: '#16161d',
        barkMid: '#2f313e',
        lanternGlow: '#fb923c',
        fogHex: 0x1a2030,
      };
    case 'throne':
      // Kraliyet Gotik Hazine Salonu (derin lacivert taş kemerler, vitray pencereler, altın avizeler)
      return {
        skyTop: '#070a16',
        skyMid: '#121b33',
        skyHorizon: '#232847',
        moonCore: '#fde68a',
        moonGlow: 'rgba(250, 204, 21, 0.28)',
        mountainFar: '#0d1326',
        mountainRim: 'rgba(250, 204, 21, 0.2)',
        forestFar: '#0c1122',
        forestMid: '#121930',
        mistColor: 'rgba(250, 204, 120, 0.14)',
        rayColor: 'rgba(147, 197, 253, 0.16)',
        foliageDark: '#13172b',
        foliageMid: '#1e2542',
        foliageHi: '#34416b',
        barkDark: '#171522',
        barkMid: '#2b263d',
        lanternGlow: '#fbbf24',
        fogHex: 0x10172b,
      };
    case 'ice':
      // Buz Krallığı (kutup ışıkları, kristal mavi dağlar, karlı çamlar)
      return {
        skyTop: '#07172b',
        skyMid: '#133a5e',
        skyHorizon: '#5aa6cc',
        moonCore: '#e0f7ff',
        moonGlow: 'rgba(125, 211, 252, 0.44)',
        mountainFar: '#143252',
        mountainRim: 'rgba(186, 230, 253, 0.42)',
        forestFar: '#122f47',
        forestMid: '#1c4666',
        mistColor: 'rgba(186, 230, 253, 0.28)',
        rayColor: 'rgba(125, 249, 255, 0.20)',
        foliageDark: '#163854',
        foliageMid: '#2c668a',
        foliageHi: '#bfe8ff',
        barkDark: '#1d2b3a',
        barkMid: '#3b536b',
        lanternGlow: '#38bdf8',
        fogHex: 0x163957,
      };
    case 'desert':
      // Çöl Krallığı (kızgın kehribar gökyüzü, altın kum tepeleri, sıcak güneş)
      return {
        skyTop: '#240f08',
        skyMid: '#6e3015',
        skyHorizon: '#d98b3c',
        moonCore: '#fff0a8',
        moonGlow: 'rgba(251, 191, 36, 0.46)',
        mountainFar: '#452010',
        mountainRim: 'rgba(253, 186, 116, 0.36)',
        forestFar: '#3d2012',
        forestMid: '#593018',
        mistColor: 'rgba(245, 178, 98, 0.24)',
        rayColor: 'rgba(254, 215, 130, 0.22)',
        foliageDark: '#26381c',
        foliageMid: '#3e5c26',
        foliageHi: '#789c3b',
        barkDark: '#361e10',
        barkMid: '#6b3e20',
        lanternGlow: '#fb923c',
        fogHex: 0x5c2d17,
      };
    case 'pirate':
      // Korsan Limanı (gece okyanusu, turkuaz sis, sıcak gemi fenerleri)
      return {
        skyTop: '#071421',
        skyMid: '#12364a',
        skyHorizon: '#3c7380',
        moonCore: '#fef0c7',
        moonGlow: 'rgba(94, 234, 212, 0.34)',
        mountainFar: '#0d2636',
        mountainRim: 'rgba(153, 246, 228, 0.28)',
        forestFar: '#0c2330',
        forestMid: '#153847',
        mistColor: 'rgba(120, 210, 214, 0.24)',
        rayColor: 'rgba(153, 246, 228, 0.16)',
        foliageDark: '#122e2b',
        foliageMid: '#1f4d45',
        foliageHi: '#3d8274',
        barkDark: '#241812',
        barkMid: '#4f3523',
        lanternGlow: '#fbbf24',
        fogHex: 0x133142,
      };
    case 'graveyard':
      // Lanetli Mezarlık (eflatun ay ışığı, hayalet sisi, koyu mor gölgeler)
      return {
        skyTop: '#0b0617',
        skyMid: '#21123a',
        skyHorizon: '#4b2a70',
        moonCore: '#f3e8ff',
        moonGlow: 'rgba(192, 132, 252, 0.42)',
        mountainFar: '#160d29',
        mountainRim: 'rgba(216, 180, 254, 0.32)',
        forestFar: '#140c24',
        forestMid: '#22153b',
        mistColor: 'rgba(180, 130, 245, 0.25)',
        rayColor: 'rgba(216, 180, 254, 0.17)',
        foliageDark: '#1a1229',
        foliageMid: '#2e2047',
        foliageHi: '#573d82',
        barkDark: '#15101c',
        barkMid: '#2c2238',
        lanternGlow: '#a855f7',
        fogHex: 0x1e1233,
      };
    case 'dragon':
    default:
      // Ejderha Kalesi (volkanik kızıl gökyüzü, obsidyen zirveler, kor alevleri)
      return {
        skyTop: '#120406',
        skyMid: '#3d0e11',
        skyHorizon: '#942814',
        moonCore: '#ffae52',
        moonGlow: 'rgba(249, 115, 22, 0.48)',
        mountainFar: '#24080a',
        mountainRim: 'rgba(251, 146, 60, 0.38)',
        forestFar: '#1f0709',
        forestMid: '#330d0f',
        mistColor: 'rgba(248, 113, 113, 0.24)',
        rayColor: 'rgba(251, 146, 60, 0.22)',
        foliageDark: '#261112',
        foliageMid: '#451917',
        foliageHi: '#852e1e',
        barkDark: '#170d0e',
        barkMid: '#301a1c',
        lanternGlow: '#ef4444',
        fogHex: 0x360d0f,
      };
  }
}

/* ============================================================================
 * 1. EL BOYAMASI KARANLIK FANTASTİK GÖKYÜZÜ & AY / VİTRAY ARKA PLAN
 * ============================================================================ */
export function createDarkFantasySkyTex(
  lvl: LevelConfig,
  anisotropy: number,
): THREE.CanvasTexture {
  const pal = getDarkFantasyPalette(lvl.theme);
  return makeCanvasTex(
    1024,
    512,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, pal.skyTop);
      grad.addColorStop(0.54, pal.skyMid);
      grad.addColorStop(1, pal.skyHorizon);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (lvl.isInterior) {
        // Gotik katedral taş tonozları ve ay ışığı sızan vitray pencereler
        for (let x = 86; x < w; x += 210) {
          // Pencere etrafı yumuşak ışık halesi
          const glow = ctx.createRadialGradient(x, 195, 15, x, 195, 125);
          glow.addColorStop(0, 'rgba(147, 197, 253, 0.26)');
          glow.addColorStop(0.6, 'rgba(96, 165, 250, 0.08)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 130, 50, 260, 320);

          // Sivri gotik kemerli vitray cam
          const glassGrad = ctx.createLinearGradient(x, 65, x, 370);
          glassGrad.addColorStop(0, 'rgba(191, 219, 254, 0.34)');
          glassGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.18)');
          glassGrad.addColorStop(1, 'rgba(30, 58, 138, 0.1)');
          ctx.fillStyle = glassGrad;
          ctx.beginPath();
          ctx.moveTo(x - 46, 370);
          ctx.lineTo(x - 46, 145);
          ctx.quadraticCurveTo(x - 42, 84, x, 58);
          ctx.quadraticCurveTo(x + 42, 84, x + 46, 145);
          ctx.lineTo(x + 46, 370);
          ctx.closePath();
          ctx.fill();

          // Taş çerçeve & vitray kafesi
          ctx.strokeStyle = '#090c18';
          ctx.lineWidth = 10;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(250, 204, 21, 0.32)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(x, 138, 22, 0, Math.PI * 2);
          ctx.moveTo(x, 64);
          ctx.lineTo(x, 370);
          ctx.moveTo(x - 44, 205);
          ctx.lineTo(x + 44, 205);
          ctx.moveTo(x - 44, 285);
          ctx.lineTo(x + 44, 285);
          ctx.stroke();
        }
        return;
      }

      // Uzak gökyüzü yıldızları
      for (let i = 0; i < 65; i++) {
        const sx = hash(i * 3.1) * w;
        const sy = hash(i * 7.3) * h * 0.56;
        const sr = 0.8 + hash(i * 11.7) * 1.5;
        ctx.fillStyle = `rgba(240, 248, 255, ${0.22 + hash(i * 5.9) * 0.52})`;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Görkemli karanlık fantastik dolunay/güneş — her bölümün bgVariant değerine göre konum değişir
      const variantShift = ((lvl.bgVariant ?? 0) % 6) * 58 - 110;
      const mx = Math.max(220, Math.min(820, 680 + variantShift));
      const my = 122 + ((lvl.bgVariant ?? 0) % 3) * 18;
      const mr = lvl.theme === 'desert' || lvl.theme === 'dragon' ? 68 : 58;

      // Buz Krallığı için gökyüzüne kuzey ışıkları (Aurora) ekle
      if (lvl.theme === 'ice') {
        const aurora = ctx.createLinearGradient(0, 35, w, 240);
        aurora.addColorStop(0, 'rgba(34, 211, 238, 0)');
        aurora.addColorStop(0.28, 'rgba(52, 211, 153, 0.24)');
        aurora.addColorStop(0.55, 'rgba(56, 189, 248, 0.28)');
        aurora.addColorStop(0.82, 'rgba(167, 139, 250, 0.18)');
        aurora.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = aurora;
        ctx.beginPath();
        ctx.moveTo(0, 140);
        for (let x = 0; x <= w; x += 64) {
          ctx.lineTo(x, 110 + Math.sin(x * 0.01 + (lvl.bgVariant ?? 0)) * 38);
        }
        ctx.lineTo(w, 225);
        ctx.lineTo(0, 225);
        ctx.closePath();
        ctx.fill();
      }

      const haloOuter = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 4.4);
      haloOuter.addColorStop(0, pal.moonGlow);
      haloOuter.addColorStop(0.45, 'rgba(180, 210, 230, 0.11)');
      haloOuter.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = haloOuter;
      ctx.beginPath();
      ctx.arc(mx, my, mr * 4.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = pal.moonCore;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();

      // Ay yüzey krater lekeleri (el boyaması doku)
      ctx.fillStyle = 'rgba(65, 80, 95, 0.16)';
      ctx.beginPath();
      ctx.arc(mx - 18, my - 10, 15, 0, Math.PI * 2);
      ctx.arc(mx + 14, my + 16, 19, 0, Math.PI * 2);
      ctx.arc(mx + 22, my - 18, 9, 0, Math.PI * 2);
      ctx.arc(mx - 6, my + 24, 11, 0, Math.PI * 2);
      ctx.fill();

      // Katmanlı karanlık fantastik bulut şeritleri
      const drawCloudBand = (cy: number, alpha: number, color: string, seedOffset: number) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(0, cy + 48);
        for (let x = 0; x <= w; x += 64) {
          const ridge =
            Math.sin(x * 0.011 + seedOffset) * 18 + Math.cos(x * 0.025 + seedOffset * 2) * 10;
          ctx.lineTo(x, cy + ridge);
        }
        ctx.lineTo(w, cy + 75);
        ctx.lineTo(0, cy + 75);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      const vSeed = (lvl.bgVariant ?? 0) * 1.15;
      drawCloudBand(175, 0.22, '#0c1322', 1.2 + vSeed);
      drawCloudBand(238, 0.28, '#1a273c', 3.6 + vSeed);
      drawCloudBand(302, 0.34, pal.skyHorizon, 5.1 + vSeed);

      // Bölüm özel atmosfer renk tonu dokunuşu (her 6 bölüm birbirinden farklı ışık tonuna sahip)
      if (lvl.lightingTint) {
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = lvl.lightingTint;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }

      // Ufuk çizgisi atmosferik parıltı
      const horizonFog = ctx.createLinearGradient(0, h * 0.65, 0, h);
      horizonFog.addColorStop(0, 'rgba(0,0,0,0)');
      horizonFog.addColorStop(1, pal.mistColor);
      ctx.fillStyle = horizonFog;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);
    },
    anisotropy,
  );
}

/* ============================================================================
 * 2. KESİNTİSİZ UZAK DAĞLAR & GOTİK KALE SİLUETİ PARALLAX KATMANI
 * ============================================================================ */
export function createMountainLayerTex(
  theme: LevelTheme,
  anisotropy: number,
): THREE.CanvasTexture {
  const pal = getDarkFantasyPalette(theme);
  return makeCanvasTex(
    1024,
    384,
    (ctx, w, h) => {
      // Kesintisiz döngü için sinüs harmonikleri + kırık kaya tepeleri
      const peakY = (x: number) => {
        const t = (x / w) * Math.PI * 2;
        return (
          h * 0.56 -
          Math.abs(Math.sin(t * 2 + 0.4)) * 125 -
          Math.abs(Math.cos(t * 3 - 0.7)) * 68 -
          Math.sin(t * 7) * 16
        );
      };

      // Arka dağ silueti
      const mGrad = ctx.createLinearGradient(0, 40, 0, h);
      mGrad.addColorStop(0, pal.mountainFar);
      mGrad.addColorStop(0.75, '#0c1320');
      mGrad.addColorStop(1, '#080c14');
      ctx.fillStyle = mGrad;

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 12) {
        ctx.lineTo(x, peakY(x));
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();

      // Ay ışığı vuran kaya sırtı vurguları
      ctx.strokeStyle = pal.mountainRim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 16) {
        const y = peakY(x);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Uzak zirvelerde gotik yıkık kale kuleleri silueti
      const castles = [215, 735];
      for (const cx of castles) {
        const cy = peakY(cx) + 12;
        ctx.fillStyle = pal.mountainFar;
        // Ana hisar ve 3 sivri gotik kule
        ctx.fillRect(cx - 32, cy - 36, 64, 52);
        ctx.fillRect(cx - 38, cy - 64, 18, 72);
        ctx.fillRect(cx - 8, cy - 82, 20, 90);
        ctx.fillRect(cx + 22, cy - 56, 16, 66);

        // Sivri çatılar
        const spires: [number, number, number, number][] = [
          [cx - 29, cy - 64, 24, 30],
          [cx + 2, cy - 82, 28, 38],
          [cx + 30, cy - 56, 22, 26],
        ];
        for (const [sx, sy, sw, sh] of spires) {
          ctx.beginPath();
          ctx.moveTo(sx - sw / 2, sy);
          ctx.lineTo(sx, sy - sh);
          ctx.lineTo(sx + sw / 2, sy);
          ctx.closePath();
          ctx.fill();
        }

        // Uzak kulede titrek sıcak pencere ışıkları
        ctx.fillStyle = 'rgba(255, 198, 92, 0.72)';
        ctx.fillRect(cx - 31, cy - 48, 4, 8);
        ctx.fillRect(cx, cy - 62, 5, 10);
        ctx.fillRect(cx + 28, cy - 42, 4, 7);
      }

      // Dağ eteklerine çöken atmosferik sis geçişi
      const footFog = ctx.createLinearGradient(0, h * 0.62, 0, h);
      footFog.addColorStop(0, 'rgba(0,0,0,0)');
      footFog.addColorStop(0.75, pal.mistColor);
      footFog.addColorStop(1, 'rgba(10, 16, 24, 0.55)');
      ctx.fillStyle = footFog;
      ctx.fillRect(0, h * 0.62, w, h * 0.38);
    },
    anisotropy,
    2,
    1,
  );
}

/* ============================================================================
 * 3. KESİNTİSİZ ORTA-UZAK SİSLİ KARANLIK ORMAN KATMANI
 * ============================================================================ */
export function createForestCanopyLayerTex(
  theme: LevelTheme,
  anisotropy: number,
): THREE.CanvasTexture {
  const pal = getDarkFantasyPalette(theme);
  return makeCanvasTex(
    1024,
    384,
    (ctx, w, h) => {
      // Arka sıra yüksek çam ve kadim ağaç gölgeleri
      const drawPineSilhouette = (
        cx: number,
        baseY: number,
        height: number,
        width: number,
        color: string,
        rimColor: string,
      ) => {
        ctx.fillStyle = color;
        // Gövde
        ctx.fillRect(cx - width * 0.08, baseY - height * 0.45, width * 0.16, height * 0.45);
        // 5 katmanlı organik çam dalları
        const tiers = 5;
        for (let t = 0; t < tiers; t++) {
          const frac = t / (tiers - 1);
          const ty = baseY - height * (0.28 + frac * 0.68);
          const tw = width * (1.0 - frac * 0.68);
          const th = height * 0.28;
          ctx.beginPath();
          ctx.moveTo(cx, ty - th);
          ctx.quadraticCurveTo(cx + tw * 0.34, ty - th * 0.2, cx + tw * 0.54, ty + 4);
          ctx.quadraticCurveTo(cx + tw * 0.2, ty - 6, cx, ty + 6);
          ctx.quadraticCurveTo(cx - tw * 0.2, ty - 6, cx - tw * 0.54, ty + 4);
          ctx.quadraticCurveTo(cx - tw * 0.34, ty - th * 0.2, cx, ty - th);
          ctx.closePath();
          ctx.fill();

          // Ay ışığı vurmuş ince yaprak sırtı
          ctx.strokeStyle = rimColor;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx, ty - th);
          ctx.quadraticCurveTo(cx + tw * 0.3, ty - th * 0.25, cx + tw * 0.48, ty);
          ctx.stroke();
        }
      };

      // İki derinlik sırası (kesintisiz döngü için kenar ağaçları her iki uca da çizilir)
      for (let i = 0; i < 16; i++) {
        const x = (i / 16) * w + (hash(i * 4.7) - 0.5) * 32;
        const th = 190 + hash(i * 9.2) * 140;
        const tw = 74 + hash(i * 5.3) * 44;
        drawPineSilhouette(x, h, th, tw, pal.forestFar, 'rgba(180, 225, 220, 0.12)');
        if (x < 90) drawPineSilhouette(x + w, h, th, tw, pal.forestFar, 'rgba(180, 225, 220, 0.12)');
        if (x > w - 90) drawPineSilhouette(x - w, h, th, tw, pal.forestFar, 'rgba(180, 225, 220, 0.12)');
      }

      // Orta sıra hafif sis örtüsü
      const midMist = ctx.createLinearGradient(0, h * 0.45, 0, h);
      midMist.addColorStop(0, 'rgba(0,0,0,0)');
      midMist.addColorStop(0.8, pal.mistColor);
      midMist.addColorStop(1, 'rgba(10, 18, 22, 0.5)');
      ctx.fillStyle = midMist;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);

      for (let i = 0; i < 13; i++) {
        const x = ((i + 0.35) / 13) * w + (hash(i * 12.1) - 0.5) * 28;
        const th = 155 + hash(i * 6.4) * 115;
        const tw = 82 + hash(i * 8.1) * 48;
        drawPineSilhouette(x, h, th, tw, pal.forestMid, pal.mountainRim);
        if (x < 95) drawPineSilhouette(x + w, h, th, tw, pal.forestMid, pal.mountainRim);
        if (x > w - 95) drawPineSilhouette(x - w, h, th, tw, pal.forestMid, pal.mountainRim);
      }

      // Alt çalı ve yosun silueti
      ctx.fillStyle = '#091315';
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 24) {
        const t = (x / w) * Math.PI * 2;
        const bushH = 26 + Math.sin(t * 9) * 10 + Math.cos(t * 15) * 7;
        ctx.lineTo(x, h - bushH);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    },
    anisotropy,
    2,
    1,
  );
}

/* ============================================================================
 * 4. HAREKETLİ VOLÜMETRİK SİS ŞERİDİ & AY IŞIĞI HÜZMELERİ
 * ============================================================================ */
export function createMistBandTex(theme: LevelTheme): THREE.CanvasTexture {
  const pal = getDarkFantasyPalette(theme);
  return makeCanvasTex(
    512,
    128,
    (ctx, w, h) => {
      for (let i = 0; i < 7; i++) {
        const cx = (i / 6) * w;
        const cy = h * (0.55 + Math.sin(i * 1.9) * 0.14);
        const rx = 95 + (i % 3) * 32;
        const ry = 36 + (i % 2) * 14;
        const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
        grad.addColorStop(0, pal.mistColor);
        grad.addColorStop(0.6, 'rgba(180, 215, 225, 0.06)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx);
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    2,
    2,
    1,
  );
}

export function createLightShaftTex(theme: LevelTheme): THREE.CanvasTexture {
  const pal = getDarkFantasyPalette(theme);
  return makeCanvasTex(256, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, pal.rayColor);
    grad.addColorStop(0.55, pal.rayColor);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(w * 0.34, 0);
    ctx.lineTo(w * 0.66, 0);
    ctx.lineTo(w * 0.96, h);
    ctx.lineTo(w * 0.04, h);
    ctx.closePath();
    ctx.fill();

    // Yumuşak kenar solması
    const mask = ctx.createLinearGradient(0, 0, w, 0);
    mask.addColorStop(0, 'rgba(0,0,0,1)');
    mask.addColorStop(0.22, 'rgba(0,0,0,0)');
    mask.addColorStop(0.78, 'rgba(0,0,0,0)');
    mask.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  });
}

/* ============================================================================
 * 5. EL BOYAMASI DETAYLI KADİM ORMAN AĞAÇLARI (3 FARKLI SANATSAL VARYANT)
 *    Basit geometrik küre/silindir yerine budaklı gövde, kökler, dallar ve katmanlı yapraklar!
 * ============================================================================ */
export function createHandPaintedTree(
  theme: LevelTheme,
  variant: number,
  scale = 1,
  anisotropy = 4,
): THREE.Group {
  const pal = getDarkFantasyPalette(theme);
  const v = Math.abs(variant) % 3;

  const tex = makeCanvasTex(
    512,
    640,
    (ctx, w, h) => {
      const cx = w * 0.5;
      const baseY = h * 0.96;

      // 1. Kökler ve kıvrımlı budaklı ana gövde
      const barkGrad = ctx.createLinearGradient(cx - 56, baseY - 380, cx + 62, baseY);
      barkGrad.addColorStop(0, pal.barkMid);
      barkGrad.addColorStop(0.45, '#2b201b');
      barkGrad.addColorStop(1, pal.barkDark);

      ctx.fillStyle = barkGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;

      ctx.beginPath();
      ctx.moveTo(cx - 88, baseY);
      ctx.quadraticCurveTo(cx - 46, baseY - 46, cx - 34, baseY - 140);
      ctx.bezierCurveTo(cx - 42, baseY - 230, cx - 22, baseY - 310, cx - 18, baseY - 375);
      ctx.lineTo(cx + 22, baseY - 375);
      ctx.bezierCurveTo(cx + 28, baseY - 295, cx + 44, baseY - 220, cx + 38, baseY - 135);
      ctx.quadraticCurveTo(cx + 50, baseY - 44, cx + 92, baseY);
      ctx.quadraticCurveTo(cx + 28, baseY - 14, cx + 10, baseY + 2);
      ctx.quadraticCurveTo(cx - 24, baseY - 18, cx - 88, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ağaç kabuğu oyukları & ay ışığı kenar vurgusu
      ctx.strokeStyle = 'rgba(215, 232, 238, 0.14)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 26, baseY - 72);
      ctx.quadraticCurveTo(cx - 32, baseY - 190, cx - 16, baseY - 320);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(8, 6, 10, 0.65)';
      ctx.lineWidth = 3.5;
      for (let i = 0; i < 6; i++) {
        const bx = cx - 18 + i * 8;
        const by = baseY - 60 - (i % 3) * 75;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + (i % 2 === 0 ? 5 : -5), by - 45, bx + 2, by - 92);
        ctx.stroke();
      }

      // Kıvrımlı ana dallar
      const drawBranch = (x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, lw: number) => {
        ctx.strokeStyle = INK;
        ctx.lineWidth = lw + 6;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x1, y1, x2, y2);
        ctx.stroke();

        ctx.strokeStyle = pal.barkMid;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x1, y1, x2, y2);
        ctx.stroke();
      };

      drawBranch(cx - 12, baseY - 260, cx - 82, baseY - 305, cx - 148, baseY - 350, 18);
      drawBranch(cx + 14, baseY - 280, cx + 88, baseY - 332, cx + 152, baseY - 372, 16);
      drawBranch(cx - 4, baseY - 330, cx - 42, baseY - 405, cx - 78, baseY - 465, 13);
      drawBranch(cx + 6, baseY - 340, cx + 52, baseY - 418, cx + 84, baseY - 472, 12);

      // Gövde köklerinde doğal koyu yosun dokusu
      ctx.fillStyle = pal.foliageMid;
      ctx.beginPath();
      ctx.ellipse(cx - 38, baseY - 22, 26, 10, -0.22, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, baseY - 18, 22, 9, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Organik el boyaması katmanlı yaprak kümeleri (gölge -> orta -> ay ışığı vurgusu)
      const drawLeafCluster = (lx: number, ly: number, rx: number, ry: number, seed: number) => {
        // Koyu alt gölge kümesi
        ctx.fillStyle = pal.foliageDark;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 5;
        ctx.beginPath();
        const lobes = 9;
        for (let i = 0; i < lobes; i++) {
          const a = (i / lobes) * Math.PI * 2;
          const rMod = 0.8 + hash(seed + i * 3.7) * 0.34;
          const px = lx + Math.cos(a) * rx * rMod;
          const py = ly + Math.sin(a) * ry * rMod;
          if (i === 0) ctx.moveTo(px, py);
          else {
            const pa = ((i - 0.5) / lobes) * Math.PI * 2;
            const cx2 = lx + Math.cos(pa) * rx * 1.12;
            const cy2 = ly + Math.sin(pa) * ry * 1.12;
            ctx.quadraticCurveTo(cx2, cy2, px, py);
          }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Orta ton yaprak dokusu (fırça darbeleri)
        ctx.fillStyle = pal.foliageMid;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + seed;
          const dist = hash(seed + i * 7.1) * 0.55;
          const px = lx + Math.cos(a) * rx * dist;
          const py = ly - ry * 0.14 + Math.sin(a) * ry * dist * 0.7;
          ctx.beginPath();
          ctx.ellipse(px, py, rx * 0.34, ry * 0.28, a * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Üst kenarda ay ışığı / alacakaranlık vurgusu
        ctx.fillStyle = pal.foliageHi;
        for (let i = 0; i < 5; i++) {
          const px = lx - rx * 0.45 + (i / 4) * rx * 0.9;
          const py = ly - ry * (0.42 + Math.sin((i / 4) * Math.PI) * 0.22);
          ctx.beginPath();
          ctx.ellipse(px, py, rx * 0.22, ry * 0.15, -0.18 + i * 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      if (v === 0) {
        // Kadim geniş meşe ağacı
        drawLeafCluster(cx - 122, baseY - 365, 92, 66, 11);
        drawLeafCluster(cx + 126, baseY - 378, 94, 68, 23);
        drawLeafCluster(cx - 64, baseY - 462, 102, 74, 37);
        drawLeafCluster(cx + 68, baseY - 468, 96, 72, 49);
        drawLeafCluster(cx, baseY - 510, 112, 78, 61);
      } else if (v === 1) {
        // Yüksek gotik çam / sedir
        drawLeafCluster(cx - 88, baseY - 300, 88, 52, 17);
        drawLeafCluster(cx + 90, baseY - 312, 86, 52, 29);
        drawLeafCluster(cx - 62, baseY - 395, 82, 54, 41);
        drawLeafCluster(cx + 64, baseY - 405, 80, 54, 53);
        drawLeafCluster(cx, baseY - 490, 92, 64, 67);
        drawLeafCluster(cx, baseY - 555, 62, 48, 79);
      } else {
        // Sarkık sarmaşıklı yaşlı orman ağacı
        drawLeafCluster(cx - 134, baseY - 348, 86, 62, 13);
        drawLeafCluster(cx + 132, baseY - 360, 88, 64, 31);
        drawLeafCluster(cx, baseY - 455, 126, 86, 47);

        // Sarkık sarmaşık ve yosun ipleri
        ctx.strokeStyle = pal.foliageMid;
        ctx.lineWidth = 4;
        for (const vx of [cx - 148, cx - 102, cx + 96, cx + 144]) {
          ctx.beginPath();
          ctx.moveTo(vx, baseY - 310);
          ctx.quadraticCurveTo(vx + 8, baseY - 250, vx - 4, baseY - 195);
          ctx.stroke();
        }
      }

      // Ağacın alt dallarına asılı sıcak minik ateş böceği parıltıları
      ctx.fillStyle = pal.lanternGlow;
      ctx.globalAlpha = 0.72;
      for (const [fx, fy] of [
        [cx - 86, baseY - 285],
        [cx + 94, baseY - 315],
        [cx - 28, baseY - 400],
      ]) {
        ctx.beginPath();
        ctx.arc(fx, fy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    anisotropy,
  );

  const group = new THREE.Group();
  const planeW = 5.6 * scale;
  const planeH = 7.0 * scale;
  const geo = new THREE.PlaneGeometry(planeW, planeH);
  geo.translate(0, planeH * 0.48, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);
  return group;
}

/* ============================================================================
 * 6. EL BOYAMASI KARANLIK FANTASTİK ORTAÇAĞ EVİ / GÖZCÜ KULESİ / FENER / KAYA
 * ============================================================================ */
export function createHandPaintedGothicBuilding(
  theme: LevelTheme,
  variant: number,
  anisotropy = 4,
): THREE.Group {
  const pal = getDarkFantasyPalette(theme);
  const isTower = Math.abs(variant) % 3 === 2 || theme === 'castle';

  const tex = makeCanvasTex(
    512,
    512,
    (ctx, w, h) => {
      const cx = w * 0.5;
      const baseY = h * 0.96;

      if (isTower) {
        // Yıpranmış taş gotik gözcü kulesi
        const stoneGrad = ctx.createLinearGradient(cx - 100, 120, cx + 100, baseY);
        stoneGrad.addColorStop(0, '#444b5e');
        stoneGrad.addColorStop(0.55, '#2b3040');
        stoneGrad.addColorStop(1, '#191c26');

        ctx.fillStyle = stoneGrad;
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(cx - 82, baseY);
        ctx.lineTo(cx - 68, 178);
        ctx.lineTo(cx + 68, 178);
        ctx.lineTo(cx + 82, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Taş blok çizgileri
        ctx.strokeStyle = 'rgba(10, 12, 18, 0.5)';
        ctx.lineWidth = 3;
        for (let y = 210; y < baseY; y += 38) {
          ctx.beginPath();
          ctx.moveTo(cx - 72, y);
          ctx.lineTo(cx + 72, y);
          ctx.stroke();
        }

        // Mazgal ve sivri karanlık kiremit çatı
        ctx.fillStyle = '#252a38';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 6;
        ctx.fillRect(cx - 86, 152, 172, 30);
        ctx.strokeRect(cx - 86, 152, 172, 30);

        const roofGrad = ctx.createLinearGradient(cx, 26, cx + 90, 160);
        roofGrad.addColorStop(0, '#3e2234');
        roofGrad.addColorStop(0.5, '#251526');
        roofGrad.addColorStop(1, '#130b16');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 98, 158);
        ctx.quadraticCurveTo(cx - 24, 90, cx, 26);
        ctx.quadraticCurveTo(cx + 24, 90, cx + 98, 158);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sıcak parlayan kemerli gotik pencere
        const winGlow = ctx.createRadialGradient(cx, 265, 6, cx, 265, 68);
        winGlow.addColorStop(0, 'rgba(255, 192, 74, 0.55)');
        winGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = winGlow;
        ctx.beginPath();
        ctx.arc(cx, 265, 68, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx - 18, 295);
        ctx.lineTo(cx - 18, 250);
        ctx.quadraticCurveTo(cx, 224, cx + 18, 250);
        ctx.lineTo(cx + 18, 295);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ağır ahşap kemerli kapı
        ctx.fillStyle = '#291b14';
        ctx.beginPath();
        ctx.moveTo(cx - 32, baseY);
        ctx.lineTo(cx - 32, baseY - 76);
        ctx.quadraticCurveTo(cx, baseY - 108, cx + 32, baseY - 76);
        ctx.lineTo(cx + 32, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Karanlık fantastik ahşap-taş kır evi (Half-timber gothic tavern)
        // Taş alt temel
        ctx.fillStyle = '#333642';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 7;
        ctx.fillRect(cx - 142, baseY - 110, 284, 110);
        ctx.strokeRect(cx - 142, baseY - 110, 284, 110);

        // Üst kat sıvalı ve koyu ahşap kirişli cephe
        const wallGrad = ctx.createLinearGradient(cx - 150, 210, cx + 150, baseY - 100);
        wallGrad.addColorStop(0, '#686058');
        wallGrad.addColorStop(0.55, '#4c4643');
        wallGrad.addColorStop(1, '#343030');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(cx - 154, 215, 308, 170);
        ctx.strokeRect(cx - 154, 215, 308, 170);

        // Ahşap kirişler
        ctx.strokeStyle = '#1e1612';
        ctx.lineWidth = 11;
        ctx.beginPath();
        ctx.moveTo(cx - 154, 298);
        ctx.lineTo(cx + 154, 298);
        ctx.moveTo(cx - 56, 215);
        ctx.lineTo(cx - 56, 385);
        ctx.moveTo(cx + 56, 215);
        ctx.lineTo(cx + 56, 385);
        ctx.moveTo(cx - 154, 298);
        ctx.lineTo(cx - 56, 215);
        ctx.moveTo(cx + 154, 298);
        ctx.lineTo(cx + 56, 215);
        ctx.stroke();

        // Taş baca
        ctx.fillStyle = '#2d313d';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 6;
        ctx.fillRect(cx + 76, 78, 42, 132);
        ctx.strokeRect(cx + 76, 78, 42, 132);

        // Dik eğimli karanlık gotik çatı
        const roofGrad = ctx.createLinearGradient(cx, 72, cx, 232);
        roofGrad.addColorStop(0, variant % 2 === 0 ? '#4a2024' : '#25334a');
        roofGrad.addColorStop(1, '#18131d');
        ctx.fillStyle = roofGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 186, 232);
        ctx.lineTo(cx - 88, 96);
        ctx.lineTo(cx + 88, 96);
        ctx.lineTo(cx + 186, 232);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sıcak parlayan pencereler (cam içi kehribar parıltı)
        for (const wx of [cx - 104, cx + 104]) {
          const glow = ctx.createRadialGradient(wx, 258, 5, wx, 258, 56);
          glow.addColorStop(0, 'rgba(255, 195, 76, 0.45)');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(wx, 258, 56, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fcd34d';
          ctx.strokeStyle = INK;
          ctx.lineWidth = 5;
          ctx.fillRect(wx - 22, 236, 44, 44);
          ctx.strokeRect(wx - 22, 236, 44, 44);
          ctx.beginPath();
          ctx.moveTo(wx, 236);
          ctx.lineTo(wx, 280);
          ctx.moveTo(wx - 22, 258);
          ctx.lineTo(wx + 22, 258);
          ctx.stroke();
        }

        // Ahşap kapı ve sıcak kapı feneri
        ctx.fillStyle = '#261812';
        ctx.strokeStyle = INK;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 32, baseY);
        ctx.lineTo(cx - 32, baseY - 82);
        ctx.quadraticCurveTo(cx, baseY - 104, cx + 32, baseY - 82);
        ctx.lineTo(cx + 32, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.lanternGlow;
        ctx.beginPath();
        ctx.arc(cx + 44, baseY - 76, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    anisotropy,
  );

  const g = new THREE.Group();
  const size = isTower ? 6.4 : 6.0;
  const geo = new THREE.PlaneGeometry(size, size);
  geo.translate(0, size * 0.48, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.04,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  g.add(new THREE.Mesh(geo, mat));
  return g;
}

/* ============================================================================
 * 7. YOL KENARI DÖVME DEMİR FENER DİREĞİ + YOSUNLU KAYALAR (2D IŞIK KAYNAĞI)
 * ============================================================================ */
export function createRoadsideLanternAndRocks(
  theme: LevelTheme,
  hasLantern: boolean,
  anisotropy = 4,
): { group: THREE.Group; glowMesh?: THREE.Mesh } {
  const pal = getDarkFantasyPalette(theme);
  const g = new THREE.Group();

  const rockTex = makeCanvasTex(
    256,
    192,
    (ctx) => {
      // Yosunlu karanlık orman kayaları & çalı kümesi (düz küre değil, kırık kaya silueti)
      const rockGrad = ctx.createLinearGradient(30, 50, 220, 180);
      rockGrad.addColorStop(0, '#4f5764');
      rockGrad.addColorStop(0.5, '#2f3540');
      rockGrad.addColorStop(1, '#171a22');

      ctx.fillStyle = rockGrad;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(22, 178);
      ctx.lineTo(42, 108);
      ctx.lineTo(94, 78);
      ctx.lineTo(154, 96);
      ctx.lineTo(188, 134);
      ctx.lineTo(234, 152);
      ctx.lineTo(240, 178);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Üst kaya yüzeyi ay ışığı
      ctx.fillStyle = 'rgba(205, 226, 240, 0.16)';
      ctx.beginPath();
      ctx.moveTo(46, 110);
      ctx.lineTo(94, 82);
      ctx.lineTo(146, 98);
      ctx.lineTo(106, 118);
      ctx.closePath();
      ctx.fill();

      // Doğal yosun tabakası
      ctx.fillStyle = pal.foliageMid;
      ctx.beginPath();
      ctx.ellipse(98, 92, 34, 12, 0.14, 0, Math.PI * 2);
      ctx.ellipse(174, 136, 24, 9, 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Küçük yabani ot sapları
      ctx.strokeStyle = pal.foliageHi;
      ctx.lineWidth = 3.5;
      for (const gx of [36, 62, 206, 222]) {
        ctx.beginPath();
        ctx.moveTo(gx, 176);
        ctx.quadraticCurveTo(gx - 6, 152, gx - 12, 138);
        ctx.moveTo(gx, 176);
        ctx.quadraticCurveTo(gx + 5, 155, gx + 10, 144);
        ctx.stroke();
      }
    },
    anisotropy,
  );

  const rockGeo = new THREE.PlaneGeometry(2.1, 1.55);
  rockGeo.translate(0, 0.72, 0);
  const rockMat = new THREE.MeshBasicMaterial({
    map: rockTex,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
  });
  g.add(new THREE.Mesh(rockGeo, rockMat));

  if (!hasLantern) {
    return { group: g };
  }

  // Dövme demir gotik sokak feneri
  const lanternTex = makeCanvasTex(
    192,
    384,
    (ctx) => {
      // Demir direk
      ctx.strokeStyle = INK;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(76, 370);
      ctx.lineTo(76, 76);
      ctx.quadraticCurveTo(76, 32, 118, 34);
      ctx.quadraticCurveTo(144, 36, 144, 62);
      ctx.stroke();

      ctx.strokeStyle = '#383e4d';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(76, 366);
      ctx.lineTo(76, 76);
      ctx.quadraticCurveTo(76, 32, 118, 34);
      ctx.quadraticCurveTo(144, 36, 144, 62);
      ctx.stroke();

      // Alt taş kaide
      ctx.fillStyle = '#313642';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 6;
      ctx.fillRect(54, 336, 44, 38);
      ctx.strokeRect(54, 336, 44, 38);

      // Asılı cam fener kafesi
      ctx.fillStyle = pal.lanternGlow;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(126, 72);
      ctx.lineTo(162, 72);
      ctx.lineTo(156, 118);
      ctx.lineTo(132, 118);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Fener şapkası
      ctx.fillStyle = '#222633';
      ctx.beginPath();
      ctx.moveTo(118, 74);
      ctx.lineTo(144, 52);
      ctx.lineTo(170, 74);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Parlak iç alev çekirdeği
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.arc(144, 96, 10, 0, Math.PI * 2);
      ctx.fill();
    },
    anisotropy,
  );

  const lGeo = new THREE.PlaneGeometry(1.85, 3.7);
  lGeo.translate(0.15, 1.82, 0.05);
  const lMat = new THREE.MeshBasicMaterial({
    map: lanternTex,
    transparent: true,
    alphaTest: 0.04,
    depthWrite: false,
  });
  g.add(new THREE.Mesh(lGeo, lMat));

  // Fener çevresine yumuşak 2D atmosferik ışık halesi (AdditiveBlending)
  const haloTex = makeCanvasTex(128, 128, (ctx) => {
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, pal.lanternGlow);
    grad.addColorStop(0.35, 'rgba(255, 180, 72, 0.36)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  });

  const glowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.4),
    new THREE.MeshBasicMaterial({
      map: haloTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  glowMesh.position.set(0.62, 2.75, 0.12);
  g.add(glowMesh);

  return { group: g, glowMesh };
}

/* ============================================================================
 * 8. EL BOYAMASI KARANLIK FANTASTİK TAŞ YOL DOKUSU (ISLIK AY IŞIĞI & ÇATLAKLAR)
 * ============================================================================ */
export function createDarkFantasyRoadTex(
  theme: LevelTheme,
  isInterior: boolean | undefined,
  anisotropy: number,
  repeatX = 10,
): THREE.CanvasTexture {
  return makeCanvasTex(
    512,
    256,
    (ctx, w, h) => {
      if (isInterior) {
        // Kraliyet kadife halı + karanlık mermer kenarlık
        ctx.fillStyle = '#181c2c';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#5e111b';
        ctx.fillRect(0, 28, w, h - 56);
        ctx.fillStyle = '#7f1622';
        ctx.fillRect(0, 42, w, h - 84);

        // Altın işlemeli şeritler
        ctx.fillStyle = '#eab308';
        ctx.fillRect(0, 22, w, 12);
        ctx.fillRect(0, h - 34, w, 12);
        ctx.strokeStyle = '#140c10';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 22, w, 12);
        ctx.strokeRect(0, h - 34, w, 12);

        // Kraliyet baklava motifleri
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.lineWidth = 3;
        for (let x = 0; x < w; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x + 32, 62);
          ctx.lineTo(x + 56, 128);
          ctx.lineTo(x + 32, 194);
          ctx.lineTo(x + 8, 128);
          ctx.closePath();
          ctx.stroke();
        }
        return;
      }

      const stoneSet =
        theme === 'ice'
          ? ['#6ea9cf', '#5a94bc', '#82bddf', '#4e83a8']
          : theme === 'desert'
            ? ['#b8834b', '#a3703c', '#c9945a', '#8f5f30']
            : theme === 'pirate'
              ? ['#6e4f35', '#5e422b', '#7d5b3e', '#4f3622']
              : theme === 'graveyard'
                ? ['#483e5e', '#3c3350', '#54496e', '#312942']
                : theme === 'dragon'
                  ? ['#3a2528', '#2e1d20', '#4a2c2e', '#261719']
                  : theme === 'forest'
                    ? ['#3e4845', '#343e3b', '#48524e', '#2d3633']
                    : theme === 'market'
                      ? ['#61564d', '#524840', '#6d6055', '#463d36']
                      : ['#4d525e', '#404550', '#585e6b', '#353a44'];

      ctx.fillStyle = theme === 'dragon' ? '#6b140d' : theme === 'ice' ? '#254a6b' : '#14151b';
      ctx.fillRect(0, 0, w, h);

      // Üst kaldırım taşı şeridi (parlak ay ışığı kenarı)
      ctx.fillStyle =
        theme === 'ice'
          ? '#bfe8ff'
          : theme === 'desert'
            ? '#e5b97d'
            : theme === 'dragon'
              ? '#5c3434'
              : '#6b7280';
      ctx.fillRect(0, 0, w, 34);
      ctx.fillStyle = 'rgba(220, 238, 255, 0.2)';
      ctx.fillRect(0, 0, w, 8);
      ctx.strokeStyle = '#111116';
      ctx.lineWidth = 4;
      for (let x = 0; x < w; x += 64) {
        ctx.strokeRect(x, 0, 64, 34);
      }

      // El boyaması arnavut kaldırımı taşları
      const rows = 4;
      const rowH = (h - 34) / rows;
      for (let r = 0; r < rows; r++) {
        const y = 34 + r * rowH;
        const offset = (r % 2) * 44;
        for (let x = -44; x < w + 60; x += 88) {
          const sx = x + offset + 3;
          const sy = y + 3;
          const sw = 82;
          const sh = rowH - 6;

          const colIdx = Math.floor(hash(r * 17 + x * 0.3) * stoneSet.length);
          ctx.fillStyle = stoneSet[colIdx];
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, 6);
          ctx.fill();

          // Üst taş parlaklığı (ıslak ay ışığı hissi)
          ctx.fillStyle = 'rgba(215, 232, 250, 0.14)';
          ctx.fillRect(sx + 6, sy + 4, sw - 12, 6);

          // Alt taş gölgesi
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.fillRect(sx + 6, sy + sh - 8, sw - 12, 6);

          // İnce yosun / çatlak detayı
          if (hash(r * 31 + x) > 0.65) {
            ctx.fillStyle = 'rgba(54, 98, 62, 0.34)';
            ctx.beginPath();
            ctx.ellipse(sx + sw * 0.3, sy + 2, 16, 4, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.strokeStyle = '#121319';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, 6);
          ctx.stroke();
        }
      }
    },
    anisotropy,
    repeatX,
    1,
  );
}
