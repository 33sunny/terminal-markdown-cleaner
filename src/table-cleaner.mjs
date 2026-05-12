import { cleanMarkdown } from './cleaner.mjs';

const ANSI_PATTERN =
  /[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const BORDER_CHARS = new Set(['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘']);
const HORIZONTAL_CHARS = new Set(['─', '━', '═']);
const CELL_PADDING = 1;
const MAX_COLUMN_WIDTH = 32;

export function cleanTableText(input, options = {}) {
  const lines = String(input ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(normalizeTableLine);

  const parts = [];
  let textBuffer = [];

  const flushText = () => {
    const cleaned = normalizeMarkdownOutputText(
      cleanMarkdown(textBuffer.join('\n'), options).trim(),
      options
    );
    if (cleaned) {
      parts.push(cleaned);
    }
    textBuffer = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const markdownTableStart = findMarkdownPipeTableStart(lines, index);
    if (markdownTableStart) {
      flushText();

      const table = collectMarkdownPipeTable(lines, markdownTableStart);
      parts.push(renderMarkdownPipeTable(table.header, table.rows));
      index = table.nextIndex - 1;
      continue;
    }

    if (!isBoxTableLine(line)) {
      textBuffer.push(line);
      continue;
    }

    flushText();

    const tableLines = [];
    while (index < lines.length && isBoxTableLine(lines[index])) {
      tableLines.push(lines[index]);
      index += 1;
    }
    index -= 1;

    const table = cleanBoxTable(tableLines, options);
    if (table) {
      parts.push(table);
    }
  }

  flushText();
  return parts.join('\n\n');
}

function normalizeMarkdownOutputText(text, options) {
  if (options.tableOutputFormat !== 'markdown') {
    return text;
  }

  return text.replace(/^(\s*)▎\s?/gmu, '$1> ');
}

function isMarkdownPipeRowLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && (trimmed.match(/\|/gu) ?? []).length >= 2;
}

function isMarkdownSeparatorLine(line) {
  const cells = splitMarkdownPipeCells(line);
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/u.test(cell));
}

function findMarkdownPipeTableStart(lines, startIndex) {
  const headerFragments = [];
  const maxHeaderLines = 3;
  const endIndex = Math.min(lines.length, startIndex + maxHeaderLines);

  for (let index = startIndex; index < endIndex; index += 1) {
    const line = lines[index];
    if (line.trim() === '') {
      return null;
    }

    if (isMarkdownSeparatorLine(line)) {
      if (headerFragments.length === 0) {
        return null;
      }

      const headerLine = joinMarkdownHeaderFragments(headerFragments);
      if (!isMarkdownPipeRowLine(headerLine)) {
        return null;
      }

      const header = splitMarkdownPipeCells(headerLine);
      const separator = splitMarkdownPipeCells(line);
      if (header.length !== separator.length) {
        return null;
      }

      return {
        header,
        columnCount: separator.length,
        separatorIndex: index,
      };
    }

    if (headerFragments.length === 0 && !isMarkdownPipeRowLine(line)) {
      return null;
    }
    headerFragments.push(line);
  }

  return null;
}

function joinMarkdownHeaderFragments(fragments) {
  return joinFragments(
    fragments.map((fragment, index) => {
      const trimmed = fragment.trim();
      if (index > 0 && !trimmed.startsWith('|') && trimmed.endsWith('|')) {
        return `| ${trimmed}`;
      }
      return trimmed;
    })
  );
}

function collectMarkdownPipeTable(lines, tableStart) {
  const header = tableStart.header;
  const columnCount = tableStart.columnCount;
  const rows = [];
  let rowFragments = [];
  let index = tableStart.separatorIndex + 1;

  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '') {
      break;
    }

    if (
      isMarkdownPipeRowLine(line) &&
      (rowFragments.length === 0 || isCompleteMarkdownPipeRow(rowFragments, columnCount))
    ) {
      if (rowFragments.length > 0) {
        rows.push(parseMarkdownPipeRow(rowFragments, columnCount));
      }
      rowFragments = [line];
      index += 1;
      continue;
    }

    if (rowFragments.length === 0 || isCompleteMarkdownPipeRow(rowFragments, columnCount)) {
      break;
    }

    rowFragments.push(line);
    index += 1;
  }

  if (rowFragments.length > 0) {
    rows.push(parseMarkdownPipeRow(rowFragments, columnCount));
  }

  return { header, rows, nextIndex: index };
}

function isCompleteMarkdownPipeRow(fragments, columnCount) {
  const logicalRow = joinFragments(fragments.map((line) => line.trim()).filter(Boolean));
  return logicalRow.trimEnd().endsWith('|') && splitMarkdownPipeCells(logicalRow).length >= columnCount;
}

