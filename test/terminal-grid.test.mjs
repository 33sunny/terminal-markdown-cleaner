import assert from 'node:assert/strict';
import test from 'node:test';

import { terminalGridLines } from '../src/terminal-grid.mjs';

test('tokenizes ASCII and CJK into terminal cell widths', () => {
  assert.deepEqual(terminalGridLines('A惨│'), [
    [
      { text: 'A', width: 1 },
      { text: '惨', width: 2 },
      { text: '│', width: 1 },
    ],
  ]);
});

test('preserves empty lines for preview layout', () => {
  assert.deepEqual(terminalGridLines('a\n\n好'), [
    [{ text: 'a', width: 1 }],
    [],
    [{ text: '好', width: 2 }],
  ]);
});
