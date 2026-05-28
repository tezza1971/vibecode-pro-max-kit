#!/usr/bin/env node
'use strict';

const {
  readStdinJson,
  normalizeSubagentStartInput,
  translateSessionStdout,
} = require('./lib/normalize.cjs');
const { runClaudeHook } = require('./lib/run-claude-hook.cjs');

try {
  const input = normalizeSubagentStartInput(readStdinJson());
  const result = runClaudeHook('subagent-init.cjs', input);

  if (result.error) {
    process.stderr.write(`Hook spawn error: ${result.error.message}\n`);
    process.exit(0);
  }

  const output = translateSessionStdout(result.stdout, result.stderr);
  if (Object.keys(output).length > 0) {
    process.stdout.write(`${JSON.stringify(output)}\n`);
  }

  process.exit(0);
} catch (error) {
  process.stderr.write(`subagent-start adapter error: ${error.message}\n`);
  process.exit(0);
}
