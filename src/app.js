import { createGameController } from './ui/controller.js';

const root = {
  board: document.querySelector('#board'),
  status: document.querySelector('#status'),
  historyList: document.querySelector('#history-list'),
  difficulty: document.querySelector('#difficulty'),
  restartBtn: document.querySelector('#restart-btn'),
  undoBtn: document.querySelector('#undo-btn'),
};

createGameController(root);
