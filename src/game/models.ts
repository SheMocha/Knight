import * as THREE from 'three';
import { BreakableKind, EnemyKind, WeaponId } from './types';
import {
  createAwningTexture,
  createCastleStoneTexture,
  createCoinTexture,
  createContactShadowTexture,
  createHalfTimberTexture,
  createWoodPlankTexture,
} from './textures';

export interface MaterialBank {
  armorBlack: THREE.MeshStandardMaterial;
  armorInk: THREE.MeshStandardMaterial;
  goldTrim: THREE.MeshStandardMaterial;
  steelBlade: THREE.MeshStandardMaterial;
  redPlume: THREE.MeshStandardMaterial;
  skinWarm: THREE.MeshStandardMaterial;
  skinWitch: THREE.MeshStandardMaterial;
  pigPink: THREE.MeshStandardMaterial;
  pigSnout: THREE.MeshStandardMaterial;
  woodBarrel: THREE.MeshStandardMaterial;
  woodCrate: THREE.MeshStandardMaterial;
  woodDark: THREE.MeshStandardMaterial;
  ironBand: THREE.MeshStandardMaterial;
  leatherBag: THREE.MeshStandardMaterial;
  coinGold: THREE.MeshStandardMaterial;
  rubyGem: THREE.MeshStandardMaterial;
  magicPurple: THREE.MeshStandardMaterial;
  magicGreen: THREE.MeshStandardMaterial;
  villagerTunics: THREE.MeshStandardMaterial[];
  merchantRobe: THREE.MeshStandardMaterial;
  guardArmor: THREE.MeshStandardMaterial;
  witchDress: THREE.MeshStandardMaterial;
  awningRed: THREE.MeshStandardMaterial;
  awningBlue: THREE.MeshStandardMaterial;
  cottageWall: THREE.MeshStandardMaterial;
  castleStone: THREE.MeshStandardMaterial;
  roofRed: THREE.MeshStandardMaterial;
  roofBlue: THREE.MeshStandardMaterial;
  roofThatch: THREE.MeshStandardMaterial;
  foliageGreen: THREE.MeshStandardMaterial;
  foliageDark: THREE.MeshStandardMaterial;
  starburstYellow: THREE.MeshBasicMaterial;
  starburstCrit: THREE.MeshBasicMaterial;
  slashWhite: THREE.MeshBasicMaterial;
  dizzyStar: THREE.MeshBasicMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  textures: THREE.Texture[];
  dispose: () => void;
}

