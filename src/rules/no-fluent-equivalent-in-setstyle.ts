import { Rule } from "eslint";
import { VOCAB_UNITS } from "../vocab.generated";

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const UNIT_ALT = [...VOCAB_UNITS].sort((a, b) => b.length - a.length).map(escapeRe).join("|");
const UNIT_VALUE_RE = new RegExp(`^(-?\\d+(?:\\.\\d+)?)(${UNIT_ALT})$`);

// Placeholder marking template-literal expression slots; declarations containing it are dynamic → skipped.
const EXPR = "\u0000";

const HEX_RE = /^#[0-9a-fA-F]{3,8}$/;
const NAMED_COLORS = new Set(["white", "black", "transparent"]);

// CSS property → fluent method taking a ("unit", n) overload.
const UNIT_PROPS: Record<string, string> = {
  width: "w",
  height: "h",
  "min-width": "minW",
  "max-width": "maxW",
  "min-height": "minH",
  "max-height": "maxH",
  top: "top",
  right: "right",
  bottom: "bottom",
  left: "left",
  inset: "inset",
  gap: "gap",
  "font-size": "text",
  "letter-spacing": "tracking",
  "line-height": "leading",
  "text-underline-offset": "underlineOffset",
  margin: "m",
  padding: "p",
  "margin-top": 'mt(…)',
  "margin-right": 'mr(…)',
  "margin-bottom": 'mb(…)',
  "margin-left": 'ml(…)',
  "padding-top": 'pt(…)',
  "padding-right": 'pr(…)',
  "padding-bottom": 'pb(…)',
  "padding-left": 'pl(…)',
};

// CSS property → fluent method taking the value (or a token) directly.
const VALUE_PROPS: Record<string, string> = {
  "white-space": "whitespace",
  "font-weight": "font",
  "text-align": "text",
  "border-radius": "rounded",
  "z-index": "z",
  opacity: "opacity",
  cursor: "cursor",
  overflow: "overflow",
  "overflow-x": 'overflow("x-…")',
  "overflow-y": 'overflow("y-…")',
};

// CSS property → fluent color method; flagged only for plain hex / white / black / transparent
// (rgba(), color-mix(), gradients are skipped by the functional-value rule).
const COLOR_PROPS: Record<string, string> = {
  color: "text",
  background: "bg",
  "background-color": "bg",
  "border-color": "border",
};

// display / position keyword values → dedicated fluent methods.
const KEYWORD_PROPS: Record<string, Record<string, string>> = {
  display: {
    none: "hidden()",
    block: "block()",
    inline: "inline()",
    flex: "flex()",
    grid: "grid()",
    "inline-block": "inlineBlock()",
    "inline-flex": "inlineFlex()",
    "inline-grid": "inlineGrid()",
    contents: "contents()",
  },
  position: {
    absolute: "absolute()",
    relative: "relative()",
    fixed: "fixed()",
    sticky: "sticky()",
    static: "static()",
  },
};

type Decl = { prop: string; value: string };

function parseDeclarations(css: string): Decl[] {
  return css
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const colon = d.indexOf(":");
      if (colon === -1) return null;
      return { prop: d.slice(0, colon).trim().toLowerCase(), value: d.slice(colon + 1).trim() };
    })
    .filter((d): d is Decl => d !== null);
}

const camelToKebab = (s: string): string => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

function suggestionFor(prop: string, value: string): string | null {
  const unitMethod = UNIT_PROPS[prop];
  if (unitMethod) {
    if (unitMethod.includes("(")) return `.${unitMethod}`;
    // Multi-value shorthand ("padding: 26px 24px") has no single fluent call — suggest per-side.
    if (value.includes(" ")) return `.${unitMethod}(…) per side`;
    const m = UNIT_VALUE_RE.exec(value);
    if (m) return `.${unitMethod}("${m[2]}", ${m[1]})`;
    return `.${unitMethod}(…)`;
  }

  const valueMethod = VALUE_PROPS[prop];
  if (valueMethod) return valueMethod.includes("(") ? `.${valueMethod}` : `.${valueMethod}(…)`;

  const colorMethod = COLOR_PROPS[prop];
  if (colorMethod && (HEX_RE.test(value) || NAMED_COLORS.has(value.toLowerCase()))) {
    return `.${colorMethod}(…) with a theme token`;
  }

  const keywords = KEYWORD_PROPS[prop];
  if (keywords) {
    const method = keywords[value.toLowerCase()];
    if (method) return `.${method}`;
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow static CSS with a fluent equivalent inside setStyle/setStyles. Reserve inline styles for CSS the fluent API cannot express (dynamic values, gradients, color-mix, clamp, url).",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      useFluentEquivalent:
        'Inline style "{{decl}}" has a fluent equivalent — use {{suggestion}}. Reserve setStyle for CSS with no fluent or token equivalent.',
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoredProperties: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] || {};
    const ignored: Set<string> = new Set(options.ignoredProperties || []);

    function checkDecl(node: any, prop: string, value: string) {
      if (ignored.has(prop)) return;
      // Dynamic (interpolated) or functional values (rgba, color-mix, clamp, var, url, gradients,
      // calc) are the legitimate escape hatch — never flagged.
      if (value.includes(EXPR) || prop.includes(EXPR) || value.includes("(")) return;
      const suggestion = suggestionFor(prop, value);
      if (!suggestion) return;
      context.report({
        node,
        messageId: "useFluentEquivalent",
        data: { decl: `${prop}: ${value}`, suggestion },
      });
    }

    function checkCssString(node: any, css: string) {
      for (const { prop, value } of parseDeclarations(css)) checkDecl(node, prop, value);
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        const propNode = node.callee.property;
        if (propNode.type !== "Identifier") return;
        if (node.arguments.length !== 1) return;
        const arg = node.arguments[0];

        if (propNode.name === "setStyle") {
          if (arg.type === "Literal" && typeof arg.value === "string") {
            checkCssString(arg, arg.value);
          } else if (arg.type === "TemplateLiteral") {
            // Join static parts with a marker; declarations touching an expression are skipped.
            checkCssString(arg, arg.quasis.map((q: any) => q.value.cooked ?? "").join(EXPR));
          }
          return;
        }

        if (propNode.name === "setStyles" && arg.type === "ObjectExpression") {
          for (const p of arg.properties) {
            if (p.type !== "Property" || p.computed) continue;
            const key =
              p.key.type === "Identifier"
                ? p.key.name
                : p.key.type === "Literal" && typeof p.key.value === "string"
                  ? p.key.value
                  : null;
            if (!key) continue;
            const v = p.value;
            let value: string | null = null;
            if (v.type === "Literal" && (typeof v.value === "string" || typeof v.value === "number")) {
              value = String(v.value);
            } else if (v.type === "TemplateLiteral" && v.expressions.length === 0) {
              value = v.quasis.map((q: any) => q.value.cooked ?? "").join("");
            }
            if (value === null) continue;
            checkDecl(p, camelToKebab(key).toLowerCase(), value.trim());
          }
        }
      },
    };
  },
};

export = rule;
