// Pins the vocab-derived fix tables (derive-fixable.ts): ordering invariants,
// the drift the old ~780-line hand table shipped (dead position/display/flex1
// methods), and the residue disambiguation (widths vs colors, text- family).
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");

const { getFixableTables } = require("../dist/derive-fixable");
const rule = require("../dist/rules/no-known-modifiers-in-setclass");

const { patterns, modifierMap } = getFixableTables();

// 6.7.0 added `values` lists to vocab rows (exact per-value fix derivation).
// This branch pairs with 6.5.0 hosts, where those exacts don't exist — gate
// the values-derived expectations on what the installed peer provides.
const hasValues = require("fluent-html/class-vocab").classVocab.some((d) => d.values);
let checks = 0;
const check = (label, fn) => {
  try {
    fn();
    checks++;
  } catch (e) {
    console.error(`  ❌ ${label}: ${e.message}`);
    process.exitCode = 1;
  }
};

// ── Ordering invariants ─────────────────────────────────────────────
check("all exacts precede all prefixes", () => {
  const firstPrefix = patterns.findIndex((p) => !p.exactMatch);
  assert.ok(firstPrefix > 0);
  assert.ok(patterns.slice(firstPrefix).every((p) => !p.exactMatch));
});
check("prefixes are ordered longest-first", () => {
  const prefixes = patterns.filter((p) => !p.exactMatch);
  for (let i = 1; i < prefixes.length; i++) {
    assert.ok(prefixes[i - 1].pattern.length >= prefixes[i].pattern.length);
  }
});
check("no duplicate patterns within a kind", () => {
  for (const kind of [true, false]) {
    const keys = patterns.filter((p) => Boolean(p.exactMatch) === kind).map((p) => p.pattern);
    assert.equal(new Set(keys).size, keys.length);
  }
});

// ── Old-table drift is gone (dead methods → dedicated shortcuts) ────
const exact = (p) => patterns.find((x) => x.exactMatch && x.pattern === p);
const prefix = (p) => patterns.find((x) => !x.exactMatch && x.pattern === p);
check("position statics map to dedicated shortcuts, not .position()", () => {
  for (const cls of ["absolute", "relative", "fixed", "sticky", "static"]) {
    assert.equal(exact(cls)?.methodName, cls);
  }
});
check("display statics map to dedicated shortcuts, not .display()", () => {
  assert.equal(exact("block")?.methodName, "block");
  assert.equal(exact("inline-block")?.methodName, "inlineBlock");
  assert.equal(exact("inline-flex")?.methodName, "inlineFlex");
  assert.equal(exact("contents")?.methodName, "contents");
});
check("flex-1 maps to a real method, not dead .flex1()", () => {
  if (hasValues) {
    assert.deepEqual({ m: exact("flex-1")?.methodName, v: exact("flex-1")?.fixedValue }, { m: "flex", v: "1" });
  } else {
    assert.equal(prefix("flex-")?.methodName, "flexShorthand");
  }
});
check("previously missing methods are covered (shadowColor/fontFamily/group)", () => {
  assert.equal(prefix("shadow-")?.methodName, "shadowColor");
  assert.equal(exact("font-sans")?.methodName, "fontFamily");
  assert.equal(exact("group")?.methodName, "group");
  assert.equal(prefix("group/")?.methodName, "group");
});

// ── Residue disambiguation ──────────────────────────────────────────
check("width/size exacts carve out shared color prefixes", () => {
  assert.equal(exact("ring-2")?.methodName, "ring");
  assert.equal(prefix("ring-")?.methodName, "ringColor");
  assert.equal(exact("stroke-2")?.methodName, "strokeWidth");
  assert.equal(prefix("stroke-")?.methodName, "strokeColor");
  assert.equal(exact("text-shadow-md")?.methodName, "textShadow");
  assert.equal(prefix("text-shadow-")?.methodName, "textShadowColor");
});
check("font-bold prefers the dedicated .bold()", () => {
  assert.equal(exact("font-bold")?.methodName, "bold");
  if (hasValues) assert.equal(exact("font-semibold")?.methodName, "fontWeight");
});
check("bg-linear keyword directions are exact; the rest is an angle", () => {
  if (hasValues) {
    assert.deepEqual({ m: exact("bg-linear-to-br")?.methodName, v: exact("bg-linear-to-br")?.fixedValue }, { m: "gradientTo", v: "to-br" });
  }
  assert.equal(prefix("bg-linear-")?.methodName, "gradientLinear");
});
check("modifier map renders two-arg exacts", () => {
  if (!hasValues) return;
  assert.equal(modifierMap["overflow-x-auto"], "overflow('x', 'auto')");
});

// ── End-to-end autofix through the rule ─────────────────────────────
const tester = new RuleTester({ parserOptions: { ecmaVersion: 2020, sourceType: "module" } });
check("autofixes through the derived table", () => {
  tester.run("derived-autofix", rule, {
    valid: [{ code: `Div().addClass("not-a-utility")` }],
    invalid: [
      { code: `Div().setClass("absolute")`, output: `Div().absolute()`, errors: 1 },
      { code: `Div().setClass("flex-1")`, output: hasValues ? `Div().flex("1")` : `Div().flexShorthand("1")`, errors: 1 },
      { code: `Div().setClass("overflow-x-auto")`, output: `Div().overflow("x", "auto")`, errors: 1 },
      { code: `Div().setClass("text-white")`, output: `Div().textColor("white")`, errors: 1 },
      { code: `Div().setClass("stroke-red-500")`, output: `Div().strokeColor("red-500")`, errors: 1 },
      { code: `Div().setClass("translate-x-2")`, output: `Div().translate("x", "2")`, errors: 1 },
      { code: `Div().setClass("scale-3d rotate-x-45")`, output: `Div().scale3d().rotateX("45")`, errors: 2 },
      // values-derived exacts (6.7.0+ vocab only)
      ...(hasValues ? [
        { code: `Div().setClass("decoration-wavy")`, output: `Div().decorationStyle("wavy")`, errors: 1 },
        { code: `Div().setClass("snap-align-none")`, output: `Div().snapAlign("none")`, errors: 1 },
      ] : []),
    ],
  });
});

if (process.exitCode) {
  console.log(`\n[derivation] ${checks} checks passed, some FAILED`);
} else {
  console.log(`[derivation] ✓ all ${checks} checks passed (${patterns.length} derived patterns)`);
}