export function createMaterialBank(anisotropy: number): MaterialBank {
  const textures: THREE.Texture[] = [];
  const woodBarrelTex = createWoodPlankTexture('#9a5b25', '#5c3111', anisotropy);
  const woodCrateTex = createWoodPlankTexture('#c2823a', '#7c4b18', anisotropy);
  const cottageTex = createHalfTimberTexture('#f1e4c8', '#52341f', anisotropy);
  const castleStoneTex = createCastleStoneTexture('#7a8799', anisotropy);
  const awningRedTex = createAwningTexture('#dc2626', '#fef3c7', anisotropy);
  const awningBlueTex = createAwningTexture('#2563eb', '#fef3c7', anisotropy);
  const shadowTex = createContactShadowTexture();
  const coinTex = createCoinTexture(anisotropy);
  textures.push(
    woodBarrelTex,
    woodCrateTex,
    cottageTex,
    castleStoneTex,
    awningRedTex,
    awningBlueTex,
    shadowTex,
    coinTex,
  );

  const materials: THREE.Material[] = [];
  const track = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  const bank: MaterialBank = {
    armorBlack: track(
      new THREE.MeshStandardMaterial({ color: 0x1b1c22, roughness: 0.3, metalness: 0.68 }),
    ),
    armorInk: track(
      new THREE.MeshStandardMaterial({ color: 0x0b0b0f, roughness: 0.85, metalness: 0.1 }),
    ),
    goldTrim: track(
      new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.88 }),
    ),
    steelBlade: track(
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.92 }),
    ),
    redPlume: track(
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.72, metalness: 0.05 }),
    ),
    skinWarm: track(
      new THREE.MeshStandardMaterial({ color: 0xe6a87c, roughness: 0.78, metalness: 0.02 }),
    ),
    skinWitch: track(
      new THREE.MeshStandardMaterial({ color: 0x9ce37d, roughness: 0.7, metalness: 0.05 }),
    ),
    pigPink: track(
      new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.68, metalness: 0.02 }),
    ),
    pigSnout: track(
      new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.58, metalness: 0.04 }),
    ),
    woodBarrel: track(
      new THREE.MeshStandardMaterial({ map: woodBarrelTex, roughness: 0.82, metalness: 0.05 }),
    ),
    woodCrate: track(
      new THREE.MeshStandardMaterial({ map: woodCrateTex, roughness: 0.84, metalness: 0.04 }),
    ),
    woodDark: track(
      new THREE.MeshStandardMaterial({ color: 0x5c3415, roughness: 0.85, metalness: 0.05 }),
    ),
    ironBand: track(
      new THREE.MeshStandardMaterial({ color: 0x3b4048, roughness: 0.35, metalness: 0.82 }),
    ),
    leatherBag: track(
      new THREE.MeshStandardMaterial({ color: 0xb46522, roughness: 0.85, metalness: 0.05 }),
    ),
    coinGold: track(
      new THREE.MeshStandardMaterial({
        map: coinTex,
        color: 0xffdf38,
        emissive: 0x5c3c00,
        emissiveIntensity: 0.35,
        roughness: 0.16,
        metalness: 0.9,
      }),
    ),
    rubyGem: track(
      new THREE.MeshStandardMaterial({
        color: 0xe11d48,
        emissive: 0x881337,
        emissiveIntensity: 0.4,
        roughness: 0.14,
        metalness: 0.3,
      }),
    ),
    magicPurple: track(
      new THREE.MeshStandardMaterial({
        color: 0xc026d3,
        emissive: 0x9333ea,
        emissiveIntensity: 0.75,
        roughness: 0.25,
        metalness: 0.15,
      }),
    ),
    magicGreen: track(
      new THREE.MeshStandardMaterial({
        color: 0x4ade80,
        emissive: 0x16a34a,
        emissiveIntensity: 0.65,
        roughness: 0.25,
        metalness: 0.1,
      }),
    ),
    villagerTunics: [
      track(new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.84, metalness: 0.02 })),
      track(new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.84, metalness: 0.02 })),
      track(new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.84, metalness: 0.02 })),
      track(new THREE.MeshStandardMaterial({ color: 0x9333ea, roughness: 0.84, metalness: 0.02 })),
    ],
    merchantRobe: track(
      new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.76, metalness: 0.08 }),
    ),
    guardArmor: track(
      new THREE.MeshStandardMaterial({ color: 0x708090, roughness: 0.32, metalness: 0.78 }),
    ),
    witchDress: track(
      new THREE.MeshStandardMaterial({ color: 0x2e293b, roughness: 0.78, metalness: 0.1 }),
    ),
    awningRed: track(
      new THREE.MeshStandardMaterial({ map: awningRedTex, roughness: 0.8, metalness: 0.04 }),
    ),
    awningBlue: track(
      new THREE.MeshStandardMaterial({ map: awningBlueTex, roughness: 0.8, metalness: 0.04 }),
    ),
    cottageWall: track(
      new THREE.MeshStandardMaterial({ map: cottageTex, roughness: 0.88, metalness: 0.02 }),
    ),
    castleStone: track(
      new THREE.MeshStandardMaterial({ map: castleStoneTex, roughness: 0.85, metalness: 0.06 }),
    ),
    roofRed: track(
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.82, metalness: 0.04 }),
    ),
    roofBlue: track(
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.75, metalness: 0.08 }),
    ),
    roofThatch: track(
      new THREE.MeshStandardMaterial({ color: 0x926829, roughness: 0.9, metalness: 0.02 }),
    ),
    foliageGreen: track(
      new THREE.MeshStandardMaterial({ color: 0x2e8540, roughness: 0.86, metalness: 0.02 }),
    ),
    foliageDark: track(
      new THREE.MeshStandardMaterial({ color: 0x1a4d34, roughness: 0.88, metalness: 0.02 }),
    ),
    starburstYellow: track(
      new THREE.MeshBasicMaterial({ color: 0xffa726, side: THREE.DoubleSide }),
    ),
    starburstCrit: track(
      new THREE.MeshBasicMaterial({ color: 0xffee58, side: THREE.DoubleSide }),
    ),
    slashWhite: track(
      new THREE.MeshBasicMaterial({
        color: 0xfffde7,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ),
    dizzyStar: track(
      new THREE.MeshBasicMaterial({ color: 0xfde047, side: THREE.DoubleSide }),
    ),
    contactShadow: track(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    ),
    textures,
    dispose: () => {
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };

  return bank;
}

export function createContactShadow(
  mats: MaterialBank,
  width: number,
  depth = 1.0,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, depth);
  const mesh = new THREE.Mesh(geo, mats.contactShadow);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return mesh;
}

export interface KnightRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  weaponPivot: THREE.Group;
  slashArc: THREE.Mesh;
  dizzyGroup: THREE.Group;
  pigGroup: THREE.Group;
  pigLegs: THREE.Mesh[];
  shadow: THREE.Mesh;
  setWeapon: (weapon: WeaponId) => void;
}

