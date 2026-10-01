# Review v8.2: Tasks

Spec: `fluent-html/project/research/v8.2.0/40-synthesis/v8-spec.md` (final contracts, verdict changes folded in). Order and gates: `fluent-html/project/research/v8.2.0/40-synthesis/lockstep.md`. Plugin paths below are relative to the org root.

### As an agent running `eslint --fix` I want plugin 4.2.0's autofixes and printed rewrites to compile so that a lint pass never adds a tsc error

- [ ] [P1] Move the fluent-html devDependency to the 8.1.x commit the fix contract is swept against
  - Note: spec: v8-spec.md § RFC-C-01 › ### 1. Fix-contract generator (plugin); `fluent-html-eslint-plugin/package.json:60` goes from `7cf5b23` (8.0.0) to `656e812` (8.1.0), whose class-vocab is identical (lockstep K4)
  - Note: depends_on: none (lockstep step 2 is independent of step 1); if fluent-html 8.1.1 has published when 4.2.0 is cut, point at the 8.1.1 commit instead and skip the re-sweep task below
- [ ] [P1] Write `scripts/gen-fix-contract.mjs` and chain it into `npm run gen:vocab`
  - Note: spec: v8-spec.md § RFC-C-01 › ### 1. Fix-contract generator (plugin): the same skip guard as `test/vocab-drift.mjs` (a standalone checkout skips instead of `ERR_MODULE_NOT_FOUND`); compiles each derived call against `node_modules/fluent-html` in plain and `hover:` object form, then renders it; the header records the fluent-html and tailwindcss versions; `--check` exits 1 on a table or version mismatch; `gen:vocab` becomes `gen-vocab.mjs && tsc && gen-fix-contract.mjs && tsc`
- [ ] [P1] Commit `src/fix-contract.generated.ts` with per-entry provenance
  - Note: spec: v8-spec.md § RFC-C-01 › ### 1. Fix-contract generator (plugin): tables `NUMERIC_PREFIXES`, `BRACKET_PREFIXES`, `TYPED_NEGATIVE_PREFIXES`, `CSS_SUCCESSOR`, `WITHHELD`, `DEAD_PREFIXES`, `ROOT_PROPS`, `UNTYPED_HEADS`; each `CSS_SUCCESSOR` and `WITHHELD` entry stores the derived call it came from (or `null`), each `DEAD_PREFIXES` and `BRACKET_PREFIXES` entry its method
- [ ] [P1] Derive the two-arg border and rounded prefixes and the functional-root guard at rule load
  - Note: spec: v8-spec.md § RFC-C-01 › ### 2. Derivation at rule load (host vocab); files `fluent-html-eslint-plugin/src/derive-fixable.ts`, `fluent-html-eslint-plugin/src/tailwind-token.ts` (`TAILWIND_SHAPE` accepts `%` and a trailing `/[...]`), `fluent-html-eslint-plugin/src/vocab.generated.ts` (`TAILWIND_FUNCTIONAL_ROOTS`, emitted by `scripts/gen-vocab.mjs`)
  - Note: `fluent-html-eslint-plugin/scripts/gen-vocab.mjs:16` reads the sibling `fluent-html/dist`: build the sibling at the devDependency's commit first
- [ ] [P1] Apply a generated entry only while the host derivation still yields its stored call
  - Note: spec: v8-spec.md § RFC-C-01 › ### 2. Derivation at rule load (host vocab), Version skew; `DEAD_PREFIXES` and `BRACKET_PREFIXES` entries apply only while their stored method exists
- [ ] [P1] Skip residue rows whose method the host lacks and move the run-time throw into `test/derivation.test.js`
  - Note: spec: v8-spec.md § RFC-C-01 › ### 2. Derivation at rule load (host vocab), Residue rows; today a host without `colEnd`/`rowEnd` makes eslint exit 2
