import { cleanMarkdown } from './cleaner.mjs';
import { cleanTableText } from './table-cleaner.mjs';

const DEFAULT_OPTIONS = {
  mode: 'auto',
  tableOutputFormat: 'box',
  quoteOutput: false,
};

export function cleanClipboardText(input, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const cleaned =
    settings.mode === 'markdown'
      ? cleanMarkdown(input, settings)
      : cleanTableText(input, settings);

  return settings.quoteOutput ? quoteMarkdown(cleaned) : cleaned;
}

function quoteMarkdown(text) {
  return text
    .split('\n')
    .map((line) => (line.trim() === '' ? '>' : `> ${line}`))
    .join('\n');
}
