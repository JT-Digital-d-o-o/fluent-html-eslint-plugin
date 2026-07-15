# eslint-plugin-fluent-html

ESLint plugin for [fluent-html](https://github.com/JT-Digital-d-o-o/fluent-html) that warns when `.setClass()` is used with Tailwind CSS classes that have dedicated fluent-styling methods.

## The Problem

When using fluent-html's fluent-styling API, calling `.setClass()` can override styles set by dedicated methods:

```typescript
// This is problematic:
Div()
  .background("green-700")  // Sets bg-green-700
  .padding("4")             // Sets p-4
  .setClass("bg-red-500")   // Overwrites everything! Only bg-red-500 remains
```

The `.setClass()` method **replaces** all classes, while dedicated methods like `.background()`, `.padding()`, etc., **append** classes safely.

## The Solution

This ESLint plugin warns you when `.setClass()` contains classes that have dedicated methods, and can **automatically fix** them:

```typescript
// ❌ Warning: Use .background() instead
Div().setClass("bg-red-500 p-4")

// ✅ Auto-fixed to:
Div().background("red-500").padding("4")

// ✅ Also correct: Use .addClass() for additional classes
Div()
  .background("red-500")
  .padding("4")
  .addClass("hover:bg-red-600")  // For pseudo-classes, this is fine
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
Div().background("red-500").padding("4").flex().justifyContent("center").alignItems("center").rounded("lg").shadow("md")
```

Mixed classes (some convertible, some not) are also handled:
```typescript
// Before
Div().setClass("bg-red-500 my-custom-class p-4")

// After --fix
Div().background("red-500").padding("4").setClass("my-custom-class")
```

## Installation

```bash
npm install --save-dev eslint-plugin-fluent-html
```

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
      "fluent-html/no-known-modifiers-in-setclass": "warn"
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
    "fluent-html/no-known-modifiers-in-setclass": "warn",
  },
};
```

## Rules

All rules are included in the `recommended` preset at the severity shown. 🔧 = auto-fixable.

| Rule | Recommended | What it does |
|------|:-----------:|--------------|
| `no-known-modifiers-in-setclass` 🔧 | warn | `.setClass()`/`.addClass()` with a Tailwind class that has a dedicated fluent method |
| `no-unnecessary-spaces-in-setclass` 🔧 | warn | Extra whitespace in a class string |
| `no-duplicate-classes-in-setclass` 🔧 | warn | A class repeated in the same `.setClass()` |
| `no-conflicting-classes-in-setclass` | warn | Mutually-exclusive classes in one `.setClass()` (incl. v4 gradient families) |
| `no-empty-setclass` 🔧 | warn | `.setClass("")` / no-op class calls |
| `no-multiple-setclass-in-chain` | error | More than one `.setClass()` in a chain (the later clobbers the earlier) |
| `no-setclass-after-fluent-modifier` | error | `.setClass()` after a fluent modifier (`.padding()`, `.on()`, …) silently drops it |
| `no-setclass-in-when-apply-callback` | error | `.setClass()` inside a `.when()`/`.apply()` callback |
| `prefer-variadic-children` 🔧 | warn | Pass children variadically, not as an array (`Div(a, b)`, not `Div([a, b])`) |
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

## Rule: `no-known-modifiers-in-setclass`

Warns when `.setClass()` is called with Tailwind classes that have dedicated fluent-styling methods. **This rule is auto-fixable.**

### Detected Patterns

The rule checks for these Tailwind class patterns and suggests alternatives:

| Pattern | Suggested Method |
|---------|-----------------|
| `p-*`, `px-*`, `py-*`, `pt-*`, etc. | `.padding()` |
| `m-*`, `mx-*`, `my-*`, `mt-*`, etc. | `.margin()` |
| `bg-*` | `.background()` |
| `text-red-*`, `text-blue-*`, etc. | `.textColor()` |
| `text-xl`, `text-2xl`, etc. | `.textSize()` |
| `text-center`, `text-left`, etc. | `.textAlign()` |
| `font-bold`, `font-semibold`, etc. | `.fontWeight()` |
| `w-*`, `h-*` | `.w()`, `.h()` |
| `max-w-*`, `min-w-*` | `.maxW()`, `.minW()` |
| `flex`, `flex-col`, `flex-row` | `.flex()`, `.flexDirection()` |
| `justify-*`, `items-*` | `.justifyContent()`, `.alignItems()` |
| `gap-*` | `.gap()` |
| `grid`, `grid-cols-*` | `.grid()`, `.gridCols()` |
| `border`, `border-*` | `.border()`, `.borderColor()` |
| `rounded`, `rounded-*` | `.rounded()` |
| `shadow`, `shadow-*` | `.shadow()` |
| `relative`, `absolute`, `fixed`, etc. | `.relative()`, `.absolute()`, `.fixed()` |
| `z-*`, `opacity-*`, `cursor-*` | `.zIndex()`, `.opacity()`, `.cursor()` |
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
Div().background("red-500")
Div().padding("4").margin("2")
Div().flex().justifyContent("center").alignItems("center")
Div().textSize("xl").fontWeight("bold").textAlign("center")

// Use .addClass() for classes without dedicated methods
Div()
  .background("red-500")
  .addClass("hover:bg-red-600 focus:ring-2")  // Pseudo-classes are fine

// Or use .setClass() for completely custom classes
Div().setClass("my-custom-class another-custom-class")
```

## When to Use `.setClass()` vs `.addClass()`

- **Use dedicated methods** (`.background()`, `.padding()`, etc.) for base styles
- **Use `.addClass()`** for:
  - Responsive variants: `md:w-1/2`, `lg:flex-row`
  - Pseudo-classes: `hover:bg-blue-600`, `focus:ring-2`
  - State variants: `active:scale-95`, `disabled:opacity-50`
  - Custom classes without dedicated methods
- **Use `.setClass()`** only when:
  - You need to completely replace all classes
  - You're using custom classes that don't conflict with fluent-styling methods

## Configuration

### Severity Levels

```javascript
// Error (blocks build)
"fluent-html/no-known-modifiers-in-setclass": "error"

// Warning (shows warning but doesn't block)
"fluent-html/no-known-modifiers-in-setclass": "warn"

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
