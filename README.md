# eslint-plugin-fluent-html

ESLint plugin for [fluent-html](https://github.com/JT-Digital-d-o-o/fluent-html) that blocks Tailwind-in-raw-class-string styling and autofixes it to the typed fluent surface.

## The Problem

When using fluent-html's fluent-styling API, calling `.setClass()` can override styles set by dedicated methods:

```typescript
// This is problematic:
Div()
  .bg("green-700")          // Sets bg-green-700
  .p("4")                   // Sets p-4
  .setClass("bg-red-500")   // Overwrites everything! Only bg-red-500 remains
```

The `.setClass()` method **replaces** all classes, while dedicated methods like `.bg()`, `.p()`, etc., **append** classes safely.

## The Solution

This ESLint plugin warns you when raw class strings carry Tailwind utilities that have dedicated methods, and can **automatically fix** them:

```typescript
// ❌ Error: Tailwind utilities in a raw class string
Div().setClass("bg-red-500 p-4")

// ✅ Auto-fixed to:
Div().bg("red-500").p("4")

// ✅ Variants use .on()/.at() — never raw "hover:…"/"md:…" strings
Div()
  .bg("red-500")
  .p("4")
  .on("hover", t => t.bg("red-600"))
```

### Auto-Fix

Run ESLint with `--fix` to automatically convert `.setClass()` calls to fluent-styling methods:

```bash
# Fix all files
npx eslint --fix src/

# Preview fixes without applying
npx eslint src/
```

**Before:**
```typescript
Div().setClass("bg-red-500 p-4 flex justify-center items-center rounded-lg shadow-md")
```

**After `--fix`:**
```typescript
Div().bg("red-500").p("4").flex().justify("center").items("center").rounded("lg").shadow("md")
```

Mixed classes (some convertible, some not) are also handled:
```typescript
// Before
Div().setClass("bg-red-500 my-custom-class p-4")

// After --fix
Div().bg("red-500").p("4").setClass("my-custom-class")
```

## Installation

```bash
npm install --save-dev eslint-plugin-fluent-html
```

Since v2.0.0 the plugin declares `fluent-html` (>= 6.7.0) as a **peer dependency**: the raw-class fix tables (`no-tailwind-in-raw-class`, and the deprecated `no-known-modifiers-in-setclass`) are derived from `fluent-html/class-vocab` at rule-load, so they can never drift from the library's actual styling vocabulary. Your app already depends on `fluent-html`, so normally there is nothing to install — but linting must run on **Node >= 20.19** (the lib ships ESM; the plugin loads it via `require(esm)`). Only those rules need the peer; every other rule works without it.

## Usage

### Flat Config (ESLint 9+)

```javascript
// eslint.config.js
import fluentHtml from "eslint-plugin-fluent-html";

export default [
  {
    plugins: {
      "fluent-html": fluentHtml
    },
    rules: {
      "fluent-html/no-tailwind-in-raw-class": "error"
    }
  }
];
```

### Legacy Config (ESLint 8 and below)

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["fluent-html"],
  extends: ["plugin:fluent-html/recommended"],
};
```

Or configure manually:

```javascript
// .eslintrc.js
module.exports = {
  plugins: ["fluent-html"],
  rules: {
    "fluent-html/no-tailwind-in-raw-class": "error",
  },
};
```

## Rules

All rules are included in the `recommended` preset at the severity shown. 🔧 = auto-fixable.

| Rule | Recommended | What it does |
|------|:-----------:|--------------|
| `no-tailwind-in-raw-class` 🔧 | error | **(v3)** Tailwind utilities in `.addClass()`/`.setClass()`/`.setClasses()` literals — prefix-anchored against the derived vocab tables + the generated Tailwind root list; autofixes to the fluent chain incl. `.on()`/`.at()` wrappers for variant tokens |
| `no-dynamic-class-argument` | error | **(v3)** Non-literal arg to `.addClass()`/`.setClass()`/`.cssClass()` — invisible to the safelist extractor; routes to `.when()`/`Match` literal branches or `staticManifest` |
| `no-tailwind-in-cssclass` 🔧 | error | **(v3)** Tailwind-shaped token inside `.cssClass()` (the non-Tailwind intent marker) — keeps the sanctioned hatch clean |
| `no-known-modifiers-in-setclass` 🔧 | — | **Deprecated** — superseded by `no-tailwind-in-raw-class`; no longer in the recommended preset |
| `no-unnecessary-spaces-in-setclass` 🔧 | warn | Extra whitespace in a class string |
| `no-duplicate-classes-in-setclass` 🔧 | warn | A class repeated in the same `.setClass()` |
| `no-conflicting-classes-in-setclass` | warn | Mutually-exclusive classes in one `.setClass()` (incl. v4 gradient families) |
| `no-empty-setclass` 🔧 | warn | `.setClass("")` / no-op class calls |
| `no-multiple-setclass-in-chain` | error | More than one `.setClass()` in a chain (the later clobbers the earlier) |
| `no-setclass-after-fluent-modifier` | error | `.setClass()` after a fluent modifier (`.p()`, `.on()`, …) silently drops it |
| `no-setclass-in-when-apply-callback` | error | `.setClass()` inside a `.when()`/`.apply()` callback |
| `prefer-variadic-children` 🔧 | warn | Pass children variadically, not as an array (`Div(a, b)`, not `Div([a, b])`) |
| `prefer-foreach` 🔧 | warn | `.map()` as element children → `ForEach` (`Div(...xs.map(Row))` / `Div(xs.map(Row))` → `Div(ForEach(xs, Row))`) |
| `no-conditional-in-setclass` | warn | Ternaries/conditionals embedded in a class string |
| `no-innerhtml-swap` 🔧 | error | `innerHTML`/`outerHTML` swaps — prefer `outerMorph` |
| `prefer-set-method` 🔧 | warn | `addAttribute("type", …)` → `.setType(…)`; flags `aria-*`/`data-*`/`style`/`role`/`title`/`tabindex` |
| `prefer-toggle` 🔧 | warn | **(v6)** boolean `addAttribute("disabled", …)` → `.toggle("disabled")` |
| `no-raw-ids` | warn | Hardcoded id strings — use `defineIds`/`createId` |
| `no-ternary-in-view-builder` | warn | Ternaries in view builders — prefer `IfThenElse`/`Match` |
| `no-superfluous-view-return-type` 🔧 | warn | Redundant `: View` return annotations |
| `anchor-requires-cursor-pointer` 🔧 | warn | `A().setHtmx(...)` needs `.cursor("pointer")` |
| `prefer-unit-overload` 🔧 | warn | `.w("[180px]")` → `.w("px", 180)` |
| `prefer-htmx-api` | warn | Raw `hx-*` attributes → the typed HTMX API |
| `prefer-form-for` | warn | Untyped form fields → the typed `Form<T>` binding |
| `no-removed-v4-utilities` | error | **(v6)** Tailwind v3 utilities removed in v4 (`*-opacity-*`, `bg-gradient-*`, …) |
| `no-raw-icon-string` | warn | **(v6)** `Raw("<svg…>")` icon injection → the typed SVG builders |
| `no-fluent-equivalent-in-setstyle` | warn | Static CSS in `setStyle`/`setStyles` that a fluent method already covers (`width:44px` → `.w("px", 44)`) |

## Rule set: escape-hatch closure (v3)

Three error-level rules close the raw-class-string hole around the typed styling surface. Every dead end states its fix inline:

```
'grid-cols-1 sm:grid-cols-2' in .addClass() bypasses the typed surface.
Replace with: .gridCols("1").at("sm", t => t.gridCols("2")). [autofix]

