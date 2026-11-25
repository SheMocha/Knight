import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  Coins,
  Crown,
  Flame,
  Home,
  Play,
  RotateCcw,
  Skull,
  Store,
  Trophy,
  Unlock,
  Volume2,
  VolumeX,
  Clapperboard,
} from 'lucide-react';
import { adFreeManager, AdManagerSnapshot, adManager } from '../game/ads';
import { getLevelConfig, TOTAL_LEVELS } from '../game/levels';
import { GameScreen, LevelResult } from '../game/types';
import { getWorldForLevel, TOTAL_WORLDS } from '../game/worlds';

interface GameModalsProps {
  screen: GameScreen;
  result: LevelResult | null;
  soundEnabled: boolean;
  adSnapshot: AdManagerSnapshot;
  levelClearRewardClaimed: boolean;
  adFeedback: string | null;
  onResume: () => void;
  onRetryLevel: () => void;
  onNextLevel: () => void;
  onOpenShop: () => void;
  onRestartRun: () => void;
  onMainMenu: () => void;
  onToggleSound: () => void;
  onWatchLevelClearRewarded: () => void;
}

const VICTORY_EMBERS = [
  { left: '10%', dur: '2.4s', delay: '0s', drift: '14px', size: 3 },
  { left: '22%', dur: '2.9s', delay: '0.4s', drift: '-12px', size: 2.5 },
  { left: '35%', dur: '2.2s', delay: '0.15s', drift: '10px', size: 3.5 },
  { left: '50%', dur: '2.7s', delay: '0.6s', drift: '-8px', size: 2.5 },
  { left: '64%', dur: '2.1s', delay: '0.25s', drift: '12px', size: 3 },
  { left: '78%', dur: '2.8s', delay: '0.5s', drift: '-14px', size: 2.5 },
  { left: '89%', dur: '2.3s', delay: '0.1s', drift: '8px', size: 3 },
];

const ModalCorner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none w-5 h-5 text-[#d6ac5c]/75 ${className}`}
  >
    <path d="M2 22V7C2 4.239 4.239 2 7 2H22" stroke="currentColor" strokeWidth="1.5" />
    <rect
      x="5.5"
      y="5.5"
      width="3.2"
      height="3.2"
      transform="rotate(45 5.5 5.5)"
      fill="currentColor"
      fillOpacity="0.7"
    />
  </svg>
);

