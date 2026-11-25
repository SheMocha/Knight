import * as THREE from 'three';
import { BreakableKind } from './types';

const INK = '#0a0910';

export type BreakableAudioKind = 'wood' | 'ceramic' | 'metal' | 'magic' | 'ice' | 'explosion' | 'balloon' | 'firework' | 'ghost';

export type InteractiveEffectKind =
  | 'none'
  | 'tnt_blast'
  | 'balloon_gold_rain'
  | 'golden_statue_multi'
  | 'magic_chest_bonus'
  | 'beehive_swarm'
  | 'bird_nest_flock'
  | 'ice_shatter_slow'
  | 'pumpkin_coins'
  | 'firework_sky'
  | 'pirate_surprise'
  | 'bone_scatter'
  | 'ghost_release'
  | 'egg_spill';

export interface BreakableSpec {
  kind: BreakableKind;
  label: string;
  width: number;
  height: number;
  baseGold: number;
  basePoints: number;
  maxHits: number;
  floatY: number;
  bonusDropChance: number;
  audio: BreakableAudioKind;
  effect: InteractiveEffectKind;
  shatterColors: [number, number, number];
  isSpecialInteractive: boolean;
}

const SPECS: Record<BreakableKind, BreakableSpec> = {
  // Temel ahşap & seramik
  barrel: { kind: 'barrel', label: 'Fıçı', width: 1.5, height: 1.85, baseGold: 18, basePoints: 90, maxHits: 1, floatY: 0, bonusDropChance: 0.08, audio: 'wood', effect: 'none', shatterColors: [0x92400e, 0xb45309, 0x475569], isSpecialInteractive: false },
  crate: { kind: 'crate', label: 'Tahta Kasa', width: 1.6, height: 1.75, baseGold: 22, basePoints: 95, maxHits: 1, floatY: 0, bonusDropChance: 0.1, audio: 'wood', effect: 'none', shatterColors: [0xa16207, 0xca8a04, 0x713f12], isSpecialInteractive: false },
  wood_fence: { kind: 'wood_fence', label: 'Ahşap Çit', width: 2.0, height: 1.55, baseGold: 16, basePoints: 85, maxHits: 1, floatY: 0, bonusDropChance: 0.06, audio: 'wood', effect: 'none', shatterColors: [0x78350f, 0xb45309, 0x92400e], isSpecialInteractive: false },
  signpost: { kind: 'signpost', label: 'Yol Tabelası', width: 1.5, height: 2.25, baseGold: 20, basePoints: 95, maxHits: 1, floatY: 0, bonusDropChance: 0.08, audio: 'wood', effect: 'none', shatterColors: [0x92400e, 0xd97706, 0x451a03], isSpecialInteractive: false },
  hay_cart: { kind: 'hay_cart', label: 'Saman Arabası', width: 2.35, height: 1.95, baseGold: 28, basePoints: 120, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'wood', effect: 'none', shatterColors: [0xfacc15, 0xca8a04, 0x78350f], isSpecialInteractive: false },
  pottery: { kind: 'pottery', label: 'Seramik Küp', width: 1.45, height: 1.7, baseGold: 24, basePoints: 110, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'ceramic', effect: 'none', shatterColors: [0xc2410c, 0xfb923c, 0xfef3c7], isSpecialInteractive: false },

  // Pazar & kasaba
  stall: { kind: 'stall', label: 'Pazar Tezgâhı', width: 2.5, height: 2.55, baseGold: 36, basePoints: 145, maxHits: 1, floatY: 0, bonusDropChance: 0.18, audio: 'wood', effect: 'none', shatterColors: [0xb91c1c, 0xfef3c7, 0x92400e], isSpecialInteractive: false },
  apple_basket: { kind: 'apple_basket', label: 'Elma Sepeti', width: 1.55, height: 1.55, baseGold: 24, basePoints: 110, maxHits: 1, floatY: 0, bonusDropChance: 0.12, audio: 'wood', effect: 'none', shatterColors: [0xdc2626, 0x22c55e, 0xb45309], isSpecialInteractive: false },
  bread_basket: { kind: 'bread_basket', label: 'Ekmek Sepeti', width: 1.6, height: 1.55, baseGold: 24, basePoints: 110, maxHits: 1, floatY: 0, bonusDropChance: 0.12, audio: 'wood', effect: 'none', shatterColors: [0xf59e0b, 0xfde68a, 0x92400e], isSpecialInteractive: false },
  fish_crate: { kind: 'fish_crate', label: 'Balık Kasası', width: 1.75, height: 1.6, baseGold: 26, basePoints: 115, maxHits: 1, floatY: 0, bonusDropChance: 0.12, audio: 'wood', effect: 'none', shatterColors: [0x38bdf8, 0x94a3b8, 0x78350f], isSpecialInteractive: false },
  flour_sack: { kind: 'flour_sack', label: 'Un Çuvalı', width: 1.5, height: 1.65, baseGold: 20, basePoints: 100, maxHits: 1, floatY: 0, bonusDropChance: 0.1, audio: 'ceramic', effect: 'none', shatterColors: [0xf8fafc, 0xe2e8f0, 0xd6d3d1], isSpecialInteractive: false },

  // Hazine & kraliyet
  chest: { kind: 'chest', label: 'Hazine Sandığı', width: 1.8, height: 1.65, baseGold: 48, basePoints: 175, maxHits: 1, floatY: 0, bonusDropChance: 0.25, audio: 'metal', effect: 'none', shatterColors: [0xfacc15, 0x78350f, 0xfef08a], isSpecialInteractive: false },
  special_treasure: { kind: 'special_treasure', label: 'Kraliyet Hazinesi', width: 2.0, height: 2.0, baseGold: 74, basePoints: 215, maxHits: 1, floatY: 0, bonusDropChance: 0.35, audio: 'magic', effect: 'none', shatterColors: [0xef4444, 0xfacc15, 0x38bdf8], isSpecialInteractive: false },
  jewel_box: { kind: 'jewel_box', label: 'Mücevher Kutusu', width: 1.65, height: 1.6, baseGold: 56, basePoints: 190, maxHits: 1, floatY: 0, bonusDropChance: 0.28, audio: 'magic', effect: 'none', shatterColors: [0xc084fc, 0x38bdf8, 0xfacc15], isSpecialInteractive: false },

  // Orman
  mushroom: { kind: 'mushroom', label: 'Dev Mantar', width: 1.6, height: 1.85, baseGold: 22, basePoints: 95, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'magic', effect: 'none', shatterColors: [0xef4444, 0xfef2f2, 0x4ade80], isSpecialInteractive: false },
  stump: { kind: 'stump', label: 'Ağaç Kütüğü', width: 1.75, height: 1.5, baseGold: 20, basePoints: 100, maxHits: 1, floatY: 0, bonusDropChance: 0.09, audio: 'wood', effect: 'none', shatterColors: [0x713f12, 0x4d7c0f, 0x451a03], isSpecialInteractive: false },
  magic_plant: { kind: 'magic_plant', label: 'Büyülü Bitki', width: 1.65, height: 1.95, baseGold: 30, basePoints: 135, maxHits: 1, floatY: 0, bonusDropChance: 0.2, audio: 'magic', effect: 'none', shatterColors: [0x34d399, 0x2dd4bf, 0xa78bfa], isSpecialInteractive: false },

  // Kale & şövalye
  banner_stand: { kind: 'banner_stand', label: 'Sancak Standı', width: 1.65, height: 2.6, baseGold: 28, basePoints: 120, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'metal', effect: 'none', shatterColors: [0x991b1b, 0xfacc15, 0x64748b], isSpecialInteractive: false },
  shield_stand: { kind: 'shield_stand', label: 'Kalkan Standı', width: 1.75, height: 2.1, baseGold: 32, basePoints: 140, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'metal', effect: 'none', shatterColors: [0x94a3b8, 0x3b82f6, 0xfacc15], isSpecialInteractive: false },
  weapon_rack: { kind: 'weapon_rack', label: 'Silah Rafı', width: 1.95, height: 2.2, baseGold: 34, basePoints: 145, maxHits: 1, floatY: 0, bonusDropChance: 0.15, audio: 'metal', effect: 'none', shatterColors: [0xcbd5e1, 0x64748b, 0x78350f], isSpecialInteractive: false },
  armor_dummy: { kind: 'armor_dummy', label: 'Zırh Mankeni', width: 1.65, height: 2.4, baseGold: 38, basePoints: 160, maxHits: 1, floatY: 0, bonusDropChance: 0.16, audio: 'metal', effect: 'none', shatterColors: [0x94a3b8, 0xe2e8f0, 0xdc2626], isSpecialInteractive: false },

  // Buz krallığı
  ice_chest: { kind: 'ice_chest', label: 'Buz Sandığı', width: 1.8, height: 1.7, baseGold: 48, basePoints: 175, maxHits: 1, floatY: 0, bonusDropChance: 0.24, audio: 'ice', effect: 'none', shatterColors: [0x38bdf8, 0xbae6fd, 0xfacc15], isSpecialInteractive: false },
  ice_statue: { kind: 'ice_statue', label: 'Buz Heykeli', width: 1.7, height: 2.45, baseGold: 44, basePoints: 180, maxHits: 1, floatY: 0, bonusDropChance: 0.18, audio: 'ice', effect: 'none', shatterColors: [0x7dd3fc, 0xe0f2fe, 0x0284c7], isSpecialInteractive: false },
  snow_globe: { kind: 'snow_globe', label: 'Kar Küresi', width: 1.65, height: 1.85, baseGold: 38, basePoints: 155, maxHits: 1, floatY: 0, bonusDropChance: 0.2, audio: 'ice', effect: 'none', shatterColors: [0xf0f9ff, 0x38bdf8, 0xf59e0b], isSpecialInteractive: false },

  // Çöl krallığı
  cactus: { kind: 'cactus', label: 'Çöl Kaktüsü', width: 1.6, height: 2.25, baseGold: 26, basePoints: 120, maxHits: 1, floatY: 0, bonusDropChance: 0.1, audio: 'wood', effect: 'none', shatterColors: [0x16a34a, 0x4ade80, 0xfacc15], isSpecialInteractive: false },
  sand_sack: { kind: 'sand_sack', label: 'Kum Çuvalı', width: 1.6, height: 1.6, baseGold: 24, basePoints: 105, maxHits: 1, floatY: 0, bonusDropChance: 0.12, audio: 'ceramic', effect: 'none', shatterColors: [0xeab308, 0xd97706, 0xfef3c7], isSpecialInteractive: false },
  ancient_vase: { kind: 'ancient_vase', label: 'Antik Vazo', width: 1.55, height: 2.05, baseGold: 42, basePoints: 165, maxHits: 1, floatY: 0, bonusDropChance: 0.2, audio: 'ceramic', effect: 'none', shatterColors: [0xd97706, 0xfacc15, 0x0ea5e9], isSpecialInteractive: false },

  // Korsan limanı
  fishing_net: { kind: 'fishing_net', label: 'Balık Ağı', width: 1.9, height: 1.7, baseGold: 26, basePoints: 120, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'wood', effect: 'none', shatterColors: [0x2dd4bf, 0xd6d3d1, 0x38bdf8], isSpecialInteractive: false },
  rope_spool: { kind: 'rope_spool', label: 'Halat Makarası', width: 1.65, height: 1.7, baseGold: 26, basePoints: 115, maxHits: 1, floatY: 0, bonusDropChance: 0.1, audio: 'wood', effect: 'none', shatterColors: [0xd97706, 0x92400e, 0xfde68a], isSpecialInteractive: false },

  // Lanetli mezarlık
  tombstone: { kind: 'tombstone', label: 'Mezar Taşı', width: 1.65, height: 2.2, baseGold: 32, basePoints: 135, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'ceramic', effect: 'none', shatterColors: [0x64748b, 0xa855f7, 0x334155], isSpecialInteractive: false },
  broken_coffin: { kind: 'broken_coffin', label: 'Eski Tabut', width: 1.85, height: 2.1, baseGold: 38, basePoints: 155, maxHits: 1, floatY: 0, bonusDropChance: 0.18, audio: 'wood', effect: 'none', shatterColors: [0x4c1d95, 0x78350f, 0xc084fc], isSpecialInteractive: false },

  // Ejderha kalesi
  lava_rock: { kind: 'lava_rock', label: 'Lav Kayası', width: 1.8, height: 1.85, baseGold: 36, basePoints: 160, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'ceramic', effect: 'none', shatterColors: [0xef4444, 0xf97316, 0x27272a], isSpecialInteractive: false },
  dragon_egg: { kind: 'dragon_egg', label: 'Ejderha Yumurtası', width: 1.65, height: 2.0, baseGold: 62, basePoints: 200, maxHits: 1, floatY: 0, bonusDropChance: 0.28, audio: 'ceramic', effect: 'none', shatterColors: [0xdc2626, 0xfacc15, 0xfb923c], isSpecialInteractive: false },
  fire_crystal: { kind: 'fire_crystal', label: 'Ateş Kristali', width: 1.6, height: 2.25, baseGold: 52, basePoints: 185, maxHits: 1, floatY: 0, bonusDropChance: 0.24, audio: 'ice', effect: 'none', shatterColors: [0xf97316, 0xfef08a, 0xdc2626], isSpecialInteractive: false },
  dark_chest: { kind: 'dark_chest', label: 'Karanlık Sandık', width: 1.9, height: 1.8, baseGold: 72, basePoints: 225, maxHits: 1, floatY: 0, bonusDropChance: 0.32, audio: 'metal', effect: 'none', shatterColors: [0x7c3aed, 0xef4444, 0xfacc15], isSpecialInteractive: false },

  // === 13 ÖZEL ETKİLEŞİMLİ NESNE ===
  tnt_crate: { kind: 'tnt_crate', label: 'TNT Sandığı', width: 1.75, height: 1.8, baseGold: 34, basePoints: 165, maxHits: 1, floatY: 0, bonusDropChance: 0.14, audio: 'explosion', effect: 'tnt_blast', shatterColors: [0xef4444, 0xf97316, 0xfde047], isSpecialInteractive: true },
  balloon: { kind: 'balloon', label: 'Altın Balon', width: 1.55, height: 2.55, baseGold: 42, basePoints: 130, maxHits: 1, floatY: 0.75, bonusDropChance: 0.16, audio: 'balloon', effect: 'balloon_gold_rain', shatterColors: [0xef4444, 0xfacc15, 0x38bdf8], isSpecialInteractive: true },
  golden_statue: { kind: 'golden_statue', label: 'Altın Heykel', width: 1.8, height: 2.55, baseGold: 95, basePoints: 250, maxHits: 3, floatY: 0, bonusDropChance: 0.42, audio: 'metal', effect: 'golden_statue_multi', shatterColors: [0xfacc15, 0xfef08a, 0xd97706], isSpecialInteractive: true },
  magic_chest: { kind: 'magic_chest', label: 'Sihirli Sandık', width: 1.9, height: 1.85, baseGold: 55, basePoints: 185, maxHits: 1, floatY: 0, bonusDropChance: 1.0, audio: 'magic', effect: 'magic_chest_bonus', shatterColors: [0xa855f7, 0x38bdf8, 0xfacc15], isSpecialInteractive: true },
  beehive: { kind: 'beehive', label: 'Arı Kovanı', width: 1.6, height: 1.9, baseGold: 30, basePoints: 150, maxHits: 1, floatY: 0.15, bonusDropChance: 0.18, audio: 'wood', effect: 'beehive_swarm', shatterColors: [0xfacc15, 0xd97706, 0x18181b], isSpecialInteractive: true },
  bird_nest: { kind: 'bird_nest', label: 'Kuş Yuvası', width: 1.65, height: 1.7, baseGold: 26, basePoints: 135, maxHits: 1, floatY: 0.1, bonusDropChance: 0.15, audio: 'wood', effect: 'bird_nest_flock', shatterColors: [0x92400e, 0x38bdf8, 0xfef3c7], isSpecialInteractive: true },
  ice_block: { kind: 'ice_block', label: 'Buz Bloğu', width: 1.8, height: 1.95, baseGold: 34, basePoints: 155, maxHits: 1, floatY: 0, bonusDropChance: 0.16, audio: 'ice', effect: 'ice_shatter_slow', shatterColors: [0x38bdf8, 0xe0f2fe, 0x0284c7], isSpecialInteractive: true },
  pumpkin: { kind: 'pumpkin', label: 'Altın Kabak', width: 1.65, height: 1.65, baseGold: 46, basePoints: 145, maxHits: 1, floatY: 0, bonusDropChance: 0.2, audio: 'ceramic', effect: 'pumpkin_coins', shatterColors: [0xf97316, 0xfacc15, 0x16a34a], isSpecialInteractive: true },
  firework_box: { kind: 'firework_box', label: 'Havai Fişek Kutusu', width: 1.7, height: 1.95, baseGold: 36, basePoints: 175, maxHits: 1, floatY: 0, bonusDropChance: 0.22, audio: 'firework', effect: 'firework_sky', shatterColors: [0xec4899, 0x38bdf8, 0xfacc15], isSpecialInteractive: true },
  pirate_barrel: { kind: 'pirate_barrel', label: 'Korsan Fıçısı', width: 1.65, height: 1.9, baseGold: 44, basePoints: 155, maxHits: 1, floatY: 0, bonusDropChance: 0.45, audio: 'wood', effect: 'pirate_surprise', shatterColors: [0x78350f, 0xfacc15, 0x2dd4bf], isSpecialInteractive: true },
  bone_pile: { kind: 'bone_pile', label: 'Kemik Yığını', width: 1.8, height: 1.55, baseGold: 32, basePoints: 140, maxHits: 1, floatY: 0, bonusDropChance: 0.16, audio: 'ceramic', effect: 'bone_scatter', shatterColors: [0xf8fafc, 0xd6d3d1, 0xa855f7], isSpecialInteractive: true },
  ghost_jar: { kind: 'ghost_jar', label: 'Hayalet Kavanozu', width: 1.55, height: 2.0, baseGold: 42, basePoints: 170, maxHits: 1, floatY: 0, bonusDropChance: 0.26, audio: 'ghost', effect: 'ghost_release', shatterColors: [0x5eead4, 0xc084fc, 0xe0f2fe], isSpecialInteractive: true },
  egg_basket: { kind: 'egg_basket', label: 'Yumurta Sepeti', width: 1.65, height: 1.55, baseGold: 30, basePoints: 130, maxHits: 1, floatY: 0, bonusDropChance: 0.16, audio: 'ceramic', effect: 'egg_spill', shatterColors: [0xfef3c7, 0xfacc15, 0xb45309], isSpecialInteractive: true },
};

