import { getAllLegalMoves } from '../game/rules.js';
import { applyMove, cloneState } from '../game/state.js';
import { PIECE_VALUES, evaluateBoard } from './evaluate.js';

const PRESETS = {
  easy: { maxDepth: 1, topN: 4, noise: 60, randomize: true },
  medium: { maxDepth: 2, topN: 2, noise: 12, randomize: true },
  hard: { maxDepth: 2, topN: 1, noise: 0, randomize: false },
};

function moveOrderingScore(state, move) {
  const piece = state.board[move.from[0]][move.from[1]];
  const target = state.board[move.to[0]][move.to[1]];
  let score = 0;

  if (target) {
    score += PIECE_VALUES[target[1]] * 12 - PIECE_VALUES[piece[1]];
  }

  if (move.to[1] === 4) {
    score += 6;
  }

  if (piece[1] === 'r' || piece[1] === 'c') {
    score += 4;
  }

  return score;
}

function orderMoves(state, moves) {
  return [...moves].sort((a, b) => moveOrderingScore(state, b) - moveOrderingScore(state, a));
}

function minimax(state, depth, alpha, beta, maximizingSide) {
  if (depth === 0 || state.winner) {
    return evaluateBoard(state, maximizingSide);
  }

  const moves = orderMoves(state, getAllLegalMoves(state, state.currentSide));
  if (!moves.length) {
    return evaluateBoard(state, maximizingSide);
  }

  if (state.currentSide === maximizingSide) {
    let value = -Infinity;
    for (const move of moves) {
      const next = cloneState(state);
      applyMove(next, move);
      value = Math.max(value, minimax(next, depth - 1, alpha, beta, maximizingSide));
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  }

  let value = Infinity;
  for (const move of moves) {
    const next = cloneState(state);
    applyMove(next, move);
    value = Math.min(value, minimax(next, depth - 1, alpha, beta, maximizingSide));
    beta = Math.min(beta, value);
    if (beta <= alpha) break;
  }
  return value;
}

function addNoise(score, noise) {
  return score + (Math.random() * 2 - 1) * noise;
}

function rankMoves(state, depth, side, preset) {
  return orderMoves(state, getAllLegalMoves(state, side))
    .map((move) => {
      const next = cloneState(state);
      applyMove(next, move);
      const searchScore = minimax(next, Math.max(0, depth - 1), -Infinity, Infinity, side);
      return {
        move,
        score: preset.randomize ? addNoise(searchScore, preset.noise) : searchScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function chooseAIMove(state, difficulty = 'medium') {
  const preset = PRESETS[difficulty] ?? PRESETS.medium;
  const side = state.currentSide;
  let ranked = [];

  for (let depth = 1; depth <= preset.maxDepth; depth += 1) {
    ranked = rankMoves(state, depth, side, preset);
    if (!ranked.length) return null;
  }

  const pool = ranked.slice(0, Math.min(preset.topN, ranked.length));
  if (!preset.randomize || pool.length === 1) {
    return pool[0].move;
  }
  return pool[Math.floor(Math.random() * pool.length)].move;
}
