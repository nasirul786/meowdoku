'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimalType, ANIMAL_TYPE, PawBalanceLevel } from '@/lib/pawbalance/types';
import { CatLottie } from '../CatLottie';

interface PawBalanceBoardProps {
  level: PawBalanceLevel;
  board: AnimalType[][];
  invalidCells: Set<string>;
  onCellClick: (r: number, c: number) => void;
  isWon: boolean;
}

export const PawBalanceBoard: React.FC<PawBalanceBoardProps> = ({
  level,
  board,
  invalidCells,
  onCellClick,
  isWon
}) => {
  const size = level.size;
  // Maximum grid size logic based on screen width (similar to Meowdoku GameBoard)
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 380;

  let cellSize = 42;
  if (size >= 10) cellSize = isSmallScreen ? 26 : 30;
  else if (size >= 8) cellSize = isSmallScreen ? 32 : 36;
  else if (size <= 6) cellSize = isSmallScreen ? 48 : 56;

  const gapSize = size >= 10 ? 2 : 3;

  return (
    <div
      className="relative mx-auto rounded-[2rem] bg-white p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#EBE3D7]"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
        gap: `${gapSize}px`,
      }}
    >
      {board.map((row, r) =>
        row.map((cellState, c) => {
          const isInitial = level.initialBoard[r][c] !== ANIMAL_TYPE.EMPTY;
          const isInvalid = invalidCells.has(`${r},${c}`);

          return (
            <motion.div
              key={`${r}-${c}`}
              onClick={() => {
                if (!isInitial && !isWon) onCellClick(r, c);
              }}
              animate={isInvalid ? { x: [-2, 2, -2, 2, 0] } : {}}
              transition={{ duration: 0.3 }}
              className={`
                relative w-full h-full rounded-xl sm:rounded-2xl flex items-center justify-center
                transition-colors duration-200 select-none
                ${isInitial ? 'bg-[#F5F1EA]' : 'bg-[#FAF7F2] cursor-pointer'}
                ${isInvalid ? 'ring-2 ring-[#FF3B30] bg-[#FFF0F0]' : ''}
                ${!isInitial && !isWon ? 'hover:bg-[#F0EBE1] active:scale-95' : ''}
                border-2 ${isInitial ? 'border-[#EBE3D7]' : 'border-transparent shadow-inner'}
              `}
            >
              <AnimatePresence mode="popLayout">
                {cellState !== ANIMAL_TYPE.EMPTY && (
                  <motion.div
                    key={`${r}-${c}-${cellState}`}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="w-[80%] h-[80%] flex items-center justify-center"
                  >
                    {cellState === ANIMAL_TYPE.DOG && (
                      <span className="text-3xl" style={{ fontSize: cellSize * 0.6 }}>🐶</span>
                    )}
                    {cellState === ANIMAL_TYPE.CAT && (
                      <div className="w-full h-full scale-[1.3] pt-[15%]">
                         <CatLottie animationSpeed={0} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })
      )}
    </div>
  );
};
