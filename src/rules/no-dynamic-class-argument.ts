import { Rule } from "eslint";

// The safelist hazard guard (llm-styling/escape-hatch): a non-literal argument
// to addClass/setClass/cssClass is invisible to the Tailwind safelist
// extractor — extractDirectClasses records literals only, so a computed class
// can vanish from the production CSS with zero build signal. The fix is a
// statically-analyzable form: `.when()` / `Match` branches with literal
// classes, or a `defineTheme` staticManifest entry.

const TARGETS = new Set(["addClass", "setClass", "cssClass"]);

function isStaticString(node: any): boolean {
  if (node.type === "Literal" && typeof node.value === "string") return true;
  // A template literal with no interpolations is static.
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return true;
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow non-literal arguments to addClass/setClass/cssClass — the safelist extractor cannot see them, so the classes can silently disappear from production CSS",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      dynamicArg:
        ".{{callee}}({{argText}}) is invisible to the safelist extractor — styles can silently disappear in production. Use .when(...) / Match(...) with literal classes per branch, or defineTheme's staticManifest for token-driven values.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return;
        const calleeName: string = node.callee.property.name;
        if (!TARGETS.has(calleeName)) return;
        if (node.arguments.length === 0) return;

        const arg = node.arguments[0];
        if (isStaticString(arg)) return;

        const source = context.getSourceCode().getText(arg);
        context.report({
          node: arg,
          messageId: "dynamicArg",
          data: { callee: calleeName, argText: source.length > 40 ? `${source.slice(0, 40)}…` : source },
        });
      },
    };
  },
};

export = rule;
