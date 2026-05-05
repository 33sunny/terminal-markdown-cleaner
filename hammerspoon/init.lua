local cleanerScript =
  "/Users/shan/projects/productivity/terminal-markdown-cleaner/bin/clean-terminal-markdown.mjs"
local nodeBinary = "/Users/shan/.nvm/versions/node/v22.16.0/bin/node"

local eventtap = hs.eventtap
local keycodes = hs.keycodes.map
local logFile = "/tmp/terminal-markdown-cleaner-hammerspoon.log"

terminalMarkdownCleanerState = terminalMarkdownCleanerState or {}
local state = terminalMarkdownCleanerState

if state.pasteboardPoller then
  state.pasteboardPoller:stop()
end

if state.manualCleanTap then
  state.manualCleanTap:stop()
end

if state.timers then
  for _, timer in ipairs(state.timers) do
    timer:stop()
  end
end
state.timers = {}
state.isCleaning = false
state.lastCleanedText = nil
state.lastPasteboardText = hs.pasteboard.getContents()
state.lastRawClipboardText = nil
state.lastRawClipboardAt = 0

local function log(message)
  local file = io.open(logFile, "a")
  if file == nil then
    return
  end

  file:write(os.date("%Y-%m-%d %H:%M:%S "), message, "\n")
  file:close()
end

local function scheduleAfter(seconds, callback)
  local timer
  timer = hs.timer.doAfter(seconds, function()
    for index, activeTimer in ipairs(state.timers) do
      if activeTimer == timer then
        table.remove(state.timers, index)
        break
      end
    end

    callback()
  end)
  table.insert(state.timers, timer)
  return timer
end

local function isGhostty(app)
  if app == nil then
    return false
  end

  return app:name() == "Ghostty" or app:bundleID() == "com.mitchellh.ghostty"
end

local function cleanClipboard(trigger, options)
  local settings = options or {}
  if state.isCleaning then
    log("clean skipped: already running")
    return
  end

  local currentText = settings.sourceText or hs.pasteboard.getContents()
  if
    currentText == nil
    or currentText == ""
    or (currentText == state.lastCleanedText and not settings.force)
  then
    log("clean skipped: no new text")
    return
  end

  state.isCleaning = true
  log("clean start: " .. trigger .. "; chars=" .. tostring(#currentText))
  if settings.sourceText ~= nil then
    hs.pasteboard.setContents(settings.sourceText)
    state.lastPasteboardText = settings.sourceText
  end

  local args = { nodeBinary, cleanerScript, "--clipboard" }
  if settings.tableOutputFormat ~= nil then
    table.insert(args, "--table-format")
    table.insert(args, settings.tableOutputFormat)
  end

  local task = hs.task.new("/usr/bin/env", function(exitCode, _, stdErr)
    state.isCleaning = false

    if exitCode == 0 then
      state.lastCleanedText = hs.pasteboard.getContents()
      state.lastPasteboardText = state.lastCleanedText
      log("clean success: " .. trigger)
      return
    end

    log("clean failed: " .. tostring(exitCode) .. " " .. tostring(stdErr))
    hs.alert.show("Clean failed", 1.5)
    if stdErr and stdErr ~= "" then
      print(stdErr)
    end
  end, args)

  task:start()
end

local function shouldAutoCleanClipboard(newText)
  return (
    newText ~= nil
    and newText ~= ""
    and newText ~= state.lastCleanedText
    and not state.isCleaning
    and isGhostty(hs.application.frontmostApplication())
  )
end

state.pasteboardPoller = hs.timer.doEvery(0.2, function()
  local currentText = hs.pasteboard.getContents()
  if currentText == state.lastPasteboardText then
    return
  end

  state.lastPasteboardText = currentText
  if not shouldAutoCleanClipboard(currentText) then
    return
  end

  state.lastRawClipboardText = currentText
  state.lastRawClipboardAt = os.time()
  log("clipboard changed in Ghostty; scheduling auto clean")
  scheduleAfter(0.08, function()
    if hs.pasteboard.getContents() == currentText then
      cleanClipboard("auto")
    end
  end)
end)

local function hasCommandShift(flags)
  return flags.cmd and flags.shift and not flags.alt and not flags.ctrl and not flags.fn
end

local function manualMarkdownSourceText()
  if
    state.lastRawClipboardText ~= nil
    and state.lastRawClipboardText ~= ""
    and os.time() - (state.lastRawClipboardAt or 0) <= 60
  then
    return state.lastRawClipboardText
  end

  return hs.pasteboard.getContents()
end

state.manualCleanTap = eventtap.new({ eventtap.event.types.keyDown }, function(event)
  if event:getKeyCode() ~= keycodes.c then
    return false
  end

  if not hasCommandShift(event:getFlags()) then
    return false
  end

  if not isGhostty(hs.application.frontmostApplication()) then
    return false
  end

  cleanClipboard("manual markdown", {
    force = true,
    sourceText = manualMarkdownSourceText(),
    tableOutputFormat = "markdown",
  })
  return true
end)

state.manualCleanTap:start()
log("config loaded: clipboard auto-clean active")
