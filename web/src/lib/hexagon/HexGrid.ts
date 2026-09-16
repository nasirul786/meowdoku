import { HexCoord, HexBoard, HexCell } from './types';

// Convert q,r to a string key
export const coordKey = (q: number, r: number): string => `${q},${r}`;
export const keyToCoord = (key: string): HexCoord => {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
};

// Neighbor offsets in axial coordinates
const hexDirections = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
];

export const getNeighbors = (coord: HexCoord): HexCoord[] => {
  return hexDirections.map(dir => ({
    q: coord.q + dir.q,
    r: coord.r + dir.r
  }));
};

// Generate an empty board of a given radius
export const generateEmptyBoard = (radius: number): HexBoard => {
  const cells = new Map<string, HexCell>();

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);

    for (let r = r1; r <= r2; r++) {
      cells.set(coordKey(q, r), {
        coord: { q, r },
        occupied: false,
      });
    }
  }

  return { size: radius, cells };
};

// Get connected cluster starting from a coord (BFS)
export const getConnectedCluster = (board: HexBoard, startKey: string): string[] => {
  const startCell = board.cells.get(startKey);
  if (!startCell || !startCell.occupied) return [];

  const targetColor = startCell.color;
  const visited = new Set<string>();
  const queue: string[] = [startKey];
  const cluster: string[] = [];

  while (queue.length > 0) {
    const currentKey = queue.shift()!;
    if (visited.has(currentKey)) continue;

    visited.add(currentKey);
    const cell = board.cells.get(currentKey);

    if (cell && cell.occupied && cell.color === targetColor) {
      cluster.push(currentKey);

      const neighbors = getNeighbors(cell.coord);
      for (const neighbor of neighbors) {
        const nKey = coordKey(neighbor.q, neighbor.r);
        if (board.cells.has(nKey) && !visited.has(nKey)) {
          queue.push(nKey);
        }
      }
    }
  }

  return cluster;
};

// Calculate Pixel Coordinates from Hex (Pointy top)
// size is the radius of the hexagon in pixels
export const hexToPixel = (coord: HexCoord, size: number): { x: number, y: number } => {
  const x = size * Math.sqrt(3) * (coord.q + coord.r / 2);
  const y = size * 3/2 * coord.r;
  return { x, y };
};

// Convert Pixel to Hex (Pointy top)
export const pixelToHex = (x: number, y: number, size: number): HexCoord => {
  const q = (Math.sqrt(3)/3 * x - 1/3 * y) / size;
  const r = (2/3 * y) / size;
  return axialRound(q, r);
};

// Round fractional hex coordinates to nearest integer hex
const axialRound = (fracQ: number, fracR: number): HexCoord => {
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
};
