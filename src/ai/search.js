import { getAllLegalMoves } from '../game/rules.js';
import { applyMove, cloneState } from '../game/state.js';
import { evaluateBoard } from './evaluate.js';

const PRESETS = {
  easy: { depth: 1, topN: 4, noise: 60 },
  medium: { depth: 1, topN: 2, noise: 18 },
  hard: { depth: 2, topN: 1, noise: 4 },
};

function minimax(state, depth, alpha, beta, maximizingSide) {
  if (depth === 0 || state.winner) {
    return evaluateBoard(state, maximizingSide);
  }

  const moves = getAllLegalMoves(state, state.currentSide);
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

export function chooseAIMove(state, difficulty = 'medium') {
  const preset = PRESETS[difficulty] ?? PRESETS.medium;
  const side = state.currentSide;
  const moves = getAllLegalMoves(state, side);
  if (!moves.length) return null;

  const ranked = moves
    .map((move) => {
      const next = cloneState(state);
      applyMove(next, move);
      const searchScore = minimax(next, Math.max(0, preset.depth - 1), -Infinity, Infinity, side);
      return { move, score: addNoise(searchScore, preset.noise) };
    })
    .sort((a, b) => b.score - a.score);

  const pool = ranked.slice(0, Math.min(preset.topN, ranked.length));
  return pool[Math.floor(Math.random() * pool.length)].move;
}
