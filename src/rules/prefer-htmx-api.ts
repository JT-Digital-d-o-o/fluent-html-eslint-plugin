import { Rule } from "eslint";

// All hx-* attributes that have dedicated options in the HTMX API
const HX_ATTRIBUTES = new Set([
  "hx-get",
  "hx-post",
  "hx-put",
  "hx-patch",
  "hx-delete",
  "hx-trigger",
  "hx-target",
  "hx-swap",
  "hx-swap-oob",
  "hx-select",
  "hx-push-url",
  "hx-replace-url",
  "hx-vals",
  "hx-headers",
  "hx-include",
  "hx-encoding",
  "hx-validate",
  "hx-confirm",
  "hx-indicator",
  "hx-disable",
  "hx-sync",
  "hx-preserve",
  "hx-boost",
  "hx-config",
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer the typed HTMX API (hxGet, hxPost, setHtmx) over .addAttribute("hx-*", ...). The HTMX API provides type safety, autocomplete, and consolidates multiple attributes into a single call.',
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      preferHtmxApi:
        'Use the HTMX API (hxGet, hxPost, setHtmx) instead of .addAttribute("{{attr}}", ...). The HTMX API provides type safety and consolidates hx-* attributes into a single options object.',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (
          node.callee.property.type !== "Identifier" ||
          node.callee.property.name !== "addAttribute"
        )
          return;

        if (node.arguments.length < 1) return;
        const attrArg = node.arguments[0];

        if (attrArg.type !== "Literal" || typeof attrArg.value !== "string") return;

        const attrName = attrArg.value;
        if (!HX_ATTRIBUTES.has(attrName)) return;

        context.report({
          node,
          messageId: "preferHtmxApi",
          data: { attr: attrName },
        });
      },
    };
  },
};

export = rule;
