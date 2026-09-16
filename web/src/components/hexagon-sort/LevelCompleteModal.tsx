import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelCompleteModalProps {
  isOpen: boolean;
  score: number;
  level: number;
  onNextLevel: () => void;
  onHome: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({ isOpen, score, level, onNextLevel, onHome }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-sm bg-gradient-to-b from-[#1c0f45] to-[#401f80] rounded-3xl p-6 border-2 border-[#00ffff]/50 shadow-[0_0_30px_rgba(0,255,255,0.3)] text-center text-white"
          >
            <h2 className="text-3xl font-black mb-2 text-[#00ffff]">LEVEL COMPLETE</h2>
            <p className="text-white/70 mb-6">You completed Level {level}</p>

            <div className="bg-white/10 rounded-2xl p-6 mb-8 border border-white/20">
              <p className="text-sm text-white/50 mb-1 font-bold">TOTAL SCORE</p>
              <p className="text-5xl font-black text-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
                {score}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={onHome}
                className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 font-bold active:scale-95 transition-transform"
              >
                HOME
              </button>
              <button
                onClick={onNextLevel}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00ffff] to-[#1e90ff] font-black text-[#1c0f45] shadow-[0_0_15px_rgba(0,255,255,0.4)] active:scale-95 transition-transform"
              >
                NEXT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