export const GameModals: React.FC<GameModalsProps> = ({
  screen,
  result,
  soundEnabled,
  adSnapshot,
  levelClearRewardClaimed,
  adFeedback,
  onResume,
  onRetryLevel,
  onNextLevel,
  onOpenShop,
  onRestartRun,
  onMainMenu,
  onToggleSound,
  onWatchLevelClearRewarded,
}) => {
  const [bannerImgErr, setBannerImgErr] = useState(false);
  const [nextThumbErr, setNextThumbErr] = useState(false);

  useEffect(() => {
    setBannerImgErr(false);
    setNextThumbErr(false);
  }, [result?.levelId]);

  const clearedLevel = result ? getLevelConfig(result.levelId) : null;
  const clearedWorld = clearedLevel ? getWorldForLevel(clearedLevel.id) : null;
  const nextLevel =
    result && result.levelId < TOTAL_LEVELS ? getLevelConfig(result.levelId + 1) : null;
  const nextWorld = nextLevel ? getWorldForLevel(nextLevel.id) : null;
  const isNewWorldUnlock =
    Boolean(clearedWorld && nextWorld && nextWorld.id > clearedWorld.id);

  const hasBannerArt = Boolean(clearedLevel?.artwork) && !bannerImgErr;
  const hasNextArt = Boolean(nextLevel?.artwork) && !nextThumbErr;

  return (
    <>
      {/* DURAKLATMA MENÜSÜ */}
      {screen === 'PAUSED' && (
        <div className="df-animate-backdrop absolute inset-0 z-30 flex items-center justify-center bg-black/82 backdrop-blur-[2px] p-4">
          <div className="df-panel df-animate-reveal relative w-full max-w-xs rounded-xl p-5 text-center text-[#ebe5d9] overflow-hidden">
            <ModalCorner className="absolute top-1.5 left-1.5" />
            <ModalCorner className="absolute top-1.5 right-1.5 rotate-90" />
            <ModalCorner className="absolute bottom-1.5 left-1.5 -rotate-90" />
            <ModalCorner className="absolute bottom-1.5 right-1.5 rotate-180" />

            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#c49f59]">
              Sefer Duraklatıldı
            </p>
            <h2 className="mt-1 font-crest text-2xl font-black text-[#f4ebd9] tracking-wide">
              Duraklatıldı
            </h2>
            <p className="mt-1 text-xs text-[#9c9587]">Kısa bir soluklan, Kara Şövalye.</p>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onResume}
                className="df-cta-gold w-full py-3 rounded-lg font-crest font-black text-sm tracking-[0.12em] uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Devam Et</span>
              </button>

              <button
                type="button"
                onClick={onRetryLevel}
                className="df-btn-iron w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#d8b163]" />
                <span>Bölümü Yeniden Başlat</span>
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                className="df-btn-iron w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#d8b163]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <span>Ses: {soundEnabled ? 'Açık' : 'Kapalı'}</span>
              </button>

              <button
                type="button"
                onClick={onMainMenu}
                className="df-btn-iron w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#a8a095]" />
                <span>Ana Menü</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BÖLÜM TAMAMLANDI — ÖZEL DARK FANTASY ZAFER EKRANI */}
      {screen === 'LEVEL_CLEAR' && result && clearedLevel && clearedWorld && (
        <div className="df-animate-backdrop absolute inset-0 z-30 flex items-center justify-center bg-black/88 backdrop-blur-[3px] p-3">
          <div className="df-panel df-animate-reveal relative w-full max-w-[390px] max-h-[94%] flex flex-col rounded-xl text-center text-[#ebe5d9] overflow-hidden">
            <ModalCorner className="absolute top-1.5 left-1.5 z-20" />
            <ModalCorner className="absolute top-1.5 right-1.5 z-20 rotate-90" />
            <ModalCorner className="absolute bottom-1.5 left-1.5 z-20 -rotate-90" />
            <ModalCorner className="absolute bottom-1.5 right-1.5 z-20 rotate-180" />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-14 h-36 z-20 overflow-hidden"
            >
              {VICTORY_EMBERS.map((e, i) => (
                <span
                  key={i}
                  className="df-ember absolute bottom-0 rounded-full bg-[#f5d27b] shadow-[0_0_8px_rgba(245,210,123,0.9)]"
                  style={
                    {
                      left: e.left,
                      width: `${e.size}px`,
                      height: `${e.size}px`,
                      '--ember-dur': e.dur,
                      '--ember-delay': e.delay,
                      '--ember-drift': e.drift,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            {/* Üst Zafer İllüstrasyon Şeridi & Parlayan Arma */}
            <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#0a0c12]">
              {hasBannerArt ? (
                <img
                  src={clearedLevel.artwork}
                  alt={clearedLevel.name}
                  referrerPolicy="no-referrer"
                  onError={() => setBannerImgErr(true)}
                  className="w-full h-full object-cover object-center brightness-[0.55] saturate-[0.95]"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-b ${clearedLevel.fallbackGradient}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1119] via-[#0f1119]/55 to-black/35" />

              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <div className="relative flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="df-crest-pulse absolute w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(234,187,88,0.45)_0%,rgba(234,187,88,0)_70%)]"
                  />
                  <div className="relative w-12 h-12 rotate-45 rounded-md bg-gradient-to-b from-[#2b2213] to-[#14100a] border border-[#ebc46c] shadow-[0_0_20px_rgba(235,196,108,0.4)] flex items-center justify-center">
                    {result.isBossLevel ? (
                      <Crown className="-rotate-45 w-6 h-6 text-[#f5d684]" />
                    ) : (
                      <Trophy className="-rotate-45 w-6 h-6 text-[#f5d684]" />
                    )}
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#dfc17e] drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                  Dünya {clearedWorld.id} · Bölüm {result.levelId} · {result.levelName}
                </p>
              </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-5 pt-1">
              <h2 className="font-crest text-[23px] font-black tracking-[0.08em] text-[#faf1dc] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                {result.isBossLevel ? 'BOSS YENİLDİ!' : 'BÖLÜM TAMAMLANDI'}
              </h2>

              {result.isBossLevel && result.bossName && (
                <p className="mt-0.5 text-xs font-bold text-amber-300">
                  {result.bossName} diz çöktü! Büyük hazine senin!
                </p>
              )}

              {result.isNewBest && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-crest font-black tracking-[0.18em] uppercase text-[#f6d680]">
                  <Award className="w-3.5 h-3.5 text-[#f6d680]" />
                  <span>YENİ REKOR</span>
                </div>
              )}

              <div className="mt-3.5 py-3 border-y border-[#c79d4e]/25 space-y-2 text-sm tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#aba395]">Kazanılan Skor</span>
                  <span className="font-crest font-bold text-[#f3e5c3]">
                    {result.levelScore.toLocaleString('tr-TR')}{' '}
                    {!result.isBossLevel && (
                      <span className="text-xs font-sans font-normal text-[#8e877b]">
                        / {result.scoreTarget.toLocaleString('tr-TR')}
                        {result.maxScore > 0 && result.levelScore >= result.maxScore && ' · MAKS'}
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#aba395]">Kazanılan Altın</span>
                  <span className="font-crest font-bold text-[#f2cb6c] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#eab84c]" />+
                    {result.levelGold.toLocaleString('tr-TR')}
                  </span>
                </div>

                <div className="pt-1.5 border-t border-white/8 flex items-center justify-between text-xs">
                  <span className="text-[#938c80]">Toplam Altın Kesesi</span>
                  <span className="font-bold text-[#d8c49a]">
                    {result.walletGold.toLocaleString('tr-TR')} Altın
                  </span>
                </div>
              </div>

              {/* Sonraki Bölüm / Yeni Dünya / Boss Uyarısı */}
              {nextLevel && nextWorld && (
                <div
                  className={`relative mt-3.5 rounded-lg border bg-[#14161f]/90 overflow-hidden text-left ${
                    nextLevel.isBossLevel ? 'border-rose-500/70' : 'border-[#d6aa57]/45'
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="df-light-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#f6d98e]/16 to-transparent"
                  />
                  <div className="relative z-10 p-2.5 flex items-center gap-3">
                    <div className="relative w-14 h-12 rounded overflow-hidden shrink-0 border border-[#c79d4e]/40 bg-[#0b0d13] flex items-center justify-center">
                      {hasNextArt ? (
                        <img
                          src={nextLevel.artwork}
                          alt={nextLevel.name}
                          referrerPolicy="no-referrer"
                          onError={() => setNextThumbErr(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${nextLevel.fallbackGradient} flex items-center justify-center`}
                        >
                          {nextLevel.isBossLevel && <Skull className="w-5 h-5 text-rose-300" />}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`flex items-center gap-1.5 text-[10px] font-bold tracking-[0.14em] uppercase ${
                          nextLevel.isBossLevel ? 'text-rose-300' : 'text-[#e6c06a]'
                        }`}
                      >
                        {nextLevel.isBossLevel ? (
                          <Flame className="w-3 h-3 shrink-0" />
                        ) : (
                          <Unlock className="w-3 h-3 shrink-0" />
                        )}
                        <span>
                          {nextLevel.isBossLevel
                            ? 'Sıradaki: BOSS SAVAŞI!'
                            : isNewWorldUnlock
                              ? `Yeni Dünya: ${nextWorld.name}`
                              : result.newlyUnlockedLevel === nextLevel.id
                                ? 'Yeni Bölüm Açıldı'
                                : 'Sıradaki Bölüm Hazır'}
                        </span>
                      </div>
                      <p className="mt-0.5 font-crest text-sm font-bold text-[#f4ecdc] truncate">
                        Bölüm {nextLevel.id}: {nextLevel.name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* İsteğe Bağlı Ödüllü Reklam: Bölüm Sonu Ekstra Altın */}
              {!levelClearRewardClaimed &&
                adFreeManager.shouldAllowRewarded() &&
                adSnapshot.rewardedRemainingToday > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={adSnapshot.isShowingFullScreenAd}
                    onClick={onWatchLevelClearRewarded}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#19231b] hover:bg-[#1f2e22] border border-emerald-400/55 text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Clapperboard className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>
                      Reklam İzle · +
                      {adManager
                        .computeRewardGold('level_clear_bonus', result.levelGold)
                        .toLocaleString('tr-TR')}{' '}
                      Ekstra Altın (İsteğe Bağlı)
                    </span>
                  </button>
                </div>
              )}

              {adFeedback && (
                <p className="mt-2 text-[11px] font-semibold text-amber-200/90 bg-black/40 border border-amber-500/25 rounded-lg px-2.5 py-1.5 leading-snug">
                  {adFeedback}
                </p>
              )}

              <div className="mt-3.5 flex flex-col gap-2.5">
                <button
                  type="button"
                  disabled={adSnapshot.isShowingFullScreenAd}
                  onClick={onNextLevel}
                  className="df-cta-gold w-full py-3.5 px-5 rounded-lg font-crest font-black text-base tracking-[0.12em] uppercase flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f5da91] disabled:opacity-60"
                >
                  <span className="whitespace-nowrap">
                    {nextLevel?.isBossLevel ? 'BOSS SAVAŞINA GİR' : 'SONRAKİ BÖLÜM'}
                  </span>
                  <ArrowRight className="w-5 h-5 shrink-0" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenShop}
                    className="df-btn-iron py-2.5 px-3 rounded-lg font-bold text-xs text-[#e6c473] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Store className="w-4 h-4 text-[#e5be69] shrink-0" />
                    <span>Mağaza</span>
                  </button>
                  <button
                    type="button"
                    onClick={onMainMenu}
                    className="df-btn-iron py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Home className="w-4 h-4 text-[#a8a095] shrink-0" />
                    <span>Ana Menü</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BÜYÜK ZAFER EKRANI (60. Bölüm — Kadim Kızıl Ejderha Yenilince) */}
      {screen === 'VICTORY' && result && clearedLevel && (
        <div className="df-animate-backdrop absolute inset-0 z-30 flex items-center justify-center bg-black/88 backdrop-blur-[3px] p-3">
          <div className="df-panel df-animate-reveal relative w-full max-w-[390px] max-h-[94%] flex flex-col rounded-xl text-center text-[#ebe5d9] overflow-hidden">
            <ModalCorner className="absolute top-1.5 left-1.5 z-20" />
            <ModalCorner className="absolute top-1.5 right-1.5 z-20 rotate-90" />
            <ModalCorner className="absolute bottom-1.5 left-1.5 z-20 -rotate-90" />
            <ModalCorner className="absolute bottom-1.5 right-1.5 z-20 rotate-180" />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-10 h-40 z-20 overflow-hidden"
            >
              {VICTORY_EMBERS.map((e, i) => (
                <span
                  key={i}
                  className="df-ember absolute bottom-0 rounded-full bg-[#f5d27b] shadow-[0_0_8px_rgba(245,210,123,0.9)]"
                  style={
                    {
                      left: e.left,
                      width: `${e.size}px`,
                      height: `${e.size}px`,
                      '--ember-dur': e.dur,
                      '--ember-delay': e.delay,
                      '--ember-drift': e.drift,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            <div className="relative h-32 w-full shrink-0 overflow-hidden bg-[#0a0c12]">
              {hasBannerArt ? (
                <img
                  src={clearedLevel.artwork}
                  alt={clearedLevel.name}
                  referrerPolicy="no-referrer"
                  onError={() => setBannerImgErr(true)}
                  className="w-full h-full object-cover object-center brightness-[0.58]"
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-b ${clearedLevel.fallbackGradient}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1119] via-[#0f1119]/50 to-black/30" />

              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <div className="relative flex items-center justify-center">
                  <div
                    aria-hidden="true"
                    className="df-crest-pulse absolute w-18 h-18 rounded-full bg-[radial-gradient(circle,rgba(240,196,92,0.5)_0%,rgba(240,196,92,0)_70%)]"
                  />
                  <div className="relative w-12 h-12 rotate-45 rounded-md bg-gradient-to-b from-[#332610] to-[#140f08] border border-[#f2cf78] shadow-[0_0_24px_rgba(242,207,120,0.48)] flex items-center justify-center">
                    <Crown className="-rotate-45 w-6 h-6 text-[#f8dd8e]" />
                  </div>
                </div>
                <p className="mt-2.5 text-[11px] font-semibold tracking-[0.16em] uppercase text-[#e6c678]">
                  {TOTAL_WORLDS} Dünya · Tüm {TOTAL_LEVELS} Bölüm Tamamlandı
                </p>
              </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-5 pt-1">
              <h2 className="font-crest text-[24px] font-black tracking-[0.08em] text-[#faf1dc]">
                EJDERHA FATİHİ!
              </h2>
              <p className="mt-1 text-xs text-amber-200/90">
                {result.bossName
                  ? `${result.bossName} yenildi! 10 krallığın efsane Kara Şövalyesi sensin!`
                  : 'Tüm 60 bölümü fethederek Kara Şövalye efsanesini tamamladın!'}
              </p>

              {result.isNewBest && (
                <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-crest font-black tracking-[0.18em] uppercase text-[#f6d680]">
                  <Award className="w-3.5 h-3.5 text-[#f6d680]" />
                  <span>YENİ REKOR</span>
                </div>
              )}

              <div className="mt-3.5 py-3 border-y border-[#c79d4e]/25 space-y-2 text-sm tabular-nums">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#aba395]">Final Skoru</span>
                  <span className="font-crest font-bold text-[#f3e5c3]">
                    {result.levelScore.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#aba395]">Kazanılan Altın</span>
                  <span className="font-crest font-bold text-[#f2cb6c] flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#eab84c]" />+
                    {result.levelGold.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-white/8 flex items-center justify-between text-xs">
                  <span className="text-[#938c80]">Toplam Altın Kesesi</span>
                  <span className="font-bold text-[#d8c49a]">
                    {result.walletGold.toLocaleString('tr-TR')} Altın
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onRestartRun}
                  className="df-cta-gold w-full py-3.5 px-5 rounded-lg font-crest font-black text-sm tracking-[0.12em] uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Seferi Baştan Oyna</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenShop}
                    className="df-btn-iron py-2.5 px-3 rounded-lg font-bold text-xs text-[#e6c473] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Store className="w-4 h-4 text-[#e5be69] shrink-0" />
                    <span>Mağaza</span>
                  </button>
                  <button
                    type="button"
                    onClick={onMainMenu}
                    className="df-btn-iron py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Home className="w-4 h-4 text-[#a8a095] shrink-0" />
                    <span>Ana Menü</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OYUN BİTTİ: Yasak NPC İhlali / Süre Doldu / Boss Yenilgisi */}
      {screen === 'GAME_OVER' && result && (
        <div className="df-animate-backdrop absolute inset-0 z-30 flex items-center justify-center bg-black/86 backdrop-blur-[2px] p-4">
          <div className="df-panel df-animate-reveal relative w-full max-w-sm rounded-xl p-5 text-center text-[#ebe5d9] overflow-hidden border-[#9e3c3c]/50">
            <ModalCorner className="absolute top-1.5 left-1.5 text-[#b54d4d]/75" />
            <ModalCorner className="absolute top-1.5 right-1.5 rotate-90 text-[#b54d4d]/75" />
            <ModalCorner className="absolute bottom-1.5 left-1.5 -rotate-90 text-[#b54d4d]/75" />
            <ModalCorner className="absolute bottom-1.5 right-1.5 rotate-180 text-[#b54d4d]/75" />

            <div className="mx-auto w-11 h-11 rotate-45 rounded-md bg-[#231216] border border-[#b54d4d]/70 flex items-center justify-center">
              <Skull className="-rotate-45 w-5 h-5 text-[#e26d6d]" />
            </div>

            <p className="mt-3 text-[10px] font-semibold tracking-[0.18em] uppercase text-[#d87373]">
              Dünya {result.worldId} · Bölüm {result.levelId} ·{' '}
              {result.failTitle ? 'Bölüm Başarısız' : 'Hedef Tutturulamadı'}
            </p>
            <h2 className="mt-1 font-crest text-2xl font-black text-[#f3d4d4] tracking-wide leading-tight">
              {result.failTitle || 'Kovuldun!'}
            </h2>
            <p className="mt-1.5 text-xs text-[#aba398] leading-relaxed">
              {result.failReason ? (
                result.failReason
              ) : (
                <>
                  Kral çok öfkeli! Süre dolmadan bu bölüm için gereken{' '}
                  <strong className="text-[#ebe1d0]">
                    {result.scoreTarget.toLocaleString('tr-TR')}
                  </strong>{' '}
                  skor hedefine ulaşamadın.
                </>
              )}
            </p>

            <div className="mt-4 py-3 border-y border-[#b54d4d]/25 text-sm space-y-2 tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#aba395]">Bölüm Skoru</span>
                <span className="font-crest font-bold text-[#e2b4b4]">
                  {result.levelScore.toLocaleString('tr-TR')}
                  {!result.isBossLevel && ` / ${result.scoreTarget.toLocaleString('tr-TR')}`}
                </span>
              </div>
              <div className="pt-1.5 border-t border-white/8 flex items-center justify-between text-xs">
                <span className="text-[#938c80]">Mevcut Altın Kesesi</span>
                <span className="font-bold text-[#d8c49a]">
                  {result.walletGold.toLocaleString('tr-TR')} Altın
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onRetryLevel}
                className="df-cta-gold w-full py-3 rounded-lg font-crest font-black text-sm tracking-[0.12em] uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tekrar Dene</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onOpenShop}
                  className="df-btn-iron py-2.5 rounded-lg font-bold text-xs text-[#e6c473] flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Store className="w-4 h-4 text-[#e5be69]" />
                  <span>Mağaza</span>
                </button>
                <button
                  type="button"
                  onClick={onMainMenu}
                  className="df-btn-iron py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Home className="w-4 h-4 text-[#a8a095]" />
                  <span>Ana Menü</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
