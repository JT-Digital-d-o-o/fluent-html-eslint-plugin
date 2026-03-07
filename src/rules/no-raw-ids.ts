import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Disallow hardcoded ID strings. Use defineIds() for type-safe IDs instead of .setId("string") or target: "#string".',
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noRawSetId:
        'Avoid hardcoded .setId("{{id}}"). Use defineIds() or createId() for type-safe IDs that prevent typos.',
      noRawTarget:
        'Avoid hardcoded target: "{{target}}". Use defineIds() for type-safe targets (e.g. ids.{{suggestion}}).',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        // Detect .setId("literal")
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "setId" &&
          node.arguments.length >= 1
        ) {
          const arg = node.arguments[0];
          if (arg.type === "Literal" && typeof arg.value === "string") {
            context.report({
              node: arg,
              messageId: "noRawSetId",
              data: { id: arg.value },
            });
          }
        }
      },

      Property(node: any) {
        // Detect target: "#literal" in object literals (HTMX options)
        if (
          node.key.type === "Identifier" &&
          node.key.name === "target" &&
          node.value.type === "Literal" &&
          typeof node.value.value === "string" &&
          node.value.value.startsWith("#")
        ) {
          const raw = node.value.value;
          // Convert "#user-list" to "userList" as a suggestion
          const idPart = raw
            .slice(1)
            .replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());

          context.report({
            node: node.value,
            messageId: "noRawTarget",
            data: { target: raw, suggestion: idPart },
          });
        }
      },
    };
  },
};

export = rule;
