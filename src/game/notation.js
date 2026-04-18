import { PIECE_LABELS } from './constants.js';

const RED_FILE_NAMES = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
const BLACK_FILE_NAMES = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
const STEP_NAMES = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const TARGET_FILE_TYPES = new Set(['n', 'b', 'a']);

function fileLabel(side, col) {
  return side === 'red' ? RED_FILE_NAMES[col] : BLACK_FILE_NAMES[col];
}

function stepLabel(step) {
  return STEP_NAMES[step] ?? String(step);
}

function isForward(side, fromRow, toRow) {
  return side === 'red' ? toRow < fromRow : toRow > fromRow;
}

function directionLabel(record) {
  if (record.to[0] === record.from[0]) return '平';
  return isForward(record.side, record.from[0], record.to[0]) ? '进' : '退';
}

function destinationLabel(record) {
  if (record.to[0] === record.from[0] || TARGET_FILE_TYPES.has(record.piece[1])) {
    return fileLabel(record.side, record.to[1]);
  }
  return stepLabel(Math.abs(record.to[0] - record.from[0]));
}

function sameTypePiecesOnFile(board, piece, col) {
  if (!board?.length) return [];
  return board
    .map((row, rowIndex) => ({ piece: row[col], row: rowIndex }))
    .filter((entry) => entry.piece === piece);
}

function disambiguationLabel(record) {
  const matches = sameTypePiecesOnFile(record.board, record.piece, record.from[1]);
  if (matches.length < 2) return null;

  const sorted = matches.sort((a, b) =>
    record.side === 'red' ? a.row - b.row : b.row - a.row
  );

  const index = sorted.findIndex((item) => item.row === record.from[0]);
  if (index === -1) return null;

  if (record.piece[1] === 'p' && matches.length === 3) {
    return ['前', '中', '后'][index];
  }

  return index === 0 ? '前' : '后';
}

function startLabel(record) {
  return disambiguationLabel(record) ?? fileLabel(record.side, record.from[1]);
}

export function formatMoveRecord(record) {
  const sideLabel = record.side === 'red' ? '红' : '黑';
  const pieceLabel = PIECE_LABELS[record.piece];
  const start = startLabel(record);
  const action = directionLabel(record);
  const end = destinationLabel(record);
  const actor = ['前', '中', '后'].includes(start) ? `${start}${pieceLabel}` : `${pieceLabel}${start}`;
  return `${sideLabel}${actor}${action}${end}`;
}
