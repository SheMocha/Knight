import * as THREE from 'three';
import { SpecialNpcKind } from './types';

const INK = '#0a0910';

export interface SpecialNpcSpec {
  kind: SpecialNpcKind;
  label: string;
  forbidden: boolean;
  failTitle?: string;
  failReason?: string;
  width: number;
  height: number;
  speedMult: number;
  bonusGold: number;
  bonusPoints: number;
  badgeText: string;
  badgeColor: string;
}

const NPC_SPECS: Record<SpecialNpcKind, SpecialNpcSpec> = {
  princess: {
    kind: 'princess',
    label: 'Prenses',
    forbidden: true,
    failTitle: 'PRENSESİ ÖLDÜRDÜN!',
    failReason: 'Kraliyet Prensesine saldırdığın için bölüm hemen sona erdi.',
    width: 1.55,
    height: 2.35,
    speedMult: 0.88,
    bonusGold: 0,
    bonusPoints: 0,
    badgeText: 'DOKUNMA!',
    badgeColor: '#ef4444',
  },
  king: {
    kind: 'king',
    label: 'Kral',
    forbidden: true,
    failTitle: 'KRALA SALDIRDIN!',
    failReason: 'Krallığın hükümdarına vurduğun için bölüm anında başarısız oldu.',
    width: 1.7,
    height: 2.55,
    speedMult: 0.84,
    bonusGold: 0,
    bonusPoints: 0,
    badgeText: 'KRAL! VURMA',
    badgeColor: '#dc2626',
  },
  priest: {
    kind: 'priest',
    label: 'Rahip',
    forbidden: true,
    failTitle: 'KUTSAL GÖREVİ İHLAL ETTİN!',
    failReason: 'Masum rahibe saldırdığın için sefer anında iptal edildi.',
    width: 1.55,
    height: 2.4,
    speedMult: 0.9,
    bonusGold: 0,
    bonusPoints: 0,
    badgeText: 'DOKUNMA!',
    badgeColor: '#ef4444',
  },
  child: {
    kind: 'child',
    label: 'Köylü Çocuk',
    forbidden: true,
    failTitle: 'MASUM BİRİNE VURDUN!',
    failReason: 'Köylü çocuğa vurduğun için bölüm hemen sonlandırıldı.',
    width: 1.35,
    height: 1.85,
    speedMult: 1.05,
    bonusGold: 0,
    bonusPoints: 0,
    badgeText: 'MASUM! VURMA',
    badgeColor: '#ef4444',
  },
  gold_merchant: {
    kind: 'gold_merchant',
    label: 'Altın Tüccarı',
    forbidden: false,
    width: 1.75,
    height: 2.35,
    speedMult: 1.15,
    bonusGold: 85,
    bonusPoints: 185,
    badgeText: 'ALTIN +',
    badgeColor: '#facc15',
  },
  chicken: {
    kind: 'chicken',
    label: 'Tavuk',
    forbidden: false,
    width: 1.25,
    height: 1.25,
    speedMult: 1.32,
    bonusGold: 18,
    bonusPoints: 120,
    badgeText: 'Gıdak!',
    badgeColor: '#fb923c',
  },
  traveler: {
    kind: 'traveler',
    label: 'Gezgin',
    forbidden: false,
    width: 1.6,
    height: 2.35,
    speedMult: 1.02,
    bonusGold: 48,
    bonusPoints: 155,
    badgeText: 'SÜRPRİZ?',
    badgeColor: '#38bdf8',
  },
};

export function getSpecialNpcSpec(kind: SpecialNpcKind): SpecialNpcSpec {
  return NPC_SPECS[kind];
}

const npcTexCache = new Map<string, THREE.CanvasTexture>();