- [ ] [P1] Rewrite `no-tailwind-in-raw-class` for partial autofix and its new messageIds
  - Note: spec: v8-spec.md § RFC-C-01 › ### 3. Rule `no-tailwind-in-raw-class` (verbatim templates for `cssPropSuccessor`, `tailwindNoMethod`, `untypedValue`, `variantHeadUntyped`, `hostRejects`); a kept `setClass()` goes first; `JSON.stringify` literals; `.cssProp` values through `cssPropValue`; `tailwindNoMethod` only when the host has no method for the root; file `fluent-html-eslint-plugin/src/rules/no-tailwind-in-raw-class.ts`
- [ ] [P1] Resolve `variantNoMethod` heads through `tier1ByPrefix`
  - Note: spec: v8-spec.md § RFC-C-01 › ### 3. Rule `no-tailwind-in-raw-class`: `focus-visible:outline` names `.focusVisible({ ... })`, never `.variant("focus-visible", { ... })`
- [ ] [P1] Add the type-aware host guard that withholds fixes the project's types reject
  - Note: spec: v8-spec.md § RFC-C-01 › ### 3. Rule `no-tailwind-in-raw-class`, Host guard: `getPropertyOfType`, call signatures, `isTypeAssignableTo(getStringLiteralType(arg), param)`, plus the `.variant` head argument; a receiver typed `any` or unresolved withholds nothing; no inference through generic wrappers
- [ ] [P1] Withhold tokens from a template literal with substitutions so ``.addClass(`bg-${color}`)`` gets only the `fragment` report
  - Note: spec: v8-spec.md § Cross-RFC conflicts › ### Lint rules and plugin (`no-tailwind-in-raw-class` × `no-dynamic-class-argument`); D-01 open question 5; confirm at implementation
- [ ] [P1] Rewrite the `no-dynamic-typed-styling-arg` messages by argument shape
  - Note: spec: v8-spec.md § RFC-D-01 › ### 1. `no-dynamic-typed-styling-arg` (detection unchanged): messageIds `dynamicArg`, `conditional`, `matchValue`, `unitAmount` (`.addStyle`, never `.setStyle`), `lookup`; `{{rewrite}}` is rendered from the call's own source; a non-boolean ternary test prints as `Boolean(test)`; file `fluent-html-eslint-plugin/src/rules/no-dynamic-typed-styling-arg.ts`
- [ ] [P1] Add the type-aware lookup branch that prints only the map keys the key's type admits
  - Note: spec: v8-spec.md § RFC-D-01 › ### 1. `no-dynamic-typed-styling-arg` (detection unchanged), `MAP[key]`: a finite literal union prints its member keys; an open `string` key or no parser services gets the generic `dynamicArg`; this closes the printed TS2345 (`Record<string, C>`) and TS2353 (a map wider than its key union)
- [ ] [P1] Rewrite the `no-dynamic-class-argument` messages and derive styler names only from class-suffixed identifiers
  - Note: spec: v8-spec.md § RFC-D-01 › ### 2. `no-dynamic-class-argument` (detection and severity unchanged): messageIds `dynamicArg`, `conditional`, `lookup`, `fragment`, `hookClass`; `LABEL_CLASSES` → `label`, `controlClass(error)` → `control`, otherwise `.apply(styler)`; the "missing from the CSS" clause goes; file `fluent-html-eslint-plugin/src/rules/no-dynamic-class-argument.ts`
  - Note: the extractor half of RFC-D-01 (`formatUnresolved` text, `staticManifest` JSDoc, lockstep step 3) is tracked in fluent-html's `project/pm/` because the extractor has no `project/pm/`; its patches are under `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-tailwind-extractor/main/`
- [ ] [P1] Stop `prefer-set-method` autofixing an `href` the route brand rejects
  - Note: spec: v8-spec.md § RFC-B-03 › ### 5. eslint-plugin-fluent-html 4.2.0: `prefer-set-method`: `BRANDED_URL_SETTERS = { href: ["A"] }`, `brandSafe`, `rootFactory`, messageId `preferBrandedSetter` with the verbatim text in the spec; file `fluent-html-eslint-plugin/src/rules/prefer-set-method.ts`
  - Note: the producers the message names exist since fluent-html 8.0.0, so no lib release gates this (lockstep K4)
