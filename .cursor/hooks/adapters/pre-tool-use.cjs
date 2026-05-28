#!/usr/bin/env node
'use strict';

const {
  readStdinJson,
  normalizePreToolUseInput,
  translatePreToolUseStdout,
} = require('./lib/normalize.cjs');
const { runClaudeHook } = require('./lib/run-claude-hook.cjs');

const HOOK_MAP = {
  'scout-block': 'scout-block.cjs',
  'privacy-block': 'privacy-block.cjs',
  'descriptive-name': 'descriptive-name.cjs',
};

const hookKey = process.argv[2];
const script = HOOK_MAP[hookKey];

if (!script) {
  process.stderr.write(`Unknown pre-tool-use hook: ${hookKey}\n`);
  process.exit(0);
}

try {
  const input = normalizePreToolUseInput(readStdinJson());
  const result = runClaudeHook(script, input);

  if (result.error) {
    process.stderr.write(`Hook spawn error: ${result.error.message}\n`);
    process.exit(0);
  }

  const translated = translatePreToolUseStdout(result.stdout);
  if (translated) {
    process.stdout.write(`${JSON.stringify(translated)}\n`);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status === 2) {
    if (!translated) {
      process.stdout.write(
        JSON.stringify({
          permission: 'deny',
          user_message: 'Blocked by vibecode harness hook',
          agent_message: (result.stderr || '').trim() || 'Operation blocked by policy hook',
        }) + '\n'
      );
    }
    process.exit(2);
  }

  process.exit(result.status === null ? 0 : result.status);
} catch (error) {
  process.stderr.write(`pre-tool-use adapter error: ${error.message}\n`);
  process.exit(0);
}
