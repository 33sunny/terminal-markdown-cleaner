export function shortcutActionForEvent(event) {
  if (event.isComposing || event.altKey || event.ctrlKey || event.shiftKey) {
    return null;
  }

  if (!event.metaKey && event.key === 'F1') {
    return 'clear';
  }

  if (event.metaKey && event.key.toLowerCase() === 'c') {
    if (hasEditableSelection(event.target)) {
      return null;
    }
    return 'copy';
  }

  return null;
}

function hasEditableSelection(target) {
  if (!target) {
    return false;
  }

  const tagName = target.tagName?.toUpperCase();
  if (
    (tagName === 'TEXTAREA' || tagName === 'INPUT') &&
    typeof target.selectionStart === 'number' &&
    typeof target.selectionEnd === 'number'
  ) {
    return target.selectionStart !== target.selectionEnd;
  }

  return Boolean(target.isContentEditable);
}
