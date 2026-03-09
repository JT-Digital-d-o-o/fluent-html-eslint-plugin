import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "layout",
    docs: {
      description: "Disallow unnecessary spaces in setClass() strings",
      category: "Stylistic Issues",
      recommended: true,
    },
    fixable: "whitespace",
    messages: {
      unnecessarySpaces: "Unnecessary spaces in setClass() string. Use single spaces between classes.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function checkString(node: any, value: string, nodeStart: number, checkLeading = true, checkTrailing = true) {
      // Check for multiple consecutive spaces
      const multipleSpaces = /  +/g;
      let match;
      while ((match = multipleSpaces.exec(value)) !== null) {
        context.report({
          node,
          messageId: "unnecessarySpaces",
          loc: {
            start: context.sourceCode.getLocFromIndex(nodeStart + match.index),
            end: context.sourceCode.getLocFromIndex(nodeStart + match.index + match[0].length),
          },
          fix(fixer) {
            return fixer.replaceTextRange(
              [nodeStart + match!.index, nodeStart + match!.index + match![0].length],
              " "
            );
          },
        });
      }

      // Check for leading spaces (only if checkLeading is true)
      if (checkLeading) {
        const leadingSpaces = value.match(/^(\s+)/);
        if (leadingSpaces) {
          context.report({
            node,
            messageId: "unnecessarySpaces",
            loc: {
              start: context.sourceCode.getLocFromIndex(nodeStart),
              end: context.sourceCode.getLocFromIndex(nodeStart + leadingSpaces[0].length),
            },
            fix(fixer) {
              return fixer.removeRange([nodeStart, nodeStart + leadingSpaces[0].length]);
            },
          });
        }
      }

      // Check for trailing spaces (only if checkTrailing is true)
      if (checkTrailing) {
        const trailingSpaces = value.match(/(\s+)$/);
        if (trailingSpaces) {
          const trailingStart = nodeStart + value.length - trailingSpaces[0].length;
          context.report({
            node,
            messageId: "unnecessarySpaces",
            loc: {
              start: context.sourceCode.getLocFromIndex(trailingStart),
              end: context.sourceCode.getLocFromIndex(trailingStart + trailingSpaces[0].length),
            },
            fix(fixer) {
              return fixer.removeRange([trailingStart, trailingStart + trailingSpaces[0].length]);
            },
          });
        }
      }
    }

    function checkStringNode(node: any) {
      if (node.type === "Literal" && typeof node.value === "string") {
        checkString(node, node.value, node.range[0] + 1);
      }
      if (node.type === "TemplateLiteral") {
        for (let i = 0; i < node.quasis.length; i++) {
          const quasi = node.quasis[i];
          if (quasi.value.cooked) {
            checkString(quasi, quasi.value.cooked, quasi.range[0] + 1, i === 0, i === node.quasis.length - 1);
          }
        }
      }
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") {
          return;
        }

        if (node.callee.property.type !== "Identifier") {
          return;
        }

        const methodName = node.callee.property.name;

        if (methodName === "setClasses") {
          if (node.arguments.length === 0) return;
          const arg = node.arguments[0];
          if (arg.type !== "ArrayExpression") return;
          for (const element of arg.elements) {
            if (element) checkStringNode(element);
          }
          return;
        }

        if (methodName !== "setClass") {
          return;
        }

        if (node.arguments.length === 0) {
          return;
        }

        checkStringNode(node.arguments[0]);
      },
    };
  },
};

export = rule;
