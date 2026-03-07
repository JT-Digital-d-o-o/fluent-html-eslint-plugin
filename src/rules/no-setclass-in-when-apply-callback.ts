import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow setClass()/setClasses() inside when() or apply() callbacks (overwrites classes set before the callback)",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      setClassInWhenCallback:
        "{{method}}() inside .when() callback will overwrite classes set before .when(). Use addClass() instead.",
      setClassInApplyCallback:
        "{{method}}() inside .apply() callback will overwrite classes set before .apply(). Use addClass() instead.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    // Track when()/apply() callback scopes
    const callbackScopes: { method: "when" | "apply"; node: any }[] = [];

    function isWhenOrApplyCallback(node: any): { method: "when" | "apply" } | null {
      const parent = node.parent;
      if (!parent || parent.type !== "CallExpression") return null;
      if (parent.callee.type !== "MemberExpression") return null;
      if (parent.callee.property.type !== "Identifier") return null;

      const methodName = parent.callee.property.name;
      if (methodName === "when" && parent.arguments.length >= 2 && parent.arguments[1] === node) {
        return { method: "when" };
      }
      if (methodName === "apply" && parent.arguments.includes(node)) {
        return { method: "apply" };
      }
      return null;
    }

    return {
      ArrowFunctionExpression(node: any) {
        const match = isWhenOrApplyCallback(node);
        if (match) {
          callbackScopes.push({ method: match.method, node });
        }
      },
      "ArrowFunctionExpression:exit"(node: any) {
        if (callbackScopes.length > 0 && callbackScopes[callbackScopes.length - 1].node === node) {
          callbackScopes.pop();
        }
      },
      FunctionExpression(node: any) {
        const match = isWhenOrApplyCallback(node);
        if (match) {
          callbackScopes.push({ method: match.method, node });
        }
      },
      "FunctionExpression:exit"(node: any) {
        if (callbackScopes.length > 0 && callbackScopes[callbackScopes.length - 1].node === node) {
          callbackScopes.pop();
        }
      },
      CallExpression(node: any) {
        if (callbackScopes.length === 0) return;
        if (node.callee.type !== "MemberExpression") return;
        if (
          node.callee.property.type !== "Identifier" ||
          (node.callee.property.name !== "setClass" && node.callee.property.name !== "setClasses")
        )
          return;

        const scope = callbackScopes[callbackScopes.length - 1];
        context.report({
          node,
          messageId:
            scope.method === "when"
              ? "setClassInWhenCallback"
              : "setClassInApplyCallback",
          data: { method: node.callee.property.name },
        });
      },
    };
  },
};

export = rule;
