#!/usr/bin/env node
'use strict';

const {
  readStdinJson,
  normalizePostToolUseInput,
  translatePostToolUseStdout,
} = require('./lib/normalize.cjs');
const { runClaudeHook } = require('./lib/run-claude-hook.cjs');

const HOOK_MAP = {
  'session-state': 'session-state.cjs',
  'post-edit-simplify-reminder': 'post-edit-simplify-reminder.cjs',
};

const hookKey = process.argv[2];
const script = HOOK_MAP[hookKey];

if (!script) {
  process.stderr.write(`Unknown post-tool-use hook: ${hookKey}\n`);
  process.exit(0);
}

try {
  const input = normalizePostToolUseInput(readStdinJson());
  const result = runClaudeHook(script, input);

  if (result.error) {
    process.stderr.write(`Hook spawn error: ${result.error.message}\n`);
    process.exit(0);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  const translated = translatePostToolUseStdout(result.stdout);
  if (Object.keys(translated).length > 0) {
    process.stdout.write(`${JSON.stringify(translated)}\n`);
  }

  process.exit(result.status === null ? 0 : result.status === 2 ? 2 : 0);
} catch (error) {
  process.stderr.write(`post-tool-use adapter error: ${error.message}\n`);
  process.exit(0);
}
