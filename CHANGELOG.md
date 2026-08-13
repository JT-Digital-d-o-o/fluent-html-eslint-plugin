# Changelog

All notable changes to `eslint-plugin-fluent-html` are documented here.

## [Unreleased — 4.0.0] - Canonical names: fixes target the renamed/merged surface

The lint arm of fluent-html's `llm-styling/canonical-names` (pairs with fluent-html 7.0.0; peer bump lands with the release).

### 💥 Breaking

- **All autofixes and suggestions now emit the canonical methods** — `.bg()`, `.p()`, `.text()`, `.font()`, `.border()`, `.ring()`, `.list()`, `.mask()`, `.bgLinear()`, … — and the 12 directional shorthands own their prefixes (`mt-2` → `.mt("2")`, no longer `.m("t", "2")`). Apps must be on the canonical fluent-html release for fixes to compile.
- **Derivation understands merged vocab rows** — the new `values: { kind: "group" }` spec contributes one exact list per family through the row's own emit fn, so `text-center`, `flex-wrap`, `border-dashed`, `mask-add`, `outline-hidden`, `bg-linear-to-br` all derive with `fixedValue`s. The merges collapsed the residue tables: `RESIDUE_PREFIX_OWNERS` shrank from 15 entries to the 12 shorthand owners + `snap-`; `PREFERRED_EXACTS` is empty (`bold()` is gone).
- **`no-fluent-equivalent-in-setstyle`** suggestions updated (`font-size` → `.text("px", …)`, `margin-top` → `.mt(…)`, `color` → `.text()`, `background` → `.bg()`, `z-index` → `.z()`, …); `no-removed-v4-utilities` message names `.bg()`.

### 💥 Breaking — object-variant autofixes (`llm-styling/object-variants`)

- **Variant-token autofixes now emit the object form** — `hover:bg-blue-600` → `.hover({ bg: "blue-600" })`, `sm:grid-cols-2` → `.sm({ gridCols: "2" })`, nested heads as nested keys (`sm:hover:bg-blue-600` → `.sm({ hover: { bg: "blue-600" } })`), `2xl:` → `.xl2({…})`, directional spacing flattened (`px-16` → `px: "16"`), bare optionals as `true` (`focus:ring` → `.focus({ ring: true })`), non-tier-1 outer heads via `.variant("peer-invalid", {…})`. Object keys derive from `fluent-html/class-vocab`'s `variantKeySpecs` at rule-load (no local table). A non-tier-1 head in nested position is not object-expressible — those tokens report without an autofix. All `.on()`/`.at()` teaching in rule messages replaced.

### ✨ Added

- **`prefer-nav-for-internal-links`** (warn, in `recommended`) — `A(…).setHref("/…")` with an internal literal path is a full-page reload that bypasses the typed route table; the rule points at `.nav(route)`. Escapes: external/protocol-relative URLs, non-literal hrefs (`resolve()`, variables), `setTarget` other than `"_self"`, `setDownload`/`toggle("download")`.
- **`prefer-foreach` matches array-producing spreads beyond `.map()`** — `...Array.from({length: n}, (_, i) => …)` (autofixes to the `ForEach(n, (i) => …)` count overload when the element param is provably unused), `Array.from(iterable, cb)` (autofix: identical `(item, index)` contract), bare `Array.from(iterable)` (autofix to identity render), `.flatMap()` and `Array.of()` (report-only). Closes the audit escapee that survived the one repo with the lint installed.
- **`no-ternary-in-view-builder` catches the variable-assignment form** — `const x = cond ? Tag : Tag` (and `x = cond ? Tag : Tag`) is flagged where both branches are element chains; the guidance points at `IfThenElse`/`Match`.
- **`anchor-requires-cursor-pointer` skips verb-chained anchors** — the click verbs (`.nav`/`.tab`/`.submit`/`.fragment`/`.fire`) stamp `cursor-pointer` themselves as of the template's T4 enforcement, so a verb-chained anchor no longer needs (or gets flagged for) an explicit `.cursor("pointer")`.

- **`require-satisfies-variant-object`** (error, in `recommended`) — an extracted variant style object passed by name (or spread into a variant object) bypasses TS excess-property spell-checking; the rule requires its declaration to be pinned with `satisfies VariantStyleObject`. Same-named non-fluent calls are guarded by a variant-key shape check; unresolvable names (imports, params) are skipped — the rule fires where the declaration is visible.
- **Regenerated vocab tables** for the canonical surface (189 methods, 38 unit methods, 638 derived patterns).

