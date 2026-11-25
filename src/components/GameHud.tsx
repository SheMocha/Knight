import React from 'react';
import {
  ArrowRight,
  Coins,
  Flame,
  Pause,
  Sparkles,
  Star,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { getComboScoreBonusPct } from '../game/scoreManager';
import { BonusKind, FloatingPopup, HudSnapshot, WeaponId } from '../game/types';
import { TOTAL_LEVELS } from '../game/worlds';
import { BossTopBar, BossTouchControls } from './BossControlsHud';
import { ScreenFxOverlay } from './ScreenFxOverlay';

interface GameHudProps {
  hud: HudSnapshot;
  popups: FloatingPopup[];
  soundEnabled: boolean;
  onPause: () => void;
  onToggleSound: () => void;
  onFinishEarly: () => void;
  onBossMove: (vx: number) => void;
  onBossJump: () => void;
  onAttackStart: () => void;
  onAttackRelease: () => void;
}

function formatClock(sec: number): string {
  const clamped = Math.max(0, Math.ceil(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const BONUS_STYLE_MAP: Record<
  BonusKind,
  { border: string; bg: string; titleColor: string; glow: string }
> = {
  gold_rush: {
    border: 'border-yellow-300',
    bg: 'from-amber-900/95 via-yellow-900/92 to-amber-950/95',
    titleColor: 'text-yellow-300',
    glow: 'shadow-[0_0_28px_rgba(250,204,21,0.55)]',
  },
  double_score: {
    border: 'border-sky-300',
    bg: 'from-sky-900/95 via-blue-950/92 to-slate-950/95',
    titleColor: 'text-sky-300',
    glow: 'shadow-[0_0_28px_rgba(56,189,248,0.55)]',
  },
  power_surge: {
    border: 'border-orange-300',
    bg: 'from-rose-950/95 via-red-900/92 to-orange-950/95',
    titleColor: 'text-orange-300',
    glow: 'shadow-[0_0_28px_rgba(251,113,133,0.58)]',
  },
  extra_points: {
    border: 'border-emerald-300',
    bg: 'from-emerald-950/95 via-teal-900/92 to-slate-950/95',
    titleColor: 'text-emerald-300',
    glow: 'shadow-[0_0_28px_rgba(52,211,153,0.55)]',
  },
};

const BonusIcon: React.FC<{ kind: BonusKind; className?: string }> = ({ kind, className }) => {
  if (kind === 'gold_rush') return <Coins className={className} />;
  if (kind === 'double_score') return <Sparkles className={className} />;
  if (kind === 'power_surge') return <Zap className={className} />;
  return <Star className={className} />;
};

const WeaponPowerGaugeSvg: React.FC<{ weapon: WeaponId; charge: number }> = ({
  weapon,
  charge,
}) => {
  const pct = Math.max(0, Math.min(1, charge));
  const full = pct >= 0.97;
  const clipW = 160 * pct;

  return (
    <svg
      viewBox="0 0 180 42"
      className={`w-48 h-auto drop-shadow-[0_3px_0_rgba(0,0,0,0.85)] ${
        full ? 'scale-105' : ''
      } transition-transform duration-100`}
      aria-label={`Silah gücü yüzde ${Math.round(pct * 100)}`}
    >
      <defs>
        <linearGradient id="powerFillGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="55%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>
        <clipPath id="weaponChargeClip">
          <rect x="8" y="0" width={clipW} height="42" />
        </clipPath>
      </defs>

      {weapon === 'mace' ? (
        <>
          <path
            d="M10 18 L122 16 L122 26 L10 24 Z M142 6 L146 14 L156 10 L150 18 L162 21 L150 25 L156 32 L146 28 L142 36 L137 28 L128 32 L133 24 L124 21 L133 17 L128 10 L137 14 Z"
            fill="#1f1929"
            stroke="#100c12"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M10 18 L122 16 L122 26 L10 24 Z M142 6 L146 14 L156 10 L150 18 L162 21 L150 25 L156 32 L146 28 L142 36 L137 28 L128 32 L133 24 L124 21 L133 17 L128 10 L137 14 Z"
            fill="url(#powerFillGrad)"
            clipPath="url(#weaponChargeClip)"
          />
        </>
      ) : weapon === 'excalibur' ? (
        <>
          <path
            d="M10 18 L34 18 L34 10 L42 10 L42 16 L146 15 L168 21 L146 27 L42 26 L42 32 L34 32 L34 24 L10 24 Z"
            fill="#1f1929"
            stroke="#100c12"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M10 18 L34 18 L34 10 L42 10 L42 16 L146 15 L168 21 L146 27 L42 26 L42 32 L34 32 L34 24 L10 24 Z"
            fill="url(#powerFillGrad)"
            clipPath="url(#weaponChargeClip)"
          />
        </>
      ) : weapon === 'axe' ? (
        <>
          <path
            d="M10 18 L138 17 L138 8 C154 8 164 14 166 21 C164 28 154 34 138 34 L138 25 L10 24 Z"
            fill="#1f1929"
            stroke="#100c12"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M10 18 L138 17 L138 8 C154 8 164 14 166 21 C164 28 154 34 138 34 L138 25 L10 24 Z"
            fill="url(#powerFillGrad)"
            clipPath="url(#weaponChargeClip)"
          />
        </>
      ) : weapon === 'hammer' || weapon === 'mallet' ? (
        <>
          <path
            d="M10 18 L128 18 L128 8 L162 8 L162 34 L128 34 L128 24 L10 24 Z"
            fill="#1f1929"
            stroke="#100c12"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M10 18 L128 18 L128 8 L162 8 L162 34 L128 34 L128 24 L10 24 Z"
            fill="url(#powerFillGrad)"
            clipPath="url(#weaponChargeClip)"
          />
        </>
      ) : (
        <>
          <path
            d="M10 21 C10 17 24 16 44 15 L144 9 C158 9 166 14 166 21 C166 28 158 33 144 33 L44 27 C24 26 10 25 10 21 Z"
            fill="#5c3415"
            stroke="#100c12"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M10 21 C10 17 24 16 44 15 L144 9 C158 9 166 14 166 21 C166 28 158 33 144 33 L44 27 C24 26 10 25 10 21 Z"
            fill="url(#powerFillGrad)"
            clipPath="url(#weaponChargeClip)"
          />
        </>
      )}
    </svg>
  );
};

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  popups,
  soundEnabled,
  onPause,
  onToggleSound,
  onFinishEarly,
  onBossMove,
  onBossJump,
  onAttackStart,
  onAttackRelease,
}) => {
  const timeRatio = Math.max(0, Math.min(1, hud.timeLeft / Math.max(1, hud.timeLimit)));
  const scoreRatio = Math.max(0, Math.min(1, hud.levelScore / Math.max(1, hud.scoreTarget)));
  const remainingScore = Math.max(0, hud.scoreTarget - hud.levelScore);
  const isScoreCapped = hud.scoreCapped || hud.levelScore >= hud.maxScore;
  const comboRatio = Math.max(0, Math.min(1, hud.comboTimeLeft / Math.max(0.1, hud.comboDuration)));
  const isUrgent = hud.timeLeft <= 12 && !hud.quotaMet;
  const isPig = hud.pigTimeLeft > 0;
  const isDizzy = hud.dizzyTimeLeft > 0;
  const isFullCharge = hud.charge >= 0.97;
  const hasDoubleScore = hud.doubleScoreTimeLeft > 0;
  const hasPowerSurge = hud.powerSurgeTimeLeft > 0;
  const comboBonusPct = getComboScoreBonusPct(hud.combo);
  const isEpicCombo = hud.combo >= 7;
  const isFireCombo = hud.combo >= 4;
  const isBossMode = hud.isBossLevel && hud.boss !== null;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none select-none overflow-hidden flex flex-col justify-between">
      {/* TAM EKRAN EĞLENCELİ EFEKTLER (Tavuk Tüyleri, Mantar Sersemliği, Havai Fişek, Buz, Arılar vb.) */}
      <ScreenFxOverlay effects={hud.screenEffects} />

      {/* ÜST DİKEY HUD BLOĞU */}
      <div className="w-full px-3 pt-2.5 flex flex-col gap-2">
        {/* Satır 1: Dünya & Bölüm Adı + Altın Kesesi + Ses / Duraklat */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-medieval text-xl leading-none text-white hud-text-stroke whitespace-nowrap">
                Bölüm {hud.levelId}/{TOTAL_LEVELS}
              </span>
              <span className="text-[11px] font-extrabold text-amber-200 hud-text-stroke-sm truncate">
                {hud.levelName}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] font-extrabold hud-text-stroke-sm tabular-nums">
              <span className="text-sky-200/90 truncate max-w-[130px]">
                D{hud.worldId} · {hud.worldName}
              </span>
              <span className="flex items-center gap-1 text-yellow-300 shrink-0">
                <Coins className="w-3.5 h-3.5 shrink-0" />
                <span>{hud.walletGold.toLocaleString('tr-TR')}</span>
                {hud.levelGold > 0 && (
                  <span className="text-emerald-300">(+{hud.levelGold.toLocaleString('tr-TR')})</span>
                )}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 pointer-events-auto shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
              className="arcade-btn-dark w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>
            <button
              type="button"
              onClick={onPause}
              aria-label="Oyunu duraklat"
              className="arcade-btn-dark w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            >
              <Pause className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Satır 2: Boss Moduysa Büyük Boss HP Barı; Normal Bölümse Skor Hedefi + Süre */}
        {isBossMode && hud.boss ? (
          <BossTopBar
            boss={hud.boss}
            timeLeft={hud.timeLeft}
            timeLimit={hud.timeLimit}
            levelScore={hud.levelScore}
          />
        ) : (
          <div className="grid grid-cols-12 gap-2.5 items-end bg-[#120e1c]/85 border border-amber-400/25 rounded-2xl px-3 py-2">
            <div className="col-span-7 flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-extrabold text-sky-200 flex items-center gap-1">
                  <span>Skor</span>
                  {isScoreCapped ? (
                    <span className="text-[9px] font-black text-amber-200 bg-amber-500/25 border border-amber-400/60 px-1 rounded">
                      MAKS
                    </span>
                  ) : (
                    hasDoubleScore && (
                      <span className="text-[10px] font-black text-sky-300 bg-sky-500/25 border border-sky-400/60 px-1 rounded">
                        2X
                      </span>
                    )
                  )}
                </span>
                <span
                  className={`font-medieval text-lg leading-none hud-text-stroke-sm tabular-nums whitespace-nowrap ${
                    isScoreCapped
                      ? 'text-amber-300'
                      : hud.quotaMet
                        ? 'text-emerald-300'
                        : hasDoubleScore
                          ? 'text-sky-300'
                          : 'text-sky-200'
                  }`}
                >
                  {hud.levelScore.toLocaleString('tr-TR')} /{' '}
                  {hud.scoreTarget.toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#17121f] border-2 border-[#0b0810] rounded-full overflow-hidden">
                <div
                  className={`h-full origin-left transition-transform duration-150 ${
                    isScoreCapped
                      ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300'
                      : hud.quotaMet
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                        : hasDoubleScore
                          ? 'bg-gradient-to-r from-sky-400 via-yellow-300 to-cyan-300'
                          : 'bg-gradient-to-r from-sky-500 via-cyan-300 to-sky-300'
                  }`}
                  style={{ transform: `scaleX(${Math.max(0.01, scoreRatio)})` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold tabular-nums leading-none">
                {isScoreCapped ? (
                  <span className="text-amber-300">
                    Maksimum Skor ({hud.maxScore.toLocaleString('tr-TR')})
                  </span>
                ) : remainingScore > 0 ? (
                  <span className="text-sky-200/80">
                    Kalan: {remainingScore.toLocaleString('tr-TR')}
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    Hedef Tamam · Üst Sınır: {hud.maxScore.toLocaleString('tr-TR')}
                  </span>
                )}
              </div>
            </div>

            <div className="col-span-5 flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-extrabold text-amber-100/90">Süre</span>
                <span
                  className={`font-medieval text-xl leading-none hud-text-stroke-sm tabular-nums ${
                    isUrgent ? 'text-red-400' : 'text-white'
                  }`}
                >
                  {formatClock(hud.timeLeft)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#17121f] border-2 border-[#0b0810] rounded-full overflow-hidden">
                <div
                  className={`h-full origin-left transition-transform duration-150 ${
                    isUrgent ? 'bg-red-500' : 'bg-yellow-300'
                  }`}
                  style={{ transform: `scaleX(${Math.max(0.01, timeRatio)})` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Satır 3: CANLI KOMBO GÖSTERGESİ (Solda) + AKTİF BONUS SÜRELERİ (Sağda) */}
        {(hud.combo >= 2 || hasDoubleScore || hasPowerSurge) && (
          <div className="flex items-start justify-between gap-2">
            {/* Kombo Göstergesi + Kısa Geri Sayım Çubuğu */}
            <div>
              {hud.combo >= 2 && (
                <div
                  key={hud.combo}
                  className={`combo-pop inline-flex flex-col px-2.5 py-1.5 rounded-xl border-2 ${
                    isEpicCombo
                      ? 'bg-gradient-to-r from-red-950/95 via-orange-950/95 to-amber-950/95 border-rose-400 combo-epic-glow'
                      : isFireCombo
                        ? 'bg-gradient-to-r from-orange-950/92 to-amber-950/92 border-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.45)]'
                        : 'bg-[#121629]/90 border-sky-400/80 shadow-[0_4px_12px_rgba(0,0,0,0.45)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isFireCombo && (
                      <Flame
                        className={`w-4 h-4 shrink-0 ${
                          isEpicCombo ? 'text-rose-400' : 'text-orange-400'
                        }`}
                      />
                    )}
                    <span
                      className={`font-medieval text-2xl leading-none hud-text-stroke-sm tabular-nums ${
                        isEpicCombo
                          ? 'text-yellow-300'
                          : isFireCombo
                            ? 'text-orange-300'
                            : 'text-sky-300'
                      }`}
                    >
                      x{hud.combo}
                    </span>
                    <div className="flex flex-col leading-tight">
                      <span className="text-[10px] font-black tracking-wider text-white">
                        {isEpicCombo ? 'EFSANE KOMBO' : isFireCombo ? 'ALEV KOMBO' : 'KOMBO'}
                      </span>
                      <span className="text-[10px] font-extrabold text-amber-300 tabular-nums">
                        +%{comboBonusPct} SKOR
                      </span>
                    </div>
                  </div>
                  {/* Hızla azalan kombo süre çubuğu */}
                  <div className="mt-1 w-full h-1.5 bg-black/75 rounded-full overflow-hidden">
                    <div
                      className={`h-full origin-left ${
                        isEpicCombo
                          ? 'bg-gradient-to-r from-rose-500 via-orange-400 to-yellow-300'
                          : isFireCombo
                            ? 'bg-gradient-to-r from-orange-500 to-yellow-300'
                            : 'bg-gradient-to-r from-sky-400 to-cyan-200'
                      }`}
                      style={{ transform: `scaleX(${comboRatio})` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Aktif Süreli Bonus Rozetleri */}
            <div className="flex flex-col items-end gap-1.5">
              {hasDoubleScore && (
                <div className="px-2.5 py-1 rounded-xl bg-sky-950/92 border-2 border-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.4)]">
                  <div className="flex items-center gap-1 text-[11px] font-black text-sky-200 tabular-nums">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                    <span>2X SKOR</span>
                    <span className="text-yellow-300">{hud.doubleScoreTimeLeft.toFixed(1)}sn</span>
                  </div>
                  <div className="mt-0.5 w-full h-1 bg-black/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-300 origin-left"
                      style={{
                        transform: `scaleX(${Math.max(0, hud.doubleScoreTimeLeft / Math.max(0.1, hud.doubleScoreDuration))})`,
                      }}
                    />
                  </div>
                </div>
              )}

              {hasPowerSurge && (
                <div className="px-2.5 py-1 rounded-xl bg-rose-950/92 border-2 border-orange-400 shadow-[0_0_14px_rgba(251,113,133,0.45)]">
                  <div className="flex items-center gap-1 text-[11px] font-black text-orange-200 tabular-nums">
                    <Zap className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                    <span>SÜPER GÜÇ</span>
                    <span className="text-yellow-300">{hud.powerSurgeTimeLeft.toFixed(1)}sn</span>
                  </div>
                  <div className="mt-0.5 w-full h-1 bg-black/70 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 origin-left"
                      style={{
                        transform: `scaleX(${Math.max(0, hud.powerSurgeTimeLeft / Math.max(0.1, hud.powerSurgeDuration))})`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kota Tamamlandığında Hızlı Bitirme Butonu (Yalnızca Normal Bölümler) */}
        {hud.quotaMet && !isBossMode && (
          <div className="flex items-center justify-center gap-2 pointer-events-auto">
            <span className="text-xs font-black text-emerald-300 hud-text-stroke-sm">
              HEDEF TAMAMLANDI!
            </span>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onFinishEarly();
              }}
              className="arcade-btn-gold px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>{hud.levelId >= TOTAL_LEVELS ? 'Zaferi Al' : 'Bölümü Bitir'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* BÖLÜM ÖZEL OLAY BİLDİRİMİ (Altın Yağmuru, Hızlı Dalga, TNT Zinciri vb.) */}
      {hud.activeEventBanner && !hud.activeBonusBanner && (
        <div className="bonus-banner-pop absolute top-[23%] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="px-4 py-1.5 rounded-xl bg-[#1b122b]/95 border-2 border-amber-300/90 shadow-[0_0_24px_rgba(250,204,21,0.45)] text-center">
            <span className="font-crest text-sm font-black tracking-wider text-yellow-200 uppercase whitespace-nowrap">
              {hud.activeEventBanner}
            </span>
          </div>
        </div>
      )}

      {/* BÜYÜK VE KISA BONUS BİLGİLENDİRME BANDI */}
      {hud.activeBonusBanner && (
        <div
          key={hud.activeBonusBanner.id}
          className="bonus-banner-pop absolute top-[26%] left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[86%] max-w-[340px]"
        >
          <div
            className={`px-4 py-2.5 rounded-2xl border-2 bg-gradient-to-r ${
              BONUS_STYLE_MAP[hud.activeBonusBanner.kind].bg
            } ${BONUS_STYLE_MAP[hud.activeBonusBanner.kind].border} ${
              BONUS_STYLE_MAP[hud.activeBonusBanner.kind].glow
            } flex items-center justify-center gap-3`}
          >
            <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/25 flex items-center justify-center shrink-0">
              <BonusIcon
                kind={hud.activeBonusBanner.kind}
                className={`w-6 h-6 ${BONUS_STYLE_MAP[hud.activeBonusBanner.kind].titleColor}`}
              />
            </div>
            <div className="min-w-0 text-left">
              <div
                className={`font-medieval text-2xl leading-none tracking-wide hud-text-stroke-sm ${
                  BONUS_STYLE_MAP[hud.activeBonusBanner.kind].titleColor
                }`}
              >
                {hud.activeBonusBanner.title}
              </div>
              <div className="mt-0.5 text-[11px] font-black text-white/95 tracking-wide">
                {hud.activeBonusBanner.subtitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* %100 Tam Şarj Kritik Rozeti */}
      {hud.getMedievalFlash > 0 && !hud.activeBonusBanner && (
        <div className="absolute top-[29%] left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="font-medieval text-4xl text-yellow-300 hud-text-stroke tracking-wider whitespace-nowrap scale-110">
            ORTA ÇAĞ VURUŞU!
          </div>
        </div>
      )}

      {/* Boşa Sallama / Boss Sarsıntısı Sersemleme Göstergesi */}
      {isDizzy && !isPig && (
        <div className="absolute top-[26%] left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="px-3.5 py-1 rounded-xl bg-amber-950/92 border-2 border-amber-400 text-xs font-black text-amber-200 shadow-lg tabular-nums">
            SERSEM! {hud.dizzyTimeLeft.toFixed(1)}sn
          </div>
          <div className="mt-1 w-32 h-2 bg-[#1a1109] border border-amber-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 origin-left"
              style={{
                transform: `scaleX(${Math.max(0, hud.dizzyTimeLeft / Math.max(0.1, hud.dizzyDuration))})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Cadı Domuz Laneti Göstergesi (3-2-1 Geri Sayım) */}
      {isPig && (
        <div className="absolute top-[22%] left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="font-crest text-5xl font-black text-pink-300 hud-text-stroke leading-none tabular-nums">
            {Math.max(1, Math.ceil(hud.pigTimeLeft))}
          </div>
          <div className="mt-1 px-3.5 py-1 rounded-xl bg-fuchsia-950/92 border-2 border-pink-400 text-xs font-black text-pink-200 shadow-lg tabular-nums">
            DOMUZ LANETİ! {hud.pigTimeLeft.toFixed(1)}sn
          </div>
          <div className="mt-1 w-32 h-2 bg-[#1a0d1e] border border-pink-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-400 origin-left"
              style={{
                transform: `scaleX(${Math.max(0, hud.pigTimeLeft / hud.pigDuration)})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Yüzen Puan ve Etki Yazıları */}
      {popups.map((p) => (
        <div
          key={p.id}
          className="floating-popup absolute font-medieval text-xl hud-text-stroke-sm whitespace-nowrap pointer-events-none"
          style={{
            left: `${p.screenX}%`,
            top: `${p.screenY}%`,
            color: p.color,
            fontSize: p.scale ? `${Math.round(22 * p.scale)}px` : undefined,
          }}
        >
          {p.text}
        </div>
      ))}

      {/* ALT KONTROL BÖLGESİ: Boss Modunda Sanal Joystick + Zıpla + Saldır; Normal Bölümde Klasik Güç Göstergesi */}
      {isBossMode ? (
        <BossTouchControls
          charge={hud.charge}
          isCharging={hud.isCharging}
          dizzyTimeLeft={hud.dizzyTimeLeft}
          pigTimeLeft={hud.pigTimeLeft}
          weaponName={hud.weaponName}
          onBossMove={onBossMove}
          onBossJump={onBossJump}
          onAttackStart={onAttackStart}
          onAttackRelease={onAttackRelease}
        />
      ) : (
        <div className="w-full px-4 pb-4 pt-2 flex flex-col items-center gap-1.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent">
          <div className="flex items-center gap-2 text-xs font-black hud-text-stroke-sm">
            <span
              className={
                isFullCharge
                  ? 'text-yellow-300'
                  : hasPowerSurge
                    ? 'text-orange-300'
                    : 'text-amber-100'
              }
            >
              {isFullCharge
                ? 'MAKSİMUM GÜÇ — BIRAK!'
                : hasPowerSurge
                  ? `SÜPER GÜÇ · ${hud.weaponName} %${Math.round(hud.charge * 100)}`
                  : `${hud.weaponName} · Güç %${Math.round(hud.charge * 100)}`}
            </span>
          </div>

          <WeaponPowerGaugeSvg weapon={hud.equippedWeapon} charge={hud.charge} />

          <div
            className={`w-full max-w-[300px] py-2 px-4 rounded-2xl border-2 text-center text-xs font-black tracking-wide transition-colors ${
              isPig
                ? 'bg-fuchsia-950/90 border-pink-400 text-pink-200'
                : isDizzy
                  ? 'bg-orange-950/90 border-orange-400 text-orange-200'
                  : isFullCharge
                    ? 'bg-yellow-400/25 border-yellow-300 text-yellow-200 shadow-[0_0_20px_rgba(250,204,21,0.45)]'
                    : hasPowerSurge
                      ? 'bg-rose-950/90 border-orange-400 text-orange-200 shadow-[0_0_16px_rgba(249,115,22,0.4)]'
                      : hud.isCharging
                        ? 'bg-amber-950/88 border-amber-400 text-amber-200'
                        : 'bg-[#171222]/88 border-slate-500/70 text-white/90'
            }`}
          >
            {isPig
              ? 'DOMUZA DÖNÜŞTÜN — LANETİN BİTMESİNİ BEKLE!'
              : isDizzy
                ? 'BOŞA SALLADIN! TOPARLANIYORSUN...'
                : isFullCharge
                  ? 'ŞİMDİ BIRAK VE KRİTİK VURUŞ YAP!'
                  : hasPowerSurge
                    ? 'SÜPER GÜÇ AKTİF! TEK VURUŞTA PARÇALA!'
                    : hud.isCharging
                      ? 'GÜÇ TOPLANIYOR... HEDEF YAKLAŞINCA BIRAK!'
                      : 'BASILI TUT: GÜÇ TOPLA · BIRAK: VUR'}
          </div>
        </div>
      )}
    </div>
  );
};
