# Cursor setup guide

Use vibecode-pro-max-kit with **Cursor IDE** and **Cursor CLI** (`agent`).

## Install

From your project root:

```bash
curl -fsSL https://raw.githubusercontent.com/withkynam/vibecode-pro-max-kit/main/install.sh | bash
```

Then in Cursor Agent chat (or Claude Code):

```
Run vc-setup
```

`vc-setup` scaffolds `process/`, populates context, and validates harness wiring including Cursor surfaces.

## What Cursor loads

| Surface | Path |
|---------|------|
| Rules | `.cursor/rules/*.mdc` |
| Agents | `.cursor/agents/vc-*.md` |
| Hooks | `.cursor/hooks.json` |
| Skills | `.cursor/skills/` → `.claude/skills/` |
| Orchestrator | `AGENTS.md` |
| Plans & context | `process/` |

## Cursor IDE

1. Open the project folder in Cursor.
2. Open **Settings → Rules, Skills, Hooks** and confirm project entries appear.
3. Start Agent chat and describe a feature — routing should begin in RESEARCH, not immediate coding.
4. After plan review, say **`ENTER EXECUTE MODE`** to implement.

### Cursor Plan mode

Cursor native Plan (`/plan`, Shift+Tab) is **not** the same as the RIPER PLAN phase.

- **RIPER PLAN** writes durable specs under `process/general-plans/active/` or `process/features/*/active/`.
- **Cursor Plan** executes a checklist in-session.

Copy the **`## Cursor Plan import block`** section from a plan file into Plan mode. For multi-phase plans, import one phase at a time and run verification gates between phases.

See [process/development-protocols/cursor-integration.md](../process/development-protocols/cursor-integration.md).

## Cursor CLI

Run from repository root so rules and hooks load:

```bash
agent                      # interactive session
agent --mode=plan          # Plan mode
agent -p "summarize repo"  # headless one-shot
```

### Permissions

- Project defaults: [`.cursor/cli.json`](../.cursor/cli.json)
- User override: `~/.cursor/cli-config.json`

Avoid `--force` / `--yolo` to bypass approval gates for substantial RIPER-5 work. Use **`ENTER EXECUTE MODE`** after plan review instead.

### Headless / CI example

```bash
cd /path/to/project
agent -p "Run vc-audit-vc validators and report failures"
```

Cloud agents load project `.cursor/hooks.json` from the repo; user-level hooks do not apply in the cloud.

## RIPER-5 cheat sheet

| You say | Phase |
|---------|-------|
| *(feature request)* | RESEARCH (auto) |
| `go` | INNOVATE → PLAN |
| `ENTER EXECUTE MODE` | EXECUTE |
| `ENTER UPDATE PROCESS MODE` | Archive plan, capture learnings |
| `ENTER FAST MODE - [task]` | Compressed workflow (pauses before EXECUTE) |

Delegate to subagents via the **Task** tool using `.cursor/agents/vc-*-agent.md` prompts.

## Parity matrix

| Capability | Claude Code | Cursor |
|------------|-------------|--------|
| YAML tool locks | Enforced | Prompt-only |
| Lifecycle hooks | `.claude/settings.json` | `.cursor/hooks.json` |
| Shared plans/context | Yes | Yes |

Cursor enforcement = rules + hooks + prompt discipline.

## Troubleshooting

**Hooks not firing**

- Confirm `.cursor/hooks.json` exists at project root.
- Restart Cursor after editing hooks (CLI reloads on save).
- Run `node .claude/skills/vc-audit-vc/scripts/validate-cursor-hooks.mjs`.

**Skills missing**

- Check symlink: `ls -la .cursor/skills`
- Should point to `../.claude/skills`

**Agent parity drift**

```bash
node .claude/skills/vc-audit-vc/scripts/generate-cursor-agents.mjs --write
node .claude/skills/vc-audit-vc/scripts/validate-cursor-agent-parity.mjs
```

**Skipped RESEARCH / jumped to code**

- Rules in `.cursor/rules/riper-orchestrator.mdc` should have `alwaysApply: true`.
- Say `ENTER RESEARCH MODE` explicitly.

## Related docs

- [AGENTS.md](../AGENTS.md) — full orchestrator
- [README.md](../README.md) — kit overview
- [CONTRIBUTING.md](../CONTRIBUTING.md) — tri-surface agent parity
