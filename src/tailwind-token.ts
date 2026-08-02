// Shared Tailwind-token analysis for the escape-hatch rule set
// (no-tailwind-in-raw-class / no-tailwind-in-cssclass). Prefix-anchored, never
// a bare shape regex: a token is only called "Tailwind" when the derived fix
// tables know it, or when it is Tailwind-shaped AND its root exists in the
// generated TAILWIND_ROOTS list (from the lib's pinned design system) — so
// `sidebar-backdrop` / `entry-row` / `hamburger-line` are never flagged.

import { FixablePattern, getFixableTables, getVariantTables } from "./derive-fixable";
import { TAILWIND_ROOTS } from "./vocab.generated";

/** Split a class token on `:` outside brackets: variant heads + base utility. */
export function splitVariants(token: string): { heads: string[]; base: string } {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of token) {
    if (ch === "[") depth++;
    else if (ch === "]") depth = Math.max(0, depth - 1);
    if (ch === ":" && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  parts.push(current);
  return { heads: parts.slice(0, -1), base: parts[parts.length - 1] || "" };
}

/** Responsive/container heads that map to `.at(...)`. */
export function isBreakpointHead(head: string): boolean {
  return head === "sm" || head === "md" || head === "lg" || head === "xl" || head === "2xl" || head.startsWith("@");
}

const STATE_HEADS = new Set([
  "hover", "focus", "focus-within", "focus-visible", "active", "visited",
  "disabled", "enabled", "checked", "indeterminate", "required", "invalid", "valid",
  "first", "last", "odd", "even", "empty", "first-of-type", "last-of-type",
  "placeholder", "selection", "marker", "file", "before", "after", "dark",
  "print", "motion-reduce", "motion-safe", "portrait", "landscape",
  "starting", "open", "inert", "only", "only-of-type", "target", "default",
  "optional", "read-only", "autofill", "in-range", "out-of-range",
  "placeholder-shown", "details-content", "user-valid", "user-invalid",
  "rtl", "ltr", "contrast-more", "contrast-less", "forced-colors", "*", "**",
]);

const STATE_HEAD_PREFIXES = ["group-", "peer-", "aria-", "data-", "has-", "not-", "supports-", "nth-", "in-", "max-", "min-"];

/** Heads that map to `.on(...)` — states, group/peer/aria/data families, `[&…]` selectors. */
export function isStateHead(head: string): boolean {
  if (STATE_HEADS.has(head)) return true;
  if (head.startsWith("[&")) return true;
  return STATE_HEAD_PREFIXES.some((p) => head.startsWith(p));
}

export function isKnownVariantHead(head: string): boolean {
  return isBreakpointHead(head) || isStateHead(head);
}

// Tailwind-shaped: root word plus at least one dashed value segment (plain or
// bracketed). Deliberately requires a dash — bare single words (`container`,
// `visible`) are too collision-prone with user CSS class names.
const TAILWIND_SHAPE = /^-?[a-z][a-z0-9]*(-(?:[a-z0-9./]+|\[[^\]]+\]))+$/;

/** Longest TAILWIND_ROOTS entry the token is anchored on, or null. */
export function tailwindRootOf(token: string): string | null {
  const bare = token.replace(/^-/, "");
  const segments = bare.split("-");
  let root: string | null = null;
  let candidate = "";
  for (const seg of segments) {
    candidate = candidate === "" ? seg : `${candidate}-${seg}`;
    if (TAILWIND_ROOTS.has(candidate)) root = candidate;
  }
  return root;
}

export type BaseClassification =
  /** The derived fix table maps it — `fix` is the fluent replacement chain text. */
  | { kind: "mapped"; pattern: FixablePattern; fix: string }
  /** Tailwind-shaped with a real Tailwind root, but no fluent mapping. */
  | { kind: "tailwind-unmapped"; root: string }
  /** Not recognizably Tailwind. */
  | { kind: "not-tailwind" };