function buildWeaponMesh(weapon: WeaponId, mats: MaterialBank): THREE.Group {
  const g = new THREE.Group();
  if (weapon === 'club') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.55, 8), mats.goldTrim);
    handle.position.y = 0.25;
    const clubHead = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.11, 1.35, 10), mats.woodBarrel);
    clubHead.position.y = 1.1;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mats.woodBarrel);
    cap.position.y = 1.78;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.14, 10), mats.ironBand);
    band.position.y = 1.45;
    g.add(handle, clubHead, cap, band);
  } else if (weapon === 'mallet') {
    // Chunky Wooden Mallet
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 1.65, 8), mats.woodDark);
    shaft.position.y = 0.82;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.05, 12), mats.woodBarrel);
    head.rotation.z = Math.PI / 2;
    head.position.y = 1.65;
    const bandL = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12), mats.ironBand);
    bandL.rotation.z = Math.PI / 2;
    bandL.position.set(-0.36, 1.65, 0);
    const bandR = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.12, 12), mats.ironBand);
    bandR.rotation.z = Math.PI / 2;
    bandR.position.set(0.36, 1.65, 0);
    g.add(shaft, head, bandL, bandR);
  } else if (weapon === 'hammer') {
    // Heavy Iron Battle Hammer
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 1.75, 8), mats.woodDark);
    shaft.position.y = 0.86;
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.25, 8), mats.goldTrim);
    grip.position.y = 0.22;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.56, 0.48), mats.ironBand);
    head.position.y = 1.75;
    const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.52), mats.goldTrim);
    trimL.position.set(-0.44, 1.75, 0);
    const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.52), mats.goldTrim);
    trimR.position.set(0.44, 1.75, 0);
    const topSpike = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 6), mats.steelBlade);
    topSpike.position.y = 2.18;
    g.add(shaft, grip, head, trimL, trimR, topSpike);
  } else if (weapon === 'axe') {
    // Double-Bladed Battle Axe
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 1.9, 8), mats.woodDark);
    shaft.position.y = 0.95;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.35, 8), mats.goldTrim);
    collar.position.y = 1.72;
    const bladeGeo = new THREE.CylinderGeometry(0.58, 0.38, 0.12, 8, 1, false, 0, Math.PI);
    const bladeL = new THREE.Mesh(bladeGeo, mats.steelBlade);
    bladeL.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    bladeL.position.set(-0.34, 1.72, 0);
    const bladeR = new THREE.Mesh(bladeGeo, mats.steelBlade);
    bladeR.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    bladeR.position.set(0.34, 1.72, 0);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.44, 6), mats.steelBlade);
    crown.position.y = 2.12;
    g.add(shaft, collar, bladeL, bladeR, crown);
  } else if (weapon === 'excalibur') {
    // Legendary Excalibur Sword
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 8), mats.redPlume);
    grip.position.y = 0.22;
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mats.goldTrim);
    pommel.position.y = -0.02;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.2), mats.goldTrim);
    guard.position.y = 0.48;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), mats.rubyGem);
    gem.position.set(0, 0.48, 0.12);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.72, 0.09), mats.steelBlade);
    blade.position.y = 1.38;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.52, 4), mats.steelBlade);
    tip.rotation.y = Math.PI / 4;
    tip.position.y = 2.48;
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.12), mats.goldTrim);
    fuller.position.y = 1.32;
    g.add(grip, pommel, guard, gem, blade, tip, fuller);
  } else {
    // Ultimate Spiked Mace (Morningstar from Screenshot #1!)
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 1.75, 8), mats.ironBand);
    shaft.position.y = 0.88;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.22, 8), mats.goldTrim);
    collar.position.y = 1.65;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mats.ironBand);
    ball.position.y = 2.02;
    g.add(shaft, collar, ball);

    const spikeGeo = new THREE.ConeGeometry(0.085, 0.36, 6);
    const dirs = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1],
      [0.7, 0.7, 0], [-0.7, 0.7, 0], [0.7, -0.5, 0], [-0.7, -0.5, 0],
    ];
    for (const [dx, dy, dz] of dirs) {
      const spike = new THREE.Mesh(spikeGeo, mats.steelBlade);
      const v = new THREE.Vector3(dx, dy, dz).normalize();
      spike.position.set(v.x * 0.44, 2.02 + v.y * 0.44, v.z * 0.44);
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
      g.add(spike);
    }
  }
  return g;
}

function createFivePointStarGeometry(outerR: number, innerR: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return new THREE.ShapeGeometry(shape);
}

