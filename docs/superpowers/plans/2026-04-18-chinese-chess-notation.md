# Chinese Chess Notation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade move-history text to a more standard Chinese chess notation style while keeping the existing red/black side prefix.

**Architecture:** Keep all notation rules inside `src/game/notation.js`. Extend the formatter with side-relative file numbering, piece-specific target formatting, and same-type disambiguation using `前/后`, while leaving rules, AI, and history storage flow unchanged.

**Tech Stack:** JavaScript, Node.js built-in test runner

---

## File Structure

- Modify: `src/game/notation.js` - all notation rules and helpers
- Modify: `tests/history.test.js` - notation-focused regression coverage

### Task 1: Normalize Side-Relative Numbering

**Files:**
- Modify: `src/game/notation.js`
- Modify: `tests/history.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('black side also uses Chinese numerals', () => {
  const text = formatMoveRecord({
    piece: 'br',
    from: [0, 0],
    to: [1, 0],
    side: 'black',
    captured: null,
    board: [],
  });
  assert.equal(text, '黑车一进一');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/history.test.js`
Expected: FAIL because black currently uses Arabic numerals such as `1`.

- [ ] **Step 3: Write minimal implementation**

```javascript
const FILE_NAMES = ['九', '八', '七', '六', '五', '四', '三', '二', '一'];
const FILE_NAMES_BLACK = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

function fileLabel(side, col) {
  return side === 'red' ? FILE_NAMES[col] : FILE_NAMES_BLACK[col];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/history.test.js`
Expected: PASS for the new black-numbering case.

### Task 2: Differentiate Step Count Vs Target File By Piece Type

**Files:**
- Modify: `src/game/notation.js`
- Modify: `tests/history.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('horse uses target file instead of step count', () => {
  const text = formatMoveRecord({
    piece: 'rn',
    from: [9, 1],
    to: [7, 2],
    side: 'red',
    captured: null,
    board: [],
  });
  assert.equal(text, '红马八进七');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/history.test.js`
Expected: FAIL because horse currently formats `进2` by distance.

- [ ] **Step 3: Write minimal implementation**

```javascript
const TARGET_FILE_TYPES = new Set(['n', 'b', 'a']);
const STEP_COUNT_TYPES = new Set(['r', 'c', 'p', 'k']);

function destinationLabel(record) {
  if (record.to[0] === record.from[0]) {
    return fileLabel(record.side, record.to[1]);
  }
  return TARGET_FILE_TYPES.has(record.piece[1])
    ? fileLabel(record.side, record.to[1])
    : numberLabel(Math.abs(record.to[0] - record.from[0]));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/history.test.js`
Expected: PASS for horse and existing rook cases.

### Task 3: Add Same-Type Disambiguation With `前/后`

**Files:**
- Modify: `src/game/notation.js`
- Modify: `tests/history.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
test('front and rear rooks are disambiguated', () => {
  const board = Array.from({ length: 10 }, () => Array(9).fill(null));
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
  const board = Array.from({ length: 10 }, () => Array(9).fill(null));
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/history.test.js`
Expected: FAIL because formatter currently always uses file-number origin labels.

- [ ] **Step 3: Write minimal implementation**

```javascript
function sameTypePiecesOnFile(board, piece, col) {
  return board
    .map((row, index) => ({ piece: row[col], row: index }))
    .filter((entry) => entry.piece === piece);
}

function disambiguationLabel(record) {
  if (!record.board?.length) return null;
  const matches = sameTypePiecesOnFile(record.board, record.piece, record.from[1]);
  if (matches.length < 2) return null;
  const sorted = matches.sort((a, b) =>
    record.side === 'red' ? a.row - b.row : b.row - a.row
  );
  return sorted[0].row === record.from[0] ? '前' : '后';
}
```

Then use `前/后` in place of the file-origin label when disambiguation exists.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/history.test.js`
Expected: PASS for rook and soldier disambiguation.

### Task 4: Preserve History Integration

**Files:**
- Modify: `src/game/notation.js`
- Modify: `tests/history.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('simple rook move still keeps side prefix and standard notation', () => {
  const board = Array.from({ length: 10 }, () => Array(9).fill(null));
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/history.test.js`
Expected: FAIL if the refactor breaks the current non-conflicting format.

- [ ] **Step 3: Write minimal implementation**

```javascript
export function formatMoveRecord(record) {
  const sideLabel = record.side === 'red' ? '红' : '黑';
  const pieceLabel = PIECE_LABELS[record.piece];
  const startLabel = disambiguationLabel(record) ?? fileLabel(record.side, record.from[1]);
  const action = directionLabel(record);
  const endLabel = destinationLabel(record);
  return `${sideLabel}${startLabel === '前' || startLabel === '后' ? startLabel + pieceLabel : pieceLabel + startLabel}${action}${endLabel}`;
}
```

Adjust helper composition so both disambiguated and non-disambiguated cases render correctly.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/history.test.js`
Expected: PASS for all notation tests.

## Self-Review

- Spec coverage: side-relative Chinese numerals, `前/后` disambiguation, and piece-specific target formatting are all explicitly covered in Tasks 1-3. Preserving existing history integration is covered in Task 4.
- Placeholder scan: no `TBD` or `TODO` markers remain.
- Type consistency: the plan consistently uses `formatMoveRecord(record)` and passes `board` into notation decisions where needed.
