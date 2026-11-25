import React from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { FloatingPopup, TutorialSnapshot, TutorialStage } from '../game/types';

interface TutorialOverlayProps {
  tutorial: TutorialSnapshot;
  popups: FloatingPopup[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onExit: () => void;
  onStartAdventure: () => void;
  onMoveInput: (dir: -1 | 0 | 1) => void;
  onAttackStart: () => void;
  onAttackRelease: () => void;
}

interface StageMeta {
  title: string;
  message: string;
  hint: string;
}

function getInnocentLabel(kind: 'princess' | 'king' | 'priest' | null): string {
  if (kind === 'princess') return 'PRENSES';
  if (kind === 'king') return 'KRAL';
  if (kind === 'priest') return 'RAHİP';
  return 'MASUM';
}

function getStageMeta(stage: TutorialStage, pigActive: boolean): StageMeta {
  switch (stage) {
    case 1:
      return {
        title: 'GÜÇ TOPLA VE VUR',
        message: 'Macera başlıyor! Önce ekrana basılı tutarak güç toplamayı ve bırakıp vurmayı öğren.',
        hint: 'Alttaki SALDIR butonuna, ekrana veya Space tuşuna basılı tut; güç çubuğu dolunca bırak!',
      };
    case 2:
      return {
        title: 'SALDIRI YAPMA',
        message: 'Karşındaki düşmanları yenmek için kılıcını kullan!',
        hint: 'Basılı tutarak gücünü topla, bırak ve önündeki eğitim düşmanını parçala!',
      };
    case 3:
      return pigActive
        ? {
            title: 'CADI VE DOMUZ BÜYÜSÜ',
            message:
              'DİKKAT! Cadının büyüsüne yakalandın! 3 saniyeliğine domuza dönüşürsün ve bu sırada saldıramazsın!',
            hint: '3 saniye bitince otomatik olarak şövalye formuna geri döneceksin.',
          }
        : {
            title: 'CADI VE DOMUZ BÜYÜSÜ',
            message:
              'Önünde bir Cadı var! Normal oyunda cadılara vurmamalısın. Laneti görmek için şimdi ona vur!',
            hint: 'Eğitim gereği cadıya vurmak zorunludur: basılı tut, bırak ve büyüyü deneyimle.',
          };
    case 4:
      return {
        title: 'MASUMLARA VURMA!',
        message:
          'SAKIN VURMA! Prenses, Kral ve Rahip asla öldürülmemelidir — vurursan bölüm anında biter!',
        hint: 'Saldırmadan bekle: üçü de şövalyenin önünden güvenle geçsin.',
      };
    case 5:
      return {
        title: 'ALTIN TÜCCARI',
        message:
          'Karşında Altın Tüccarı var! Ona vurduğunda etrafa çok fazla altın ve kese saçar!',
        hint: 'Basılı tutarak gücünü topla, bırak ve Altın Tüccarına vurup altın yağmurunu gör!',
      };
    case 6:
      return {
        title: 'ALTIN TOPLAMA',
        message: 'Altınları topla! Altınlar krallığının en değerli hazinesidir.',
        hint: 'Alttaki yön butonları veya parmağınla sağa doğru ilerleyip yoldaki altınları topla!',
      };
    case 7:
      return {
        title: 'SKOR VE HEDEF',
        message: 'Her düşmanı yenerek skor kazan. Bölümü tamamlamak için hedef skora ulaş!',
        hint: 'Önündeki zırhlı düşmanı güçlü bir vuruşla yen ve hedef skora ulaş!',
      };
    case 8:
    default:
      return {
        title: 'EĞİTİM TAMAMLANDI',
        message: 'Krallığın kaderi artık senin ellerinde. Maceran başlıyor!',
        hint: '',
      };
  }
}

const VICTORY_EMBERS = [
  { left: '12%', delay: '0s', dur: '2.5s', drift: '8px' },
  { left: '26%', delay: '0.6s', dur: '2.9s', drift: '-10px' },
  { left: '42%', delay: '0.2s', dur: '2.3s', drift: '6px' },
  { left: '58%', delay: '0.9s', dur: '2.7s', drift: '-8px' },
  { left: '74%', delay: '0.4s', dur: '2.4s', drift: '11px' },
  { left: '88%', delay: '1.1s', dur: '2.8s', drift: '-7px' },
];

const INNOCENT_LIST: { kind: 'princess' | 'king' | 'priest'; label: string }[] = [
  { kind: 'princess', label: 'Prenses' },
  { kind: 'king', label: 'Kral' },
  { kind: 'priest', label: 'Rahip' },
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tutorial,
  popups,
  soundEnabled,
  onToggleSound,
  onExit,
  onStartAdventure,
  onMoveInput,
  onAttackStart,
  onAttackRelease,
}) => {
  const { stage } = tutorial;
  const meta = getStageMeta(stage, tutorial.pigActive);
  const chargePct = Math.round(tutorial.charge * 100);
  const isFullCharge = tutorial.charge >= 0.97;
  const scorePct = Math.min(100, Math.round((tutorial.tutorialScore / tutorial.scoreGoal) * 100));
  const goldPct = Math.min(100, Math.round((tutorial.goldCollected / tutorial.goldGoal) * 100));
  const pigPct = Math.max(0, Math.min(100, (tutorial.pigTimeLeft / tutorial.pigDuration) * 100));

  // İleri/geri kontrolü yalnızca Aşama 6 (Altın Toplama) içindir;
  // Aşama 1, 2, 3 (cadı), 5 (Altın Tüccarı) ve 7 (skor) basılı tut & vur mekaniğidir.
  // Aşama 4 (Prenses, Kral, Rahip) dokunmadan geçmesini bekleme egzersizidir!
  const showMoveControls = stage === 6;
  const showAttackControls =
    stage === 1 ||
    stage === 2 ||
    (stage === 3 && !tutorial.pigActive) ||
    stage === 5 ||
    stage === 7;
  const showPigLockBar = stage === 3 && tutorial.pigActive;
  const showHoldFireBar = stage === 4;

  const focusRingColor =
    stage === 3
      ? 'border-fuchsia-400 shadow-[0_0_26px_rgba(232,121,249,0.75)]'
      : stage === 4
        ? 'border-red-400 shadow-[0_0_28px_rgba(248,113,113,0.9)]'
        : stage === 5 || stage === 6
          ? 'border-yellow-300 shadow-[0_0_28px_rgba(253,224,71,0.9)]'
          : 'border-amber-300 shadow-[0_0_26px_rgba(251,191,36,0.8)]';

  const focusBadgeLabel =
    stage === 1
      ? 'BASILI TUT · GÜÇ TOPLA'
      : stage === 2
        ? 'EĞİTİM DÜŞMANI'
        : stage === 3
          ? tutorial.pigActive
            ? 'DOMUZ FORMU!'
            : 'CADIYA VUR!'
          : stage === 4
            ? `SAKIN VURMA! ${getInnocentLabel(tutorial.currentInnocentKind)}`
            : stage === 5
              ? 'ALTIN TÜCCARI! VUR · ÇOK ALTIN!'
              : stage === 6
                ? 'ALTINLARI TOPLA'
                : 'HEDEF DÜŞMAN';

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none select-none overflow-hidden">
      {/* Yarı saydam spot ışık karartması (hedefi öne çıkarır, oynanışı engellemez) */}
      {stage !== 8 && tutorial.focusVisible && (
        <div
          className="absolute inset-0 pointer-events-none transition-[background] duration-150"
          style={{
            background: `radial-gradient(circle 118px at ${tutorial.focusX}% ${tutorial.focusY}%, rgba(0,0,0,0) 0%, rgba(7,9,16,0.22) 55%, rgba(5,7,13,0.52) 100%)`,
          }}
        />
      )}

      {/* Canlı Dünya Hedef İşaretçisi: Parlayan Çember + Animasyonlu Ok */}
      {stage !== 8 && tutorial.focusVisible && (
        <div
          className="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
          style={{
            left: `${tutorial.focusX}%`,
            top: `${tutorial.focusY}%`,
          }}
        >
          <div className="flex flex-col items-center">
            <div className="df-arrow-bounce mb-1 flex flex-col items-center">
              <div
                className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase shadow-lg whitespace-nowrap mb-0.5 ${
                  stage === 4
                    ? 'bg-[#2a090d]/95 border border-red-400/90 text-red-200'
                    : stage === 5
                      ? 'bg-[#2b1f06]/95 border border-yellow-300/95 text-yellow-200'
                      : 'bg-[#110e18]/92 border border-yellow-400/80 text-yellow-300'
                }`}
              >
                {focusBadgeLabel}
              </div>
              <ArrowDown
                className={`w-7 h-7 drop-shadow-[0_3px_8px_rgba(0,0,0,0.95)] stroke-[2.8] ${
                  stage === 4 ? 'text-red-400' : 'text-yellow-300'
                }`}
              />
            </div>

            <div
              className={`df-focus-pulse rounded-full border-2 ${focusRingColor} ${
                stage === 6 ? 'w-14 h-14' : 'w-24 h-24'
              }`}
            />
          </div>
        </div>
      )}

      {/* Aşama 3: BÜYÜK VE DİKKAT ÇEKİCİ 3 - 2 - 1 DOMUZ BÜYÜSÜ GERİ SAYIMI */}
      {stage === 3 && tutorial.pigActive && tutorial.pigCountdown > 0 && (
        <div className="absolute inset-x-0 top-[35%] z-30 flex flex-col items-center pointer-events-none px-4">
          <div key={tutorial.pigCountdown} className="df-countdown-pop flex flex-col items-center">
            <span className="font-crest text-[11px] font-black tracking-[0.26em] text-fuchsia-200 uppercase bg-[#280b30]/90 border border-fuchsia-400/75 px-3 py-1 rounded-md shadow-lg">
              DOMUZ BÜYÜSÜ AKTİF!
            </span>
            <div className="font-medieval text-[86px] leading-none text-yellow-300 hud-text-stroke drop-shadow-[0_0_24px_rgba(232,121,249,0.9)] mt-1">
              {tutorial.pigCountdown}
            </div>
          </div>

          <div className="w-44 h-2.5 rounded-full bg-black/75 border border-fuchsia-400/70 overflow-hidden mt-1 shadow-lg">
            <div
              className="h-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-yellow-300 transition-[width] duration-75"
              style={{ width: `${pigPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Aşama 4: Masuma yanlışlıkla vurulduğunda güçlü kırmızı eğitim uyarısı */}
      {stage === 4 && tutorial.forbiddenWarningText && (
        <div className="absolute inset-x-0 top-[39%] z-30 flex justify-center pointer-events-none px-4">
          <div className="df-animate-reveal max-w-[360px] flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#2a080c]/95 border-2 border-red-400/90 shadow-[0_12px_36px_rgba(220,38,38,0.55)]">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs font-extrabold leading-snug text-red-100">
              {tutorial.forbiddenWarningText}
            </p>
          </div>
        </div>
      )}

      {/* Aşama Tamamlandı Yeşil/Altın Onay Flaş Kartı */}
      {tutorial.stageCompletedFlash && stage !== 8 && (
        <div className="absolute inset-x-0 top-[42%] z-30 flex justify-center pointer-events-none px-4">
          <div className="df-animate-reveal flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#0e1915]/95 border border-emerald-400/80 shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <span className="font-crest text-sm font-black tracking-[0.14em] text-emerald-200 uppercase">
              {stage === 5 ? 'ALTIN YAĞMURU! AŞAMA TAMAM!' : 'AŞAMA TAMAMLANDI!'}
            </span>
          </div>
        </div>
      )}

      {/* Uçan Skor / Altın / Lanet Yazıları */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {popups.map((p) => (
          <div
            key={p.id}
            className="floating-popup absolute font-medieval tracking-wide hud-text-stroke whitespace-nowrap"
            style={{
              left: `${p.screenX}%`,
              top: `${p.screenY}%`,
              color: p.color,
              fontSize: `${Math.round(24 * (p.scale ?? 1))}px`,
            }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* ÜST GÖREV KARTI (AŞAMA 1..7) */}
      {/* ==================================================================== */}
      {stage !== 8 && (
        <div className="relative z-30 p-3 pointer-events-auto">
          <div
            className={`df-panel rounded-xl px-3.5 py-3 ${
              stage === 4
                ? 'border-red-400/75 shadow-[0_8px_28px_rgba(185,28,28,0.35)]'
                : stage === 5
                  ? 'border-yellow-300/80 shadow-[0_8px_28px_rgba(234,179,8,0.32)]'
                  : ''
            }`}
          >
            {/* Üst Bar: EĞİTİM X/8 + İlerleme Çizgisi + Ses + Çıkış */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`font-crest text-[11px] font-black tracking-[0.18em] uppercase whitespace-nowrap ${
                    stage === 4 ? 'text-red-300' : 'text-amber-300'
                  }`}
                >
                  EĞİTİM {stage}/8
                </span>
                <span className="text-amber-500/40">·</span>
                <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase truncate">
                  {meta.title}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onToggleSound}
                  aria-label={soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
                  className="df-btn-iron w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onExit}
                  aria-label="Eğitimden çık"
                  className="df-btn-iron h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-bold text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-amber-300" />
                  <span>Çık</span>
                </button>
              </div>
            </div>

            {/* 8 Aşamalı Altın İlerleme Çubuğu */}
            <div className="grid grid-cols-8 gap-1 mt-2">
              {([1, 2, 3, 4, 5, 6, 7, 8] as TutorialStage[]).map((stepNum) => {
                const done = stepNum < stage || (stepNum === stage && tutorial.stageCompletedFlash);
                const active = stepNum === stage && !tutorial.stageCompletedFlash;
                return (
                  <div
                    key={stepNum}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      done
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.65)]'
                        : active
                          ? stage === 4
                            ? 'bg-gradient-to-r from-red-500 via-rose-400 to-red-400 shadow-[0_0_8px_rgba(248,113,113,0.75)]'
                            : 'bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                          : 'bg-white/10'
                    }`}
                  />
                );
              })}
            </div>

            {/* Görev Açıklaması */}
            <div className="mt-2.5">
              <p
                className={`text-[13px] font-bold leading-snug ${
                  stage === 3
                    ? 'text-fuchsia-100'
                    : stage === 4
                      ? 'text-red-100'
                      : stage === 5
                        ? 'text-yellow-100'
                        : 'text-amber-50'
                }`}
              >
                {meta.message}
              </p>
              {meta.hint && (
                <p className="mt-1 text-[11px] font-medium text-amber-200/75 leading-snug">
                  {meta.hint}
                </p>
              )}
            </div>

            {/* Aşama 1: Basılı Tut & Bırak-Vur Görev Durumu */}
            {stage === 1 && (
              <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    tutorial.chargePracticed
                      ? 'bg-emerald-950/70 border-emerald-400/70 text-emerald-200'
                      : 'bg-black/40 border-amber-500/25 text-amber-100/80'
                  }`}
                >
                  {tutorial.chargePracticed ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Flame className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>1. Basılı Tut</span>
                </div>
                <div
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    tutorial.swingPracticed
                      ? 'bg-emerald-950/70 border-emerald-400/70 text-emerald-200'
                      : 'bg-black/40 border-amber-500/25 text-amber-100/80'
                  }`}
                >
                  {tutorial.swingPracticed ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Swords className="w-3.5 h-3.5 text-yellow-300" />
                  )}
                  <span>2. Bırak ve Vur</span>
                </div>
              </div>
            )}

            {/* Aşama 4: Prenses, Kral ve Rahip Güvenli Geçiş Takip Çubuğu */}
            {stage === 4 && (
              <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                {INNOCENT_LIST.map((item, idx) => {
                  const spared = idx < tutorial.innocentsSpared;
                  const current = idx === tutorial.innocentsSpared;
                  return (
                    <div
                      key={item.kind}
                      className={`flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                        spared
                          ? 'bg-emerald-950/75 border-emerald-400/75 text-emerald-200'
                          : current
                            ? 'bg-red-950/75 border-red-400/85 text-red-100 animate-pulse'
                            : 'bg-black/45 border-white/15 text-slate-300/80'
                      }`}
                    >
                      {spared ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Aşama 5: Altın Tüccarı Bilgi Kartı */}
            {stage === 5 && (
              <div className="mt-2.5 flex items-center justify-between gap-2 bg-amber-950/55 border border-yellow-300/55 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-yellow-200">
                  <Coins className="w-4 h-4 text-yellow-300 shrink-0" />
                  <span>Altın Tüccarı Ödülü</span>
                </span>
                <span className="font-crest text-[11px] tracking-wider uppercase text-yellow-300">
                  +150 ALTIN · 3 KESE!
                </span>
              </div>
            )}

            {/* Aşama 6: Eğitim Altını Sayacı */}
            {stage === 6 && (
              <div className="mt-2.5 bg-black/45 border border-amber-400/35 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-yellow-300">
                    <Coins className="w-4 h-4 text-yellow-300" />
                    <span>Eğitim Altını</span>
                  </span>
                  <span className="font-medieval text-base text-yellow-300 tabular-nums leading-none">
                    {tutorial.goldCollected} / {tutorial.goldGoal}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/70 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-200 transition-[width] duration-150"
                    style={{ width: `${goldPct}%` }}
                  />
                </div>
              </div>
            )}

            {/* Aşama 7: Hedef Skor Sayacı */}
            {stage === 7 && (
              <div className="mt-2.5 bg-black/45 border border-sky-400/35 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="flex items-center gap-1.5 text-sky-300">
                    <Trophy className="w-4 h-4 text-sky-300" />
                    <span>Hedef Skor</span>
                  </span>
                  <span className="font-medieval text-base text-sky-200 tabular-nums leading-none">
                    {tutorial.tutorialScore} / {tutorial.scoreGoal}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-black/70 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 via-cyan-300 to-emerald-400 transition-[width] duration-150"
                    style={{ width: `${scorePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ALT KONTROL PANELİ (AŞAMA 1..7) */}
      {/* ==================================================================== */}
      {stage !== 8 && (
        <div className="relative z-30 px-3 pb-4 pt-1 pointer-events-auto">
          {/* Yalnızca Aşama 6 (Altın Toplama) için SOLA / SAĞA yön butonları */}
          {showMoveControls && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-yellow-300 hud-text-stroke-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Altınlara yürümek için SAĞA / SOLA basılı tut</span>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveInput(-1);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveInput(0);
                  }}
                  onPointerLeave={() => onMoveInput(0)}
                  onPointerCancel={() => onMoveInput(0)}
                  className="df-btn-iron border-amber-400/50 text-amber-100 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-crest text-sm font-black tracking-wider cursor-pointer touch-none"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>SOLA</span>
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveInput(1);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onMoveInput(0);
                  }}
                  onPointerLeave={() => onMoveInput(0)}
                  onPointerCancel={() => onMoveInput(0)}
                  className="df-cta-gold ring-2 ring-yellow-300/80 py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-crest text-sm font-black tracking-wider cursor-pointer touch-none"
                >
                  <span>SAĞA</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Aşama 4: Masumlar geçerken saldırı yapmama uyarı şeridi */}
          {showHoldFireBar && (
            <div className="w-full max-w-[350px] mx-auto rounded-xl bg-[#2a090d]/92 border-2 border-red-400/80 px-4 py-3 text-center shadow-[0_10px_28px_rgba(185,28,28,0.45)]">
              <div className="flex items-center justify-center gap-2 font-crest text-xs font-black tracking-[0.14em] text-red-200 uppercase">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>DOKUNMA · MASUMLAR GÜVENLE GEÇSİN ({tutorial.innocentsSpared}/{tutorial.innocentsTotal})</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-red-100/80">
                Prenses, Kral ve Rahip&apos;e vurursan gerçek oyunda bölüm anında kaybedilir!
              </p>
            </div>
          )}

          {/* Aşama 1, 2, 3 (Cadı), 5 (Altın Tüccarı) ve 7 için Basılı Tut & Bırak Saldırı Kontrolü */}
          {showAttackControls && (
            <div className="flex flex-col items-center gap-2 w-full max-w-[340px] mx-auto">
              <div className="w-full flex items-center justify-between text-[11px] font-bold px-1">
                <span className="flex items-center gap-1.5 text-amber-200 hud-text-stroke-sm">
                  <Swords className="w-3.5 h-3.5 text-amber-300" />
                  {tutorial.weaponName}
                </span>
                <span
                  className={`hud-text-stroke-sm tabular-nums ${
                    isFullCharge ? 'text-yellow-300 animate-pulse' : 'text-amber-200'
                  }`}
                >
                  {isFullCharge ? 'KRİTİK HAZIR! BIRAK!' : `GÜÇ %${chargePct}`}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-[#120d18]/90 border border-amber-400/60 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-[width] duration-75 ${
                    isFullCharge
                      ? 'bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-400'
                      : 'bg-gradient-to-r from-emerald-500 via-amber-400 to-orange-500'
                  }`}
                  style={{ width: `${Math.max(4, chargePct)}%` }}
                />
              </div>

              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAttackStart();
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAttackRelease();
                }}
                onPointerCancel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAttackRelease();
                }}
                className="df-cta-gold w-full py-3.5 px-5 rounded-xl font-crest text-sm font-black tracking-[0.14em] uppercase flex items-center justify-center gap-2.5 cursor-pointer touch-none ring-2 ring-yellow-300/75"
              >
                {stage === 5 ? <Coins className="w-5 h-5" /> : <Swords className="w-5 h-5" />}
                <span>
                  {tutorial.isCharging
                    ? 'BIRAK VE VUR!'
                    : stage === 3
                      ? 'CADIYA VUR (BASILI TUT · BIRAK)'
                      : stage === 5
                        ? 'ALTIN TÜCCARINA VUR! (ÇOK ALTIN)'
                        : 'BASILI TUT · SALDIR (SPACE)'}
                </span>
              </button>
            </div>
          )}

          {/* Aşama 3 Domuz Formu Kilit Göstergesi (3 saniye boyunca saldırı kilitlidir) */}
          {showPigLockBar && (
            <div className="w-full max-w-[340px] mx-auto rounded-xl bg-[#260b2e]/92 border border-fuchsia-400/70 px-4 py-3 text-center shadow-lg">
              <div className="font-crest text-xs font-black tracking-[0.16em] text-fuchsia-200 uppercase">
                DOMUZ FORMUNDA SALDIRILAMAZ · {tutorial.pigCountdown} SN
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* AŞAMA 8: EĞİTİM TAMAMLANDI ZAFER EKRANI */}
      {/* ==================================================================== */}
      {stage === 8 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#06070c]/82 backdrop-blur-[3px] p-4 pointer-events-auto df-animate-backdrop">
          <div className="df-panel df-animate-reveal relative w-full max-w-[390px] rounded-2xl overflow-hidden text-amber-50">
            <span className="pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-amber-400/75" />
            <span className="pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-amber-400/75" />
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-amber-400/75" />
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-amber-400/75" />

            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              {VICTORY_EMBERS.map((ember, idx) => (
                <span
                  key={idx}
                  className="df-ember absolute bottom-6 w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047]"
                  style={
                    {
                      left: ember.left,
                      '--ember-delay': ember.delay,
                      '--ember-dur': ember.dur,
                      '--ember-drift': ember.drift,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            <div className="relative z-10 px-5 pt-7 pb-6 text-center">
              <p className="font-crest text-[11px] font-black tracking-[0.26em] text-amber-300/90 uppercase">
                EĞİTİM 8/8 · TAMAMLANDI
              </p>

              <div className="relative mx-auto mt-3 mb-4 w-20 h-20 flex items-center justify-center">
                <div className="df-crest-pulse absolute inset-0 rounded-full bg-amber-400/20 blur-md" />
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#2b2214] to-[#120e09] border-2 border-amber-400/80 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.4)]">
                  <Crown className="w-8 h-8 text-amber-300 drop-shadow-[0_2px_6px_rgba(251,191,36,0.5)]" />
                </div>
              </div>

              <h2 className="font-crest text-2xl font-black tracking-[0.06em] text-transparent bg-clip-text bg-gradient-to-b from-[#fff5cf] via-[#f5cb69] to-[#c48728]">
                ARTIK HAZIRSIN ŞÖVALYE!
              </h2>

              <div className="df-rule-expand mx-auto my-3 h-px w-40 bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

              <p className="text-sm text-amber-100/85 leading-relaxed px-2">
                Krallığın kaderi artık senin ellerinde. Maceran başlıyor!
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5 text-[10px] font-bold text-emerald-200/90">
                {['Güç', 'Saldırı', 'Cadı', 'Masumlar', 'Tüccar', 'Altın', 'Skor'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/45 border border-emerald-400/30"
                  >
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={onStartAdventure}
                  className="df-cta-gold w-full py-3.5 px-5 rounded-xl font-crest text-base font-black tracking-[0.14em] uppercase flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Swords className="w-5 h-5" />
                  <span>MACERAYA BAŞLA</span>
                </button>

                <button
                  type="button"
                  onClick={onExit}
                  className="df-btn-iron w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase text-slate-300 cursor-pointer"
                >
                  Ana Menüye Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
