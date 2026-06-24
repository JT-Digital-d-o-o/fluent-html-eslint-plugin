import { Rule } from "eslint";

// SVG markup smells like an icon injected as a string: `<svg …>`.
const SVG_RE = /<svg[\s>]/i;

function literalText(arg: any): string | null {
  if (!arg) return null;
  if (arg.type === "Literal" && typeof arg.value === "string") return arg.value;
  // Template literal with no expressions (or just to scan the static parts).
  if (arg.type === "TemplateLiteral") return arg.quasis.map((q: any) => q.value.raw).join("");
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Avoid Raw("<svg…>") icon injection — use the typed SVG element builders (Svg/Path/Circle/Stop/LinearGradient/…) so icons are Views, not raw strings.',
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noRawIcon:
        "Avoid Raw() with an SVG string — build the icon from the typed SVG elements (Svg(), Path(), Circle(), …) instead of injecting raw markup.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        // Match a bare `Raw(...)` call (the library's raw-HTML sink).
        if (node.callee.type !== "Identifier" || node.callee.name !== "Raw") return;
        const text = literalText(node.arguments[0]);
        if (text !== null && SVG_RE.test(text)) {
          context.report({ node, messageId: "noRawIcon" });
        }
      },
    };
  },
};

export = rule;