.addClass(colors) is invisible to the safelist extractor — styles can silently
disappear in production. Use .when(...) / Match(...) with literal classes per
branch, or defineTheme's staticManifest for token-driven values.
```

- **`no-tailwind-in-raw-class`** — flags a token when the derived fix table maps it, when it carries a known variant head (`hover:`, `sm:`, `[&>li]:`, …), or when it is Tailwind-shaped **and** its root is in the generated Tailwind root list (from the lib's pinned Tailwind design system). Matching is prefix-anchored, never a bare shape regex — `sidebar-backdrop`, `entry-row`, `hamburger-line` are never flagged. When every flagged token is mappable the whole call autofixes to the fluent chain, folding variant tokens into `.on()`/`.at()`.
- **`no-dynamic-class-argument`** — non-literal args to `addClass`/`setClass`/`cssClass` (variables, ternaries, interpolated templates) are errors: the extractor records literals only, so computed classes can vanish from the production safelist with zero build signal.
- **`no-tailwind-in-cssclass`** — `.cssClass()` (fluent-html ≥6.8.0) marks legitimately non-Tailwind classes; a Tailwind utility inside it is mis-filed and autofixes back to the typed surface.

## Rule: `no-known-modifiers-in-setclass` (deprecated)

Warns when `.setClass()` is called with Tailwind classes that have dedicated fluent-styling methods. **This rule is auto-fixable.**

### Detected Patterns

The fix tables are **derived from `fluent-html/class-vocab` at rule-load** (~1ms, once per lint run): closed keyword lists (`values.literals` rows) become exact matches through the row's own emit function, emit shapes become prefix patterns, and a small hand-kept residue disambiguates shared prefixes by value shape (`border-2` width vs `border-red-500` color, `text-center` alignment vs `text-white` color vs `text-sm` size). A new styling method in the library is picked up by the linter automatically on upgrade.

Representative examples of the ~600 derived patterns:

| Pattern | Suggested Method |
|---------|-----------------|
| `p-*` | `.p()` |
| `px-*`, `py-*`, `pt-*`, etc. | `.px()`, `.py()`, `.pt()`, … |
| `m-*` | `.m()` |
| `mx-*`, `my-*`, `mt-*`, etc. | `.mx()`, `.my()`, `.mt()`, … |
| `bg-*` | `.bg()` |
| `text-*` (color, size, alignment, wrap) | `.text()` |
| `font-bold`, `font-semibold`, `font-mono`, etc. | `.font()` |
| `w-*`, `h-*` | `.w()`, `.h()` |
| `max-w-*`, `min-w-*` | `.maxW()`, `.minW()` |
| `flex`, `flex-1`, `flex-col`, `flex-wrap` | `.flex()` |
| `justify-*`, `items-*` | `.justify()`, `.items()` |
| `gap-*` | `.gap()` |
| `grid`, `grid-cols-*` | `.grid()`, `.gridCols()` |
| `border`, `border-*` (width, style, color) | `.border()` |
| `rounded`, `rounded-*` | `.rounded()` |
| `shadow`, `shadow-*` | `.shadow()` |
| `relative`, `absolute`, `fixed`, etc. | `.relative()`, `.absolute()`, `.fixed()` |
| `z-*`, `opacity-*`, `cursor-*` | `.z()`, `.opacity()`, `.cursor()` |
| `overflow-*` | `.overflow()` |

### Examples

#### ❌ Incorrect

```typescript
// Will trigger warnings
Div().setClass("bg-red-500")
Div().setClass("p-4 m-2")
Div().setClass("flex justify-center items-center")
Div().setClass("text-xl font-bold text-center")
```

#### ✅ Correct

```typescript
// Use dedicated methods
Div().bg("red-500")
Div().p("4").m("2")
Div().flex().justify("center").items("center")
Div().text("xl").font("bold").text("center")

