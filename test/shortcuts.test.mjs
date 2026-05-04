import assert from 'node:assert/strict';
import test from 'node:test';

import { shortcutActionForEvent } from '../src/shortcuts.mjs';

test('maps F1 and Command+C to cleaner actions', () => {
  assert.equal(shortcutActionForEvent(eventFor('F1')), 'clear');
  assert.equal(shortcutActionForEvent({ ...eventFor('c'), metaKey: true }), 'copy');
  assert.equal(shortcutActionForEvent({ ...eventFor('C'), metaKey: true }), 'copy');
});

test('does not map F2 or plain letters to cleaner actions', () => {
  assert.equal(shortcutActionForEvent(eventFor('F2')), null);
  assert.equal(shortcutActionForEvent(eventFor('c')), null);
  assert.equal(shortcutActionForEvent(eventFor('p')), null);
});

test('maps F1 and Command+C inside editable fields without selected text', () => {
  assert.equal(shortcutActionForEvent(eventFor('F1', 'textarea')), 'clear');
  assert.equal(
    shortcutActionForEvent({
      ...eventFor('c', 'textarea'),
      metaKey: true,
      target: inputTarget('TEXTAREA', 0, 0),
    }),
    'copy'
  );
  assert.equal(
    shortcutActionForEvent({
      ...eventFor('F1', 'div'),
      target: { tagName: 'DIV', isContentEditable: true },
    }),
    'clear'
  );
});

test('leaves Command+C native when editable text is selected', () => {
  assert.equal(
    shortcutActionForEvent({
      ...eventFor('c', 'textarea'),
      metaKey: true,
      target: inputTarget('TEXTAREA', 0, 3),
    }),
    null
  );
  assert.equal(
    shortcutActionForEvent({
      ...eventFor('c', 'input'),
      metaKey: true,
      target: inputTarget('INPUT', 2, 5),
    }),
    null
  );
  assert.equal(
    shortcutActionForEvent({
      ...eventFor('c', 'div'),
      metaKey: true,
      target: { tagName: 'DIV', isContentEditable: true },
    }),
    null
  );
});

test('ignores shortcuts with modifiers or during IME composition', () => {
  assert.equal(shortcutActionForEvent({ ...eventFor('F1'), metaKey: true }), null);
  assert.equal(shortcutActionForEvent({ ...eventFor('c'), ctrlKey: true }), null);
  assert.equal(shortcutActionForEvent({ ...eventFor('F1'), isComposing: true }), null);
});

function eventFor(key, tagName = 'body') {
  return {
    key,
    target: { tagName: tagName.toUpperCase(), isContentEditable: false },
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    isComposing: false,
  };
}

function inputTarget(tagName, selectionStart, selectionEnd) {
  return {
    tagName,
    isContentEditable: false,
    selectionStart,
    selectionEnd,
  };
}
