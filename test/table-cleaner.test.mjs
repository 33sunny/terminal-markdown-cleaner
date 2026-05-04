import assert from 'node:assert/strict';
import test from 'node:test';

import { cleanTableText } from '../src/table-cleaner.mjs';

test('cleans mixed markdown prose and redraws a wrapped box drawing table', () => {
  const input = [
    '  ---',
    '  总结：4 层心理机制',
    '',
    '  ┌─────┬────────────────┬───────────────────────────┐',
    '  │ 层  │      机制      │          一句话           │',
    '  │ 次  │                │                           │',
    '  ├─────┼────────────────┼───────────────────────────┤',
    '  │ 一  │ 惨是强的压力测 │ 越惨还能撑住 = 他是真强   │',
    '  │ 层  │ 试             │                           │',
    '  ├─────┼────────────────┼───────────────────────────┤',
    '  │ 二  │ 惨是脆弱的权限 │ 他只在她面前露出这一面 =  │',
    '  │ 层  │                │ 她是唯一的                │',
    '  ├─────┼────────────────┼───────────────────────────┤',
    '  │ 三  │ 惨是驯服的证据 │ 他的每一次忍受都在说"我为 │',
    '  │ 层  │                │ 你"                       │',
    '  ├─────┼────────────────┼───────────────────────────┤',
    '  │ 四  │ 惨是欲望的代餐 │ 痛苦描写 ≈                │',
    '  │ 层  │                │ 欲望描写的安全包装        │',
    '  └─────┴────────────────┴───────────────────────────┘',
    '',
    '  这四层叠加起来，就是为什么"他好惨"不是一个减分项，而是',
    '  这个品类里最大的加分项。',
  ].join('\n');

  const expected = [
    '---',
    '总结：4 层心理机制',
    '',
    '┌──────┬──────────────────┬────────────────────────────────┐',
    '│ 层次 │       机制       │             一句话             │',
    '├──────┼──────────────────┼────────────────────────────────┤',
    '│ 一层 │ 惨是强的压力测试 │ 越惨还能撑住 = 他是真强        │',
    '├──────┼──────────────────┼────────────────────────────────┤',
    '│ 二层 │ 惨是脆弱的权限   │ 他只在她面前露出这一面 =       │',
    '│      │                  │ 她是唯一的                     │',
    '├──────┼──────────────────┼────────────────────────────────┤',
    '│ 三层 │ 惨是驯服的证据   │ 他的每一次忍受都在说"我为你"   │',
    '├──────┼──────────────────┼────────────────────────────────┤',
    '│ 四层 │ 惨是欲望的代餐   │ 痛苦描写 ≈ 欲望描写的安全包装  │',
    '└──────┴──────────────────┴────────────────────────────────┘',
    '',
    '这四层叠加起来，就是为什么"他好惨"不是一个减分项，而是这个品类里最大的加分项。',
  ].join('\n');

  assert.equal(cleanTableText(input), expected);
});

test('returns markdown cleanup when no box drawing table is present', () => {
  const input = [
    '  - 节奏排布、成文 prompt、子 agent 成文、审校 rewrite：',
    '    我来做。',
  ].join('\n');

  assert.equal(
    cleanTableText(input),
    '- 节奏排布、成文 prompt、子 agent 成文、审校 rewrite：我来做。'
  );
});

test('renders cleaned box drawing tables as markdown pipe tables when requested', () => {
  const input = [
    '  总结：4 层心理机制',
    '',
    '  ┌─────┬────────────────┬───────────────────────────┐',
    '  │ 层  │      机制      │          一句话           │',
    '  │ 次  │                │                           │',
    '  ├─────┼────────────────┼───────────────────────────┤',
    '  │ 二  │ 惨是脆弱的权限 │ 他只在她面前露出这一面 =  │',
    '  │ 层  │                │ 她是唯一的                │',
    '  └─────┴────────────────┴───────────────────────────┘',
    '',
    '  表格后面的句子被',
    '  继续合并。',
  ].join('\n');

  assert.equal(
    cleanTableText(input, { tableOutputFormat: 'markdown' }),
    [
      '总结：4 层心理机制',
      '',
      '| 层次 | 机制 | 一句话 |',
      '| --- | --- | --- |',
      '| 二层 | 惨是脆弱的权限 | 他只在她面前露出这一面 = 她是唯一的 |',
      '',
      '表格后面的句子被继续合并。',
    ].join('\n')
  );
});

test('normalizes terminal quote bars to markdown quotes in table markdown mode', () => {
  const input = [
    '  对外：',
    '',
    '  ▎ 长而瘦的指骨根根收拢在断臂黑衣人的喉骨处，直到一声传来清脆的碎骨声',
    '',
    '  ---',
  ].join('\n');

  assert.equal(
    cleanTableText(input, { tableOutputFormat: 'markdown' }),
    [
      '对外：',
      '',
      '> 长而瘦的指骨根根收拢在断臂黑衣人的喉骨处，直到一声传来清脆的碎骨声',
      '',
      '---',
    ].join('\n')
  );
});

test('widens and pads cramped terminal table columns after joining fragments', () => {
  const input = [
    '┌────┬──────┬────────────┐',
    '│层次│机制  │一句话      │',
    '├────┼──────┼────────────┤',
    '│一层│惨是强│越惨还能撑  │',
    '│    │的压力│住 =        │',
    '│    │测试  │他是真强    │',
    '└────┴──────┴────────────┘',
  ].join('\n');

  const cleaned = cleanTableText(input);

  assert.match(cleaned, /│ 一层 │ 惨是强的压力测试 │ 越惨还能撑住 = 他是真强\s+│/u);
  assert.doesNotMatch(cleaned, /\n│\s+│\s*的压力/u);
});

test('keeps redrawn tables compact by wrapping long joined cells', () => {
  const input = [
    '┌─────┬────────────────┬───────────────────────────┐',
    '│ 层  │      机制      │          一句话           │',
    '│ 次  │                │                           │',
    '├─────┼────────────────┼───────────────────────────┤',
    '│ 二  │ 惨是脆弱的权限 │ 他只在她面前露出这一面 =  │',
    '│ 层  │                │ 她是唯一的                │',
    '└─────┴────────────────┴───────────────────────────┘',
  ].join('\n');

  const cleaned = cleanTableText(input);
  const widths = cleaned.split('\n').map(displayWidth);

  assert.ok(Math.max(...widths) <= 60);
  assert.match(cleaned, /│ 二层 │ 惨是脆弱的权限\s+│ 他只在她面前露出这一面 =\s+│\n│\s+│\s+│ 她是唯一的\s+│/u);
});

function displayWidth(text) {
  let width = 0;
  for (const char of text) {
    width += /[\p{Script=Han}\u3040-\u30ff\uac00-\ud7af\uff01-\uff60\uffe0-\uffe6]/u.test(char)
      ? 2
      : 1;
  }
  return width;
}
