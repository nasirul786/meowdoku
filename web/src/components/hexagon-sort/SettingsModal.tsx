import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/60">
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full bg-[#1c0f45] rounded-t-3xl p-6 border-t border-white/20 text-white pb-10"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full">✕</button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="font-bold">Sound Effects</span>
                <div className="w-12 h-6 bg-[#00ffff] rounded-full p-1 flex items-center justify-end">
                  <div className="w-4 h-4 bg-[#1c0f45] rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                <span className="font-bold">Haptic Feedback</span>
                <div className="w-12 h-6 bg-[#00ffff] rounded-full p-1 flex items-center justify-end">
                  <div className="w-4 h-4 bg-[#1c0f45] rounded-full"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
