'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LevelData, CellState, UserProfile } from '../lib/types';
import {
  selectLevel,
  selectDailyChallenge,
  preloadLevels,
  preloadLevel,
  getCachedLevel,
  getCachedDailyChallenge,
} from '../lib/levelSelector';
import { HintEngine } from '../lib/hintEngine';
import {
  playTap,
  playCross,
  playCatMeow,
  playWin,
  playFail,
  playGameLoad,
  startBGM,
} from '../lib/soundEffects';
import { triggerHaptic } from '../lib/haptics';
import { useI18n } from '../lib/i18n';
import { useGameSocket } from '../lib/useGameSocket';
import { showRewardedAd } from '../lib/monetag';
import { preloadAllGameAssets } from '../lib/assetPreloader';
import { Header } from '../components/Header';
import { GameBoard } from '../components/GameBoard';
import { ToolBar } from '../components/ToolBar';
import { HomeScreen } from '../components/HomeScreen';
import { LoadingScreen } from '../components/LoadingScreen';
import { SettingsModal } from '../components/SettingsModal';
import { TutorialModal } from '../components/TutorialModal';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { VictoryModal } from '../components/VictoryModal';
import { DefeatModal } from '../components/DefeatModal';
import { DailyStreakModal } from '../components/DailyStreakModal';
import { DailyChallengeVictoryModal } from '../components/DailyChallengeVictoryModal';
import { ProfileModal } from '../components/ProfileModal';
import { ShopModal, PurchaseResult } from '../components/ShopModal';
import { GameSelectionScreen } from '../components/GameSelectionScreen';
import { PawBalanceGameScreen } from '../components/pawbalance/PawBalanceGameScreen';
import { HexagonGameApp } from '../components/hexagon-sort/HexagonGameApp';

type ScreenType = 'loading' | 'hub' | 'home' | 'game' | 'not_in_telegram' | 'pawbalance_game' | 'hexagon_game';

