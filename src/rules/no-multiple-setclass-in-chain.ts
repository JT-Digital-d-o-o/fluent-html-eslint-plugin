import { Rule } from "eslint";

function isSetClassMethod(name: string): boolean {
  return name === "setClass" || name === "setClasses";
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow multiple setClass()/setClasses() calls in a method chain (earlier calls get overwritten)",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      multipleSetClass:
        "Multiple class-setting calls in chain. {{firstMethod}}('{{firstClasses}}') will be overwritten. Merge the class lists or use .addClass() for additions.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    // Track calls we've already reported to avoid duplicate reports
    const reportedNodes = new WeakSet();

    function getSetClassValue(node: any): string | null {
      const methodName = node.callee.property.name;

      if (methodName === "setClass") {
        if (node.arguments.length === 0) return "";
        const arg = node.arguments[0];
        if (arg.type === "Literal" && typeof arg.value === "string") return arg.value;
        if (arg.type === "TemplateLiteral") {
          return arg.quasis.map((q: any) => q.value.cooked || "").join("...");
        }
        return "...";
      }

      if (methodName === "setClasses") {
        if (node.arguments.length === 0) return "[]";
        const arg = node.arguments[0];
        if (arg.type !== "ArrayExpression") return "[...]";
        const strs = arg.elements
          .filter((e: any) => e && e.type === "Literal" && typeof e.value === "string")
          .map((e: any) => `"${e.value}"`);
        return strs.length === 0 ? "[...]" : `[${strs.join(", ")}]`;
      }

      return "...";
    }

    function findSetClassCallsInChain(node: any): any[] {
      const calls: any[] = [];

      let current = node;
      while (current) {
        if (
          current.type === "CallExpression" &&
          current.callee.type === "MemberExpression" &&
          current.callee.property.type === "Identifier" &&
          isSetClassMethod(current.callee.property.name)
        ) {
          calls.push(current);
        }

        // Move up the chain
        if (
          current.type === "CallExpression" &&
          current.callee.type === "MemberExpression"
        ) {
          current = current.callee.object;
        } else {
          break;
        }
      }

      return calls;
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (
          node.callee.property.type !== "Identifier" ||
          !isSetClassMethod(node.callee.property.name)
        )
          return;

        // Skip if we've already reported this node as part of another chain
        if (reportedNodes.has(node)) return;

        // Find all setClass/setClasses calls in this chain
        const calls = findSetClassCallsInChain(node);

        // If there's more than one, report it
        if (calls.length > 1) {
          // Mark all as reported
          for (const call of calls) {
            reportedNodes.add(call);
          }

          // The calls are in reverse order (outermost first), so reverse to get chain order
          const orderedCalls = calls.reverse();
          const firstCall = orderedCalls[0];
          const secondCall = orderedCalls[1];

          const firstClasses = getSetClassValue(firstCall) || "";

          context.report({
            node: secondCall,
            messageId: "multipleSetClass",
            data: {
              firstMethod: firstCall.callee.property.name,
              firstClasses: firstClasses.trim(),
            },
          });
        }
      },
    };
  },
};

export = rule;
