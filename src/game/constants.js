export const ROWS = 10;
export const COLS = 9;

export const STARTING_ROWS = [
  ['br', 'bn', 'bb', 'ba', 'bk', 'ba', 'bb', 'bn', 'br'],
  [null, null, null, null, null, null, null, null, null],
  [null, 'bc', null, null, null, null, null, 'bc', null],
  ['bp', null, 'bp', null, 'bp', null, 'bp', null, 'bp'],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  ['rp', null, 'rp', null, 'rp', null, 'rp', null, 'rp'],
  [null, 'rc', null, null, null, null, null, 'rc', null],
  [null, null, null, null, null, null, null, null, null],
  ['rr', 'rn', 'rb', 'ra', 'rk', 'ra', 'rb', 'rn', 'rr'],
];

export const SIDE_NAMES = {
  red: '红方',
  black: '黑方',
};

export const PIECE_LABELS = {
  rr: '车',
  rn: '马',
  rb: '相',
  ra: '仕',
  rk: '帅',
  rc: '炮',
  rp: '兵',
  br: '车',
  bn: '马',
  bb: '象',
  ba: '士',
  bk: '将',
  bc: '炮',
  bp: '卒',
};
