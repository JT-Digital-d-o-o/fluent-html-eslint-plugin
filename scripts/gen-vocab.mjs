// Generates src/vocab.generated.ts from fluent-html's class-vocab (C-05) — the
// single source of truth for the styling method↔class vocabulary. Run after the
// lib's vocabulary changes (`npm run gen:vocab`); pinned by test/vocab-drift.mjs.
//
// Reads the sibling lib's built output (../../fluent-html/dist). If the lib
// isn't present (standalone checkout), it keeps the committed generated file.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "vocab.generated.ts");

let classVocab;
try {
  ({ classVocab } = await import("../../fluent-html/dist/src/class-vocab/index.js"));
} catch (err) {
  console.warn(`[gen-vocab] fluent-html not found beside the plugin — keeping the committed src/vocab.generated.ts.\n  ${err.message}`);
  process.exit(0);
}

const methods = classVocab.map((d) => d.method).sort();
const unitMethods = classVocab
  .filter((d) => d.emit.kind === "sizing" || (d.emit.kind === "spacing" && d.emit.units))
  .map((d) => d.method)
  .sort();

const content = `// AUTO-GENERATED from fluent-html/class-vocab (C-05) by scripts/gen-vocab.mjs.
// Do NOT edit by hand — run \`npm run gen:vocab\`. Pinned by test/vocab-drift.mjs.
/* eslint-disable */

/** Every fluent styling method name (the C-05 class-vocab source of truth). */
export const VOCAB_METHODS: readonly string[] = ${JSON.stringify(methods)};

/** Methods supporting the \`(unit, amount)\` arbitrary-value overload. */
export const UNIT_METHODS: ReadonlySet<string> = new Set(${JSON.stringify(unitMethods)});

/** Methods that append classes (a later \`setClass\` would clobber them) — vocab + variant/callback methods. */
export const FLUENT_MODIFIERS: ReadonlySet<string> = new Set([
  ...VOCAB_METHODS,
  "on",
  "at",
  "addClass",
  "apply",
  "when",
]);
`;

writeFileSync(out, content);
console.log(`[gen-vocab] wrote ${methods.length} methods, ${unitMethods.length} unit methods → src/vocab.generated.ts`);
