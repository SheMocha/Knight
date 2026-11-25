import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AchievementToast } from './components/AchievementToast';
import { ChapterTransition } from './components/ChapterTransition';
import { GameHud } from './components/GameHud';
import { GameModals } from './components/GameModals';
import { TitleScreen } from './components/TitleScreen';
import { TutorialOverlay } from './components/TutorialOverlay';
import { UpgradeShop } from './components/UpgradeShop';
import {
  achievementManager,
  AchievementManagerSnapshot,
  AchievementToastPayload,
} from './game/achievementManager';
import { adManager, AdManagerSnapshot, RewardedPlacement } from './game/ads';
import { audioEngine } from './game/audio';
import { BlackKnightEngine } from './game/engine';
import {
  getCharmCost,
  getCharmLevel,
  getWeaponSpec,
  SHOP_CHARMS,
} from './game/shop';
import {
  loadSaveData,
  markTutorialCompleted,
  persistSaveData,
  recordLevelResult,
  shouldAutoStartTutorial,
} from './game/storage';
import {
  CharmId,
  FloatingPopup,
  GameScreen,
  HudSnapshot,
  LevelResult,
  PlayerUpgrades,
  SaveData,
  ShopOrigin,
  TutorialSnapshot,
  WeaponId,
} from './game/types';
import { TOTAL_LEVELS } from './game/worlds';

