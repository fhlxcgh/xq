import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { evaluateBoard } from '../src/ai/evaluate.js';
import { chooseAIMove } from '../src/ai/search.js';
import { getLegalMoves } from '../src/game/rules.js';

function createEmptyState(currentSide = 'red') {
  return {
    board: Array.from({ length: 10 }, () => Array(9).fill(null)),
    currentSide,
    history: [],
    winner: null,
    thinking: false,
  };
}

test('capturing a rook improves evaluation for red', () => {
  const state = createInitialState();
  const base = evaluateBoard(state, 'red');
  state.board[0][0] = null;
  const improved = evaluateBoard(state, 'red');
  assert.ok(improved > base);
});

test('hard difficulty returns a legal move for black', () => {
  const state = createInitialState();
  state.currentSide = 'black';
  const move = chooseAIMove(state, 'hard');
  assert.ok(Array.isArray(move.from));
  assert.ok(Array.isArray(move.to));
  const legalMoves = getLegalMoves(state, move.from[0], move.from[1]);
  assert.ok(legalMoves.some(([r, c]) => r === move.to[0] && c === move.to[1]));
});

test('hard prefers capturing a free rook over a quiet move', () => {
  const state = createEmptyState('black');
  state.board[0][0] = 'br';
  state.board[0][4] = 'bk';
  state.board[5][0] = 'rr';
  state.board[4][4] = 'rp';
  state.board[9][4] = 'rk';

  const move = chooseAIMove(state, 'hard');
  assert.deepEqual(move, { from: [0, 0], to: [5, 0] });
});

test('hard is deterministic for the same position', () => {
  const state = createInitialState();
  state.currentSide = 'black';

  const first = chooseAIMove(state, 'hard');
  const second = chooseAIMove(state, 'hard');

  assert.deepEqual(second, first);
});

test('evaluation penalizes an exposed rook', () => {
  const safe = createEmptyState('red');
  safe.board[0][4] = 'bk';
  safe.board[4][4] = 'bp';
  safe.board[7][4] = 'rr';
  safe.board[9][4] = 'rk';

  const hanging = structuredClone(safe);
  hanging.board[4][4] = null;
  hanging.board[2][4] = 'br';

  assert.ok(evaluateBoard(hanging, 'red') < evaluateBoard(safe, 'red'));
});
