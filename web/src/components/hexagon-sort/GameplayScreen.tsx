import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameState } from '@/lib/hexagon/useHexagonGame';
import { hexToPixel, coordKey } from '@/lib/hexagon/HexGrid';
import { HexBlock, HexCoord } from '@/lib/hexagon/types';
import { playTap } from '@/lib/soundEffects';

interface GameplayScreenProps {
  gameState: GameState;
  handleDrop: (blockId: string, pivotCoord: HexCoord) => boolean;
  onUndo: () => void;
  onShuffle: () => void;
  onHint: () => void;
  onPause: () => void;
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  gameState, handleDrop, onUndo, onShuffle, onHint, onPause
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [boardCenter, setBoardCenter] = useState({ x: 0, y: 0 });
  const HEX_SIZE = 18;

  useEffect(() => {
    if (boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      setBoardCenter({ x: rect.width / 2, y: rect.height / 2 });
    }
  }, []);

  // Helper to map board cells to SVG polygons
  const renderBoardCells = () => {
    const cells: React.ReactElement[] = [];
    gameState.board.cells.forEach((cell, key) => {
      const pos = hexToPixel(cell.coord, HEX_SIZE);
      cells.push(
        <polygon
          key={key}
          points={getHexPolygonPoints(HEX_SIZE)}
          transform={`translate(${boardCenter.x + pos.x}, ${boardCenter.y + pos.y})`}
          fill={cell.occupied ? cell.color : 'rgba(255,255,255,0.05)'}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          style={{ transition: 'fill 0.3s' }}
        />
      );
    });
    return cells;
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1c0f45] to-[#2a1b54] text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <button onClick={() => { playTap(); onPause(); }} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
          ⏸️
        </button>
        <div className="text-center">
          <p className="text-xs text-[#00ffff] font-bold">LEVEL {gameState.level}</p>
          <p className="text-xl font-black">{gameState.score}</p>
        </div>
        <div className="w-10 h-10"></div> {/* Spacer */}
      </div>

      {/* Board */}
      <div className="flex-1 w-full relative overflow-hidden" ref={boardRef}>
        <svg className="w-full h-full pointer-events-none">
          {boardCenter.x > 0 && renderBoardCells()}
        </svg>
      </div>

      {/* Block Tray */}
      <div className="h-40 bg-black/30 border-t border-white/10 flex items-center justify-around p-4 relative z-10">
        {gameState.availableBlocks.map(block => (
          <DraggableBlock key={block.id} block={block} hexSize={12} onDrop={(pos) => {
            // Very simplified coordinate mapping logic for demo
            if (!boardRef.current) return false;
            const rect = boardRef.current.getBoundingClientRect();

            // Map drop pixel coordinates relative to center
            const relX = pos.x - rect.left - boardCenter.x;
            const relY = pos.y - rect.top - boardCenter.y;

            // Calculate nearest Q/R
            const q = (Math.sqrt(3)/3 * relX - 1/3 * relY) / HEX_SIZE;
            const r = (2/3 * relY) / HEX_SIZE;

            return handleDrop(block.id, axialRound(q, r));
          }} />
        ))}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 flex gap-4">
        <ControlButton icon="↩️" label="Undo" onClick={onUndo} />
        <ControlButton icon="💡" label="Hint" onClick={onHint} />
        <ControlButton icon="🔀" label="Shuffle" onClick={onShuffle} />
      </div>
    </div>
  );
};

const DraggableBlock = ({ block, hexSize, onDrop }: { block: HexBlock, hexSize: number, onDrop: (pos: {x:number, y:number}) => boolean }) => {
  const handleDragEnd = (event: any, info: any) => {
    const success = onDrop({ x: info.point.x, y: info.point.y });
    // If not success, framer motion will naturally spring back if drag is constrained or we use useAnimation,
    // but for simplicity in this demo we rely on standard drag elasticity.
  };

  return (
    <motion.div
      drag
      dragSnapToOrigin={true}
      whileDrag={{ scale: 1.5, zIndex: 50 }}
      onDragEnd={handleDragEnd}
      className="relative cursor-grab active:cursor-grabbing w-16 h-16 flex items-center justify-center"
    >
      <svg width="64" height="64" className="overflow-visible pointer-events-none">
        <g transform="translate(32, 32)">
          {block.segments.map((seg, i) => {
            const pos = hexToPixel(seg.coord, hexSize);
            return (
              <polygon
                key={i}
                points={getHexPolygonPoints(hexSize)}
                transform={`translate(${pos.x}, ${pos.y})`}
                fill={block.color}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.5"
                className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
              />
            );
          })}
        </g>
      </svg>
    </motion.div>
  );
};

const ControlButton = ({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={() => { playTap(); onClick(); }}
    className="flex-1 bg-white/10 border border-white/20 rounded-xl py-3 flex flex-col items-center justify-center shadow-lg"
  >
    <span className="text-xl mb-1">{icon}</span>
    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{label}</span>
  </motion.button>
);

// Helpers
function getHexPolygonPoints(size: number): string {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle_deg = 60 * i - 30;
    const angle_rad = Math.PI / 180 * angle_deg;
    points.push(`${size * Math.cos(angle_rad)},${size * Math.sin(angle_rad)}`);
  }
  return points.join(' ');
}

function axialRound(fracQ: number, fracR: number): HexCoord {
  const fracS = -fracQ - fracR;
  let q = Math.round(fracQ);
  let r = Math.round(fracR);
  let s = Math.round(fracS);
  const qDiff = Math.abs(q - fracQ);
  const rDiff = Math.abs(r - fracR);
  const sDiff = Math.abs(s - fracS);
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}
