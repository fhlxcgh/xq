# Chinese Chess AI Strength Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the chess AI so `hard` makes materially better tactical decisions, avoids obvious blunders, and behaves deterministically.

**Architecture:** Keep the public AI entrypoint as `chooseAIMove(state, difficulty)`. Improve strength in two layers: `src/ai/evaluate.js` gets better tactical and king-safety signals, while `src/ai/search.js` gets deterministic iterative deepening, move ordering, and deeper presets without changing UI integration.

**Tech Stack:** JavaScript, Node.js built-in test runner

---

## File Structure

- Modify: `src/ai/evaluate.js` - richer board evaluation, attack exposure, king safety
- Modify: `src/ai/search.js` - deterministic search presets, move ordering, iterative deepening
- Modify: `tests/ai.test.js` - AI behavior regression tests for tactical choices and determinism

### Task 1: Add Failing AI Behavior Tests

**Files:**
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
test('hard prefers capturing a free rook over a quiet move', () => {
  const state = {
    board: Array.from({ length: 10 }, () => Array(9).fill(null)),
    currentSide: 'black',
    winner: null,
    history: [],
  };
  state.board[0][4] = 'bk';
  state.board[9][4] = 'rk';
  state.board[2][4] = 'bc';
  state.board[7][4] = 'rr';

  const move = chooseAIMove(state, 'hard');
  assert.deepEqual(move, { from: [2, 4], to: [7, 4] });
});

