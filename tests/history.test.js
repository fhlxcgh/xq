import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, applyMove, undoLastFullTurn } from '../src/game/state.js';
import { formatMoveRecord } from '../src/game/notation.js';

function emptyBoard() {
  return Array.from({ length: 10 }, () => Array(9).fill(null));
}

test('undo removes the latest player and ai moves', () => {
  const state = createInitialState();
  applyMove(state, { from: [9, 0], to: [8, 0] });
  applyMove(state, { from: [0, 0], to: [1, 0] });
  undoLastFullTurn(state);
  assert.equal(state.board[9][0], 'rr');
  assert.equal(state.board[0][0], 'br');
  assert.equal(state.currentSide, 'red');
  assert.equal(state.history.length, 0);
});

test('move history record contains side and piece label', () => {
  const text = formatMoveRecord({
    piece: 'rr',
    from: [9, 0],
    to: [8, 0],
    side: 'red',
    captured: null,
    board: emptyBoard(),
  });
  assert.match(text, /红/);
  assert.match(text, /车/);
});

test('undo after player move before ai move restores previous state', () => {
  const state = createInitialState();
  applyMove(state, { from: [9, 0], to: [8, 0] });
  undoLastFullTurn(state);
  assert.equal(state.board[9][0], 'rr');
  assert.equal(state.currentSide, 'red');
});

test('black side also uses Chinese numerals', () => {
  const board = emptyBoard();
  board[0][0] = 'br';
  const text = formatMoveRecord({
    piece: 'br',
    from: [0, 0],
    to: [1, 0],
    side: 'black',
    captured: null,
    board,
  });
  assert.equal(text, '黑车一进一');
});

test('horse uses target file instead of step count', () => {
  const board = emptyBoard();
  board[9][1] = 'rn';
  const text = formatMoveRecord({
    piece: 'rn',
    from: [9, 1],
    to: [7, 2],
    side: 'red',
    captured: null,
    board,
  });
  assert.equal(text, '红马八进七');
});

test('front and rear rooks are disambiguated', () => {
  const board = emptyBoard();
  board[9][0] = 'rr';
  board[7][0] = 'rr';
  const front = formatMoveRecord({
    piece: 'rr',
    from: [7, 0],
    to: [6, 0],
    side: 'red',
    captured: null,
    board,
  });
  const rear = formatMoveRecord({
    piece: 'rr',
    from: [9, 0],
    to: [8, 0],
    side: 'red',
    captured: null,
    board,
  });
  assert.equal(front, '红前车进一');
  assert.equal(rear, '红后车进一');
});

test('front and rear soldiers are disambiguated on same file', () => {
  const board = emptyBoard();
  board[6][0] = 'rp';
  board[5][0] = 'rp';
  const front = formatMoveRecord({
    piece: 'rp',
    from: [5, 0],
    to: [4, 0],
    side: 'red',
    captured: null,
    board,
  });
  const rear = formatMoveRecord({
    piece: 'rp',
    from: [6, 0],
    to: [5, 0],
    side: 'red',
    captured: null,
    board,
  });
  assert.equal(front, '红前兵进一');
  assert.equal(rear, '红后兵进一');
});

test('three soldiers on the same file use front middle rear labels', () => {
  const board = emptyBoard();
  board[6][0] = 'rp';
  board[5][0] = 'rp';
  board[4][0] = 'rp';

  const front = formatMoveRecord({
    piece: 'rp',
    from: [4, 0],
    to: [3, 0],
    side: 'red',
    captured: null,
    board,
  });
  const middle = formatMoveRecord({
    piece: 'rp',
    from: [5, 0],
    to: [4, 0],
    side: 'red',
    captured: null,
    board,
  });
  const rear = formatMoveRecord({
    piece: 'rp',
    from: [6, 0],
    to: [5, 0],
    side: 'red',
    captured: null,
    board,
  });

  assert.equal(front, '红前兵进一');
  assert.equal(middle, '红中兵进一');
  assert.equal(rear, '红后兵进一');
});

test('three black soldiers on the same file also use front middle rear labels', () => {
  const board = emptyBoard();
  board[3][0] = 'bp';
  board[4][0] = 'bp';
  board[5][0] = 'bp';

  const front = formatMoveRecord({
    piece: 'bp',
    from: [5, 0],
    to: [6, 0],
    side: 'black',
    captured: null,
    board,
  });
  const middle = formatMoveRecord({
    piece: 'bp',
    from: [4, 0],
    to: [5, 0],
    side: 'black',
    captured: null,
    board,
  });
  const rear = formatMoveRecord({
    piece: 'bp',
    from: [3, 0],
    to: [4, 0],
    side: 'black',
    captured: null,
    board,
  });

  assert.equal(front, '黑前卒进一');
  assert.equal(middle, '黑中卒进一');
  assert.equal(rear, '黑后卒进一');
});

test('simple rook move keeps side prefix and standard notation', () => {
  const board = emptyBoard();
  board[9][0] = 'rr';
  const text = formatMoveRecord({
    piece: 'rr',
    from: [9, 0],
    to: [8, 0],
    side: 'red',
    captured: null,
    board,
  });
  assert.equal(text, '红车九进一');
});
