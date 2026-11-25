import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Cloud,
  CloudOff,
  ExternalLink,
  Gamepad2,
  Lock,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Trophy,
  WifiOff,
  X,
} from 'lucide-react';
import {
  ACHIEVEMENT_CATEGORIES,
  AchievementCategory,
} from '../game/achievementsConfig';
import {
  AchievementManagerSnapshot,
  AchievementViewItem,
} from '../game/achievementManager';

interface AchievementsModalProps {
  snapshot: AchievementManagerSnapshot;
  onClose: () => void;
  onSignIn: () => void;
  onRefreshSync: () => void;
  onOpenGooglePlayUi: () => void;
  nativeUiFeedback: string | null;
}

const SYNC_BADGE_MAP: Record<
  AchievementViewItem['syncState'],
  { label: string; className: string }
> = {
  LOCKED: {
    label: 'Kilitli',
    className: 'bg-slate-900/90 border-slate-700 text-slate-400',
  },
  PLAY_GAMES_UNLOCKED: {
    label: 'Google Play Onaylı',
    className: 'bg-emerald-950/95 border-emerald-400/80 text-emerald-300',
  },
  PENDING_SYNC: {
    label: 'Play Senkron Bekliyor',
    className: 'bg-amber-950/95 border-amber-400/80 text-amber-200',
  },
  MISSING_CONSOLE_ID: {
    label: 'Yerel · Console ID Eksik',
    className: 'bg-orange-950/95 border-orange-400/75 text-orange-200',
  },
  LOCAL_ONLY_OFFLINE: {
    label: 'Çevrimdışı Kayıtlı',
    className: 'bg-slate-900/95 border-sky-400/60 text-sky-200',
  },
  LOCAL_ONLY_NOT_SIGNED_IN: {
    label: 'Yerel · Play Bağlı Değil',
    className: 'bg-slate-900/95 border-amber-400/50 text-amber-200',
  },
  LOCAL_ONLY_WEB: {
    label: 'Yerel · Web Önizleme',
    className: 'bg-slate-900/95 border-indigo-400/55 text-indigo-200',
  },
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  snapshot,
  onClose,
  onSignIn,
  onRefreshSync,
  onOpenGooglePlayUi,
  nativeUiFeedback,
}) => {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('level');
  const { connection } = snapshot;

  const filteredItems = snapshot.items.filter((it) => it.def.category === activeCategory);
  const overallPct = Math.round(
    (snapshot.localCriteriaMetCount / Math.max(1, snapshot.totalCount)) * 100,
  );
  const playVerifiedPct = Math.round(
    (snapshot.playGamesUnlockedCount / Math.max(1, snapshot.totalCount)) * 100,
  );

  const isPlayConnected = connection.state === 'AUTHENTICATED';

  return (
    <div className="df-animate-backdrop absolute inset-0 z-40 flex items-center justify-center bg-black/88 p-2.5 pointer-events-auto">
      <div className="df-panel df-animate-reveal relative w-full h-full max-h-[95%] flex flex-col rounded-2xl text-[#ebe5d9] overflow-hidden border-2 border-amber-500/45">
        {/* ÜST BAŞLIK */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-amber-400/25 bg-[#120d1c]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-amber-300 to-amber-600 flex items-center justify-center text-[#1a1004] shadow-md shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-crest text-base font-black tracking-wide text-amber-200 truncate">
                BAŞARIMLAR
              </h2>
              <p className="text-[10px] font-bold text-slate-300/85 truncate">
                Google Play Games Services v2 · {snapshot.totalCount} Başarım
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {connection.isNativeAndroid && (
              <button
                type="button"
                onClick={onRefreshSync}
                disabled={snapshot.isSyncing}
                aria-label="Google Play başarımlarını senkronize et"
                className="arcade-btn-dark w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 text-amber-300 ${snapshot.isSyncing ? 'animate-spin' : ''}`}
                />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Başarımlar penceresini kapat"
              className="arcade-btn-dark w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* GOOGLE PLAY GAMES BAĞLANTI DURUMU & RESMİ EKRAN BUTONU */}
        <div className="px-3.5 pt-3 pb-2 space-y-2 bg-[#100b18]/90 border-b border-white/10">
          <div
            className={`rounded-xl border px-3 py-2 text-xs ${
              isPlayConnected
                ? 'bg-emerald-950/55 border-emerald-400/50'
                : connection.state === 'OFFLINE'
                  ? 'bg-sky-950/55 border-sky-400/45'
                  : 'bg-[#1c1428]/95 border-amber-400/40'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {isPlayConnected ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : connection.state === 'OFFLINE' ? (
                  <WifiOff className="w-4 h-4 text-sky-300 shrink-0" />
                ) : (
                  <CloudOff className="w-4 h-4 text-amber-300 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">
                    {isPlayConnected && connection.player
                      ? `Play Games: ${connection.player.displayName}`
                      : connection.state === 'UNSUPPORTED_WEB'
                        ? 'Google Play Bağlı Değil (Web Ortamı)'
                        : connection.state === 'OFFLINE'
                          ? 'Çevrimdışı Mod'
                          : connection.state === 'PROJECT_NOT_CONFIGURED'
                            ? 'Play Console Yapılandırması Bekleniyor'
                            : connection.state === 'PLAY_SERVICES_UNAVAILABLE'
                              ? 'Google Play Hizmetleri Kullanılamıyor'
                              : 'Google Play Hesabına Giriş Yapılmadı'}
                  </div>
                  {isPlayConnected && connection.player && (
                    <div className="text-[10px] text-emerald-200/85 truncate tabular-nums">
                      Oyuncu ID: {connection.player.playerId}
                    </div>
                  )}
                </div>
              </div>

              {connection.isNativeAndroid && !isPlayConnected && connection.isOnline && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="arcade-btn-gold px-2.5 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Bağlan</span>
                </button>
              )}
            </div>

            <p className="mt-1 text-[10px] leading-snug text-slate-300">
              {connection.statusMessage}
            </p>
            {snapshot.lastError && (
              <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-300">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{snapshot.lastError}</span>
              </p>
            )}
          </div>

          {/* Resmi Google Play Games Başarımlar Arayüzünü Açma Butonu */}
          <button
            type="button"
            onClick={onOpenGooglePlayUi}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-black tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors ${
              isPlayConnected
                ? 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 border-emerald-300/80 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)]'
                : 'bg-[#1a1426] border-slate-600/80 text-slate-200 hover:border-amber-400/60'
            }`}
          >
            <Gamepad2 className="w-4 h-4 shrink-0" />
            <span>Google Play Başarımlarını Aç (Resmi)</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
          </button>

          {nativeUiFeedback && (
            <div className="rounded-lg bg-amber-950/80 border border-amber-400/50 px-2.5 py-1.5 text-[10px] font-bold text-amber-100">
              {nativeUiFeedback}
            </div>
          )}

          {/* Genel İlerleme Özeti: Google Play Onaylı vs Yerel İlerleme AÇIKÇA AYRILIR */}
          <div className="grid grid-cols-2 gap-2 text-[10px] tabular-nums">
            <div className="rounded-lg bg-[#171222] border border-emerald-500/30 px-2.5 py-1.5">
              <div className="flex items-center justify-between text-emerald-300 font-bold">
                <span className="flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Play Onaylı
                </span>
                <span>
                  {snapshot.playGamesUnlockedCount}/{snapshot.totalCount} (%{playVerifiedPct})
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-black/70 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 origin-left"
                  style={{ transform: `scaleX(${Math.max(0.01, playVerifiedPct / 100)})` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-[#171222] border border-amber-500/30 px-2.5 py-1.5">
              <div className="flex items-center justify-between text-amber-200 font-bold">
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-300" />
                  Yerel İlerleme
                </span>
                <span>
                  {snapshot.localCriteriaMetCount}/{snapshot.totalCount} (%{overallPct})
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-black/70 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 origin-left"
                  style={{ transform: `scaleX(${Math.max(0.01, overallPct / 100)})` }}
                />
              </div>
            </div>
          </div>

          {/* 4 KATEGORİ SEKMESİ */}
          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
            {ACHIEVEMENT_CATEGORIES.map((cat) => {
              const catItems = snapshot.items.filter((i) => i.def.category === cat.id);
              const catDone = catItems.filter(
                (i) => i.playGamesUnlocked || i.localCriteriaMet,
              ).length;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`py-1.5 px-1 rounded-xl border text-[11px] font-black transition-colors cursor-pointer ${
                    active
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-yellow-200 text-[#1d1004] shadow-md'
                      : 'bg-[#191326] border-slate-700/80 text-slate-300 hover:border-amber-400/50'
                  }`}
                >
                  <div>{cat.label}</div>
                  <div
                    className={`text-[9px] tabular-nums ${
                      active ? 'text-[#2b1706]/90' : 'text-slate-400'
                    }`}
                  >
                    {catDone}/{catItems.length}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* BAŞARIM KARTLARI LİSTESİ (DİKEY KAYDIRILABİLİR) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5">
          {filteredItems.map((item) => {
            const unlockedVisually = item.playGamesUnlocked || item.localCriteriaMet;
            const badge = SYNC_BADGE_MAP[item.syncState];
            return (
              <div
                key={item.def.key}
                className={`relative rounded-xl border p-2.5 transition-colors ${
                  item.playGamesUnlocked
                    ? 'bg-gradient-to-r from-[#231b11] via-[#1d1527] to-[#131d1b] border-amber-400/80 shadow-[0_0_18px_rgba(250,204,21,0.18)]'
                    : item.localCriteriaMet
                      ? 'bg-gradient-to-r from-[#21192c] to-[#171222] border-amber-400/50'
                      : 'bg-[#120e1a]/92 border-slate-800/95'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 512x512 PNG Başarım İkonu (Kilitliyken gri tonlu) */}
                  <div
                    className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 bg-[#0b0812] ${
                      item.playGamesUnlocked
                        ? 'border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.5)]'
                        : item.localCriteriaMet
                          ? 'border-amber-400/75'
                          : 'border-slate-700'
                    }`}
                  >
                    <img
                      src={item.def.iconPath}
                      alt={item.def.name}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-all ${
                        unlockedVisually ? 'grayscale-0 opacity-100' : 'grayscale opacity-45'
                      }`}
                    />
                    {!unlockedVisually && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                        <Lock className="w-5 h-5 text-slate-300/90" />
                      </div>
                    )}
                    {item.playGamesUnlocked && (
                      <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 border border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Başarım Detayları ve İlerleme */}
                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-crest text-sm font-black leading-tight ${
                          unlockedVisually ? 'text-amber-200' : 'text-slate-300'
                        }`}
                      >
                        {item.def.name}
                      </h3>
                      <span className="text-[10px] font-black text-amber-300/90 bg-black/45 border border-amber-400/30 px-1.5 py-0.5 rounded shrink-0 tabular-nums">
                        +{item.def.points} XP
                      </span>
                    </div>

                    <p className="mt-0.5 text-[11px] text-slate-300/90 leading-snug">
                      {item.def.description}
                    </p>

                    {/* İlerleme Çubuğu & Yüzde */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold tabular-nums">
                        <span className={unlockedVisually ? 'text-amber-200' : 'text-slate-400'}>
                          {item.def.type === 'INCREMENTAL'
                            ? `${item.displaySteps.toLocaleString('tr-TR')} / ${item.def.targetSteps.toLocaleString('tr-TR')}`
                            : unlockedVisually
                              ? 'Tamamlandı'
                              : '0 / 1'}
                        </span>
                        <span className={unlockedVisually ? 'text-emerald-300' : 'text-slate-400'}>
                          %{item.percent}
                        </span>
                      </div>
                      <div className="mt-1 w-full h-1.5 rounded-full bg-black/75 overflow-hidden">
                        <div
                          className={`h-full origin-left transition-transform duration-200 ${
                            item.playGamesUnlocked
                              ? 'bg-gradient-to-r from-emerald-400 via-yellow-300 to-amber-400'
                              : item.localCriteriaMet
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                                : 'bg-gradient-to-r from-sky-600 to-sky-400'
                          }`}
                          style={{ transform: `scaleX(${Math.max(0.01, item.percent / 100)})` }}
                        />
                      </div>
                    </div>

                    {/* Durum Rozeti (Google Play Onaylı vs Yerel) */}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${badge.className}`}
                      >
                        {item.playGamesUnlocked ? (
                          <Cloud className="w-2.5 h-2.5" />
                        ) : (
                          <Award className="w-2.5 h-2.5" />
                        )}
                        {badge.label}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        {item.def.type === 'INCREMENTAL' ? 'Artımlı' : 'Standart'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