test('hard is deterministic for the same position', () => {
  const state = createInitialState();
  state.currentSide = 'black';
  const first = chooseAIMove(state, 'hard');
  const second = chooseAIMove(state, 'hard');
  assert.deepEqual(second, first);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/ai.test.js`
Expected: FAIL because `hard` still uses random noise / random pool selection and may not prioritize the tactical capture.

- [ ] **Step 3: Commit the failing tests**

```bash
git add tests/ai.test.js
git commit -m "test: cover ai tactical strength"
```

### Task 2: Remove Hard-Mode Randomness And Add Iterative Deepening

**Files:**
- Modify: `src/ai/search.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write an additional failing test for stable best-move selection**

```javascript
test('hard returns the top-ranked move instead of choosing from a pool', () => {
  const state = createInitialState();
  state.currentSide = 'black';
  const moves = Array.from({ length: 5 }, () => chooseAIMove(state, 'hard'));
  assert.ok(moves.every((move) => JSON.stringify(move) === JSON.stringify(moves[0])));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai.test.js`
Expected: FAIL because `hard` can return different moves across calls.

- [ ] **Step 3: Write minimal implementation**

```javascript
const PRESETS = {
  easy: { maxDepth: 1, topN: 4, noise: 50, randomize: true },
  medium: { maxDepth: 2, topN: 2, noise: 8, randomize: true },
  hard: { maxDepth: 3, topN: 1, noise: 0, randomize: false },
};

function searchBestMove(state, preset) {
  let best = null;
  for (let depth = 1; depth <= preset.maxDepth; depth += 1) {
    best = searchAtDepth(state, depth, preset);
  }
  return best;
}

export function chooseAIMove(state, difficulty = 'medium') {
  const preset = PRESETS[difficulty] ?? PRESETS.medium;
  const best = searchBestMove(state, preset);
  return best?.move ?? null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ai.test.js`
Expected: PASS for deterministic `hard`, while other AI tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/ai/search.js tests/ai.test.js
git commit -m "feat: make hard ai deterministic"
```

### Task 3: Add Tactical Move Ordering

**Files:**
- Modify: `src/ai/search.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('hard finds the tactical capture before quiet alternatives', () => {
  const state = {
    board: Array.from({ length: 10 }, () => Array(9).fill(null)),
    currentSide: 'black',
    winner: null,
    history: [],
  };
  state.board[0][4] = 'bk';
  state.board[9][4] = 'rk';
  state.board[2][1] = 'bc';
  state.board[7][1] = 'rr';
  state.board[2][7] = 'bn';

  const move = chooseAIMove(state, 'hard');
  assert.deepEqual(move, { from: [2, 1], to: [7, 1] });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai.test.js`
Expected: FAIL or flaky because search explores moves in board order rather than tactical priority.

- [ ] **Step 3: Write minimal implementation**

```javascript
function moveOrderingScore(state, move, side) {
  const target = state.board[move.to[0]][move.to[1]];
  const attacker = state.board[move.from[0]][move.from[1]];
  let score = 0;
  if (target) score += PIECE_VALUES[target[1]] * 10 - PIECE_VALUES[attacker[1]];
  if (move.to[1] === 4) score += 5;
  if (side === state.currentSide) score += 1;
  return score;
}

function orderMoves(state, moves, side) {
  return [...moves].sort(
    (a, b) => moveOrderingScore(state, b, side) - moveOrderingScore(state, a, side)
  );
}
```

Use `orderMoves(...)` in both maximizing and minimizing branches before recursion.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ai.test.js`
Expected: PASS for the tactical-capture ordering case.

- [ ] **Step 5: Commit**

```bash
git add src/ai/search.js tests/ai.test.js
git commit -m "feat: order ai moves tactically"
```

### Task 4: Penalize Hanging Pieces In Evaluation

**Files:**
- Modify: `src/ai/evaluate.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
test('evaluation penalizes an exposed rook', () => {
  const safe = {
    board: Array.from({ length: 10 }, () => Array(9).fill(null)),
    currentSide: 'red',
    winner: null,
    history: [],
  };
  safe.board[9][4] = 'rk';
  safe.board[0][4] = 'bk';
  safe.board[7][4] = 'rr';

  const hanging = structuredClone(safe);
  hanging.board[2][4] = 'bc';

  assert.ok(evaluateBoard(hanging, 'red') < evaluateBoard(safe, 'red'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai.test.js`
Expected: FAIL because the current evaluator mostly counts material and mobility.

- [ ] **Step 3: Write minimal implementation**

```javascript
function attackPenalty(state, perspective) {
  let penalty = 0;
  for (let row = 0; row < state.board.length; row += 1) {
    for (let col = 0; col < state.board[row].length; col += 1) {
      const piece = state.board[row][col];
      if (!piece || sideOf(piece) !== perspective) continue;
      if (isSquareAttackedBy(state, row, col, oppositeSide(perspective))) {
        penalty += Math.floor(PIECE_VALUES[piece[1]] * 0.18);
      }
    }
  }
  return penalty;
}
```

Subtract `attackPenalty(state, perspective)` inside `evaluateBoard`, with heavier weight for rooks, cannons, and horses.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ai.test.js`
Expected: PASS for exposed-piece evaluation and existing evaluation tests.

- [ ] **Step 5: Commit**

```bash
git add src/ai/evaluate.js tests/ai.test.js
git commit -m "feat: penalize hanging pieces"
```

### Task 5: Add King Safety Pressure To Evaluation

**Files:**
- Modify: `src/ai/evaluate.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('evaluation penalizes an exposed king file', () => {
  const sheltered = {
    board: Array.from({ length: 10 }, () => Array(9).fill(null)),
    currentSide: 'red',
    winner: null,
    history: [],
  };
  sheltered.board[9][4] = 'rk';
  sheltered.board[0][4] = 'bk';
  sheltered.board[7][4] = 'rp';

  const exposed = structuredClone(sheltered);
  exposed.board[7][4] = null;
  exposed.board[2][4] = 'br';

  assert.ok(evaluateBoard(exposed, 'red') < evaluateBoard(sheltered, 'red'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ai.test.js`
Expected: FAIL because king safety is not evaluated directly.

- [ ] **Step 3: Write minimal implementation**

```javascript
function kingSafetyScore(state, perspective) {
  const king = findKing(state, perspective);
  if (!king) return -50000;
  let score = 0;
  const enemy = perspective === 'red' ? 'black' : 'red';
  if (isSquareAttackedBy(state, king.row, king.col, enemy)) score -= 180;
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const row = king.row + dr;
    const col = king.col + dc;
    if (state.board[row]?.[col] && sideOf(state.board[row][col]) === perspective) score += 12;
  }
  return score;
}
```

Add `kingSafetyScore` into the total evaluation.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test tests/ai.test.js`
Expected: PASS for king-exposure coverage.

- [ ] **Step 5: Commit**

```bash
git add src/ai/evaluate.js tests/ai.test.js
git commit -m "feat: score king safety"
```

### Task 6: Rebalance Difficulties And Run Full Verification

**Files:**
- Modify: `src/ai/search.js`
- Modify: `tests/ai.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
test('medium may differ, but hard stays stable and tactical', () => {
  const state = createInitialState();
  state.currentSide = 'black';
  assert.deepEqual(chooseAIMove(state, 'hard'), chooseAIMove(state, 'hard'));
  assert.ok(chooseAIMove(state, 'medium'));
});
```

- [ ] **Step 2: Run test to verify it fails if difficulty behavior is still coupled**

Run: `node --test tests/ai.test.js`
Expected: FAIL if `medium` and `hard` still share the same shallow/random policy.

- [ ] **Step 3: Write minimal implementation**

```javascript
const PRESETS = {
  easy: { maxDepth: 1, topN: 4, noise: 40, randomize: true },
  medium: { maxDepth: 2, topN: 2, noise: 6, randomize: true },
  hard: { maxDepth: 3, topN: 1, noise: 0, randomize: false },
};
```

Keep `hard` deterministic and stronger; keep `easy`/`medium` playable and faster.

- [ ] **Step 4: Run full verification**

Run: `npm test`
Expected: PASS with all existing tests and new AI behavior tests green.

- [ ] **Step 5: Commit**

```bash
git add src/ai/search.js src/ai/evaluate.js tests/ai.test.js
git commit -m "feat: strengthen chess ai"
```

## Self-Review

- Spec coverage: evaluation improvements, deterministic `hard`, tactical ordering, stronger search depth, and AI regression tests are all covered in Tasks 1-6.
- Placeholder scan: no `TODO` or undefined handoff steps remain.
- Type consistency: all tasks keep `chooseAIMove(state, difficulty)` as the public interface and reuse `evaluateBoard(state, perspective)` consistently.
