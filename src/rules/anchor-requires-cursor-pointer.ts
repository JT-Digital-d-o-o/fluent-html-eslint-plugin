import { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Anchors created with A() should include .cursor("pointer") in the chain for better UX',
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      missingCursorPointer:
        'Anchor element is missing .cursor("pointer"). Add .cursor("pointer") to the chain for a pointer cursor on hover.',
    },
    fixable: "code",
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        // Look for A(...) calls — the anchor factory function
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "A"
        ) {
          return;
        }

        // Walk up the AST to find if this A() call is the root of a chain
        // and check if cursor("pointer") exists anywhere in the chain above
        let current = node.parent;
        let hasCursorPointer = false;

        while (current) {
          // Pattern: current is MemberExpression whose parent is a CallExpression
          // e.g., A().cursor("pointer") => MemberExpression{object: A(), property: cursor} -> CallExpression
          if (
            current.type === "MemberExpression" &&
            current.object &&
            current.parent &&
            current.parent.type === "CallExpression" &&
            current.parent.callee === current
          ) {
            const call = current.parent;
            if (
              current.property.type === "Identifier" &&
              current.property.name === "cursor" &&
              call.arguments.length >= 1 &&
              call.arguments[0].type === "Literal" &&
              call.arguments[0].value === "pointer"
            ) {
              hasCursorPointer = true;
              break;
            }
            // Move up to the next link in the chain
            current = call.parent;
          } else {
            break;
          }
        }

        // Also check if cursor-pointer is set via setClass/addClass
        if (!hasCursorPointer) {
          current = node.parent;
          while (current) {
            if (
              current.type === "MemberExpression" &&
              current.parent &&
              current.parent.type === "CallExpression" &&
              current.parent.callee === current
            ) {
              const call = current.parent;
              const methodName = current.property.type === "Identifier" ? current.property.name : null;
              if (
                (methodName === "setClass" || methodName === "addClass") &&
                call.arguments.length >= 1 &&
                call.arguments[0].type === "Literal" &&
                typeof call.arguments[0].value === "string" &&
                call.arguments[0].value.split(/\s+/).includes("cursor-pointer")
              ) {
                hasCursorPointer = true;
                break;
              }
              current = call.parent;
            } else {
              break;
            }
          }
        }

        if (!hasCursorPointer) {
          // Find the outermost call in the chain to append .cursor("pointer")
          let outermost = node;
          let walk = node.parent;
          while (walk) {
            if (
              walk.type === "MemberExpression" &&
              walk.parent &&
              walk.parent.type === "CallExpression" &&
              walk.parent.callee === walk
            ) {
              outermost = walk.parent;
              walk = walk.parent.parent;
            } else {
              break;
            }
          }

          context.report({
            node,
            messageId: "missingCursorPointer",
            fix(fixer) {
              return fixer.insertTextAfter(outermost, '.cursor("pointer")');
            },
          });
        }
      },
    };
  },
};

export = rule;
