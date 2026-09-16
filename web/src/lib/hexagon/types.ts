// Axial Coordinate System
export interface HexCoord {
  q: number; // column
  r: number; // row
}

// Hex Cell Data
export interface HexCell {
  coord: HexCoord;
  occupied: boolean;
  color?: string; // If occupied, what color is it?
  isHole?: boolean; // If true, this cell cannot be placed on
}

// A single segment of a Block
export interface BlockSegment {
  coord: HexCoord; // Relative to a pivot (0,0)
}

// A full Placeable Block (e.g. 1 hex, 2 hexes, triangle, line)
export interface HexBlock {
  id: string;
  color: string;
  segments: BlockSegment[];
  locked?: boolean;
}

// Board State
export interface HexBoard {
  size: number; // Radius of the board (e.g., 3 means 3 rings from center)
  cells: Map<string, HexCell>; // Key is "q,r"
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: string;
}

export interface HexGameProfile {
  telegramId: string;
  currentLevel: number;
  totalScore: number;
  levelsCompleted: number;
  bestScore: number;
  premiumThemesUnlocked: string[];
  hasRemovedAds: boolean;
  hints: number;
  undos: number;
  shuffles: number;
}
