# Terminal Markdown Cleaner

Clean Markdown, wrapped prose, and box-drawing tables copied from terminal AI tools such as Claude Code and Codex CLI.

The project is local-first: text stays on your machine. It can run as a small static web page, a stdin/stdout CLI, or a macOS Ghostty clipboard cleaner.

Terminal Markdown Cleaner 用来清理从终端 AI 工具里复制出来的内容，比如 Claude Code、Codex CLI 这类工具在 Ghostty 里输出的 Markdown、被终端自动折行的段落、命令、列表和 box drawing 表格。

这个项目完全在本机运行，不会上传你的剪贴板内容。它可以作为本地网页、stdin/stdout CLI，或者 macOS Ghostty 剪贴板自动清理工具使用。

## What It Solves

Terminal output is often hard to reuse after copying:

- Soft-wrapped Chinese and English paragraphs are split across lines.
- Commands can pick up extra spaces at terminal wrap points.
- Claude Code / Codex CLI output may include gutters, prompts, quote bars, ANSI codes, and terminal table borders.
- Box-drawing tables are awkward to paste into Markdown documents.

This cleaner normalizes that copied text while preserving Markdown structure, lists, quotes, fenced code blocks, commands, and tables.

从终端复制 AI 输出时，经常会遇到这些问题：

- 中文或英文段落被终端宽度强行折行。
- 一条命令因为终端换行多出空格。
- Claude Code / Codex CLI 输出里带有缩进、提示符、引用竖线、ANSI 控制字符。
- 终端表格复制出来不适合粘贴到 Markdown 文档。

这个工具会尽量把这些内容还原成更适合粘贴到文档、Markdown 编辑器或终端里的格式，同时保留列表、引用、代码块、命令和表格结构。

## Modes

| Mode | Best For | Requirements |
| --- | --- | --- |
| Web app | Manual paste, inspect, and copy | Browser, Python 3 for local server |
| CLI stdin/stdout | Scripts and one-off terminal cleaning | Node.js |
| macOS clipboard | Ghostty copy workflow | macOS, Ghostty, Hammerspoon, Node.js |

The Ghostty clipboard mode is macOS-specific because it uses Hammerspoon plus `pbpaste` / `pbcopy`.

| 模式 | 适合场景 | 依赖 |
| --- | --- | --- |
| 网页端 | 手动粘贴、预览、复制清理结果 | 浏览器、Python 3 |
| CLI | 脚本处理或一次性清理文本 | Node.js |
| Ghostty 自动清理 | 在 Ghostty 里选中文本后自动清理剪贴板 | macOS、Ghostty、Hammerspoon、Node.js |

Ghostty 剪贴板自动清理模式目前面向 macOS，因为它依赖 Hammerspoon 以及 macOS 的 `pbpaste` / `pbcopy`。

## Features

- Removes ANSI control sequences, terminal chrome, prompts, and extra terminal indentation.
- Joins terminal soft wraps in prose and commands.
- Preserves Markdown lists, quotes, horizontal rules, and fenced code blocks.
- Supports numbered, Chinese-numbered, circled-numbered, alphabetic, and bullet-style list markers.
- Cleans terminal box-drawing tables.
- Converts terminal tables to either redrawn box tables or Markdown pipe tables.
- Runs fully locally; no content is uploaded.

功能：

- 清理 ANSI 控制字符、终端提示符、额外缩进和终端界面符号。
- 合并终端软换行导致的段落和命令断行。
- 保留 Markdown 列表、引用、分隔线和 fenced code block。
- 支持数字、中文数字、圆圈数字、字母和常见无序列表符号。
- 清理终端 box drawing 表格。
- 将终端表格输出为重绘后的 box 表格或 Markdown pipe table。
- 完全本地运行，不上传内容。

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

先 clone 项目：

```bash
git clone https://github.com/33sunny/terminal-markdown-cleaner.git
cd terminal-markdown-cleaner
```

安装两个日常命令：

```bash
./bin/install
```

安装后会得到：

```text
~/bin/copy-clean
~/bin/copy-clean-web
```

如果你的 shell 还没有把 `~/bin` 加到 `PATH`，把下面这行加入 shell 配置：

```bash
export PATH="$HOME/bin:$PATH"
```

这个项目没有运行时 npm 依赖，不需要 `npm install`。

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

先安装：

- Ghostty
- Hammerspoon
- Node.js

然后在 Ghostty 配置里启用：

```text
copy-on-select = clipboard
```

再运行一次：

```bash
copy-clean
```

它会：

