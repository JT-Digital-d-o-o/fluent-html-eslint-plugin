import { Rule } from "eslint";

const ELEMENT_FUNCTIONS = new Set([
  // Structural
  "Div", "Main", "Header", "Footer", "Section", "Article", "Nav", "Aside",
  "Figure", "Figcaption", "Address", "Hgroup", "Search",
  // Text
  "P", "H1", "H2", "H3", "H4", "H5", "H6", "Span", "Blockquote", "Pre", "Code", "Hr", "Br", "Wbr",
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
  "Iframe", "ObjectEl", "Embed",
  // Links
  "A", "MapEl", "Area",
  // Document
  "HTML", "Head", "Body", "Title", "Noscript", "Template",
  // Data
  "Time", "Data", "Progress", "Meter",
  // Web Components
  "Slot",
  // Utilities
  "El",
]);

function isElementCall(node: any): boolean {
  return node.type === "CallExpression" &&
    node.callee.type === "Identifier" &&
    ELEMENT_FUNCTIONS.has(node.callee.name);
}

function isLiteral(node: any): boolean {
  if (node.type === "Literal") return true;
  if (node.type === "TemplateLiteral") return true;
  if (node.type === "NullLiteral") return true;
  // null is parsed as Literal with value null
  return false;
}

function couldBeViewElement(node: any): boolean {
  if (isLiteral(node)) return false;
  if (isElementCall(node)) return true;
  // Chain like Div().addClass("x") — walk up the member expression
  if (node.type === "CallExpression" && node.callee.type === "MemberExpression") {
    return couldBeViewElement(node.callee.object);
  }
  // Nested ternary
  if (node.type === "ConditionalExpression") {
    return couldBeViewElement(node.consequent) || couldBeViewElement(node.alternate);
  }
  // Unknown (variable, non-element function call, etc.) — don't flag
  return false;
}

function hasSideWithViewElement(node: any): boolean {
  return couldBeViewElement(node.consequent) || couldBeViewElement(node.alternate);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow ternary expressions as children in View builder element functions. Use .when() instead.",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      noTernaryInViewBuilder:
        "Avoid ternary expressions as children in {{name}}(). Use .when(condition, t => t.children(...)) instead.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    return {
      CallExpression(node: any) {
        if (!isElementCall(node)) return;

        const funcName = node.callee.name;

        for (const arg of node.arguments) {
          if (arg.type === "ConditionalExpression" && hasSideWithViewElement(arg)) {
            context.report({
              node: arg,
              messageId: "noTernaryInViewBuilder",
              data: { name: funcName },
            });
          }

          // Also check inside array children: Div([cond ? A() : B()])
          if (arg.type === "ArrayExpression") {
            for (const el of arg.elements) {
              if (el && el.type === "ConditionalExpression" && hasSideWithViewElement(el)) {
                context.report({
                  node: el,
                  messageId: "noTernaryInViewBuilder",
                  data: { name: funcName },
                });
              }
            }
          }
        }
      },
    };
  },
};

export = rule;