export function createBlackKnightRig(mats: MaterialBank, weapon: WeaponId): KnightRig {
  const root = new THREE.Group();
  const shadow = createContactShadow(mats, 1.95, 1.1);
  root.add(shadow);

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.95;
  root.add(bodyGroup);

  // Chunky cartoon black armor barrel torso
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.46, 1.05, 12), mats.armorBlack);
  torso.scale.set(1.12, 1.0, 0.85);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Golden armor chest crest + collar + belt
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.09, 8, 14), mats.goldTrim);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.48;
  bodyGroup.add(collar);

  const chestCrossV = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.14), mats.goldTrim);
  chestCrossV.position.set(0.16, 0.08, 0.44);
  const chestCrossH = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.13, 0.14), mats.goldTrim);
  chestCrossH.position.set(0.16, 0.24, 0.44);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.51, 0.49, 0.16, 12), mats.goldTrim);
  belt.scale.set(1.14, 1.0, 0.88);
  belt.position.y = -0.36;
  bodyGroup.add(chestCrossV, chestCrossH, belt);

  // Head & large medieval helmet with crimson plume
  const headGroup = new THREE.Group();
  headGroup.position.set(0.06, 0.72, 0);
  bodyGroup.add(headGroup);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), mats.armorBlack);
  helmet.scale.set(1.05, 1.08, 0.96);
  helmet.castShadow = true;
  headGroup.add(helmet);

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.36), mats.skinWarm);
  face.position.set(0.24, -0.02, 0);
  headGroup.add(face);

  const eyeWhiteGeo = new THREE.SphereGeometry(0.065, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeL = new THREE.Mesh(eyeWhiteGeo, eyeMat);
  eyeL.position.set(0.42, 0.04, 0.1);
  const eyeR = new THREE.Mesh(eyeWhiteGeo, eyeMat);
  eyeR.position.set(0.42, 0.04, -0.1);
  const pupL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), pupilMat);
  pupL.position.set(0.47, 0.04, 0.11);
  const pupR = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 6), pupilMat);
  pupR.position.set(0.47, 0.04, -0.11);
  headGroup.add(eyeL, eyeR, pupL, pupR);

  const visorBrim = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.56), mats.armorBlack);
  visorBrim.position.set(0.22, 0.18, 0);
  visorBrim.rotation.z = -0.18;
  const goldRivets = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.05, 0.58), mats.goldTrim);
  goldRivets.position.set(0.18, 0.14, 0);
  const plume = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.44, 8), mats.redPlume);
  plume.position.set(-0.08, 0.52, 0);
  plume.rotation.z = 0.45;
  headGroup.add(visorBrim, goldRivets, plume);

  // Circling 3D Dizzy Stars Halo (shown when knight whiffs a swing!)
  const dizzyGroup = new THREE.Group();
  dizzyGroup.position.set(0.05, 1.48, 0);
  dizzyGroup.visible = false;
  const starGeo = createFivePointStarGeometry(0.22, 0.09);
  for (let i = 0; i < 3; i++) {
    const star = new THREE.Mesh(starGeo, mats.dizzyStar);
    const angle = (i / 3) * Math.PI * 2;
    star.position.set(Math.cos(angle) * 0.68, 0, Math.sin(angle) * 0.45);
    dizzyGroup.add(star);
  }
  bodyGroup.add(dizzyGroup);

  // Articulated chunky legs with golden knee guards
  const buildLeg = (zOffset: number) => {
    const leg = new THREE.Group();
    leg.position.set(0, -0.45, zOffset);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.42, 8), mats.armorBlack);
    thigh.position.y = -0.18;
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.24), mats.goldTrim);
    knee.position.set(0.05, -0.32, 0);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.24, 0.26), mats.armorBlack);
    boot.position.set(0.08, -0.44, 0);
    boot.castShadow = true;
    leg.add(thigh, knee, boot);
    return leg;
  };
  const leftLeg = buildLeg(-0.24);
  const rightLeg = buildLeg(0.24);
  bodyGroup.add(leftLeg, rightLeg);

  // Articulated arms with spiked golden pauldrons
  const buildArm = (zOffset: number) => {
    const arm = new THREE.Group();
    arm.position.set(0.02, 0.34, zOffset);
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), mats.goldTrim);
    pauldron.castShadow = true;
    arm.add(pauldron);
    const spGeo = new THREE.ConeGeometry(0.055, 0.22, 6);
    const sp1 = new THREE.Mesh(spGeo, mats.armorInk);
    sp1.position.set(0, 0.3, 0);
    const sp2 = new THREE.Mesh(spGeo, mats.armorInk);
    sp2.position.set(-0.22, 0.2, 0);
    sp2.rotation.z = 0.85;
    arm.add(sp1, sp2);

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.14, 0.42, 8), mats.armorBlack);
    upper.position.y = -0.26;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.12, 8), mats.goldTrim);
    cuff.position.y = -0.48;
    const gauntlet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), mats.armorBlack);
    gauntlet.position.y = -0.62;
    arm.add(upper, cuff, gauntlet);
    return arm;
  };
  const leftArm = buildArm(-0.52);
  const rightArm = buildArm(0.52);
  bodyGroup.add(leftArm, rightArm);

  // Weapon pivot attached to front arm gauntlet
  const weaponPivot = new THREE.Group();
  weaponPivot.position.set(0.05, -0.62, 0.04);
  weaponPivot.rotation.z = -0.55;
  rightArm.add(weaponPivot);

  let currentWeaponGroup = buildWeaponMesh(weapon, mats);
  weaponPivot.add(currentWeaponGroup);

  // Comic motion-streak slash arc
  const slashGeo = new THREE.RingGeometry(1.15, 2.45, 16, 1, -0.6, Math.PI * 0.85);
  const slashArc = new THREE.Mesh(slashGeo, mats.slashWhite);
  slashArc.position.set(0.65, 0.2, 0.65);
  slashArc.visible = false;
  bodyGroup.add(slashArc);

  // Hilarious Cartoon Pink Pig Transformation rig (4s penalty for smashing a Witch!)
  const pigGroup = new THREE.Group();
  pigGroup.visible = false;
  root.add(pigGroup);

  const pigBody = new THREE.Mesh(new THREE.SphereGeometry(0.54, 12, 10), mats.pigPink);
  pigBody.scale.set(1.28, 0.92, 0.92);
  pigBody.position.set(0, 0.62, 0);
  pigBody.castShadow = true;
  pigGroup.add(pigBody);

  const pigHead = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 10), mats.pigPink);
  pigHead.position.set(0.54, 0.72, 0);
  pigGroup.add(pigHead);

  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.2, 10), mats.pigSnout);
  snout.rotation.z = Math.PI / 2;
  snout.position.set(0.88, 0.68, 0);
  pigGroup.add(snout);

  const pEyeL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), pupilMat);
  pEyeL.position.set(0.76, 0.84, 0.16);
  const pEyeR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), pupilMat);
  pEyeR.position.set(0.76, 0.84, -0.16);
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 6), mats.pigSnout);
  earL.position.set(0.45, 1.02, 0.22);
  earL.rotation.set(0.4, 0, 0.3);
  const earR = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 6), mats.pigSnout);
  earR.position.set(0.45, 1.02, -0.22);
  earR.rotation.set(-0.4, 0, 0.3);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 10, Math.PI * 1.5), mats.pigSnout);
  tail.position.set(-0.7, 0.74, 0);
  pigGroup.add(pEyeL, pEyeR, earL, earR, tail);

  // Knight's tiny helmet hilariously perched on the pig's head!
  const miniHelm = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mats.armorBlack);
  miniHelm.position.set(0.52, 1.02, 0);
  const miniPlume = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.24, 6), mats.redPlume);
  miniPlume.position.set(0.46, 1.24, 0);
  miniPlume.rotation.z = 0.4;
  pigGroup.add(miniHelm, miniPlume);

  const pigLegs: THREE.Mesh[] = [];
  const legCoords: [number, number][] = [
    [0.34, 0.22],
    [0.34, -0.22],
    [-0.34, 0.22],
    [-0.34, -0.22],
  ];
  for (const [lx, lz] of legCoords) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.34, 8), mats.pigSnout);
    leg.position.set(lx, 0.17, lz);
    pigGroup.add(leg);
    pigLegs.push(leg);
  }

  return {
    root,
    bodyGroup,
    headGroup,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    weaponPivot,
    slashArc,
    dizzyGroup,
    pigGroup,
    pigLegs,
    shadow,
    setWeapon: (nextWeapon: WeaponId) => {
      weaponPivot.remove(currentWeaponGroup);
      currentWeaponGroup = buildWeaponMesh(nextWeapon, mats);
      weaponPivot.add(currentWeaponGroup);
    },
  };
}

