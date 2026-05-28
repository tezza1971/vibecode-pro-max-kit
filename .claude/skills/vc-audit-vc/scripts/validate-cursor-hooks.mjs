#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
}

const hooksPath = ".cursor/hooks.json";
if (!exists(hooksPath)) {
  fail(`${hooksPath} missing`);
} else {
  const config = readJson(hooksPath);
  if (config.version !== 1) fail(`${hooksPath} must use version 1`);

  const requiredEvents = [
    "sessionStart",
    "preCompact",
    "subagentStart",
    "preToolUse",
    "postToolUse",
  ];
  for (const event of requiredEvents) {
    if (!Array.isArray(config.hooks?.[event]) || config.hooks[event].length === 0) {
      fail(`${hooksPath} missing hooks.${event}`);
    }
  }

  for (const [event, entries] of Object.entries(config.hooks || {})) {
    for (const entry of entries) {
      const command = entry.command || "";
      const script = command.replace(/^node\s+/, "").trim().split(/\s+/)[0];
      if (!script) {
        fail(`${hooksPath} ${event} entry missing command`);
        continue;
      }
      if (!exists(script)) fail(`${hooksPath} ${event} references missing script: ${script}`);
    }
  }
}

const adapterScripts = [
  ".cursor/hooks/adapters/session-start.cjs",
  ".cursor/hooks/adapters/subagent-start.cjs",
  ".cursor/hooks/adapters/pre-tool-use.cjs",
  ".cursor/hooks/adapters/post-tool-use.cjs",
  ".cursor/hooks/adapters/lib/normalize.cjs",
  ".cursor/hooks/adapters/lib/run-claude-hook.cjs",
];

for (const script of adapterScripts) {
  if (!exists(script)) fail(`Missing Cursor hook adapter: ${script}`);
}

console.log(JSON.stringify({ failures, checked: adapterScripts.length + 1 }, null, 2));
if (failures.length > 0) process.exitCode = 1;
