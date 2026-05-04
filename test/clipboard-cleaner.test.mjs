import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { cleanClipboardText } from '../src/clipboard-cleaner.mjs';

test('cleans terminal-copied markdown for clipboard use', () => {
  const input = [
    '没有服务器时，想搬到另一台电脑，最简单是直接打包整个',
    '文件夹，注意要包含隐藏的 .git 文件夹：',
    '',
    'cd /Users/shan/projects/productivity',
    'zip -r terminal-markdown-cleaner.zip terminal-',
    'markdown-cleaner',
  ].join('\n');

  assert.equal(
    cleanClipboardText(input),
    [
      '没有服务器时，想搬到另一台电脑，最简单是直接打包整个文件夹，注意要包含隐藏的 .git 文件夹：',
      '',
      'cd /Users/shan/projects/productivity',
      'zip -r terminal-markdown-cleaner.zip terminal-markdown-cleaner',
    ].join('\n')
  );
});

test('CLI cleans stdin to stdout', () => {
  const result = spawnSync(
    process.execPath,
    ['bin/clean-terminal-markdown.mjs'],
    {
      cwd: new URL('..', import.meta.url),
      input: ['  比如原文里：', '  这是被终端折行的', '中文。'].join('\n'),
      encoding: 'utf8',
    }
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '比如原文里：这是被终端折行的中文。');
  assert.equal(result.stderr, '');
});