const INITIAL_HUD: HudSnapshot = {
  levelId: 1,
  worldId: 1,
  worldName: 'Orta Çağ Köyü',
  levelName: 'Köy Kapısı',
  isBossLevel: false,
  boss: null,
  activeEventBanner: null,
  equippedWeapon: 'club',
  weaponName: 'Meşe Sopa',
  levelGold: 0,
  walletGold: 0,
  goldBags: 0,
  levelScore: 0,
  scoreTarget: 3000,
  maxScore: 3600,
  scoreCapped: false,
  timeLeft: 46,
  timeLimit: 46,
  charge: 0,
  isCharging: false,
  getMedievalFlash: 0,
  dizzyTimeLeft: 0,
  dizzyDuration: 1.5,
  pigTimeLeft: 0,
  pigDuration: 3,
  combo: 0,
  comboTimeLeft: 0,
  comboDuration: 2.2,
  doubleScoreTimeLeft: 0,
  doubleScoreDuration: 7.0,
  powerSurgeTimeLeft: 0,
  powerSurgeDuration: 6.5,
  activeBonusBanner: null,
  screenEffects: [],
  quotaMet: false,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<BlackKnightEngine | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastPointerXRef = useRef<number>(0);
  const pressedMoveKeysRef = useRef<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });

  const [saveData, setSaveData] = useState<SaveData>(() => {
    const loaded = loadSaveData();
    audioEngine.setEnabled(loaded.soundEnabled);
    return loaded;
  });
  const saveDataRef = useRef(saveData);
  saveDataRef.current = saveData;

  const [screen, setScreen] = useState<GameScreen>(() =>
    shouldAutoStartTutorial(saveData) ? 'TUTORIAL' : 'TITLE',
  );
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const [shopOrigin, setShopOrigin] = useState<ShopOrigin>('TITLE');
  const [selectedLevel, setSelectedLevel] = useState<number>(() => saveData.unlockedLevel);
  const [currentLevelId, setCurrentLevelId] = useState<number>(() => saveData.unlockedLevel);

  const [hud, setHud] = useState<HudSnapshot>(() => ({
    ...INITIAL_HUD,
    equippedWeapon: saveData.upgrades.equippedWeapon,
    weaponName: getWeaponSpec(saveData.upgrades.equippedWeapon).name,
    walletGold: saveData.walletGold,
  }));
  const isBossLevelRef = useRef(false);
  isBossLevelRef.current = hud.isBossLevel;
  const [tutorialState, setTutorialState] = useState<TutorialSnapshot | null>(null);
  const tutorialStateRef = useRef<TutorialSnapshot | null>(null);
  tutorialStateRef.current = tutorialState;
  const [popups, setPopups] = useState<FloatingPopup[]>([]);
  const [result, setResult] = useState<LevelResult | null>(null);
  const [transitionLevelId, setTransitionLevelId] = useState<number | null>(null);
  const [achievementSnapshot, setAchievementSnapshot] = useState<AchievementManagerSnapshot>(() =>
    achievementManager.getSnapshot(),
  );
  const [toastQueue, setToastQueue] = useState<AchievementToastPayload[]>([]);
  const [activeToast, setActiveToast] = useState<AchievementToastPayload | null>(null);
  const [nativeAchievementsFeedback, setNativeAchievementsFeedback] = useState<string | null>(null);
  const [adSnapshot, setAdSnapshot] = useState<AdManagerSnapshot>(() => adManager.getSnapshot());
  const [adFeedback, setAdFeedback] = useState<string | null>(null);
  const [levelClearRewardClaimed, setLevelClearRewardClaimed] = useState(false);

  // Google Play Games Services v2 otomatik başlangıç doğrulaması ve başarım abonelikleri
  useEffect(() => {
    const unsubSnap = achievementManager.subscribe((snap) => {
      setAchievementSnapshot(snap);
    });
    const unsubToast = achievementManager.onToast((toast) => {
      setToastQueue((prev) => [...prev, toast]);
    });
    void achievementManager.initialize(saveDataRef.current.completedLevels.length);
    return () => {
      unsubSnap();
      unsubToast();
    };
  }, []);

  // Google AdMob & UMP tek seferlik başlangıç ve abonelik (her bölümde yeniden başlatılmaz)
  useEffect(() => {
    const unsubAds = adManager.subscribe((snap) => {
      setAdSnapshot(snap);
    });
    adManager.setAudioDuckCallback((isAdOpen) => {
      audioEngine.setAdAudioDuck(isAdOpen);
    });
    void adManager.initialize(screenRef.current);
    return () => {
      unsubAds();
      adManager.setAudioDuckCallback(null);
    };
  }, []);

  // Banner görünürlüğü yalnızca uygun oyun dışı ekranlarda (TITLE, SHOP) aktiftir
  useEffect(() => {
    setAdFeedback(null);
    void adManager.syncBannerForScreen(screen);
  }, [screen]);

  // Birden fazla başarım aynı anda kazanılırsa sırayla (2.9 sn aralıkla) göster
  useEffect(() => {
    if (activeToast || toastQueue.length === 0) return;
    const [nextToast, ...rest] = toastQueue;
    setActiveToast(nextToast);
    setToastQueue(rest);
    audioEngine.playAchievementUnlock();
    const timer = window.setTimeout(() => {
      setActiveToast(null);
    }, 2900);
    return () => window.clearTimeout(timer);
  }, [activeToast, toastQueue]);

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new BlackKnightEngine(mount, {
      onHudUpdate: (snapshot) => {
        setHud(snapshot);
      },
      onPopup: (popup) => {
        setPopups((prev) => [...prev.slice(-7), popup]);
        window.setTimeout(() => {
          setPopups((prev) => prev.filter((item) => item.id !== popup.id));
        }, 850);
      },
      onLevelEnd: (rawResult) => {
        activePointerIdRef.current = null;
        const { next, isNewBest, newlyUnlockedLevel } = recordLevelResult(
          saveDataRef.current,
          rawResult.levelId,
          rawResult.levelScore,
          rawResult.levelGold,
          rawResult.walletGold,
          rawResult.won,
        );
        setSaveData(next);
        setResult({
          ...rawResult,
          walletGold: next.walletGold,
          isNewBest,
          newlyUnlockedLevel,
        });

        if (rawResult.won) {
          setLevelClearRewardClaimed(false);
          adManager.recordLevelCompleted(rawResult.levelId);
          achievementManager.recordEvent({
            type: 'level_completed',
            runId: rawResult.runId || `${rawResult.levelId}_${Date.now()}`,
            levelId: rawResult.levelId,
            completedLevelsCount: next.completedLevels.length,
            levelScore: rawResult.levelScore,
            swings: rawResult.swings ?? 0,
            hits: rawResult.hits ?? 0,
            mistakes: rawResult.mistakes ?? 0,
            sawPrincess: Boolean(rawResult.sawPrincess),
            sawKing: Boolean(rawResult.sawKing),
            isFinalLevel: rawResult.isFinalLevel,
            bossId: rawResult.bossId,
          });
          if (rawResult.isFinalLevel) {
            setSelectedLevel(next.unlockedLevel);
            setScreen('VICTORY');
          } else {
            setSelectedLevel(next.unlockedLevel);
            setScreen('LEVEL_CLEAR');
          }
        } else {
          setScreen('GAME_OVER');
        }
      },
      onTutorialUpdate: (snapshot) => {
        setTutorialState(snapshot);
      },
      onTutorialComplete: () => {
        setSaveData((prev) => markTutorialCompleted(prev));
      },
      onAchievementEvent: (event) => {
        achievementManager.recordEvent(event);
      },
    });

    engine.syncUpgradesAndWallet(saveDataRef.current.upgrades, saveDataRef.current.walletGold);
    engineRef.current = engine;

    // Oyuna ilk kez giren kullanıcıyı doğrudan Etkileşimli Eğitim Modu ile başlat
    if (shouldAutoStartTutorial(saveDataRef.current)) {
      engine.startTutorial(saveDataRef.current.upgrades);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Masaüstü klavye kontrolleri: A/D veya ←/→ hareket (Boss bölümleri & Eğitim Aşama 4), Space/Enter saldırı, Esc duraklatma
  useEffect(() => {
    const syncKeyboardMove = () => {
      const { left, right } = pressedMoveKeysRef.current;
      const dir: -1 | 0 | 1 = left && !right ? -1 : right && !left ? 1 : 0;
      if (screenRef.current === 'PLAYING' && isBossLevelRef.current) {
        engineRef.current?.setBossMoveInput(dir);
      } else {
        engineRef.current?.setMoveInput(dir);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (screenRef.current === 'PLAYING') {
          e.preventDefault();
          pressedMoveKeysRef.current = { left: false, right: false };
          engineRef.current?.setBossMoveInput(0);
          engineRef.current?.cancelCharge();
          engineRef.current?.setScreen('PAUSED');
          setScreen('PAUSED');
        } else if (screenRef.current === 'PAUSED') {
          e.preventDefault();
          engineRef.current?.setScreen('PLAYING');
          setScreen('PLAYING');
        } else if (screenRef.current === 'TUTORIAL' && e.code === 'Escape') {
          e.preventDefault();
          pressedMoveKeysRef.current = { left: false, right: false };
          setTutorialState(null);
          setPopups([]);
          setScreen('TITLE');
          engineRef.current?.exitTutorial(
            saveDataRef.current.upgrades,
            saveDataRef.current.walletGold,
          );
        }
        return;
      }

      const activePlayOrTutorial =
        screenRef.current === 'PLAYING' || screenRef.current === 'TUTORIAL';
      if (!activePlayOrTutorial) return;

      // Yatay hareket yalnızca Boss bölümlerinde (10,20,30,40,50,60) ve Eğitim Aşama 6'da aktiftir
      const canMoveHorizontally =
        (screenRef.current === 'PLAYING' && isBossLevelRef.current) ||
        (screenRef.current === 'TUTORIAL' && tutorialStateRef.current?.stage === 6);

      if (canMoveHorizontally && (e.code === 'ArrowLeft' || e.code === 'KeyA')) {
        e.preventDefault();
        pressedMoveKeysRef.current.left = true;
        syncKeyboardMove();
        return;
      }
      if (canMoveHorizontally && (e.code === 'ArrowRight' || e.code === 'KeyD')) {
        e.preventDefault();
        pressedMoveKeysRef.current.right = true;
        syncKeyboardMove();
        return;
      }

      // Boss bölümlerinde W veya Yukarı Ok ile zıplama
      if (
        screenRef.current === 'PLAYING' &&
        isBossLevelRef.current &&
        (e.code === 'ArrowUp' || e.code === 'KeyW')
      ) {
        e.preventDefault();
        if (!e.repeat) {
          audioEngine.unlock();
          engineRef.current?.triggerBossJump();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!e.repeat) {
          audioEngine.unlock();
          engineRef.current?.startCharge();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        pressedMoveKeysRef.current.left = false;
        syncKeyboardMove();
        return;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        pressedMoveKeysRef.current.right = false;
        syncKeyboardMove();
        return;
      }

      if (
        (screenRef.current === 'PLAYING' || screenRef.current === 'TUTORIAL') &&
        (e.code === 'Space' || e.code === 'Enter')
      ) {
        e.preventDefault();
        engineRef.current?.releaseSmash();
      }
    };

    const onBlur = () => {
      activePointerIdRef.current = null;
      pressedMoveKeysRef.current = { left: false, right: false };
      engineRef.current?.setMoveInput(0);
      engineRef.current?.setBossMoveInput(0);
      engineRef.current?.cancelCharge();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const handleToggleSound = useCallback(() => {
    audioEngine.unlock();
    setSaveData((prev) => {
      const nextEnabled = !prev.soundEnabled;
      audioEngine.setEnabled(nextEnabled);
      if (nextEnabled) {
        audioEngine.playUiClick();
        if (screenRef.current === 'PLAYING' || screenRef.current === 'TUTORIAL') {
          audioEngine.startMusic();
        }
      }
      const next: SaveData = { ...prev, soundEnabled: nextEnabled };
      persistSaveData(next);
      return next;
    });
  }, []);

  // Her yeni bölüm başlangıcında bölüm skoru ve kotası 0'dan başlar;
  // kalıcı mağaza ekipmanı ve altın kesesi korunur.
  const launchLevel = useCallback((levelId: number) => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    const current = saveDataRef.current;
    setSelectedLevel(levelId);
    setCurrentLevelId(levelId);
    setResult(null);
    setPopups([]);
    setScreen('PLAYING');
    engineRef.current?.startLevelRun(levelId, current.upgrades, current.walletGold);
  }, []);

  // Yeni bölüme geçerken atmosferik bölüm geçiş animasyonu oynatır (süre geçiş bitince başlar)
  const launchLevelWithTransition = useCallback((levelId: number) => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    setSelectedLevel(levelId);
    setCurrentLevelId(levelId);
    setResult(null);
    setPopups([]);
    setTransitionLevelId(levelId);
  }, []);

  const handlePause = useCallback(() => {
    audioEngine.playUiClick();
    activePointerIdRef.current = null;
    engineRef.current?.cancelCharge();
    engineRef.current?.setScreen('PAUSED');
    setScreen('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    engineRef.current?.setScreen('PLAYING');
    setScreen('PLAYING');
  }, []);

  const handleRetryLevel = useCallback(() => {
    launchLevel(currentLevelId);
  }, [currentLevelId, launchLevel]);

  const handleNextLevel = useCallback(() => {
    const nextId = Math.min(TOTAL_LEVELS, currentLevelId + 1);
    void adManager.maybeShowInterstitialBeforeNextLevel().finally(() => {
      launchLevelWithTransition(nextId);
    });
  }, [currentLevelId, launchLevelWithTransition]);

  const handleRestartFullRun = useCallback(() => {
    launchLevelWithTransition(1);
  }, [launchLevelWithTransition]);

  const handleMainMenu = useCallback(() => {
    audioEngine.playUiClick();
    activePointerIdRef.current = null;
    pressedMoveKeysRef.current = { left: false, right: false };
    setTransitionLevelId(null);
    setTutorialState(null);
    setResult(null);
    setPopups([]);
    setSelectedLevel(saveDataRef.current.unlockedLevel);
    setScreen('TITLE');
    engineRef.current?.returnToTitle(saveDataRef.current.upgrades, saveDataRef.current.walletGold);
  }, []);

  const handleStartTutorial = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    activePointerIdRef.current = null;
    pressedMoveKeysRef.current = { left: false, right: false };
    setTransitionLevelId(null);
    setResult(null);
    setPopups([]);
    setScreen('TUTORIAL');
    engineRef.current?.startTutorial(saveDataRef.current.upgrades);
  }, []);

  const handleExitTutorial = useCallback(() => {
    audioEngine.playUiClick();
    activePointerIdRef.current = null;
    pressedMoveKeysRef.current = { left: false, right: false };
    setTutorialState(null);
    setPopups([]);
    setSelectedLevel(saveDataRef.current.unlockedLevel);
    setScreen('TITLE');
    engineRef.current?.exitTutorial(saveDataRef.current.upgrades, saveDataRef.current.walletGold);
  }, []);

  const handleTutorialStartAdventure = useCallback(() => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    activePointerIdRef.current = null;
    pressedMoveKeysRef.current = { left: false, right: false };
    setTutorialState(null);
    setPopups([]);
    launchLevelWithTransition(saveDataRef.current.unlockedLevel);
  }, [launchLevelWithTransition]);

  // Ayrı Mağaza ekranını herhangi bir yerden aç (Ana Menü, Bölüm Sonu, Oyun Bitti)
  const openShopFrom = useCallback((origin: ShopOrigin) => {
    audioEngine.unlock();
    audioEngine.playUiClick();
    setShopOrigin(origin);
    engineRef.current?.setScreen('SHOP');
    setScreen('SHOP');
  }, []);

  const handleShopBack = useCallback(() => {
    audioEngine.playUiClick();
    if (shopOrigin === 'LEVEL_CLEAR' && result) {
      setScreen('LEVEL_CLEAR');
    } else if (shopOrigin === 'GAME_OVER' && result) {
      setScreen('GAME_OVER');
    } else {
      setScreen('TITLE');
      engineRef.current?.returnToTitle(
        saveDataRef.current.upgrades,
        saveDataRef.current.walletGold,
      );
    }
  }, [shopOrigin, result]);

  const handleShopContinue = useCallback(() => {
    if (shopOrigin === 'LEVEL_CLEAR') {
      const nextId = Math.min(TOTAL_LEVELS, currentLevelId + 1);
      void adManager.maybeShowInterstitialBeforeNextLevel().finally(() => {
        launchLevelWithTransition(nextId);
      });
    } else if (shopOrigin === 'GAME_OVER') {
      launchLevel(currentLevelId);
    } else {
      launchLevelWithTransition(saveDataRef.current.unlockedLevel);
    }
  }, [shopOrigin, currentLevelId, launchLevel, launchLevelWithTransition]);

  // Mağaza satın alma ve kuşanma işlemleri (kalıcı olarak kaydedilir)
  const handleBuyWeapon = useCallback((weaponId: WeaponId) => {
    const spec = getWeaponSpec(weaponId);
    setSaveData((prev) => {
      if (prev.upgrades.ownedWeapons.includes(weaponId) || prev.walletGold < spec.cost) {
        return prev;
      }
      audioEngine.unlock();
      audioEngine.playShopBuy();
      const nextWallet = prev.walletGold - spec.cost;
      const nextUpgrades: PlayerUpgrades = {
        ...prev.upgrades,
        ownedWeapons: [...prev.upgrades.ownedWeapons, weaponId],
        equippedWeapon: weaponId,
      };
      const next: SaveData = { ...prev, walletGold: nextWallet, upgrades: nextUpgrades };
      persistSaveData(next);
      engineRef.current?.syncUpgradesAndWallet(nextUpgrades, nextWallet);
      return next;
    });
  }, []);

  const handleEquipWeapon = useCallback((weaponId: WeaponId) => {
    setSaveData((prev) => {
      if (!prev.upgrades.ownedWeapons.includes(weaponId)) return prev;
      audioEngine.playUiClick();
      const nextUpgrades: PlayerUpgrades = {
        ...prev.upgrades,
        equippedWeapon: weaponId,
      };
      const next: SaveData = { ...prev, upgrades: nextUpgrades };
      persistSaveData(next);
      engineRef.current?.syncUpgradesAndWallet(nextUpgrades, prev.walletGold);
      return next;
    });
  }, []);

  const handleBuyCharm = useCallback((charmId: CharmId) => {
    const charm = SHOP_CHARMS.find((c) => c.id === charmId);
    if (!charm) return;
    setSaveData((prev) => {
      const currentLvl = getCharmLevel(prev.upgrades, charmId);
      if (currentLvl >= charm.maxLevel) return prev;
      const cost = getCharmCost(charm, currentLvl);
      if (prev.walletGold < cost) return prev;

      audioEngine.unlock();
      audioEngine.playShopBuy();
      const nextWallet = prev.walletGold - cost;
      const nextUpgrades: PlayerUpgrades = {
        ...prev.upgrades,
        [charmId]: currentLvl + 1,
      };
      const next: SaveData = { ...prev, walletGold: nextWallet, upgrades: nextUpgrades };
      persistSaveData(next);
      engineRef.current?.syncUpgradesAndWallet(nextUpgrades, nextWallet);
      return next;
    });
  }, []);

  const handleFinishEarly = useCallback(() => {
    audioEngine.playUiClick();
    engineRef.current?.finishRoundEarlyIfQuotaMet();
  }, []);

  const handlePlayfieldPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (screen !== 'PLAYING' && screen !== 'TUTORIAL') return;
    // Boss bölümlerinde sol joystick ve sağ saldırı butonu özel dokunma kontrollerini yönetir
    if (screen === 'PLAYING' && isBossLevelRef.current) return;
    e.preventDefault();
    audioEngine.unlock();
    activePointerIdRef.current = e.pointerId;
    lastPointerXRef.current = e.clientX;
    e.currentTarget.setPointerCapture(e.pointerId);

    if (screen === 'TUTORIAL') {
      const stage = tutorialStateRef.current?.stage ?? 1;
      if (
        stage === 1 ||
        stage === 2 ||
        stage === 3 ||
        stage === 4 ||
        stage === 5 ||
        stage === 7
      ) {
        engineRef.current?.startCharge();
      }
      return;
    }

    engineRef.current?.startCharge();
  };

  const handlePlayfieldPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    if (screen !== 'TUTORIAL') return;
    if (tutorialStateRef.current?.stage === 6) {
      const dx = e.clientX - lastPointerXRef.current;
      lastPointerXRef.current = e.clientX;
      if (Math.abs(dx) > 0.5) {
        const containerW = Math.max(200, e.currentTarget.clientWidth || 380);
        engineRef.current?.nudgeMoveX((dx / containerW) * 10.6);
      }
    }
  };

  const handlePlayfieldPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    activePointerIdRef.current = null;
    engineRef.current?.releaseSmash();
  };

  const handlePlayfieldPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    activePointerIdRef.current = null;
    engineRef.current?.cancelCharge();
  };

  const handleBossMove = useCallback((vx: number) => {
    audioEngine.unlock();
    engineRef.current?.setBossMoveInput(vx);
  }, []);

  const handleBossJump = useCallback(() => {
    audioEngine.unlock();
    engineRef.current?.triggerBossJump();
  }, []);

  const handlePlayGamesSignIn = useCallback(() => {
    audioEngine.playUiClick();
    setNativeAchievementsFeedback(null);
    void achievementManager.signInToPlayGames();
  }, []);

  const handlePlayGamesRefresh = useCallback(() => {
    audioEngine.playUiClick();
    setNativeAchievementsFeedback(null);
    void achievementManager.refreshPlayGamesConnection(true);
  }, []);

  const handleOpenGooglePlayUi = useCallback(() => {
    audioEngine.playUiClick();
    setNativeAchievementsFeedback(null);
    void achievementManager.openNativeAchievementsUi().then((res) => {
      if (!res.ok && res.message) {
        setNativeAchievementsFeedback(res.message);
      }
    });
  }, []);

  const handleWatchRewardedAd = useCallback(
    (placement: RewardedPlacement, levelGoldEarned = 0) => {
      audioEngine.unlock();
      audioEngine.playUiClick();
      setAdFeedback(null);
      void adManager.showRewardedAd(placement, levelGoldEarned).then((outcome) => {
        setAdFeedback(outcome.message);
        if (outcome.rewarded && outcome.goldAmount > 0) {
          audioEngine.playGoldBag();
          setSaveData((prev) => {
            const nextWallet = prev.walletGold + outcome.goldAmount;
            const next: SaveData = { ...prev, walletGold: nextWallet };
            persistSaveData(next);
            engineRef.current?.syncUpgradesAndWallet(next.upgrades, nextWallet);
            return next;
          });
          if (placement === 'level_clear_bonus') {
            setLevelClearRewardClaimed(true);
            setResult((prev) =>
              prev ? { ...prev, walletGold: prev.walletGold + outcome.goldAmount } : prev,
            );
          }
          achievementManager.recordEvent({
            type: 'gold_earned',
            amount: outcome.goldAmount,
          });
        }
      });
    },
    [],
  );

  const handleOpenPrivacyOptions = useCallback(() => {
    audioEngine.playUiClick();
    setAdFeedback(null);
    void adManager.openPrivacyOptions().then((res) => {
      setAdFeedback(res.message);
    });
  }, []);

  const handleTutorialMoveInput = useCallback((dir: -1 | 0 | 1) => {
    audioEngine.unlock();
    engineRef.current?.setMoveInput(dir);
  }, []);

  const handleTutorialAttackStart = useCallback(() => {
    audioEngine.unlock();
    engineRef.current?.startCharge();
  }, []);

  const handleTutorialAttackRelease = useCallback(() => {
    engineRef.current?.releaseSmash();
  }, []);

  const isMushroomDizzy =
    screen === 'PLAYING' && hud.screenEffects.some((fx) => fx.kind === 'mushroom_dizzy');

  return (
    <div className="w-screen h-[100dvh] bg-[#080b12] flex items-center justify-center overflow-hidden touch-none select-none">
      {/* Dikey Mobil Oyun Sahnesi (Mobilde %100 tam ekran, geniş ekranda ortalanmış dikey mobil çerçeve) */}
      <main className="relative w-full max-w-[460px] h-full overflow-hidden bg-[#0e1522] sm:border-x-2 sm:border-amber-500/25 sm:shadow-[0_0_80px_rgba(0,0,0,0.9)]">
        {/* İzole Three.js WebGL Sahnesi (Mantar sersemliğinde 3 sn komik ekran sallantısı) */}
        <div
          ref={canvasMountRef}
          className={`absolute inset-0 w-full h-full ${isMushroomDizzy ? 'fx-dizzy-wobble' : ''}`}
        />

        {/* İnce karanlık fantastik atmosferik kenar gölgeleme (oyun kontrollerini asla engellemez) */}
        <div
          className="pointer-events-none absolute inset-0 z-[5]"
          style={{
            background:
              'radial-gradient(ellipse at 50% 44%, rgba(0,0,0,0) 56%, rgba(5,8,16,0.42) 100%)',
          }}
        />

        {/* Tek Dokunuşlu Şarj / Vuruş ve Eğitimde Yatay Sürükleme Alanı */}
        {(screen === 'PLAYING' || screen === 'TUTORIAL') && (
          <div
            onPointerDown={handlePlayfieldPointerDown}
            onPointerMove={handlePlayfieldPointerMove}
            onPointerUp={handlePlayfieldPointerUp}
            onPointerCancel={handlePlayfieldPointerCancel}
            className="absolute inset-0 z-10 touch-none cursor-pointer"
            aria-label="Güç toplamak için basılı tut, vurmak için bırak"
          />
        )}

        {/* Ana Menü (Dikey) */}
        {screen === 'TITLE' && (
          <TitleScreen
            saveData={saveData}
            selectedLevel={selectedLevel}
            achievementSnapshot={achievementSnapshot}
            nativeAchievementsFeedback={nativeAchievementsFeedback}
            adSnapshot={adSnapshot}
            adFeedback={adFeedback}
            onSelectLevel={setSelectedLevel}
            onStartGame={launchLevelWithTransition}
            onStartTutorial={handleStartTutorial}
            onOpenShop={() => openShopFrom('TITLE')}
            onToggleSound={handleToggleSound}
            onPlayGamesSignIn={handlePlayGamesSignIn}
            onPlayGamesRefresh={handlePlayGamesRefresh}
            onOpenGooglePlayUi={handleOpenGooglePlayUi}
            onWatchDailyBonusRewarded={() => handleWatchRewardedAd('daily_bonus')}
            onOpenPrivacyOptions={handleOpenPrivacyOptions}
          />
        )}

        {/* Etkileşimli Eğitim Modu Arayüzü */}
        {screen === 'TUTORIAL' && tutorialState && (
          <TutorialOverlay
            tutorial={tutorialState}
            popups={popups}
            soundEnabled={saveData.soundEnabled}
            onToggleSound={handleToggleSound}
            onExit={handleExitTutorial}
            onStartAdventure={handleTutorialStartAdventure}
            onMoveInput={handleTutorialMoveInput}
            onAttackStart={handleTutorialAttackStart}
            onAttackRelease={handleTutorialAttackRelease}
          />
        )}

        {/* Oyun İçi HUD (Dikey) */}
        {screen === 'PLAYING' && (
          <GameHud
            hud={hud}
            popups={popups}
            soundEnabled={saveData.soundEnabled}
            onPause={handlePause}
            onToggleSound={handleToggleSound}
            onFinishEarly={handleFinishEarly}
            onBossMove={handleBossMove}
            onBossJump={handleBossJump}
            onAttackStart={handleTutorialAttackStart}
            onAttackRelease={handleTutorialAttackRelease}
          />
        )}

        {/* Ayrı Mağaza Ekranı (Eski Silah Dükkanı) */}
        {screen === 'SHOP' && (
          <UpgradeShop
            origin={shopOrigin}
            currentLevelId={shopOrigin === 'TITLE' ? selectedLevel : currentLevelId}
            walletGold={saveData.walletGold}
            upgrades={saveData.upgrades}
            adSnapshot={adSnapshot}
            adFeedback={adFeedback}
            onBuyWeapon={handleBuyWeapon}
            onEquipWeapon={handleEquipWeapon}
            onBuyCharm={handleBuyCharm}
            onWatchShopRewarded={() => handleWatchRewardedAd('extra_gold_shop')}
            onBack={handleShopBack}
            onContinueAction={handleShopContinue}
          />
        )}

        {/* Duraklatma, Bölüm Tamamlandı, Zafer ve Kovuldun! Pencereleri */}
        <GameModals
          screen={screen}
          result={result}
          soundEnabled={saveData.soundEnabled}
          adSnapshot={adSnapshot}
          levelClearRewardClaimed={levelClearRewardClaimed}
          adFeedback={adFeedback}
          onResume={handleResume}
          onRetryLevel={handleRetryLevel}
          onNextLevel={handleNextLevel}
          onOpenShop={() =>
            openShopFrom(
              screen === 'LEVEL_CLEAR'
                ? 'LEVEL_CLEAR'
                : screen === 'GAME_OVER'
                  ? 'GAME_OVER'
                  : 'TITLE',
            )
          }
          onRestartRun={handleRestartFullRun}
          onMainMenu={handleMainMenu}
          onToggleSound={handleToggleSound}
          onWatchLevelClearRewarded={() =>
            handleWatchRewardedAd('level_clear_bonus', result?.levelGold ?? 0)
          }
        />

        {/* Yeni Bölüm Atmosferik Geçiş Perdesi */}
        {transitionLevelId !== null && (
          <ChapterTransition
            levelId={transitionLevelId}
            onStartGameplay={launchLevel}
            onFinished={() => setTransitionLevelId(null)}
          />
        )}

        {/* Sıralı Başarım Kazanma Bildirimi (Oynanışı asla engellemez) */}
        <AchievementToast toast={activeToast} />
      </main>
    </div>
  );
}
