// Derives the auto-fix tables for no-known-modifiers-in-setclass from
// fluent-html's class-vocab (C-05) at rule-load, replacing the ~780-line hand
// table that had already drifted (missing shadowColor/fontFamily/group, dead
// position/display/flex1 methods). fluent-html is a peerDependency; the vocab
// is loaded via require() — Node's require(esm) (>= 20.19 / 22.12) since the
// lib ships ESM.
//
// Derivation rules:
//  - `values.literals` rows → one EXACT pattern per member (via the row's own
//    emit fn, so e.g. snapAlign "none" → `snap-align-none`); spacing rows also
//    get x/y directional exacts.
//  - `static` rows → exact patterns; `optional` rows → a bare exact.
//  - every non-custom row → a prefix pattern, UNLESS the prefix is claimed by
//    more than one row or listed in the residue — then RESIDUE_PREFIX_OWNERS
//    must name the catch-all owner (or null for exacts-only). An unresolved
//    collision throws, so a new vocab row can never silently mis-map.
//  - custom-shape rows (border, rounded, translate, gradients, …) and
//    value-shape disambiguation (widths vs colors on a shared prefix) live in
//    the hand-kept residue tables below.
//
// Ordering invariant consumed by the matcher: ALL exacts first, then prefixes
// longest-first — an exact can never be shadowed by a shorter prefix.

// Type-only import — erased at compile time, so no ESM-from-CJS import remains
// (runtime loading happens via require(esm) in loadClassVocab below).
import type { UtilityDef } from "fluent-html/class-vocab" with { "resolution-mode": "import" };

// Configuration for auto-fixable patterns
export interface FixablePattern {
  // The prefix or exact string to match
  pattern: string;
  // The method name to use
  methodName: string;
  // If true, pattern is an exact match (no value extraction)
  exactMatch?: boolean;
  // For exact matches, the value to pass (if any)
  fixedValue?: string;
  // For directional patterns (e.g., padding('x', value)); with fixedValue,
  // the fix is the two-arg call `.method("dir", "value")`
  direction?: string;
}

// ── Disambiguation residue (hand-kept) ──────────────────────────────

/**
 * Same emitted class claimed by two vocab rows — the dedicated shortcut wins
 * (`font-bold` is both `bold()` and `fontWeight("bold")`).
 */
const PREFERRED_EXACTS: Readonly<Record<string, { methodName: string; fixedValue?: string }>> = {
  "font-bold": { methodName: "bold" },
};

/**
 * Catch-all owner for a class prefix claimed by more than one vocab row (or by
 * custom rows the derivation cannot see). Applied AFTER every exact, so the
 * residue exacts below carve out widths/sizes first. `null` = exacts only.
 */
const RESIDUE_PREFIX_OWNERS: Readonly<Record<string, string | null>> = {
  "text-": "textColor",           // alignment/wrap/size exacts first; colors are the long tail
  "font-": "fontFamily",          // weight exacts first; custom font tokens are families
  "flex-": "flexShorthand",       // direction/wrap/keyword exacts first; flex-2 etc. remain
  "border-": "borderColor",       // width/side/style exacts first
  "ring-": "ringColor",           // width exacts first
  "shadow-": "shadowColor",       // size exacts first
  "list-": null,                  // type/position literals cover everything
  "transition-": "transition",    // behavior literals (normal/discrete) exact first
  "decoration-": "decorationColor", // style literals + thickness exacts first
  "text-shadow-": "textShadowColor",
  "drop-shadow-": "dropShadowColor",
  "inset-shadow-": "insetShadowColor",
  "inset-ring-": "insetRingColor",
  "stroke-": "strokeColor",       // stroke-0/1/2 width exacts first
  "snap-": null,                  // axis/strictness args don't fit value extraction
};

