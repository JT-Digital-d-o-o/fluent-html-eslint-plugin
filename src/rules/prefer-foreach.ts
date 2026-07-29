import { Rule } from "eslint";

// Element functions that accept variadic View children. A `.map()` sitting in an
// argument slot of one of these is producing children — the case ForEach exists for.
// (Same set as prefer-variadic-children; kept local so the rules stay independent.)
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

// A `<obj>.map(...)` call expression (not computed, not `.flatMap`/etc.).
function isMapCall(n: any): boolean {
  return (
    n &&
    n.type === "CallExpression" &&
    n.callee.type === "MemberExpression" &&
    !n.callee.computed &&
    n.callee.property.type === "Identifier" &&
    n.callee.property.name === "map" &&
    n.arguments.length >= 1
  );
}

// Fixable only when the fix is behaviour-preserving: exactly one `.map` argument
// (a second arg is `thisArg`, which ForEach has no slot for) and a callback whose
// arity is ≤ 2 (ForEach passes only `(item, index)` — a callback reading the 3rd
// `array` param would silently break). A bare named reference (`.map(Card)`) is fine.
function isFixableCallback(mapCall: any): boolean {
  if (mapCall.arguments.length !== 1) return false;
  const cb = mapCall.arguments[0];
  if (cb.type === "Identifier") return true;
  if (cb.type === "ArrowFunctionExpression" || cb.type === "FunctionExpression") {
    return cb.params.length <= 2;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Use ForEach for element children, not Array.map(). Only ForEach carries the count/range overloads and the ForEachKeyed morph-stable upgrade path; a spread/array .map() forfeits both.",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      preferForeach:
        "Use ForEach({{list}}, …) for {{name}}'s children, not .map(). ForEach carries the count/range overloads and the ForEachKeyed upgrade path; a spread/array .map() forfeits both.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const sourceCode = context.sourceCode;

    // Imports are visited before body CallExpressions (source order), so by the
    // time we report we know whether ForEach needs adding to the fluent-html import.
    let fluentImport: any = null;
    let foreachImported = false;
    let importFixEmitted = false;

    function reportViolation(elementName: string, mapCall: any, reportNode: any, isSpread: boolean) {
      const objText = sourceCode.getText(mapCall.callee.object);
      const fixable = isFixableCallback(mapCall);

      context.report({
        node: reportNode,
        messageId: "preferForeach",
        data: { name: elementName, list: objText },
        fix: fixable
          ? (fixer) => {
              const fnText = sourceCode.getText(mapCall.arguments[0]);
              const fixes = [
                // Replacing reportNode's range drops the leading `...` for a spread
                // (reportNode is the SpreadElement) and swaps the call for an array child.
                fixer.replaceText(reportNode, `ForEach(${objText}, ${fnText})`),
              ];
              // Add ForEach to the existing fluent-html import once, if missing.
              if (!foreachImported && !importFixEmitted && fluentImport) {
                const named = fluentImport.specifiers.filter((s: any) => s.type === "ImportSpecifier");
                if (named.length > 0) {
                  fixes.push(fixer.insertTextAfter(named[named.length - 1], ", ForEach"));
                  importFixEmitted = true;
                }
              }
              return fixes;
            }
          : undefined,
      });
    }

    return {
      ImportDeclaration(node: any) {
        if (node.source.value !== "fluent-html") return;
        fluentImport = node;
        if (
          node.specifiers.some(
            (s: any) => s.type === "ImportSpecifier" && s.imported.name === "ForEach",
          )
        ) {
          foreachImported = true;
        }
      },

      CallExpression(node: any) {
        if (node.callee.type !== "Identifier" || !ELEMENT_FUNCTIONS.has(node.callee.name)) return;

        for (const arg of node.arguments) {
          if (isMapCall(arg)) {
            reportViolation(node.callee.name, arg, arg, false);
          } else if (arg.type === "SpreadElement" && isMapCall(arg.argument)) {
            reportViolation(node.callee.name, arg.argument, arg, true);
          }
        }
      },
    };
  },
};

export = rule;
