// Drift guard: the generated vocab (src/vocab.generated.ts → dist) must match
// fluent-html/class-vocab (C-05). If the lib adds/removes a styling method or a
// unit overload, this fails until `npm run gen:vocab` is re-run. Skips cleanly
// when the lib isn't present beside the plugin (standalone checkout).
import assert from "node:assert/strict";

let classVocab;
try {
  ({ classVocab } = await import("../../fluent-html/dist/src/class-vocab/index.js"));
} catch {
  console.log("[vocab-drift] fluent-html not found beside the plugin — skipping drift check.");
  process.exit(0);
}

const { UNITS } = await import("../../fluent-html/dist/src/class-vocab/index.js");
const { VOCAB_METHODS, UNIT_METHODS, VOCAB_UNITS } = await import("../dist/vocab.generated.js");

const expectedMethods = classVocab.map((d) => d.method).sort();
const expectedUnits = classVocab
  .filter((d) => d.emit.kind === "sizing" || (d.emit.kind === "spacing" && d.emit.units))
  .map((d) => d.method)
  .sort();
const expectedUnitTokens = [...UNITS].sort();

assert.deepEqual(
  [...VOCAB_METHODS].sort(),
  expectedMethods,
  "VOCAB_METHODS drifted from fluent-html/class-vocab — run `npm run gen:vocab`",
);
assert.deepEqual(
  [...UNIT_METHODS].sort(),
  expectedUnits,
  "UNIT_METHODS drifted from fluent-html/class-vocab — run `npm run gen:vocab`",
);
assert.deepEqual(
  [...VOCAB_UNITS].sort(),
  expectedUnitTokens,
  "VOCAB_UNITS drifted from fluent-html UNITS — run `npm run gen:vocab`",
);

console.log(`[vocab-drift] ✓ ${expectedMethods.length} methods, ${expectedUnits.length} unit methods, ${expectedUnitTokens.length} units in sync with fluent-html/class-vocab`);
