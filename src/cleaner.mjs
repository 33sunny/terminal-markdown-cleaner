const ANSI_PATTERN =
  /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const DEFAULT_OPTIONS = {
  stripAnsi: true,
  cleanTerminalChrome: true,
  mergeSoftWraps: true,
  preserveCodeFences: true,
  compactCjk: true,
};

export function cleanMarkdown(input, options = {}) {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const raw = String(input ?? '').replace(/\r\n?/g, '\n');
  const cleanedLines = raw
    .split('\n')
    .map((line) => cleanTerminalLine(line, settings));

  const merged = mergeMarkdownLines(cleanedLines, settings);
  return trimOuterBlankLines(collapseBlankRuns(merged)).join('\n');
}

function cleanTerminalLine(line, settings) {
  let value = settings.stripAnsi ? line.replace(ANSI_PATTERN, '') : line;
  value = value.replace(/\u0008/g, '').replace(/\s+$/u, '');

  if (!settings.cleanTerminalChrome) {
    return value;
  }

  value = value.replace(/^[ \t]*(?:❯|›|➜|λ|\$) {1,4}/u, '');
  value = value.replace(/^[ \t]*[▌█▍▏]+[ \t]*/u, '');

  if (/^[ \t]*[╭╮╰╯┌┐└┘├┤┬┴┼─━═╼╾╍╎╏│┃┆┇┊┋]+[ \t]*$/u.test(value)) {
    return value.includes('│') || value.includes('┃') ? '' : null;
  }

  value = value.replace(/^[ \t]*[│┃][ \t]?/u, '');
  return value;
}

function mergeMarkdownLines(lines, settings) {
  const output = [];
  let inFence = false;
  let fenceMarker = null;

  for (const line of lines) {
    if (line === null) {
      continue;
    }

    const structuralLine = settings.cleanTerminalChrome
      ? removeTerminalGutter(line)
      : line;
    const trimmed = structuralLine.trim();
    const fence = trimmed.match(/^(```+|~~~+)/u)?.[1];
    if (settings.preserveCodeFences && fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[0];
      } else if (fence[0] === fenceMarker) {
        inFence = false;
        fenceMarker = null;
      }
      output.push(structuralLine);
      continue;
    }

    if (inFence || !settings.mergeSoftWraps) {
      output.push(line);
      continue;
    }

    const markdownLine = structuralLine;

    if (trimmed === '') {
      output.push('');
      continue;
    }

    const previousIndex = lastContentLineIndex(output);
    const previous = previousIndex >= 0 ? output[previousIndex] : '';

    if (previous && shouldMerge(previous, markdownLine)) {
      output[previousIndex] = joinSoftWrappedLine(previous, markdownLine, settings);
    } else if (previous && shouldMergeQuotedLine(previous, markdownLine)) {
      output[previousIndex] = joinQuotedSoftWrappedLine(previous, markdownLine, settings);
    } else {
      output.push(markdownLine);
    }
  }

  return output;
}

function removeTerminalGutter(line) {
  return line.startsWith('  ') ? line.slice(2) : line;
}

function shouldMerge(previous, current) {
  const prev = previous.trimEnd();
  const next = current.trimStart();

  if (!prev || !next) {
    return false;
  }

  if (isShellCommandLine(prev) && isShellCommandLine(next)) {
    return false;
  }

  if (isFileRecordLine(prev) || isFileRecordLine(next)) {
    return false;
  }

  if (isMarkdownBlockStart(next)) {
    return false;
  }

  if (isHorizontalRule(prev)) {
    return false;
  }

  if (endsWithHardStop(prev)) {
    return false;
  }

  return true;
}

function shouldMergeQuotedLine(previous, current) {
  const prevQuote = parseQuoteMarker(previous);
  const nextQuote = parseQuoteMarker(current);

  if (!prevQuote || !nextQuote || prevQuote.marker !== nextQuote.marker) {
    return false;
  }

  if (!prevQuote.content || !nextQuote.content) {
    return false;
  }

  if (isMarkdownBlockStart(nextQuote.content)) {
    return false;
  }

  return !endsWithHardStop(prevQuote.content);
}

function joinQuotedSoftWrappedLine(previous, current, settings) {
  const nextQuote = parseQuoteMarker(current);
  const right = nextQuote ? nextQuote.content : current.trimStart();
  const glue = joinerFor(previous.trimEnd(), right, settings);
  return `${previous.trimEnd()}${glue}${right}`;
}

function joinSoftWrappedLine(previous, current, settings) {
  const left = previous.trimEnd();
  const right = current.trimStart();
  const glue = joinerFor(left, right, settings);
  return `${left}${glue}${right}`;
}

function joinerFor(left, right, settings) {
  const last = [...left].at(-1) ?? '';
  const first = [...right].at(0) ?? '';

  if (!last || !first || /\s/u.test(last) || /\s/u.test(first)) {
    return '';
  }

  if (last === '-' && /[\p{Letter}\p{Number}_]/u.test(first)) {
    return '';
  }

  if (last === '/') {
    return '';
  }

  if (/[:：、，,；;]$/u.test(left.trimEnd())) {
    return '';
  }

  if (/[\[({<"'`]/u.test(last) || /[\])}>.,;:!?，。！？；：、"'`]/u.test(first)) {
    return '';
  }

  if (settings.compactCjk && (isCjk(last) || isCjk(first))) {
    return needsSpaceAroundMixedCjkToken(left, right) ? ' ' : '';
  }

  return ' ';
}

