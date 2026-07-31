# Changelog

All notable changes to `eslint-plugin-fluent-html` are documented here.

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
