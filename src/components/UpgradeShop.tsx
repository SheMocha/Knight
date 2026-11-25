import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clapperboard,
  Coins,
  FlaskConical,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Store,
  Sword,
  Zap,
} from 'lucide-react';
import { AD_FREQUENCY_CONFIG, adFreeManager, AdManagerSnapshot } from '../game/ads';
import { getLevelConfig, TOTAL_LEVELS } from '../game/levels';
import { getCharmCost, getCharmLevel, SHOP_CHARMS, SHOP_WEAPONS } from '../game/shop';
import { CharmId, PlayerUpgrades, ShopOrigin, WeaponId } from '../game/types';

interface UpgradeShopProps {
  origin: ShopOrigin;
  currentLevelId: number;
  walletGold: number;
  upgrades: PlayerUpgrades;
  adSnapshot: AdManagerSnapshot;
  adFeedback: string | null;
  onBuyWeapon: (weaponId: WeaponId) => void;
  onEquipWeapon: (weaponId: WeaponId) => void;
  onBuyCharm: (charmId: CharmId) => void;
  onWatchShopRewarded: () => void;
  onBack: () => void;
  onContinueAction: () => void;
}

const SHOP_BANNER_SRC = '/src/assets/images/medieval_shop_banner_1795496419290.jpg';

