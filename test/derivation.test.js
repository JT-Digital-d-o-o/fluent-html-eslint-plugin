// Pins the vocab-derived fix tables (derive-fixable.ts): ordering invariants,
// the drift the old ~780-line hand table shipped (dead position/display/flex1
// methods), and the residue disambiguation (widths vs colors, text- family).
const assert = require("node:assert/strict");
const { RuleTester } = require("eslint");

const { getFixableTables } = require("../dist/derive-fixable");
const rule = require("../dist/rules/no-known-modifiers-in-setclass");

const { patterns, modifierMap } = getFixableTables();
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
check("flex-1 maps to .flex('1'), not dead .flex1()", () => {
  assert.deepEqual({ m: exact("flex-1")?.methodName, v: exact("flex-1")?.fixedValue }, { m: "flex", v: "1" });
});
check("shadow/font/group families are covered by the merged canonical methods", () => {
  assert.equal(prefix("shadow-")?.methodName, "shadow");
  assert.equal(exact("font-sans")?.methodName, "font");
  assert.equal(exact("group")?.methodName, "group");
  assert.equal(prefix("group/")?.methodName, "group");
});

// ── Canonical-names merges: one method per prefix, exacts keep fixedValue ──
check("merged width|color prefixes resolve to the one canonical method", () => {
  assert.equal(exact("ring-2")?.methodName, "ring");
  assert.equal(prefix("ring-")?.methodName, "ring");
  assert.equal(exact("stroke-2")?.methodName, "stroke");
  assert.equal(prefix("stroke-")?.methodName, "stroke");
  assert.equal(exact("text-shadow-md")?.methodName, "textShadow");
  assert.equal(prefix("text-shadow-")?.methodName, "textShadow");
});
check("font weights derive from the merged .font() weight group", () => {
  assert.deepEqual({ m: exact("font-bold")?.methodName, v: exact("font-bold")?.fixedValue }, { m: "font", v: "bold" });
  assert.equal(exact("font-semibold")?.methodName, "font");
});
check("directional shorthands own their prefixes (px-4 → .px(), not .p('x', …))", () => {
  assert.equal(prefix("px-")?.methodName, "px");
  assert.equal(prefix("mt-")?.methodName, "mt");
  assert.equal(prefix("p-")?.methodName, "p");
  assert.equal(prefix("m-")?.methodName, "m");
});
check("bg-linear keyword directions are exact; the rest is an angle — both .bgLinear()", () => {
  assert.deepEqual({ m: exact("bg-linear-to-br")?.methodName, v: exact("bg-linear-to-br")?.fixedValue }, { m: "bgLinear", v: "to-br" });
  assert.equal(prefix("bg-linear-")?.methodName, "bgLinear");
});
check("merged border/list/mask families fix to the canonical method", () => {
  assert.deepEqual({ m: exact("border-dashed")?.methodName, v: exact("border-dashed")?.fixedValue }, { m: "border", v: "dashed" });
  assert.equal(prefix("border-")?.methodName, "border");
  assert.deepEqual({ m: exact("list-disc")?.methodName, v: exact("list-disc")?.fixedValue }, { m: "list", v: "disc" });
  assert.deepEqual({ m: exact("mask-add")?.methodName, v: exact("mask-add")?.fixedValue }, { m: "mask", v: "add" });
  assert.deepEqual({ m: exact("outline-hidden")?.methodName, v: exact("outline-hidden")?.fixedValue }, { m: "outline", v: "hidden" });
});
check("modifier map renders two-arg exacts", () => {
  assert.equal(modifierMap["overflow-x-auto"], "overflow('x', 'auto')");
});

// ── End-to-end autofix through the rule ─────────────────────────────
const tester = new RuleTester({ parserOptions: { ecmaVersion: 2020, sourceType: "module" } });
check("autofixes through the derived table", () => {
  tester.run("derived-autofix", rule, {
    valid: [{ code: `Div().addClass("not-a-utility")` }],
    invalid: [
      { code: `Div().setClass("absolute")`, output: `Div().absolute()`, errors: 1 },
      { code: `Div().setClass("flex-1")`, output: `Div().flex("1")`, errors: 1 },
      { code: `Div().setClass("overflow-x-auto")`, output: `Div().overflow("x", "auto")`, errors: 1 },
      { code: `Div().setClass("text-white")`, output: `Div().text("white")`, errors: 1 },
      { code: `Div().setClass("stroke-red-500")`, output: `Div().stroke("red-500")`, errors: 1 },
      { code: `Div().setClass("decoration-wavy")`, output: `Div().decoration("wavy")`, errors: 1 },
      { code: `Div().setClass("translate-x-2")`, output: `Div().translate("x", "2")`, errors: 1 },
      { code: `Div().setClass("snap-align-none")`, output: `Div().snapAlign("none")`, errors: 1 },
      { code: `Div().setClass("scale-3d rotate-x-45")`, output: `Div().scale3d().rotateX("45")`, errors: 2 },
    ],
  });
});

if (process.exitCode) {
  console.log(`\n[derivation] ${checks} checks passed, some FAILED`);
} else {
  console.log(`[derivation] ✓ all ${checks} checks passed (${patterns.length} derived patterns)`);
}
