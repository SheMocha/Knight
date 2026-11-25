import React, { useState } from 'react';
import {
  Check,
  Clock,
  Crown,
  Flame,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Skull,
  Swords,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { getLevelConfig, getLevelsByWorld, TOTAL_LEVELS, WORLDS } from '../game/levels';
import { SaveData } from '../game/types';
import { getWorldForLevel, LEVELS_PER_WORLD, TOTAL_WORLDS } from '../game/worlds';

interface ChaptersModalProps {
  saveData: SaveData;
  onClose: () => void;
  onPlayLevel: (levelId: number) => void;
}

const CornerFiligree: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 28 28"
    fill="none"
    aria-hidden="true"
    className={`pointer-events-none w-6 h-6 text-[#d6ac5c]/80 ${className}`}
  >
    <path
      d="M2 26V8C2 4.686 4.686 2 8 2H26"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M6 20V9C6 7.343 7.343 6 9 6H20"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.55"
    />
    <rect
      x="6.5"
      y="6.5"
      width="4"
      height="4"
      transform="rotate(45 6.5 6.5)"
      fill="currentColor"
      fillOpacity="0.7"
    />
  </svg>
);

export const ChaptersModal: React.FC<ChaptersModalProps> = ({
  saveData,
  onClose,
  onPlayLevel,
}) => {
  const [activeImgErr, setActiveImgErr] = useState(false);
  const [lockedImgErr, setLockedImgErr] = useState(false);

  const totalChapters = TOTAL_LEVELS;
  const completedCount = Math.min(
    totalChapters,
    Math.max(saveData.unlockedLevel - 1, saveData.completedLevels?.length ?? 0),
  );
  const allCompleted = completedCount >= totalChapters;

  // Tamamlanan bölümler ana seçim ekranında liste olarak kalabalık yapmaz; aktif bölüm öne çıkarılır
  const activeLevel = getLevelConfig(saveData.unlockedLevel);
  const activeWorld = getWorldForLevel(activeLevel.id);
  const activeWorldLevels = getLevelsByWorld(activeWorld.id);
  const activeBestScore = saveData.bestScores[activeLevel.id] || 0;
  const isReturningPlayer = activeBestScore > 0 || saveData.unlockedLevel > 1;

  // Yalnızca sıradaki kilitli bölümün önizlemesi gösterilir
  const nextLockedLevel =
    activeLevel.id < totalChapters ? getLevelConfig(activeLevel.id + 1) : null;
  const nextLockedWorld = nextLockedLevel ? getWorldForLevel(nextLockedLevel.id) : null;

  const progressPct = Math.round((completedCount / totalChapters) * 100);
  const hasActiveArt = Boolean(activeLevel.artwork) && !activeImgErr;
  const hasLockedArt = Boolean(nextLockedLevel?.artwork) && !lockedImgErr;

  return (
    <div
      className="df-animate-backdrop absolute inset-0 z-40 flex items-center justify-center bg-black/88 backdrop-blur-[3px] p-3 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label="60 Bölümlük Sefer ve Dünya İlerlemesi"
    >
      <div className="df-panel df-animate-reveal relative w-full max-h-[95%] flex flex-col rounded-xl text-[#ebe5d9] overflow-hidden">
        <CornerFiligree className="absolute top-1.5 left-1.5 z-20" />
        <CornerFiligree className="absolute top-1.5 right-1.5 z-20 rotate-90" />
        <CornerFiligree className="absolute bottom-1.5 left-1.5 z-20 -rotate-90" />
        <CornerFiligree className="absolute bottom-1.5 right-1.5 z-20 rotate-180" />

        {/* Üst Başlık ve 10 Dünya / 60 Bölüm Genel İlerlemesi */}
        <div className="relative z-10 px-4 pt-3.5 pb-3 border-b border-[#c69f56]/25 bg-gradient-to-b from-[#1a1c28]/90 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-[#c7a362] uppercase">
                Dünya {activeWorld.id} / {TOTAL_WORLDS} · {activeWorld.name}
              </p>
              <h2 className="mt-0.5 font-crest text-[20px] font-black tracking-wide text-[#f4ebd9] leading-tight">
                60 Bölümlük Sefer
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Bölümler menüsünü kapat"
              className="df-btn-iron w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#e7c26e]"
            >
              <X className="w-4 h-4 text-[#d8ccb5]" />
            </button>
          </div>

          {/* Genel İlerleme Barı */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#bdb4a3] tabular-nums">
              <span>
                Tamamlanan:{' '}
                <strong className="text-[#ebd096] font-bold">
                  {completedCount} / {totalChapters}
                </strong>
              </span>
              <span className="text-[#9e9688]">%{progressPct} Sefer</span>
            </div>
            <div className="mt-1.5 w-full h-1.5 rounded-full bg-[#1e2130] overflow-hidden border border-[#c79d4e]/20">
              <div
                className="h-full bg-gradient-to-r from-[#8f6624] via-[#d8ac57] to-[#f4d78f] transition-all duration-500"
                style={{ width: `${Math.max(2, progressPct)}%` }}
              />
            </div>

            {/* 10 Dünya Kompakt Harita Şeridi (5x2) */}
            <div className="mt-2.5 grid grid-cols-5 gap-1.5">
              {WORLDS.map((w) => {
                const isWorldUnlocked = saveData.unlockedLevel >= w.levelStart;
                const isWorldActive = w.id === activeWorld.id;
                const isWorldDone = completedCount >= w.levelEnd;
                const doneInWorld = Math.max(
                  0,
                  Math.min(LEVELS_PER_WORLD, completedCount - (w.levelStart - 1)),
                );

                return (
                  <div
                    key={w.id}
                    title={`Dünya ${w.id}: ${w.name} (Bölüm ${w.levelStart}-${w.levelEnd})`}
                    className={`relative rounded-md px-1.5 py-1 border text-center transition-colors ${
                      isWorldActive
                        ? 'bg-[#282014] border-[#f0ce7c] shadow-[0_0_10px_rgba(231,194,110,0.35)]'
                        : isWorldDone
                          ? 'bg-[#1c1a16] border-[#a8823c]/60'
                          : isWorldUnlocked
                            ? 'bg-[#171926] border-[#6d7490]/50'
                            : 'bg-[#10121b] border-[#262a3b] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-0.5 leading-none">
                      <span
                        className={`font-crest text-[10px] font-black ${
                          isWorldActive
                            ? 'text-[#f6da92]'
                            : isWorldDone
                              ? 'text-[#c9a358]'
                              : isWorldUnlocked
                                ? 'text-[#d4cfc4]'
                                : 'text-[#6c7288]'
                        }`}
                      >
                        {w.roman}
                      </span>
                      {w.bossLevel !== null && (
                        <Skull
                          className={`w-2.5 h-2.5 ${
                            isWorldUnlocked ? 'text-rose-400' : 'text-[#5c6277]'
                          }`}
                        />
                      )}
                      {!isWorldUnlocked && <Lock className="w-2.5 h-2.5 text-[#5c6277]" />}
                      {isWorldDone && <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />}
                    </div>
                    <div
                      className={`mt-0.5 text-[9px] font-bold truncate ${
                        isWorldActive
                          ? 'text-[#f4e8cd]'
                          : isWorldUnlocked
                            ? 'text-[#a8a296]'
                            : 'text-[#62687e]'
                      }`}
                    >
                      {w.shortName}
                    </div>
                    <div className="text-[8px] font-semibold text-[#8a8478] tabular-nums leading-tight">
                      {doneInWorld}/{LEVELS_PER_WORLD}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aktif Dünyadaki 6 Bölüm Düğümü (Boss Bölümleri Kırmızı/Altın İşaretli) */}
            <div className="relative mt-2.5 flex items-center justify-between px-1.5">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-[#2a2d3c]" />
              {activeWorldLevels.map((lvl) => {
                const isDone =
                  lvl.id < saveData.unlockedLevel ||
                  (saveData.completedLevels?.includes(lvl.id) ?? false);
                const isCurrent = lvl.id === activeLevel.id;

                return (
                  <div
                    key={lvl.id}
                    className="relative z-10 flex flex-col items-center gap-0.5"
                    title={`Bölüm ${lvl.id}: ${lvl.name}${lvl.isBossLevel ? ' (BOSS)' : ''}`}
                  >
                    <div
                      className={`w-5 h-5 rotate-45 flex items-center justify-center border transition-all ${
                        lvl.isBossLevel && isCurrent
                          ? 'bg-[#3c0f18] border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.65)]'
                          : isCurrent
                            ? 'bg-[#2a2114] border-[#f0ce7c] shadow-[0_0_10px_rgba(231,194,110,0.55)]'
                            : isDone
                              ? 'bg-[#b58432] border-[#f0ce7c]/90'
                              : lvl.isBossLevel
                                ? 'bg-[#1f0d15] border-rose-500/55'
                                : 'bg-[#12141e] border-[#3d4256]'
                      }`}
                    >
                      <div className="-rotate-45 flex items-center justify-center">
                        {isDone && !isCurrent ? (
                          <Check className="w-2.5 h-2.5 text-[#120d06] stroke-[3]" />
                        ) : lvl.isBossLevel ? (
                          <Skull
                            className={`w-2.5 h-2.5 ${
                              isCurrent ? 'text-yellow-300' : 'text-rose-400/85'
                            }`}
                          />
                        ) : isCurrent ? (
                          <Swords className="w-2.5 h-2.5 text-[#f6db96]" />
                        ) : (
                          <Lock className="w-2 h-2 text-[#666d82]" />
                        )}
                      </div>
                    </div>
                    <span
                      className={`font-crest text-[9px] leading-none mt-0.5 tabular-nums ${
                        lvl.isBossLevel
                          ? 'text-rose-300 font-black'
                          : isCurrent
                            ? 'text-[#f2d288] font-bold'
                            : isDone
                              ? 'text-[#b79a63]'
                              : 'text-[#62687c]'
                      }`}
                    >
                      {lvl.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Ana İçerik: Yalnızca Mevcut Bölüm Kartı + Sonraki Kilitli Bölüm Önizlemesi */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
          {/* 1. MEVCUT OYNANABİLİR BÖLÜM KARTI */}
          <section
            aria-label={`Aktif Bölüm: ${activeLevel.name}`}
            className={`df-chapter-card relative rounded-xl overflow-hidden group ${
              activeLevel.isBossLevel ? 'border-rose-500/70' : ''
            }`}
          >
            <div
              aria-hidden="true"
              className="df-light-sweep pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 z-20 bg-gradient-to-r from-transparent via-[#f6d98e]/14 to-transparent"
            />

            {/* Bölüm Özel Arka Plan Görseli veya Tema Gradientsi */}
            <div className="relative h-36 w-full overflow-hidden bg-[#0c0e14]">
              {hasActiveArt ? (
                <img
                  src={activeLevel.artwork}
                  alt={activeLevel.name}
                  referrerPolicy="no-referrer"
                  onError={() => setActiveImgErr(true)}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-b ${activeLevel.fallbackGradient} flex items-center justify-center`}
                >
                  {activeLevel.isBossLevel ? (
                    <Skull className="w-12 h-12 text-rose-400/65" />
                  ) : (
                    <Shield className="w-12 h-12 text-[#c89f54]/50" />
                  )}
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1018] via-[#0e1018]/45 to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

              {/* Üst Köşe Bilgileri */}
              <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-semibold tracking-[0.14em] uppercase">
                <span
                  className={`drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] flex items-center gap-1.5 ${
                    activeLevel.isBossLevel ? 'text-rose-300 font-black' : 'text-[#f0cf82]'
                  }`}
                >
                  {activeLevel.isBossLevel && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                  <span>
                    {activeLevel.isBossLevel
                      ? 'ÖZEL BOSS SAVAŞI'
                      : allCompleted
                        ? 'Krallık Finali'
                        : `Dünya ${activeWorld.roman} · Aktif`}
                  </span>
                </span>
                <span className="text-[#d7ccb8]/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] tabular-nums">
                  Bölüm {activeLevel.id} / {totalChapters}
                </span>
              </div>

              {/* Alt Başlık */}
              <div className="absolute inset-x-0 bottom-0 px-3.5 pb-2">
                <h3 className="font-crest text-xl font-black tracking-wide text-[#faf3e3] drop-shadow-[0_3px_10px_rgba(0,0,0,0.95)] text-balance">
                  {activeLevel.name}
                </h3>
                {activeLevel.isBossLevel && activeLevel.boss && (
                  <p className="text-[11px] font-bold text-rose-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
                    {activeLevel.boss.name} — {activeLevel.boss.title}
                  </p>
                )}
              </div>
            </div>

            {/* Kart İçeriği */}
            <div className="relative px-3.5 pt-2 pb-3.5">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-[#c79d4e]/55 to-transparent mb-2.5" />

              <p className="text-[12px] leading-relaxed text-[#cfc6b6]">{activeLevel.atmosphere}</p>

              {/* Metrik Şeridi */}
              <div className="mt-3 py-2 border-y border-[#c79d4e]/20 grid grid-cols-3 divide-x divide-[#c79d4e]/20 text-center tabular-nums">
                <div className="px-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-[#a39a8c]">
                    {activeLevel.isBossLevel ? (
                      <>
                        <Skull className="w-3 h-3 text-rose-400" />
                        <span>Boss HP</span>
                      </>
                    ) : (
                      <>
                        <Target className="w-3 h-3 text-[#d5a957]" />
                        <span>Hedef</span>
                      </>
                    )}
                  </div>
                  <div className="mt-0.5 font-crest text-[14px] font-bold text-[#f4e4bc]">
                    {activeLevel.isBossLevel && activeLevel.boss
                      ? activeLevel.boss.maxHp.toLocaleString('tr-TR')
                      : activeLevel.scoreTarget.toLocaleString('tr-TR')}
                  </div>
                </div>

                <div className="px-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-[#a39a8c]">
                    <Clock className="w-3 h-3 text-[#d5a957]" />
                    <span>Süre</span>
                  </div>
                  <div className="mt-0.5 font-crest text-[14px] font-bold text-[#ebe4d7]">
                    {activeLevel.timeLimit} sn
                  </div>
                </div>

                <div className="px-1">
                  <div className="flex items-center justify-center gap-1 text-[10px] font-semibold tracking-wider uppercase text-[#a39a8c]">
                    <Trophy className="w-3 h-3 text-[#d5a957]" />
                    <span>Rekor</span>
                  </div>
                  <div className="mt-0.5 font-crest text-[14px] font-bold text-[#e6c473]">
                    {activeBestScore > 0 ? activeBestScore.toLocaleString('tr-TR') : '—'}
                  </div>
                </div>
              </div>

              {activeLevel.isBossLevel && (
                <p className="mt-2 text-[11px] font-semibold text-amber-200/90 text-center">
                  Boss Arenası: Sol joystick ile hareket et, sağ butonla saldır!
                </p>
              )}

              <button
                type="button"
                onClick={() => onPlayLevel(activeLevel.id)}
                className="df-cta-gold relative mt-3 w-full py-3 px-5 rounded-lg font-crest text-sm font-black tracking-[0.12em] uppercase flex items-center justify-center gap-2 cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-[#f5da91]"
              >
                <Play className="w-4 h-4 fill-current shrink-0" />
                <span className="whitespace-nowrap">
                  {activeLevel.isBossLevel
                    ? "BOSS'A MEYDAN OKU"
                    : isReturningPlayer
                      ? 'DEVAM ET'
                      : 'OYNA'}
                </span>
              </button>
            </div>
          </section>

          {/* 2. SONRAKİ KİLİTLİ BÖLÜM ÖNİZLEMESİ */}
          {nextLockedLevel && nextLockedWorld ? (
            <section
              aria-label={`Sonraki Kilitli Bölüm: ${nextLockedLevel.name}`}
              className="df-locked-card relative rounded-xl overflow-hidden"
            >
              <div className="relative">
                <div className="absolute inset-0 overflow-hidden">
                  {hasLockedArt ? (
                    <img
                      src={nextLockedLevel.artwork}
                      alt={`${nextLockedLevel.name} (Kilitli)`}
                      referrerPolicy="no-referrer"
                      onError={() => setLockedImgErr(true)}
                      className="w-full h-full object-cover object-center brightness-[0.28] saturate-[0.25] contrast-110 scale-105"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-br ${nextLockedLevel.fallbackGradient} opacity-65`}
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="df-fog-drift pointer-events-none absolute -inset-4 bg-[radial-gradient(ellipse_at_60%_40%,rgba(148,163,184,0.14),transparent_65%)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#090b10]/94 via-[#090b10]/78 to-[#090b10]/65" />
                </div>

                <div className="relative z-10 p-3.5 flex items-start gap-3">
                  <div
                    className={`mt-0.5 shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${
                      nextLockedLevel.isBossLevel
                        ? 'bg-[#271018]/90 border-rose-500/50'
                        : 'bg-[#12151f]/90 border-[#6e748a]/40'
                    }`}
                  >
                    {nextLockedLevel.isBossLevel ? (
                      <Skull className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-[#9ea4b8]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold tracking-[0.14em] uppercase text-[#878ea3]">
                      <span className={nextLockedLevel.isBossLevel ? 'text-rose-300 font-bold' : ''}>
                        {nextLockedLevel.isBossLevel
                          ? 'Sonraki: BOSS SAVAŞI'
                          : nextLockedWorld.id > activeWorld.id
                            ? `Yeni Dünya: ${nextLockedWorld.name}`
                            : 'Sonraki Bölüm · Kilitli'}
                      </span>
                      <span className="font-crest text-[#99a0b4] tabular-nums">
                        Bölüm {nextLockedLevel.id}
                      </span>
                    </div>

                    <h4 className="mt-0.5 font-crest text-[16px] font-bold text-[#c7ccd9] tracking-wide truncate">
                      {nextLockedLevel.name}
                    </h4>

                    <p className="mt-1 text-[11px] italic leading-relaxed text-[#8d94a8]">
                      {nextLockedLevel.lockedMystery}
                    </p>

                    <div className="mt-2 pt-2 border-t border-white/8 text-[11px] font-medium text-[#b59c6b]">
                      Kilidi açmak için{' '}
                      <span className="text-[#e3c88c] font-semibold">
                        &ldquo;{activeLevel.name}&rdquo;
                      </span>{' '}
                      bölümünü tamamla.
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <div className="df-locked-card rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#1d1810] border border-[#c79d4e]/45 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-[#e5be69]" />
                </div>
                <div className="min-w-0">
                  <p className="font-crest text-xs font-bold tracking-wider text-[#ebd096] uppercase">
                    {allCompleted ? 'Tüm 60 Bölüm Fethedildi' : '60. Bölüm — Kadim Ejderha'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9b9588] leading-snug">
                    {allCompleted
                      ? '10 dünyanın tamamını fethederek Kara Şövalye efsanesini tamamladın!'
                      : 'Kadim Kızıl Ejderha Lordu’nu yenerek 60 bölümlük seferi mühürle.'}
                  </p>
                </div>
              </div>

              {allCompleted && (
                <button
                  type="button"
                  onClick={() => onPlayLevel(1)}
                  className="df-btn-iron px-3 py-2 rounded-lg text-[11px] font-bold text-[#e5c782] flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Baştan</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