function needsSpaceAroundMixedCjkToken(left, right) {
  const last = [...left.trimEnd()].at(-1) ?? '';
  const first = [...right.trimStart()].at(0) ?? '';

  if (!last || !first || (isCjk(last) && isCjk(first))) {
    return false;
  }

  if (isCjk(last)) {
    return /^[A-Za-z@/#$._-]/u.test(right.trimStart());
  }

  const trailingToken = left.trimEnd().match(/\S+$/u)?.[0] ?? '';
  return /[A-Za-z@/#$._-]/u.test(trailingToken);
}

function isMarkdownBlockStart(line) {
  return (
    /^#{1,6}\s+/u.test(line) ||
    /^>\s?/u.test(line) ||
    /^▎\s?/u.test(line) ||
    /^(?:->|→)\s+/u.test(line) ||
    /^(?:[-*+]|\d{1,3}[.)])\s+/u.test(line) ||
    isEnumeratedListLine(line) ||
    isHorizontalRule(line) ||
    /^\|.*\|$/u.test(line) ||
    /^ {0,3}```/u.test(line) ||
    /^ {0,3}~~~/u.test(line)
  );
}

function isHorizontalRule(line) {
  return /^ {0,3}(?:[-*_]){3,}\s*$/u.test(line);
}

function isEnumeratedListLine(line) {
  const trimmed = line.trimStart();
  return (
    isOrderedListMarkerLine(trimmed) ||
    isUnorderedListMarkerLine(trimmed)
  );
}

function isOrderedListMarkerLine(line) {
  const separator = String.raw`(?:[、.．。:)）]\s*|\s+)?`;
  const requiredSeparator = String.raw`(?:[、.．。:)）]\s*|\s+)`;
  const cjk = String.raw`[\p{Script=Han}\u3040-\u30ff\uac00-\ud7af]`;
  return (
    new RegExp(String.raw`^\d{1,3}(?!\d)${separator}\S`, 'u').test(line) ||
    new RegExp(String.raw`^[\u2460-\u2473\u3251-\u325f\u32b1-\u32bf]${separator}\S`, 'u').test(line) ||
    new RegExp(String.raw`^[一二三四五六七八九十百千万零〇两]{1,4}${requiredSeparator}\S`, 'u').test(line) ||
    new RegExp(String.raw`^[A-Za-z](?:[、.．。:)）]\s*|\s+|(?=${cjk}))\S`, 'u').test(line)
  );
}

function isUnorderedListMarkerLine(line) {
  return /^(?:[*●·•]|-(?!-)|\+(?!\+))(?:[、.．。:)）]\s*|\s+)?\S/u.test(line);
}

function isShellCommandLine(line) {
  return /^(?:awk|brew|bun|cargo|cat|cd|chmod|chown|code|cp|curl|docker|docker-compose|echo|export|find|git|go|grep|ls|make|mkdir|mv|nano|node|npm|npx|open|pnpm|pwd|python|python3|rg|rm|rsync|scp|sed|ssh|tar|touch|unzip|uv|vim|wget|yarn|zip)(?:\s|$)/u.test(
    line.trim()
  );
}

function isFileRecordLine(line) {
  const filenamePattern =
    String.raw`\S+\.(?:png|jpe?g|webp|gif|svg|pdf|md|txt|json|csv|tsv|xlsx?|docx?|pptx?|html?|css|mjs|js|ts|tsx|jsx)`;
  const trimmed = line.trim();
  return (
    new RegExp(`^${filenamePattern}$`, 'iu').test(trimmed) ||
    new RegExp(`^${filenamePattern}[:：]\\s+.+$`, 'iu').test(trimmed)
  );
}

function endsWithHardStop(line) {
  return /[。.!?！？；;]["'’”)\]】》）]*$/u.test(line);
}

function parseQuoteMarker(line) {
  const match = line.match(/^(?<marker>>|▎)\s?(?<content>.*)$/u);
  if (!match?.groups) {
    return null;
  }

  return {
    marker: match.groups.marker,
    content: match.groups.content,
  };
}

function isCjk(char) {
  return /[\p{Script=Han}\u3040-\u30ff\uac00-\ud7af]/u.test(char);
}

function lastContentLineIndex(lines) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index] !== '') {
      return index;
    }
    return -1;
  }
  return -1;
}

function collapseBlankRuns(lines) {
  const collapsed = [];
  let blankCount = 0;

  for (const line of lines) {
    if (line === '') {
      blankCount += 1;
      if (blankCount <= 1) {
        collapsed.push(line);
      }
      continue;
    }

    blankCount = 0;
    collapsed.push(line);
  }

  return collapsed;
}

function trimOuterBlankLines(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start] === '') {
    start += 1;
  }

  while (end > start && lines[end - 1] === '') {
    end -= 1;
  }

  return lines.slice(start, end);
}