- [ ] [P1] Add `test/fix-contract.mjs` to `npm test`
  - Note: spec: v8-spec.md § RFC-C-01 › ### 4. Plugin CI: lint, `verifyAndFix`, tsc, then render over the swept tokens; render-check variant-headed tokens and sweep `hover:` × `CSS_SUCCESSOR` and `hover:` × the two-arg border and rounded forms; file `fluent-html-eslint-plugin/package.json:19`
  - Note: the plugin has no workflow (C-41, deferred), so `npm test` is the gate and runs locally
- [ ] [P1] Compile every rewrite the dynamic-argument rules print, as a step of `npm test`
  - Note: spec: v8-spec.md § RFC-D-01 › ### 4. Plugin CI (V-RFC-D-01-combined #8): the fixture covers a `Record<string, C>` lookup with a `string` key, a map wider than its key union, `.w("px", w).h("px", h)`, `.setStyle("background-image: …").w("%", pct)` and `.setClass(cn(...))`, `clsx`, `classNames`, `twMerge`
- [ ] [P2] Apply the staged 4.2.0 README patch as one commit for C-01, D-01 and B-03
  - Note: patch: `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-eslint-plugin/4.2.0/README.patch` (rows at `README.md:124`, `:125`, `:128`, `:143`; message block `:164-166`; bullets `:169`, `:170`; the mixed-classes example at `:65`)
  - Note: spec: v8-spec.md § RFC-C-01 › ### Prose; § RFC-D-01 › ### 5. Prose (V-RFC-D-01-combined #6), net -4; § RFC-B-03 › ### 5. eslint-plugin-fluent-html 4.2.0: `prefer-set-method`
- [ ] [P2] Apply the staged 4.2.0 CHANGELOG patch and set `package.json:6` to 4.2.0
  - Note: patch: `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-eslint-plugin/4.2.0/CHANGELOG.patch`; add the release date to its header when cutting
- [ ] [P1] Publish 4.2.0 by pushing `main`
  - Note: consumers resolve `github:JT-Digital-d-o-o/fluent-html-eslint-plugin#main` (`projects-template/templates/full-stack/package.json:108`); the template 3.8.0 lock bump (lockstep step 5) and the guidelines G1 deletions of D-01 (lockstep K5) wait on this push
- [ ] [P2] Re-sweep the fix contract once fluent-html 8.1.1 publishes, unless 4.2.0 was already swept against it
  - Note: depends_on: release: fluent-html 8.1.1 (lockstep step 1)
  - Note: spec: v8-spec.md § RFC-C-01 › ### 2. Derivation at rule load (host vocab); lockstep K4 (each devDependency move is a re-sweep commit): move `package.json:60` to the 8.1.1 commit, run `npm run gen:vocab`, commit the regenerated contract; `gen:vocab --check` fails until it lands
- [ ] [P1] Write tests
  - Note: `test/rule.test.js` asserts the new texts of all three rules; `prefer-set-method` gains cases (report-only: a chained `A()` with a variable, an unknown receiver; autofix kept: an `https` literal, a `#${id}` template, `.resolve()`, `assetUrl()`, `Link()`) and the old `A("Link").addAttribute("href", "/page")` case expects `preferBrandedSetter` with `output: null`; `test/type-aware.test.js` covers the lookup branch and `hostRejects`; `test/derivation.test.js` carries the residue assertion
- [ ] [P1] Check for bugs
  - Note: re-run every suite on the merged branch, since C-01, D-01 and B-03 were each measured on a separate prototype (lockstep §3.2); replay the baselines in v8-spec.md § RFC-C-01 › ### Measured (template pure-prior `eslint --fix` then tsc, the adversarial probe, the untyped fleet run) and § RFC-D-01 › ### Measured (RFC + verdict)

