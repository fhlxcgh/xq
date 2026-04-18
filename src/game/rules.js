import { COLS, ROWS } from './constants.js';
import { cloneBoard } from './state.js';

function inside(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function sideOf(piece) {
  return piece?.[0] === 'r' ? 'red' : piece?.[0] === 'b' ? 'black' : null;
}

function enemyOf(side) {
  return side === 'red' ? 'black' : 'red';
}

function isOwnPiece(board, side, row, col) {
  return sideOf(board[row]?.[col]) === side;
}

function pushIfValid(board, side, moves, row, col) {
  if (!inside(row, col) || isOwnPiece(board, side, row, col)) return;
  moves.push([row, col]);
}

function inPalace(side, row, col) {
  const rowRange = side === 'red' ? [7, 9] : [0, 2];
  return row >= rowRange[0] && row <= rowRange[1] && col >= 3 && col <= 5;
}

function crossedRiver(side, row) {
  return side === 'red' ? row <= 4 : row >= 5;
}

function locateKing(board, side) {
  const target = side === 'red' ? 'rk' : 'bk';
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (board[row][col] === target) return [row, col];
    }
  }
  return null;
}

function generalsFacing(board) {
  const red = locateKing(board, 'red');
  const black = locateKing(board, 'black');
  if (!red || !black || red[1] !== black[1]) return false;
  const col = red[1];
  const [start, end] = red[0] < black[0] ? [red[0] + 1, black[0]] : [black[0] + 1, red[0]];
  for (let row = start; row < end; row += 1) {
    if (board[row][col]) return false;
  }
  return true;
}

function simulate(board, from, to) {
  const next = cloneBoard(board);
  next[to[0]][to[1]] = next[from[0]][from[1]];
  next[from[0]][from[1]] = null;
  return next;
}

function getPseudoLegalMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const side = sideOf(piece);
  const type = piece[1];
  const moves = [];

  if (type === 'r' || type === 'c') {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      let jumped = false;
      while (inside(r, c)) {
        const target = board[r][c];
        if (type === 'r') {
          if (!target) {
            moves.push([r, c]);
          } else {
            if (sideOf(target) !== side) moves.push([r, c]);
            break;
          }
        } else {
          if (!jumped) {
            if (!target) {
              moves.push([r, c]);
            } else {
              jumped = true;
            }
          } else if (target) {
            if (sideOf(target) !== side) moves.push([r, c]);
            break;
          }
        }
        r += dr;
        c += dc;
      }
    }
  } else if (type === 'n') {
    const options = [
      { leg: [-1, 0], to: [-2, -1] },
      { leg: [-1, 0], to: [-2, 1] },
      { leg: [1, 0], to: [2, -1] },
      { leg: [1, 0], to: [2, 1] },
      { leg: [0, -1], to: [-1, -2] },
      { leg: [0, -1], to: [1, -2] },
      { leg: [0, 1], to: [-1, 2] },
      { leg: [0, 1], to: [1, 2] },
    ];
    for (const option of options) {
      const legRow = row + option.leg[0];
      const legCol = col + option.leg[1];
      const toRow = row + option.to[0];
      const toCol = col + option.to[1];
      if (!inside(toRow, toCol)) continue;
      if (board[legRow][legCol]) continue;
      pushIfValid(board, side, moves, toRow, toCol);
    }
  } else if (type === 'b') {
    const deltas = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
    for (const [dr, dc] of deltas) {
      const eyeRow = row + dr / 2;
      const eyeCol = col + dc / 2;
      const toRow = row + dr;
      const toCol = col + dc;
      if (!inside(toRow, toCol) || board[eyeRow][eyeCol]) continue;
      if ((side === 'red' && toRow < 5) || (side === 'black' && toRow > 4)) continue;
      pushIfValid(board, side, moves, toRow, toCol);
    }
  } else if (type === 'a') {
    const deltas = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of deltas) {
      const toRow = row + dr;
      const toCol = col + dc;
      if (inPalace(side, toRow, toCol)) pushIfValid(board, side, moves, toRow, toCol);
    }
  } else if (type === 'k') {
    const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of deltas) {
      const toRow = row + dr;
      const toCol = col + dc;
      if (inPalace(side, toRow, toCol)) pushIfValid(board, side, moves, toRow, toCol);
    }
  } else if (type === 'p') {
    const forward = side === 'red' ? -1 : 1;
    pushIfValid(board, side, moves, row + forward, col);
    if (crossedRiver(side, row)) {
      pushIfValid(board, side, moves, row, col - 1);
      pushIfValid(board, side, moves, row, col + 1);
    }
  }

  return moves;
}

function isSquareAttacked(board, attackerSide, targetRow, targetCol) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const piece = board[row][col];
      if (!piece || sideOf(piece) !== attackerSide) continue;
      const moves = getPseudoLegalMoves(board, row, col);
      if (moves.some(([r, c]) => r === targetRow && c === targetCol)) return true;
    }
  }
  return false;
}

export function isInCheck(board, side) {
  const king = locateKing(board, side);
  if (!king) return true;
  if (generalsFacing(board)) return true;
  return isSquareAttacked(board, enemyOf(side), king[0], king[1]);
}

export function getLegalMoves(state, row, col) {
  const piece = state.board[row][col];
  if (!piece) return [];
  const side = sideOf(piece);
  if (side !== state.currentSide) return [];
  const candidates = getPseudoLegalMoves(state.board, row, col);
  return candidates.filter((to) => !isInCheck(simulate(state.board, [row, col], to), side));
}

export function getAllLegalMoves(state, side = state.currentSide) {
  const original = state.currentSide;
  state.currentSide = side;
  const all = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (sideOf(state.board[row][col]) !== side) continue;
      for (const to of getLegalMoves(state, row, col)) {
        all.push({ from: [row, col], to });
      }
    }
  }
  state.currentSide = original;
  return all;
}

export function updateWinner(state) {
  const redKing = locateKing(state.board, 'red');
  const blackKing = locateKing(state.board, 'black');
  if (!redKing) {
    state.winner = 'black';
    return state.winner;
  }
  if (!blackKing) {
    state.winner = 'red';
    return state.winner;
  }
  if (!getAllLegalMoves(state, state.currentSide).length) {
    state.winner = enemyOf(state.currentSide);
    return state.winner;
  }
  state.winner = null;
  return null;
}

export { sideOf, enemyOf, locateKing, getPseudoLegalMoves };
