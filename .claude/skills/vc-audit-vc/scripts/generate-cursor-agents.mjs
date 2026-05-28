#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const write = process.argv.includes("--write");

const STRIP_FRONTMATTER_KEYS = new Set([
  "tools",
  "model",
  "permissionMode",
  "name",
  "description",
]);

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function parseClaudeAgent(file) {
  const text = read(file);
  const frontmatter = {};
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (match) {
    for (const line of match[1].split("\n")) {
      const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (item) frontmatter[item[1]] = item[2].replace(/^["']|["']$/g, "");
    }
  }
  let body = text.replace(/^---\n[\s\S]*?\n---\n?/, "").trim();
  body = body
    .replace(/Claude Code's Agent tool/g, "Cursor's Task tool")
    .replace(/Claude Code Tasks/g, "Cursor Tasks")
    .replace(/\.claude\/agents\//g, ".cursor/agents/")
    .replace(/Agent tool/g, "Task tool");
  return { frontmatter, body };
}

function buildCursorAgent(name, { frontmatter, body }) {
  const description = frontmatter.description || "";
  const lines = [
    "---",
    `name: ${name}`,
    `description: ${description}`,
    "---",
    "",
    body,
    "",
    "## Cursor invocation",
    "",
    "When the orchestrator or user delegates this role, invoke via Cursor's Task tool with the matching subagent from `.cursor/agents/`.",
    "Phase tool restrictions from Claude YAML are not enforced in Cursor — follow the permitted/forbidden lists in this prompt strictly.",
    "",
  ];
  return lines.join("\n");
}

const claudeDir = path.join(root, ".claude/agents");
const cursorDir = path.join(root, ".cursor/agents");
const claudeAgents = fs
  .readdirSync(claudeDir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.replace(/\.md$/, ""))
  .sort();

if (!fs.existsSync(cursorDir)) {
  fs.mkdirSync(cursorDir, { recursive: true });
}

const generated = [];
for (const agent of claudeAgents) {
  const parsed = parseClaudeAgent(`.claude/agents/${agent}.md`);
  const content = buildCursorAgent(agent, parsed);
  const outPath = path.join(cursorDir, `${agent}.md`);
  if (write) {
    fs.writeFileSync(outPath, content, "utf8");
  }
  generated.push({ agent, outPath: `.cursor/agents/${agent}.md`, bytes: content.length });
}

console.log(JSON.stringify({ write, generatedCount: generated.length, generated }, null, 2));

if (!write) {
  console.error("Dry run only. Re-run with --write to emit .cursor/agents/*.md");
  process.exitCode = 0;
}
