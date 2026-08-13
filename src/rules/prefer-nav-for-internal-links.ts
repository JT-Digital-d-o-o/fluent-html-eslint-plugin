import { Rule } from "eslint";

// An internal `setHref("/…")` is a full page reload where `.nav(route)` would morph the
// layout, keep scroll/history behavior, and go through the typed route table. External
// URLs, new-tab links, and downloads legitimately stay on setHref.

function isInternalPathLiteral(arg: any): boolean {
  return (
    arg &&
    arg.type === "Literal" &&
    typeof arg.value === "string" &&
    arg.value.startsWith("/") &&
    !arg.value.startsWith("//")
  );
}

// Walk the fluent chain looking for an escape: setDownload / toggle("download"), or
// setTarget with anything but a literal "_self" (an unknown target gets the benefit of
// the doubt — only _blank-style targets need the real reload, but we can't prove it).
function chainHasEscape(base: any): boolean {
  let current = base.parent;
  while (
    current &&
    current.type === "MemberExpression" &&
    current.parent &&
    current.parent.type === "CallExpression" &&
    current.parent.callee === current
  ) {
    const call = current.parent;
    const name = current.property.type === "Identifier" ? current.property.name : null;
    const arg0 = call.arguments[0];
    if (name === "setDownload") return true;
    if (name === "toggle" && arg0 && arg0.type === "Literal" && arg0.value === "download") {
      return true;
    }
    if (name === "setTarget" && !(arg0 && arg0.type === "Literal" && arg0.value === "_self")) {
      return true;
    }
    current = call.parent;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Internal navigation goes through .nav(route), not setHref(\"/…\") — setHref is a full reload and bypasses the typed route table. External links, target=\"_blank\", and downloads are exempt.",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      preferNav:
        'A(…).setHref("{{path}}") is a full-page reload for an internal route. Use .nav(route) with the defineRoutes ref instead (setHref stays for external URLs, target="_blank", and downloads).',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "A") return;

        if (chainHasEscape(node)) return;

        // Find the setHref call in the chain and check its argument.
        let current = node.parent;
        while (
          current &&
          current.type === "MemberExpression" &&
          current.parent &&
          current.parent.type === "CallExpression" &&
          current.parent.callee === current
        ) {
          const call = current.parent;
          if (
            current.property.type === "Identifier" &&
            current.property.name === "setHref" &&
            isInternalPathLiteral(call.arguments[0])
          ) {
            context.report({
              node: call,
              messageId: "preferNav",
              data: { path: call.arguments[0].value },
            });
            return;
          }
          current = call.parent;
        }
      },
    };
  },
};

export = rule;
