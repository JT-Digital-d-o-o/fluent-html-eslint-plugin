// Harness for the plugin's type-aware rules: a fixture tsconfig gives the
// parser a real TypeScript program, so the rule can resolve discriminant
// unions through the checker. Syntactic rules stay in rule.test.js.

const path = require("path");
const { RuleTester } = require("eslint");

const matchSubsetDefault = require("../dist/rules/match-subset-default");

const fixtures = path.join(__dirname, "fixtures", "type-aware");
const filename = path.join(fixtures, "file.ts");

const typedTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    tsconfigRootDir: fixtures,
    project: "./tsconfig.json",
    warnOnUnsupportedTypeScriptVersion: false,
  },
});

const untypedTester = new RuleTester({ parserOptions: { ecmaVersion: 2020, sourceType: "module" } });

let passCount = 0;
let failCount = 0;

function runSuite(name, tester, rule, tests) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(name);
  console.log("=".repeat(50));
  try {
    tester.run(name, rule, tests);
    const total = tests.valid.length + tests.invalid.length;
    passCount += total;
    console.log(`  ✅ ${total} cases passed`);
  } catch (e) {
    failCount++;
    console.log(`  ❌ FAILED: ${e.message}`);
  }
}

const MATCH_VALUE_FORM = `declare function Match(v: unknown, cases: unknown, def?: unknown): unknown;\n`;
const MATCH_KEY_FORM = `declare function Match(v: unknown, key: string, cases: unknown, def?: unknown): unknown;\n`;
const TAG = `declare const tag: { whenMatch(v: unknown, cases: unknown, def?: unknown): unknown };\n`;

runSuite("match-subset-default", typedTester, matchSubsetDefault, {
  valid: [
    // Exhaustive without a default — the doctrine shape
    {
      filename,
      code: `${MATCH_VALUE_FORM}type S = "a" | "b"; declare const s: S;\nMatch(s, { a: 1, b: 2 });`,
    },
    // Subset without a default (TS enforces exhaustiveness there)
    {
      filename,
      code: `${MATCH_VALUE_FORM}type S = "a" | "b"; declare const s: S;\nMatch(s, { a: 1 });`,
    },
    // Open number bails — the template's whenMatch(i % 5, …) shape
    {
      filename,
      code: `${TAG}declare const i: number;\ntag.whenMatch(i % 5, { 0: 1, 1: 2 }, 3);`,
    },
    // Open string bails
    {
      filename,
      code: `${MATCH_VALUE_FORM}declare const s: string;\nMatch(s, { a: 1 }, 2);`,
    },
    // Union with a non-literal member bails
    {
      filename,
      code: `${MATCH_VALUE_FORM}type S = "a" | "b" | number; declare const s: S;\nMatch(s, { a: 1 }, 2);`,
    },
    // Type-parameter discriminant bails — the flow type at the reference is
    // the constraint union, so the bail inspects the declared symbol type
    {
      filename,
      code: `${MATCH_VALUE_FORM}function f<T extends "a" | "b">(s: T) { return Match(s, { a: 1 }, 2); }`,
    },
    // Boolean union bails (IfThenElse territory)
    {
      filename,
      code: `${MATCH_VALUE_FORM}declare const b: boolean;\nMatch(b, { true: 1 }, 2);`,
    },
    // Computed key bails
    {
      filename,
      code: `${MATCH_VALUE_FORM}type S = "a" | "b" | "c"; declare const s: S; declare const k: "a";\nMatch(s, { [k]: 1 }, 2);`,
    },
    // Spread in cases bails
    {
      filename,
      code: `${MATCH_VALUE_FORM}type S = "a" | "b" | "c"; declare const s: S; declare const rest: object;\nMatch(s, { a: 1, ...rest }, 2);`,
    },
    // Key form whose key is missing on the object bails
    {
      filename,
      code: `${MATCH_KEY_FORM}type St = { status: "a" } | { status: "b" }; declare const st: St;\nMatch(st, "missing", { a: 1 }, 2);`,
    },
  ],
  invalid: [
    // Value form over a literal union, strict subset
    {
      filename,
      code: `${MATCH_VALUE_FORM}type Trend = "up" | "down" | "flat"; declare const trend: Trend;\nMatch(trend, { up: 1, down: 2 }, 3);`,
      errors: [{ messageId: "subsetDefault" }],
    },
    // Key form over a discriminated union
    {
      filename,
      code: `${MATCH_KEY_FORM}type State = { status: "loading" } | { status: "error"; message: string } | { status: "success" }; declare const st: State;\nMatch(st, "status", { loading: 1, error: 2 }, 3);`,
      errors: [{ messageId: "subsetDefault" }],
    },
    // Numeric enum — missing members reported by NAME, not value
    {
      filename,
      code: `${MATCH_VALUE_FORM}enum PaymentStatus { PENDING, COMPLETED, FAILED, REFUNDED, PARTIALLY_REFUNDED, CANCELLED } declare const p: PaymentStatus;\nMatch(p, { 1: "done", 2: "failed" }, "waiting");`,
      errors: [{
        messageId: "subsetDefault",
        data: { callee: "Match", typeName: "PaymentStatus", missing: "PENDING, REFUNDED, PARTIALLY_REFUNDED, CANCELLED" },
      }],
    },
    // String enum (the Prisma shape)
    {
      filename,
      code: `${MATCH_VALUE_FORM}enum Status { ACTIVE = "ACTIVE", CLOSED = "CLOSED", PENDING = "PENDING" } declare const s: Status;\nMatch(s, { ACTIVE: 1 }, 2);`,
      errors: [{
        messageId: "subsetDefault",
        data: { callee: "Match", typeName: "Status", missing: "CLOSED, PENDING" },
      }],
    },
    // whenMatch carries the identical hazard
    {
      filename,
      code: `${TAG}type S = "a" | "b" | "c"; declare const s: S;\ntag.whenMatch(s, { a: 1 }, 2);`,
      errors: [{ messageId: "subsetDefault" }],
    },
    // Full coverage + default = unreachable default
    {
      filename,
      code: `${MATCH_VALUE_FORM}type S = "a" | "b"; declare const s: S;\nMatch(s, { a: 1, b: 2 }, 3);`,
      errors: [{ messageId: "unreachableDefault" }],
    },
  ],
});

// Graceful no-op without a TypeScript program: same shapes, default parser,
// zero reports and zero crashes.
runSuite("match-subset-default (no parserServices — no-op)", untypedTester, matchSubsetDefault, {
  valid: [
    { code: `Match(trend, { up: () => 1, down: () => 2 }, () => 3)` },
    { code: `tag.whenMatch(s, { a: 1 }, 2)` },
    { code: `Match(st, "status", { loading: 1 }, 2)` },
  ],
  invalid: [],
});

console.log(`\n${"=".repeat(50)}`);
console.log("TYPE-AWARE TEST SUMMARY");
console.log("=".repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log("=".repeat(50));

if (failCount > 0) process.exit(1);
