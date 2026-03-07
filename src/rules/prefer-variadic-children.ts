import { Rule } from "eslint";

// Element functions that accept variadic children
const ELEMENT_FUNCTIONS = new Set([
  // Structural
  "Div", "Main", "Header", "Footer", "Section", "Article", "Nav", "Aside",
  "Figure", "Figcaption", "Address", "Hgroup", "Search",
  // Text
  "P", "H1", "H2", "H3", "H4", "H5", "H6", "Span", "Blockquote", "Pre", "Code",
  // Inline
  "Strong", "Em", "B", "I", "U", "S", "Mark", "Small", "Sub", "Sup",
  "Abbr", "Cite", "Q", "Dfn", "Kbd", "Samp", "Var", "Bdi", "Bdo", "Ruby", "Rt", "Rp",
  // Lists
  "Ul", "Ol", "Li", "Dl", "Dt", "Dd", "Menu",
  // Tables
  "Table", "Thead", "Tbody", "Tfoot", "Tr", "Th", "Td", "Caption", "Colgroup", "Col",
  // Forms
  "Form", "Input", "Textarea", "Button", "Label", "Select", "Option", "Optgroup",
  "Datalist", "Fieldset", "Legend", "Output",
  // Interactive
  "Details", "Summary", "Dialog",
  // Media
  "Img", "Picture", "Source", "Video", "Audio", "Track", "Canvas", "Svg",
  // SVG
  "Path", "Circle", "Rect", "Line", "Polygon", "Polyline", "Ellipse", "G", "Defs", "Use", "Text", "Tspan",
  // Embedded
  "Iframe", "Embed",
  // Links
  "A", "Area",
  // Document
  "HTML", "Head", "Body", "Title", "Noscript", "Template",
  // Data
  "Time", "Data", "Progress", "Meter",
  // Web Components
  "Slot",
  // Utilities
  "El",
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer variadic children Div(a, b) over array form Div([a, b])",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferVariadic:
        "Use variadic children {{name}}(a, b) instead of array form {{name}}([a, b]).",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        // Match direct calls: Div([...])
        let funcName: string | null = null;

        if (node.callee.type === "Identifier" && ELEMENT_FUNCTIONS.has(node.callee.name)) {
          funcName = node.callee.name;
        }

        if (!funcName) return;

        // Must have exactly one argument that is an ArrayExpression
        if (node.arguments.length !== 1) return;
        const arg = node.arguments[0];
        if (arg.type !== "ArrayExpression") return;

        // Must have 2+ elements (a single-element array is ambiguous with the variadic form)
        if (arg.elements.length < 2) return;

        // Skip if any element is a spread — can't convert to variadic
        if (arg.elements.some((el: any) => el && el.type === "SpreadElement")) return;

        const sourceCode = context.getSourceCode();

        context.report({
          node: arg,
          messageId: "preferVariadic",
          data: { name: funcName },
          fix(fixer) {
            // Replace [a, b, c] with a, b, c (remove the brackets)
            const innerText = arg.elements
              .map((el: any) => sourceCode.getText(el))
              .join(", ");
            return fixer.replaceText(arg, innerText);
          },
        });
      },
    };
  },
};

export = rule;
