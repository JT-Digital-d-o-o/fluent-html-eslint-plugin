# Review v8.2: the plugin half of the fluent-html v8.2.0 review run

## Problem

Three rules write or print fixes that fail tsc, and fluent-html 8.2.0 adds two APIs no rule steers agents onto.

- `no-tailwind-in-raw-class` autofixes into calls tsc rejects (`border-b-2` → `.border("b-2")`, TS2769; `rotate-x-45` → `.rotate("x-45")`, TS2345) and loses classes (`setClass("p-4 js-hook")` autofixes to a chain that renders `class="js-hook"`).
- `no-dynamic-typed-styling-arg` and `no-dynamic-class-argument` prescribe `staticManifest`, which `defineTheme({ staticManifest })` rejects (TS2353) and which never clears the extractor's throw (v8-spec.md § RFC-D-01, the defect paragraph).
- `prefer-set-method` autofixes `A("Team").addAttribute("href", "/team")` to `.setHref("/team")`, a TS2345 under fluent-html 8's route brand.
- fluent-html 8.2.0 ships `IfNotEmpty`/`IfNotEmptyElse` and `.size()`; with no lint, restated list guards and equal `.w(x).h(x)` pairs stay the fleet's spelling (census in v8-spec.md § RFC-E-07 › ### Tests and measures and § RFC-E-08 › ### Measured).

The measured baselines sit in the spec section each task names: `fluent-html/project/research/v8.2.0/40-synthesis/v8-spec.md`.

## Appetite

Two plugin minors, each one publish step of `fluent-html/project/research/v8.2.0/40-synthesis/lockstep.md` §2: 4.2.0 (step 2, independent of any lib release) and 4.3.0 (step 6b, after fluent-html 8.2.0 publishes). A re-sweep commit follows each later move of the fluent-html devDependency (lockstep K4: after steps 1 and 9; the move after step 6 folds into 4.3.0).

## Solution

- **4.2.0:** RFC-C-01 (an oracle-swept fix contract for `no-tailwind-in-raw-class`, with `.cssProp()` successors and a type-aware host guard), RFC-D-01 (dynamic-argument messages picked by argument shape, every printed rewrite compiled in `npm test`), RFC-B-03's plugin half (`preferBrandedSetter`, no autofix into a branded href). One README commit carries C-01 and D-01.
- **4.3.0:** RFC-E-07 `prefer-if-not-empty` (type-aware), RFC-E-08 `prefer-size` and the `no-fluent-equivalent-in-setstyle` `.size` suggestion, and RFC-C-01's fix-contract re-sweep against 8.2.0.
- **Re-sweep after 9.0.0:** move the devDependency, re-run `npm run gen:vocab`, commit the regenerated contract.
- **Docs:** CHANGELOG and README hunks are staged as patches under `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-eslint-plugin/<release>/` and applied by the story that ships that release. The 4.3.0 patches are generated on top of the 4.2.0 ones.
- **Extractor:** RFC-D-01's extractor half (`formatUnresolved` text, `staticManifest` JSDoc) lands on `fluent-html-tailwind-extractor` main in the same window (lockstep step 3). The extractor has no `project/pm/`, so its task lives in fluent-html's `project/pm/`; its staged patches sit under `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-tailwind-extractor/main/`.

## Rabbit Holes

- **No plugin CI.** The repo has no workflow (C-41, deferred), so `npm test` is the gate and runs locally. C-01, D-01 and B-03 were each measured on a separate prototype: re-run every suite on the merged branch.
- **Two lib sources.** `scripts/gen-vocab.mjs:16` reads the sibling checkout (`fluent-html/dist`), while the fix contract compiles against `node_modules/fluent-html`. Build the sibling at the devDependency's commit before `npm run gen:vocab`, or the vocab and the contract describe different libs.
- **Rule overlap.** ``.addClass(`bg-${color}`)`` must get only D-01's `fragment` report: C-01's contract withholds tokens from a template literal with substitutions (to confirm at implementation).
- **Unexecuted wording.** The `ForEachElse` report of `prefer-if-not-empty`, the `prefer-size` suggestion and the setStyle `.size` suggestion have no executed text yet: set and test them at implementation (lockstep §5 blocker 8).
- **Preset hazard.** `prefer-size` must never autofix a chain it cannot prove clean: `Div().apply(card).w("10").h("10")` with `card` setting `w-4 h-6` goes from 40×40 to 16×24 once folded.

## No-Gos

Deferred, cut or parked items that touch this repo stay out of this scope (`fluent-html/project/research/v8.2.0/40-synthesis/roadmap.md` holds each one):

- C-41: one CI gate over lib, plugin and extractor (no `.github/workflows` here).
- C-61: `prefer-set-method` map and plugin vocab derived from the installed lib; a later derivation must keep the `BRANDED_URL_SETTERS` hand row.
- C-46: `BRANDED_URL_SETTERS` rows for `action`/`formaction` and the `Area`/`Use` roots (9.0.0).
- C-13: setClass-family and ternary rules re-derived from the 8.x surface.
- C-14: lint first-write `setClass` for class hooks.
- C-15: `prefer-unit-overload` stops steering to `.text(unit, n)`.
- C-29: palette literal under opt-out redirected to role tokens (C-01 withholds these fixes but does not redirect them).
- C-47: report every unknown `set*`/`add*` name in one pass.
- C-59: typed lint names the intended token for a typo'd styling argument.
- C-60: `prefer-htmx-api` derived from the pinned htmx package.
- C-62: typed-surface bypass lints generated from class-vocab (if designed, it keeps the single `.size(unit, n)` setStyle suggestion).
- C-77: flagging unknown or custom variant heads (C-01 open question 5).
- C-88: peer ranges and a loadable, tested `recommended` preset on ESLint 10.
- C-28: publish or deprecate the stale npm releases.
- C-39: golden first diagnostics in CI (would pin the new rules' report text).
- C-75: a CHANGELOG check per repo.
- C-80: a `defineIds` camelCase lint ahead of the 9.0.0 type.
- cand. E-07: restore `scrollM` (until then C-01's contract withholds the `.scroll("mt-24")` autofix).
- cand. E-08: `htmx-event-name` lint.
- Not adopted inside the curated items: autofixing the exact ternary and `MatchValue` rewrites (D-01, suggestion text first); merging a paired `IfThen(=== 0)` and `IfThen(> 0)` in the `prefer-if-not-empty` fix; a covering-family `size-*` merge over `w-*`/`h-*` (guardrail 13); widening the outline, min/max-width, translate and hue unions (a separate vocab-row change, not curated).
