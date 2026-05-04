# Terminal Markdown Cleaner

清理从 Ghostty 终端里复制出来的 Claude Code / Codex CLI 输出，让它更适合再粘贴回终端、Markdown 编辑器或文档里。

这是一个纯前端静态页面，本地运行，不上传内容，不需要后端服务。

## 功能

- 清理终端复制时带出的 ANSI 控制字符、提示符、缩进和多余终端符号。
- 合并中文段落的软换行，同时保留 Markdown 列表、引用、分隔线和代码块。
- 支持普通 Markdown 内容清理。
- 支持 box drawing 终端表格清理，并可输出为：
  - `Box`：重新绘制后的终端 box drawing 表格。
  - `Markdown`：Markdown pipe table。
- Table 的 Markdown 输出模式会把行首 `▎` 转成标准 Markdown 引用 `>`。
- Clean 输出框可以手动编辑，再复制最终结果。

## 快速启动

在项目目录下启动一个本地静态服务器：

```bash
cd terminal-markdown-cleaner
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

也可以用 npm 脚本启动，不需要安装依赖：

```bash
npm run start
```

不建议直接双击 `index.html` 打开，因为页面使用了浏览器 ES module，`file://` 模式在部分浏览器里会受限制。

## 使用方式

1. 从 Ghostty / Claude Code / Codex CLI 复制终端输出。
2. 粘贴到左侧 `Paste`。
3. 根据内容选择 `Markdown` 或 `Table` tab。
4. 需要表格时，在 Table tab 里选择 `Box` 或 `Markdown` 输出格式。
5. 在右侧 `Clean` 检查或手动调整结果。
6. 点击 `Copy`，或按 `Command+C` 复制 Clean 结果。

## 快捷键

- `F1`：清空 Paste 和 Clean。
- `Command+C`：复制 Clean 结果。

如果在 Paste 或 Clean 输入框里选中了具体文字，`Command+C` 会保留浏览器原生行为，只复制选中的文字；没有选中文字时，会复制完整 Clean 结果。

## 项目结构

```text
terminal-markdown-cleaner/
├── index.html              # 页面入口
├── styles.css              # 页面样式
├── src/
│   ├── app.mjs             # UI 绑定、tab、复制、预览
│   ├── cleaner.mjs         # Markdown 文本清理
│   ├── shortcuts.mjs       # 快捷键映射
│   ├── table-cleaner.mjs   # 终端表格清理和格式转换
│   └── terminal-grid.mjs   # Box 表格视觉预览
├── test/                   # Node 内置 test runner 测试
└── docs/plans/             # 开发过程中的设计记录
```

## 开发和验证

运行测试：

```bash
npm test
```

运行语法检查：

```bash
npm run check
```

这个项目没有外部 npm 依赖。测试使用 Node.js 自带的 `node:test`。

## 打包发送

从上一级目录打包整个文件夹：

```bash
cd /Users/shan/projects/productivity
zip -r terminal-markdown-cleaner.zip terminal-markdown-cleaner
```

对方解压后按“快速启动”里的方式运行即可。
