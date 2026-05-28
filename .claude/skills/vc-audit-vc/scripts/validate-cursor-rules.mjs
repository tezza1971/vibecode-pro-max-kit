#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

const requiredRules = [
  ".cursor/rules/riper-orchestrator.mdc",
  ".cursor/rules/process-routing.mdc",
  ".cursor/rules/plan-lifecycle.mdc",
  ".cursor/rules/harness-files.mdc",
];

for (const rule of requiredRules) {
  const abs = path.join(root, rule);
  if (!fs.existsSync(abs)) {
    fail(`Missing Cursor rule: ${rule}`);
    continue;
  }
  const text = read(rule);
  if (!text.startsWith("---")) fail(`${rule} missing YAML frontmatter`);
  if (!text.includes("description:")) fail(`${rule} missing description frontmatter`);
}

const brokenLinkPattern = /\]\((\.\.\/\.\.\/[^)]+)\)/g;
const optionalLinkTargets = new Set([
  "../../process/context/all-context.md",
  "../../process/context/tests/all-tests.md",
]);

for (const rule of requiredRules) {
  if (!fs.existsSync(path.join(root, rule))) continue;
  const text = read(rule);
  let match;
  while ((match = brokenLinkPattern.exec(text)) !== null) {
    const target = match[1];
    if (optionalLinkTargets.has(target)) continue;
    const resolved = path.normalize(path.join(root, path.dirname(rule), target));
    if (!fs.existsSync(resolved)) {
      fail(`${rule} broken relative link: ${target}`);
    }
  }
}

if (!fs.existsSync(path.join(root, ".cursor/cli.json"))) {
  fail(".cursor/cli.json missing");
}

console.log(JSON.stringify({ requiredRules: requiredRules.length, failures }, null, 2));
if (failures.length > 0) process.exitCode = 1;
