# Chinese Chess Web Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static browser-based Chinese chess game with human-vs-AI play, three difficulty levels, undo, and move history.

**Architecture:** Use a small vanilla HTML/CSS/JavaScript app. Keep the board state, rules engine, history stack, and AI search in separate files so UI logic stays thin and testable.

**Tech Stack:** HTML, CSS, JavaScript, Node.js built-in test runner

---

## File Structure

- Create: `index.html` - page shell, board container, controls, history panel
- Create: `styles.css` - responsive board and side-panel styling
- Create: `src/game/constants.js` - board dimensions, piece ids, starting setup
- Create: `src/game/state.js` - game creation, cloning, apply/undo move state helpers
- Create: `src/game/rules.js` - legal move generation, check/checkmate detection
- Create: `src/game/notation.js` - human-readable move history strings
- Create: `src/ai/evaluate.js` - material/position evaluation
- Create: `src/ai/search.js` - alpha-beta search and difficulty policies
- Create: `src/ui/render.js` - DOM rendering for board, status, history
- Create: `src/ui/controller.js` - input handling and game flow
- Create: `src/app.js` - composition root
- Create: `tests/rules.test.js` - rule-level tests
- Create: `tests/history.test.js` - undo/history tests
- Create: `tests/ai.test.js` - difficulty and move-choice tests

### Task 1: Scaffold The Static App

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/app.js`

- [ ] **Step 1: Write the failing test**

```javascript
// tests/smoke.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('index.html wires the app shell', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="board"/);
  assert.match(html, /id="history-list"/);
  assert.match(html, /id="undo-btn"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/smoke.test.js`
Expected: FAIL with `ENOENT` because `index.html` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>中国象棋</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="layout">
      <section class="board-panel">
        <div id="status"></div>
        <div id="board"></div>
      </section>
      <aside class="sidebar">
        <select id="difficulty">
          <option value="easy">初级</option>
          <option value="medium">中级</option>
          <option value="hard">高级</option>
        </select>
        <button id="restart-btn">重新开始</button>
        <button id="undo-btn">悔棋</button>
        <ol id="history-list"></ol>
      </aside>
    </main>
    <script type="module" src="./src/app.js"></script>
  </body>
</html>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/smoke.test.js`
Expected: PASS

### Task 2: Build Initial Game State

**Files:**
- Create: `src/game/constants.js`
- Create: `src/game/state.js`
- Test: `tests/rules.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';

test('initial state contains 32 pieces and red to move', () => {
  const state = createInitialState();
  const pieces = state.board.flat().filter(Boolean);
  assert.equal(pieces.length, 32);
  assert.equal(state.currentSide, 'red');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rules.test.js`
Expected: FAIL with module not found for `src/game/state.js`.

- [ ] **Step 3: Write minimal implementation**

Create the starting board, `currentSide`, `history`, `winner`, and `thinking` flags in `src/game/state.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rules.test.js`
Expected: PASS

### Task 3: Add Core Move Application And Undo State

**Files:**
- Modify: `src/game/state.js`
- Create: `tests/history.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, applyMove, undoLastFullTurn } from '../src/game/state.js';

test('undo removes the latest player and ai moves', () => {
  const state = createInitialState();
  applyMove(state, { from: [9, 0], to: [8, 0] });
  applyMove(state, { from: [0, 0], to: [1, 0] });
  undoLastFullTurn(state);
  assert.equal(state.board[9][0], 'rr');
  assert.equal(state.board[0][0], 'br');
  assert.equal(state.currentSide, 'red');
  assert.equal(state.history.length, 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/history.test.js`
Expected: FAIL because `applyMove` and `undoLastFullTurn` are not exported.

- [ ] **Step 3: Write minimal implementation**

Implement `cloneBoard`, `applyMove`, and `undoLastFullTurn` using board snapshots stored in the history stack.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/history.test.js`
Expected: PASS

### Task 4: Implement Core Piece Move Rules

**Files:**
- Create: `src/game/rules.js`
- Modify: `tests/rules.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { getLegalMoves } from '../src/game/rules.js';

test('rook cannot jump over pieces', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 0);
  assert.deepEqual(moves, [[8, 0], [7, 0]]);
});

