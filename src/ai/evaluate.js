import { getAllLegalMoves, sideOf } from '../game/rules.js';

const PIECE_VALUES = {
  k: 10000,
  r: 900,
  n: 420,
  b: 200,
  a: 200,
  c: 450,
  p: 110,
};

const POSITION_BONUS = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [18, 36, 56, 80, 120, 80, 56, 36, 18],
    [14, 28, 42, 60, 90, 60, 42, 28, 14],
    [10, 20, 30, 44, 66, 44, 30, 20, 10],
    [8, 16, 24, 36, 50, 36, 24, 16, 8],
    [6, 12, 18, 24, 36, 24, 18, 12, 6],
    [4, 8, 12, 16, 20, 16, 12, 8, 4],
    [2, 4, 6, 8, 10, 8, 6, 4, 2],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  n: [
    [4, 8, 12, 14, 12, 14, 12, 8, 4],
    [8, 16, 24, 28, 32, 28, 24, 16, 8],
    [10, 18, 28, 36, 38, 36, 28, 18, 10],
    [10, 20, 30, 38, 42, 38, 30, 20, 10],
    [8, 18, 26, 34, 38, 34, 26, 18, 8],
    [8, 18, 26, 34, 38, 34, 26, 18, 8],
    [10, 20, 30, 38, 42, 38, 30, 20, 10],
    [10, 18, 28, 36, 38, 36, 28, 18, 10],
    [8, 16, 24, 28, 32, 28, 24, 16, 8],
    [4, 8, 12, 14, 12, 14, 12, 8, 4],
  ],
  r: Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => 10 + (4 - Math.abs(4 - col)) * 3 + (9 - row))
  ),
  c: Array.from({ length: 10 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => 6 + (4 - Math.abs(4 - col)) * 2 + (9 - row))
  ),
  b: Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => 0)),
  a: Array.from({ length: 10 }, () => Array.from({ length: 9 }, () => 0)),
  k: Array.from({ length: 10 }, (_, row) => Array.from({ length: 9 }, () => (row >= 7 || row <= 2 ? 12 : 0))),
};

function boardIndexForSide(side, row) {
  return side === 'red' ? row : 9 - row;
}

export function evaluateBoard(state, perspective = state.currentSide) {
  let score = 0;

  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const piece = state.board[row][col];
      if (!piece) continue;
      const side = sideOf(piece);
      const type = piece[1];
      const sign = side === perspective ? 1 : -1;
      const table = POSITION_BONUS[type];
      const posBonus = table ? table[boardIndexForSide(side, row)][col] : 0;
      score += sign * (PIECE_VALUES[type] + posBonus);
    }
  }

  const current = state.currentSide;
  state.currentSide = perspective;
  const myMobility = getAllLegalMoves(state, perspective).length;
  const oppMobility = getAllLegalMoves(state, perspective === 'red' ? 'black' : 'red').length;
  state.currentSide = current;

  score += (myMobility - oppMobility) * 2;
  if (state.winner === perspective) score += 50000;
  if (state.winner && state.winner !== perspective) score -= 50000;
  return score;
}
