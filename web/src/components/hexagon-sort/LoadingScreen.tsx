import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onLoadComplete, 300);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [onLoadComplete]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1c0f45] to-[#401f80] p-6 text-white text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 mb-8"
      >
        <svg className="w-full h-full text-[#00ffff] drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 2L22 7.77V16.23L12 22L2 16.23V7.77L12 2Z"/>
        </svg>
      </motion.div>

      <h2 className="text-xl font-bold tracking-widest text-[#00ffff] mb-2 uppercase">Loading...</h2>
      <p className="text-sm text-white/50 mb-8">Preparing your puzzle...</p>

      <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00ffff] to-[#1e90ff]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
