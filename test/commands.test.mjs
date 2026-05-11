import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const commands = [
  {
    path: 'bin/copy-clean',
    expectedText: 'tell application "Hammerspoon" to quit',
  },
  {
    path: 'bin/copy-clean-web',
    expectedText: 'http://127.0.0.1:4173/',
  },
  {
    path: 'bin/install',
    expectedText: 'copy-clean-web',
  },
];

for (const command of commands) {
  test(`${command.path} is executable zsh`, async () => {
    await access(command.path, constants.X_OK);

    const syntaxCheck = spawnSync('/bin/zsh', ['-n', command.path], {
      encoding: 'utf8',
    });

    assert.equal(
      syntaxCheck.status,
      0,
      syntaxCheck.stderr || syntaxCheck.stdout
    );

    const source = await readFile(command.path, 'utf8');
    assert.match(source, new RegExp(command.expectedText.replaceAll('.', '\\.')));
  });
}

test('Hammerspoon config is portable across clone locations', async () => {
  const source = await readFile('hammerspoon/init.lua', 'utf8');

  assert.doesNotMatch(source, /\/Users\/shan/);
  assert.match(source, /terminal-markdown-cleaner-root/);
  assert.match(source, /command -v node/);
});

test('copy-clean records the project root for Hammerspoon', async () => {
  const source = await readFile('bin/copy-clean', 'utf8');

  assert.match(source, /terminal-markdown-cleaner-root/);
  assert.match(source, /print -r -- "\$PROJECT_ROOT"/);
});
