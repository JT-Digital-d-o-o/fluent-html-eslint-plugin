import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow duplicate class names in setClass()",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: "code",
    messages: {
      duplicateClass: "Duplicate class '{{className}}' in setClass().",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function checkForDuplicates(node: any, value: string, nodeStart: number, seen: Map<string, number>) {
      const classes = value.split(/\s+/).filter(Boolean);

      let currentIndex = 0;
      for (const className of classes) {
        const classIndex = value.indexOf(className, currentIndex);
        currentIndex = classIndex + className.length;

        if (seen.has(className)) {
          context.report({
            node,
            messageId: "duplicateClass",
            data: { className },
            loc: {
              start: context.sourceCode.getLocFromIndex(nodeStart + classIndex),
              end: context.sourceCode.getLocFromIndex(nodeStart + classIndex + className.length),
            },
          });
        } else {
          seen.set(className, classIndex);
        }
      }
    }

    function checkStringNode(node: any, seen: Map<string, number>) {
      if (node.type === "Literal" && typeof node.value === "string") {
        checkForDuplicates(node, node.value, node.range[0] + 1, seen);
      }
      if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          if (quasi.value.cooked) {
            checkForDuplicates(quasi, quasi.value.cooked, quasi.range[0] + 1, seen);
          }
        }
      }
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (node.callee.property.type !== "Identifier") return;

        const methodName = node.callee.property.name;

        if (methodName === "setClasses") {
          if (node.arguments.length === 0) return;
          const arg = node.arguments[0];
          if (arg.type !== "ArrayExpression") return;
          // Share a single seen map across all elements to catch cross-element duplicates
          const seen = new Map<string, number>();
          for (const element of arg.elements) {
            if (element) checkStringNode(element, seen);
          }
          return;
        }

        if (methodName !== "setClass") return;
        if (node.arguments.length === 0) return;

        const seen = new Map<string, number>();
        checkStringNode(node.arguments[0], seen);
      },
    };
  },
};

export = rule;
