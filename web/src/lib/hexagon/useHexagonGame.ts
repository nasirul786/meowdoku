import { useState, useCallback, useEffect } from 'react';
import { HexBoard, HexBlock, HexCoord } from './types';
import { generateEmptyBoard, getConnectedCluster, coordKey } from './HexGrid';
import { generateRandomBlock, canPlaceBlock, placeBlock } from './BlockEngine';
import { triggerHaptic } from '@/lib/haptics';
import { playTap, playWin, playFail } from '@/lib/soundEffects';

export interface GameState {
  board: HexBoard;
  availableBlocks: HexBlock[];
  score: number;
  history: HexBoard[];
  level: number;
  isGameOver: boolean;
  handleDrop: (blockId: string, pivotCoord: HexCoord) => boolean;
  undo: () => void;
  shuffle: () => void;
  hint: () => void;
  resetBoard: () => void;
  advanceLevel: () => void;
  canUndo: boolean;
}

export const useHexagonGame = (initialRadius: number = 3): GameState => {
  const [board, setBoard] = useState<HexBoard>(generateEmptyBoard(initialRadius));
  const [availableBlocks, setAvailableBlocks] = useState<HexBlock[]>([]);
  const [score, setScore] = useState<number>(0);
  const [history, setHistory] = useState<HexBoard[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Initialize blocks
  useEffect(() => {
    if (availableBlocks.length === 0 && !isGameOver) {
      setAvailableBlocks([
        generateRandomBlock(`block-${Date.now()}-1`),
        generateRandomBlock(`block-${Date.now()}-2`),
        generateRandomBlock(`block-${Date.now()}-3`)
      ]);
    }
  }, [availableBlocks, isGameOver]);

  const handleDrop = useCallback((blockId: string, pivotCoord: HexCoord) => {
    const block = availableBlocks.find(b => b.id === blockId);
    if (!block) return false;

    if (canPlaceBlock(board, block, pivotCoord)) {
      // Save history for Undo
      setHistory(prev => [...prev, board].slice(-5)); // Keep last 5 moves

      // Place block
      let newBoard = placeBlock(board, block, pivotCoord);

      // Calculate matches and clear them
      let clearedCells = 0;
      let cellsToClear = new Set<string>();

      // Naive matching: if connected cluster is >= 5 cells, clear it
      newBoard.cells.forEach((cell, key) => {
        if (cell.occupied && !cellsToClear.has(key)) {
          const cluster = getConnectedCluster(newBoard, key);
          if (cluster.length >= 5) {
            cluster.forEach(k => cellsToClear.add(k));
          }
        }
      });

      if (cellsToClear.size > 0) {
        const nextCells = new Map(newBoard.cells);
        cellsToClear.forEach(key => {
          const cell = nextCells.get(key)!;
          nextCells.set(key, { ...cell, occupied: false, color: undefined });
        });
        newBoard = { ...newBoard, cells: nextCells };
        clearedCells = cellsToClear.size;
        playWin(); // Sound effect for clearing
        triggerHaptic('success');
      } else {
        playTap();
        triggerHaptic('light');
      }

      setBoard(newBoard);
      setScore(prev => prev + block.segments.length * 10 + clearedCells * 20);

      // Remove used block
      setAvailableBlocks(prev => prev.filter(b => b.id !== blockId));

      // Level progression logic placeholder
      if (score > level * 1000) {
        setLevel(prev => prev + 1);
      }

      return true;
    }

    playFail();
    triggerHaptic('error');
    return false;
  }, [availableBlocks, board, score, level]);

  const undo = useCallback(() => {
    if (history.length > 0) {
      const prevBoard = history[history.length - 1];
      setBoard(prevBoard);
      setHistory(prev => prev.slice(0, -1));
      triggerHaptic('medium');
    }
  }, [history]);

  const shuffle = useCallback(() => {
    setAvailableBlocks([
      generateRandomBlock(`block-${Date.now()}-1`),
      generateRandomBlock(`block-${Date.now()}-2`),
      generateRandomBlock(`block-${Date.now()}-3`)
    ]);
    triggerHaptic('medium');
  }, []);

  const hint = useCallback(() => {
    triggerHaptic('light');
    // Implement hint logic (e.g., highlight a valid drop zone)
  }, []);

  const resetBoard = useCallback(() => {
    setBoard(generateEmptyBoard(initialRadius));
    setAvailableBlocks([
      generateRandomBlock(`block-${Date.now()}-1`),
      generateRandomBlock(`block-${Date.now()}-2`),
      generateRandomBlock(`block-${Date.now()}-3`)
    ]);
    setHistory([]);
  }, [initialRadius]);

  const advanceLevel = useCallback(() => {
    setLevel(prev => prev + 1);
    resetBoard();
  }, [resetBoard]);

  return {
    board,
    availableBlocks,
    score,
    history,
    level,
    isGameOver,
    handleDrop,
    undo,
    shuffle,
    hint,
    resetBoard,
    advanceLevel,
    canUndo: history.length > 0
  };
};
