import { getAllLegalMoves, getPseudoLegalMoves, locateKing, sideOf } from '../game/rules.js';

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

function enemyOf(side) {
  return side === 'red' ? 'black' : 'red';
}

function isSquareAttackedBy(board, row, col, attackerSide) {
  for (let r = 0; r < board.length; r += 1) {
    for (let c = 0; c < board[r].length; c += 1) {
      const piece = board[r][c];
      if (!piece || sideOf(piece) !== attackerSide) continue;
      const moves = getPseudoLegalMoves(board, r, c);
      if (moves.some(([targetRow, targetCol]) => targetRow === row && targetCol === col)) {
        return true;
      }
    }
  }
  return false;
}

function exposedPiecePenalty(state, perspective) {
  const enemy = enemyOf(perspective);
  let penalty = 0;

  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const piece = state.board[row][col];
      if (!piece || sideOf(piece) !== perspective) continue;
      if (!isSquareAttackedBy(state.board, row, col, enemy)) continue;

      const value = PIECE_VALUES[piece[1]];
      const weight = piece[1] === 'r' ? 0.32 : piece[1] === 'c' || piece[1] === 'n' ? 0.24 : 0.12;
      penalty += Math.floor(value * weight);
    }
  }

  return penalty;
}

function kingSafetyScore(state, perspective) {
  const king = locateKing(state.board, perspective);
  if (!king) return -50000;

  const enemy = enemyOf(perspective);
  const [row, col] = king;
  let score = 0;

  if (isSquareAttackedBy(state.board, row, col, enemy)) {
    score -= 220;
  }

  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    const guard = state.board[nextRow]?.[nextCol];
    if (guard && sideOf(guard) === perspective) {
      score += 14;
    }
  }

  if (!state.board[row + (perspective === 'red' ? -1 : 1)]?.[col]) {
    score -= 18;
  }

  return score;
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
  score += kingSafetyScore(state, perspective);
  score -= exposedPiecePenalty(state, perspective);
  score -= kingSafetyScore(state, perspective === 'red' ? 'black' : 'red');
  score += exposedPiecePenalty(state, perspective === 'red' ? 'black' : 'red');
  if (state.winner === perspective) score += 50000;
  if (state.winner && state.winner !== perspective) score -= 50000;
  return score;
}

export { PIECE_VALUES };
