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
  crossorigin: "setCrossorigin",
  poster: "setPoster",
  preload: "setPreload",
  // Interactive
  download: "setDownload",
  // Embedded
  sandbox: "setSandbox",
  allow: "setAllow",
  // SVG
  viewBox: "setViewBox",
  xmlns: "setXmlns",
  fill: "setFill",
  stroke: "setStroke",
  // Document
  charset: "setCharset",
  content: "setContent",
  property: "setProperty",
  // Table
  colspan: "setColspan",
  rowspan: "setRowspan",
  scope: "setScope",
  span: "setSpan",
};

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer dedicated setter methods over addAttribute() for standard HTML attributes. e.g. .setType("submit") instead of .addAttribute("type", "submit")',
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferSetMethod:
        'Use .{{method}}({{value}}) instead of .addAttribute("{{attr}}", {{value}}). Dedicated methods provide type safety and autocomplete.',
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

        if (node.arguments.length < 2) return;
        const attrArg = node.arguments[0];
        const valueArg = node.arguments[1];

        // Only check string literal attribute names
        if (attrArg.type !== "Literal" || typeof attrArg.value !== "string") return;

        const attrName = attrArg.value;
        const method = ATTRIBUTE_TO_METHOD[attrName];
        if (!method) return;

        const sourceCode = context.getSourceCode();
        const valueText = sourceCode.getText(valueArg);

        context.report({
          node,
          messageId: "preferSetMethod",
          data: {
            method,
            attr: attrName,
            value: valueText,
          },
          fix(fixer) {
            // Replace .addAttribute("attr", value) with .setMethod(value)
            const dotStart = node.callee.property.range[0] - 1; // -1 for the dot
            return fixer.replaceTextRange(
              [dotStart, node.range[1]],
              `.${method}(${valueText})`
            );
          },
        });
      },
    };
  },
};

export = rule;