export function getBreakableSpec(kind: BreakableKind): BreakableSpec {
  return SPECS[kind] || SPECS.barrel;
}

const breakableTexCache = new Map<string, THREE.CanvasTexture>();

function makeBreakableTex(
  key: string,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const cached = breakableTexCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, 256, 256);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  breakableTexCache.set(key, tex);
  return tex;
}

function drawGroundShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(8, 7, 12, 0.36)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color = '#fef08a'): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.3, y - r * 0.3);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.3, y + r * 0.3);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.3, y + r * 0.3);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.3, y - r * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawBreakableArt(ctx: CanvasRenderingContext2D, kind: BreakableKind): void {
  const cx = 128;
  const baseY = 232;
  drawGroundShadow(ctx, cx, baseY + 4, 72, 14);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 7;

  switch (kind) {
    case 'tnt_crate': {
      // Kırmızı çizgili TNT sandığı + yanan fitil
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.roundRect(46, 78, 164, 152, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(50, 78, 156, 22);
      ctx.fillRect(50, 208, 156, 22);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(54, 122, 148, 56);
      ctx.strokeRect(54, 122, 148, 56);
      ctx.fillStyle = '#111827';
      ctx.font = '900 42px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TNT', cx, 152);
      // Yanan fitil & kıvılcım
      ctx.strokeStyle = '#d6d3d1';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, 78);
      ctx.quadraticCurveTo(cx + 18, 42, cx + 44, 44);
      ctx.stroke();
      drawSparkle(ctx, cx + 48, 42, 22, '#facc15');
      drawSparkle(ctx, cx + 48, 42, 11, '#ef4444');
      break;
    }

    case 'balloon': {
      // Parlak altın-kırmızı uçan balon + altın kesesi ipi
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, 152);
      ctx.quadraticCurveTo(cx - 12, 188, cx + 6, 226);
      ctx.stroke();
      const g = ctx.createRadialGradient(cx - 22, 66, 12, cx, 88, 72);
      g.addColorStop(0, '#fde047');
      g.addColorStop(0.55, '#f97316');
      g.addColorStop(1, '#dc2626');
      ctx.fillStyle = g;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(cx, 86, 56, 66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Parıltı & altın sembol
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(cx - 20, 62, 12, 20, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef9c3';
      ctx.font = '900 40px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', cx + 4, 92);
      break;
    }

    case 'golden_statue': {
      // Görkemli 3-vuruşluk Altın Şövalye Heykeli
      ctx.fillStyle = '#78350f';
      ctx.fillRect(58, 198, 140, 34);
      ctx.strokeRect(58, 198, 140, 34);
      const gg = ctx.createLinearGradient(70, 30, 190, 205);
      gg.addColorStop(0, '#fef9c3');
      gg.addColorStop(0.4, '#facc15');
      gg.addColorStop(1, '#b45309');
      ctx.fillStyle = gg;
      // Gövde & pelerin
      ctx.beginPath();
      ctx.roundRect(84, 92, 88, 108, 16);
      ctx.fill();
      ctx.stroke();
      // Miğfer baş & taç
      ctx.beginPath();
      ctx.arc(cx, 66, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(98, 46);
      ctx.lineTo(106, 20);
      ctx.lineTo(128, 36);
      ctx.lineTo(150, 20);
      ctx.lineTo(158, 46);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawSparkle(ctx, 64, 58, 18);
      drawSparkle(ctx, 194, 118, 16);
      break;
    }

    case 'magic_chest': {
      // Parlayan mor-mavi büyülü bonus sandığı
      const mg = ctx.createRadialGradient(cx, 138, 14, cx, 138, 105);
      mg.addColorStop(0, 'rgba(192, 132, 252, 0.55)');
      mg.addColorStop(1, 'rgba(192, 132, 252, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(cx, 138, 105, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.roundRect(42, 104, 172, 126, 14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.roundRect(38, 76, 180, 52, 18);
      ctx.fill();
      ctx.stroke();
      // Altın şeritler ve büyülü kristal kilit
      ctx.fillStyle = '#facc15';
      ctx.fillRect(66, 76, 22, 154);
      ctx.fillRect(168, 76, 22, 154);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx, 108);
      ctx.lineTo(cx + 20, 136);
      ctx.lineTo(cx, 164);
      ctx.lineTo(cx - 20, 136);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawSparkle(ctx, 56, 54, 16, '#38bdf8');
      drawSparkle(ctx, 204, 60, 18, '#fde047');
      break;
    }

    case 'beehive': {
      // Altın bal damlayan çizgi film arı kovanı
      const layers = [
        [cx, 198, 56, 26],
        [cx, 164, 68, 28],
        [cx, 128, 62, 26],
        [cx, 96, 46, 24],
        [cx, 70, 28, 18],
      ];
      for (const [lx, ly, rx, ry] of layers) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(lx, ly, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(cx, 160, 16, 0, Math.PI * 2);
      ctx.fill();
      // İki minik arı
      for (const [bx, by] of [[56, 86], [202, 114]]) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(bx, by, 13, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#18181b';
        ctx.fillRect(bx - 3, by - 8, 6, 16);
      }
      break;
    }

    case 'bird_nest': {
      // Dal örgülü kuş yuvası + 2 şirin mavi kuş kafası
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(cx, 184, 78, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.ellipse(cx, 168, 56, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // 2 kuş yavrusu
      for (const [bx, col] of [[cx - 24, '#38bdf8'], [cx + 22, '#facc15']] as [number, string][]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(bx, 136, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(bx + 12, 132);
        ctx.lineTo(bx + 30, 138);
        ctx.lineTo(bx + 12, 144);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#0a0910';
        ctx.beginPath();
        ctx.arc(bx + 4, 130, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'ice_block': {
      // Parlak kristal buz bloğu (içinde donmuş altın)
      const ig = ctx.createLinearGradient(46, 56, 206, 228);
      ig.addColorStop(0, '#e0f2fe');
      ig.addColorStop(0.5, '#38bdf8');
      ig.addColorStop(1, '#0284c7');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.roundRect(46, 66, 164, 164, 18);
      ctx.fill();
      ctx.stroke();
      // İç donmuş yıldız & kırık çizgileri
      drawSparkle(ctx, cx, 148, 32, '#fef08a');
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(64, 90);
      ctx.lineTo(106, 134);
      ctx.moveTo(156, 84);
      ctx.lineTo(188, 118);
      ctx.stroke();
      break;
    }

    case 'pumpkin': {
      // Dolgun turuncu balkabağı + altın parıltılı sap
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.roundRect(cx - 10, 56, 20, 40, 8);
      ctx.fill();
      ctx.stroke();
      for (const ox of [-38, 38, 0]) {
        ctx.fillStyle = ox === 0 ? '#fb923c' : '#ea580c';
        ctx.beginPath();
        ctx.ellipse(cx + ox, 158, 44, 68, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      drawSparkle(ctx, cx + 44, 86, 16, '#fde047');
      break;
    }

    case 'firework_box': {
      // Renkli havai fişek roketleri fırlamaya hazır sandık
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect(52, 116, 152, 114, 10);
      ctx.fill();
      ctx.stroke();
      // 3 renkli roket
      const rockets: [number, string][] = [
        [cx - 38, '#ec4899'],
        [cx, '#facc15'],
        [cx + 38, '#22d3ee'],
      ];
      for (const [rx, col] of rockets) {
        ctx.fillStyle = col;
        ctx.fillRect(rx - 14, 64, 28, 62);
        ctx.strokeRect(rx - 14, 64, 28, 62);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(rx - 18, 66);
        ctx.lineTo(rx, 32);
        ctx.lineTo(rx + 18, 66);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      drawSparkle(ctx, cx, 174, 22, '#fde047');
      break;
    }

    case 'pirate_barrel': {
      // Kuru kafalı korsan ganimet fıçısı
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.ellipse(cx, 148, 66, 82, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillRect(62, 104, 132, 16);
      ctx.fillRect(62, 182, 132, 16);
      ctx.strokeRect(62, 104, 132, 16);
      ctx.strokeRect(62, 182, 132, 16);
      // Kuru kafa amblemi
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, 146, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 8, 144, 5, 0, Math.PI * 2);
      ctx.arc(cx + 8, 144, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bone_pile': {
      // Karikatür kemik yığını ve kafatası
      ctx.fillStyle = '#f1f5f9';
      for (const [bx, by, rot] of [
        [96, 198, -0.35],
        [156, 200, 0.3],
        [124, 174, 0.1],
        [114, 152, -0.45],
      ]) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(rot);
        ctx.fillRect(-44, -10, 88, 20);
        ctx.strokeRect(-44, -10, 88, 20);
        ctx.beginPath();
        ctx.arc(-44, -8, 10, 0, Math.PI * 2);
        ctx.arc(-44, 8, 10, 0, Math.PI * 2);
        ctx.arc(44, -8, 10, 0, Math.PI * 2);
        ctx.arc(44, 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(cx, 128, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(cx - 10, 126, 6, 0, Math.PI * 2);
      ctx.arc(cx + 10, 126, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'ghost_jar': {
      // Parlayan turkuaz hayalet kavanozu
      const gg = ctx.createRadialGradient(cx, 150, 10, cx, 150, 92);
      gg.addColorStop(0, 'rgba(94, 234, 212, 0.55)');
      gg.addColorStop(1, 'rgba(94, 234, 212, 0)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(cx, 150, 92, 0, Math.PI * 2);
      ctx.fill();
      // Cam gövde
      ctx.fillStyle = 'rgba(186, 230, 253, 0.42)';
      ctx.beginPath();
      ctx.roundRect(68, 76, 120, 154, 28);
      ctx.fill();
      ctx.stroke();
      // Mantar tıpa
      ctx.fillStyle = '#92400e';
      ctx.fillRect(88, 46, 80, 34);
      ctx.strokeRect(88, 46, 80, 34);
      // İçeride şirin parlayan hayalet
      ctx.fillStyle = '#99f6e4';
      ctx.beginPath();
      ctx.arc(cx, 146, 32, Math.PI, 0);
      ctx.lineTo(cx + 32, 198);
      ctx.lineTo(cx + 14, 184);
      ctx.lineTo(cx, 198);
      ctx.lineTo(cx - 14, 184);
      ctx.lineTo(cx - 32, 198);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx - 10, 144, 5, 0, Math.PI * 2);
      ctx.arc(cx + 10, 144, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'egg_basket': {
      // Hasır sepet dolu beyaz & altın yumurtalar
      for (const [ex, ey, col] of [
        [92, 134, '#fef9c3'],
        [128, 124, '#fde047'],
        [164, 136, '#ffffff'],
      ] as [number, number, string][]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 22, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(52, 146);
      ctx.lineTo(204, 146);
      ctx.lineTo(186, 226);
      ctx.lineTo(70, 226);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'wood_fence': {
      ctx.fillStyle = '#92400e';
      for (const px of [58, 104, 150, 196]) {
        ctx.beginPath();
        ctx.moveTo(px - 16, 230);
        ctx.lineTo(px - 16, 108);
        ctx.lineTo(px, 82);
        ctx.lineTo(px + 16, 108);
        ctx.lineTo(px + 16, 230);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#78350f';
      ctx.fillRect(36, 134, 184, 22);
      ctx.strokeRect(36, 134, 184, 22);
      ctx.fillRect(36, 186, 184, 22);
      ctx.strokeRect(36, 186, 184, 22);
      break;
    }

    case 'signpost': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(114, 68, 28, 162);
      ctx.strokeRect(114, 68, 28, 162);
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(46, 86);
      ctx.lineTo(190, 86);
      ctx.lineTo(216, 112);
      ctx.lineTo(190, 138);
      ctx.lineTo(46, 138);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'apple_basket':
    case 'bread_basket': {
      const isApple = kind === 'apple_basket';
      for (const [ox, oy] of [[-32, 134], [0, 122], [32, 134], [-16, 142], [18, 142]]) {
        ctx.fillStyle = isApple ? '#dc2626' : '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(cx + ox, oy, isApple ? 22 : 26, isApple ? 20 : 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.moveTo(50, 146);
      ctx.lineTo(206, 146);
      ctx.lineTo(186, 228);
      ctx.lineTo(70, 228);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'fish_crate': {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(104, 118, 36, 18, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(154, 116, 36, 18, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(46, 128, 164, 102);
      ctx.strokeRect(46, 128, 164, 102);
      break;
    }

    case 'flour_sack':
    case 'sand_sack': {
      ctx.fillStyle = kind === 'flour_sack' ? '#f5f5f4' : '#eab308';
      ctx.beginPath();
      ctx.ellipse(cx, 162, 62, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(92, 86, 72, 18);
      ctx.strokeRect(92, 86, 72, 18);
      break;
    }

    case 'jewel_box': {
      ctx.fillStyle = '#7e22ce';
      ctx.beginPath();
      ctx.roundRect(52, 112, 152, 118, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(52, 144, 152, 18);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(cx, 74);
      ctx.lineTo(cx + 28, 112);
      ctx.lineTo(cx - 28, 112);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      drawSparkle(ctx, 180, 82, 18);
      break;
    }

    case 'mushroom': {
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.roundRect(96, 134, 64, 96, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, 134, 78, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      for (const [dx, dy, dr] of [[-32, 98, 12], [18, 86, 14], [44, 114, 10]]) {
        ctx.beginPath();
        ctx.arc(cx + dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'stump': {
      ctx.fillStyle = '#713f12';
      ctx.beginPath();
      ctx.moveTo(54, 228);
      ctx.lineTo(74, 118);
      ctx.lineTo(182, 118);
      ctx.lineTo(202, 228);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(cx, 118, 56, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'magic_plant': {
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(90, 174, 34, 54, -0.45, 0, Math.PI * 2);
      ctx.ellipse(166, 174, 34, 54, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2dd4bf';
      ctx.beginPath();
      ctx.arc(cx, 112, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      drawSparkle(ctx, cx, 112, 22, '#fef08a');
      break;
    }

    case 'shield_stand':
    case 'weapon_rack':
    case 'armor_dummy': {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(114, 74, 28, 156);
      ctx.strokeRect(114, 74, 28, 156);
      if (kind === 'shield_stand') {
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.moveTo(74, 92);
        ctx.lineTo(182, 92);
        ctx.lineTo(176, 166);
        ctx.lineTo(cx, 206);
        ctx.lineTo(80, 166);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(118, 96, 20, 96);
      } else if (kind === 'weapon_rack') {
        ctx.fillStyle = '#cbd5e1';
        for (const sx of [78, 128, 178]) {
          ctx.fillRect(sx - 8, 56, 16, 134);
          ctx.strokeRect(sx - 8, 56, 16, 134);
        }
        ctx.fillStyle = '#92400e';
        ctx.fillRect(46, 164, 164, 24);
        ctx.strokeRect(46, 164, 164, 24);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(80, 96, 96, 98, 18);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, 66, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(cx, 38, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    }

    case 'ice_chest':
    case 'ice_statue':
    case 'snow_globe': {
      ctx.fillStyle = '#38bdf8';
      if (kind === 'ice_chest') {
        ctx.beginPath();
        ctx.roundRect(48, 108, 160, 122, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(48, 94, 160, 34);
        ctx.strokeRect(48, 94, 160, 34);
      } else if (kind === 'ice_statue') {
        ctx.beginPath();
        ctx.moveTo(74, 228);
        ctx.lineTo(94, 104);
        ctx.lineTo(cx, 36);
        ctx.lineTo(162, 104);
        ctx.lineTo(182, 228);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(68, 184, 120, 44);
        ctx.strokeRect(68, 184, 120, 44);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.78)';
        ctx.beginPath();
        ctx.arc(cx, 126, 66, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        drawSparkle(ctx, cx, 120, 20, '#ffffff');
      }
      break;
    }

    case 'cactus': {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.roundRect(102, 54, 52, 176, 26);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(56, 104, 48, 30, 14);
      ctx.roundRect(56, 74, 28, 56, 14);
      ctx.roundRect(152, 122, 48, 30, 14);
      ctx.roundRect(172, 90, 28, 56, 14);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'ancient_vase': {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(cx, 156, 56, 70, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.fillRect(92, 60, 72, 32);
      ctx.strokeRect(92, 60, 72, 32);
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(74, 144, 108, 22);
      break;
    }

    case 'fishing_net':
    case 'rope_spool': {
      ctx.fillStyle = kind === 'fishing_net' ? '#2dd4bf' : '#d97706';
      ctx.beginPath();
      ctx.roundRect(52, 92, 152, 136, 16);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 4;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(62, 114 + i * 28);
        ctx.lineTo(194, 114 + i * 28);
        ctx.stroke();
      }
      break;
    }

    case 'tombstone':
    case 'broken_coffin': {
      ctx.fillStyle = kind === 'tombstone' ? '#475569' : '#581c87';
      ctx.beginPath();
      ctx.moveTo(64, 228);
      ctx.lineTo(64, 116);
      ctx.quadraticCurveTo(cx, 44, 192, 116);
      ctx.lineTo(192, 228);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(118, 108, 20, 68);
      ctx.fillRect(98, 128, 60, 18);
      break;
    }

    case 'lava_rock':
    case 'dragon_egg':
    case 'fire_crystal':
    case 'dark_chest': {
      if (kind === 'lava_rock') {
        ctx.fillStyle = '#27272a';
        ctx.beginPath();
        ctx.moveTo(46, 226);
        ctx.lineTo(74, 96);
        ctx.lineTo(cx, 66);
        ctx.lineTo(186, 108);
        ctx.lineTo(210, 226);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(106, 98);
        ctx.lineTo(126, 146);
        ctx.lineTo(102, 198);
        ctx.stroke();
      } else if (kind === 'dragon_egg') {
        const dg = ctx.createRadialGradient(110, 120, 12, cx, 148, 86);
        dg.addColorStop(0, '#fbbf24');
        dg.addColorStop(0.55, '#dc2626');
        dg.addColorStop(1, '#450a0a');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.ellipse(cx, 152, 58, 76, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        drawSparkle(ctx, cx, 134, 18, '#fef08a');
      } else if (kind === 'fire_crystal') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(cx, 38);
        ctx.lineTo(182, 132);
        ctx.lineTo(156, 228);
        ctx.lineTo(100, 228);
        ctx.lineTo(74, 132);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        drawSparkle(ctx, cx, 124, 24, '#fef9c3');
      } else {
        ctx.fillStyle = '#3b0764';
        ctx.beginPath();
        ctx.roundRect(44, 102, 168, 128, 14);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(44, 138, 168, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(114, 126, 28, 46);
        ctx.strokeRect(114, 126, 28, 46);
      }
      break;
    }

    default: {
      // Fallback: standart ahşap fıçı
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.ellipse(cx, 148, 62, 80, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillRect(66, 106, 124, 16);
      ctx.fillRect(66, 182, 124, 16);
      break;
    }
  }
}

export function createCatalogBreakableMesh(kind: BreakableKind): THREE.Group {
  const spec = getBreakableSpec(kind);
  const tex = makeBreakableTex(`brk_${kind}`, (ctx) => drawBreakableArt(ctx, kind));
  const group = new THREE.Group();
  const visualScale = kind === 'stall' ? 1.38 : 1.72;
  const planeW = spec.width * visualScale;
  const planeH = spec.height * visualScale;
  const geo = new THREE.PlaneGeometry(planeW, planeH);
  geo.translate(0, planeH * 0.46, 0);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  // Özel etkileşimli objelerin altına belirgin parıltı halkası ekle
  if (spec.isSpecialInteractive) {
    const ringGeo = new THREE.RingGeometry(0.76, 1.06, 22);
    ringGeo.rotateX(-Math.PI / 2);
    const ringColor =
      kind === 'tnt_crate'
        ? 0xef4444
        : kind === 'ice_block'
          ? 0x38bdf8
          : kind === 'ghost_jar'
            ? 0x5eead4
            : 0xfacc15;
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.04;
    group.add(ring);
  }

  return group;
}

export function disposeBreakableCatalogCache(): void {
  breakableTexCache.forEach((tex) => tex.dispose());
  breakableTexCache.clear();
}
