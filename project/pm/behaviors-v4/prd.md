# Behavior v4 lint rules (W6)

## Problem

Behavior v4's two hard policies — "never hand-write `data-behavior-*`" and "apps never register behaviors / client handlers stay pure" — are conventions until lint enforces them. v3 died partly because policy lived in docs.

## Appetite

Small batch — 3 rules + tests, after fluent-html W1 fixes the grammar they match on.

## Solution

Per `fluent-html/project/research/behavior-v4/` (C6 guardrails, W6):

1. **`no-raw-behavior-attributes`** — ban `data-behavior*` through ALL raw-attribute APIs (`setDataAttrs`, `addAttribute`, `setAttrs`), pattern-matched on the attribute name.
2. **`behavior-client-purity`** — inside `defineBehavior` handler bodies: no `window`/`globalThis` writes, no `fetch`, no `setInterval`, no `MutationObserver`, no `addEventListener`.
3. **`no-app-behavior-registration`** — flag `registerBehavior`/`defineBehavior` imports outside framework packages (the framework-only extension policy, ADR-07 amendment).

## No-Gos

- No autofix for rule 1 that guesses a verb — report only; the fix is a human choosing `.behavior()`.
