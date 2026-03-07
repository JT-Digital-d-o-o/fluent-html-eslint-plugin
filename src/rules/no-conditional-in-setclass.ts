import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow template literals with expressions in setClass(). Use .setClasses() or .when() instead.",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noConditionalSetClass:
        "Avoid conditional expressions in setClass(). Use .setClasses([...]) for conditional class lists or .when(condition, t => t.addClass(...)) for conditional modifiers.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (
          node.callee.property.type !== "Identifier" ||
          node.callee.property.name !== "setClass"
        )
          return;

        if (node.arguments.length === 0) return;
        const arg = node.arguments[0];

        // Flag template literals that contain expressions
        if (
          arg.type === "TemplateLiteral" &&
          arg.expressions.length > 0
        ) {
          context.report({
            node: arg,
            messageId: "noConditionalSetClass",
          });
          return;
        }

        // Flag ternary/conditional expressions: setClass(cond ? "a" : "b")
        if (arg.type === "ConditionalExpression") {
          context.report({
            node: arg,
            messageId: "noConditionalSetClass",
          });
          return;
        }

        // Flag binary expressions: setClass("base " + (cond ? "a" : ""))
        if (arg.type === "BinaryExpression" && arg.operator === "+") {
          context.report({
            node: arg,
            messageId: "noConditionalSetClass",
          });
          return;
        }
      },
    };
  },
};

export = rule;
