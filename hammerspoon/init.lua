local cleanerScript =
  "/Users/shan/projects/productivity/terminal-markdown-cleaner/bin/clean-terminal-markdown.mjs"

local eventtap = hs.eventtap
local keycodes = hs.keycodes.map

local function isGhostty(app)
  if app == nil then
    return false
  end

  return app:name() == "Ghostty" or app:bundleID() == "com.mitchellh.ghostty"
end

local function cleanGhosttyClipboard()
  if not isGhostty(hs.application.frontmostApplication()) then
    return
  end

  local task = hs.task.new("/usr/bin/env", function(exitCode, _, stdErr)
    if exitCode == 0 then
      hs.alert.show("Clean copied", 0.7)
      return
    end

    hs.alert.show("Clean failed", 1.5)
    if stdErr and stdErr ~= "" then
      print(stdErr)
    end
  end, { "node", cleanerScript, "--clipboard" })

  task:start()
end

local function hasOnlyCommand(flags)
  return flags.cmd and not flags.alt and not flags.ctrl and not flags.fn and not flags.shift
end

local cleanClipboardTap = eventtap.new({ eventtap.event.types.keyDown }, function(event)
  if event:getKeyCode() ~= keycodes.c then
    return false
  end

  if not hasOnlyCommand(event:getFlags()) then
    return false
  end

  if not isGhostty(hs.application.frontmostApplication()) then
    return false
  end

  cleanGhosttyClipboard()
  return true
end)

cleanClipboardTap:start()
