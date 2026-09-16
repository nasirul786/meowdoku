import { AnimalType, ANIMAL_TYPE, PawBalanceLevel } from './types';

// Utility to clone a grid
const cloneGrid = (grid: AnimalType[][]): AnimalType[][] => {
  return grid.map(row => [...row]);
};

// Check if placing value `val` at `(r, c)` violates any rules in the current grid
const isValidPlacement = (grid: AnimalType[][], size: number, r: number, c: number, val: AnimalType): boolean => {
  // 1. Max 2 consecutive same animals in a row
  if (c >= 2 && grid[r][c - 1] === val && grid[r][c - 2] === val) return false;
  // Lookahead for recursive backtracking, but during placement we just check left/right/up/down combinations
  if (c <= size - 3 && grid[r][c + 1] === val && grid[r][c + 2] === val) return false;
  if (c >= 1 && c <= size - 2 && grid[r][c - 1] === val && grid[r][c + 1] === val) return false;

  // Max 2 consecutive same animals in a col
  if (r >= 2 && grid[r - 1][c] === val && grid[r - 2][c] === val) return false;
  if (r <= size - 3 && grid[r + 1][c] === val && grid[r + 2][c] === val) return false;
  if (r >= 1 && r <= size - 2 && grid[r - 1][c] === val && grid[r + 1][c] === val) return false;

  // 2. Equal number of dogs (1) and cats (2) in a row/col
  let rowCount = 0;
  let colCount = 0;
  for (let i = 0; i < size; i++) {
    if (grid[r][i] === val) rowCount++;
    if (grid[i][c] === val) colCount++;
  }
  // The threshold is size / 2. We add 1 for the hypothetical placement we are testing.
  if (rowCount + 1 > size / 2) return false;
  if (colCount + 1 > size / 2) return false;

  // 3. Unique rows and columns
  // We can only fully check uniqueness if the row or col is fully populated.
  // For a row, we check if it's completely filled (except the current cell, which we are filling).
  let isRowFull = true;
  for (let i = 0; i < size; i++) {
    if (i !== c && grid[r][i] === ANIMAL_TYPE.EMPTY) {
      isRowFull = false;
      break;
    }
  }

  if (isRowFull) {
    // Construct the hypothetical string of the row
    let currentRowStr = '';
    for (let i = 0; i < size; i++) {
      currentRowStr += i === c ? val : grid[r][i];
    }
    // Compare with other fully filled rows
    for (let i = 0; i < r; i++) {
      let otherRowStr = grid[i].join('');
      if (currentRowStr === otherRowStr) return false;
    }
  }

  let isColFull = true;
  for (let i = 0; i < size; i++) {
    if (i !== r && grid[i][c] === ANIMAL_TYPE.EMPTY) {
      isColFull = false;
      break;
    }
  }

  if (isColFull) {
    let currentColStr = '';
    for (let i = 0; i < size; i++) {
      currentColStr += i === r ? val : grid[i][c];
    }
    for (let i = 0; i < c; i++) {
      let otherColStr = '';
      for (let j = 0; j < size; j++) {
        otherColStr += grid[j][i];
      }
      if (currentColStr === otherColStr) return false;
    }
  }

  return true;
};

// Backtracking function to generate a fully valid solved board
const solveBoard = (grid: AnimalType[][], size: number): boolean => {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === ANIMAL_TYPE.EMPTY) {
        // Randomize the order we try 1 (DOG) and 2 (CAT) to get varied boards
        const animals: AnimalType[] = Math.random() > 0.5 ? [ANIMAL_TYPE.DOG, ANIMAL_TYPE.CAT] : [ANIMAL_TYPE.CAT, ANIMAL_TYPE.DOG];

        for (const animal of animals) {
          if (isValidPlacement(grid, size, r, c, animal)) {
            grid[r][c] = animal;
            if (solveBoard(grid, size)) {
              return true;
            }
            grid[r][c] = ANIMAL_TYPE.EMPTY; // Backtrack
          }
        }
        return false; // If neither animal works, we must backtrack further up
      }
    }
  }
  return true; // Board is completely filled and valid
};

export const generateSolvedBoard = (size: number): AnimalType[][] | null => {
  // Ensure size is even and at least 4
  if (size % 2 !== 0 || size < 4) return null;

  const grid: AnimalType[][] = Array(size).fill(0).map(() => Array(size).fill(ANIMAL_TYPE.EMPTY));
  const success = solveBoard(grid, size);
  return success ? grid : null;
};

// "Poke holes" in a solved board to create a playable puzzle
// difficulty 0-1, represents percentage of board to clear
export const generatePlayableLevel = (size: number, id: number, difficulty: number = 0.5): PawBalanceLevel | null => {
  const solution = generateSolvedBoard(size);
  if (!solution) return null;

  const initialBoard = cloneGrid(solution);
  const totalCells = size * size;

  // Decide how many cells to empty based on difficulty.
  // Typically a 6x6 (36) might need 12-20 clues to be uniquely solvable.
  // We'll aim to remove between 40% (easy) to 60% (hard) of the cells.
  const cellsToRemove = Math.floor(totalCells * difficulty);

  let removed = 0;
  // A simple approach: Randomly pick cells, remove them.
  // In a robust generator, we'd verify the puzzle still has a *unique* solution after each removal.
  // For the sake of this implementation, we will just randomly remove.
  const attempts = totalCells * 2;
  let attempt = 0;

  while (removed < cellsToRemove && attempt < attempts) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);

    if (initialBoard[r][c] !== ANIMAL_TYPE.EMPTY) {
      initialBoard[r][c] = ANIMAL_TYPE.EMPTY;
      removed++;
    }
    attempt++;
  }

  return {
    id,
    size,
    initialBoard,
    solution
  };
};
