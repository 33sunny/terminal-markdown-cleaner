# Table Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Table tab that cleans mixed Markdown text containing terminal box drawing tables and redraws those tables as clean box drawing tables.

**Architecture:** Keep Markdown cleanup and table cleanup as separate modules. `cleanTableText()` scans normalized input, sends non-table segments through `cleanMarkdown()`, parses contiguous box drawing table blocks into cell matrices, merges wrapped cell fragments, and renders the result back into box drawing tables.

**Tech Stack:** Plain browser JavaScript modules, Node's built-in test runner, static HTML/CSS.

---

### Task 1: Table Cleaner Tests

**Files:**
- Create: `test/table-cleaner.test.mjs`
- Create: `src/table-cleaner.mjs`

**Step 1: Write failing tests**

Cover:
- Mixed prose plus one box drawing table.
- Header cells split across physical lines.
- Body cells split across physical lines.
- Prose after the table using Markdown soft-wrap cleanup.

**Step 2: Run test to verify failure**

Run: `node --test test/table-cleaner.test.mjs`

Expected: fail because `src/table-cleaner.mjs` does not exist.

**Step 3: Implement minimal cleaner**

Add:
- ANSI and gutter cleanup for table scanning.
- Box table block detection.
- Border width extraction.
- Physical-row grouping between border lines.
- Fragment joining per cell.
- Box drawing renderer with CJK display width.

**Step 4: Run test to verify pass**

Run: `node --test test/table-cleaner.test.mjs`

Expected: pass.

### Task 2: UI Mode Switch

**Files:**
- Modify: `index.html`
- Modify: `src/app.mjs`
- Modify: `styles.css`

**Step 1: Enable Table tab**

Remove disabled state and add mode metadata to the Markdown and Table tabs.

**Step 2: Route cleaner by mode**

Use `cleanMarkdown()` in Markdown mode and `cleanTableText()` in Table mode.

**Step 3: Update sample behavior**

Show a Markdown sample in Markdown mode and a mixed text plus box table sample in Table mode.

**Step 4: Verify**

Run all tests and JavaScript syntax checks.
