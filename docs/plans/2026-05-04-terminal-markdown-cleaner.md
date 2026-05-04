# Terminal Markdown Cleaner Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local preview tool that cleans Markdown copied from terminal-rendered agent output.

**Architecture:** Keep the cleaner as a dependency-free JavaScript module and use it from both tests and the browser UI. The first version focuses on Markdown paragraph/list cleanup; the table tab is visible but intentionally marked as a later mode.

**Tech Stack:** Plain HTML, CSS, browser JavaScript modules, Node's built-in test runner.

---

### Task 1: Markdown Cleaner

**Files:**
- Create: `src/cleaner.mjs`
- Test: `test/cleaner.test.mjs`

**Steps:**
1. Write failing tests for ANSI stripping, terminal prompt cleanup, Chinese soft-wrap merging, Markdown list preservation, code fence preservation, and wrapped English paragraph merging.
2. Run `node --test test/cleaner.test.mjs` and confirm the tests fail because the cleaner does not exist.
3. Implement the minimal cleaner behavior in `src/cleaner.mjs`.
4. Run `node --test test/cleaner.test.mjs` and confirm the tests pass.

### Task 2: Local Web UI

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `src/app.mjs`

**Steps:**
1. Build a two-pane UI: raw input on the left, cleaned Markdown on the right.
2. Add tabs for Markdown and Table, with Table disabled for the first version.
3. Add Markdown options for soft-wrap merging, terminal symbol cleanup, code fence preservation, and compact Chinese merging.
4. Add copy, clear, and sample actions.
5. Verify the page through a local static server and a quick browser fetch of the module.
