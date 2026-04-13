import { Rule } from "eslint";

/**
 * Form element factory functions whose `.setName()` should be replaced
 * by the type-safe `formFor<T>()` pattern.
 */
const FORM_FIELD_FUNCTIONS = new Set(["Input", "Textarea", "Select"]);

/**
 * Walks up a method-call chain and returns the root CallExpression,
 * e.g. for `Input("text").setName("email").toggle("required")` it
 * returns the `Input("text")` node.
 */
function getRootCall(node: any): any | null {
  let current = node;
  while (
    current.type === "CallExpression" &&
    current.callee.type === "MemberExpression"
  ) {
    current = current.callee.object;
  }
  return current.type === "CallExpression" ? current : null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer formFor<T>() over .setName("literal") on form field elements for compile-time field name safety.',
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      preferFormFor:
        'Avoid .setName("{{name}}") on {{element}}(). Use formFor<SchemaType>() for type-safe field names that catch typos at compile time.',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        // Match .setName(<literal>) calls
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.property.type !== "Identifier" ||
          node.callee.property.name !== "setName" ||
          node.arguments.length < 1
        ) {
          return;
        }

        const arg = node.arguments[0];
        if (arg.type !== "Literal" || typeof arg.value !== "string") {
          return;
        }

        // Walk the chain to find the root element factory call
        const root = getRootCall(node);
        if (!root) return;

        const callee = root.callee;
        const elementName =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" &&
                callee.property.type === "Identifier"
              ? callee.property.name
              : null;

        if (!elementName || !FORM_FIELD_FUNCTIONS.has(elementName)) {
          return;
        }

        context.report({
          node: node.callee.property,
          messageId: "preferFormFor",
          data: { name: arg.value, element: elementName },
        });
      },
    };
  },
};

export = rule;