// Variants via .on()/.at() — the autofix folds "hover:bg-red-600" into this form
Div()
  .bg("red-500")
  .on("hover", t => t.bg("red-600"))
  .on("focus", t => t.ring("2"))

// Non-Tailwind classes (JS hooks, third-party widgets) use the intent marker
Div().cssClass("js-map-container")
```

## Escape hatches — where each raw need goes

- **Base styles** → dedicated methods (`.bg()`, `.p()`, …); **variants** → `.on()` / `.at()`
- **Arbitrary value of a covered utility** → bracket arm or unit overload: `.text("[13px]")`, `.w("px", 180)`
- **CSS property with no Tailwind utility** → `.cssProp("mask-repeat", "no-repeat")`
- **Legit non-Tailwind class** → `.cssClass("js-hook")` (`no-tailwind-in-cssclass` guards against mis-filed utilities)
- **Runtime-computed style value** → `.setStyle(...)`

Raw Tailwind in `.setClass()`/`.addClass()`/`.cssClass()` is an **error** under the recommended preset (`no-tailwind-in-raw-class`), and non-literal class arguments are blocked by `no-dynamic-class-argument`.

## Configuration

### Severity Levels

```javascript
// Error (blocks build)
"fluent-html/no-tailwind-in-raw-class": "error"

// Warning (shows warning but doesn't block)
"fluent-html/no-tailwind-in-raw-class": "warn"

// Disabled
"fluent-html/no-known-modifiers-in-setclass": "off"
```

## Rule: `no-fluent-equivalent-in-setstyle`

Flags static CSS declarations inside `.setStyle("…")` / `.setStyles({…})` that the fluent API already expresses — inline styles are reserved for CSS with no fluent or token equivalent.

**Flagged:** static sizing/spacing/position (`width`, `height`, `min/max-*`, `top/right/bottom/left`, `inset`, `gap`, `margin`, `padding`), typography (`font-size`, `line-height`, `letter-spacing`, `font-weight`, `text-align`, `white-space`), `border-radius`, `z-index`, `opacity`, `cursor`, `overflow`, `display`/`position` keywords, and plain colors (hex / `white` / `black` / `transparent`) on `color`/`background`/`background-color`/`border-color`.

**Never flagged (the legitimate escape hatch):**
- Interpolated values — `` setStyle(`width: ${progress}%`) ``; in a mixed template literal only the declarations touching an expression are skipped, static ones are still checked
- Functional values (anything containing `(`) — `linear-gradient()`, `rgba()`, `color-mix()`, `clamp()`, `calc()`, `var()`, `url()`
- Properties with no fluent equivalent — `aspect-ratio`, `backdrop-filter`, …

**Options:** `{ ignoredProperties: ["width", …] }` skips the listed CSS properties.

Email views should disable the rule wholesale via a config override (`files: ["src/infra/email/**"]`) — email clients require inline CSS, so `setStyles` is correct there.

## License

ISC
