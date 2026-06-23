import { Rule } from "eslint";
// The fluent styling methods are derived from fluent-html/class-vocab (C-05) via
// scripts/gen-vocab.mjs — one source, pinned by test/vocab-drift.mjs (no drift).
import { FLUENT_MODIFIERS } from "../vocab.generated";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow setClass()/setClasses() after fluent modifier methods (overwrites all previously added classes)",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      setClassAfterModifier:
        "{{method}}() called after .{{modifier}}() will overwrite the classes added by {{modifier}}(). Move {{method}}() before fluent modifiers, or use addClass() instead.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function findFluentModifiersBeforeSetClass(node: any): string[] {
      const modifiersFound: string[] = [];

      // Walk up the chain from the setClass/setClasses call
      let current = node.callee.object;

      while (current) {
        if (
          current.type === "CallExpression" &&
          current.callee.type === "MemberExpression" &&
          current.callee.property.type === "Identifier"
        ) {
          const methodName = current.callee.property.name;

          if (FLUENT_MODIFIERS.has(methodName)) {
            modifiersFound.push(methodName);
          }

          // Continue up the chain
          current = current.callee.object;
        } else {
          break;
        }
      }

      return modifiersFound;
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (
          node.callee.property.type !== "Identifier" ||
          (node.callee.property.name !== "setClass" && node.callee.property.name !== "setClasses")
        )
          return;

        // Check if there are any fluent modifiers in the chain before this setClass/setClasses
        const modifiers = findFluentModifiersBeforeSetClass(node);

        if (modifiers.length > 0) {
          // Report the first modifier found (most recent in chain)
          context.report({
            node,
            messageId: "setClassAfterModifier",
            data: {
              modifier: modifiers[0],
              method: node.callee.property.name,
            },
          });
        }
      },
    };
  },
};

export = rule;
