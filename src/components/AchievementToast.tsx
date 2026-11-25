import React from 'react';
import { Award, Cloud, CloudOff, Sparkles } from 'lucide-react';
import { AchievementToastPayload } from '../game/achievementManager';

interface AchievementToastProps {
  toast: AchievementToastPayload | null;
}

const TIER_BORDER: Record<AchievementToastPayload['tier'], string> = {
  bronze: 'border-amber-500/85 shadow-[0_8px_28px_rgba(217,119,6,0.45)]',
  silver: 'border-slate-300/90 shadow-[0_8px_28px_rgba(148,163,184,0.45)]',
  gold: 'border-yellow-300 shadow-[0_8px_32px_rgba(250,204,21,0.55)]',
  mythic: 'border-rose-400 shadow-[0_8px_34px_rgba(244,63,94,0.6)]',
};

/**
 * Oyun içi ve menü üstünde çalışan, dokunmatik kontrolleri ASLA engellemeyen (pointer-events-none)
 * sıralı başarım kazanma animasyonu.
 */
export const AchievementToast: React.FC<AchievementToastProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div
      key={toast.id}
      className="pointer-events-none select-none absolute top-3 inset-x-3 z-50 flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div
        className={`ach-toast-enter relative w-full max-w-[380px] overflow-hidden rounded-2xl border-2 bg-gradient-to-r from-[#171124]/96 via-[#231832]/96 to-[#140e1f]/96 px-3 py-2.5 text-white ${TIER_BORDER[toast.tier]}`}
      >
        {/* Altın parıltı süpürme efekti */}
        <div
          aria-hidden="true"
          className="ach-toast-shimmer pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-yellow-200/25 to-transparent skew-x-[-20deg]"
        />

        {/* Dekoratif yıldız parıltıları */}
        <Sparkles
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 right-2 w-4 h-4 text-yellow-300/85 animate-pulse"
        />

        <div className="relative z-10 flex items-center gap-3">
          {/* Animasyonlu 512x512 Başarım İkonu */}
          <div className="ach-icon-pop relative w-12 h-12 rounded-xl overflow-hidden border-2 border-amber-300/90 bg-[#0d0a15] shrink-0 shadow-[0_0_16px_rgba(250,204,21,0.45)]">
            <img
              src={toast.iconPath}
              alt={toast.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              <span className="text-[10px] font-black tracking-[0.14em] uppercase text-yellow-300">
                Başarım Kazanıldı · +{toast.points} XP
              </span>
            </div>

            <div className="mt-0.5 font-crest text-sm font-black text-white truncate">
              {toast.name}
            </div>
            <div className="text-[11px] font-semibold text-amber-100/85 line-clamp-1">
              {toast.description}
            </div>

            <div className="mt-1 flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider">
              {toast.syncedToPlayGames ? (
                <>
                  <Cloud className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">{toast.statusLabel}</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3 h-3 text-amber-300 shrink-0" />
                  <span className="text-amber-200/90 truncate">{toast.statusLabel}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
