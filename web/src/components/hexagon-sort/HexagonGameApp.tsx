import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { WelcomeScreen } from './WelcomeScreen';
import { LoadingScreen } from './LoadingScreen';
import { HomeScreen } from './HomeScreen';
import { GameplayScreen } from './GameplayScreen';
import { LevelCompleteModal } from './LevelCompleteModal';
import { PauseModal } from './PauseModal';
import { SettingsModal } from './SettingsModal';
import { ShopModal } from './ShopModal';
import { useHexagonGame } from '@/lib/hexagon/useHexagonGame';
import { HexGameProfile } from '@/lib/hexagon/types';
import { loadUserProfile, saveUserProfile } from '@/lib/hexagon/dbSync';

interface HexagonGameAppProps {
  user: UserProfile;
  initData: string;
  onBack: () => void;
}

type ScreenType = 'welcome' | 'loading' | 'home' | 'gameplay';

export const HexagonGameApp: React.FC<HexagonGameAppProps> = ({ user, initData, onBack }) => {
  const [screen, setScreen] = useState<ScreenType>('welcome');
  const [profile, setProfile] = useState<HexGameProfile | null>(null);
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLevelCompleteOpen, setIsLevelCompleteOpen] = useState(false);

  const gameState = useHexagonGame(3);

  useEffect(() => {
    // Monitor game over / level complete state
    if (gameState.isGameOver || gameState.score > gameState.level * 1000) {
      if (screen === 'gameplay' && gameState.score > 0) {
        setIsLevelCompleteOpen(true);
      }
    }
  }, [gameState.score, gameState.level, gameState.isGameOver, screen]);

  const handleStartLoading = () => {
    setScreen('loading');
    // Initialize profile from Firestore
    loadUserProfile(user.telegram_id).then(p => {
      setProfile(p);
    }).catch(e => {
      console.error("Firebase error", e);
      // Fallback profile if firebase fails in this env
      setProfile({
        telegramId: user.telegram_id,
        currentLevel: 1,
        totalScore: 0,
        levelsCompleted: 0,
        bestScore: 0,
        premiumThemesUnlocked: ['default'],
        hasRemovedAds: false,
        hints: 3,
        undos: 3,
        shuffles: 3
      });
    });
  };

  const handleLoadComplete = () => {
    setScreen('home');
  };

  const handlePlay = () => {
    setScreen('gameplay');
  };

  const handleGoHome = () => {
    setIsPauseOpen(false);
    setIsLevelCompleteOpen(false);
    setScreen('home');
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#1c0f45]">

      {/* Screens */}
      {screen === 'welcome' && (
        <WelcomeScreen onPlay={handleStartLoading} />
      )}

      {screen === 'loading' && (
        <LoadingScreen onLoadComplete={handleLoadComplete} />
      )}

      {screen === 'home' && profile && (
        <>
          {/* Back button to Hub */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 z-50 bg-white/10 p-2 rounded-full shadow-md border border-white/20 active:scale-95 transition-transform flex items-center justify-center w-10 h-10 text-white backdrop-blur-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <HomeScreen
            user={user}
            profile={profile}
            onPlay={handlePlay}
            onOpenShop={() => setIsShopOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </>
      )}

      {screen === 'gameplay' && (
        <GameplayScreen
          gameState={gameState}
          handleDrop={gameState.handleDrop}
          onUndo={gameState.undo}
          onShuffle={gameState.shuffle}
          onHint={gameState.hint}
          onPause={() => setIsPauseOpen(true)}
        />
      )}

      {/* Modals */}
      <LevelCompleteModal
        isOpen={isLevelCompleteOpen}
        score={gameState.score}
        level={gameState.level}
        onNextLevel={() => {
          setIsLevelCompleteOpen(false);
          gameState.advanceLevel();
          if (profile) {
            // Update UI optimistically
            const nextLevel = gameState.level + 1;
            const nextScore = profile.totalScore + gameState.score;
            setProfile({ ...profile, currentLevel: nextLevel, totalScore: nextScore });

            // Sync completely via our secure API route
            fetch('/api/user/hexagon-progress', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${initData}`,
              },
              body: JSON.stringify({
                level_number: gameState.level,
                score: gameState.score,
                completed: true
              }),
            }).catch(console.error);
          }
        }}
        onHome={handleGoHome}
      />

      <PauseModal
        isOpen={isPauseOpen}
        onResume={() => setIsPauseOpen(false)}
        onRestart={() => {
          setIsPauseOpen(false);
          gameState.resetBoard();
        }}
        onHome={handleGoHome}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
      />

    </div>
  );
};