export interface EnemyRig {
  root: THREE.Group;
  body: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  armPivot: THREE.Group;
  shadow: THREE.Mesh;
}

export function createEnemyRig(kind: EnemyKind, mats: MaterialBank, seed = 0): EnemyRig {
  const root = new THREE.Group();
  const shadow = createContactShadow(mats, 1.35, 0.9);
  root.add(shadow);

  const body = new THREE.Group();
  body.position.y = kind === 'witch' ? 1.0 : 0.85;
  root.add(body);

  const scale = kind === 'merchant' ? 1.12 : kind === 'witch' ? 1.06 : 0.98;
  body.scale.setScalar(scale);

  const tunicMat =
    kind === 'villager'
      ? mats.villagerTunics[Math.abs(seed) % mats.villagerTunics.length]
      : kind === 'merchant'
        ? mats.merchantRobe
        : kind === 'guard'
          ? mats.guardArmor
          : mats.witchDress;

  const skinMat = kind === 'witch' ? mats.skinWitch : mats.skinWarm;

  const torsoGeo =
    kind === 'witch' || (kind === 'villager' && seed % 2 === 1)
      ? new THREE.ConeGeometry(0.45, 1.1, 10)
      : new THREE.CylinderGeometry(0.32, 0.38, 0.85, 10);
  const torso = new THREE.Mesh(torsoGeo, tunicMat);
  torso.castShadow = true;
  body.add(torso);

  if (kind === 'merchant') {
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mats.merchantRobe);
    belly.position.set(0.08, -0.05, 0);
    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 6, 12), mats.goldTrim);
    sash.rotation.x = Math.PI / 2;
    sash.position.y = -0.14;
    body.add(belly, sash);
  } else if (kind === 'guard') {
    const chestTrim = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.56), mats.goldTrim);
    chestTrim.position.y = 0.12;
    body.add(chestTrim);
  } else if (kind === 'witch') {
    // Subtle glowing purple warning ring beneath witch so player spots her clearly!
    const aura = new THREE.Mesh(
      new THREE.TorusGeometry(0.58, 0.05, 6, 16),
      mats.magicPurple,
    );
    aura.rotation.x = Math.PI / 2;
    aura.position.y = -0.68;
    body.add(aura);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10), skinMat);
  head.position.set(0, 0.64, 0);
  head.castShadow = true;
  body.add(head);

  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  eyeL.position.set(0.24, 0.68, 0.1);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  eyeR.position.set(0.24, 0.68, -0.1);
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, kind === 'witch' ? 0.24 : 0.12, 6),
    skinMat,
  );
  nose.rotation.z = -Math.PI / 2;
  nose.position.set(kind === 'witch' ? 0.35 : 0.28, 0.62, 0);
  body.add(eyeL, eyeR, nose);

  if (kind === 'witch') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.54, 0.07, 12), mats.armorInk);
    brim.position.set(0, 0.86, 0);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.88, 10), mats.armorInk);
    cone.position.set(-0.04, 1.3, 0);
    cone.rotation.z = 0.14;
    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.11, 10), mats.magicPurple);
    hatBand.position.set(0, 0.93, 0);
    body.add(brim, cone, hatBand);
  } else if (kind === 'guard') {
    const helm = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), mats.guardArmor);
    helm.position.set(0, 0.72, 0);
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.36), mats.redPlume);
    crest.position.set(-0.02, 1.0, 0);
    body.add(helm, crest);
  } else if (kind === 'merchant') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.22, 10), mats.goldTrim);
    cap.position.set(0, 0.9, 0);
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mats.rubyGem);
    gem.position.set(0.28, 0.92, 0);
    body.add(cap, gem);
  } else {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.08, 10), mats.roofThatch);
    hat.position.set(0, 0.86, 0);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), mats.roofThatch);
    top.position.set(0, 0.94, 0);
    body.add(hat, top);
  }

  const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.48, 8);
  const leftLeg = new THREE.Mesh(legGeo, mats.woodDark);
  leftLeg.position.set(0, -0.58, -0.15);
  const rightLeg = new THREE.Mesh(legGeo, mats.woodDark);
  rightLeg.position.set(0, -0.58, 0.15);
  body.add(leftLeg, rightLeg);

  const armPivot = new THREE.Group();
  armPivot.position.set(0.06, 0.28, 0.34);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.45, 8), tunicMat);
  arm.position.y = -0.2;
  armPivot.add(arm);

  if (kind === 'guard') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.7, 6), mats.woodDark);
    pole.position.set(0.22, 0.15, 0);
    pole.rotation.z = -0.35;
    const spear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.42, 6), mats.steelBlade);
    spear.position.set(0.5, 0.9, 0);
    spear.rotation.z = -0.35;
    armPivot.add(pole, spear);
  } else if (kind === 'witch') {
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 1.5, 6), mats.woodDark);
    staff.position.set(0.22, 0.05, 0);
    staff.rotation.z = -0.22;
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), mats.magicPurple);
    orb.position.set(0.42, 0.8, 0);
    armPivot.add(staff, orb);
  } else if (kind === 'merchant') {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mats.leatherBag);
    bag.position.set(0.18, -0.4, 0);
    armPivot.add(bag);
  }
  body.add(armPivot);

  // Characters walk left toward the Black Knight
  root.rotation.y = Math.PI;

  return { root, body, leftLeg, rightLeg, armPivot, shadow };
}

