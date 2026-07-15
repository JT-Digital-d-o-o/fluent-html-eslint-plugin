# Changelog

All notable changes to `eslint-plugin-fluent-html` are documented here.

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
