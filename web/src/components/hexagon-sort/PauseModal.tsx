import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ isOpen, onResume, onRestart, onHome }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 p-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-xs bg-gradient-to-b from-[#1c0f45] to-[#2a1b54] rounded-3xl p-6 border border-white/20 text-center text-white"
          >
            <h2 className="text-2xl font-black mb-8">PAUSED</h2>

            <div className="flex flex-col gap-4">
              <button
                onClick={onResume}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00ffff] to-[#1e90ff] font-black text-[#1c0f45]"
              >
                RESUME
              </button>
              <button
                onClick={onRestart}
                className="w-full py-4 rounded-xl bg-white/10 border border-white/20 font-bold"
              >
                RESTART LEVEL
              </button>
              <button
                onClick={onHome}
                className="w-full py-4 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 font-bold mt-4"
              >
                QUIT TO MENU
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
