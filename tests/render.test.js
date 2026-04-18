import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getPalaceDecorations, pieceLabel } from '../src/ui/render.js';

test('renderer exposes a label for red rook', () => {
  assert.equal(pieceLabel('rr'), '车');
});

test('board renderer defines palace diagonals and intersection marks', () => {
  const styleSource = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
  assert.equal(getPalaceDecorations().length, 2);
  assert.match(styleSource, /\.palace-diagonal/);
  assert.match(styleSource, /\.intersection-mark/);
  assert.match(styleSource, /\.cell\s*\{[\s\S]*position:\s*absolute;/);
  assert.match(styleSource, /translate\(-50%, -50%\)/);
});