function methodCallText(pattern: FixablePattern, className: string): string {
  if (pattern.exactMatch) {
    if (pattern.direction && pattern.fixedValue) return `.${pattern.methodName}("${pattern.direction}", "${pattern.fixedValue}")`;
    if (pattern.fixedValue) return `.${pattern.methodName}("${pattern.fixedValue}")`;
    return `.${pattern.methodName}()`;
  }
  const value = className.slice(pattern.pattern.length);
  if (pattern.direction) return `.${pattern.methodName}("${pattern.direction}", "${value}")`;
  return `.${pattern.methodName}("${value}")`;
}

/** Classify a variant-stripped base token against the derived tables + root list. */
export function classifyBase(base: string): BaseClassification {
  for (const pattern of getFixableTables().patterns) {
    if (pattern.exactMatch ? base === pattern.pattern : base.startsWith(pattern.pattern)) {
      return { kind: "mapped", pattern, fix: methodCallText(pattern, base) };
    }
  }
  if (TAILWIND_SHAPE.test(base)) {
    const root = tailwindRootOf(base);
    if (root !== null) return { kind: "tailwind-unmapped", root };
  }
  return { kind: "not-tailwind" };
}

export type TokenAnalysis = {
  token: string;
  heads: string[];
  base: string;
  /** true when every variant head is a known Tailwind variant (or there are none). */
  headsKnown: boolean;
  classification: BaseClassification;
  /**
   * Full fluent replacement for the token — a plain method call, or for a
   * variant-prefixed token the object form (`.hover({ bg: "blue-600" })`,
   * nested heads as nested keys, non-tier-1 outer head via `.variant()`).
   * Null when the base is not mapped, a head is unknown, or the head chain is
   * not object-expressible (a non-tier-1 head in nested position).
   */
  fluentChain: string | null;
};

/**
 * The variant-object entry for a mapped base (`bg: "blue-600"`, `px: "4"`,
 * `truncate: true`), or null when the pattern has no flattened object key.
 */
function objectEntryText(pattern: FixablePattern, className: string): string | null {
  const key = getVariantTables().keyFor(pattern.methodName, pattern.direction);
  if (key === undefined) return null;
  if (pattern.exactMatch) {
    return pattern.fixedValue !== undefined ? `${key}: "${pattern.fixedValue}"` : `${key}: true`;
  }
  return `${key}: "${className.slice(pattern.pattern.length)}"`;
}

/** Analyze one whitespace-split class token (variants + base). */
export function analyzeToken(token: string): TokenAnalysis {
  const { heads, base } = splitVariants(token);
  const headsKnown = heads.every(isKnownVariantHead);
  const classification = classifyBase(base);

  let fluentChain: string | null = null;
  if (classification.kind === "mapped" && headsKnown) {
    if (heads.length === 0) {
      fluentChain = classification.fix;
    } else {
      const { tier1ByPrefix } = getVariantTables();
      // Nested heads must be tier-1 names (only they exist as nested keys);
      // the outer head may fall back to the generic `.variant(name, {…})`.
      const nested = heads.slice(1).map((h) => tier1ByPrefix[h]);
      let entry = objectEntryText(classification.pattern, base);
      if (entry !== null && nested.every((n): n is string => n !== undefined)) {
        for (let i = nested.length - 1; i >= 0; i--) entry = `${nested[i]}: { ${entry} }`;
        const outerTier1 = tier1ByPrefix[heads[0]];
        fluentChain = outerTier1 !== undefined
          ? `.${outerTier1}({ ${entry} })`
          : `.variant("${heads[0]}", { ${entry} })`;
      }
    }
  }
  return { token, heads, base, headsKnown, classification, fluentChain };
}

/** True when the token is recognizably Tailwind (mapped, Tailwind-rooted, or known-variant-prefixed). */
export function isTailwindToken(a: TokenAnalysis): boolean {
  if (a.classification.kind !== "not-tailwind") return true;
  return a.heads.length > 0 && a.headsKnown;
}
