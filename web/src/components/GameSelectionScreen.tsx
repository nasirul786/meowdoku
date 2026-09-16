'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { playTap, startBGM } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/haptics';
import { Settings } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { UserAvatar } from './UserAvatar';
import { CatLottie } from './CatLottie';

interface GameSelectionScreenProps {
  user: UserProfile;
  onSelectMeowdoku: () => void;
  onSelectPawBalance: () => void;
  onSelectHexagonSort: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export const GameSelectionScreen: React.FC<GameSelectionScreenProps> = ({
  user,
  onSelectMeowdoku,
  onSelectPawBalance,
  onSelectHexagonSort,
  onOpenSettings,
  onOpenProfile,
}) => {

  React.useEffect(() => {
    startBGM();
  }, []);

  const handleMeowdokuClick = () => {
    playTap();
    triggerHaptic('medium');
    onSelectMeowdoku();
  };

  const handlePawBalanceClick = () => {
    playTap();
    triggerHaptic('medium');
    onSelectPawBalance();
  };

  const handleHexagonSortClick = () => {
    playTap();
    triggerHaptic('medium');
    onSelectHexagonSort();
  };

  const handleSettingsClick = () => {
    playTap();
    triggerHaptic('light');
    onOpenSettings();
  };

  const handleProfileClick = () => {
    playTap();
    triggerHaptic('light');
    onOpenProfile();
  };

  return (
    <div className="flex flex-col items-center justify-between flex-1 w-full max-w-md mx-auto px-5 py-4 select-none relative overflow-hidden bg-[#FAF7F2]">
      {/* Top Header Navigation */}
      <div className="w-full flex justify-between items-center z-10 pt-2 mb-6">
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-2.5 bg-white pl-1.5 pr-4 py-1.5 rounded-full shadow-sm border border-[#EBE3D7] active:scale-95 transition-transform"
        >
          <div className="relative w-8 h-8 shrink-0">
            <UserAvatar avatarId={user.avatar_id} frameId={user.frame_id} />
          </div>
          <span className="text-[#3D2C1E] font-bold text-sm tracking-tight truncate max-w-[100px]">
            {user.display_name || user.first_name}
          </span>
        </button>

        <button
          onClick={handleSettingsClick}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#EBE3D7] active:scale-95 transition-transform"
        >
          <Settings className="w-5 h-5 text-[#8C7A6B]" strokeWidth={2.5} />
        </button>
      </div>

      {/* Title Section */}
      <div className="flex flex-col items-center mb-10 w-full text-center">
         <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="mb-2"
          >
             <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-xl shadow-[#F29454]/25 border-4 border-white flex items-center justify-center bg-white mx-auto">
                <img
                  src="/logo.png"
                  alt="Games Logo"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                />
             </div>
         </motion.div>
         <h1 className="text-3xl font-black text-[#3D2C1E] tracking-tight">Mini Games</h1>
         <p className="text-sm font-bold text-[#8C7A6B] mt-1">Choose your challenge</p>
      </div>

      {/* Game Selection Cards */}
      <div className="flex flex-col gap-5 w-full flex-1 justify-center pb-12">
        {/* Classic Meowdoku */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleMeowdokuClick}
          className="relative w-full rounded-[2rem] bg-gradient-to-b from-[#F29454] to-[#E37A3C] p-1 shadow-lg shadow-[#F29454]/30"
        >
          <div className="w-full h-full rounded-[1.8rem] bg-white/10 p-5 flex items-center gap-4 border-2 border-white/20">
             <div className="w-16 h-16 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-inner overflow-hidden relative">
               <div className="w-16 h-16 scale-125 pt-2">
                 <CatLottie animationSpeed={1} />
               </div>
             </div>
             <div className="flex flex-col items-start text-left flex-1">
               <h2 className="text-xl font-black text-white leading-tight">Meowdoku</h2>
               <p className="text-white/80 text-xs font-medium mt-1 leading-tight">The classic logic puzzle</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
               <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <path d="m9 18 6-6-6-6"/>
               </svg>
             </div>
          </div>
        </motion.button>

        {/* PawBalance (Dogs vs Cats) */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handlePawBalanceClick}
          className="relative w-full rounded-[2rem] bg-gradient-to-b from-[#4A90E2] to-[#357ABD] p-1 shadow-lg shadow-[#4A90E2]/30"
        >
          <div className="w-full h-full rounded-[1.8rem] bg-white/10 p-5 flex items-center gap-4 border-2 border-white/20">
             <div className="w-16 h-16 shrink-0 bg-white rounded-2xl flex flex-row items-center justify-center shadow-inner gap-0.5 px-2">
                <span className="text-2xl">🐶</span>
                <span className="text-2xl">🐱</span>
             </div>
             <div className="flex flex-col items-start text-left flex-1">
               <h2 className="text-xl font-black text-white leading-tight">PawBalance</h2>
               <p className="text-white/80 text-xs font-medium mt-1 leading-tight">Dogs vs Cats Takuzu</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
               <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <path d="m9 18 6-6-6-6"/>
               </svg>
             </div>
          </div>
        </motion.button>

        {/* Hexagon Block Sort */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleHexagonSortClick}
          className="relative w-full rounded-[2rem] bg-gradient-to-b from-[#8A2BE2] to-[#4B0082] p-1 shadow-lg shadow-[#8A2BE2]/30"
        >
           <div className="absolute -top-3 -right-2 bg-[#FF3B30] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm z-10 rotate-3 border-2 border-white">
             NEW
           </div>
          <div className="w-full h-full rounded-[1.8rem] bg-white/10 p-5 flex items-center gap-4 border-2 border-white/20">
             <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-[#1c0f45] to-[#401f80] rounded-2xl flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00ffff]/20 via-transparent to-transparent"></div>
                <svg className="w-10 h-10 text-[#00ffff] z-10 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L22 7.77V16.23L12 22L2 16.23V7.77L12 2Z"/>
                </svg>
             </div>
             <div className="flex flex-col items-start text-left flex-1">
               <h2 className="text-xl font-black text-white leading-tight">Hexagon Sort</h2>
               <p className="text-white/80 text-xs font-medium mt-1 leading-tight">Sort. Match. Relax.</p>
             </div>
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
               <svg className="w-4 h-4 text-white ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                 <path d="m9 18 6-6-6-6"/>
               </svg>
             </div>
          </div>
        </motion.button>
      </div>

    </div>
  );
};