const WeaponThumbSvg: React.FC<{ weapon: WeaponId }> = ({ weapon }) => (
  <svg viewBox="0 0 88 40" className="w-16 h-8 shrink-0">
    {weapon === 'mace' ? (
      <path
        d="M6 18 L54 17 L54 23 L6 22 Z M66 6 L69 13 L77 10 L73 17 L82 20 L73 23 L77 30 L69 27 L66 34 L63 27 L55 30 L59 23 L52 20 L59 17 L55 10 L63 13 Z"
        fill="#cbd5e1"
        stroke="#0f0c14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ) : weapon === 'excalibur' ? (
      <path
        d="M6 18 L20 18 L20 10 L26 10 L26 16 L70 15 L84 20 L70 25 L26 24 L26 30 L20 30 L20 22 L6 22 Z"
        fill="#f8fafc"
        stroke="#0f0c14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ) : weapon === 'axe' ? (
      <path
        d="M6 18 L60 17 L60 7 C74 7 82 13 84 20 C82 27 74 33 60 33 L60 23 L6 22 Z"
        fill="#cbd5e1"
        stroke="#0f0c14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ) : weapon === 'hammer' ? (
      <path
        d="M6 18 L54 18 L54 7 L80 7 L80 33 L54 33 L54 22 L6 22 Z"
        fill="#94a3b8"
        stroke="#0f0c14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ) : weapon === 'mallet' ? (
      <path
        d="M6 18 L54 18 L54 8 L78 8 L78 32 L54 32 L54 22 L6 22 Z"
        fill="#b46522"
        stroke="#0f0c14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    ) : (
      <path
        d="M6 20 C6 17 18 16 32 15 L72 10 C80 10 84 14 84 20 C84 26 80 30 72 30 L32 25 C18 24 6 23 6 20 Z"
        fill="#9a5b25"
        stroke="#0f0c14"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export const UpgradeShop: React.FC<UpgradeShopProps> = ({
  origin,
  currentLevelId,
  walletGold,
  upgrades,
  adSnapshot,
  adFeedback,
  onBuyWeapon,
  onEquipWeapon,
  onBuyCharm,
  onWatchShopRewarded,
  onBack,
  onContinueAction,
}) => {
  const [tab, setTab] = useState<'weapons' | 'charms'>('weapons');
  const [bannerError, setBannerError] = useState(false);

  const nextLevel = getLevelConfig(Math.min(TOTAL_LEVELS, currentLevelId + 1));

  const primaryCtaLabel =
    origin === 'LEVEL_CLEAR'
      ? `Bölüm ${nextLevel.id} Başlat`
      : origin === 'GAME_OVER'
        ? `Bölüm ${currentLevelId} Tekrar Dene`
        : `Bölüm ${currentLevelId} Oyna`;

  const bannerPad = adSnapshot.bannerVisible && adSnapshot.bannerHeightPx > 0 ? adSnapshot.bannerHeightPx : 0;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col bg-[#120e1b] text-white overflow-hidden"
      style={bannerPad > 0 ? { paddingBottom: `${bannerPad}px` } : undefined}
    >
      {/* Atmosferik Mağaza Üst Afişi */}
      <div className="relative h-36 shrink-0 overflow-hidden border-b-2 border-amber-500/40 bg-[#1c1528]">
        {!bannerError ? (
          <img
            src={SHOP_BANNER_SRC}
            alt="Eski Silah Dükkanı"
            referrerPolicy="no-referrer"
            onError={() => setBannerError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2c1f3e] to-[#130e1c]">
            <Store className="w-12 h-12 text-amber-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120e1b] via-[#120e1b]/55 to-black/55" />

        {/* Üst Navigasyon ve Altın Kesesi */}
        <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="arcade-btn-dark px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 text-amber-300" />
            <span>{origin === 'TITLE' ? 'Ana Menü' : 'Geri'}</span>
          </button>

          <div className="bg-[#140f1c]/95 border-2 border-amber-400/80 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
            <Coins className="w-4 h-4 text-yellow-300 shrink-0" />
            <span className="font-medieval text-xl text-yellow-300 leading-none tabular-nums">
              {walletGold.toLocaleString('tr-TR')}
            </span>
            <span className="text-[11px] font-bold text-amber-200/80">Altın</span>
          </div>
        </div>

        {/* Mağaza Başlığı */}
        <div className="absolute inset-x-0 bottom-2.5 px-4">
          <h1 className="font-medieval text-3xl text-amber-300 leading-none hud-text-stroke-sm">
            Eski Silah Dükkanı
          </h1>
          <p className="mt-0.5 text-xs text-amber-100/90">
            Biriktirdiğin altınlarla kalıcı silahlar ve tılsımlar edin.
          </p>
        </div>
      </div>

      {/* Sekme Seçici (Silahlar / Tılsımlar) */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#1d172a] border border-amber-500/25 rounded-xl">
          <button
            type="button"
            onClick={() => setTab('weapons')}
            className={`py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              tab === 'weapons'
                ? 'bg-amber-400 text-[#1c1304] shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sword className="w-4 h-4" />
            <span>Ağır Silahlar</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('charms')}
            className={`py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              tab === 'charms'
                ? 'bg-amber-400 text-[#1c1304] shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>İksir &amp; Tılsımlar</span>
          </button>
        </div>
      </div>

      {/* İsteğe Bağlı Ödüllü Reklam: Mağaza Ekstra Altın */}
      {adFreeManager.shouldAllowRewarded() && (
        <div className="px-4 pb-2 shrink-0">
          <button
            type="button"
            disabled={adSnapshot.isShowingFullScreenAd || adSnapshot.rewardedRemainingToday <= 0}
            onClick={onWatchShopRewarded}
            className="w-full py-2 px-3 rounded-xl bg-emerald-950/65 hover:bg-emerald-950/90 border border-emerald-400/50 text-emerald-100 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Clapperboard className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="truncate">
                Reklam İzle · +{AD_FREQUENCY_CONFIG.rewardedGold.extra_gold_shop} Altın Kazan
              </span>
            </span>
            <span className="text-[10px] font-black text-emerald-300 shrink-0 tabular-nums">
              {adSnapshot.rewardedRemainingToday}/{adSnapshot.rewardedDailyLimit}
            </span>
          </button>
          {adFeedback && (
            <p className="mt-1.5 text-[11px] font-semibold text-amber-200/90 bg-black/40 border border-amber-500/25 rounded-lg px-2.5 py-1 leading-snug">
              {adFeedback}
            </p>
          )}
        </div>
      )}

      {/* Kaydırılabilir Dikey Ürün Listesi */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {tab === 'weapons'
          ? SHOP_WEAPONS.map((w) => {
              const owned = upgrades.ownedWeapons.includes(w.id);
              const equipped = upgrades.equippedWeapon === w.id;
              const canAfford = walletGold >= w.cost;

              return (
                <div
                  key={w.id}
                  className={`p-3 rounded-2xl border-2 flex flex-col gap-2.5 ${
                    equipped
                      ? 'bg-amber-950/60 border-yellow-400'
                      : owned
                        ? 'bg-[#221a30] border-emerald-500/45'
                        : 'bg-[#1a1426] border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-xl bg-[#120d1a] border border-amber-500/25 flex items-center justify-center shrink-0">
                      <WeaponThumbSvg weapon={w.id} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-crest text-sm font-bold text-amber-200 truncate">
                          {w.name}
                        </span>
                        <span className="text-xs font-black text-yellow-300 tabular-nums shrink-0">
                          {w.cost === 0
                            ? 'Başlangıç'
                            : owned
                              ? 'Alındı'
                              : `${w.cost.toLocaleString('tr-TR')} Altın`}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-300 leading-snug">{w.description}</p>
                      <div className="mt-1 flex items-center gap-2.5 text-[11px] font-bold text-amber-100/90 tabular-nums">
                        <span>Güç ×{w.powerMult.toFixed(2)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Menzil {w.hitRange.toFixed(1)}m</span>
                      </div>
                    </div>
                  </div>

                  {equipped ? (
                    <div className="w-full py-2 rounded-xl bg-yellow-400/20 border border-yellow-400/60 text-yellow-300 text-xs font-black flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Kuşanıldı</span>
                    </div>
                  ) : owned ? (
                    <button
                      type="button"
                      onClick={() => onEquipWeapon(w.id)}
                      className="arcade-btn-dark w-full py-2 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Silahı Kuşan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyWeapon(w.id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-black ${
                        canAfford
                          ? 'arcade-btn-gold cursor-pointer'
                          : 'bg-slate-800/90 border-2 border-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford
                        ? `Satın Al (${w.cost.toLocaleString('tr-TR')} Altın)`
                        : `${w.cost.toLocaleString('tr-TR')} Altın Gerekli`}
                    </button>
                  )}
                </div>
              );
            })
          : SHOP_CHARMS.map((c) => {
              const lvl = getCharmLevel(upgrades, c.id);
              const maxed = lvl >= c.maxLevel;
              const cost = getCharmCost(c, lvl);
              const canAfford = !maxed && walletGold >= cost;

              const Icon =
                c.id === 'luckyAmulet'
                  ? Sparkles
                  : c.id === 'armorOil'
                    ? ShieldAlert
                    : Zap;

              return (
                <div
                  key={c.id}
                  className="p-3.5 rounded-2xl border-2 bg-[#1a1426] border-slate-700/80 flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#2a1f3d] border border-amber-400/40 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <div className="font-crest text-sm font-bold text-amber-200 leading-tight">
                          {c.name}
                        </div>
                        <div className="mt-0.5 text-xs font-bold text-emerald-300 tabular-nums">
                          Seviye {lvl} / {c.maxLevel}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-yellow-300 tabular-nums shrink-0">
                      {maxed ? 'MAKSİMUM' : `${cost.toLocaleString('tr-TR')} Altın`}
                    </span>
                  </div>

                  {/* Seviye Kademe Çubukları */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className={`h-2 rounded-full ${
                          lvl >= step ? 'bg-amber-400' : 'bg-slate-800 border border-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{c.description}</p>

                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuyCharm(c.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-black ${
                      maxed
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                        : canAfford
                          ? 'arcade-btn-gold cursor-pointer'
                          : 'bg-slate-800/90 border-2 border-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {maxed
                      ? 'En Üst Seviyede'
                      : canAfford
                        ? `Yükselt (${cost.toLocaleString('tr-TR')} Altın)`
                        : `${cost.toLocaleString('tr-TR')} Altın Gerekli`}
                  </button>
                </div>
              );
            })}
      </div>

      {/* Sabit Alt Aksiyon Çubuğu */}
      <div className="p-3.5 bg-[#161121] border-t-2 border-amber-500/30 shrink-0">
        <button
          type="button"
          onClick={onContinueAction}
          className="arcade-btn-gold w-full py-3 rounded-2xl text-base font-black flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          {origin === 'GAME_OVER' ? (
            <RotateCcw className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
          <span>{primaryCtaLabel}</span>
        </button>
      </div>
    </div>
  );
};
