import { Rule } from "eslint";

// Utilities removed in Tailwind v4. The `*-opacity-*` family is replaced by the
// slash opacity modifier (`bg-black/50`, i.e. `.background("black/50")`).
const REMOVED_OPACITY_RE = /^(bg|text|border|ring|divide|placeholder)-opacity-(\d+)$/;
const VARIANT_PREFIX_RE = /^(?:[\w-]+:)+/;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow Tailwind utilities removed in v4 (the *-opacity-* family → slash opacity modifier)",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      removedOpacity:
        "`{{cls}}` was removed in Tailwind v4 — use the slash opacity modifier `{{util}}-<color>/{{amount}}` (e.g. `.background(\"black/{{amount}}\")`).",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function check(node: any, value: string, nodeStart: number): void {
      const classes = value.split(/\s+/).filter(Boolean);
      let cursor = 0;
      for (const cls of classes) {
        const classIndex = value.indexOf(cls, cursor);
        cursor = classIndex + cls.length;
        const base = cls.replace(VARIANT_PREFIX_RE, "");
        const m = REMOVED_OPACITY_RE.exec(base);
        if (m) {
          context.report({
            node,
            messageId: "removedOpacity",
            data: { cls: base, util: m[1]!, amount: m[2]! },
            loc: {
              start: context.sourceCode.getLocFromIndex(nodeStart + classIndex),
              end: context.sourceCode.getLocFromIndex(nodeStart + classIndex + cls.length),
            },
          });
        }
      }
    }

    function checkStringNode(node: any): void {
      if (node.type === "Literal" && typeof node.value === "string") {
        check(node, node.value, node.range[0] + 1);
      }
      if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          if (quasi.value.cooked) check(quasi, quasi.value.cooked, quasi.range[0] + 1);
        }
      }
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (node.callee.property.type !== "Identifier") return;
        const methodName = node.callee.property.name;

        if (methodName === "setClass" || methodName === "addClass") {
          if (node.arguments.length > 0) checkStringNode(node.arguments[0]);
        } else if (methodName === "setClasses") {
          const arg = node.arguments[0];
          if (arg && arg.type === "ArrayExpression") {
            for (const element of arg.elements) if (element) checkStringNode(element);
          }
        }
      },
    };
  },
};

export = rule;
