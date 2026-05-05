import { cleanMarkdown } from './cleaner.mjs';
import { cleanTableText } from './table-cleaner.mjs';

const DEFAULT_OPTIONS = {
  mode: 'auto',
  tableOutputFormat: 'box',
};

export function cleanClipboardText(input, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };

  if (settings.mode === 'markdown') {
    return cleanMarkdown(input, settings);
  }

  return cleanTableText(input, settings);
}
