import { Rule } from "eslint";

// Map of attribute names to their dedicated setter methods
// Only includes the most common standard HTML attributes
const ATTRIBUTE_TO_METHOD: Record<string, string> = {
  // Common across many tags
  type: "setType",
  name: "setName",
  value: "setValue",
  placeholder: "setPlaceholder",
  src: "setSrc",
  href: "setHref",
  alt: "setAlt",
  width: "setWidth",
  height: "setHeight",
  action: "setAction",
  method: "setMethod",
  target: "setTarget",
  rel: "setRel",
  for: "setFor",
  // Global / accessibility (1:1 string setters)
  role: "setRole",
  title: "setTitle",
  // Form attributes
  min: "setMin",
  max: "setMax",
  step: "setStep",
  pattern: "setPattern",
  minlength: "setMinlength",
  maxlength: "setMaxlength",
  autocomplete: "setAutocomplete",
  accept: "setAccept",
  rows: "setRows",
  cols: "setCols",
  wrap: "setWrap",
  enctype: "setEnctype",
  list: "setList",
  size: "setSize",
  // Media attributes
  loading: "setLoading",
  srcset: "setSrcset",
  sizes: "setSizes",
  crossorigin: "setCrossOrigin",
  poster: "setPoster",
  preload: "setPreload",
  inputmode: "setInputmode",
  hreflang: "setHreflang",
  // Interactive
  download: "setDownload",
  // Embedded
  sandbox: "setSandbox",
  allow: "setAllow",
  // SVG common
  viewBox: "setViewBox",
  xmlns: "setXmlns",
  fill: "setFill",
  stroke: "setStroke",
  "stroke-width": "setStrokeWidth",
  "stroke-linecap": "setStrokeLinecap",
  "stroke-linejoin": "setStrokeLinejoin",
  "stroke-dasharray": "setStrokeDasharray",
  transform: "setTransform",
  // SVG element-specific
  cx: "setCx",
  cy: "setCy",
  r: "setR",
  rx: "setRx",
  ry: "setRy",
  x1: "setX1",
  y1: "setY1",
  x2: "setX2",
  y2: "setY2",
  d: "setD",
  "fill-rule": "setFillRule",
  "clip-rule": "setClipRule",
  points: "setPoints",
  "text-anchor": "setTextAnchor",
  "dominant-baseline": "setDominantBaseline",
  "font-size": "setFontSize",
  "font-family": "setFontFamily",
  dx: "setDx",
  dy: "setDy",
  // Document
  charset: "setCharset",
  content: "setContent",
  property: "setProperty",
  "http-equiv": "setHttpEquiv",
  // Table
  colspan: "setColspan",
  rowspan: "setRowspan",
  scope: "setScope",
  span: "setSpan",
  // NOTE: boolean attributes (disabled/checked/readonly/multiple/selected/open/…) have
  // NO dedicated setters in v6 — they are set via `.toggle("name")`. The `prefer-toggle`
  // rule handles `addAttribute(<bool>, …)`; keeping them out of this map avoids suggesting
  // removed setters.
  // Button attributes
  formaction: "setFormaction",
  formmethod: "setFormmethod",
  // Link attributes
  referrerpolicy: "setReferrerPolicy",
  // Area attributes
  shape: "setShape",
  coords: "setCoords",
  // Option/Optgroup
  label: "setLabel",
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer dedicated setter methods over addAttribute() for standard HTML and SVG attributes. e.g. .setType("submit") instead of .addAttribute("type", "submit")',
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferSetMethod:
        'Use .{{method}}({{value}}) instead of .addAttribute("{{attr}}", {{value}}). Dedicated methods provide type safety and autocomplete.',
      preferTypedSetter:
        'Use .{{suggestion}} instead of .addAttribute("{{attr}}", …). Typed setters give autocomplete and validation (e.g. aria typos become compile errors).',
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    // Object-arg / specially-typed setters — reported but NOT auto-fixed, because
    // the transform isn't a safe verbatim text swap (object literal, or a number-typed
    // value that would no longer be a quoted string).
    function typedSetterSuggestion(attr: string): string | null {
      if (attr.startsWith("aria-")) return `setAria({ ${attr.slice(5)}: … })`;
      if (attr.startsWith("data-")) return "setDataAttrs({ … })";
      if (attr === "style") return "setStyle(…) / setStyles({ … })";
      if (attr === "tabindex") return "setTabindex(n)";
      return null;
    }

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

        // Only check string literal attribute names
        if (attrArg.type !== "Literal" || typeof attrArg.value !== "string") return;

        const attrName = attrArg.value;

        // 1. Dedicated 1:1 string setter — auto-fixable (value passed through verbatim).
        const method = ATTRIBUTE_TO_METHOD[attrName];
        if (method) {
          if (node.arguments.length < 2) return;
          const valueArg = node.arguments[1];
          const valueText = context.sourceCode.getText(valueArg);
          context.report({
            node,
            messageId: "preferSetMethod",
            data: { method, attr: attrName, value: valueText },
            fix(fixer) {
              const dotStart = node.callee.property.range[0] - 1; // -1 for the dot
              return fixer.replaceTextRange(
                [dotStart, node.range[1]],
                `.${method}(${valueText})`
              );
            },
          });
          return;
        }

        // 2. Object-arg / specially-typed setter (aria-*/data-*/style/tabindex) — report only.
        const suggestion = typedSetterSuggestion(attrName);
        if (suggestion) {
          context.report({
            node,
            messageId: "preferTypedSetter",
            data: { attr: attrName, suggestion },
          });
        }
      },
    };
  },
};

export = rule;
