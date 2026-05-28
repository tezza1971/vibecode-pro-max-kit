---
name: vc:audit-vc
description: >-
  Audit agent harness health: Claude/Codex agent parity, skill registry
  consistency, README.md sync, and protocol file wiring. Use when agents,
  skills, README.md, or development-protocol files move, split, or drift.
---

# Audit VC (Version Control Harness Health)

Use this skill to verify that the agent harness layer is internally consistent
and correctly wired across Claude, Codex, Cursor, README.md, and protocol files.

For context routing, grouping, and discoverability audits, use the `audit-context` skill instead.

## Workflow

1. Run the Claude/Codex agent parity validator:
   ```bash
   node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs
   ```
2. Run the shared skill discovery validator:
   ```bash
   node .claude/skills/vc-audit-vc/scripts/validate-skills.mjs
   ```
3. Run the README.md sync validator:
   ```bash
   node .claude/skills/vc-audit-vc/scripts/validate-guide-sync.mjs
   ```
4. Run the protocol wiring validator:
   ```bash
   node .claude/skills/vc-audit-vc/scripts/validate-protocol-wiring.mjs
   ```
5. Run the seed file consistency validator:
   ```bash
   node .claude/skills/vc-audit-vc/scripts/validate-seeds.mjs
   ```
6. Run the Cursor surface validators:
   ```bash
   node .claude/skills/vc-audit-vc/scripts/validate-cursor-surface.mjs
   node .claude/skills/vc-audit-vc/scripts/validate-cursor-agent-parity.mjs
   node .claude/skills/vc-audit-vc/scripts/validate-cursor-hooks.mjs
   node .claude/skills/vc-audit-vc/scripts/validate-cursor-rules.mjs
   ```
7. If any script reports failures, inspect the referenced files and patch the smallest
   relevant surface.
8. Re-run the failed validators until they pass.

## Rules

- Treat `.claude/agents/` as canonical for agent definitions; `.codex/agents/` and `.cursor/agents/` mirror them.
- Treat `.claude/skills/` as canonical for skills; `.agents/skills/` and `.cursor/skills/` are discovery symlinks.
- When updating agents, mirror Claude markdown, Codex TOML, and Cursor markdown surfaces together (or run `generate-cursor-agents.mjs --write`).
- Treat validator warnings as audit findings unless the user asks for a strict cleanup.
- For context routing and discoverability audits, delegate to `audit-context`.