/** Exact patterns the derivation cannot see (custom rows, width-vs-color carve-outs). */
const RESIDUE_EXACTS: readonly FixablePattern[] = [
  // border (custom row): bare, widths, sides
  { pattern: "border", methodName: "border", exactMatch: true },
  ...["0", "2", "4", "8"].map((v) => ({ pattern: `border-${v}`, methodName: "border", exactMatch: true, fixedValue: v })),
  ...["t", "b", "l", "r", "x", "y"].map((v) => ({ pattern: `border-${v}`, methodName: "border", exactMatch: true, fixedValue: v })),
  // rounded (custom row): bare (sizes/corners flow through the prefix residue)
  { pattern: "rounded", methodName: "rounded", exactMatch: true },
  // widths on shared color prefixes
  ...["0", "1", "2", "3", "4", "8"].map((v) => ({ pattern: `ring-${v}`, methodName: "ring", exactMatch: true, fixedValue: v })),
  ...["0", "1", "2", "4", "8"].map((v) => ({ pattern: `inset-ring-${v}`, methodName: "insetRing", exactMatch: true, fixedValue: v })),
  ...["0", "1", "2"].map((v) => ({ pattern: `stroke-${v}`, methodName: "strokeWidth", exactMatch: true, fixedValue: v })),
  ...["0", "1", "2", "4", "8", "auto", "from-font"].map((v) => ({ pattern: `decoration-${v}`, methodName: "decorationThickness", exactMatch: true, fixedValue: v })),
  // sizes on shared color prefixes (theme-ns families — not literals rows)
  ...["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "inner", "none"].map((v) => ({ pattern: `shadow-${v}`, methodName: "shadow", exactMatch: true, fixedValue: v })),
  ...["2xs", "xs", "sm", "md", "lg", "none"].map((v) => ({ pattern: `text-shadow-${v}`, methodName: "textShadow", exactMatch: true, fixedValue: v })),
  ...["xs", "sm", "md", "lg", "xl", "2xl", "none"].map((v) => ({ pattern: `drop-shadow-${v}`, methodName: "dropShadow", exactMatch: true, fixedValue: v })),
  ...["2xs", "xs", "sm", "none"].map((v) => ({ pattern: `inset-shadow-${v}`, methodName: "insetShadow", exactMatch: true, fixedValue: v })),
  // text sizes (theme-ns --text)
  ...["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"].map((v) => ({ pattern: `text-${v}`, methodName: "textSize", exactMatch: true, fixedValue: v })),
  // font families (theme-ns --font)
  ...["sans", "serif", "mono"].map((v) => ({ pattern: `font-${v}`, methodName: "fontFamily", exactMatch: true, fixedValue: v })),
  // bare radial/conic gradients (custom rows)
  { pattern: "bg-radial", methodName: "gradientRadial", exactMatch: true },
  { pattern: "bg-conic", methodName: "gradientConic", exactMatch: true },
  // v3 legacy spellings — still worth an autofix to the v4 method
  { pattern: "flex-shrink-0", methodName: "shrink", exactMatch: true, fixedValue: "0" },
  { pattern: "flex-shrink", methodName: "shrink", exactMatch: true },
  { pattern: "flex-grow-0", methodName: "grow", exactMatch: true, fixedValue: "0" },
  { pattern: "flex-grow", methodName: "grow", exactMatch: true },
];

/** Prefix patterns the derivation cannot see (custom rows + legacy). */
const RESIDUE_PREFIXES: readonly FixablePattern[] = [
  { pattern: "rounded-", methodName: "rounded" },
  { pattern: "from-", methodName: "from" },
  { pattern: "via-", methodName: "via" },
  { pattern: "to-", methodName: "to" },
  // bg-linear-to-* keyword exacts derive from gradientTo's literals; what
  // remains under bg-linear- is an angle. bg-gradient- is the v3 spelling.
  { pattern: "bg-linear-", methodName: "gradientLinear" },
  { pattern: "bg-gradient-", methodName: "gradientTo" },
  { pattern: "translate-x-", methodName: "translate", direction: "x" },
  { pattern: "translate-y-", methodName: "translate", direction: "y" },
  { pattern: "rotate-x-", methodName: "rotateX" },
  { pattern: "rotate-y-", methodName: "rotateY" },
  { pattern: "rotate-z-", methodName: "rotateZ" },
  { pattern: "rotate-", methodName: "rotate" },
  { pattern: "scale-x-", methodName: "scaleX" },
  { pattern: "scale-y-", methodName: "scaleY" },
  { pattern: "scale-z-", methodName: "scaleZ" },
  { pattern: "skew-x-", methodName: "skewX" },
  { pattern: "skew-y-", methodName: "skewY" },
  { pattern: "col-start-", methodName: "colStart" },
  { pattern: "col-end-", methodName: "colEnd" },
  { pattern: "row-start-", methodName: "rowStart" },
  { pattern: "row-end-", methodName: "rowEnd" },
];

// ── Vocab loading (peer dependency, require(esm)) ───────────────────

type ClassVocabModule = {
  classVocab: readonly UtilityDef[];
  emitClasses: (shape: UtilityDef["emit"], args?: readonly string[]) => string[];
};

function loadClassVocab(): ClassVocabModule {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("fluent-html/class-vocab") as ClassVocabModule;
  } catch (cause) {
    throw new Error(
      "eslint-plugin-fluent-html: the no-known-modifiers-in-setclass rule derives its fix tables from " +
        "fluent-html/class-vocab and needs the `fluent-html` peer dependency (>= 6.7.0) installed, on a Node " +
        `version with require(esm) support (>= 20.19 / 22.12). Underlying error: ${String(cause)}`,
    );
  }
}

// ── Derivation ──────────────────────────────────────────────────────

/** Directions a spacing-shape row accepts (abbreviated rows take sides, others axes). */
function spacingDirs(abbrev: boolean): readonly string[] {
  return abbrev ? ["x", "y", "t", "b", "l", "r"] : ["x", "y"];
}

