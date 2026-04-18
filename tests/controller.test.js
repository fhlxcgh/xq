import test from 'node:test';
import assert from 'node:assert/strict';
import { createControllerState } from '../src/ui/controller.js';

test('controller starts with no selected square', () => {
  const controller = createControllerState();
  assert.equal(controller.selected, null);
});
