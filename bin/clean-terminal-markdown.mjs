#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { cleanClipboardText } from '../src/clipboard-cleaner.mjs';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(
    [
      'Usage: clean-terminal-markdown [--clipboard] [--mode markdown|auto] [--table-format box|markdown]',
      '',
      'Without --clipboard, reads stdin and writes cleaned text to stdout.',
      'With --clipboard, reads macOS clipboard and replaces it with cleaned text.',
      '',
    ].join('\n')
  );
  process.exit(0);
}

const options = {
  mode: optionValue('--mode') ?? 'auto',
  tableOutputFormat: optionValue('--table-format') ?? 'box',
};

const useClipboard = args.includes('--clipboard');
const input = useClipboard ? readClipboard() : readFileSync(0, 'utf8');
const output = cleanClipboardText(input, options);

if (useClipboard) {
  writeClipboard(output);
} else {
  process.stdout.write(output);
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index === -1) {
    return null;
  }
  return args[index + 1] ?? null;
}

function readClipboard() {
  const result = spawnSync('pbpaste', { encoding: 'utf8' });
  if (result.status !== 0) {
    fail(`pbpaste failed: ${result.stderr || 'unknown error'}`);
  }
  return result.stdout;
}

function writeClipboard(text) {
  const result = spawnSync('pbcopy', {
    input: text,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    fail(`pbcopy failed: ${result.stderr || 'unknown error'}`);
  }
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
