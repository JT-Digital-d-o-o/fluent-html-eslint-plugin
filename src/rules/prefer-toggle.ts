import { Rule } from "eslint";

// The closed set of HTML boolean attributes — kept in sync with `BooleanAttribute`
// in fluent-html (`src/elements/html-types.ts`). These render bare (present = on),
// so they must be set via `.toggle("name")`, never `.addAttribute("name", value)`
// (which would emit e.g. `disabled="false"` and the browser would still treat it as set).
const BOOLEAN_ATTRIBUTES = new Set<string>([
  "allowfullscreen", "async", "autofocus", "autoplay", "checked",
  "controls", "default", "defer", "disabled", "formnovalidate",
  "hidden", "inert", "ismap", "itemscope", "loop", "multiple",
  "muted", "nomodule", "novalidate", "open", "playsinline",
  "readonly", "required", "reversed", "selected",
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer .toggle("name") over addAttribute() for HTML boolean attributes. Boolean attributes render bare; addAttribute("disabled", "false") still renders the attribute, which the browser treats as disabled.',
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferToggle:
        'Use .toggle("{{attr}}") instead of .addAttribute("{{attr}}", …). Boolean attributes render bare; for conditional toggling use .toggle("{{attr}}", condition).',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (
          node.callee.property.type !== "Identifier" ||
          node.callee.property.name !== "addAttribute"
        )
          return;

        if (node.arguments.length < 1) return;
        const attrArg = node.arguments[0];

        // Only check string-literal attribute names
        if (attrArg.type !== "Literal" || typeof attrArg.value !== "string") return;

        const attrName = attrArg.value;
        if (!BOOLEAN_ATTRIBUTES.has(attrName)) return;

        // Auto-fix only the unambiguous static case (a literal value, or no value):
        // `.toggle("name")` is bare. A dynamic value likely encodes a condition the
        // author must move into `.toggle("name", condition)` by hand, so we report
        // those without a fix.
        const valueArg = node.arguments[1];
        const canFix = valueArg === undefined || valueArg.type === "Literal";

        context.report({
          node,
          messageId: "preferToggle",
          data: { attr: attrName },
          fix: canFix
            ? (fixer) => {
                const dotStart = node.callee.property.range[0] - 1; // -1 for the dot
                return fixer.replaceTextRange(
                  [dotStart, node.range[1]],
                  `.toggle("${attrName}")`
                );
              }
            : undefined,
        });
      },
    };
  },
};

export = rule;