### As an author on fluent-html 8.2.0 I want plugin 4.3.0 to fold restated list guards into IfNotEmpty and equal width/height pairs into .size() so that each has one spelling

- [ ] [P1] Move the fluent-html devDependency to the 8.2.0 commit and re-sweep the fix contract
  - Note: depends_on: release: fluent-html 8.2.0 (lockstep step 6); release: plugin 4.2.0 (RFC-C-01 @ plugin 4.2.0)
  - Note: spec: v8-spec.md § Track E addendum › #### Lint rules and plugin (`no-tailwind-in-raw-class` fix contract row): the re-sweep admits `size-4` → `.size("4")` and `hover:size-6` → `.hover({ size: "6" })`, withholds the off-union `size-4.5`, and `derive-fixable` gains the `size-` pattern; files `fluent-html-eslint-plugin/package.json:60`, `fluent-html-eslint-plugin/src/fix-contract.generated.ts`
  - Note: build the sibling `fluent-html` checkout at the 8.2.0 commit first (`scripts/gen-vocab.mjs:16` reads its `dist`)
- [ ] [P1] Re-derive `src/vocab.generated.ts` with `scripts/gen-vocab.mjs`
  - Note: spec: v8-spec.md § RFC-E-08 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0) and § Track E addendum › #### Lint rules and plugin (plugin `vocab.generated.ts` row): the `size` row joins the methods and the unit methods; `containerQuery` stays
- [ ] [P1] Add `prefer-if-not-empty` with the guard, `ForEachElse` and dead-fallback autofixes
  - Note: spec: v8-spec.md § RFC-E-07 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0): `prefer-if-not-empty`, recommended, type-aware; new file `fluent-html-eslint-plugin/src/rules/prefer-if-not-empty.ts`; a no-op without parser services or on a lib without `IfNotEmpty`; skips string receivers, `IfThen(X.length === 0, …)` alone and type-parameter receivers; a name clash keeps `() =>` and the message says so
  - Note: the guard and `arrayValue` messages keep the spec's verbatim texts; the `ForEachElse` report text is unexecuted: set it and test it here (lockstep §5 blocker 8)
- [ ] [P1] Offer the `arrayValue` suggestion for an array passed straight to `IfThen` or `IfThenElse`
  - Note: spec: v8-spec.md § RFC-E-07 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0): a suggestion only, because the output changes for `[]`
- [ ] [P2] Set the `recommended` severity of `prefer-if-not-empty`
  - Note: spec: v8-spec.md § RFC-E-07, Unresolved (`arrayValue` severity, RFC open question 3) leaves it to implementation; the staged README row says `error`, matching the template's `fluent-html/prefer-if-not-empty: "error"` (lockstep §3.5, 3.9.0 step 4); amend the row if the call differs
- [ ] [P1] Add `prefer-size` with the clean-receiver autofix and a hazard-naming suggestion elsewhere
  - Note: spec: v8-spec.md § RFC-E-08 › ### Curation applied: no autofix over a composed preset; § RFC-E-08 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0): autofix only when the chain root is a fluent-html element factory and no earlier `w`, `h`, `size`, `minW`, `minH`, `maxW`, `maxH`, `apply`, `when`, `whenElse`, `whenMatch`, `addClass`, `setClass` or `cssClass` call exists; a variant object follows its chain; skips `"screen"`; inert without the `size` row; new file `fluent-html-eslint-plugin/src/rules/prefer-size.ts`
  - Note: the suggestion text is unexecuted: set it and test it here (lockstep §5 blocker 8)
- [ ] [P1] Register both rules in `src/index.ts` and in `recommended`, with `prefer-size` at warn
  - Note: file `fluent-html-eslint-plugin/src/index.ts` (rule map beside `prefer-foreach` at :45, `recommended` block at :70)
