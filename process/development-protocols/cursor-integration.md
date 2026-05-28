# Cursor integration

Cross-tool guidance for using vibecode-pro-max-kit with **Cursor IDE** and **Cursor CLI**.

## Surfaces Cursor loads

| Surface | Path | Purpose |
|---------|------|---------|
| Rules | `.cursor/rules/*.mdc` | Always-on orchestrator shards |
| Agents | `.cursor/agents/vc-*.md` | Task/subagent role prompts |
| Hooks | `.cursor/hooks.json` | Lifecycle automation (CLI + IDE) |
| Skills | `.cursor/skills/` → `.claude/skills/` | Workflow skills |
| Orchestrator | `AGENTS.md` | Full RIPER-5 routing reference |
| Shared artifacts | `process/` | Plans, context, protocols |

## Cursor IDE quick start

1. Install harness: `curl -fsSL …/install.sh | bash`
2. Open repository in Cursor
3. Run **`vc-setup`** (Agent chat) to scaffold `process/` and populate context
4. Verify Settings → Rules, Skills, and Hooks show project entries
5. Describe a feature — orchestrator should route RESEARCH before implementation

## Cursor CLI quick start

From repository root:

```bash
agent                    # interactive Agent session
agent --mode=plan        # Cursor native Plan mode
agent -p "your prompt"   # headless print mode (CI/automation)
```

Project hooks in `.cursor/hooks.json` load for CLI Agent sessions. User hooks in `~/.cursor/hooks.json` do not apply to cloud agents.

Permissions: see `.cursor/cli.json` (project) and `~/.cursor/cli-config.json` (user override).

## RIPER-5 mode commands

| Command | Phase |
|---------|-------|
| *(automatic on feature requests)* | RESEARCH |
| `go` / `ENTER INNOVATE MODE` | INNOVATE |
| `go` / `ENTER PLAN MODE` | PLAN |
| `ENTER EXECUTE MODE` | EXECUTE |
| `ENTER UPDATE PROCESS MODE` | UPDATE PROCESS |
| `ENTER FAST MODE - [task]` | Compressed RESEARCH→PLAN (pauses before EXECUTE) |

Delegate to subagents in `.cursor/agents/` via the **Task** tool when the orchestrator routes a phase.

## Cursor Plan mode vs RIPER PLAN

These are **different** systems:

| | Cursor Plan mode | RIPER PLAN phase |
|---|------------------|------------------|
| Trigger | `/plan`, `--mode=plan`, Shift+Tab | `ENTER PLAN MODE`, `vc-plan-agent` |
| Output | In-session plan virtual file | Durable `*_PLAN_*.md` under `process/` |
| Execution | Continuous checklist in one session (SIMPLE) or phased imports (COMPLEX) | Phase-locked EXECUTE gate (`ENTER EXECUTE MODE`) |
| Best for | Quick in-IDE execution from an existing checklist | Reviewable specs, cross-tool handoff, audit trail |

### SIMPLE plans

1. Open plan in `process/general-plans/active/` or `process/features/*/active/`
2. Copy the **Cursor Plan import block** into Cursor Plan mode
3. Execute steps 1–N in one session
4. Run verification at end (tests, manual checks)

### COMPLEX plans

1. Import one phase/RFC checklist at a time into Cursor Plan mode
2. Complete phase verification gates before next import
3. Update plan status strip in the artifact between phases
4. Use `phase-programs.md` for umbrella/multi-phase programs

## Parity matrix (honest)

| Capability | Claude Code | Codex | Cursor |
|------------|-------------|-------|--------|
| Phase tool locks (YAML) | Enforced | Prompt-only | Prompt-only |
| Lifecycle hooks | `.claude/settings.json` | `.codex/hooks.json` | `.cursor/hooks.json` |
| Subagent definitions | `.claude/agents/` | `.codex/agents/` | `.cursor/agents/` |
| Shared plans/context | Yes | Yes | Yes |

Cursor enforcement = **rules + hooks + prompt discipline**, not structural tool removal.

## Troubleshooting

**Hooks not firing:** Confirm `.cursor/hooks.json` exists; restart Cursor after edits; for CLI run from repo root.

**Skills not listed:** Ensure `.cursor/skills` symlink resolves to `.claude/skills/`; run `vc-setup` validation.

**Agent skipped RESEARCH:** Rules in `.cursor/rules/riper-orchestrator.mdc` should load with `alwaysApply: true`; explicitly say `ENTER RESEARCH MODE`.

**Plan mode confusion:** Use the plan artifact header — if it says RIPER workflow, do not treat Cursor Plan as a substitute for `ENTER EXECUTE MODE`.

## Related docs

- [docs/CURSOR.md](../../docs/CURSOR.md) — user-facing setup guide
- [plan-lifecycle.md](plan-lifecycle.md) — plan naming and EXECUTE gate
- [orchestration.md](orchestration.md) — delegation and closeout
