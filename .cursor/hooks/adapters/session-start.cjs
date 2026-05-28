#!/usr/bin/env node
'use strict';

const {
  readStdinJson,
  normalizeSessionStartInput,
  translateSessionStdout,
} = require('./lib/normalize.cjs');
const { runClaudeHook } = require('./lib/run-claude-hook.cjs');

try {
  const raw = readStdinJson();
  const sourceOverride =
    raw.hook_event_name === 'preCompact'
      ? 'compact'
      : raw.composer_mode === 'ask'
        ? 'resume'
        : undefined;
  const input = normalizeSessionStartInput(raw, sourceOverride);
  const result = runClaudeHook('session-init.cjs', input);

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
  process.stderr.write(`session-start adapter error: ${error.message}\n`);
  process.exit(0);
}