function deriveExacts(vocab: ClassVocabModule): FixablePattern[] {
  const out = new Map<string, FixablePattern>();
  const claim = (p: FixablePattern): void => {
    const preferred = PREFERRED_EXACTS[p.pattern];
    if (preferred) {
      out.set(p.pattern, { pattern: p.pattern, exactMatch: true, ...preferred });
      return;
    }
    const existing = out.get(p.pattern);
    if (existing && existing.methodName !== p.methodName) {
      throw new Error(
        `eslint-plugin-fluent-html: exact pattern "${p.pattern}" is claimed by both ` +
          `${existing.methodName} and ${p.methodName} — add a PREFERRED_EXACTS entry`,
      );
    }
    if (!existing) out.set(p.pattern, p);
  };

  for (const def of vocab.classVocab) {
    const { emit } = def;
    if (emit.kind === "static") {
      claim({ pattern: emit.class, methodName: def.method, exactMatch: true });
      continue;
    }
    if (emit.kind === "optional") {
      claim({ pattern: emit.prefix, methodName: def.method, exactMatch: true });
    }
    if (def.values?.kind !== "literals") continue;
    for (const member of def.values.list) {
      for (const cls of vocab.emitClasses(emit, [member])) {
        claim({ pattern: cls, methodName: def.method, exactMatch: true, fixedValue: member });
      }
      if (emit.kind === "spacing") {
        for (const dir of spacingDirs(emit.abbrev)) {
          for (const cls of vocab.emitClasses(emit, [dir, member])) {
            claim({ pattern: cls, methodName: def.method, exactMatch: true, direction: dir, fixedValue: member });
          }
        }
      }
    }
  }
  for (const p of RESIDUE_EXACTS) claim(p);
  return [...out.values()];
}

function derivePrefixes(vocab: ClassVocabModule): FixablePattern[] {
  // pattern → methods claiming it (custom/value shapes have no derivable prefix)
  const claims = new Map<string, { methodName: string; direction?: string }[]>();
  const claim = (pattern: string, methodName: string, direction?: string): void => {
    const list = claims.get(pattern) ?? [];
    list.push({ methodName, direction });
    claims.set(pattern, list);
  };

  for (const def of vocab.classVocab) {
    const { emit } = def;
    switch (emit.kind) {
      case "prefix":
      case "sizing":
        claim(`${emit.prefix}-`, def.method);
        break;
      case "optional":
        claim(`${emit.prefix}${emit.sep ?? "-"}`, def.method);
        break;
      case "spacing":
        claim(`${emit.prefix}-`, def.method);
        for (const dir of spacingDirs(emit.abbrev)) {
          claim(`${emit.prefix}${emit.sep}${dir}-`, def.method, dir);
        }
        break;
      case "static":
      case "value":
      case "custom":
        break;
    }
  }

  const out: FixablePattern[] = [];
  const residuePatterns = new Set(RESIDUE_PREFIXES.map((p) => p.pattern));
  for (const [pattern, owners] of claims) {
    const residueOwner = RESIDUE_PREFIX_OWNERS[pattern];
    if (residueOwner !== undefined) {
      if (residueOwner !== null) out.push({ pattern, methodName: residueOwner });
      continue;
    }
    if (residuePatterns.has(pattern)) continue; // hand residue wins (e.g. rotate-)
    const methods = [...new Set(owners.map((o) => o.methodName))];
    if (methods.length > 1) {
      throw new Error(
        `eslint-plugin-fluent-html: class prefix "${pattern}" is claimed by ${methods.join(", ")} — ` +
          "add a RESIDUE_PREFIX_OWNERS entry naming the catch-all owner (or null for exacts-only)",
      );
    }
    const first = owners[0]!;
    out.push(first.direction ? { pattern, methodName: first.methodName, direction: first.direction } : { pattern, methodName: first.methodName });
  }
  out.push(...RESIDUE_PREFIXES);
  return out;
}

/** Stable order: exacts first, then prefixes longest-first (ties lexicographic). */
function sortPatterns(exacts: FixablePattern[], prefixes: FixablePattern[]): FixablePattern[] {
  const byLenThenLex = (a: FixablePattern, b: FixablePattern): number =>
    b.pattern.length - a.pattern.length || a.pattern.localeCompare(b.pattern);
  return [...exacts.sort(byLenThenLex), ...prefixes.sort(byLenThenLex)];
}

let cached: { patterns: FixablePattern[]; modifierMap: Record<string, string> } | undefined;

/** Derive (once per lint run) the ordered fix table + display map. */
export function getFixableTables(): { patterns: readonly FixablePattern[]; modifierMap: Readonly<Record<string, string>> } {
  if (cached) return cached;
  const vocab = loadClassVocab();
  const patterns = sortPatterns(deriveExacts(vocab), derivePrefixes(vocab));

  const modifierMap: Record<string, string> = {};
  for (const p of patterns) {
    if (p.exactMatch) {
      if (p.direction && p.fixedValue) modifierMap[p.pattern] = `${p.methodName}('${p.direction}', '${p.fixedValue}')`;
      else if (p.fixedValue) modifierMap[p.pattern] = `${p.methodName}('${p.fixedValue}')`;
      else modifierMap[p.pattern] = `${p.methodName}()`;
    } else if (p.direction) {
      modifierMap[p.pattern] = `${p.methodName}('${p.direction}', ...)`;
    } else {
      modifierMap[p.pattern] = `${p.methodName}()`;
    }
  }
  cached = { patterns, modifierMap };
  return cached;
}
