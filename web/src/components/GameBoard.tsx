'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LevelData, CellState } from '@/lib/types';
import { getRegionColor } from '@/lib/colorPalette';
import { triggerHaptic } from '@/lib/haptics';
import { playCross, playUncross, playCatMeow, playHeartBreak } from '@/lib/soundEffects';
import { CatLottie } from './CatLottie';

interface BrokenHeartAnimation {
  id: string;
  r: number;
  c: number;
}

interface GameBoardProps {
  level: LevelData;
  board: CellState[][];
  onBoardChange: (newBoard: CellState[][]) => void;
  onLoseFish: () => void;
  isWon: boolean;
  onCellAction?: (action: 'cross' | 'uncross' | 'cat', r: number, c: number) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  level,
  board,
  onBoardChange,
  onLoseFish,
  isWon,
  onCellAction,
}) => {
  const size = level.size;
  const [brokenHearts, setBrokenHearts] = useState<BrokenHeartAnimation[]>([]);
  const [shakingCells, setShakingCells] = useState<Set<string>>(new Set());
  const [invalidCrosses, setInvalidCrosses] = useState<Set<string>>(new Set());

  // Tracking for instant cross, double-tap cat detection, and uncross delays
  const lastCellTapRef = useRef<{ [key: string]: number }>({});
  const uncrossTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  // Reset timers and invalid crosses when level changes
  React.useEffect(() => {
    setInvalidCrosses(new Set());
    Object.values(uncrossTimeoutRef.current).forEach(t => clearTimeout(t));
    uncrossTimeoutRef.current = {};
    lastCellTapRef.current = {};
  }, [level]);

  // Drag / swipe state for sliding across multiple cells
  const isDraggingRef = useRef<boolean>(false);
  const justFinishedDragRef = useRef<boolean>(false);
  const dragModeRef = useRef<'cross' | 'uncross' | null>(null);
  const dragStartCoordRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const sweptCellsRef = useRef<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredLongPressRef = useRef<boolean>(false);
  const longPressCellRef = useRef<{ r: number; c: number } | null>(null);
  const currentBoardRef = useRef<CellState[][]>(board);
  currentBoardRef.current = board;

  const applyCellSweep = (r: number, c: number, mode: 'cross' | 'uncross') => {
    if (isWon) return;
    const key = `${r},${c}`;
    // Red crosses can NEVER be modified or uncrossed
    if (invalidCrosses.has(key)) return;
    if (sweptCellsRef.current.has(key)) return;
    sweptCellsRef.current.add(key);

    const curVal = currentBoardRef.current[r][c];

    if (mode === 'cross') {
      if (curVal === 0) {
        playCross();
        triggerHaptic('light');

        const newBoard = currentBoardRef.current.map(row => [...row]);
        newBoard[r][c] = 1;
        currentBoardRef.current = newBoard;
        onBoardChange(newBoard);
        onCellAction?.('cross', r, c);
      }
    } else if (mode === 'uncross') {
      if (curVal === 1 && !invalidCrosses.has(key)) {
        if (uncrossTimeoutRef.current[key]) {
          clearTimeout(uncrossTimeoutRef.current[key]);
          delete uncrossTimeoutRef.current[key];
        }
        playUncross();
        triggerHaptic('light');

        const newBoard = currentBoardRef.current.map(row => [...row]);
        newBoard[r][c] = 0;
        currentBoardRef.current = newBoard;
        onBoardChange(newBoard);
        onCellAction?.('uncross', r, c);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isWon) return;
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-cell]');
    if (el) {
      const r = Number(el.getAttribute('data-r'));
      const c = Number(el.getAttribute('data-c'));
      if (!isNaN(r) && !isNaN(c)) {
        const key = `${r},${c}`;
        if (invalidCrosses.has(key)) return;

        dragStartCoordRef.current = { r, c, x: touch.clientX, y: touch.clientY };
        isDraggingRef.current = false;
        dragModeRef.current = null;
        sweptCellsRef.current.clear();
        hasTriggeredLongPressRef.current = false;
        longPressCellRef.current = { r, c };

        // Start long-press timer to place/remove cat if held without dragging
        const curVal = currentBoardRef.current[r][c];
        if (curVal === 0 || curVal === 1 || curVal === 2) {
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = setTimeout(() => {
            if (!isDraggingRef.current && longPressCellRef.current) {
              hasTriggeredLongPressRef.current = true;
              const { r: lpR, c: lpC } = longPressCellRef.current;
              const lpKey = `${lpR},${lpC}`;
              if (!invalidCrosses.has(lpKey)) {
                if (curVal === 2) {
                  // Hold on cat: remove it (like double-tap)
                  playUncross();
                  triggerHaptic('light');
                  const newBoard = currentBoardRef.current.map(row => [...row]);
                  newBoard[lpR][lpC] = 0;
                  currentBoardRef.current = newBoard;
                  onBoardChange(newBoard);
                  onCellAction?.('uncross', lpR, lpC);
                } else {
                  // Hold on empty or cross: attempt place cat
                  attemptPlaceCat(lpR, lpC);
                }
              }
            }
          }, 330);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isWon || !dragStartCoordRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const start = dragStartCoordRef.current;
    const dist = Math.hypot(touch.clientX - start.x, touch.clientY - start.y);

    if (longPressTimerRef.current && dist > 8) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      longPressCellRef.current = null;
    }

    const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-cell]');
    const currentR = el ? Number(el.getAttribute('data-r')) : null;
    const currentC = el ? Number(el.getAttribute('data-c')) : null;

    const movedToDifferentCell =
      currentR !== null &&
      currentC !== null &&
      !isNaN(currentR) &&
      !isNaN(currentC) &&
      (currentR !== start.r || currentC !== start.c);

    if (!isDraggingRef.current && (dist > 6 || movedToDifferentCell)) {
      isDraggingRef.current = true;
      const startVal = currentBoardRef.current[start.r][start.c];
      const mode = startVal === 1 ? 'uncross' : 'cross';
      dragModeRef.current = mode;

      const startKey = `${start.r},${start.c}`;
      if (uncrossTimeoutRef.current[startKey]) {
        clearTimeout(uncrossTimeoutRef.current[startKey]);
        delete uncrossTimeoutRef.current[startKey];
      }

      applyCellSweep(start.r, start.c, mode);
    }

    if (isDraggingRef.current && dragModeRef.current) {
      if (
        currentR !== null &&
        currentC !== null &&
        !isNaN(currentR) &&
        !isNaN(currentC)
      ) {
        applyCellSweep(currentR, currentC, dragModeRef.current);
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      longPressCellRef.current = null;
    }

    if (isDraggingRef.current) {
      justFinishedDragRef.current = true;
      setTimeout(() => {
        justFinishedDragRef.current = false;
      }, 120);
    }

    if (hasTriggeredLongPressRef.current) {
      setTimeout(() => {
        hasTriggeredLongPressRef.current = false;
      }, 150);
    }

    isDraggingRef.current = false;
    dragModeRef.current = null;
    dragStartCoordRef.current = null;
    sweptCellsRef.current.clear();
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || isWon || e.button !== 0) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]');
    if (el) {
      const r = Number(el.getAttribute('data-r'));
      const c = Number(el.getAttribute('data-c'));
      if (!isNaN(r) && !isNaN(c)) {
        const key = `${r},${c}`;
        if (invalidCrosses.has(key)) return;

        dragStartCoordRef.current = { r, c, x: e.clientX, y: e.clientY };
        isDraggingRef.current = false;
        dragModeRef.current = null;
        sweptCellsRef.current.clear();
        hasTriggeredLongPressRef.current = false;
        longPressCellRef.current = { r, c };

        // Start long-press timer to place/remove cat if held without dragging
        const curVal = currentBoardRef.current[r][c];
        if (curVal === 0 || curVal === 1 || curVal === 2) {
          if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = setTimeout(() => {
            if (!isDraggingRef.current && longPressCellRef.current) {
              hasTriggeredLongPressRef.current = true;
              const { r: lpR, c: lpC } = longPressCellRef.current;
              const lpKey = `${lpR},${lpC}`;
              if (!invalidCrosses.has(lpKey)) {
                if (curVal === 2) {
                  // Hold on cat: remove it (like double-tap)
                  playUncross();
                  triggerHaptic('light');
                  const newBoard = currentBoardRef.current.map(row => [...row]);
                  newBoard[lpR][lpC] = 0;
                  currentBoardRef.current = newBoard;
                  onBoardChange(newBoard);
                  onCellAction?.('uncross', lpR, lpC);
                } else {
                  // Hold on empty or cross: attempt place cat
                  attemptPlaceCat(lpR, lpC);
                }
              }
            }
          }, 330);
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || isWon || !dragStartCoordRef.current || e.buttons !== 1) return;

    // Cancel long-press if moved too far
    if (longPressTimerRef.current && dragStartCoordRef.current) {
      const dist = Math.hypot(e.clientX - dragStartCoordRef.current.x, e.clientY - dragStartCoordRef.current.y);
      if (dist > 8) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        longPressCellRef.current = null;
      }
    }

    const start = dragStartCoordRef.current;
    const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);

    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-cell]');
    const currentR = el ? Number(el.getAttribute('data-r')) : null;
    const currentC = el ? Number(el.getAttribute('data-c')) : null;

    const movedToDifferentCell =
      currentR !== null &&
      currentC !== null &&
      !isNaN(currentR) &&
      !isNaN(currentC) &&
      (currentR !== start.r || currentC !== start.c);

    if (!isDraggingRef.current && (dist > 6 || movedToDifferentCell)) {
      isDraggingRef.current = true;
      const startVal = currentBoardRef.current[start.r][start.c];
      const mode = startVal === 1 ? 'uncross' : 'cross';
      dragModeRef.current = mode;

      const startKey = `${start.r},${start.c}`;
      if (uncrossTimeoutRef.current[startKey]) {
        clearTimeout(uncrossTimeoutRef.current[startKey]);
        delete uncrossTimeoutRef.current[startKey];
      }

      // Clear long-press when drag starts
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        longPressCellRef.current = null;
      }

      applyCellSweep(start.r, start.c, mode);
    }

    if (isDraggingRef.current && dragModeRef.current) {
      if (
        currentR !== null &&
        currentC !== null &&
        !isNaN(currentR) &&
        !isNaN(currentC)
      ) {
        applyCellSweep(currentR, currentC, dragModeRef.current);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      longPressCellRef.current = null;
    }

    if (isDraggingRef.current) {
      justFinishedDragRef.current = true;
      setTimeout(() => {
        justFinishedDragRef.current = false;
      }, 120);
    }
    isDraggingRef.current = false;
    dragModeRef.current = null;
    dragStartCoordRef.current = null;
    sweptCellsRef.current.clear();
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    
    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      longPressCellRef.current = null;
    }

    if (isDraggingRef.current) {
      justFinishedDragRef.current = true;
      setTimeout(() => {
        justFinishedDragRef.current = false;
      }, 120);
    }
    isDraggingRef.current = false;
    dragModeRef.current = null;
    dragStartCoordRef.current = null;
    sweptCellsRef.current.clear();
  };

  const validateCatPlacement = (r: number, c: number): boolean => {
    // 1. Must match solution
    if (level.solution[r] !== c) return false;

    // 2. Must not violate row, column, or color region with existing cats
    const reg = level.regionMap[r][c];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === 2 && (row !== r || col !== c)) {
          // Same row, col, or region
          if (row === r || col === c || level.regionMap[row][col] === reg) return false;
          // 8 adjacent neighbors
          if (Math.abs(row - r) <= 1 && Math.abs(col - c) <= 1) return false;
        }
      }
    }

    return true;
  };

  const triggerErrorAnimation = (r: number, c: number) => {
    const key = `${r},${c}`;
    playHeartBreak();
    triggerHaptic('error');

    // Add shaking cell
    setShakingCells(prev => new Set(prev).add(key));
    setTimeout(() => {
      setShakingCells(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 450);

    // Add floating broken heart
    const heartId = `${key}-${Date.now()}`;
    setBrokenHearts(prev => [...prev, { id: heartId, r, c }]);
    setTimeout(() => {
      setBrokenHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1200);

    // Deduct 1 fish life
    onLoseFish();
  };

  const attemptPlaceCat = (r: number, c: number) => {
    if (isWon) return;
    const key = `${r},${c}`;
    if (invalidCrosses.has(key)) return;

    if (uncrossTimeoutRef.current[key]) {
      clearTimeout(uncrossTimeoutRef.current[key]);
      delete uncrossTimeoutRef.current[key];
    }

    const isValid = validateCatPlacement(r, c);

    if (!isValid) {
      // Invalid cat placement: automatically place Red Cross and trigger error/lose fish!
      // Once placed, red cross can NEVER be uncrossed!
      setInvalidCrosses(prev => new Set(prev).add(key));
      const newBoard = currentBoardRef.current.map(row => [...row]);
      newBoard[r][c] = 1; // Mark as Cross
      currentBoardRef.current = newBoard;
      onBoardChange(newBoard);
      triggerErrorAnimation(r, c);
      onCellAction?.('cross', r, c);
    } else {
      // Valid cat placement!
      playCatMeow();
      triggerHaptic('medium');
      const newBoard = currentBoardRef.current.map(row => [...row]);
      newBoard[r][c] = 2; // Mark as Cat
      currentBoardRef.current = newBoard;
      onBoardChange(newBoard);
      onCellAction?.('cat', r, c);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    const key = `${r},${c}`;
    if (isWon || invalidCrosses.has(key)) return;

    if (board[r][c] === 2) {
      // Right click removes cat if placed by mistake
      playUncross();
      triggerHaptic('light');
      const newBoard = currentBoardRef.current.map(row => [...row]);
      newBoard[r][c] = 0;
      currentBoardRef.current = newBoard;
      onBoardChange(newBoard);
      onCellAction?.('uncross', r, c);
      return;
    }

    attemptPlaceCat(r, c);
  };

  const handleCellInteraction = (r: number, c: number) => {
    if (isWon || justFinishedDragRef.current || hasTriggeredLongPressRef.current) return;
    const key = `${r},${c}`;
    const currentVal = board[r][c];

    // 1. Red crosses (invalid cats) can NEVER be uncrossed or modified
    if (invalidCrosses.has(key)) {
      return;
    }

    const now = Date.now();
    const lastTap = lastCellTapRef.current[key] || 0;
    const isDoubleTap = now - lastTap < 340;
    lastCellTapRef.current[key] = now;

    // 2. Single touch on Cat CANNOT remove it!
    if (currentVal === 2) {
      if (isDoubleTap) {
        // Deliberate double-tap on an existing cat allows player to pick it back up
        playUncross();
        triggerHaptic('light');
        const newBoard = currentBoardRef.current.map(row => [...row]);
        newBoard[r][c] = 0;
        currentBoardRef.current = newBoard;
        onBoardChange(newBoard);
        onCellAction?.('uncross', r, c);
      }
      // Single touch on Cat does nothing (protected!)
      return;
    }

    // 3. Cell is a normal Cross (1)
    if (currentVal === 1) {
      if (uncrossTimeoutRef.current[key]) {
        clearTimeout(uncrossTimeoutRef.current[key]);
        delete uncrossTimeoutRef.current[key];
      }

      if (isDoubleTap) {
        // Double-click on cell with cross reveals Cat (or invalidates if illegal)!
        attemptPlaceCat(r, c);
        return;
      }

      // Single click on cross: queue uncross (with short 220ms grace window so double-click cancels it)
      uncrossTimeoutRef.current[key] = setTimeout(() => {
        delete uncrossTimeoutRef.current[key];
        if (currentBoardRef.current[r][c] === 1 && !invalidCrosses.has(key)) {
          playUncross();
          triggerHaptic('light');
          const newBoard = currentBoardRef.current.map(row => [...row]);
          newBoard[r][c] = 0;
          currentBoardRef.current = newBoard;
          onBoardChange(newBoard);
          onCellAction?.('uncross', r, c);
        }
      }, 220);
      return;
    }

    // 4. Cell is Empty (0)
    if (currentVal === 0) {
      if (isDoubleTap) {
        // Double click on empty cell reveals Cat!
        attemptPlaceCat(r, c);
        return;
      }

      // Single click on empty cell: INSTANT CROSS with 0ms delay!
      playCross();
      triggerHaptic('light');
      const newBoard = currentBoardRef.current.map(row => [...row]);
      newBoard[r][c] = 1;
      currentBoardRef.current = newBoard;
      onBoardChange(newBoard);
      onCellAction?.('cross', r, c);
      return;
    }
  };

  // Gap sizing depending on grid dimension (tight, minimal margins matching Image)
  const gapClass =
    size <= 5 ? 'gap-2.5' : size <= 7 ? 'gap-2' : size <= 9 ? 'gap-1.5' : 'gap-1';

  const cellRoundedClass =
    size <= 5 ? 'rounded-xl' : size <= 7 ? 'rounded-lg' : 'rounded-md';

  return (
    <div className="w-full max-w-[min(96vw,52vh,420px)] mx-auto aspect-square flex items-center justify-center select-none">
      {/* Board Container with clean narrow white border matching Image */}
      <div className="relative w-full h-full bg-white rounded-[28px] sm:rounded-3xl flex items-center justify-center p-2.5 sm:p-3">
        {/* Grid Area */}
        <div
          className={`w-full h-full grid ${gapClass} touch-none`}
          style={{
            gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
            touchAction: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          {board.map((row, r) =>
            row.map((cellState, c) => {
              const key = `${r},${c}`;
              const regId = level.regionMap[r][c];
              const colorInfo = getRegionColor(regId);
              const isShaking = shakingCells.has(key);
              const isRedCross = cellState === 1 && invalidCrosses.has(key);

              // Diagonal wave appearance delay: bottom-left (size-1, 0) to top-right (0, size-1)
              const stepDelay = size <= 5 ? 0.045 : size <= 7 ? 0.035 : 0.025;
              const waveDistance = (size - 1 - r) + c;
              const delay = waveDistance * stepDelay;

              return (
                <motion.button
                  key={key}
                  data-cell="true"
                  data-r={r}
                  data-c={c}
                  initial={{ scale: 0.25, y: 16, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 24,
                    delay,
                  }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleCellInteraction(r, c)}
                  onContextMenu={(e) => handleContextMenu(e, r, c)}
                  className={`relative flex items-center justify-center cursor-pointer ${cellRoundedClass} ${
                    isShaking ? 'animate-error-shake ring-2 ring-red-500' : ''
                  }`}
                  style={{
                    backgroundColor: colorInfo.hex,
                  }}
                >
                  {/* Cell Content: Empty (0), Cross (1), Cat (2) */}
                  {cellState === 2 ? (
                    // Cat Lottie Animation (plays 1 time on reveal, no loop)
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="w-full h-full flex items-center justify-center p-0.5 pointer-events-none"
                    >
                      <CatLottie className="w-full h-full max-w-[88%] max-h-[88%]" />
                    </motion.div>
                  ) : cellState === 1 ? (
                    // Cross (Big bold rounded SVG cross: White for normal, Coral-Red for invalid cat placement)
                    <motion.div
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                      className="w-full h-full flex items-center justify-center pointer-events-none select-none"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`w-[66%] h-[66%] max-w-full max-h-full ${
                          isRedCross ? 'text-[#FA4E30]' : 'text-white'
                        } drop-shadow-xs`}
                      >
                        <path
                          d="M5.5 5.5L18.5 18.5M5.5 18.5L18.5 5.5"
                          stroke="currentColor"
                          strokeWidth="3.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  ) : null}

                  {/* Broken Heart Animation floating up on invalid attempt */}
                  <AnimatePresence>
                    {brokenHearts
                      .filter(h => h.r === r && h.c === c)
                      .map(h => (
                        <motion.div
                          key={h.id}
                          initial={{ opacity: 0, scale: 0.5, y: 0 }}
                          animate={{ opacity: 1, scale: 1.4, y: -36 }}
                          exit={{ opacity: 0, scale: 0.8, y: -55 }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="absolute z-30 text-3xl sm:text-4xl pointer-events-none filter drop-shadow-md"
                        >
                          💔
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </motion.button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
