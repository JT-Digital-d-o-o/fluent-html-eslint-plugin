# Roadmap

<!-- Session brain. Read first, update last. Intent only. ~40 lines. -->

## Current Focus

The plugin half of the fluent-html v8.2.0 review run. Plugin 4.2.0 comes first: it makes
`no-tailwind-in-raw-class` autofixes and the dynamic-argument rewrites compile and stops
`prefer-set-method` autofixing a raw href, and no lib release gates it. See
[review-v8.2/prd.md](review-v8.2/prd.md).

## Next Up

- plugin 4.2.0 (fix contract, per-shape dynamic-arg messages, `preferBrandedSetter`): the template 3.8.0 lock bump and the guidelines G1 deletions wait on it
- plugin 4.3.0 (`prefer-if-not-empty`, `prefer-size`, fix-contract re-sweep): waits on fluent-html 8.2.0, because both rules read its new surface
- fix-contract re-sweeps, each waiting on a fluent-html devDependency move (8.1.1 unless 4.2.0 already swept it, then 9.0.0): `node scripts/gen-fix-contract.mjs --check` fails until each lands
- behaviors-v4 rules, waiting on fluent-html W1 (the attribute grammar they pattern-match on)

## Blocked on a Decision

_(none)_

## Just Shipped

- 2026-07-20 — PM born for this repo; behavior v4 design locked upstream
  (`fluent-html/project/research/behavior-v4/`)