test('horse is blocked by its leg', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 1);
  assert.deepEqual(moves, [[7, 0], [7, 2]]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rules.test.js`
Expected: FAIL with module not found for `src/game/rules.js`.

- [ ] **Step 3: Write minimal implementation**

Implement legal move generation for rook, horse, cannon, and soldier.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rules.test.js`
Expected: PASS

### Task 5: Implement Remaining Piece Rules And Check Safety

**Files:**
- Modify: `src/game/rules.js`
- Modify: `tests/rules.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('king stays inside palace', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 4);
  assert.deepEqual(moves, [[8, 4]]);
});

test('elephant cannot cross the river', () => {
  const state = createInitialState();
  const moves = getLegalMoves(state, 9, 2);
  assert.deepEqual(moves.sort().toString(), [[7, 0], [7, 4]].sort().toString());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rules.test.js`
Expected: FAIL because these piece rules are missing.

- [ ] **Step 3: Write minimal implementation**

Implement advisor, elephant, king, facing-kings, and self-check filtering.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rules.test.js`
Expected: PASS

### Task 6: Add Winner Detection

**Files:**
- Modify: `src/game/rules.js`
- Modify: `src/game/state.js`
- Modify: `tests/rules.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { updateWinner } from '../src/game/rules.js';

test('winner is set when black king is missing', () => {
  const state = createInitialState();
  state.board[0][4] = null;
  updateWinner(state);
  assert.equal(state.winner, 'red');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rules.test.js`
Expected: FAIL because `updateWinner` is missing.

- [ ] **Step 3: Write minimal implementation**

Add full move scan, king existence checks, and `updateWinner(state)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rules.test.js`
Expected: PASS

### Task 7: Create Human-Readable Move History

**Files:**
- Create: `src/game/notation.js`
- Modify: `src/game/state.js`
- Modify: `tests/history.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { formatMoveRecord } from '../src/game/notation.js';

test('move history record contains side and piece label', () => {
  const text = formatMoveRecord({
    piece: 'rr',
    from: [9, 0],
    to: [8, 0],
    side: 'red',
    captured: null,
  });
  assert.match(text, /红/);
  assert.match(text, /车/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/history.test.js`
Expected: FAIL because `formatMoveRecord` is missing.

- [ ] **Step 3: Write minimal implementation**

Create `formatMoveRecord` and store `notation` on history entries inside `applyMove`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/history.test.js`
Expected: PASS

### Task 8: Add Evaluation Function

**Files:**
- Create: `src/ai/evaluate.js`
- Create: `tests/ai.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { evaluateBoard } from '../src/ai/evaluate.js';

test('capturing a rook improves evaluation for red', () => {
  const state = createInitialState();
  const base = evaluateBoard(state, 'red');
  state.board[0][0] = null;
  const improved = evaluateBoard(state, 'red');
  assert.ok(improved > base);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai.test.js`
Expected: FAIL because `src/ai/evaluate.js` is missing.

- [ ] **Step 3: Write minimal implementation**

Implement material score, piece-square bonuses, king safety, and mobility.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ai.test.js`
Expected: PASS

### Task 9: Add Alpha-Beta Search And Difficulty Policies

**Files:**
- Create: `src/ai/search.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
import { chooseAIMove } from '../src/ai/search.js';

test('hard difficulty returns a legal move for black', () => {
  const state = createInitialState();
  state.currentSide = 'black';
  const move = chooseAIMove(state, 'hard');
  assert.ok(Array.isArray(move.from));
  assert.ok(Array.isArray(move.to));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai.test.js`
Expected: FAIL because `src/ai/search.js` is missing.

- [ ] **Step 3: Write minimal implementation**

Implement alpha-beta search plus:

- `easy`: shallow depth and more randomness
- `medium`: medium depth and less randomness
- `hard`: deeper search and near-deterministic best move

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/ai.test.js`
Expected: PASS

### Task 10: Render Board And Sidebar

**Files:**
- Create: `src/ui/render.js`
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { pieceLabel } from '../src/ui/render.js';

test('renderer exposes a label for red rook', () => {
  assert.equal(pieceLabel('rr'), '车');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/render.test.js`
Expected: FAIL because `src/ui/render.js` is missing.

- [ ] **Step 3: Write minimal implementation**

Render the board grid, piece labels, selected square, legal targets, status text, and grouped history list.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/render.test.js`
Expected: PASS

### Task 11: Wire Controller Flow

**Files:**
- Create: `src/ui/controller.js`
- Modify: `src/app.js`

- [ ] **Step 1: Write the failing test**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createControllerState } from '../src/ui/controller.js';

test('controller starts with no selected square', () => {
  const controller = createControllerState();
  assert.equal(controller.selected, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/controller.test.js`
Expected: FAIL because `src/ui/controller.js` is missing.

- [ ] **Step 3: Write minimal implementation**

Wire player input, AI turns, difficulty changes, restart, undo, and render updates.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/controller.test.js`
Expected: PASS

### Task 12: End-To-End Verification

**Files:**
- Modify: `tests/history.test.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('undo after player move before ai move restores previous state', () => {
  const state = createInitialState();
  applyMove(state, { from: [9, 0], to: [8, 0] });
  undoLastFullTurn(state);
  assert.equal(state.board[9][0], 'rr');
  assert.equal(state.currentSide, 'red');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test`
Expected: FAIL if undo only handles two-ply rollback.

- [ ] **Step 3: Write minimal implementation**

Adjust undo to support one-ply rollback, then run the full test suite.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS across all tests.

## Self-Review

- Spec coverage: board UI, difficulty selection, undo, and move history map to Tasks 10-12; rules and winner logic map to Tasks 4-6; AI strength differences map to Tasks 8-9.
- Placeholder scan: no `TBD` or `TODO` markers remain.
- Type consistency: `createInitialState`, `applyMove`, `undoLastFullTurn`, `getLegalMoves`, and `chooseAIMove` are used consistently across tasks.
