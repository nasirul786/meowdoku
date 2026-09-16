// PawBalance / Takuzu (Binairo) Types

export type AnimalType = 0 | 1 | 2; // 0 = empty, 1 = dog, 2 = cat

export const ANIMAL_TYPE = {
  EMPTY: 0 as AnimalType,
  DOG: 1 as AnimalType,
  CAT: 2 as AnimalType,
} as const;

export interface PawBalanceLevel {
  id: number;
  size: number;
  initialBoard: AnimalType[][]; // The board as presented to the user
  solution: AnimalType[][];     // The solved board
}

export interface PawBalanceBoardState {
  grid: AnimalType[][];
  size: number;
  isWon: boolean;
}
