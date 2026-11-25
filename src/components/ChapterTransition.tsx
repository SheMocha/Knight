import React, { useEffect, useRef, useState } from 'react';
import { Skull } from 'lucide-react';
import { getLevelConfig } from '../game/levels';
import { getWorldForLevel } from '../game/worlds';

interface ChapterTransitionProps {
  levelId: number;
  onStartGameplay: (levelId: number) => void;
  onFinished: () => void;
}

const TRANSITION_EMBERS = [
  { left: '14%', dur: '2.1s', delay: '0.1s', drift: '12px', size: 3 },
  { left: '29%', dur: '2.5s', delay: '0.35s', drift: '-10px', size: 2 },
  { left: '48%', dur: '1.9s', delay: '0.05s', drift: '8px', size: 3 },
  { left: '66%', dur: '2.4s', delay: '0.25s', drift: '-14px', size: 2.5 },
  { left: '82%', dur: '2.2s', delay: '0.45s', drift: '10px', size: 3 },
];

export const ChapterTransition: React.FC<ChapterTransitionProps> = ({
  levelId,
  onStartGameplay,
  onFinished,
}) => {
  const level = getLevelConfig(levelId);
  const world = getWorldForLevel(levelId);
  const [fadingOut, setFadingOut] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const startedRef = useRef(false);
  const doneRef = useRef(false);

  const hasArtwork = Boolean(level.artwork) && !imgErr;

  const triggerLaunchAndFade = () => {
    if (!startedRef.current) {
      startedRef.current = true;
      onStartGameplay(levelId);
    }
    setFadingOut(true);
    window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onFinished();
      }
    }, 380);
  };

  useEffect(() => {
    setImgErr(false);
    const delayMs = level.isBossLevel ? 1850 : 1450;
    const startTimer = window.setTimeout(() => {
      triggerLaunchAndFade();
    }, delayMs);

    return () => {
      window.clearTimeout(startTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  return (
    <div
      onClick={triggerLaunchAndFade}
      role="status"
      aria-live="polite"
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#06070b] cursor-pointer transition-opacity duration-350 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Yeni Bölümün Atmosferini Tanıtan Tam Ekran Arka Plan */}
      <div className="absolute inset-0 overflow-hidden">
        {hasArtwork ? (
          <img
            src={level.artwork}
            alt={level.name}
            referrerPolicy="no-referrer"
            onError={() => setImgErr(true)}
            className="df-transition-zoom w-full h-full object-cover object-center brightness-[0.52] saturate-[0.9]"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-b ${level.fallbackGradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070b]/90 via-[#06070b]/45 to-[#06070b]/95" />
        <div
          className="absolute inset-0"
          style={{
            background: level.isBossLevel
              ? 'radial-gradient(ellipse at 50% 48%, rgba(190,18,60,0.22) 15%, rgba(5,6,11,0.92) 100%)'
              : 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0.08) 18%, rgba(5,6,11,0.88) 100%)',
          }}
        />
      </div>

      {/* Yükselen İnce Altın / Kızıl Köz Parçacıkları */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-16 h-44">
        {TRANSITION_EMBERS.map((e, i) => (
          <span
            key={i}
            className={`df-ember absolute bottom-0 rounded-full ${
              level.isBossLevel
                ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.95)]'
                : 'bg-[#f5d07a] shadow-[0_0_8px_rgba(245,208,122,0.85)]'
            }`}
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

      {/* Merkez Bölüm Tanıtım Kartuşu */}
      <div className="df-animate-reveal relative z-10 px-7 text-center max-w-sm">
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#a9b6cf]">
          Dünya {world.roman} · {world.name}
        </p>

        {level.isBossLevel ? (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/90 border border-rose-400/80 text-rose-200 font-crest text-xs font-black tracking-[0.2em] uppercase">
            <Skull className="w-3.5 h-3.5 text-yellow-300" />
            <span>BOSS SAVAŞI · BÖLÜM {level.id}</span>
          </div>
        ) : (
          <p className="mt-1.5 font-crest text-xs font-bold tracking-[0.28em] uppercase text-[#d8b163]">
            Bölüm {level.id}
          </p>
        )}

        <h2 className="mt-2 font-crest text-[28px] font-black tracking-wide text-[#fbf4e4] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] leading-tight text-balance">
          {level.isBossLevel && level.boss ? level.boss.name : level.name}
        </h2>

        {level.isBossLevel && level.boss && (
          <p className="mt-1 text-xs font-bold tracking-wider uppercase text-rose-300">
            {level.boss.title}
          </p>
        )}

        {/* Genişleyen Ayırıcı */}
        <div className="df-rule-expand mx-auto mt-3.5 mb-3.5 flex items-center justify-center gap-2 w-48">
          <div
            className={`h-px flex-1 bg-gradient-to-r from-transparent ${
              level.isBossLevel ? 'to-rose-400' : 'to-[#d6aa57]'
            }`}
          />
          <div
            className={`w-2 h-2 rotate-45 ${
              level.isBossLevel
                ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.85)]'
                : 'bg-[#ecc674] shadow-[0_0_8px_rgba(236,198,116,0.7)]'
            }`}
          />
          <div
            className={`h-px flex-1 bg-gradient-to-l from-transparent ${
              level.isBossLevel ? 'to-rose-400' : 'to-[#d6aa57]'
            }`}
          />
        </div>

        <p className="text-[13px] leading-relaxed text-[#d9d0c0]/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
          {level.isBossLevel && level.boss ? `“${level.boss.introQuote}”` : level.atmosphere}
        </p>

        {level.isBossLevel && level.boss ? (
          <div className="mt-4 space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-rose-200 tabular-nums">
              Boss Canı: {level.boss.maxHp.toLocaleString('tr-TR')} HP · {level.boss.phases} Faz ·{' '}
              {level.timeLimit} sn
            </div>
            <div className="text-[11px] font-extrabold text-amber-300">
              Sol Joystick ile Kaç · Sağ Butonla Saldır!
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-3 text-[11px] font-semibold tracking-wider text-[#d8b878]/90 tabular-nums">
            <span>Hedef: {level.scoreTarget.toLocaleString('tr-TR')} Skor</span>
            <span aria-hidden="true" className="text-[#9e7c3e]">
              ·
            </span>
            <span>{level.timeLimit} Saniye</span>
          </div>
        )}
      </div>

      <span className="relative z-10 mt-10 text-[10px] tracking-[0.18em] uppercase text-[#9c9486]/70">
        Geçmek için dokun
      </span>
    </div>
  );
};
