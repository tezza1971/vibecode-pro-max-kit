#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  if (strict) failures.push(message);
  else warnings.push(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function listAgentNames(dir, extension) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => entry.name.slice(0, -extension.length))
    .sort();
}

function parseClaudeBody(file) {
  const text = read(file);
  return text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
}

function parseCursorBody(file) {
  const text = read(file);
  let body = text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
  body = body.replace(/\n## Cursor invocation[\s\S]*$/, "").trim();
  return body;
}

function normalize(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/Claude Code's Agent tool/g, "Cursor's Task tool")
    .replace(/Claude Code Tasks/g, "Cursor Tasks")
    .replace(/\.claude\/agents\//g, ".cursor/agents/")
    .replace(/Agent tool/g, "Task tool")
    .replace(/\.claude\/CLAUDE\.md|CLAUDE\.md|AGENTS\.md/g, "{TOP_LEVEL_INSTRUCTIONS}")
    .replace(/\.claude\/skills\/|\.agents\/skills\/|\.cursor\/skills\//g, "{SKILLS}/")
    .replace(/\.claude\/agents\/|\.codex\/agents\/|\.cursor\/agents\//g, "{AGENTS}/")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function hash(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

const claudeAgents = listAgentNames(".claude/agents", ".md");
const cursorAgents = listAgentNames(".cursor/agents", ".md");

if (cursorAgents.length === 0) {
  fail(".cursor/agents/ missing or empty — run generate-cursor-agents.mjs --write");
}

for (const agent of claudeAgents) {
  if (!cursorAgents.includes(agent)) fail(`.cursor/agents/${agent}.md missing`);
}
for (const agent of cursorAgents) {
  if (!claudeAgents.includes(agent)) fail(`.claude/agents/${agent}.md missing (orphan Cursor agent)`);
}

const compared = [];
for (const agent of claudeAgents.filter((name) => cursorAgents.includes(name))) {
  const claudeBody = normalize(parseClaudeBody(`.claude/agents/${agent}.md`));
  const cursorBody = normalize(parseCursorBody(`.cursor/agents/${agent}.md`));
  if (claudeBody !== cursorBody) {
    warn(
      `${agent} body differs (claude=${hash(claudeBody)} cursor=${hash(cursorBody)}) — regenerate with generate-cursor-agents.mjs --write`
    );
  }
  compared.push(agent);
}

console.log(
  JSON.stringify(
    {
      checkedClaudeAgents: claudeAgents.length,
      checkedCursorAgents: cursorAgents.length,
      comparedAgents: compared.length,
      warnings,
      failures,
      strict,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exitCode = 1;
