import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clapperboard,
  Coins,
  GraduationCap,
  Play,
  Shield,
  ShieldCheck,
  Skull,
  Store,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { AchievementManagerSnapshot } from '../game/achievementManager';
import { AD_FREQUENCY_CONFIG, adFreeManager, AdManagerSnapshot } from '../game/ads';
import { getLevelConfig, TOTAL_LEVELS } from '../game/levels';
import { getWeaponSpec } from '../game/shop';
import { SaveData } from '../game/types';
import { getWorldForLevel } from '../game/worlds';
import { AchievementsModal } from './AchievementsModal';
import { ChaptersModal } from './ChaptersModal';

interface TitleScreenProps {
  saveData: SaveData;
  selectedLevel: number;
  achievementSnapshot: AchievementManagerSnapshot;
  nativeAchievementsFeedback: string | null;
  adSnapshot: AdManagerSnapshot;
  adFeedback: string | null;
  onSelectLevel: (levelId: number) => void;
  onStartGame: (levelId: number) => void;
  onStartTutorial: () => void;
  onOpenShop: () => void;
  onToggleSound: () => void;
  onPlayGamesSignIn: () => void;
  onPlayGamesRefresh: () => void;
  onOpenGooglePlayUi: () => void;
  onWatchDailyBonusRewarded: () => void;
  onOpenPrivacyOptions: () => void;
}

const HERO_ART_SRC = '/src/assets/images/black_knight_hero_1795496426660.jpg';

