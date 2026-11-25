import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Heart,
  Skull,
  Swords,
} from 'lucide-react';
import { BossHudState } from '../game/types';

interface BossTopBarProps {
  boss: BossHudState;
  timeLeft: number;
  timeLimit: number;
  levelScore: number;
}

function formatBossClock(sec: number): string {
  const clamped = Math.max(0, Math.ceil(sec));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const BossTopBar: React.FC<BossTopBarProps> = ({
  boss,
  timeLeft,
  timeLimit,
  levelScore,
}) => {
  const hpRatio = Math.max(0, Math.min(1, boss.hp / Math.max(1, boss.maxHp)));
  const timeRatio = Math.max(0, Math.min(1, timeLeft / Math.max(1, timeLimit)));
  const isUrgent = timeLeft <= 15;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Ana Boss Can Çubuğu Kartı (backdrop-blur yok — yüksek mobil FPS) */}
      <div
        className={`w-full rounded-2xl border-2 px-3 py-2 shadow-[0_6px_18px_rgba(0,0,0,0.65)] ${
          boss.enraged
            ? 'bg-[#250911]/94 border-rose-400 shadow-[0_0_22px_rgba(244,63,94,0.45)]'
            : 'bg-[#1a0c16]/92 border-red-500/75'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                boss.enraged
                  ? 'bg-rose-600/35 border-rose-300 text-yellow-300'
                  : 'bg-red-950/90 border-amber-400/60 text-amber-300'
              }`}
            >
              {boss.enraged ? (
                <Flame className="w-4 h-4" />
              ) : boss.maxPhases >= 3 ? (
                <Crown className="w-4 h-4" />
              ) : (
                <Skull className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-crest text-sm font-black tracking-wide text-amber-100 truncate">
                  {boss.name}
                </span>
                <span
                  className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded border uppercase shrink-0 ${
                    boss.enraged
                      ? 'bg-rose-600/80 border-yellow-300 text-yellow-100'
                      : 'bg-red-950/90 border-red-400/70 text-red-200'
                  }`}
                >
                  FAZ {boss.phase}/{boss.maxPhases}
                </span>
              </div>
              <div className="text-[10px] font-bold text-red-200/80 truncate">{boss.title}</div>
            </div>
          </div>

          <div className="text-right shrink-0 tabular-nums leading-tight">
            <div
              className={`font-medieval text-lg leading-none hud-text-stroke-sm ${
                isUrgent ? 'text-red-400' : 'text-amber-200'
              }`}
            >
              {formatBossClock(timeLeft)}
            </div>
            <div className="text-[10px] font-extrabold text-sky-200/90">
              {levelScore.toLocaleString('tr-TR')} Puan
            </div>
          </div>
        </div>

        {/* Büyük Boss HP Çubuğu */}
        <div className="mt-2 relative w-full h-4 bg-[#12070c] border-2 border-[#090306] rounded-full overflow-hidden">
          <div
            className={`h-full origin-left transition-transform duration-150 ${
              boss.enraged
                ? 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-300'
                : 'bg-gradient-to-r from-red-700 via-rose-500 to-amber-400'
            }`}
            style={{ transform: `scaleX(${Math.max(0.005, hpRatio)})` }}
          />
          {/* Faz ayrım çizgileri */}
          {boss.maxPhases === 2 && (
            <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-[2px] bg-black/75" />
          )}
          {boss.maxPhases >= 3 && (
            <>
              <div className="pointer-events-none absolute top-0 bottom-0 left-[33.3%] w-[2px] bg-black/75" />
              <div className="pointer-events-none absolute top-0 bottom-0 left-[66.6%] w-[2px] bg-black/75" />
            </>
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-black text-white hud-text-stroke-sm tabular-nums">
            HP {Math.max(0, Math.ceil(boss.hp)).toLocaleString('tr-TR')} /{' '}
            {boss.maxHp.toLocaleString('tr-TR')}
          </div>
        </div>

        {/* İnce Süre Çizgisi */}
        <div className="mt-1.5 w-full h-1 bg-[#140a10] rounded-full overflow-hidden">
          <div
            className={`h-full origin-left ${isUrgent ? 'bg-red-500' : 'bg-amber-300'}`}
            style={{ transform: `scaleX(${Math.max(0.01, timeRatio)})` }}
          />
        </div>
      </div>

      {/* ŞÖVALYE CAN BARI (Yalnızca Boss Savaşında Aktif — 0 Can = Yenilgi) */}
      <div
        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border transition-colors ${
          boss.playerInvuln
            ? 'bg-red-950/95 border-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.6)]'
            : boss.playerHp <= 2
              ? 'bg-[#260b12]/92 border-red-400/90 shadow-[0_0_14px_rgba(239,68,68,0.45)]'
              : 'bg-[#120e1e]/88 border-amber-400/40'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black tracking-wider uppercase text-amber-100/90">
            Şövalye Canı
          </span>
          {boss.playerHp <= 2 && (
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-600/80 text-yellow-100">
              KRİTİK!
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" aria-label={`Şövalye canı ${boss.playerHp} / ${boss.playerMaxHp}`}>
          {Array.from({ length: Math.max(1, boss.playerMaxHp) }, (_, idx) => {
            const filled = idx < boss.playerHp;
            return (
              <Heart
                key={idx}
                className={`w-4 h-4 transition-transform duration-150 ${
                  filled
                    ? 'fill-rose-500 text-rose-200 drop-shadow-[0_0_5px_rgba(244,63,94,0.75)] scale-100'
                    : 'fill-slate-900/90 text-slate-600 scale-90 opacity-65'
                }`}
              />
            );
          })}
          <span className="ml-1 text-[11px] font-black text-rose-200 tabular-nums">
            {boss.playerHp}/{boss.playerMaxHp}
          </span>
        </div>
      </div>

      {/* Boss Saldırı Uyarı Bandı */}
      {boss.warningText && (
        <div className="mx-auto px-3.5 py-1 rounded-xl bg-red-950/95 border-2 border-amber-300 shadow-[0_0_18px_rgba(239,68,68,0.55)] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
          <span className="text-[11px] font-black tracking-wide text-yellow-100 uppercase">
            {boss.warningText}
          </span>
        </div>
      )}
    </div>
  );
};

interface BossTouchControlsProps {
  charge: number;
  isCharging: boolean;
  dizzyTimeLeft: number;
  pigTimeLeft: number;
  weaponName: string;
  onBossMove: (vx: number) => void;
  onBossJump: () => void;
  onAttackStart: () => void;
  onAttackRelease: () => void;
}

const JOYSTICK_MAX_OFFSET = 34;

export const BossTouchControls: React.FC<BossTouchControlsProps> = ({
  charge,
  isCharging,
  dizzyTimeLeft,
  pigTimeLeft,
  weaponName,
  onBossMove,
  onBossJump,
  onAttackStart,
  onAttackRelease,
}) => {
  const joyRef = useRef<HTMLDivElement | null>(null);
  const joyPointerIdRef = useRef<number | null>(null);
  const attackPointerIdRef = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);
  const [jumpPressed, setJumpPressed] = useState(false);

  // Bileşen kapanırken hareket ve şarjı güvenle sıfırla
  useEffect(() => {
    return () => {
      onBossMove(0);
    };
  }, [onBossMove]);

  const updateJoystickFromClient = (clientX: number, clientY: number) => {
    const el = joyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(JOYSTICK_MAX_OFFSET, dist);
    const angle = Math.atan2(dy, dx);
    const ox = dist > 0.001 ? Math.cos(angle) * clampedDist : 0;
    const oy = dist > 0.001 ? Math.sin(angle) * clampedDist * 0.45 : 0;
    setKnobOffset({ x: ox, y: oy });

    const normX = Math.max(-1, Math.min(1, ox / JOYSTICK_MAX_OFFSET));
    const filtered = Math.abs(normX) < 0.12 ? 0 : normX;
    onBossMove(filtered);
  };

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (joyPointerIdRef.current !== null) return;
    joyPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setJoyActive(true);
    updateJoystickFromClient(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    updateJoystickFromClient(e.clientX, e.clientY);
  };

  const resetJoy = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    joyPointerIdRef.current = null;
    setJoyActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onBossMove(0);
  };

  const handleAttackDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (attackPointerIdRef.current !== null) return;
    attackPointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    onAttackStart();
  };

  const handleAttackUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (attackPointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();
    attackPointerIdRef.current = null;
    onAttackRelease();
  };

  const handleJumpDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setJumpPressed(true);
    onBossJump();
  };

  const handleJumpUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setJumpPressed(false);
  };

  const pct = Math.max(0, Math.min(1, charge));
  const isFullCharge = pct >= 0.97;
  const isDisabled = pigTimeLeft > 0 || dizzyTimeLeft > 0;
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - pct);

  return (
    <div className="w-full px-3 pb-4 pt-1 flex flex-col gap-1.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent pointer-events-none select-none">
      {/* ÜST KOMPAKT DURUM & SİLAH BİLGİSİ */}
      <div className="flex justify-center">
        <div className="px-3 py-1 rounded-xl bg-[#140e1f]/90 border border-amber-400/35 text-[10px] font-black text-amber-100 tabular-nums">
          {pigTimeLeft > 0
            ? 'DOMUZ LANETİ!'
            : dizzyTimeLeft > 0
              ? `SERSEM ${dizzyTimeLeft.toFixed(1)}sn`
              : isFullCharge
                ? 'KRİTİK VURUŞ HAZIR!'
                : `${weaponName} · Güç %${Math.round(pct * 100)} · Zıpla & Kaç!`}
        </div>
      </div>

      {/* ALT KONTROL SATIRI: SOL JOYSTICK · SAĞ ZIPLA + SALDIR */}
      <div className="w-full flex items-end justify-between gap-2">
        {/* SOL: MOBİL SANAL JOYSTICK (Yalnızca Boss Bölümlerinde Aktif) */}
        <div className="flex flex-col items-center gap-1 pointer-events-auto">
          <div
            ref={joyRef}
            onPointerDown={handleJoyDown}
            onPointerMove={handleJoyMove}
            onPointerUp={resetJoy}
            onPointerCancel={resetJoy}
            role="slider"
            aria-label="Boss arenası hareket joysticki"
            aria-valuemin={-100}
            aria-valuemax={100}
            aria-valuenow={Math.round((knobOffset.x / JOYSTICK_MAX_OFFSET) * 100)}
            className={`relative w-[114px] h-[114px] rounded-full touch-none cursor-grab active:cursor-grabbing flex items-center justify-center border-2 shadow-[0_8px_22px_rgba(0,0,0,0.75)] transition-colors ${
              joyActive
                ? 'bg-[#1e172c]/92 border-amber-300'
                : 'bg-[#130f1e]/88 border-amber-400/55'
            }`}
          >
            {/* İç halka ve yön göstergeleri */}
            <div className="pointer-events-none absolute inset-3 rounded-full border border-amber-300/20" />
            <ChevronLeft
              className={`pointer-events-none absolute left-2 w-5 h-5 ${
                knobOffset.x < -8 ? 'text-yellow-300' : 'text-amber-200/45'
              }`}
            />
            <ChevronRight
              className={`pointer-events-none absolute right-2 w-5 h-5 ${
                knobOffset.x > 8 ? 'text-yellow-300' : 'text-amber-200/45'
              }`}
            />

            {/* Hareketli Joystick Topuzu */}
            <div
              className={`pointer-events-none w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.75)] ${
                joyActive
                  ? 'bg-gradient-to-b from-amber-300 to-amber-600 border-yellow-100'
                  : 'bg-gradient-to-b from-[#3c3252] to-[#201930] border-amber-300/80'
              }`}
              style={{
                transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
              }}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  joyActive ? 'bg-amber-950/75' : 'bg-amber-300/75'
                }`}
              />
            </div>
          </div>
          <span className="text-[10px] font-black tracking-wider uppercase text-amber-200/90 hud-text-stroke-sm">
            HAREKET (A/D)
          </span>
        </div>

        {/* SAĞ: ZIPLA + BÜYÜK SALDIRI / ŞARJ BUTONU */}
        <div className="flex items-end gap-2.5 pointer-events-auto">
          {/* ZIPLA BUTONU (Yalnızca Boss Savaşında) */}
          <div className="flex flex-col items-center gap-1 pb-1">
            <button
              type="button"
              onPointerDown={handleJumpDown}
              onPointerUp={handleJumpUp}
              onPointerCancel={handleJumpUp}
              aria-label="Boss saldırılarından zıplayarak kaç"
              className={`w-[74px] h-[74px] rounded-full touch-none cursor-pointer flex flex-col items-center justify-center border-[3px] shadow-[0_6px_18px_rgba(0,0,0,0.75)] transition-transform ${
                jumpPressed
                  ? 'bg-gradient-to-b from-cyan-300 via-sky-500 to-blue-700 border-white text-[#071829] scale-95 shadow-[0_0_22px_rgba(56,189,248,0.75)]'
                  : 'bg-gradient-to-b from-sky-500 via-cyan-700 to-[#0e2a42] border-cyan-300/90 text-cyan-50'
              }`}
            >
              <ArrowUp className="w-7 h-7 stroke-[2.8] shrink-0" />
              <span className="font-crest text-[10px] font-black tracking-wider uppercase leading-none">
                ZIPLA
              </span>
            </button>
            <span className="text-[9px] font-black tracking-wider uppercase text-cyan-200/90 hud-text-stroke-sm">
              W / ↑
            </span>
          </div>

          {/* BÜYÜK SALDIRI / ŞARJ BUTONU */}
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onPointerDown={handleAttackDown}
              onPointerUp={handleAttackUp}
              onPointerCancel={handleAttackUp}
              aria-label="Güç toplamak için basılı tut, saldırmak için bırak"
              className={`relative w-[104px] h-[104px] rounded-full touch-none cursor-pointer flex flex-col items-center justify-center border-[3px] shadow-[0_8px_24px_rgba(0,0,0,0.75)] transition-transform ${
                isDisabled
                  ? 'bg-[#2a1f2d]/90 border-slate-500 text-slate-400 scale-95'
                  : isFullCharge
                    ? 'bg-gradient-to-b from-yellow-300 via-amber-400 to-orange-600 border-yellow-100 text-[#231004] scale-105 shadow-[0_0_28px_rgba(250,204,21,0.75)]'
                    : isCharging
                      ? 'bg-gradient-to-b from-red-500 via-rose-700 to-red-950 border-amber-300 text-yellow-100 scale-95'
                      : 'bg-gradient-to-b from-red-700 via-red-900 to-[#360b12] border-amber-400/85 text-amber-100'
              }`}
            >
              {/* Dairesel Şarj Halkası */}
              <svg
                viewBox="0 0 98 98"
                className="pointer-events-none absolute -inset-1.5 w-[116px] h-[116px] -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="49"
                  cy="49"
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(15, 10, 22, 0.72)"
                  strokeWidth="6"
                />
                <circle
                  cx="49"
                  cy="49"
                  r={ringRadius}
                  fill="none"
                  stroke={isFullCharge ? '#fef08a' : '#f59e0b'}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>

              <Swords className="w-7 h-7 shrink-0" />
              <span className="mt-0.5 font-crest text-xs font-black tracking-wider uppercase leading-none">
                {isFullCharge ? 'BIRAK!' : isCharging ? 'ŞARJ...' : 'SALDIR'}
              </span>
            </button>
            <span className="text-[10px] font-black tracking-wider uppercase text-amber-200/90 hud-text-stroke-sm">
              TUT / BIRAK
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