export default function App() {
  const { t, initLanguageFromTelegram } = useI18n();

  // Navigation & Screen States
  const [screen, setScreen] = useState<ScreenType>('loading');
  const [preloadProgress, setPreloadProgress] = useState<number | undefined>(undefined);
  const [initData, setInitData] = useState<string>('');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Safe area clearance for Notch & Telegram UI buttons
  const [safeTop, setSafeTop] = useState<number>(84);
  const [safeBottom, setSafeBottom] = useState<number>(20);

  // Modals
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isDefeatOpen, setIsDefeatOpen] = useState<boolean>(false);
  const [isStreakOpen, setIsStreakOpen] = useState<boolean>(false);
  const [isDailyVictoryOpen, setIsDailyVictoryOpen] = useState<boolean>(false);
  const [isShopOpen, setIsShopOpen] = useState<boolean>(false);
  const [shopInitialTab, setShopInitialTab] = useState<'hints' | 'cosmetics'>('hints');

  // Daily Challenge State
  const [isDailyChallenge, setIsDailyChallenge] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [dailyDuration, setDailyDuration] = useState<number>(0);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState<boolean>(false);

  // Active Game State
  const [currentLevelNumber, setCurrentLevelNumber] = useState<number>(1);
  const [level, setLevel] = useState<LevelData | null>(null);
  const [board, setBoard] = useState<CellState[][]>([]);
  const [fishRemaining, setFishRemaining] = useState<number>(3);
  const [catHintsUsed, setCatHintsUsed] = useState<number>(0);
  const [crossHintsUsed, setCrossHintsUsed] = useState<number>(0);
  const [isWon, setIsWon] = useState<boolean>(false);
  const [fishAwarded, setFishAwarded] = useState<number>(0);

  const levelStartTimeRef = useRef<number>(Date.now());
  const sessionTokenRef = useRef<string | null>(null);

  const {
    connect: connectSocket,
    disconnect: disconnectSocket,
    sendCellAction,
    sendLoseFish,
    sendHintUsed,
  } = useGameSocket();

  const initGameSession = useCallback(async (lvlNum: number, isDaily: boolean = false) => {
    sessionTokenRef.current = null;
    disconnectSocket();
    if (!initData) return;

    try {
      const res = await fetch('/api/game/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          level_number: lvlNum,
          is_daily_challenge: isDaily,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session_token) {
          sessionTokenRef.current = data.session_token;
          if (user?.telegram_id) {
            connectSocket(data.session_token, user.telegram_id);
          }
        }
      }
    } catch (e) {
      console.warn('Could not initialize server game session:', e);
    }
  }, [initData, user?.telegram_id, connectSocket, disconnectSocket]);

  // Stopwatch timer for Daily Challenge
  useEffect(() => {
    if (!isDailyChallenge || screen !== 'game' || isWon) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isDailyChallenge, screen, isWon]);

  // 1. Safe Area Insets calculation for Notch & Telegram Overlay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;

    const updateInsets = () => {
      const cTop = tg?.contentSafeAreaInset?.top || 0;
      const sTop = tg?.safeAreaInset?.top || 0;
      const cBottom = tg?.contentSafeAreaInset?.bottom || 0;
      const sBottom = tg?.safeAreaInset?.bottom || 0;

      // Ensure content starts strictly BELOW the phone notch and Telegram's Close/Menu bar
      setSafeTop(Math.max(cTop, sTop, 84));
      setSafeBottom(Math.max(cBottom, sBottom, 20));
    };

    updateInsets();
    tg?.onEvent?.('viewportChanged', updateInsets);
    tg?.onEvent?.('safeAreaChanged', updateInsets);
    tg?.onEvent?.('contentSafeAreaChanged', updateInsets);

    return () => {
      tg?.offEvent?.('viewportChanged', updateInsets);
      tg?.offEvent?.('safeAreaChanged', updateInsets);
      tg?.offEvent?.('contentSafeAreaChanged', updateInsets);
    };
  }, []);

  // 2. Telegram Native BackButton integration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    // Tutorial is mandatory: never show BackButton during tutorial!
    if (isTutorialOpen) {
      tg.BackButton.hide();
      return;
    }

    const anyOtherModalOpen =
      isProfileOpen ||
      isShopOpen ||
      isSettingsOpen ||
      isLeaderboardOpen ||
      isVictoryOpen ||
      isDefeatOpen ||
      isStreakOpen ||
      isDailyVictoryOpen;

    if (anyOtherModalOpen) {
      tg.BackButton.show();
      const handleModalBack = () => {
        playTap();
        triggerHaptic('light');
        setIsProfileOpen(false);
        setIsShopOpen(false);
        setIsSettingsOpen(false);
        setIsLeaderboardOpen(false);
        setIsVictoryOpen(false);
        setIsDefeatOpen(false);
        setIsStreakOpen(false);
        setIsDailyVictoryOpen(false);
      };
      tg.BackButton.onClick(handleModalBack);
      return () => {
        tg.BackButton.offClick(handleModalBack);
      };
    } else if (screen === 'game') {
      // In game: BackButton returns to home
      tg.BackButton.show();
      const handleGameBack = () => {
        playTap();
        triggerHaptic('light');
        setIsDailyChallenge(false);
        setScreen('hub');
      };
      tg.BackButton.onClick(handleGameBack);
      return () => {
        tg.BackButton.offClick(handleGameBack);
      };
    } else {
      // In home: hide BackButton
      tg.BackButton.hide();
    }
  }, [
    screen,
    isProfileOpen,
    isShopOpen,
    isSettingsOpen,
    isTutorialOpen,
    isLeaderboardOpen,
    isVictoryOpen,
    isDefeatOpen,
    isStreakOpen,
    isDailyVictoryOpen,
  ]);

  // Lock background scroll when any modal is open
  const isAnyModalOpen =
    isProfileOpen ||
    isShopOpen ||
    isSettingsOpen ||
    isTutorialOpen ||
    isLeaderboardOpen ||
    isVictoryOpen ||
    isDefeatOpen ||
    isStreakOpen ||
    isDailyVictoryOpen;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalOverscroll = document.body.style.overscrollBehavior;
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.overscrollBehavior = originalOverscroll;
      };
    }
  }, [isAnyModalOpen]);

  // 3. Initialize Telegram Mini App & Authenticate via initData
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let attempts = 0;
    const maxAttempts = 60; // 60 * 50ms = 3000ms
    let isHandled = false;
    let timeoutId: NodeJS.Timeout;

    const checkTelegram = () => {
      attempts++;
      const tg = (window as any).Telegram?.WebApp;

      if (tg) {
        try {
          tg.ready?.();
          tg.expand?.();
          tg.requestFullscreen?.();
          tg.disableVerticalSwipes?.();
          tg.enableClosingConfirmation?.();
          tg.setHeaderColor?.('#FAF7F2');
          tg.setBackgroundColor?.('#FAF7F2');
        } catch (err) {
          console.warn('Error configuring Telegram WebApp view:', err);
        }

        const rawInitData = tg.initData || '';

        if (rawInitData) {
          isHandled = true;
          sessionStorage.removeItem('meowdoku_auto_refreshed');
          setInitData(rawInitData);

          // Auto-detect and initialize user language from Telegram initData
          initLanguageFromTelegram(rawInitData);

          // Call /api/user/auth with Telegram Bearer token
          fetch('/api/user/auth', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${rawInitData}`,
            },
          })
            .then(async res => {
              if (!res.ok) throw new Error('Authentication failed');
              return res.json();
            })
            .then(async data => {
              if (data.success && data.user) {
                setUser(data.user);
                const userLevel = data.user.current_level || 1;
                setCurrentLevelNumber(userLevel);

                if (data.user.is_new || !data.user.tutorial_completed) {
                  setIsTutorialOpen(true);
                }

                // Check if daily challenge completed today
                fetch('/api/user/daily-challenge', {
                  headers: { Authorization: `Bearer ${rawInitData}` },
                })
                  .then(r => r.json())
                  .then(dc => {
                    if (dc.success && dc.completed_today) {
                      setDailyChallengeCompleted(true);
                      if (dc.duration_seconds) {
                        setDailyDuration(dc.duration_seconds);
                      }
                    }
                  })
                  .catch(console.error);

                startBGM();

                // Preload all game assets (avatars, frames, audios, lotties, images) + levels
                try {
                  await Promise.all([
                    preloadAllGameAssets((pct) => setPreloadProgress(pct)),
                    preloadLevels(userLevel, 5),
                  ]);
                } catch (err) {
                  console.warn('Preloading error:', err);
                }

                setScreen('hub');
                startBGM();
              } else {
                setScreen('not_in_telegram');
              }
            })
            .catch(err => {
              console.error('Telegram auth error:', err);
              setScreen('not_in_telegram');
            });
          return;
        }
      }

      if (attempts >= 8 && !sessionStorage.getItem('meowdoku_auto_refreshed')) {
        sessionStorage.setItem('meowdoku_auto_refreshed', 'true');
        window.location.reload();
        return;
      }

      if (attempts >= maxAttempts) {
        if (!isHandled) {
          if (process.env.NODE_ENV === 'development') {
            setUser({
              id: 7,
              telegram_id: '7378059553',
              first_name: 'Player',
              current_level: 5,
              fish_balance: 15,
              cat_hints: 3,
              cross_hints: 5,
              daily_streak: 1,
              current_streak: 1,
              best_streak: 1,
              checked_in_today: true,
              week_days: [
                { dayLabel: 'WED', date: '2026-09-09', checked: true, isToday: true },
                { dayLabel: 'THU', date: '2026-09-10', checked: false, isToday: false },
                { dayLabel: 'FRI', date: '2026-09-11', checked: false, isToday: false },
                { dayLabel: 'SAT', date: '2026-09-12', checked: false, isToday: false },
                { dayLabel: 'SUN', date: '2026-09-13', checked: false, isToday: false },
                { dayLabel: 'MON', date: '2026-09-14', checked: false, isToday: false },
                { dayLabel: 'TUE', date: '2026-09-15', checked: false, isToday: false },
              ],
              tutorial_completed: true,
              avatar_id: 4,
              frame_id: 8,
              display_name: 'captain',
            });
            const fallbackLvl = 5;
            setCurrentLevelNumber(fallbackLvl);
            preloadLevels(fallbackLvl, 5).catch(console.warn);
            preloadAllGameAssets().catch(console.warn);
            setScreen('hub');
            return;
          }
          setScreen('not_in_telegram');
        }
      } else {
        timeoutId = setTimeout(checkTelegram, 50);
      }
    };

    timeoutId = setTimeout(checkTelegram, 50);
    return () => clearTimeout(timeoutId);
  }, []);

  // Refresh user data (e.g. after shop purchases or unlocks)
  const refreshUserData = useCallback(async () => {
    const activeInitData = initData || (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initData : '');
    try {
      const res = await fetch('/api/user/auth', {
        method: 'POST',
        headers: activeInitData ? { Authorization: `Bearer ${activeInitData}` } : {},
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(prev => {
          if (!prev) return data.user;
          return {
            ...data.user,
            // Guard against race conditions where local purchase is ahead of bot.js DB commit
            cat_hints: Math.max(data.user.cat_hints ?? 0, prev.cat_hints ?? 0),
            cross_hints: Math.max(data.user.cross_hints ?? 0, prev.cross_hints ?? 0),
            unlocked_avatars: Array.from(
              new Set([...(data.user.unlocked_avatars || [1, 2]), ...(prev.unlocked_avatars || [])])
            ),
            unlocked_frames: Array.from(
              new Set([...(data.user.unlocked_frames || [1, 2]), ...(prev.unlocked_frames || [])])
            ),
          };
        });
      }
    } catch (err) {
      console.warn('Error refreshing user data:', err);
    }
  }, [initData]);

  // Handle immediate in-game availability after purchase (without needing a refresh)
  const handlePurchaseSuccess = useCallback((purchase?: PurchaseResult) => {
    if (purchase) {
      setUser(prev => {
        if (!prev) return null;
        const next = { ...prev };
        if (purchase.type === 'cat_hints') {
          next.cat_hints = (next.cat_hints ?? 0) + purchase.quantity;
        } else if (purchase.type === 'cross_hints') {
          next.cross_hints = (next.cross_hints ?? 0) + purchase.quantity;
        } else if (purchase.type === 'avatar') {
          const aId = Number(purchase.id);
          const current = new Set(next.unlocked_avatars || [1, 2]);
          current.add(aId);
          next.unlocked_avatars = Array.from(current);
        } else if (purchase.type === 'frame') {
          const fId = Number(purchase.id);
          const current = new Set(next.unlocked_frames || [1, 2]);
          current.add(fId);
          next.unlocked_frames = Array.from(current);
        }
        return next;
      });
    }

    // Delay server sync so bot.js has time to commit to MySQL
    setTimeout(() => {
      refreshUserData();
    }, 1500);
    setTimeout(() => {
      refreshUserData();
    }, 3500);
  }, [refreshUserData]);

  // 4. Load Level (Instant when preloaded, no loading screen)
  const startLevel = useCallback(async (lvlNum: number) => {
    initGameSession(lvlNum, false);
    const cached = getCachedLevel(lvlNum);

    if (cached) {
      // Instant switch: NO loading screen shown!
      playGameLoad();
      setIsWon(false);
      setIsDefeatOpen(false);
      setIsVictoryOpen(false);
      setIsDailyVictoryOpen(false);
      setIsDailyChallenge(false);
      setTimerSeconds(0);
      setFishRemaining(3);
      setCatHintsUsed(0);
      setCrossHintsUsed(0);
      levelStartTimeRef.current = Date.now();

      setLevel(cached);
      setCurrentLevelNumber(lvlNum);
      const emptyBoard: CellState[][] = Array.from({ length: cached.size }, () =>
        Array(cached.size).fill(0)
      );
      setBoard(emptyBoard);
      setScreen('game');

      // Preload 1 more level in background to keep 5 ahead
      preloadLevel(lvlNum + 5);
      return;
    }

    // Fallback if not yet in cache
    playGameLoad();
    setScreen('loading');
    setIsWon(false);
    setIsDefeatOpen(false);
    setIsVictoryOpen(false);
    setIsDailyVictoryOpen(false);
    setIsDailyChallenge(false);
    setTimerSeconds(0);
    setFishRemaining(3);
    setCatHintsUsed(0);
    setCrossHintsUsed(0);
    levelStartTimeRef.current = Date.now();

    const levelData = await selectLevel(lvlNum);

    if (levelData) {
      setLevel(levelData);
      setCurrentLevelNumber(lvlNum);
      const emptyBoard: CellState[][] = Array.from({ length: levelData.size }, () =>
        Array(levelData.size).fill(0)
      );
      setBoard(emptyBoard);
      setScreen('game');
      preloadLevel(lvlNum + 5);
    } else {
      setScreen('home');
    }
  }, [initGameSession]);

  // 4b. Start Daily Challenge (Instant when preloaded, no loading screen)
  const startDailyChallenge = useCallback(async () => {
    initGameSession(9999, true);
    const cached = getCachedDailyChallenge();

    if (cached) {
      playGameLoad();
      setIsWon(false);
      setIsDefeatOpen(false);
      setIsVictoryOpen(false);
      setIsDailyVictoryOpen(false);
      setIsDailyChallenge(true);
      setTimerSeconds(0);
      setFishRemaining(3);
      setCatHintsUsed(0);
      setCrossHintsUsed(0);
      levelStartTimeRef.current = Date.now();

      setLevel(cached);
      setCurrentLevelNumber(9999);
      const emptyBoard: CellState[][] = Array.from({ length: cached.size }, () =>
        Array(cached.size).fill(0)
      );
      setBoard(emptyBoard);
      setScreen('game');
      return;
    }

    playGameLoad();
    setScreen('loading');
    setIsWon(false);
    setIsDefeatOpen(false);
    setIsVictoryOpen(false);
    setIsDailyVictoryOpen(false);
    setIsDailyChallenge(true);
    setTimerSeconds(0);
    setFishRemaining(3);
    setCatHintsUsed(0);
    setCrossHintsUsed(0);
    levelStartTimeRef.current = Date.now();

    const dailyData = await selectDailyChallenge();

    if (dailyData) {
      setLevel(dailyData);
      setCurrentLevelNumber(9999);
      const emptyBoard: CellState[][] = Array.from({ length: dailyData.size }, () =>
        Array(dailyData.size).fill(0)
      );
      setBoard(emptyBoard);
      setScreen('game');
    } else {
      setScreen('home');
    }
  }, [initGameSession]);

  // 5. Check for victory condition on board change
  const checkVictory = useCallback(
    async (currentBoard: CellState[][], levelData: LevelData, remainingFish: number) => {
      const size = levelData.size;
      const catPositions: { r: number; c: number }[] = [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (currentBoard[r][c] === 2) {
            catPositions.push({ r, c });
          }
        }
      }

      // Check if all cats placed
      if (catPositions.length !== size) return;

      // Validate cats
      for (let i = 0; i < catPositions.length; i++) {
        for (let j = i + 1; j < catPositions.length; j++) {
          const a = catPositions[i];
          const b = catPositions[j];
          const sameRow = a.r === b.r;
          const sameCol = a.c === b.c;
          const sameRegion = levelData.regionMap[a.r][a.c] === levelData.regionMap[b.r][b.c];
          const touching = Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1;

          if (sameRow || sameCol || sameRegion || touching) {
            return; // Invalid setup
          }
        }
      }

      // Level Won! Instant UI reaction (Zero Lag)
      setIsWon(true);
      playWin();
      triggerHaptic('success');
      setFishAwarded(remainingFish);

      const durationSec = Math.round((Date.now() - levelStartTimeRef.current) / 1000);

      // Handle Daily Challenge Victory
      if (isDailyChallenge) {
        const finalTime = Math.max(1, timerSeconds || durationSec);
        setDailyDuration(finalTime);
        setDailyChallengeCompleted(true);
        setIsDailyVictoryOpen(true); // Immediate modal display

        fetch('/api/user/daily-challenge', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${initData}`,
          },
          body: JSON.stringify({ duration_seconds: finalTime }),
        }).catch(err => {
          console.error('Failed to sync daily challenge completion:', err);
        });

        return;
      }

      // Immediate modal display without waiting for database round-trip!
      setIsVictoryOpen(true);

      // Save progress to database in background via /api/user/progress
      fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          session_token: sessionTokenRef.current,
          level_number: currentLevelNumber,
          completed: true,
          fish_remaining: remainingFish,
          cat_hints_used: catHintsUsed,
          cross_hints_used: crossHintsUsed,
          duration_seconds: durationSec,
          cats: catPositions,
        }),
      })
        .then(async res => {
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.user) {
              setUser(prev => (prev ? { ...prev, ...json.user } : json.user));
            }
          }
        })
        .catch(err => {
          console.error('Failed to sync progress:', err);
        });

      if (!isDailyChallenge) {
        // Preload 1 more level in background to keep 5 ahead
        preloadLevel(currentLevelNumber + 5);
      }
    },
    [currentLevelNumber, initData, catHintsUsed, crossHintsUsed, isDailyChallenge, timerSeconds]
  );

  // 6. Handle board update from GameBoard
  const handleBoardChange = (newBoard: CellState[][]) => {
    if (!level || isWon) return;
    setBoard(newBoard);
    checkVictory(newBoard, level, fishRemaining);
  };

  // 7. Handle wrong cat placement (fish loss)
  const handleLoseFish = () => {
    if (fishRemaining <= 1) {
      setFishRemaining(0);
      playFail();
      triggerHaptic('error');
      setIsDefeatOpen(true);
      sendLoseFish(0);
    } else {
      const nextFish = fishRemaining - 1;
      setFishRemaining(nextFish);
      sendLoseFish(nextFish);
    }
  };

  // 8. Cat Hint: Auto-places verified cat.
  const handleCatHint = async () => {
    if (!level || isWon || !user || user.cat_hints <= 0) return;

    const nextCat = HintEngine.findNextCat(board, level);
    if (!nextCat) return;

    const newBoard = board.map(row => [...row]);
    newBoard[nextCat.r][nextCat.c] = 2;

    playCatMeow();
    triggerHaptic('medium');
    setBoard(newBoard);

    setCatHintsUsed(prev => prev + 1);
    setUser(prev => (prev ? { ...prev, cat_hints: Math.max(0, prev.cat_hints - 1) } : null));
    sendHintUsed('cat');

    if (!isDailyChallenge) {
      fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          session_token: sessionTokenRef.current,
          level_number: currentLevelNumber,
          completed: false,
          cat_hints_used: 1,
          cross_hints_used: 0,
        }),
      }).catch(console.error);
    }

    checkVictory(newBoard, level, fishRemaining);
  };

  // 9. Cross Hint: Auto-crosses up to 3 non-cat boxes
  const handleCrossHint = async () => {
    if (!level || isWon || !user || user.cross_hints <= 0) return;

    const boxesToCross = HintEngine.findBoxesToCross(board, level, 3);
    if (boxesToCross.length === 0) return;

    const newBoard = board.map(row => [...row]);
    boxesToCross.forEach(pt => {
      newBoard[pt.r][pt.c] = 1;
    });

    playCross();
    triggerHaptic('light');
    setBoard(newBoard);

    setCrossHintsUsed(prev => prev + 1);
    setUser(prev => (prev ? { ...prev, cross_hints: Math.max(0, prev.cross_hints - 1) } : null));
    sendHintUsed('cross');

    if (!isDailyChallenge) {
      fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${initData}`,
        },
        body: JSON.stringify({
          session_token: sessionTokenRef.current,
          level_number: currentLevelNumber,
          completed: false,
          cat_hints_used: 0,
          cross_hints_used: 1,
        }),
      }).catch(console.error);
    }
  };

  // 9b. Watch Monetag Rewarded Ad to earn a free hint when count is 0
  const [isAdLoading, setIsAdLoading] = useState(false);

  const handleWatchAd = async (type: 'cat' | 'cross') => {
    if (isAdLoading) return;
    setIsAdLoading(true);
    triggerHaptic('medium');

    try {
      // 1. Play Monetag Rewarded Interstitial
      await showRewardedAd();

      // 2. Ad watched successfully! Award +1 hint
      triggerHaptic('success');
      playWin();

      // Optimistically update client state so badge immediately turns from Play icon to 1
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          cat_hints: type === 'cat' ? (prev.cat_hints || 0) + 1 : prev.cat_hints,
          cross_hints: type === 'cross' ? (prev.cross_hints || 0) + 1 : prev.cross_hints,
        };
      });

      // 3. Persist +1 hint to MySQL database
      if (initData) {
        const res = await fetch('/api/user/ad-reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${initData}`,
          },
          body: JSON.stringify({ hint_type: type }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setUser(prev =>
              prev
                ? {
                    ...prev,
                    cat_hints: json.cat_hints !== undefined ? json.cat_hints : prev.cat_hints,
                    cross_hints: json.cross_hints !== undefined ? json.cross_hints : prev.cross_hints,
                  }
                : null
            );
          }
        }
      }
    } catch (err: any) {
      console.warn('[Ad] Watch ad error:', err);
      if (err?.message) {
        alert(err.message);
      }
    } finally {
      setIsAdLoading(false);
    }
  };

  // 10. Restart current level after defeat
  const handleRestartLevel = () => {
    if (isDailyChallenge) {
      startDailyChallenge();
    } else {
      startLevel(currentLevelNumber);
    }
  };

  // 11. Advance to next level after victory
  const handleNextLevel = () => {
    const nextLvl = currentLevelNumber + 1;
    setCurrentLevelNumber(nextLvl);
    startLevel(nextLvl);
    preloadLevel(nextLvl + 5);
  };

  // 12. Tutorial completed handler
  const handleTutorialComplete = async () => {
    setIsTutorialOpen(false);
    if (user) {
      setUser(prev => (prev ? { ...prev, tutorial_completed: true, is_new: false } : null));
    }
    if (initData) {
      try {
        await fetch('/api/user/tutorial', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${initData}`,
          },
        });
      } catch (err) {
        console.error('Failed to sync tutorial completion:', err);
      }
    }
  };

  // Render: If not in Telegram
  if (screen === 'not_in_telegram') {
    return (
      <main
        style={{ paddingTop: `${safeTop}px`, paddingBottom: `${safeBottom}px` }}
        className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF7F2] p-6 text-center select-none"
      >
        <div className="relative mb-6 flex flex-col items-center">
          <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-xl shadow-[#F29454]/25 border-4 border-white flex items-center justify-center bg-white">
            <img
              src="/logo.png"
              alt="Meowdoku Logo"
              className="w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>
        </div>
        <h1 className="text-3xl font-black text-[#3D2C1E] mb-2">{t('appName')}</h1>
        <p className="text-sm font-bold text-[#8C7A6B] max-w-sm mb-6 leading-relaxed">
          {t('openInTelegram')}
        </p>

        <a
          href="https://t.me/meowdokubot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-[#24A1DE] hover:bg-[#1E8EC7] active:scale-95 text-white font-black text-base shadow-lg shadow-[#24A1DE]/25 flex items-center justify-center gap-2.5 transition-all mb-5 cursor-pointer no-underline"
        >
          <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.95-1.28 4.92-2.13 5.9-2.54 2.81-1.17 3.39-1.38 3.77-1.38.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          <span>{t('playOnTelegram')}</span>
        </a>

        <div className="bg-white p-5 rounded-2xl border border-[#EBE3D7] shadow-xs max-w-sm text-left">
          <h3 className="text-xs font-black text-[#3D2C1E] uppercase tracking-wider mb-2">
            {t('miniAppModeTitle')}
          </h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            {t('miniAppModeDesc')}
          </p>
        </div>
      </main>
    );
  }

  // Render: Loading Screen
  if (screen === 'loading') {
    return <LoadingScreen message={t('loading')} progress={preloadProgress} />;
  }

  // Count placed cats
  const catsPlaced = board.reduce(
    (total, row) => total + row.filter(c => c === 2).length,
    0
  );

  const score = (currentLevelNumber - 1) * 35 + catsPlaced * 5;

  return (
    <main
      style={{ paddingTop: `${safeTop}px`, paddingBottom: `${safeBottom}px` }}
      className="min-h-screen w-full bg-[#FAF7F2] flex flex-col justify-between overflow-x-hidden box-border"
    >
      {/* Hub Screen: Game Selection */}
      {screen === 'hub' && user && (
        <GameSelectionScreen
          user={user}
          onSelectMeowdoku={() => setScreen('home')}
          onSelectPawBalance={() => setScreen('pawbalance_game')}
          onSelectHexagonSort={() => setScreen('hexagon_game')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      )}

      {/* Home Screen View matching Image 2 */}
      {screen === 'home' && user && (
        <div className="w-full flex-1 flex flex-col relative overflow-hidden">
          {/* Back button to Hub */}
          <button
            onClick={() => {
              playTap();
              triggerHaptic('light');
              setScreen('hub');
            }}
            className="absolute top-2 left-4 z-[60] bg-white p-2 rounded-full shadow-md border border-[#EBE3D7] active:scale-95 transition-transform flex items-center justify-center w-10 h-10"
          >
            <svg className="w-6 h-6 text-[#8C7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <HomeScreen
            user={user}
            onPlay={() => startLevel(user.current_level || 1)}
            onOpenStreak={() => setIsStreakOpen(true)}
            onOpenDailyChallenge={startDailyChallenge}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenShop={() => {
              setShopInitialTab('hints');
              setIsShopOpen(true);
            }}
            dailyChallengeCompleted={dailyChallengeCompleted}
          />
        </div>
      )}

      {/* PawBalance Game Screen */}
      {screen === 'pawbalance_game' && (
        <PawBalanceGameScreen onBack={() => {
          playTap();
          triggerHaptic('light');
          setScreen('hub');
        }} />
      )}

      {/* Hexagon Block Sort Game Screen */}
      {screen === 'hexagon_game' && user && (
        <div className="w-full h-full absolute inset-0 z-50 bg-[#1A1A2E]">
          <HexagonGameApp
            user={user}
            initData={initData}
            onBack={() => {
              playTap();
              triggerHaptic('light');
              setScreen('hub');
            }}
          />
        </div>
      )}

      {/* Active Game Screen View matching Image 2 */}
      {screen === 'game' && level && (
        <div className="flex flex-col justify-between items-center w-full max-w-lg mx-auto flex-1 px-2 sm:px-4">
          {/* Header matching Image 2 with stopwatch timer when in Daily Challenge */}
          <Header
            levelNumber={currentLevelNumber}
            score={score}
            fishRemaining={fishRemaining}
            catsPlaced={catsPlaced}
            totalCats={level.size}
            onOpenSettings={() => setIsSettingsOpen(true)}
            isDailyChallenge={isDailyChallenge}
            timerSeconds={timerSeconds}
          />

          {/* Main Board Arena */}
          <section className="my-auto py-2 w-full flex items-center justify-center">
            <GameBoard
              key={`game-${currentLevelNumber}-${levelStartTimeRef.current}`}
              level={level}
              board={board}
              onBoardChange={handleBoardChange}
              onLoseFish={handleLoseFish}
              isWon={isWon}
              onCellAction={sendCellAction}
            />
          </section>

          {/* Bottom ToolBar matching Image 2 (Cat & Cross hints, NO undo) */}
          <ToolBar
            onCrossHint={handleCrossHint}
            crossHints={user?.cross_hints || 0}
            onCatHint={handleCatHint}
            catHints={user?.cat_hints || 0}
            onWatchAd={handleWatchAd}
          />
        </div>
      )}

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {user && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onUpdateProfile={(updated) => {
            setUser(prev =>
              prev
                ? {
                    ...prev,
                    avatar_id: updated.avatar_id,
                    frame_id: updated.frame_id,
                    display_name: updated.display_name,
                  }
                : null
            );
          }}
          initData={initData}
          onOpenShop={(tab) => {
            setShopInitialTab(tab || 'cosmetics');
            setIsShopOpen(true);
          }}
        />
      )}

      {user && (
        <ShopModal
          isOpen={isShopOpen}
          onClose={() => setIsShopOpen(false)}
          user={user}
          initData={initData}
          onPurchaseSuccess={handlePurchaseSuccess}
          safeTop={safeTop}
          safeBottom={safeBottom}
          initialTab={shopInitialTab}
        />
      )}

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={handleTutorialComplete}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        initData={initData}
        safeTop={safeTop}
        safeBottom={safeBottom}
      />

      <VictoryModal
        isOpen={isVictoryOpen}
        levelNumber={currentLevelNumber}
        fishWon={fishAwarded}
        totalFish={user?.fish_balance || 0}
        onNextLevel={handleNextLevel}
        onReplay={handleRestartLevel}
        onHome={() => {
          setIsVictoryOpen(false);
          setScreen('hub');
        }}
      />

      <DefeatModal
        isOpen={isDefeatOpen}
        levelNumber={currentLevelNumber}
        onRetry={handleRestartLevel}
      />

      {/* Daily Streak Modal matching Image 1 */}
      <DailyStreakModal
        isOpen={isStreakOpen}
        onClose={() => setIsStreakOpen(false)}
        currentStreak={user?.current_streak ?? 1}
        bestStreak={user?.best_streak ?? user?.current_streak ?? 1}
        weekDays={user?.week_days || []}
        checkedInToday={Boolean(user?.checked_in_today)}
        initData={initData}
        onCheckinSuccess={(data) => {
          setUser(prev =>
            prev
              ? {
                  ...prev,
                  current_streak: data.current_streak,
                  best_streak: data.best_streak,
                  checked_in_today: data.checked_in_today,
                  week_days: data.week_days,
                  cat_hints: data.cat_hints !== undefined ? data.cat_hints : prev.cat_hints,
                  cross_hints: data.cross_hints !== undefined ? data.cross_hints : prev.cross_hints,
                }
              : null
          );
        }}
        safeTop={safeTop}
        safeBottom={safeBottom}
      />

      {/* Daily Challenge Victory Modal with Speedrun Elapsed Time */}
      <DailyChallengeVictoryModal
        isOpen={isDailyVictoryOpen}
        durationSeconds={dailyDuration}
        onHome={() => {
          setIsDailyVictoryOpen(false);
          setIsDailyChallenge(false);
          setScreen('hub');
        }}
      />
    </main>
  );
}
