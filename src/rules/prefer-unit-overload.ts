import { Rule } from "eslint";
// Unit-overload methods AND the CSS unit list are derived from fluent-html/class-vocab
// (C-05) — see scripts/gen-vocab.mjs; pinned by test/vocab-drift.mjs.
import { UNIT_METHODS, VOCAB_UNITS } from "../vocab.generated";

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Regex that matches bracket-syntax arbitrary values containing a CSS unit.
 * The unit alternation is built from VOCAB_UNITS (single-sourced from the lib's
 * `UNITS`, longest-first so a unit that is a suffix of another can't shadow it).
 * Captures: [1] = number (possibly decimal), [2] = unit.
 * Examples: "[180px]" → ("180", "px"), "[1.5rem]" → ("1.5", "rem"), "[50%]" → ("50", "%")
 */
const UNIT_ALT = [...VOCAB_UNITS].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
const BRACKET_UNIT_RE = new RegExp(`^\\[(-?\\d+(?:\\.\\d+)?)(${UNIT_ALT})\\]$`);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer unit-based overloads over bracket syntax for arbitrary values. e.g. .minH("px", 180) instead of .minH("[180px]")',
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferUnitOverload:
        'Use .{{method}}("{{unit}}", {{amount}}) instead of .{{method}}("{{raw}}"). Unit-based overloads are cleaner and more readable.',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        const prop = node.callee.property;
        if (prop.type !== "Identifier") return;

        const methodName = prop.name;
        if (!UNIT_METHODS.has(methodName)) return;

        // Only check when there's exactly 1 string literal argument
        if (node.arguments.length !== 1) return;
        const arg = node.arguments[0];
        if (arg.type !== "Literal" || typeof arg.value !== "string") return;

        const raw = arg.value;
        const match = BRACKET_UNIT_RE.exec(raw);
        if (!match) return;

        const amount = match[1];
        const unit = match[2];

        context.report({
          node,
          messageId: "preferUnitOverload",
          data: {
            method: methodName,
            unit,
            amount,
            raw,
          },
          fix(fixer) {
            // Replace .method("[180px]") with .method("px", 180)
            const dotStart = prop.range[0] - 1; // -1 for the dot
            return fixer.replaceTextRange(
              [dotStart, node.range[1]],
              `.${methodName}("${unit}", ${amount})`
            );
          },
        });
      },
    };
  },
};

export = rule;
