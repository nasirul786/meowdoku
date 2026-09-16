'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnimalType, ANIMAL_TYPE, PawBalanceLevel } from '@/lib/pawbalance/types';
import { generatePlayableLevel } from '@/lib/pawbalance/generator';
import { isBoardWon, getInvalidCells } from '@/lib/pawbalance/validator';
import { PawBalanceBoard } from './PawBalanceBoard';
import { triggerHaptic } from '@/lib/haptics';
import { playTap, playWin, playHeartBreak, startBGM } from '@/lib/soundEffects';
import { motion, AnimatePresence } from 'framer-motion';

interface PawBalanceGameScreenProps {
  onBack: () => void;
}

export const PawBalanceGameScreen: React.FC<PawBalanceGameScreenProps> = ({ onBack }) => {
  const [level, setLevel] = useState<PawBalanceLevel | null>(null);
  const [board, setBoard] = useState<AnimalType[][]>([]);
  const [invalidCells, setInvalidCells] = useState<Set<string>>(new Set());
  const [isWon, setIsWon] = useState(false);
  const [levelNumber, setLevelNumber] = useState(1);
  const [lives, setLives] = useState(3);
  const [isDefeat, setIsDefeat] = useState(false);

  // Initialize level
  const initLevel = useCallback((lvlNum: number) => {
    const size = lvlNum < 3 ? 6 : (lvlNum < 8 ? 8 : 10);
    const difficulty = Math.min(0.3 + (lvlNum * 0.05), 0.7); // Increases difficulty

    // In a real app we'd offload to web worker if it gets slow, but 6x6-10x10 is instant
    const newLvl = generatePlayableLevel(size, lvlNum, difficulty);
    if (newLvl) {
      setLevel(newLvl);
      setBoard(newLvl.initialBoard.map(row => [...row]));
      setInvalidCells(new Set());
      setIsWon(false);
      setIsDefeat(false);
      setLives(3);
      setLevelNumber(lvlNum);
      startBGM();
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = () => {
      const size = 6;
      const newLvl = generatePlayableLevel(size, 1, 0.35);
      if (newLvl && mounted) {
        setLevel(newLvl);
        setBoard(newLvl.initialBoard.map(row => [...row]));
        setInvalidCells(new Set());
        setIsWon(false);
        setIsDefeat(false);
        setLives(3);
        setLevelNumber(1);
        startBGM();
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const handleCellClick = (r: number, c: number) => {
    if (!level || isWon || isDefeat) return;

    // Cycle through empty -> dog -> cat -> empty
    const current = board[r][c];
    let next: AnimalType = ANIMAL_TYPE.EMPTY;
    if (current === ANIMAL_TYPE.EMPTY) next = ANIMAL_TYPE.DOG;
    else if (current === ANIMAL_TYPE.DOG) next = ANIMAL_TYPE.CAT;
    else if (current === ANIMAL_TYPE.CAT) next = ANIMAL_TYPE.EMPTY;

    const newBoard = board.map((row, i) =>
      row.map((cell, j) => (i === r && j === c ? next : cell))
    );

    setBoard(newBoard);
    playTap();
    triggerHaptic('light');

    // Validate logic
    const invalids = getInvalidCells(newBoard, level.size);
    setInvalidCells(invalids);

    // Only penalize if they actively placed a conflicting piece (not erasing)
    if (next !== ANIMAL_TYPE.EMPTY && invalids.has(`${r},${c}`)) {
       playHeartBreak();
       triggerHaptic('error');
       const newLives = lives - 1;
       setLives(newLives);
       if (newLives <= 0) {
         setIsDefeat(true);
       }
    } else {
       // Check win
       if (isBoardWon(newBoard, level.size)) {
         setIsWon(true);
         playWin();
         triggerHaptic('success');
       }
    }
  };

  const handleNextLevel = () => {
    initLevel(levelNumber + 1);
  };

  const handleRetry = () => {
    initLevel(levelNumber);
  };

  if (!level) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  return (
    <div className="w-full flex-1 flex flex-col relative overflow-hidden bg-[#FAF7F2]">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pt-4 pb-2 z-10">
        <button
          onClick={onBack}
          className="bg-white p-2 rounded-full shadow-md border border-[#EBE3D7] active:scale-95 transition-transform w-10 h-10 flex items-center justify-center"
        >
          <svg className="w-6 h-6 text-[#8C7A6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-[#EBE3D7] font-black text-[#3D2C1E] text-lg">
          Level {levelNumber}
        </div>

        <div className="flex gap-1 items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-[#EBE3D7]">
          {Array.from({ length: 3 }).map((_, i) => (
             <span key={i} className={`text-lg transition-opacity ${i < lives ? 'opacity-100' : 'opacity-30 grayscale'}`}>
               ❤️
             </span>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-2">
        <PawBalanceBoard
          level={level}
          board={board}
          invalidCells={invalidCells}
          onCellClick={handleCellClick}
          isWon={isWon}
        />

        <div className="mt-8 px-6 text-center max-w-sm">
           <p className="text-sm font-bold text-[#8C7A6B] leading-tight mb-2">Tap a cell to cycle: Dog 🐶 → Cat 🐱 → Empty.</p>
           <p className="text-xs font-medium text-[#8C7A6B]/80 leading-tight">No 3 of the same in a row/col. Equal dogs and cats per line. All lines unique.</p>
        </div>
      </div>

      {/* Win Modal Overlay */}
      <AnimatePresence>
        {isWon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
             <motion.div
               initial={{ scale: 0.8, y: 50 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[2rem] p-8 w-full max-w-xs flex flex-col items-center shadow-2xl text-center"
             >
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-2xl font-black text-[#3D2C1E] mb-2">Perfect Balance!</h2>
                <p className="text-[#8C7A6B] font-bold mb-6 text-sm">You solved Level {levelNumber}</p>
                <button
                  onClick={handleNextLevel}
                  className="w-full py-3.5 bg-[#24A1DE] hover:bg-[#1E8EC7] text-white font-black rounded-2xl shadow-lg shadow-[#24A1DE]/25 active:scale-95 transition-all text-lg"
                >
                  Next Level
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Defeat Modal Overlay */}
      <AnimatePresence>
        {isDefeat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
             <motion.div
               initial={{ scale: 0.8, y: 50 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[2rem] p-8 w-full max-w-xs flex flex-col items-center shadow-2xl text-center"
             >
                <div className="text-6xl mb-4">💔</div>
                <h2 className="text-2xl font-black text-[#3D2C1E] mb-2">Out of Lives!</h2>
                <p className="text-[#8C7A6B] font-bold mb-6 text-sm">Too many illegal moves.</p>
                <button
                  onClick={handleRetry}
                  className="w-full py-3.5 bg-[#F29454] hover:bg-[#E37A3C] text-white font-black rounded-2xl shadow-lg shadow-[#F29454]/25 active:scale-95 transition-all text-lg"
                >
                  Try Again
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
