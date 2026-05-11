import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { cleanClipboardText } from '../src/clipboard-cleaner.mjs';

test('cleans terminal-copied markdown for clipboard use', () => {
  const input = [
    '没有服务器时，想搬到另一台电脑，最简单是直接打包整个',
    '文件夹，注意要包含隐藏的 .git 文件夹：',
    '',
    'cd ~/projects/productivity',
    'zip -r terminal-markdown-cleaner.zip terminal-',
    'markdown-cleaner',
  ].join('\n');

  assert.equal(
    cleanClipboardText(input),
    [
      '没有服务器时，想搬到另一台电脑，最简单是直接打包整个文件夹，注意要包含隐藏的 .git 文件夹：',
      '',
      'cd ~/projects/productivity',
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

test('preserves filename inventory lines while merging surrounding prose wraps', () => {
  const input = [
    '01-旅游美食-list.png',
    '02-旅游美食-detail.png',
    '03-学习区-demo.png',
    '04-ai-store-demo.png',
    '05-ai搜索收藏夹.png',
    '06-pc-ui-feature-before-after.png',
    '',
    '我识别用途主要靠两件事： 文件名和你给我的说明。 最省事的方式',
    '是，你放完后发我一句：',
    '',
    '我把截图放进 assets 了：',
    '01-旅游美食-list.png: 放在旅游/美食稳定性验证后面',
    '02-旅游美食-detail.png: 放在同一小节',
    '03-学习区-demo.png: 放在学习区 demo 小节',
    '04-ai-store-demo.png: 放在 AI Store 小节',
    '05-ai搜索收藏夹.png: 放在私域体验小节',
  ].join('\n');

  assert.equal(
    cleanClipboardText(input),
    [
      '01-旅游美食-list.png',
      '02-旅游美食-detail.png',
      '03-学习区-demo.png',
      '04-ai-store-demo.png',
      '05-ai搜索收藏夹.png',
      '06-pc-ui-feature-before-after.png',
      '',
      '我识别用途主要靠两件事： 文件名和你给我的说明。 最省事的方式是，你放完后发我一句：',
      '',
      '我把截图放进 assets 了：',
      '01-旅游美食-list.png: 放在旅游/美食稳定性验证后面',
      '02-旅游美食-detail.png: 放在同一小节',
      '03-学习区-demo.png: 放在学习区 demo 小节',
      '04-ai-store-demo.png: 放在 AI Store 小节',
      '05-ai搜索收藏夹.png: 放在私域体验小节',
    ].join('\n')
  );
});

test('cleans Claude Code wrapped mixed-language list output', () => {
  const input = [
    '  3. 重启 codex，进去后用 /mcp 之类的命令确认 chrome-devtools',
    '  已连上。',
    '',
    '  常见坑',
    '',
    '  - 如果 codex 之前没装过 MCP，先确认 codex 版本支持',
    '  MCP（codex --version，老版本不支持）。',
    '  - 9222 在 macOS 上偶尔会被其他进程占用，可以 lsof -i:9222',
    '  看一下。',
    '  - 如果你只想让 codex 用一个干净的',
    '  Chrome、不需要复用现有窗口，那其实不用 9222，直接 npx',
    '  chrome-devtools-mcp@latest 让它自己拉就行。只有"我想让 codex',
    '   看我现在这个 Chrome 在干嘛"才需要 9222 这条路。',
  ].join('\n');

  assert.equal(
    cleanClipboardText(input),
    [
      '3. 重启 codex，进去后用 /mcp 之类的命令确认 chrome-devtools 已连上。',
      '',
      '常见坑',
      '',
      '- 如果 codex 之前没装过 MCP，先确认 codex 版本支持 MCP（codex --version，老版本不支持）。',
      '- 9222 在 macOS 上偶尔会被其他进程占用，可以 lsof -i:9222 看一下。',
      '- 如果你只想让 codex 用一个干净的 Chrome、不需要复用现有窗口，那其实不用 9222，直接 npx chrome-devtools-mcp@latest 让它自己拉就行。只有"我想让 codex 看我现在这个 Chrome 在干嘛"才需要 9222 这条路。',
    ].join('\n')
  );
});
