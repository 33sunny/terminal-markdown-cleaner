local cleanerScript =
  "/Users/shan/projects/productivity/terminal-markdown-cleaner/bin/clean-terminal-markdown.mjs"

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

hs.hotkey.bind({ "cmd", "shift" }, "C", cleanGhosttyClipboard)
