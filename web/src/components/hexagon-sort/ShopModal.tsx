import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-gradient-to-b from-[#1c0f45] to-[#401f80] text-white">
          <div className="flex justify-between items-center p-4 border-b border-white/10">
            <h2 className="text-xl font-bold">Store</h2>
            <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">✕</button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            {/* Telegram Stars Banner */}
            <div className="bg-[#24A1DE]/10 border border-[#24A1DE]/30 p-4 rounded-2xl flex justify-between items-center mb-6">
              <div>
                <p className="text-xs text-[#24A1DE] font-bold">TELEGRAM STARS</p>
                <p className="text-xl font-black">Buy Premium Items</p>
              </div>
              <div className="text-4xl">⭐️</div>
            </div>

            {/* Products */}
            <div className="flex flex-col gap-4">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center text-2xl">🚫</div>
                <div className="flex-1">
                  <h3 className="font-bold">Remove Ads</h3>
                  <p className="text-xs text-white/50">Play without interruptions</p>
                </div>
                <button className="bg-[#24A1DE] px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#24A1DE]/30">
                  500 ⭐️
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">🌌</div>
                <div className="flex-1">
                  <h3 className="font-bold">Neon Galaxy Theme</h3>
                  <p className="text-xs text-white/50">A stunning new look</p>
                </div>
                <button className="bg-[#24A1DE] px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#24A1DE]/30">
                  100 ⭐️
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl">💡</div>
                <div className="flex-1">
                  <h3 className="font-bold">Hint Pack</h3>
                  <p className="text-xs text-white/50">10 Premium Hints</p>
                </div>
                <button className="bg-[#24A1DE] px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#24A1DE]/30">
                  50 ⭐️
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