export function createBreakableMesh(kind: BreakableKind, mats: MaterialBank, variant = 0): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'barrel') {
    g.add(createContactShadow(mats, 1.25, 0.85));
    const lathePts = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.38, 0),
      new THREE.Vector2(0.49, 0.52),
      new THREE.Vector2(0.38, 1.05),
      new THREE.Vector2(0.01, 1.05),
    ];
    const body = new THREE.Mesh(new THREE.LatheGeometry(lathePts, 12), mats.woodBarrel);
    body.castShadow = true;
    const hoop1 = new THREE.Mesh(new THREE.CylinderGeometry(0.47, 0.45, 0.1, 12), mats.ironBand);
    hoop1.position.y = 0.28;
    const hoop2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.47, 0.1, 12), mats.ironBand);
    hoop2.position.y = 0.78;
    g.add(body, hoop1, hoop2);
  } else if (kind === 'crate') {
    g.add(createContactShadow(mats, 1.35, 0.95));
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), mats.woodCrate);
    box.position.y = 0.53;
    box.castShadow = true;
    const brace1 = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.13, 1.12), mats.woodDark);
    brace1.position.y = 0.53;
    brace1.rotation.z = Math.PI / 4;
    const rimTop = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 1.1), mats.woodDark);
    rimTop.position.y = 1.01;
    g.add(box, brace1, rimTop);
  } else if (kind === 'stall') {
    g.add(createContactShadow(mats, 2.5, 1.25));
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.95, 1.05), mats.woodCrate);
    counter.position.y = 0.48;
    counter.castShadow = true;
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), mats.woodDark);
    postL.position.set(-0.92, 1.1, 0.4);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8), mats.woodDark);
    postR.position.set(0.92, 1.1, 0.4);
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(2.45, 0.18, 1.4),
      variant % 2 === 0 ? mats.awningRed : mats.awningBlue,
    );
    awning.position.set(0, 2.2, 0.1);
    awning.rotation.x = 0.2;
    const goods1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mats.goldTrim);
    goods1.position.set(-0.42, 1.06, 0.15);
    const goods2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mats.redPlume);
    goods2.position.set(0.24, 1.06, 0.15);
    g.add(counter, postL, postR, awning, goods1, goods2);
  } else if (kind === 'chest') {
    g.add(createContactShadow(mats, 1.5, 0.95));
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.62, 0.85), mats.woodDark);
    base.position.y = 0.31;
    base.castShadow = true;
    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 1.22, 10, 1, false, 0, Math.PI),
      mats.woodBarrel,
    );
    lid.rotation.z = Math.PI / 2;
    lid.rotation.y = Math.PI / 2;
    lid.position.y = 0.62;
    const bandL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.98, 0.9), mats.goldTrim);
    bandL.position.set(-0.36, 0.54, 0);
    const bandR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.98, 0.9), mats.goldTrim);
    bandR.position.set(0.36, 0.54, 0);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.92), mats.goldTrim);
    lock.position.set(0, 0.56, 0);
    g.add(base, lid, bandL, bandR, lock);
  } else {
    // Royal Special Treasure Crown & Ruby Pedestal
    g.add(createContactShadow(mats, 1.5, 0.95));
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.58, 0.72, 10), mats.castleStone);
    pedestal.position.y = 0.36;
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.16, 10), mats.redPlume);
    cushion.position.y = 0.78;
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.3, 0.34, 8), mats.goldTrim);
    crownBase.position.y = 1.02;
    const gemCenter = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), mats.rubyGem);
    gemCenter.position.y = 1.4;
    const crownRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 6, 12), mats.goldTrim);
    crownRing.rotation.x = Math.PI / 2;
    crownRing.position.y = 1.18;
    g.add(pedestal, cushion, crownBase, gemCenter, crownRing);
  }
  return g;
}

