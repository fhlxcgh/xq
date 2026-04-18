import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('index.html wires the app shell', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="board"/);
  assert.match(html, /id="history-list"/);
  assert.match(html, /id="undo-btn"/);
});
