import React from 'react';
import { motion } from 'framer-motion';
import { playTap } from '@/lib/soundEffects';

interface WelcomeScreenProps {
  onPlay: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onPlay }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1c0f45] to-[#401f80] p-6 text-white text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="w-32 h-32 mx-auto bg-white/10 rounded-3xl flex items-center justify-center border-2 border-[#00ffff]/30 shadow-[0_0_20px_rgba(0,255,255,0.3)] backdrop-blur-sm">
          <svg className="w-20 h-20 text-[#00ffff]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L22 7.77V16.23L12 22L2 16.23V7.77L12 2Z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-black mt-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#00ffff] to-[#8a2be2]">
          HEXAGON<br/>BLOCK SORT
        </h1>
        <p className="text-[#00ffff]/70 mt-2 font-medium tracking-widest text-sm uppercase">
          Sort. Match. Relax.
        </p>
      </motion.div>

      <div className="flex gap-4 mb-12">
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex-1 backdrop-blur-md">
          <span className="block text-xl">🧩</span>
          <span className="text-xs font-bold text-white/80 mt-1 block">Hundreds of Levels</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex-1 backdrop-blur-md">
          <span className="block text-xl">🏆</span>
          <span className="text-xs font-bold text-white/80 mt-1 block">Daily Challenges</span>
        </div>
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex-1 backdrop-blur-md">
          <span className="block text-xl">✨</span>
          <span className="text-xs font-bold text-white/80 mt-1 block">Premium Themes</span>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => { playTap(); onPlay(); }}
        className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-[#00ffff] to-[#1e90ff] text-white font-black text-xl shadow-[0_0_20px_rgba(0,255,255,0.4)]"
      >
        PLAY NOW
      </motion.button>

      <p className="mt-8 text-xs text-white/30 font-medium">Powered by Telegram</p>
    </div>
  );
};