function parseMarkdownPipeRow(fragments, columnCount) {
  const logicalRow = joinFragments(fragments.map((line) => line.trim()).filter(Boolean));
  const cells = splitMarkdownPipeCells(logicalRow);
  const normalized = cells.slice(0, columnCount);

  if (cells.length > columnCount) {
    normalized[columnCount - 1] = cells.slice(columnCount - 1).join(' | ');
  }

  while (normalized.length < columnCount) {
    normalized.push('');
  }

  return normalized;
}

function splitMarkdownPipeCells(line) {
  const trimmed = line.trim();
  const withoutLeadingPipe = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const body = withoutLeadingPipe.endsWith('|')
    ? withoutLeadingPipe.slice(0, -1)
    : withoutLeadingPipe;

  return body.split('|').map((cell) => cell.trim());
}

function renderMarkdownPipeTable(header, rows) {
  return [
    renderMarkdownRow(header.map(escapeMarkdownCell)),
    renderMarkdownRow(header.map(() => '---')),
    ...rows.map((row) => renderMarkdownRow(row.map(escapeMarkdownCell))),
  ].join('\n');
}

function cleanBoxTable(lines, options) {
  const widths = extractColumnWidths(lines.find(isBorderLine) ?? '');
  if (widths.length === 0) {
    return lines.join('\n');
  }

  const groups = groupPhysicalRows(lines);
  if (groups.length === 0) {
    return lines.join('\n');
  }

  const rows = groups.map((group) => collapseRowGroup(group, widths.length));
  const header = rows[0];
  const body = rows.slice(1);
  if (options.tableOutputFormat === 'markdown') {
    return renderMarkdownTable(header, body);
  }
  return renderBoxTable(header, body, widths);
}

function normalizeTableLine(line) {
  let value = line.replace(ANSI_PATTERN, '').replace(/\u0008/g, '').replace(/\s+$/u, '');
  value = value.replace(/^[ \t]*(?:❯|›|➜|λ|\$) {1,4}/u, '');
  value = value.replace(/^[ \t]*[▌█▍▏]+[ \t]*/u, '');
  return value.startsWith('  ') ? value.slice(2) : value;
}

function isBoxTableLine(line) {
  return isBorderLine(line) || isRowLine(line);
}

function isBorderLine(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  let hasBorder = false;
  for (const char of trimmed) {
    if (BORDER_CHARS.has(char)) {
      hasBorder = true;
      continue;
    }
    if (HORIZONTAL_CHARS.has(char)) {
      continue;
    }
    return false;
  }
  return hasBorder;
}

function isRowLine(line) {
  return (line.match(/│/gu) ?? []).length >= 2;
}

function extractColumnWidths(line) {
  const widths = [];
  let current = 0;
  let inside = false;

  for (const char of line.trim()) {
    if (BORDER_CHARS.has(char)) {
      if (inside) {
        widths.push(current);
      }
      inside = true;
      current = 0;
      continue;
    }

    if (inside && HORIZONTAL_CHARS.has(char)) {
      current += 1;
    }
  }

  return widths.filter((width) => width > 0);
}

