import { chooseAIMove } from '../ai/search.js';
import { getLegalMoves, sideOf } from '../game/rules.js';
import { applyMove, createInitialState, undoLastFullTurn } from '../game/state.js';
import { renderGame } from './render.js';

export function createControllerState() {
  return {
    selected: null,
    legalMoves: [],
  };
}

export function createGameController(root) {
  const controller = {
    ...createControllerState(),
    root,
    state: createInitialState(),
    difficulty: 'medium',
  };

  function sync() {
    renderGame(root, controller);
  }

  async function runAIMove() {
    if (controller.state.winner || controller.state.currentSide !== 'black') return;
    controller.state.thinking = true;
    sync();
    await new Promise((resolve) => setTimeout(resolve, 120));
    const move = chooseAIMove(controller.state, controller.difficulty);
    controller.state.thinking = false;
    if (move) applyMove(controller.state, move);
    sync();
  }

  function clearSelection() {
    controller.selected = null;
    controller.legalMoves = [];
  }

  async function onCell(row, col) {
    if (controller.state.winner || controller.state.thinking || controller.state.currentSide !== 'red') return;
    const piece = controller.state.board[row][col];

    if (controller.selected) {
      const isTarget = controller.legalMoves.some(([r, c]) => r === row && c === col);
      if (isTarget) {
        applyMove(controller.state, { from: controller.selected, to: [row, col] });
        clearSelection();
        sync();
        await runAIMove();
        return;
      }
    }

    if (piece && sideOf(piece) === 'red') {
      controller.selected = [row, col];
      controller.legalMoves = getLegalMoves(controller.state, row, col);
    } else {
      clearSelection();
    }

    sync();
  }

  function handleBoardClick(event) {
    const target = event.target.closest('[data-row][data-col]');
    if (!target) return;
    void onCell(Number(target.dataset.row), Number(target.dataset.col));
  }

  function restart() {
    controller.state = createInitialState();
    clearSelection();
    sync();
  }

  function undo() {
    undoLastFullTurn(controller.state);
    clearSelection();
    sync();
  }

  root.board.addEventListener('click', handleBoardClick);
  root.restartBtn?.addEventListener('click', restart);
  root.undoBtn?.addEventListener('click', undo);
  root.difficulty?.addEventListener('change', (event) => {
    controller.difficulty = event.target.value;
  });

  sync();
  return controller;
}
