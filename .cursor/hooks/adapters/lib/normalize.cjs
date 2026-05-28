#!/usr/bin/env node
'use strict';

/** Map Cursor tool names to Claude hook expectations where needed. */
const TOOL_ALIASES = {
  Shell: 'Bash',
  TabWrite: 'Write',
  TabRead: 'Read',
};

function normalizeToolName(name) {
  return TOOL_ALIASES[name] || name || '';
}

function readStdinJson() {
  const fs = require('fs');
  const raw = fs.readFileSync(0, 'utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function normalizePreToolUseInput(input) {
  return {
    ...input,
    tool_name: normalizeToolName(input.tool_name),
    hook_event_name: input.hook_event_name || 'PreToolUse',
    session_id: input.session_id || input.conversation_id || null,
    cwd: input.cwd || (Array.isArray(input.workspace_roots) ? input.workspace_roots[0] : process.cwd()),
  };
}

function normalizePostToolUseInput(input) {
  return {
    ...input,
    tool_name: normalizeToolName(input.tool_name),
    hook_event_name: input.hook_event_name || 'PostToolUse',
    session_id: input.session_id || input.conversation_id || null,
    cwd: input.cwd || (Array.isArray(input.workspace_roots) ? input.workspace_roots[0] : process.cwd()),
  };
}

function normalizeSubagentStartInput(input) {
  return {
    ...input,
    agent_type: input.agent_type || input.subagent_type || 'unknown',
    agent_id: input.agent_id || input.subagent_id || 'unknown',
    session_id: input.session_id || input.conversation_id || input.parent_conversation_id || null,
    cwd: input.cwd || (Array.isArray(input.workspace_roots) ? input.workspace_roots[0] : process.cwd()),
    hook_event_name: input.hook_event_name || 'SubagentStart',
  };
}

function normalizeSessionStartInput(input, sourceOverride) {
  const source =
    sourceOverride ||
    input.source ||
    (input.hook_event_name === 'preCompact' ? 'compact' : 'startup');
  return {
    ...input,
    source,
    session_id: input.session_id || input.conversation_id || null,
    hook_event_name: input.hook_event_name || 'SessionStart',
  };
}

function translatePostToolUseStdout(stdout) {
  const trimmed = (stdout || '').trim();
  if (!trimmed) return {};
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.additionalContext && !parsed.additional_context) {
      parsed.additional_context = parsed.additionalContext;
      delete parsed.additionalContext;
    }
    if (parsed.continue !== undefined && parsed.additional_context) {
      return { additional_context: parsed.additional_context };
    }
    return parsed.additional_context ? { additional_context: parsed.additional_context } : {};
  } catch {
    return trimmed ? { additional_context: trimmed } : {};
  }
}

function translatePreToolUseStdout(stdout) {
  const trimmed = (stdout || '').trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    const hookOut = parsed.hookSpecificOutput || parsed;
    const context =
      hookOut.additionalContext ||
      hookOut.additional_context ||
      parsed.additional_context ||
      parsed.agent_message;
    if (context) {
      return {
        permission: 'allow',
        agent_message: context,
      };
    }
    if (hookOut.permissionDecision === 'deny') {
      return {
        permission: 'deny',
        agent_message: hookOut.message || 'Blocked by hook policy',
      };
    }
  } catch {
    return null;
  }
  return null;
}

function translateSessionStdout(stdout, stderr) {
  const parts = [stdout, stderr].filter(Boolean).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return {};
  return { additional_context: parts.join('\n') };
}

module.exports = {
  TOOL_ALIASES,
  normalizeToolName,
  readStdinJson,
  normalizePreToolUseInput,
  normalizePostToolUseInput,
  normalizeSubagentStartInput,
  normalizeSessionStartInput,
  translatePostToolUseStdout,
  translatePreToolUseStdout,
  translateSessionStdout,
};
