import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { evaluateBoard } from '../src/ai/evaluate.js';
import { chooseAIMove } from '../src/ai/search.js';
import { getLegalMoves } from '../src/game/rules.js';

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
