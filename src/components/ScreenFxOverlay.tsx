import React from 'react';
import { ScreenEffectState } from '../game/types';

interface ScreenFxOverlayProps {
  effects: ScreenEffectState[];
}

// 28 adet deterministik konumlandırılmış komik tavuk tüyü (tüm ekranı kaplar)
const FEATHERS = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 19 + 4) % 94}%`,
  top: `${(i * 13) % 24 - 14}%`,
  size: 40 + (i % 5) * 14,
  dur: `${2.4 + (i % 6) * 0.25}s`,
  delay: `${(i % 7) * 0.11}s`,
  sway: `${(i % 2 === 0 ? 1 : -1) * (18 + (i % 4) * 10)}px`,
  color: i % 4 === 0 ? '#fef3c7' : i % 4 === 1 ? '#ffffff' : i % 4 === 2 ? '#fed7aa' : '#fde68a',
  rib: i % 2 === 0 ? '#d97706' : '#cbd5e1',
}));

const FIREWORKS = [
  { left: '22%', top: '24%', size: 150, color: '#f43f5e', core: '#fef08a', delay: '0s', dur: '1.35s' },
  { left: '74%', top: '20%', size: 165, color: '#22d3ee', core: '#ffffff', delay: '0.18s', dur: '1.4s' },
  { left: '48%', top: '16%', size: 185, color: '#facc15', core: '#fef9c3', delay: '0.35s', dur: '1.5s' },
  { left: '28%', top: '42%', size: 145, color: '#a855f7', core: '#f5d0fe', delay: '0.62s', dur: '1.35s' },
  { left: '72%', top: '40%', size: 160, color: '#4ade80', core: '#fef08a', delay: '0.84s', dur: '1.45s' },
  { left: '52%', top: '30%', size: 175, color: '#fb923c', core: '#ffffff', delay: '1.15s', dur: '1.45s' },
];

const BEES = Array.from({ length: 9 }, (_, i) => ({
  top: `${16 + i * 8}%`,
  delay: `${(i % 5) * 0.2}s`,
  dur: `${1.8 + (i % 4) * 0.28}s`,
  size: 28 + (i % 3) * 8,
}));

const GHOSTS = [
  { left: '14%', top: '54%', delay: '0s', dur: '2.3s', size: 74, tint: '#5eead4' },
  { left: '46%', top: '62%', delay: '0.22s', dur: '2.5s', size: 88, tint: '#c084fc' },
  { left: '74%', top: '52%', delay: '0.42s', dur: '2.3s', size: 70, tint: '#7dd3fc' },
  { left: '30%', top: '46%', delay: '0.58s', dur: '2.1s', size: 62, tint: '#a5f3fc' },
];

const EGGS = [
  { left: '24%', top: '32%', size: 96, delay: '0s', dur: '2.9s', rot: -14 },
  { left: '74%', top: '28%', size: 108, delay: '0.08s', dur: '3.0s', rot: 18 },
  { left: '50%', top: '48%', size: 118, delay: '0.14s', dur: '2.95s', rot: -6 },
  { left: '28%', top: '64%', size: 92, delay: '0.2s', dur: '2.8s', rot: 22 },
  { left: '76%', top: '60%', size: 88, delay: '0.26s', dur: '2.85s', rot: -20 },
];

const CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  left: `${(i * 17 + 3) % 95}%`,
  delay: `${(i % 6) * 0.12}s`,
  dur: `${1.8 + (i % 5) * 0.2}s`,
  sway: `${(i % 2 === 0 ? 1 : -1) * (16 + (i % 4) * 9)}px`,
  color: ['#facc15', '#38bdf8', '#f43f5e', '#4ade80', '#fb923c', '#c084fc'][i % 6],
  w: 8 + (i % 3) * 4,
  h: 12 + (i % 4) * 3,
}));

const FeatherSvg: React.FC<{ color: string; rib: string; size: number }> = ({
  color,
  rib,
  size,
}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
    <path
      d="M12 52 C14 28, 30 12, 54 10 C50 32, 36 48, 12 52 Z"
      fill={color}
      stroke="#1e1624"
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path d="M10 54 Q30 34 52 12" stroke={rib} strokeWidth="2.8" strokeLinecap="round" />
    <path d="M24 38 L20 28 M34 28 L30 18 M42 22 L48 26 M32 34 L40 38" stroke={rib} strokeWidth="2" strokeLinecap="round" opacity="0.65" />
  </svg>
);

const FireworkBurstSvg: React.FC<{ color: string; core: string; size: number }> = ({
  color,
  core,
  size,
}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
    {Array.from({ length: 12 }, (_, idx) => {
      const a = (idx * Math.PI) / 6;
      const x1 = 60 + Math.cos(a) * 14;
      const y1 = 60 + Math.sin(a) * 14;
      const x2 = 60 + Math.cos(a) * 52;
      const y2 = 60 + Math.sin(a) * 52;
      return (
        <g key={idx}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth={idx % 2 === 0 ? 4.5 : 3}
            strokeLinecap="round"
          />
          <circle cx={x2} cy={y2} r={idx % 2 === 0 ? 4.5 : 3} fill={core} />
        </g>
      );
    })}
    <circle cx="60" cy="60" r="11" fill={core} opacity="0.95" />
  </svg>
);

export const ScreenFxOverlay: React.FC<ScreenFxOverlayProps> = ({ effects }) => {
  if (!effects || effects.length === 0) return null;

  return (
    <div className="pointer-events-none select-none absolute inset-0 z-[24] overflow-hidden">
      {effects.map((fx) => {
        const fadeOut = Math.min(1, fx.timeLeft / Math.min(0.45, fx.duration));

        // 1. KOMPLE EKRAN TAVUK TÜYÜ!
        if (fx.kind === 'chicken_feathers') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              {FEATHERS.map((f, idx) => (
                <div
                  key={idx}
                  className="fx-feather absolute"
                  style={
                    {
                      left: f.left,
                      top: f.top,
                      '--fx-dur': f.dur,
                      '--fx-delay': f.delay,
                      '--fx-sway': f.sway,
                    } as React.CSSProperties
                  }
                >
                  <FeatherSvg color={f.color} rib={f.rib} size={f.size} />
                </div>
              ))}
              {fx.timeLeft > fx.duration - 1.35 && (
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 text-center">
                  <span className="font-medieval text-4xl text-amber-200 hud-text-stroke tracking-wider whitespace-nowrap">
                    GIDAAAK!!
                  </span>
                </div>
              )}
            </div>
          );
        }

        // 2. MANTAR 3 SANİYE SERSEMLEME EKRAN EFEKTİ!
        if (fx.kind === 'mushroom_dizzy') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              {/* Renkli psikodelik sersemlik kenar halesi */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(168,85,247,0.06) 28%, rgba(192,38,211,0.36) 76%, rgba(74,222,128,0.42) 100%)',
                }}
              />
              {/* Dönen hipnotik sersemlik halkası & yıldızlar */}
              <svg
                viewBox="0 0 320 320"
                className="fx-dizzy-spin absolute left-1/2 top-1/2 w-[92%] max-w-[380px] opacity-60"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="160"
                  cy="160"
                  r="134"
                  stroke="#e879f9"
                  strokeWidth="6"
                  strokeDasharray="18 16"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="102"
                  stroke="#a3e635"
                  strokeWidth="5"
                  strokeDasharray="12 18"
                />
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const sx = 160 + Math.cos(rad) * 134;
                  const sy = 160 + Math.sin(rad) * 134;
                  return (
                    <circle
                      key={deg}
                      cx={sx}
                      cy={sy}
                      r="9"
                      fill="#fde047"
                      stroke="#1e1026"
                      strokeWidth="3"
                    />
                  );
                })}
              </svg>
              <div className="absolute top-[19%] left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-2xl bg-fuchsia-950/92 border-2 border-lime-300 shadow-[0_0_24px_rgba(217,70,239,0.75)]">
                <div className="font-medieval text-2xl text-lime-200 hud-text-stroke-sm whitespace-nowrap">
                  MANTAR SERSEMLİĞİ! {fx.timeLeft.toFixed(1)}sn
                </div>
              </div>
            </div>
          );
        }

        // 3. TAM EKRAN RENKLİ HAVAİ FİŞEK ŞÖLENİ!
        if (fx.kind === 'fireworks') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              {FIREWORKS.map((fw, idx) => (
                <div
                  key={idx}
                  className="fx-firework absolute"
                  style={
                    {
                      left: fw.left,
                      top: fw.top,
                      '--fx-dur': fw.dur,
                      '--fx-delay': fw.delay,
                    } as React.CSSProperties
                  }
                >
                  <FireworkBurstSvg color={fw.color} core={fw.core} size={fw.size} />
                </div>
              ))}
            </div>
          );
        }

        // 4. BUZ BLOĞU — DONMUŞ KRİSTAL EKRAN ÇERÇEVESİ!
        if (fx.kind === 'ice_frost') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              <div
                className="absolute inset-0"
                style={{
                  boxShadow:
                    'inset 0 0 65px 18px rgba(56, 189, 248, 0.58), inset 0 0 18px 6px rgba(224, 242, 254, 0.72)',
                }}
              />
              {/* Köşe buz kristalleri */}
              <svg
                viewBox="0 0 100 100"
                className="absolute top-0 left-0 w-24 h-24 opacity-85"
                fill="none"
                aria-hidden="true"
              >
                <polygon points="0,0 78,0 44,24 18,52 0,80" fill="#bae6fd" opacity="0.55" />
                <polygon points="0,0 52,0 26,28 0,56" fill="#e0f2fe" opacity="0.72" />
              </svg>
              <svg
                viewBox="0 0 100 100"
                className="absolute top-0 right-0 w-24 h-24 opacity-85 scale-x-[-1]"
                fill="none"
                aria-hidden="true"
              >
                <polygon points="0,0 78,0 44,24 18,52 0,80" fill="#bae6fd" opacity="0.55" />
                <polygon points="0,0 52,0 26,28 0,56" fill="#e0f2fe" opacity="0.72" />
              </svg>
              <svg
                viewBox="0 0 100 100"
                className="absolute bottom-0 left-0 w-24 h-24 opacity-85 scale-y-[-1]"
                fill="none"
                aria-hidden="true"
              >
                <polygon points="0,0 78,0 44,24 18,52 0,80" fill="#bae6fd" opacity="0.55" />
              </svg>
              <svg
                viewBox="0 0 100 100"
                className="absolute bottom-0 right-0 w-24 h-24 opacity-85 scale-[-1]"
                fill="none"
                aria-hidden="true"
              >
                <polygon points="0,0 78,0 44,24 18,52 0,80" fill="#bae6fd" opacity="0.55" />
              </svg>
            </div>
          );
        }

        // 5. ARI KOVANI — EKRANDA VIZILDAYAN ARI SÜRÜSÜ!
        if (fx.kind === 'bee_swarm') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              {BEES.map((b, idx) => (
                <div
                  key={idx}
                  className="fx-bee absolute left-0"
                  style={
                    {
                      top: b.top,
                      '--fx-dur': b.dur,
                      '--fx-delay': b.delay,
                    } as React.CSSProperties
                  }
                >
                  <svg width={b.size} height={b.size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <ellipse cx="22" cy="14" rx="9" ry="6" fill="#e0f2fe" opacity="0.88" stroke="#0f172a" strokeWidth="2.5" />
                    <ellipse cx="26" cy="26" rx="14" ry="10" fill="#facc15" stroke="#0f172a" strokeWidth="3" />
                    <line x1="20" y1="17" x2="20" y2="35" stroke="#0f172a" strokeWidth="4" />
                    <line x1="29" y1="17" x2="29" y2="35" stroke="#0f172a" strokeWidth="4" />
                    <circle cx="36" cy="24" r="2.3" fill="#0f172a" />
                  </svg>
                </div>
              ))}
            </div>
          );
        }

        // 6. HAYALET KAVANOZU — EKRANDAN SÜZÜLEN HAYALETLER!
        if (fx.kind === 'ghost_spook') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(45,212,191,0.28) 100%)',
                }}
              />
              {GHOSTS.map((g, idx) => (
                <div
                  key={idx}
                  className="fx-ghost absolute"
                  style={
                    {
                      left: g.left,
                      top: g.top,
                      '--fx-dur': g.dur,
                      '--fx-delay': g.delay,
                    } as React.CSSProperties
                  }
                >
                  <svg width={g.size} height={g.size} viewBox="0 0 80 90" fill="none" aria-hidden="true">
                    <path
                      d="M14 44 C14 20, 66 20, 66 44 L66 78 L54 68 L42 78 L30 68 L14 78 Z"
                      fill={g.tint}
                      fillOpacity="0.82"
                      stroke="#0f172a"
                      strokeWidth="3.5"
                      strokeLinejoin="round"
                    />
                    <circle cx="30" cy="40" r="5" fill="#0f172a" />
                    <circle cx="50" cy="40" r="5" fill="#0f172a" />
                    <ellipse cx="40" cy="54" rx="6" ry="8" fill="#0f172a" />
                  </svg>
                </div>
              ))}
            </div>
          );
        }

        // 7. YUMURTA SEPETİ — KAMERAYA YAPIŞAN YUMURTA SARILARI!
        if (fx.kind === 'egg_splat') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              {EGGS.map((egg, idx) => (
                <div
                  key={idx}
                  className="fx-egg absolute"
                  style={
                    {
                      left: egg.left,
                      top: egg.top,
                      '--fx-dur': egg.dur,
                      '--fx-delay': egg.delay,
                    } as React.CSSProperties
                  }
                >
                  <svg
                    width={egg.size}
                    height={egg.size}
                    viewBox="0 0 100 100"
                    style={{ transform: `rotate(${egg.rot}deg)` }}
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M48 12 C68 10, 88 26, 86 46 C92 64, 74 86, 54 88 C32 92, 12 76, 14 54 C8 34, 28 14, 48 12 Z"
                      fill="#fffbeb"
                      fillOpacity="0.9"
                      stroke="#d6d3d1"
                      strokeWidth="3"
                    />
                    <circle cx="50" cy="50" r="19" fill="#f59e0b" stroke="#d97706" strokeWidth="3" />
                    <circle cx="44" cy="43" r="5.5" fill="#fef3c7" opacity="0.9" />
                  </svg>
                </div>
              ))}
            </div>
          );
        }

        // 8. TNT / KORSAN FIÇISI — PATLAMA ŞOK DALGASI!
        if (fx.kind === 'explosion_flash') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              <div
                className="fx-shockwave absolute left-1/2 top-1/2 w-56 h-56 rounded-full border-[8px] border-amber-300"
                style={{
                  background:
                    'radial-gradient(circle, rgba(254,240,138,0.72) 0%, rgba(249,115,22,0.45) 45%, rgba(239,68,68,0) 75%)',
                }}
              />
            </div>
          );
        }

        // 9. ALTIN KONFETİ YAĞMURU (BALON / ALTIN HEYKEL / ALTIN TÜCCARI)!
        if (fx.kind === 'gold_confetti') {
          return (
            <div key={fx.id} className="absolute inset-0" style={{ opacity: fadeOut }}>
              {CONFETTI.map((c, idx) => (
                <div
                  key={idx}
                  className="fx-confetti absolute -top-4 rounded-sm"
                  style={
                    {
                      left: c.left,
                      width: `${c.w}px`,
                      height: `${c.h}px`,
                      backgroundColor: c.color,
                      '--fx-dur': c.dur,
                      '--fx-delay': c.delay,
                      '--fx-sway': c.sway,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          );
        }

        // 10. BOSS HASAR ALMA KIRMIZI KENAR FLAŞI!
        if (fx.kind === 'damage_vignette') {
          return (
            <div
              key={fx.id}
              className="absolute inset-0"
              style={{
                opacity: fadeOut,
                boxShadow: 'inset 0 0 80px 26px rgba(220, 38, 38, 0.78)',
              }}
            />
          );
        }

        return null;
      })}
    </div>
  );
};