- [ ] [P1] Give `no-fluent-equivalent-in-setstyle` one `.size(unit, n)` suggestion for an equal width and height
  - Note: spec: v8-spec.md § RFC-E-08 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0); file `fluent-html-eslint-plugin/src/rules/no-fluent-equivalent-in-setstyle.ts:17-18` (`UNIT_PROPS`); only when the installed lib has the `size` row; the wording is unexecuted (lockstep §5 blocker 8)
- [ ] [P2] Apply the staged 4.3.0 README patch on top of the 4.2.0 one
  - Note: patch: `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-eslint-plugin/4.3.0/README.patch` (rows for `prefer-if-not-empty` after `prefer-match` and `prefer-size` after `prefer-foreach`; the `no-fluent-equivalent-in-setstyle` row and section; the typed-method count in the `no-dynamic-typed-styling-arg` row); it applies only after the 4.2.0 README patch
  - Note: spec: v8-spec.md § RFC-E-07 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0); § RFC-E-08 › ### 2. Lint (eslint-plugin-fluent-html 4.3.0)
- [ ] [P2] Apply the staged 4.3.0 CHANGELOG patch and set `package.json:6` to 4.3.0
  - Note: patch: `fluent-html/project/research/v8.2.0/60-rollout/staged/fluent-html-eslint-plugin/4.3.0/CHANGELOG.patch`; the re-sweep has no entry of its own, it rides the `prefer-size` entry; add the release date to the header when cutting
- [ ] [P1] Publish 4.3.0 by pushing `main`
  - Note: the template 3.9.0 plugin lock bump and its `prefer-if-not-empty` and `prefer-size` commits (lockstep K14) and the guidelines G2 wave (lockstep K7) wait on this push
- [ ] [P1] Write tests
  - Note: `test/type-aware.test.js`: the RFC-E-07 fixture (guard reports with fixes, an `arrayValue` suggestion, no report on the string receiver, on `=== 0` alone or without type information, the fixed file compiling) plus a `ForEachElse` case, the dead-fallback case, the generic-`L` case with no report and the name-clash message; `test/rule.test.js`: `prefer-size` cases (a clean chain fixed; preset, component and identifier roots get the suggestion only; variant objects; `"screen"` skipped; inert without the row) and the setStyle `.size` suggestion
- [ ] [P1] Check for bugs
  - Note: re-run `npm test` with the fix contract on the merged branch; on the same files, the `prefer-size --fix` output must equal fluent-html's `codemod:size-fold` output (v8-spec.md § RFC-E-08 › ### Measured); confirm `addClass("w-4 h-4 shrink-0")` composes to `.size("4").shrink("0")` on a clean receiver in one `--fix` run

### As a maintainer I want the fix contract re-swept against fluent-html 9.0.0 so that no autofix targets a removed name

- [ ] [P1] Move the fluent-html devDependency to the 9.0.0 commit and re-run `npm run gen:vocab`
  - Note: depends_on: release: fluent-html 9.0.0 (lockstep step 9); release: plugin 4.3.0
  - Note: spec: v8-spec.md § RFC-C-01 › ### 2. Derivation at rule load (host vocab); lockstep K4 (re-sweeps follow steps 1, 6 and 9); files `fluent-html-eslint-plugin/package.json:60`, `fluent-html-eslint-plugin/src/fix-contract.generated.ts`; `gen:vocab --check` fails until the committed header records the 9.0.0 versions
  - Note: RFC-C-02 changes no class-vocab row, so the tables are expected to hold; lockstep names no plugin version or CHANGELOG entry for this commit
- [ ] [P1] Write tests
  - Note: `npm test` with the fix contract, against fluent-html 9.0.0
- [ ] [P1] Check for bugs
  - Note: confirm no fix-table entry, residue row or rule message targets a name RFC-C-02 or RFC-E-07 removes in 9.0.0 (`PRUNED_9`, `ForEachElse`); the `ForEachElse` autofix of `prefer-if-not-empty` stays for repos still on 8.2.x