function makeNpcTex(kind: SpecialNpcKind): THREE.CanvasTexture {
  const key = `npc_${kind}`;
  const cached = npcTexCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const spec = NPC_SPECS[kind];
  const cx = 128;

  // Üstte okunaklı uyarı veya ödül rozeti (oyuncuya adil görsel sinyal)
  ctx.fillStyle = spec.forbidden ? 'rgba(127, 29, 29, 0.94)' : 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = spec.badgeColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(38, 12, 180, 38, 19);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = spec.forbidden ? '#fef2f2' : spec.badgeColor;
  ctx.font = '900 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(spec.badgeText, cx, 32);

  // Zemin gölgesi
  ctx.fillStyle = 'rgba(8, 7, 12, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, 302, 54, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;

  if (kind === 'chicken') {
    // Komik tombul çizgi film tavuğu
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(116, 260);
    ctx.lineTo(112, 294);
    ctx.moveTo(142, 260);
    ctx.lineTo(146, 294);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(134, 230, 52, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Kanat
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.ellipse(144, 232, 26, 16, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Baş + kırmızı ibik + sarı gaga (sola bakar)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(92, 186, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(88, 156, 11, 0, Math.PI * 2);
    ctx.arc(102, 158, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(68, 184);
    ctx.lineTo(44, 194);
    ctx.lineTo(68, 200);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0a0910';
    ctx.beginPath();
    ctx.arc(84, 182, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // İnsansı karakterler için ortak stilize gövde + benzersiz kraliyet / meslek kıyafetleri
    const isChild = kind === 'child';
    const topY = isChild ? 124 : 84;
    const headR = isChild ? 26 : 30;
    const bodyTop = topY + headR + 6;
    const bodyH = 296 - bodyTop;

    // Pelerin / elbise / cübbe
    if (kind === 'princess') {
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(cx - 24, bodyTop);
      ctx.lineTo(cx + 24, bodyTop);
      ctx.lineTo(cx + 68, 294);
      ctx.lineTo(cx - 68, 294);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.moveTo(cx, bodyTop + 10);
      ctx.lineTo(cx + 26, 294);
      ctx.lineTo(cx - 26, 294);
      ctx.closePath();
      ctx.fill();
    } else if (kind === 'king') {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(cx - 42, bodyTop);
      ctx.lineTo(cx + 42, bodyTop);
      ctx.lineTo(cx + 70, 294);
      ctx.lineTo(cx - 70, 294);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 48, bodyTop, 96, 24);
      ctx.strokeRect(cx - 48, bodyTop, 96, 24);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 10, bodyTop + 24, 20, bodyH - 24);
    } else if (kind === 'priest') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 34, bodyTop);
      ctx.lineTo(cx + 34, bodyTop);
      ctx.lineTo(cx + 52, 294);
      ctx.lineTo(cx - 52, 294);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 9, bodyTop + 24, 18, 72);
      ctx.fillRect(cx - 26, bodyTop + 42, 52, 16);
    } else if (kind === 'child') {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(cx - 32, bodyTop, 64, bodyH - 28, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx - 26, 266, 18, 28);
      ctx.fillRect(cx + 8, 266, 18, 28);
    } else if (kind === 'gold_merchant') {
      // Sırtında taşan dev altın çuvalı!
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(cx + 42, bodyTop + 48, 42, 54, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(cx + 34, bodyTop + 8, 16, 0, Math.PI * 2);
      ctx.arc(cx + 54, bodyTop + 14, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(cx - 42, bodyTop, 74, bodyH - 12, 16);
      ctx.fill();
      ctx.stroke();
    } else {
      // Gezgin (mavi-kahverengi pelerin + değnek)
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(cx - 34, bodyTop);
      ctx.lineTo(cx + 36, bodyTop);
      ctx.lineTo(cx + 56, 294);
      ctx.lineTo(cx - 46, 294);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 56, 118);
      ctx.lineTo(cx - 64, 294);
      ctx.stroke();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
    }

    // Baş
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(cx, topY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gözler
    ctx.fillStyle = '#0a0910';
    ctx.beginPath();
    ctx.arc(cx - 11, topY - 2, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + 4, topY - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Başlık / taç / şapka
    if (kind === 'princess' || kind === 'king') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - 26, topY - headR + 6);
      ctx.lineTo(cx - 20, topY - headR - 20);
      ctx.lineTo(cx, topY - headR - 4);
      ctx.lineTo(cx + 20, topY - headR - 20);
      ctx.lineTo(cx + 26, topY - headR + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (kind === 'king') {
        // Kral sakalı
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(cx - 2, topY + 22, 18, 0, Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    } else if (kind === 'priest') {
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(cx - 24, topY - headR + 8);
      ctx.lineTo(cx, topY - headR - 26);
      ctx.lineTo(cx + 24, topY - headR + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (kind === 'gold_merchant') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(cx, topY - headR + 4, 38, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (kind === 'traveler') {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(cx - 38, topY - headR + 8);
      ctx.lineTo(cx + 8, topY - headR - 24);
      ctx.lineTo(cx + 38, topY - headR + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (kind === 'child') {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, topY - 12, headR, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  npcTexCache.set(key, tex);
  return tex;
}

export function createSpecialNpcMesh(kind: SpecialNpcKind): THREE.Group {
  const spec = NPC_SPECS[kind];
  const tex = makeNpcTex(kind);
  const group = new THREE.Group();
  const planeH = spec.height * 1.25;
  const planeW = planeH * (256 / 320);
  const geo = new THREE.PlaneGeometry(planeW, planeH);
  geo.translate(0, planeH * 0.48, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  group.add(new THREE.Mesh(geo, mat));

  // Zemin aura halkası: Yasaklı NPC'ler kırmızı, Bonus NPC'ler altın-mavi parlar
  const ringGeo = new THREE.RingGeometry(0.62, 0.85, 22);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: spec.forbidden ? 0xef4444 : 0xfacc15,
    transparent: true,
    opacity: spec.forbidden ? 0.72 : 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.05;
  ring.name = 'npcAura';
  group.add(ring);

  return group;
}

export function disposeSpecialNpcCache(): void {
  npcTexCache.forEach((tex) => tex.dispose());
  npcTexCache.clear();
}