export function createCoinMesh(mats: MaterialBank): THREE.Group {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.09, 14), mats.coinGold);
  disc.rotation.x = Math.PI / 2;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.042, 6, 14), mats.goldTrim);
  g.add(disc, rim);
  return g;
}

export function createGoldBagMesh(mats: MaterialBank): THREE.Group {
  const g = new THREE.Group();
  const sack = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 10), mats.leatherBag);
  sack.scale.set(1.05, 0.95, 0.9);
  sack.position.y = 0.3;
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.045, 6, 10), mats.goldTrim);
  tie.rotation.x = Math.PI / 2;
  tie.position.y = 0.56;
  const frill = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 8), mats.leatherBag);
  frill.rotation.x = Math.PI;
  frill.position.y = 0.68;
  g.add(sack, tie, frill);
  return g;
}

export function createStarburstMesh(mats: MaterialBank, crit = false): THREE.Mesh {
  const shape = new THREE.Shape();
  const spikes = 9;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 1.0 : 0.42;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  return new THREE.Mesh(geo, crit ? mats.starburstCrit : mats.starburstYellow);
}

export function createMedievalHouse(mats: MaterialBank, variant: number): THREE.Group {
  const g = new THREE.Group();
  const w = 3.8 + (variant % 3) * 0.7;
  const h = 3.2 + (variant % 2) * 0.9;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.2), mats.cottageWall);
  wall.position.y = h / 2;
  const roofMat =
    variant % 3 === 0 ? mats.roofRed : variant % 3 === 1 ? mats.roofThatch : mats.roofBlue;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.76, 2.3, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = h + 1.1;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.55, 0.14), mats.woodDark);
  door.position.set(-w * 0.22, 0.78, 1.08);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.2, 0.55), mats.castleStone);
  chimney.position.set(w * 0.28, h + 1.15, -0.3);
  g.add(wall, roof, door, chimney);
  return g;
}

export function createCartoonTree(mats: MaterialBank, dark: boolean, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.8, 8), mats.woodDark);
  trunk.position.y = 1.4;
  const leafMat = dark ? mats.foliageDark : mats.foliageGreen;
  const c1 = new THREE.Mesh(new THREE.SphereGeometry(1.45, 10, 8), leafMat);
  c1.position.set(0, 3.2, 0);
  const c2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), leafMat);
  c2.position.set(-0.95, 2.65, 0.15);
  const c3 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), leafMat);
  c3.position.set(0.95, 2.7, -0.1);
  g.add(trunk, c1, c2, c3);
  g.scale.setScalar(scale);
  return g;
}

export function createCastleTower(mats: MaterialBank, height = 6.2, blueRoof = true): THREE.Group {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.35, height, 10), mats.castleStone);
  shaft.position.y = height / 2;
  const parapet = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.35, 0.65, 10), mats.castleStone);
  parapet.position.y = height + 0.1;
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.55, 2.3, 10),
    blueRoof ? mats.roofBlue : mats.roofRed,
  );
  roof.position.y = height + 1.5;
  const slit = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.75, 0.2), mats.armorInk);
  slit.position.set(0, height * 0.66, 1.24);
  g.add(shaft, parapet, roof, slit);
  return g;
}

export function createThronePillar(mats: MaterialBank): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.22, 0.85, 10), mats.castleStone);
  base.position.y = 0.42;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.94, 7.6, 12), mats.castleStone);
  shaft.position.y = 4.6;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.55, 2.1), mats.goldTrim);
  cap.position.y = 8.4;
  const banner = new THREE.Mesh(new THREE.BoxGeometry(0.95, 3.6, 0.08), mats.redPlume);
  banner.position.set(0, 5.2, 0.96);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.24, 0.1), mats.goldTrim);
  trim.position.set(0, 3.45, 0.97);
  g.add(base, shaft, cap, banner, trim);
  return g;
}

export interface BridgeBayResult {
  group: THREE.Group;
  flames: THREE.Mesh[];
}