export const TitleScreen: React.FC<TitleScreenProps> = ({
  saveData,
  achievementSnapshot,
  nativeAchievementsFeedback,
  adSnapshot,
  adFeedback,
  onSelectLevel,
  onStartGame,
  onStartTutorial,
  onOpenShop,
  onToggleSound,
  onPlayGamesSignIn,
  onPlayGamesRefresh,
  onOpenGooglePlayUi,
  onWatchDailyBonusRewarded,
  onOpenPrivacyOptions,
}) => {
  const [modal, setModal] = useState<'none' | 'levels' | 'instructions' | 'achievements'>('none');
  const [heroImgError, setHeroImgError] = useState(false);

  const activeLevelCfg = getLevelConfig(saveData.unlockedLevel);
  const activeWorld = getWorldForLevel(activeLevelCfg.id);
  const equippedWeapon = getWeaponSpec(saveData.upgrades.equippedWeapon);
  const bannerPad = adSnapshot.bannerVisible && adSnapshot.bannerHeightPx > 0 ? adSnapshot.bannerHeightPx : 0;
  const allowRewardedUi = adFreeManager.shouldAllowRewarded();

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col justify-between p-4 pointer-events-none bg-gradient-to-b from-[#0b0e18]/92 via-[#0e1320]/75 to-[#090c14]/96"
      style={bannerPad > 0 ? { paddingBottom: `${bannerPad + 16}px` } : undefined}
    >
      {/* Üst Yardımcı Çubuk (Dikey Mobil Uyumlu) */}
      <div className="relative z-10 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 bg-[#161122]/90 border-2 border-amber-400/60 rounded-xl px-3 py-1.5 shadow-md">
          <Coins className="w-4 h-4 text-yellow-300 shrink-0" />
          <span className="font-medieval text-lg text-yellow-300 leading-none tabular-nums">
            {saveData.walletGold.toLocaleString('tr-TR')}
          </span>
          <span className="text-[11px] font-bold text-amber-200/80">Altın</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setModal('instructions')}
            className="arcade-btn-dark flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Nasıl Oynanır</span>
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={saveData.soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
            className="arcade-btn-dark flex items-center justify-center w-9 h-9 rounded-xl cursor-pointer shrink-0"
          >
            {saveData.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Dikey Merkez: Başlık + Profesyonel Çizim Kara Şövalye Portresi */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto gap-3">
        <svg
          viewBox="0 0 540 135"
          className="w-[min(360px,86vw)] h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.85)]"
          role="img"
          aria-label="Kara Şövalye: Orta Çağ Altın Avı"
        >
          <defs>
            <linearGradient id="goldTitleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff7ad" />
              <stop offset="48%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#c26a0a" />
            </linearGradient>
            <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="50%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          <text
            x="270"
            y="34"
            textAnchor="middle"
            fill="url(#goldTitleGrad)"
            stroke="#140e12"
            strokeWidth="7"
            paintOrder="stroke"
            fontFamily="'Pirata One', Georgia, serif"
            fontSize="30"
            letterSpacing="2"
          >
            THE
          </text>
          <text
            x="270"
            y="88"
            textAnchor="middle"
            fill="url(#goldTitleGrad)"
            stroke="#140e12"
            strokeWidth="11"
            paintOrder="stroke"
            fontFamily="'Pirata One', Georgia, serif"
            fontSize="70"
            letterSpacing="2"
          >
            BLACK KNIGHT
          </text>
          <path
            d="M92 100 L448 100 L436 130 L104 130 Z"
            fill="url(#ribbonGrad)"
            stroke="#140e12"
            strokeWidth="4"
          />
          <text
            x="270"
            y="121"
            textAnchor="middle"
            fill="#fef08a"
            fontFamily="'Cinzel', Georgia, serif"
            fontWeight="900"
            fontSize="18"
            letterSpacing="2.2"
          >
            ORTA ÇAĞ ALTIN AVI
          </text>
        </svg>

        {/* Profesyonel El Çizimi Kara Şövalye Vitrini */}
        <div className="relative w-full max-w-[270px] aspect-[4/4.3] rounded-2xl overflow-hidden border-[3px] border-amber-400/80 shadow-[0_14px_32px_rgba(0,0,0,0.75)] bg-[#191424]">
          {!heroImgError ? (
            <img
              src={HERO_ART_SRC}
              alt="Kara Şövalye"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2b203a] to-[#120d1a] p-4">
              <Shield className="w-16 h-16 text-amber-400" />
              <span className="mt-2 font-medieval text-2xl text-amber-300">Kara Şövalye</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/60 to-transparent px-3 pt-6 pb-2.5 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-amber-200">
              <span>Silah: {equippedWeapon.name}</span>
              <span className="flex items-center gap-1 tabular-nums text-yellow-300">
                <Trophy className="w-3.5 h-3.5" />
                {saveData.unlockedLevel}/{TOTAL_LEVELS}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alt Dikey Aksiyon Butonları (Oyna · Ayrı Mağaza · Bölüm Seç) */}
      <div className="relative z-10 flex flex-col gap-2.5 pointer-events-auto">
        <div className="text-center text-xs font-bold text-amber-100/90 tabular-nums">
          <span className="text-sky-300">
            Dünya {activeWorld.id} · {activeWorld.name}
          </span>
          <br />
          {activeLevelCfg.isBossLevel && activeLevelCfg.boss ? (
            <span className="text-rose-300 font-black">
              Bölüm {activeLevelCfg.id}: BOSS — {activeLevelCfg.boss.name}
            </span>
          ) : (
            <span>
              Bölüm {activeLevelCfg.id}: {activeLevelCfg.name} · Hedef:{' '}
              {activeLevelCfg.scoreTarget.toLocaleString('tr-TR')} Skor
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onStartGame(activeLevelCfg.id)}
          className="arcade-btn-gold w-full py-3.5 rounded-2xl text-lg font-black tracking-wide flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
        >
          {activeLevelCfg.isBossLevel ? (
            <Skull className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 fill-current" />
          )}
          <span>
            {activeLevelCfg.isBossLevel
              ? `Bölüm ${activeLevelCfg.id} Boss Savaşı`
              : `Bölüm ${activeLevelCfg.id} Oyna`}
          </span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onOpenShop}
            className="arcade-btn-dark py-2.5 px-2 rounded-2xl text-xs font-black text-amber-300 border-amber-400/70 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Store className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>Mağaza</span>
          </button>

          <button
            type="button"
            onClick={() => setModal('levels')}
            className="arcade-btn-dark py-2.5 px-2 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Bölümler</span>
          </button>

          <button
            type="button"
            onClick={() => setModal('achievements')}
            className="arcade-btn-dark py-2.5 px-2 rounded-2xl text-xs font-black text-emerald-200 border-emerald-400/55 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Trophy className="w-4 h-4 text-yellow-300 shrink-0" />
            <span>Başarımlar</span>
          </button>
        </div>

        <p className="text-center text-[11px] font-semibold text-slate-300">
          10 Dünya · 60 Bölüm · Cadılara ve Masumlara Vurma!
        </p>
      </div>

      {/* PREMIUM DARK FANTASY 60 BÖLÜM İLERLEMESİ PENCERESİ */}
      {modal === 'levels' && (
        <ChaptersModal
          saveData={saveData}
          onClose={() => setModal('none')}
          onPlayLevel={(levelId) => {
            onSelectLevel(levelId);
            setModal('none');
            onStartGame(levelId);
          }}
        />
      )}

      {/* GOOGLE PLAY GAMES V2 BAŞARIMLAR EKRANI */}
      {modal === 'achievements' && (
        <AchievementsModal
          snapshot={achievementSnapshot}
          nativeUiFeedback={nativeAchievementsFeedback}
          onClose={() => setModal('none')}
          onSignIn={onPlayGamesSignIn}
          onRefreshSync={onPlayGamesRefresh}
          onOpenGooglePlayUi={onOpenGooglePlayUi}
        />
      )}

      {/* NASIL OYNANIR PENCERESİ */}
      {modal === 'instructions' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-3 pointer-events-auto">
          <div className="arcade-panel w-full max-h-[88%] flex flex-col rounded-2xl p-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/30">
              <h2 className="font-medieval text-2xl text-amber-300 tracking-wide">
                Nasıl Oynanır?
              </h2>
              <button
                type="button"
                onClick={() => setModal('none')}
                className="arcade-btn-dark w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer"
                aria-label="Talimatları kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs text-slate-200 overflow-y-auto pr-1 leading-relaxed">
              {/* Özel Altın Tasarımlı EĞİTİM MODU Seçeneği */}
              <div className="relative overflow-hidden rounded-xl border border-amber-400/70 bg-gradient-to-br from-[#2b2011] via-[#1b1523] to-[#110e18] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.55)]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-amber-300 to-amber-600 flex items-center justify-center text-[#1a1106] shadow-md shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-crest text-xs font-black tracking-[0.14em] text-amber-300 uppercase">
                        EĞİTİM MODU
                      </div>
                      <div className="text-[11px] text-amber-100/80">
                        {saveData.tutorialCompleted
                          ? 'Eğitim tamamlandı · İstediğin zaman tekrar oyna'
                          : '8 aşamalı etkileşimli eğitimle oynayarak öğren'}
                      </div>
                    </div>
                  </div>
                  {saveData.tutorialCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModal('none');
                    onStartTutorial();
                  }}
                  className="df-cta-gold w-full py-2.5 px-4 rounded-xl font-crest text-sm font-black tracking-[0.14em] uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>EĞİTİM MODU</span>
                </button>
              </div>

              <div className="space-y-2.5">
                <p>
                  <strong className="text-amber-300">Normal Bölümler (Tek Parmak):</strong> Şövalye
                  sabit konumda ilerler. <strong>Ekrana basılı tutarak</strong> (veya Space tuşuyla)
                  güç topla, hedef yaklaşınca <strong>bırak</strong> ve parçala!
                </p>
                <p>
                  <strong className="text-rose-300">Özel Boss Bölümleri (10, 20, 30, 40, 50, 60):</strong>{' '}
                  Her 10 bölümde bir özel Boss arenası açılır! Soldaki{' '}
                  <strong>sanal joystick</strong> (veya A/D tuşları) ile saldırılardan kaç, sağdaki
                  büyük <strong>SALDIR</strong> butonuyla Boss’un canını sıfırla!
                </p>
                <p>
                  <strong className="text-red-300">Sakın Vurma (Anında Bölüm Biter!):</strong> Yola
                  çıkan <strong>Prenses, Kral, Rahip ve Çocuk</strong> karakterlerine kesinlikle
                  vurma! Altın Tüccarı, Tavuk ve Gezgin ise ödül verir.
                </p>
                <p>
                  <strong className="text-fuchsia-300">Cadılara Dikkat:</strong> Cadıya vurursan{' '}
                  <strong>3 saniye pembe domuza</strong> dönüşürsün.
                </p>
                <p>
                  <strong className="text-sky-300">Etkileşimli Nesneler:</strong> TNT sandıkları
                  zincirleme patlar, buz blokları düşmanları dondurur, altın heykeller 3 vuruşta
                  dev ganimet döker!
                </p>
                <p>
                  <strong className="text-emerald-300">Skor ve Altın Ayrıdır:</strong> Bölüm Skoru
                  bölümü geçmek içindir. Bölümde topladığın altınlar{' '}
                  <strong>geçici bakiyede</strong> birikir ve bölümü{' '}
                  <strong>başarıyla tamamladığında</strong> bölüm bonusu ile birlikte kalıcı{' '}
                  <strong>Altın Kesene</strong> aktarılır; başarısız olursan geçici altınlar
                  kaybedilir.
                </p>
              </div>
              {/* İsteğe Bağlı Günlük Bonus (Ödüllü Reklam) & Google UMP Gizlilik Tercihleri */}
              <div className="pt-2 border-t border-amber-500/20 space-y-2">
                {allowRewardedUi && (
                  <button
                    type="button"
                    disabled={
                      adSnapshot.isShowingFullScreenAd ||
                      adSnapshot.dailyBonusClaimedToday ||
                      adSnapshot.rewardedRemainingToday <= 0
                    }
                    onClick={onWatchDailyBonusRewarded}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/65 hover:bg-emerald-950/90 border border-emerald-400/50 text-emerald-100 text-xs font-bold flex items-center justify-between gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2">
                      <Clapperboard className="w-4 h-4 text-emerald-300 shrink-0" />
                      <span>
                        {adSnapshot.dailyBonusClaimedToday
                          ? 'Günlük Bonus Alındı'
                          : `Günlük Bonus · +${AD_FREQUENCY_CONFIG.rewardedGold.daily_bonus} Altın (Reklam İzle)`}
                      </span>
                    </span>
                    <span className="text-[10px] font-black text-emerald-300 shrink-0">
                      {adSnapshot.dailyBonusClaimedToday ? 'TAMAM' : 'İSTEĞE BAĞLI'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenPrivacyOptions}
                  className="df-btn-iron w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>Gizlilik ve Reklam Tercihleri (Google UMP)</span>
                </button>

                {adFeedback && (
                  <p className="text-[11px] font-semibold text-amber-200/90 bg-black/45 border border-amber-500/25 rounded-lg px-2.5 py-1.5 leading-snug">
                    {adFeedback}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setModal('none')}
                className="df-btn-iron w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
