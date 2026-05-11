# Terminal Markdown Cleaner

Clean Markdown, wrapped prose, and box-drawing tables copied from terminal AI tools such as Claude Code and Codex CLI.

The project is local-first: text stays on your machine. It can run as a small static web page, a stdin/stdout CLI, or a macOS Ghostty clipboard cleaner.

## What It Solves

Terminal output is often hard to reuse after copying:

- Soft-wrapped Chinese and English paragraphs are split across lines.
- Commands can pick up extra spaces at terminal wrap points.
- Claude Code / Codex CLI output may include gutters, prompts, quote bars, ANSI codes, and terminal table borders.
- Box-drawing tables are awkward to paste into Markdown documents.

This cleaner normalizes that copied text while preserving Markdown structure, lists, quotes, fenced code blocks, commands, and tables.

## Modes

| Mode | Best For | Requirements |
| --- | --- | --- |
| Web app | Manual paste, inspect, and copy | Browser, Python 3 for local server |
| CLI stdin/stdout | Scripts and one-off terminal cleaning | Node.js |
| macOS clipboard | Ghostty copy workflow | macOS, Ghostty, Hammerspoon, Node.js |

The Ghostty clipboard mode is macOS-specific because it uses Hammerspoon plus `pbpaste` / `pbcopy`.

## Features

- Removes ANSI control sequences, terminal chrome, prompts, and extra terminal indentation.
- Joins terminal soft wraps in prose and commands.
- Preserves Markdown lists, quotes, horizontal rules, and fenced code blocks.
- Supports numbered, Chinese-numbered, circled-numbered, alphabetic, and bullet-style list markers.
- Cleans terminal box-drawing tables.
- Converts terminal tables to either redrawn box tables or Markdown pipe tables.
- Runs fully locally; no content is uploaded.

## Install

Clone the repository:

```bash
git clone https://github.com/33sunny/terminal-markdown-cleaner.git
cd terminal-markdown-cleaner
```

Install the convenience commands:

```bash
./bin/install
```

This creates:

```text
~/bin/copy-clean
~/bin/copy-clean-web
```

Make sure `~/bin` is in your shell `PATH`. If it is not, add this to your shell config:

```bash
export PATH="$HOME/bin:$PATH"
```

No npm install is required. The project uses Node.js built-ins only.

## Ghostty Auto-Clean Setup

Install the macOS apps/tools:

- Ghostty
- Hammerspoon
- Node.js

Enable Ghostty copy-on-select in your Ghostty config:

```text
copy-on-select = clipboard
```

Then run:

```bash
copy-clean
```

This command:

- records this checkout path for Hammerspoon,
- links the project Hammerspoon config into `~/.hammerspoon/init.lua` when possible,
- starts Hammerspoon,
- reloads the Hammerspoon config.

On first use, macOS may require Hammerspoon permissions. Open `System Settings` -> `Privacy & Security` -> `Accessibility`, then allow Hammerspoon.

Hammerspoon is set to launch at login. After that, you should not need to run `copy-clean` every time you open Ghostty. Use it only as a recovery command if copying stops being cleaned.

### Existing Hammerspoon Users

If you already have a custom `~/.hammerspoon/init.lua`, `copy-clean` will not overwrite it. It prints a `dofile(...)` line instead. Add that line to your existing Hammerspoon config, then reload Hammerspoon.

## Daily Use

For Ghostty:

1. Select text in Ghostty. With `copy-on-select = clipboard`, Ghostty copies it to the clipboard.
2. Hammerspoon sees that Ghostty changed the clipboard.
3. The cleaner replaces the clipboard content with the cleaned version.
4. Paste normally anywhere.

The automation does not take over global `Command+C` in other apps. It only reacts while Ghostty is the frontmost application.

Shortcut:

- `Command+Shift+C` in Ghostty forces a table-aware Markdown cleanup of the current clipboard.

## Web App

Open the local web cleaner:

```bash
copy-clean-web
```

It starts a local server and opens:

```text
http://127.0.0.1:4173/
```

The web app has two cleaning tabs:

- `Markdown`: general terminal Markdown cleanup.
- `Table`: table-aware cleanup with `Box` and `Markdown` output formats.

You can also start the web app manually:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open `http://127.0.0.1:4173/`.

## CLI

Clean stdin to stdout:

```bash
node bin/clean-terminal-markdown.mjs < input.txt > output.md
```

Clean the macOS clipboard in place:

```bash
node bin/clean-terminal-markdown.mjs --clipboard
```

Use table Markdown output:

```bash
node bin/clean-terminal-markdown.mjs --clipboard --table-format markdown
```

## Web Shortcuts

Inside the web app:

- `F1`: clear Paste and Clean.
- `Command+C`: copy the full Clean result when no text is selected.

If text is selected inside a textarea, `Command+C` keeps the browser's native selected-text copy behavior.

## Project Structure

```text
terminal-markdown-cleaner/
├── index.html                    # Web app entry
├── styles.css                    # Web app styles
├── bin/
│   ├── clean-terminal-markdown.mjs # stdin/stdout and clipboard CLI
│   ├── copy-clean                # Start/recover Ghostty clipboard cleanup
│   ├── copy-clean-web            # Open the local web app
│   └── install                   # Install convenience commands to ~/bin
├── hammerspoon/
│   └── init.lua                  # Ghostty clipboard cleaner integration
├── src/
│   ├── app.mjs                   # Web UI bindings
│   ├── clipboard-cleaner.mjs     # CLI cleaning entry
│   ├── cleaner.mjs               # Markdown cleanup
│   ├── shortcuts.mjs             # Web keyboard shortcuts
│   ├── table-cleaner.mjs         # Terminal table cleanup
│   └── terminal-grid.mjs         # Box-table preview helpers
└── test/                         # Node test runner tests
```

## Development

Run tests:

```bash
npm test
```

Run syntax checks:

```bash
npm run check
```

The project has no runtime npm dependencies. Tests use Node.js built-in `node:test`.

## Limitations

- Ghostty auto-clean is designed for macOS and Hammerspoon.
- Clipboard mode uses macOS `pbpaste` and `pbcopy`.
- Existing Hammerspoon configs require manual `dofile(...)` integration.
- Cleaning rules are heuristic because terminal AI tools do not expose semantic document structure.

## License

No open-source license has been selected yet. Add a license before making the repository public if you want other people to reuse, modify, or redistribute the project.