export function createBridgeBay(
  mats: MaterialBank,
  bayWidth: number,
  isInterior: boolean,
  hasTorch: boolean,
): BridgeBayResult {
  const g = new THREE.Group();
  const flames: THREE.Mesh[] = [];

  const stoneMat = mats.castleStone;
  const trimMat = isInterior ? mats.goldTrim : mats.castleStone;
  const archVoidMat = new THREE.MeshBasicMaterial({
    color: isInterior ? 0x090d1a : 0x0d1017,
  });

  // 1. Repeating carved stone corbel brackets tucked directly beneath road cornice
  const corbelCount = 4;
  for (let i = 0; i < corbelCount; i++) {
    const cx = -bayWidth * 0.38 + (i / (corbelCount - 1)) * (bayWidth * 0.76);
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.26), stoneMat);
    upper.position.set(cx, -1.08, 0.12);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.18), stoneMat);
    lower.position.set(cx, -1.28, 0.08);
    g.add(upper, lower);
  }

  // 2. Heavy stone buttress pier on left edge of bay
  const pierX = -bayWidth / 2;
  const pierCap = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.36, 0.34), trimMat);
  pierCap.position.set(pierX, -1.22, 0.14);

  const pierShaft = new THREE.Mesh(new THREE.BoxGeometry(0.94, 6.2, 0.26), stoneMat);
  pierShaft.position.set(pierX, -4.45, 0.1);

  const pierBand = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.24, 0.32), trimMat);
  pierBand.position.set(pierX, -3.55, 0.13);

  const pierBase = new THREE.Mesh(new THREE.BoxGeometry(1.14, 1.2, 0.36), stoneMat);
  pierBase.position.set(pierX, -6.9, 0.14);

  g.add(pierCap, pierShaft, pierBand, pierBase);

  // 3. Recessed Gothic Stone Archway in center of bay
  const archRadius = 1.38;
  const archSpringY = -2.95;

  const archTopVoid = new THREE.Mesh(
    new THREE.CircleGeometry(archRadius, 18, 0, Math.PI),
    archVoidMat,
  );
  archTopVoid.position.set(0, archSpringY, 0.03);

  const archBottomVoid = new THREE.Mesh(
    new THREE.PlaneGeometry(archRadius * 2, 4.4),
    archVoidMat,
  );
  archBottomVoid.position.set(0, archSpringY - 2.2, 0.03);
  g.add(archTopVoid, archBottomVoid);

  // Wrought-iron castle portcullis grate bars recessed inside arch
  for (const bx of [-0.72, 0, 0.72]) {
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.6, 0.08), mats.ironBand);
    vBar.position.set(bx, archSpringY - 0.85, 0.07);
    g.add(vBar);
  }
  for (const by of [archSpringY + 0.38, archSpringY - 0.45, archSpringY - 1.35]) {
    const spanW = by > archSpringY ? archRadius * 1.68 : archRadius * 1.92;
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.08, 0.08), mats.ironBand);
    hBar.position.set(0, by, 0.08);
    g.add(hBar);
  }

  // Sculpted radial stone voussoirs curving over arch + prominent center keystone
  const voussoirCount = 9;
  for (let i = 0; i < voussoirCount; i++) {
    const frac = i / (voussoirCount - 1);
    const angle = Math.PI - frac * Math.PI; // Left (PI) -> Top (PI/2) -> Right (0)
    const isKeystone = i === Math.floor(voussoirCount / 2);
    const r = archRadius + (isKeystone ? 0.22 : 0.16);
    const vx = Math.cos(angle) * r;
    const vy = archSpringY + Math.sin(angle) * r;

    const block = new THREE.Mesh(
      new THREE.BoxGeometry(
        isKeystone ? 0.44 : 0.36,
        isKeystone ? 0.56 : 0.4,
        isKeystone ? 0.28 : 0.2,
      ),
      isKeystone && isInterior ? mats.goldTrim : stoneMat,
    );
    block.position.set(vx, vy, isKeystone ? 0.14 : 0.1);
    block.rotation.z = angle - Math.PI / 2;
    g.add(block);
  }

  // Side stone jamb blocks flanking the recessed arch opening
  for (const side of [-1, 1]) {
    for (let row = 0; row < 4; row++) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(row % 2 === 0 ? 0.36 : 0.28, 0.72, 0.2),
        stoneMat,
      );
      jamb.position.set(side * (archRadius + 0.16), archSpringY - 0.42 - row * 0.82, 0.1);
      g.add(jamb);
    }
  }

  // 4. Mounted medieval iron wall torch OR royal banner / iron mooring ring on the pier
  if (hasTorch) {
    const torchGroup = new THREE.Group();
    torchGroup.position.set(pierX, -2.35, 0.28);

    const mount = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.52, 0.12), mats.ironBand);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.32), mats.ironBand);
    arm.position.set(0, -0.05, 0.14);

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.62, 7), mats.woodDark);
    handle.position.set(0, 0.08, 0.28);
    handle.rotation.x = 0.18;

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.18, 8), mats.ironBand);
    cup.position.set(0, 0.38, 0.34);

    const outerFlameMat = new THREE.MeshBasicMaterial({ color: 0xff7b00 });
    const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.46, 8), outerFlameMat);
    outerFlame.position.set(0, 0.66, 0.35);

    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 7), innerFlameMat);
    innerFlame.position.set(0, 0.6, 0.39);

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffa020,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowHalo = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), glowMat);
    glowHalo.position.set(0, 0.64, 0.22);

    torchGroup.add(mount, arm, handle, cup, glowHalo, outerFlame, innerFlame);
    g.add(torchGroup);
    flames.push(outerFlame, innerFlame);
  } else if (isInterior) {
    const miniBanner = new THREE.Mesh(new THREE.BoxGeometry(0.56, 1.55, 0.08), mats.redPlume);
    miniBanner.position.set(pierX, -2.55, 0.26);
    const miniTrim = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.1), mats.goldTrim);
    miniTrim.position.set(pierX, -1.82, 0.27);
    g.add(miniBanner, miniTrim);
  } else {
    const ringPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8), mats.ironBand);
    ringPlate.rotation.x = Math.PI / 2;
    ringPlate.position.set(pierX, -2.4, 0.25);
    const ironRing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 6, 12), mats.ironBand);
    ironRing.position.set(pierX, -2.6, 0.29);
    g.add(ringPlate, ironRing);
  }

  return { group: g, flames };
}

