import { AnimalType, ANIMAL_TYPE, PawBalanceLevel } from './types';

// Returns true if the entire board is valid (no empty spaces, matches rules)
// We don't just compare to the solution, because Takuzu boards can theoretically have multiple solutions
// if not enough clues are given. We check the rules directly.
export const isBoardWon = (grid: AnimalType[][], size: number): boolean => {
  // 1. Check for any empty cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === ANIMAL_TYPE.EMPTY) return false;
    }
  }

  // 2. Max 2 consecutive
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      if (grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r][c + 2]) return false;
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 2; r++) {
      if (grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 2][c]) return false;
    }
  }

  // 3. Equal counts
  const targetCount = size / 2;
  for (let r = 0; r < size; r++) {
    let dogCount = 0;
    let catCount = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === ANIMAL_TYPE.DOG) dogCount++;
      if (grid[r][c] === ANIMAL_TYPE.CAT) catCount++;
    }
    if (dogCount !== targetCount || catCount !== targetCount) return false;
  }

  for (let c = 0; c < size; c++) {
    let dogCount = 0;
    let catCount = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === ANIMAL_TYPE.DOG) dogCount++;
      if (grid[r][c] === ANIMAL_TYPE.CAT) catCount++;
    }
    if (dogCount !== targetCount || catCount !== targetCount) return false;
  }

  // 4. Unique rows and columns
  const rowStrs = new Set<string>();
  for (let r = 0; r < size; r++) {
    const s = grid[r].join('');
    if (rowStrs.has(s)) return false;
    rowStrs.add(s);
  }

  const colStrs = new Set<string>();
  for (let c = 0; c < size; c++) {
    let s = '';
    for (let r = 0; r < size; r++) {
      s += grid[r][c];
    }
    if (colStrs.has(s)) return false;
    colStrs.add(s);
  }

  return true;
};

// Returns a set of cell coordinates (e.g. "r,c") that violate the rules in the current state
export const getInvalidCells = (grid: AnimalType[][], size: number): Set<string> => {
  const invalid = new Set<string>();

  // Helper to mark cells
  const mark = (r: number, c: number) => invalid.add(`${r},${c}`);

  // 1. Consecutive violations (3 or more)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size - 2; c++) {
      if (grid[r][c] !== ANIMAL_TYPE.EMPTY &&
          grid[r][c] === grid[r][c + 1] &&
          grid[r][c] === grid[r][c + 2]) {
        mark(r, c); mark(r, c + 1); mark(r, c + 2);
      }
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size - 2; r++) {
      if (grid[r][c] !== ANIMAL_TYPE.EMPTY &&
          grid[r][c] === grid[r + 1][c] &&
          grid[r][c] === grid[r + 2][c]) {
        mark(r, c); mark(r + 1, c); mark(r + 2, c);
      }
    }
  }

  // 2. Count violations (more than size/2 of one animal)
  const targetCount = size / 2;
  for (let r = 0; r < size; r++) {
    let dogCount = 0, catCount = 0;
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === ANIMAL_TYPE.DOG) dogCount++;
      if (grid[r][c] === ANIMAL_TYPE.CAT) catCount++;
    }
    if (dogCount > targetCount || catCount > targetCount) {
      for (let c = 0; c < size; c++) {
        if ((dogCount > targetCount && grid[r][c] === ANIMAL_TYPE.DOG) ||
            (catCount > targetCount && grid[r][c] === ANIMAL_TYPE.CAT)) {
           mark(r, c);
        }
      }
    }
  }
  for (let c = 0; c < size; c++) {
    let dogCount = 0, catCount = 0;
    for (let r = 0; r < size; r++) {
      if (grid[r][c] === ANIMAL_TYPE.DOG) dogCount++;
      if (grid[r][c] === ANIMAL_TYPE.CAT) catCount++;
    }
    if (dogCount > targetCount || catCount > targetCount) {
      for (let r = 0; r < size; r++) {
        if ((dogCount > targetCount && grid[r][c] === ANIMAL_TYPE.DOG) ||
            (catCount > targetCount && grid[r][c] === ANIMAL_TYPE.CAT)) {
           mark(r, c);
        }
      }
    }
  }

  return invalid;
};