### 📝 Docs

- README rewritten to the canonical surface: pattern table shows the merged prefixes and shorthand owners, and the stale `.addClass("hover:…")` teaching is gone — variants are `.on()`/`.at()`, with the escape-hatch decision list (`.cssProp()`/`.cssClass()`/`.setStyle()`) in its place; config examples reference `no-tailwind-in-raw-class` instead of the deprecated rule.

## [3.0.0] - Escape-hatch closure: CI-blocking raw-class rules

The lint arm of fluent-html's `llm-styling/escape-hatch` scope (pairs with fluent-html 6.8.0).

### 💥 Breaking

- **`no-tailwind-in-raw-class` supersedes `no-known-modifiers-in-setclass`** in the recommended preset, at **error**. The old rule remains registered but deprecated (`replacedBy`) and is out of `recommended`. The new rule is prefix-anchored: derived fix-table exacts/prefixes, known variant heads (incl. `[&…]` arbitrary selectors), or Tailwind-shaped tokens whose root is in the generated `TAILWIND_ROOTS` list (1073 roots from the lib's pinned Tailwind design system) — so `sidebar-backdrop`/`entry-row` style custom classes are never false positives. Autofix rewrites whole calls to fluent chains, folding variant tokens into `.on()`/`.at()` (incl. nested `sm:hover:`).
- **`no-dynamic-class-argument`** (error): non-literal args to `addClass`/`setClass`/`cssClass` — the safelist extractor records literals only, so computed classes silently vanish from production CSS. Message routes to `.when()`/`Match` literal branches or `staticManifest`.
- **`no-tailwind-in-cssclass`** (error): the inverse guard — Tailwind utilities inside the `.cssClass()` non-Tailwind marker autofix back to the typed surface.

### ✨ Added

- **Regenerated vocab tables** for fluent-html 6.8.0: `VOCAB_METHODS` now includes `.appearance()`, `.wrap()`, `.content()`, `.cssProp()` (201 methods; 636 derived patterns) + the new `TAILWIND_ROOTS` set. Suggestions naming the new methods apply to apps on fluent-html ≥6.8.0.

## [2.0.0] - Vocab-derived fix tables

`no-known-modifiers-in-setclass` no longer carries a hand-maintained pattern table — the ~780-line `FIXABLE_PATTERNS`/`MODIFIER_MAP` block is **derived from `fluent-html/class-vocab` at rule-load** (fluent-html's C-05 single source of truth, ~600 patterns). The hand table had already drifted: it was missing `shadowColor`/`fontFamily` prefix coverage and the `group`/`peer` markers, and suggested methods deleted in fluent-html v6 (`.position()`, `.display()`, `.flex1()`).

### 💥 Breaking

- **`fluent-html` >= 6.7.0 is now a peer dependency** (that release added the `values`/`doc` row enrichment the derivation reads). Only `no-known-modifiers-in-setclass` loads it — lazily, with a descriptive error if it's missing — so the other rules keep working without the peer.
- **Node >= 20.19 required** (`engines`): fluent-html ships ESM and the CJS rule loads it via `require(esm)`.
- **Autofix targets changed where the old table was wrong**: `absolute`/`relative`/… → `.absolute()`/`.relative()` (was dead `.position(...)`), display keywords → `.block()`/`.inlineBlock()`/… (was dead `.display(...)`), `flex-1` → `.flex("1")` (was dead `.flex1()`).

### ✨ Added

- Coverage the hand table never had, for free from the vocab: all v6 methods (`stroke-*` width/color split, `decoration-*` style/thickness/color split, `text-shadow-*`/`drop-shadow-*`/`inset-shadow-*` size/color splits, `snap-align-*`, `mask-*` composites, 3D transforms `rotate-x-*`/`scale-z-*`, grid lines `col-start-*`, gradient keyword exacts `bg-linear-to-*` vs angle `bg-linear-45`, `@container`, named `group/`/`peer/` markers, and every literals-list keyword as an exact match with its value in the message, e.g. `ease-out` → `.ease('out')`).
- Directional two-arg exact fixes (`overflow-x-auto` → `.overflow("x", "auto")`).
- Collision guards: a vocab row whose prefix is claimed twice without a residue entry, or two rows emitting the same exact class without a preference entry, throw at rule-load — new library releases can never silently mis-map.
- `test/derivation.test.js` — ordering invariants, drift pins, residue disambiguation, end-to-end autofix through the derived table.

## [1.9.0]

### Added

- **`prefer-foreach`** (recommended: warn, 🔧) — flags `.map()` used as element children and rewrites it to `ForEach`. Catches **both** the spread form `Div(...xs.map(Row))` and the array-child form `Div(xs.map(Row))` (neither of which `prefer-variadic-children` sees — that rule only matches a literal `[a, b]` array). Only `ForEach` carries the `count`/range overloads and the `ForEachKeyed` morph-stable upgrade path, so a raw `.map()` silently forfeits keyed reconciliation (focus/scroll on reorder). The fix drops the `...`, wraps the list (`Div(ForEach(xs, Row))`), and adds `ForEach` to the existing `fluent-html` import when missing. Report-only (no auto-fix) for the two behaviour-changing shapes: a callback that reads the 3rd `array` param (`ForEach` passes only `(item, index)`) and `.map(fn, thisArg)` (no `ForEach` slot for `thisArg`). Gated on the built-in element functions, so descriptor arrays (`f.select("role", OPTIONS.map(…))`), `.flatMap()`, and plain data transforms are never touched.

## [1.8.0]

### Added

- **`no-fluent-equivalent-in-setstyle`** (recommended: warn) — flags static CSS inside `.setStyle()`/`.setStyles()` that a fluent method already covers (`width:44px` → `.w("px", 44)`, `font-size:1.9rem` → `.textSize("rem", 1.9)`, plain hex colors → theme tokens). Interpolated and functional values (`linear-gradient()`, `rgba()`, `color-mix()`, `clamp()`, `calc()`, `var()`, `url()`) and properties with no fluent equivalent are never flagged — those remain the legitimate inline-style escape hatch. Takes `{ ignoredProperties }`; email views should disable it via a config override since email requires inline CSS.

### Changed

- **`prefer-set-method`** — maps three more attributes to their typed setters: `dirname`→`setDirname`, `formtarget`→`setFormtarget`, `formenctype`→`setFormenctype`.

## [1.7.0] - fluent-html v6

Aligns the plugin with the fluent-html v6 (greenfield) API surface.

### Added

- **`prefer-toggle`** (recommended: warn, 🔧) — boolean `addAttribute("disabled", …)` → `.toggle("disabled")`. Boolean attributes have no named setters in v6; they render bare via `.toggle()`.
- **`no-removed-v4-utilities`** (recommended: error) — flags Tailwind v3 utilities removed in v4: the `*-opacity-*` family (use the slash modifier) and cross-family gradient conflicts (`bg-gradient-*`/`bg-linear-*`/`bg-radial`/`bg-conic`).
- **`no-raw-icon-string`** (recommended: warn) — flags `Raw("<svg…>")` icon injection; use the typed SVG element builders (`Svg`/`Path`/`Circle`/`LinearGradient`/…).
- A complete **Rules** table in the README (all 22 rules, severities, accurate auto-fix markers).

### Changed

- **`prefer-set-method`** — dropped the removed boolean setters from its map; now also flags `addAttribute("aria-*"/"data-*"/"style"/"role"/"title"/"tabindex")`, and maps `crossorigin`→`setCrossOrigin` / `referrerpolicy`→`setReferrerPolicy` (+ `hreflang`/`inputmode`/`http-equiv`).
- **`prefer-form-for`** — its suggestion text now points to the `Form<T>` binding instead of the removed `formFor()` (the rule id is unchanged).
- The generated class vocabulary tracks the v6 method set (134 methods), including the position/display shortcuts, `flexShorthand`, and `htmxIndicator`.
- **`prefer-unit-overload`** — the CSS unit list (`px`/`rem`/`%`/`vh`/…) is now generated from the library's `UNITS` (via `VOCAB_UNITS` in `vocab.generated.ts`) and drift-guarded by `vocab-drift`, instead of being hardcoded in the rule.

### Fixed

- README: the `no-known-modifiers-in-setclass` pattern table suggested the removed `.position()`; now `.absolute()`/`.relative()`/`.fixed()`.
