import { HexBlock, HexCoord, HexBoard } from './types';
import { coordKey } from './HexGrid';

// Define a set of standard colors matching the required UI
export const HEX_COLORS = [
  '#00ffff', // Cyan
  '#8a2be2', // Purple
  '#ff1493', // Pink
  '#00ff00', // Green
  '#ff8c00', // Orange
  '#ffd700', // Yellow
  '#1e90ff', // Blue
  '#ff4500'  // Red
];

// Define common shapes (relative to 0,0 pivot)
export const SHAPES: { [key: string]: HexCoord[] } = {
  SINGLE: [
    { q: 0, r: 0 }
  ],
  PAIR: [
    { q: 0, r: 0 },
    { q: 1, r: -1 }
  ],
  TRIANGLE: [
    { q: 0, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 }
  ],
  LINE_3: [
    { q: 0, r: 0 },
    { q: 1, r: -1 },
    { q: 2, r: -2 }
  ],
  CLUSTER: [
    { q: 0, r: 0 },
    { q: 1, r: -1 },
    { q: 0, r: -1 },
    { q: -1, r: 0 }
  ]
};

// Create a new block with a random color and shape
export const generateRandomBlock = (id: string): HexBlock => {
  const shapeKeys = Object.keys(SHAPES);
  const randomShapeKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
  const randomColor = HEX_COLORS[Math.floor(Math.random() * HEX_COLORS.length)];

  return {
    id,
    color: randomColor,
    segments: SHAPES[randomShapeKey].map(coord => ({ coord })),
    locked: false
  };
};

// Check if a block can be placed at a target cell (targetKey represents the board cell where the 0,0 pivot lands)
export const canPlaceBlock = (board: HexBoard, block: HexBlock, pivotCoord: HexCoord): boolean => {
  for (const segment of block.segments) {
    const targetQ = pivotCoord.q + segment.coord.q;
    const targetR = pivotCoord.r + segment.coord.r;
    const tKey = coordKey(targetQ, targetR);

    // Check if within bounds and cell exists
    if (!board.cells.has(tKey)) return false;

    // Check if cell is empty
    const cell = board.cells.get(tKey);
    if (!cell || cell.occupied || cell.isHole) return false;
  }
  return true;
};

// Return a new board state with the block placed
export const placeBlock = (board: HexBoard, block: HexBlock, pivotCoord: HexCoord): HexBoard => {
  const newCells = new Map(board.cells);

  for (const segment of block.segments) {
    const targetQ = pivotCoord.q + segment.coord.q;
    const targetR = pivotCoord.r + segment.coord.r;
    const tKey = coordKey(targetQ, targetR);

    newCells.set(tKey, {
      coord: { q: targetQ, r: targetR },
      occupied: true,
      color: block.color
    });
  }

  return {
    size: board.size,
    cells: newCells
  };
};
