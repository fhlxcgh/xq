import { PIECE_LABELS, SIDE_NAMES } from '../game/constants.js';

const MARK_POINTS = [
  [2, 1], [2, 7], [7, 1], [7, 7],
  [3, 0], [3, 2], [3, 4], [3, 6], [3, 8],
  [6, 0], [6, 2], [6, 4], [6, 6], [6, 8],
];

const PALACE_DECORATIONS = [
  { topRow: 0, leftCol: 3 },
  { topRow: 7, leftCol: 3 },
];

export function pieceLabel(piece) {
  return PIECE_LABELS[piece] ?? '';
}

export function getPalaceDecorations() {
  return PALACE_DECORATIONS.map((item) => ({ ...item }));
}

function samePos(a, b) {
  return a && b && a[0] === b[0] && a[1] === b[1];
}

function buildHistoryRounds(history) {
  const rounds = [];
  for (let i = 0; i < history.length; i += 2) {
    rounds.push({
      red: history[i]?.notation ?? '',
      black: history[i + 1]?.notation ?? '',
    });
  }
  return rounds;
}

export function renderGame(root, model) {
  renderStatus(root.status, model.state);
  renderBoard(root.board, model);
  renderHistory(root.historyList, model.state.history);
  if (root.difficulty) root.difficulty.value = model.difficulty;
}

export function renderStatus(node, state) {
  if (!node) return;
  if (state.winner) {
    node.textContent = `${SIDE_NAMES[state.winner]}获胜`;
    return;
  }
  if (state.thinking) {
    node.textContent = 'AI 思考中...';
    return;
  }
  node.textContent = `${SIDE_NAMES[state.currentSide]}行棋`;
}

export function renderBoard(boardNode, model) {
  if (!boardNode) return;
  boardNode.innerHTML = '';
  renderBoardDecorations(boardNode);

  for (let row = 0; row < model.state.board.length; row += 1) {
    for (let col = 0; col < model.state.board[row].length; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.style.setProperty('--row', String(row));
      cell.style.setProperty('--col', String(col));

      const piece = model.state.board[row][col];
      const target = model.legalMoves.some(([r, c]) => r === row && c === col);
      if (target) {
        const marker = document.createElement('div');
        marker.className = piece ? 'capture-target' : 'target';
        cell.append(marker);
      }

      if (piece) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `piece ${piece[0] === 'r' ? 'red' : 'black'}`;
        if (samePos(model.selected, [row, col])) button.classList.add('selected');
        button.dataset.row = String(row);
        button.dataset.col = String(col);
        button.textContent = pieceLabel(piece);
        cell.append(button);
      }

      boardNode.append(cell);
    }
  }
}

function renderBoardDecorations(boardNode) {
  const decorationLayer = document.createElement('div');
  decorationLayer.className = 'board-decorations';

  for (let row = 0; row < 10; row += 1) {
    const horizontal = document.createElement('div');
    horizontal.className = 'grid-line horizontal';
    horizontal.style.top = `calc(24px + ((100% - 48px) / 9) * ${row})`;
    decorationLayer.append(horizontal);
  }

  for (let col = 0; col < 9; col += 1) {
    const topSegment = document.createElement('div');
    topSegment.className = 'grid-line vertical top';
    topSegment.style.left = `calc(18px + ((100% - 36px) / 8) * ${col})`;
    decorationLayer.append(topSegment);

    const bottomSegment = document.createElement('div');
    bottomSegment.className = 'grid-line vertical bottom';
    bottomSegment.style.left = `calc(18px + ((100% - 36px) / 8) * ${col})`;
    decorationLayer.append(bottomSegment);
  }

  PALACE_DECORATIONS.forEach(({ topRow, leftCol }) => {
    const diagonalA = document.createElement('div');
    diagonalA.className = 'palace-diagonal slash';
    diagonalA.style.top = `calc(24px + ((100% - 48px) / 9) * ${topRow})`;
    diagonalA.style.left = `calc(18px + ((100% - 36px) / 8) * ${leftCol})`;
    decorationLayer.append(diagonalA);

    const diagonalB = document.createElement('div');
    diagonalB.className = 'palace-diagonal backslash';
    diagonalB.style.top = `calc(24px + ((100% - 48px) / 9) * ${topRow})`;
    diagonalB.style.left = `calc(18px + ((100% - 36px) / 8) * ${leftCol})`;
    decorationLayer.append(diagonalB);
  });

  MARK_POINTS.forEach(([row, col]) => {
    const mark = document.createElement('div');
    mark.className = 'intersection-mark';
    mark.style.top = `calc(24px + ((100% - 48px) / 9) * ${row})`;
    mark.style.left = `calc(18px + ((100% - 36px) / 8) * ${col})`;
    decorationLayer.append(mark);
  });

  boardNode.append(decorationLayer);
}

export function renderHistory(node, history) {
  if (!node) return;
  const rounds = buildHistoryRounds(history);
  node.innerHTML = '';
  rounds.forEach((round, index) => {
    const item = document.createElement('li');
    item.className = 'round-entry';
    item.innerHTML = `<strong>第 ${index + 1} 回合</strong><span>${round.red || '—'}</span><span>${round.black || '—'}</span>`;
    node.append(item);
  });
}
