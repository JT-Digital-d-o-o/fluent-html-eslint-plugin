# Quick Start Guide

## Installation

1. Install the plugin in your project that uses fluent-html:

```bash
npm install --save-dev eslint-plugin-fluent-html
```

## Setup

### For ESLint 9+ (Flat Config)

Create or update `eslint.config.js`:

```javascript
import fluentHtml from "eslint-plugin-fluent-html";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "fluent-html": fluentHtml
    },
    rules: {
      "fluent-html/no-known-modifiers-in-setclass": "warn"
    }
  }
];
```

### For ESLint 8 and below (Legacy Config)

Create or update `.eslintrc.js`:

```javascript
module.exports = {
  plugins: ["fluent-html"],
  extends: ["plugin:fluent-html/recommended"],
};
```

Or just add the plugin without the preset:

```javascript
module.exports = {
  plugins: ["fluent-html"],
  rules: {
    "fluent-html/no-known-modifiers-in-setclass": "warn",
  },
};
```

## Running the Linter

Add to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix"
  }
}
```

Then run:

```bash
npm run lint
```

## What It Detects

The linter will warn you when you use `.setClass()` with Tailwind classes that have dedicated methods:

### Example Warning

```typescript
// This code:
Div().setClass("bg-red-500 p-4")

// Will produce:
// warning: Avoid using .setClass() with 'bg-red-500'. Use .background() instead
// warning: Avoid using .setClass() with 'p-4'. Use .padding() instead
```

### How to Fix

```typescript
// Change to:
Div()
  .background("red-500")
  .padding("4")
```

## IDE Integration

### VS Code

1. Install the ESLint extension
2. The plugin will automatically highlight issues in your editor
3. You'll see yellow squiggly lines under problematic `.setClass()` calls

### WebStorm / IntelliJ

1. Enable ESLint in Settings > Languages & Frameworks > JavaScript > Code Quality Tools > ESLint
2. Check "Automatic ESLint configuration"
3. Issues will appear as warnings in your editor

## Common Patterns

### ❌ Avoid

```typescript
// Don't use setClass with known modifiers
Div().setClass("flex justify-center items-center p-4 bg-white rounded-lg shadow")
```

### ✅ Prefer

```typescript
// Use dedicated methods
Div()
  .flex()
  .justifyContent("center")
  .alignItems("center")
  .padding("4")
  .background("white")
  .rounded("lg")
  .shadow()
```

### ✅ Also Good

```typescript
// Use addClass() for pseudo-classes and responsive modifiers
Div()
  .flex()
  .justifyContent("center")
  .padding("4")
  .background("white")
  .addClass("hover:bg-gray-50 md:p-6 lg:p-8")
```

## Adjusting Severity

You can change the rule severity in your ESLint config:

```javascript
{
  rules: {
    // Show as error (blocks build in CI)
    "fluent-html/no-known-modifiers-in-setclass": "error",

    // Show as warning (recommended)
    "fluent-html/no-known-modifiers-in-setclass": "warn",

    // Disable the rule
    "fluent-html/no-known-modifiers-in-setclass": "off"
  }
}
```

## Troubleshooting

### Plugin not found

Make sure you've installed it:
```bash
npm install --save-dev eslint-plugin-fluent-html
```

### Rules not working

1. Check that your ESLint config is being loaded
2. Make sure the plugin is listed in the `plugins` array
3. Restart your IDE/editor after installing the plugin

### False positives

If you genuinely need to use `.setClass()` with Tailwind utilities (e.g., in dynamic/computed classes), you can disable the rule for specific lines:

```typescript
// eslint-disable-next-line fluent-html/no-known-modifiers-in-setclass
Div().setClass(computedClasses)
```

Or for a whole file:

```typescript
/* eslint-disable fluent-html/no-known-modifiers-in-setclass */
```

## Benefits

1. **Prevents style overrides** - `.setClass()` replaces all classes; dedicated methods append them
2. **Type safety** - Methods are type-checked and autocompleted
3. **Readability** - `.background("red-500")` is clearer than `.setClass("bg-red-500")`
4. **Consistency** - Encourages using the SwiftUI-style API throughout your codebase

## Next Steps

- See [README.md](./README.md) for full documentation
- Check [example/](./example/) for code examples
- Read the [fluent-html SwiftUI styling guide](../AI-SWIFTUI-STYLING.md)
