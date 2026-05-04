export function terminalGridLines(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      [...line].map((char) => ({
        text: char,
        width: terminalCharWidth(char),
      }))
    );
}

function terminalCharWidth(char) {
  if (/[\u0300-\u036f\ufe00-\ufe0f]/u.test(char)) {
    return 0;
  }

  return isWide(char) ? 2 : 1;
}

function isWide(char) {
  return /[\p{Script=Han}\u3040-\u30ff\uac00-\ud7af\uff01-\uff60\uffe0-\uffe6]/u.test(char);
}
