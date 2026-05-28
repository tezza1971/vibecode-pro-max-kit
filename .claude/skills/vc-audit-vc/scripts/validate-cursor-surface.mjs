#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

const manifestPath = path.join(root, "vc-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

if (!manifest.include.some((entry) => entry.startsWith(".cursor/"))) {
  fail("vc-manifest.json must include .cursor/**");
}

const symlinks = manifest.symlinks || {};
if (symlinks[".cursor/skills"] !== "../.claude/skills") {
  fail('vc-manifest.json must symlink .cursor/skills -> ../.claude/skills');
}

const skillsLink = path.join(root, ".cursor/skills");
if (!fs.existsSync(skillsLink)) {
  fail(".cursor/skills symlink missing");
} else {
  const stat = fs.lstatSync(skillsLink);
  if (!stat.isSymbolicLink()) fail(".cursor/skills must be a symlink");
}

const requiredDirs = [".cursor/agents", ".cursor/rules", ".cursor/hooks/adapters"];
for (const dir of requiredDirs) {
  if (!fs.existsSync(path.join(root, dir))) fail(`Missing ${dir}/`);
}

console.log(
  JSON.stringify(
    {
      manifestVersion: manifest.version,
      cursorIncluded: true,
      failures,
    },
    null,
    2
  )
);

if (failures.length > 0) process.exitCode = 1;
