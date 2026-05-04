import { cleanMarkdown } from './cleaner.mjs';
import { shortcutActionForEvent } from './shortcuts.mjs';
import { cleanTableText } from './table-cleaner.mjs';
import { terminalGridLines } from './terminal-grid.mjs';

const sampleTexts = {
  markdown: [
    '❯   比如原文里：',
    '',
    '\\u001b[32m> 他能做的，好像永远只有这些小的，微不足道的事情。\\u001b[0m',
    '',
    '不能抽成“男主说自己做小事”。应该抽成：',
    '',
    '暗处补位 + 付出自轻',
    '',
    '- 适用阶段： 男主已围绕女主行动，但还没确认关系。',
    '- 必备条件： 女主在主局，男主在外局；男主确实做了有价',
    '值',
    '的事；男主自己不把它当功劳。',
    '- 爽点机制： 读者比男主更清楚他做得很多，于是心疼、甜、',
    '觉得女主值得他这样。',
    '- 可迁移槽位： 守夜、留证、传讯、挡灾、补查、等候、收',
    '尾。',
    '- 禁忌： 不要让男主自我感动地说“我为她牺牲好多”。',
    '',
    '```js',
    'const value = "有价',
    '值";',
    '```',
  ].join('\n'),
  table: [
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
  ].join('\n'),
};

const rawInput = document.querySelector('#raw-input');
const cleanOutput = document.querySelector('#clean-output');
const visualPreview = document.querySelector('#visual-preview');
const rawCount = document.querySelector('#raw-count');
const cleanCount = document.querySelector('#clean-count');
const status = document.querySelector('#status');
const copyButton = document.querySelector('#copy-button');
const clearButton = document.querySelector('#clear-button');
const sampleButton = document.querySelector('#sample-button');
const tabButtons = [...document.querySelectorAll('.tab')];
const tableFormatOption = document.querySelector('#table-format-option');
const tableFormatControls = [
  ...document.querySelectorAll('input[name="table-output-format"]'),
];
let activeMode = 'markdown';

const optionControls = {
  mergeSoftWraps: document.querySelector('#merge-soft-wraps'),
  cleanTerminalChrome: document.querySelector('#clean-terminal-chrome'),
  preserveCodeFences: document.querySelector('#preserve-code-fences'),
  compactCjk: document.querySelector('#compact-cjk'),
};

function currentOptions() {
  const options = Object.fromEntries(
    Object.entries(optionControls).map(([key, element]) => [key, element.checked])
  );
  options.tableOutputFormat = currentTableOutputFormat();
  return options;
}

function updateOutput() {
  const raw = rawInput.value;
  const options = currentOptions();
  const cleaned =
    activeMode === 'table' ? cleanTableText(raw, options) : cleanMarkdown(raw, options);
  cleanOutput.value = cleaned;
  updateVisualPreview();
  updateCounts();
  setStatus(raw ? `${modeLabel()} preview updated` : 'Ready');
}

function updateVisualPreview() {
  const showPreview =
    activeMode === 'table' &&
    currentTableOutputFormat() === 'box' &&
    cleanOutput.value.trim() !== '';
  visualPreview.hidden = !showPreview;
  visualPreview.parentElement.classList.toggle('has-preview', showPreview);

  if (!showPreview) {
    visualPreview.replaceChildren();
    return;
  }

  visualPreview.replaceChildren(...renderTerminalGrid(cleanOutput.value));
}

function updateCounts() {
  rawCount.textContent = formatCount(rawInput.value);
  cleanCount.textContent = formatCount(cleanOutput.value);
}

function formatCount(value) {
  const chars = [...value].length;
  const lines = value ? value.split('\n').length : 0;
  return `${chars} chars / ${lines} lines`;
}

function setStatus(message, tone = '') {
  status.textContent = message;
  if (tone) {
    status.dataset.tone = tone;
  } else {
    delete status.dataset.tone;
  }
}

async function copyCleanedText() {
  if (!cleanOutput.value) {
    setStatus('Nothing to copy', 'warn');
    return;
  }

  try {
    await navigator.clipboard.writeText(cleanOutput.value);
    setStatus('Copied', 'ok');
  } catch {
    cleanOutput.focus();
    cleanOutput.select();
    document.execCommand('copy');
    setStatus('Copied from selection', 'ok');
  }
}

rawInput.addEventListener('input', updateOutput);
cleanOutput.addEventListener('input', () => {
  updateVisualPreview();
  updateCounts();
  setStatus('Edited clean text');
});
copyButton.addEventListener('click', copyCleanedText);
clearButton.addEventListener('click', () => {
  clearText();
});
sampleButton.addEventListener('click', () => {
  rawInput.value = sampleTexts[activeMode]
    .replaceAll('\\\\u001b', '\u001b')
    .replaceAll('\\u001b', '\u001b');
  updateOutput();
  rawInput.focus();
});

for (const element of Object.values(optionControls)) {
  element.addEventListener('change', updateOutput);
}

for (const element of tableFormatControls) {
  element.addEventListener('change', updateOutput);
}

for (const button of tabButtons) {
  button.addEventListener('click', () => {
    activeMode = button.dataset.mode;
    updateTabs();
    updateOutput();
  });
}

document.addEventListener('keydown', (event) => {
  const action = shortcutActionForEvent(event);
  if (!action) {
    return;
  }

  event.preventDefault();
  if (action === 'clear') {
    clearText();
  } else if (action === 'copy') {
    copyCleanedText();
  }
});

function clearText() {
  rawInput.value = '';
  cleanOutput.value = '';
  updateVisualPreview();
  updateCounts();
  setStatus('Cleared');
  rawInput.focus();
}

function updateTabs() {
  for (const button of tabButtons) {
    const isActive = button.dataset.mode === activeMode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  }
  tableFormatOption.hidden = activeMode !== 'table';
}

function modeLabel() {
  return activeMode === 'table' ? 'Table' : 'Markdown';
}

function currentTableOutputFormat() {
  return tableFormatControls.find((element) => element.checked)?.value ?? 'box';
}

function renderTerminalGrid(text) {
  return terminalGridLines(text).map((line) => {
    const lineElement = document.createElement('div');
    lineElement.className = 'terminal-grid-line';

    if (line.length === 0) {
      lineElement.append(document.createTextNode('\u00a0'));
      return lineElement;
    }

    for (const token of line) {
      const tokenElement = document.createElement('span');
      tokenElement.className = 'terminal-grid-cell';
      tokenElement.style.inlineSize = `${token.width}ch`;
      tokenElement.textContent = token.text;
      lineElement.append(tokenElement);
    }

    return lineElement;
  });
}

updateOutput();
