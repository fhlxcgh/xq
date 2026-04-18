import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { getLegalMoves, updateWinner } from '../src/game/rules.js';

test('initial state contains 32 pieces and red to move', () => {
  const state = createInitialState();
  const pieces = state.board.flat().filter(Boolean);
  assert.equal(pieces.length, 32);
  assert.equal(state.currentSide, 'red');
});

test('rook cannot jump over pieces', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 0);
  assert.deepEqual(moves, [[8, 0], [7, 0]]);
});

test('horse is blocked by its leg', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 1);
  assert.deepEqual(moves, [[7, 0], [7, 2]]);
});

test('king stays inside palace', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 4);
  assert.deepEqual(moves, [[8, 4]]);
});

test('elephant cannot cross the river', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 2);
  assert.deepEqual(moves, [[7, 0], [7, 4]]);
});

test('winner is set when black king is missing', () => {
  const state = createInitialState();
  state.board[0][4] = null;
  updateWinner(state);
  assert.equal(state.winner, 'red');
});
