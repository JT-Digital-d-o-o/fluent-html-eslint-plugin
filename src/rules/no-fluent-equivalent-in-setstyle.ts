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

// Keyword values → dedicated fluent methods or a fixed argument.
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
  "background-repeat": {
    repeat: 'bg("repeat")',
    "no-repeat": 'bg("no-repeat")',
    "repeat-x": 'bg("repeat-x")',
    "repeat-y": 'bg("repeat-y")',
    round: 'bg("repeat-round")',
    space: 'bg("repeat-space")',
    "repeat no-repeat": 'bg("repeat-x")',
    "no-repeat repeat": 'bg("repeat-y")',
  },
  "background-clip": {
    "border-box": 'bg("clip-border")',
    "padding-box": 'bg("clip-padding")',
    "content-box": 'bg("clip-content")',
    text: 'bg("clip-text")',
  },
  "background-attachment": {
    fixed: 'bg("fixed")',
    local: 'bg("local")',
    scroll: 'bg("scroll")',
  },
  "background-origin": {
    "border-box": 'bg("origin-border")',
    "padding-box": 'bg("origin-padding")',
    "content-box": 'bg("origin-content")',
  },
};

// aspect-ratio → .aspect(): integer ratios take the ratio arm, other static numbers the [..] arm
// (fluent-html's ratio arm is `${bigint}/${bigint}`, so "1.91/1" must be bracketed).
const INT_RATIO_RE = /^(\d+)\s*\/\s*(\d+)$/;
const NUMBER_RATIO_RE = /^\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?$/;

function aspectSuggestion(value: string): string | null {
  if (value.toLowerCase() === "auto") return '.aspect("auto")';
  const ratio = INT_RATIO_RE.exec(value);
  if (ratio) return `.aspect("${ratio[1]}/${ratio[2]}")`;
  if (NUMBER_RATIO_RE.test(value)) return `.aspect("[${value.replace(/\s+/g, "")}]")`;
  return null;
}

// A static CSS value inside a Tailwind [..] arm: spaces become underscores.
const bracket = (value: string): string => value.trim().replace(/\s+/g, "_");

const BG_SIZE_KEYWORDS = new Set(["auto", "cover", "contain"]);

function bgSizeSuggestion(value: string): string {
  const v = value.toLowerCase();
  return BG_SIZE_KEYWORDS.has(v) ? `.bg("${v}")` : `.bg("[length:${bracket(value)}]")`;
}

const VERTICAL = new Set(["top", "bottom"]);
const HORIZONTAL = new Set(["left", "right"]);

// Position keywords in either order ("center top", "left top") → fluent's names ("top",
// "top-left"), shared by object-position and background-position; null for anything else.
function positionKeyword(value: string): string | null {
  const words = value.toLowerCase().split(/\s+/);
  const vertical = words.filter((w) => VERTICAL.has(w));
  const horizontal = words.filter((w) => HORIZONTAL.has(w));
  const keywordsOnly = words.length <= 2 && words.every((w) => w === "center" || VERTICAL.has(w) || HORIZONTAL.has(w));
  if (!keywordsOnly || vertical.length > 1 || horizontal.length > 1) return null;
  return [...vertical, ...horizontal].join("-") || "center";
}

function objectPositionSuggestion(value: string): string {
  const keyword = positionKeyword(value);
  return keyword ? `.object("${keyword}")` : `.object("[${bracket(value)}]")`;
}

function bgPositionSuggestion(value: string): string {
  const keyword = positionKeyword(value);
  return keyword ? `.bg("${keyword}")` : `.bg("[position:${bracket(value)}]")`;
}

// A single filter function is the one functional value with a fluent form: blur() → .blur() /
// .backdropBlur() (the backdrop class also emits -webkit-backdrop-filter), drop-shadow() →
// .dropShadow(). Chained functions stay inline: Tailwind composes filters in a fixed order.
const FILTER_BLUR_METHOD: Record<string, string> = {
  filter: "blur",
  "backdrop-filter": "backdropBlur",
  "-webkit-backdrop-filter": "backdropBlur",
};
const FILTER_FUNCTION_RE = /^([a-z-]+)\(([^()]*)\)$/i;
const BLUR_LENGTH_RE = /^\d+(?:\.\d+)?(?:px|rem|em)$/i;
const BLUR_SCALE: Record<string, string> = {
  "4px": "xs", "8px": "sm", "12px": "md", "16px": "lg", "24px": "xl", "40px": "2xl", "64px": "3xl",
};

function filterSuggestion(prop: string, value: string): string | null {
  const m = FILTER_FUNCTION_RE.exec(value);
  if (!m) return null;
  const fn = m[1].toLowerCase();
  const arg = m[2].trim().toLowerCase();
  if (fn === "blur" && BLUR_LENGTH_RE.test(arg)) {
    return `.${FILTER_BLUR_METHOD[prop]}("${BLUR_SCALE[arg] ?? `[${arg}]`}")`;
  }
  // A static drop shadow; the named steps carry rgb() colors no hand-written value matches.
  if (fn === "drop-shadow" && prop === "filter" && arg) return `.dropShadow("[${bracket(m[2])}]")`;
  return null;
}

// The named shadow steps are layered rgb() shadows no hand-written value matches, so a static
// shadow goes to the [..] arm.
const SHADOW_METHOD: Record<string, string> = { "box-shadow": "shadow", "text-shadow": "textShadow" };

function shadowSuggestion(method: string, value: string): string {
  return value.toLowerCase() === "none" ? `.${method}("none")` : `.${method}("[${bracket(value)}]")`;
}

const CSS_PROP_ONLY = new Set(["text-indent", "vertical-align"]);

const MIX_BLEND_MODES = new Set([
  "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn",
  "hard-light", "soft-light", "difference", "exclusion", "hue", "saturation", "color", "luminosity",
  "plus-darker", "plus-lighter",
]);
// Tailwind has no bg-blend-plus-*, and fluent's TailwindBgBlendMode matches.
const BG_BLEND_MODES = new Set([...MIX_BLEND_MODES].filter((m) => !m.startsWith("plus-")));
const BLEND_PROPS: Record<string, { method: string; modes: Set<string> }> = {
  "mix-blend-mode": { method: "mixBlend", modes: MIX_BLEND_MODES },
  "background-blend-mode": { method: "bgBlend", modes: BG_BLEND_MODES },
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
  if (prop === "aspect-ratio") return aspectSuggestion(value);
  if (prop === "background-size") return bgSizeSuggestion(value);
  if (prop === "background-position") return bgPositionSuggestion(value);
  if (prop in SHADOW_METHOD) return shadowSuggestion(SHADOW_METHOD[prop], value);
  // No typed method; a static value is still .cssProp()'s job, not an inline style.
  if (CSS_PROP_ONLY.has(prop)) return `.cssProp("${prop}", "${value}")`;
  const blend = BLEND_PROPS[prop];
  if (blend) {
    const mode = value.toLowerCase();
    return blend.modes.has(mode) ? `.${blend.method}("${mode}")` : null;
  }
  if (prop === "object-position") return objectPositionSuggestion(value);

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
      // calc) are the legitimate escape hatch, except a single blur() or drop-shadow() filter.
      if (value.includes(EXPR) || prop.includes(EXPR)) return;
      const suggestion = prop in FILTER_BLUR_METHOD
        ? filterSuggestion(prop, value)
        : value.includes("(")
          ? null
          : suggestionFor(prop, value);
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
