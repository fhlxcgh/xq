import { STARTING_ROWS } from './constants.js';
import { formatMoveRecord } from './notation.js';
import { updateWinner } from './rules.js';

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function createInitialState() {
  return {
    board: cloneBoard(STARTING_ROWS),
    currentSide: 'red',
    history: [],
    winner: null,
    thinking: false,
  };
}

export function cloneState(state) {
  return {
    board: cloneBoard(state.board),
    currentSide: state.currentSide,
    history: state.history.map((item) => ({
      ...item,
      from: [...item.from],
      to: [...item.to],
      boardBefore: cloneBoard(item.boardBefore),
    })),
    winner: state.winner,
    thinking: state.thinking,
  };
}

export function applyMove(state, move) {
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  const piece = state.board[fromRow][fromCol];
  const captured = state.board[toRow][toCol];
  const boardBefore = cloneBoard(state.board);
  state.history.push({
    ...move,
    piece,
    captured,
    side: state.currentSide,
    notation: formatMoveRecord({
      piece,
      captured,
      side: state.currentSide,
      from: move.from,
      to: move.to,
      board: boardBefore,
    }),
    boardBefore,
    currentSideBefore: state.currentSide,
  });
  state.board[toRow][toCol] = piece;
  state.board[fromRow][fromCol] = null;
  state.currentSide = state.currentSide === 'red' ? 'black' : 'red';
  updateWinner(state);
}

export function undoLastFullTurn(state) {
  if (!state.history.length) return;
  const count =
    state.history.length >= 2 &&
    state.history.at(-1).side !== state.history.at(-2).side
      ? 2
      : 1;
  const snapshot = state.history[state.history.length - count];
  state.board = cloneBoard(snapshot.boardBefore);
  state.currentSide = snapshot.currentSideBefore;
  state.history.splice(state.history.length - count, count);
  state.winner = null;
  state.thinking = false;
}
