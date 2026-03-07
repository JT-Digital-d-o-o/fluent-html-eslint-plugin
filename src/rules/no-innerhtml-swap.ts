import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        'Disallow swap: "innerHTML" in HTMX options. innerHTML loses the target element\'s id, breaking subsequent swaps. Use "outerHTML" instead.',
      category: "Possible Errors",
      recommended: true,
    },
    fixable: "code",
    messages: {
      noInnerHtmlSwap:
        'Avoid swap: "innerHTML" — it loses the target element\'s id, breaking subsequent swaps. Use "outerHTML" (or "outerHTML scroll:top") instead.',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      Property(node: any) {
        // Match swap: "innerHTML" in object literals
        if (
          node.key.type === "Identifier" &&
          node.key.name === "swap" &&
          node.value.type === "Literal" &&
          typeof node.value.value === "string" &&
          node.value.value === "innerHTML"
        ) {
          context.report({
            node: node.value,
            messageId: "noInnerHtmlSwap",
            fix(fixer) {
              return fixer.replaceText(node.value, '"outerHTML"');
            },
          });
        }
      },
    };
  },
};

export = rule;
