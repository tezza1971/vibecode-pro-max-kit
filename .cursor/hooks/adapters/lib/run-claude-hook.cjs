#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

function runClaudeHook(scriptName, payload, options = {}) {
  const repoRoot = options.repoRoot || process.cwd();
  const scriptPath = path.join(repoRoot, '.claude/hooks', scriptName);
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);

  return spawnSync(process.execPath, [scriptPath], {
    input,
    encoding: 'utf8',
    cwd: options.cwd || repoRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
}

module.exports = { runClaudeHook };
