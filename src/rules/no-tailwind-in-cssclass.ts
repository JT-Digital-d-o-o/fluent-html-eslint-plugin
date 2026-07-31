import { Rule } from "eslint";
import { analyzeToken, isTailwindToken } from "../tailwind-token";

// Inverse guard on the sanctioned hatch (llm-styling/escape-hatch):
// `.cssClass()` is the intent marker for legitimately NON-Tailwind classes
// (JS/CSS hooks, third-party widgets). A Tailwind-shaped token inside it is a
// mis-filed utility — it belongs on the typed methods (or .cssProp), where it
// participates in conflict detection and the safelist pipeline. Autofix
// applies when the derived table maps the token.

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind utility classes inside .cssClass() — it is the marker for non-Tailwind classes; utilities belong on the typed methods",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: "code",
    messages: {
      tailwindInCssClass:
        "'{{className}}' in .cssClass() is a Tailwind utility — .cssClass() marks non-Tailwind classes only. Replace with: {{fluentChain}}. [autofix]",
      tailwindInCssClassNoFix:
        "'{{className}}' in .cssClass() is a Tailwind utility — .cssClass() marks non-Tailwind classes only. Move it to the typed methods (or .cssProp() for arbitrary CSS).",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return;
        if (node.callee.property.name !== "cssClass") return;
        if (node.arguments.length === 0) return;
        const arg = node.arguments[0];
        if (arg.type !== "Literal" || typeof arg.value !== "string") return;

        const tokens: string[] = (arg.value as string).split(/\s+/).filter(Boolean);
        const analyses = tokens.map((t) => analyzeToken(t));
        const flagged = analyses.filter(isTailwindToken);
        if (flagged.length === 0) return;

        // Autofix only when the whole call resolves: every token is either a
        // mappable Tailwind utility or a keepable non-Tailwind class.
        const allMappable = flagged.every((a) => a.fluentChain !== null);
        const remaining = analyses.filter((a) => !isTailwindToken(a)).map((a) => a.token);
        const fix = allMappable
          ? (fixer: Rule.RuleFixer): Rule.Fix => {
              const chain = flagged.map((a) => a.fluentChain).join("");
              const keep = remaining.length > 0 ? `.cssClass("${remaining.join(" ")}")` : "";
              const dotStart = node.callee.property.range[0] - 1;
              return fixer.replaceTextRange([dotStart, node.range[1]], chain + keep);
            }
          : undefined;

        flagged.forEach((a, i) => {
          context.report({
            node: arg,
            messageId: a.fluentChain !== null ? "tailwindInCssClass" : "tailwindInCssClassNoFix",
            data: { className: a.token, fluentChain: a.fluentChain ?? "" },
            ...(i === 0 && fix ? { fix } : {}),
          });
        });
      },
    };
  },
};

export = rule;
