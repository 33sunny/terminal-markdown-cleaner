import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanMarkdown } from '../src/cleaner.mjs';

test('strips ANSI sequences and terminal chrome without removing markdown quotes', () => {
  const input = [
    '\u001b[90m❯\u001b[0m   比如原文里：',
    '│',
    '\u001b[32m> 他能做的，好像永远只有这些小的，微不足道的事情。\u001b[0m',
    '╰─',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    '比如原文里：\n\n> 他能做的，好像永远只有这些小的，微不足道的事情。'
  );
});

test('joins Chinese terminal soft wraps inside a markdown list item', () => {
  const input = [
    '- 必备条件： 女主在主局，男主在外局；男主确实做了有价',
    '值',
    '的事；男主自己不把它当功劳。',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    '- 必备条件： 女主在主局，男主在外局；男主确实做了有价值的事；男主自己不把它当功劳。'
  );
});

test('preserves separate markdown list items', () => {
  const input = [
    '- 适用阶段： 男主已围绕女主行动，但还没确认关系。',
    '- 爽点机制： 读者比男主更清楚他做得很多。',
    '- 禁忌： 不要让男主自我感动。',
  ].join('\n');

  assert.equal(cleanMarkdown(input), input);
});

test('preserves arrow-prefixed action lines as separate blocks', () => {
  const input = [
    '  方案二更像“细剧情驱动”：',
    '',
    '  把章节拆成很细的小剧情动作',
    '  -> 每个动作都去索引参考',
    '  -> 有匹配就借鉴，没有就让成文 agent 自行发挥',
    '  → 最后用节奏排布控制删减和合并',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    [
      '方案二更像“细剧情驱动”：',
      '',
      '把章节拆成很细的小剧情动作',
      '-> 每个动作都去索引参考',
      '-> 有匹配就借鉴，没有就让成文 agent 自行发挥',
      '→ 最后用节奏排布控制删减和合并',
    ].join('\n')
  );
});

test('joins wrapped English prose with a space', () => {
  const input = [
    'This is a sentence copied from a narrow terminal where the',
    'next visual line is still the same paragraph.',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    'This is a sentence copied from a narrow terminal where the next visual line is still the same paragraph.'
  );
});

test('removes two-space terminal gutter from prose and markdown blocks', () => {
  const input = [
    '  比如原文里：',
    '',
    '  > 他能做的，好像永远只有这些小的，微不足道的事情。',
    '',
    '  - 适用阶段： 男主已围绕女主行动，但还没确认关系。',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    [
      '比如原文里：',
      '',
      '> 他能做的，好像永远只有这些小的，微不足道的事情。',
      '',
      '- 适用阶段： 男主已围绕女主行动，但还没确认关系。',
    ].join('\n')
  );
});

test('does not merge text after a horizontal rule', () => {
  const input = [
    '  ---',
    '  第二层：“惨是他的脆弱权限”——对外人设的裂隙只对她开放',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    '---\n第二层：“惨是他的脆弱权限”——对外人设的裂隙只对她开放'
  );
});

test('preserves leading quote markers from terminal-rendered output', () => {
  const input = [
    '  ▎ 他赌来人张狂自大，赌他不将自己',
    '  > 放在眼里，亦赌他们心有顾忌。',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    '▎ 他赌来人张狂自大，赌他不将自己\n> 放在眼里，亦赌他们心有顾忌。'
  );
});

test('merges wrapped lines that share the same quote marker', () => {
  const input = [
    '  ▎ 溯侑璀然一笑……"臣被围困。""没',
    '  ▎ 法退了。"',
    '',
    '  > This quoted line wraps in the',
    '  > terminal.',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    [
      '▎ 溯侑璀然一笑……"臣被围困。""没法退了。"',
      '',
      '> This quoted line wraps in the terminal.',
    ].join('\n')
  );
});

test('merges a list item title ending with colon into its continuation', () => {
  const input = [
    '- 节奏排布、成文 prompt、子 agent 成文、审校 rewrite：',
    '  我来做。',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    '- 节奏排布、成文 prompt、子 agent 成文、审校 rewrite：我来做。'
  );
});

test('keeps fenced code blocks verbatim after terminal cleanup', () => {
  const input = [
    '  说明：',
    '',
    '  ```js',
    'const value = "有价',
    '值";',
    '  console.log(value);',
    '  ```',
  ].join('\n');

  assert.equal(
    cleanMarkdown(input),
    [
      '说明：',
      '',
      '```js',
      'const value = "有价',
      '值";',
      '  console.log(value);',
      '```',
    ].join('\n')
  );
});

test('keeps hard markdown breaks when the previous line ends with punctuation', () => {
  const input = [
    '不能抽成“男主说自己做小事”。应该抽成：',
    '',
    '暗处补位 + 付出自轻',
    '',
    '这样它才有扩展性。',
  ].join('\n');

  assert.equal(cleanMarkdown(input), input);
});
