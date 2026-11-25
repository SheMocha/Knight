import { calculateGoldMultiplier } from './goldEconomy';
import { CharmId, PlayerUpgrades, ShopCharm, ShopWeapon, WeaponId } from './types';

export const SHOP_WEAPONS: ShopWeapon[] = [
  {
    id: 'club',
    name: 'Meşe Sopa',
    cost: 0,
    powerMult: 1.0,
    hitRange: 2.9,
    description: 'Başlangıç için güvenilir ağır meşe sopa.',
  },
  {
    id: 'mallet',
    name: 'Tahta Tokmak',
    cost: 750,
    powerMult: 1.12,
    hitRange: 3.25,
    description: 'Daha geniş menzil ve +%7 altın kazancı sağlar.',
  },
  {
    id: 'hammer',
    name: 'Savaş Çekici',
    cost: 2200,
    powerMult: 1.25,
    hitRange: 3.6,
    description: 'Ağır demir başlıkla hedefleri uzağa savurur, +%14 altın kazandırır.',
  },
  {
    id: 'axe',
    name: 'Savaş Baltası',
    cost: 4500,
    powerMult: 1.4,
    hitRange: 4.0,
    description: 'Geniş çift ağızlı kesimle uzun menzil ve +%22 altın kazancı.',
  },
  {
    id: 'excalibur',
    name: 'Excalibur Kılıcı',
    cost: 8000,
    powerMult: 1.58,
    hitRange: 4.4,
    description: 'Kraliyet vergilerini toplamak için kutsanmış efsanevi kılıç (+%32 altın).',
  },
  {
    id: 'mace',
    name: 'Dikenli Gürz',
    cost: 13500,
    powerMult: 1.8,
    hitRange: 4.85,
    description: 'En üst seviye efsanevi dikenli şövalye gürzü (+%44 altın)!',
  },
];

export const SHOP_CHARMS: ShopCharm[] = [
  {
    id: 'luckyAmulet',
    name: 'Şans Muskası',
    costs: [450, 1200, 2600],
    maxLevel: 3,
    description: 'Her seviye düşen altın miktarını +%6 artırır (tavan çarpan içinde).',
  },
  {
    id: 'armorOil',
    name: 'Zırh Yağı',
    costs: [500, 1350, 2800],
    maxLevel: 3,
    description: 'Boşa salladığında sersemleme süresini belirgin şekilde kısaltır.',
  },
  {
    id: 'strengthTonic',
    name: 'Güç İksiri',
    costs: [600, 1500, 3200],
    maxLevel: 3,
    description: 'Basılı tutarken silah güç çubuğunun çok daha hızlı dolmasını sağlar.',
  },
];

export function createInitialUpgrades(): PlayerUpgrades {
  return {
    ownedWeapons: ['club'],
    equippedWeapon: 'club',
    luckyAmulet: 0,
    armorOil: 0,
    strengthTonic: 0,
  };
}

export function getWeaponSpec(id: WeaponId): ShopWeapon {
  return SHOP_WEAPONS.find((w) => w.id === id) || SHOP_WEAPONS[0];
}

export function getCharmCost(charm: ShopCharm, currentLevel: number): number {
  const idx = Math.max(0, Math.min(charm.costs.length - 1, currentLevel));
  return charm.costs[idx];
}

export function getCharmLevel(upgrades: PlayerUpgrades, id: CharmId): number {
  return upgrades[id];
}

export function getChargeRate(upgrades: PlayerUpgrades): number {
  // Taban hız ~0.92 sn'de tam dolar; her Güç İksiri +%25 hızlandırır
  return 1.08 * (1 + upgrades.strengthTonic * 0.25);
}

export function getDizzyDuration(upgrades: PlayerUpgrades): number {
  // Taban 1.5sn ceza; Zırh Yağı ile 1.15sn -> 0.8sn -> 0.45sn'ye iner
  return Math.max(0.45, 1.5 - upgrades.armorOil * 0.35);
}

export function getGoldMultiplier(upgrades: PlayerUpgrades, isCrit = false): number {
  return calculateGoldMultiplier(upgrades, isCrit);
}