function groupPhysicalRows(lines) {
  const groups = [];
  let current = [];

  for (const line of lines) {
    if (isBorderLine(line)) {
      if (current.length > 0) {
        groups.push(current);
        current = [];
      }
      continue;
    }

    if (isRowLine(line)) {
      current.push(extractCells(line));
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups;
}

function extractCells(line) {
  return line
    .split('│')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function collapseRowGroup(group, columnCount) {
  return Array.from({ length: columnCount }, (_, columnIndex) => {
    const fragments = group
      .map((cells) => cells[columnIndex] ?? '')
      .map((cell) => cell.trim())
      .filter(Boolean);

    return {
      text: joinFragments(fragments),
      fragments,
    };
  });
}

function joinFragments(fragments) {
  return fragments.reduce((joined, fragment) => {
    if (!joined) {
      return fragment;
    }
    return `${joined}${joinerForFragment(joined, fragment)}${fragment}`;
  }, '');
}

function joinerForFragment(left, right) {
  const last = [...left.trimEnd()].at(-1) ?? '';
  const first = [...right.trimStart()].at(0) ?? '';

  if (!last || !first || /\s/u.test(last) || /\s/u.test(first)) {
    return '';
  }

  if (/[=≈+\-*/<>]/u.test(last)) {
    return ' ';
  }

  if (isCjk(last) || isCjk(first)) {
    return '';
  }

  if (/[\])}>.,;:!?，。！？；：、"'`]/u.test(first)) {
    return '';
  }

  return ' ';
}

function renderBoxTable(header, body, originalWidths) {
  const rows = [header, ...body];
  const widths = originalWidths.map((width, index) =>
    Math.max(width, preferredColumnWidth(rows, index))
  );

  const top = renderBorder('┌', '┬', '┐', widths);
  const separator = renderBorder('├', '┼', '┤', widths);
  const bottom = renderBorder('└', '┴', '┘', widths);
  const rendered = [top, ...renderLogicalRow(header, widths, true), separator];

  body.forEach((row, index) => {
    rendered.push(...renderLogicalRow(row, widths, false));
    if (index < body.length - 1) {
      rendered.push(separator);
    }
  });

  rendered.push(bottom);
  return rendered.join('\n');
}

function renderMarkdownTable(header, body) {
  const headerText = header.map((cell) => escapeMarkdownCell(cell.text));
  const rows = body.map((row) => row.map((cell) => escapeMarkdownCell(cell.text)));
  return [
    renderMarkdownRow(headerText),
    renderMarkdownRow(headerText.map(() => '---')),
    ...rows.map(renderMarkdownRow),
  ].join('\n');
}

function renderMarkdownRow(cells) {
  return `| ${cells.join(' | ')} |`;
}

function escapeMarkdownCell(text) {
  return text.replaceAll('|', '\\|').replace(/\s+/gu, ' ').trim();
}

function renderBorder(left, middle, right, widths) {
  return `${left}${widths.map((width) => '─'.repeat(width)).join(middle)}${right}`;
}

function renderLogicalRow(row, widths, isHeader) {
  const cellLines = row.map((cell, index) =>
    preferredLinesForCell(cell, innerWidthFor(widths[index]))
  );
  const height = Math.max(...cellLines.map((lines) => lines.length), 1);
  const output = [];

  for (let lineIndex = 0; lineIndex < height; lineIndex += 1) {
    const renderedCells = cellLines.map((lines, cellIndex) => {
      const value = lines[lineIndex] ?? '';
      return renderCell(value, widths[cellIndex], isHeader ? 'center' : 'left');
    });
    output.push(`│${renderedCells.join('│')}│`);
  }

  return output;
}

function preferredColumnWidth(rows, columnIndex) {
  const contentWidth = rows.reduce((max, row) => {
    const cell = row[columnIndex];
    return Math.max(max, displayWidth(cell?.text ?? ''));
  }, 0);

  return Math.min(contentWidth + CELL_PADDING * 2, MAX_COLUMN_WIDTH);
}

function preferredLinesForCell(cell, width) {
  if (displayWidth(cell.text) <= width) {
    return [cell.text];
  }

  if (cell.fragments.length > 1 && cell.fragments.every((fragment) => displayWidth(fragment) <= width)) {
    return cell.fragments;
  }

  return wrapToWidth(cell.text, width);
}

function innerWidthFor(width) {
  return Math.max(width - CELL_PADDING * 2, 1);
}

function renderCell(text, width, align) {
  const inner = innerWidthFor(width);
  const aligned = align === 'center' ? centerToWidth(text, inner) : padToWidth(text, inner);
  return `${' '.repeat(CELL_PADDING)}${aligned}${' '.repeat(CELL_PADDING)}`;
}

function wrapToWidth(text, width) {
  const lines = [];
  let current = '';
  let currentWidth = 0;

  for (const char of text) {
    const charWidth = displayWidth(char);
    if (current && currentWidth + charWidth > width) {
      lines.push(current.trimEnd());
      current = char.trimStart();
      currentWidth = displayWidth(current);
      continue;
    }

    current += char;
    currentWidth += charWidth;
  }

  if (current) {
    lines.push(current.trimEnd());
  }

  return lines.length > 0 ? lines : [''];
}

function centerToWidth(text, width) {
  const gap = Math.max(width - displayWidth(text), 0);
  const left = Math.floor(gap / 2);
  const right = gap - left;
  return `${' '.repeat(left)}${text}${' '.repeat(right)}`;
}

function padToWidth(text, width) {
  return `${text}${' '.repeat(Math.max(width - displayWidth(text), 0))}`;
}

function displayWidth(text) {
  let width = 0;
  for (const char of text) {
    width += charWidth(char);
  }
  return width;
}

function charWidth(char) {
  if (/[\u0300-\u036f\ufe00-\ufe0f]/u.test(char)) {
    return 0;
  }

  return isWide(char) ? 2 : 1;
}

function isWide(char) {
  return /[\p{Script=Han}\u3040-\u30ff\uac00-\ud7af\uff01-\uff60\uffe0-\uffe6]/u.test(char);
}

function isCjk(char) {
  return /[\p{Script=Han}\u3040-\u30ff\uac00-\ud7af]/u.test(char);
}