- 记录当前项目路径，供 Hammerspoon 后续使用；
- 在可行时把本项目的 Hammerspoon 配置链接到 `~/.hammerspoon/init.lua`；
- 启动 Hammerspoon；
- 重新加载 Hammerspoon 配置。

第一次使用时，macOS 可能会要求给 Hammerspoon 辅助功能权限。路径是 `System Settings` -> `Privacy & Security` -> `Accessibility`，允许 Hammerspoon 即可。

Hammerspoon 会被设置为登录后自动启动。之后正常情况下不用每次打开 Ghostty 都运行 `copy-clean`。如果某次重启后或偶尔发现复制没有被清理，再手动运行一次 `copy-clean` 作为恢复命令。

### Existing Hammerspoon Users

If you already have a custom `~/.hammerspoon/init.lua`, `copy-clean` will not overwrite it. It prints a `dofile(...)` line instead. Add that line to your existing Hammerspoon config, then reload Hammerspoon.

如果你已经有自己的 `~/.hammerspoon/init.lua`，`copy-clean` 不会覆盖它，而是会打印一行 `dofile(...)`。把那行加到你的 Hammerspoon 配置里，再 reload Hammerspoon。

## Daily Use

For Ghostty:

1. Select text in Ghostty. With `copy-on-select = clipboard`, Ghostty copies it to the clipboard.
2. Hammerspoon sees that Ghostty changed the clipboard.
3. The cleaner replaces the clipboard content with the cleaned version.
4. Paste normally anywhere.

The automation does not take over global `Command+C` in other apps. It only reacts while Ghostty is the frontmost application.

Shortcut:

- `Command+Shift+C` in Ghostty forces a table-aware Markdown cleanup of the current clipboard.

在 Ghostty 里：

1. 鼠标选中一段终端输出。
2. Ghostty 的 `copy-on-select` 会把原文复制到剪贴板。
3. Hammerspoon 检测到 Ghostty 改了剪贴板。
4. 清理脚本把剪贴板替换成清理后的文本。
5. 你正常粘贴即可。

这个自动化不会接管其他 App 里的 `Command+C`。它只在 Ghostty 作为前台应用时响应剪贴板变化。

额外快捷键：

- `Command+Shift+C`：对当前剪贴板强制执行 table-aware 的 Markdown 清理。

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

打开网页端：

```bash
copy-clean-web
```

它会启动本地服务并打开：

```text
http://127.0.0.1:4173/
```

网页端有两个 tab：

- `Markdown`：普通终端 Markdown 清理。
- `Table`：表格增强清理，可输出 `Box` 或 Markdown pipe table。

也可以手动启动网页端：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:4173/`。

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

从 stdin 读取并输出到 stdout：

```bash
node bin/clean-terminal-markdown.mjs < input.txt > output.md
```

直接清理 macOS 当前剪贴板：

```bash
node bin/clean-terminal-markdown.mjs --clipboard
```

表格输出为 Markdown：

```bash
node bin/clean-terminal-markdown.mjs --clipboard --table-format markdown
```

## Web Shortcuts

Inside the web app:

- `F1`: clear Paste and Clean.
- `Command+C`: copy the full Clean result when no text is selected.

If text is selected inside a textarea, `Command+C` keeps the browser's native selected-text copy behavior.

网页端快捷键：

- `F1`：清空 Paste 和 Clean。
- `Command+C`：没有选中文本时，复制完整 Clean 结果。

如果在 textarea 里选中了具体文字，`Command+C` 会保留浏览器原生行为，只复制选中的文字。

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

项目结构里，`bin/` 放命令行入口和安装脚本，`hammerspoon/` 放 Ghostty 剪贴板自动清理配置，`src/` 放网页端和清理逻辑，`test/` 放 Node 内置 test runner 测试。

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

运行测试：

```bash
npm test
```

运行语法检查：

```bash
npm run check
```

这个项目没有运行时 npm 依赖。测试使用 Node.js 内置的 `node:test`。

## Limitations

- Ghostty auto-clean is designed for macOS and Hammerspoon.
- Clipboard mode uses macOS `pbpaste` and `pbcopy`.
- Existing Hammerspoon configs require manual `dofile(...)` integration.
- Cleaning rules are heuristic because terminal AI tools do not expose semantic document structure.

限制：

- Ghostty 自动清理目前面向 macOS + Hammerspoon。
- 剪贴板模式依赖 macOS 的 `pbpaste` / `pbcopy`。
- 如果已有 Hammerspoon 配置，需要手动加入 `dofile(...)`。
- 清理规则是启发式的，因为终端输出本身没有完整的文档语义。

## License

MIT. See [LICENSE](LICENSE).

MIT License，见 [LICENSE](LICENSE)。
