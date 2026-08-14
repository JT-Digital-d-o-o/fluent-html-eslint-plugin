import { Rule } from "eslint";
// The typed styling surface is derived from fluent-html/class-vocab (C-05) —
// see scripts/gen-vocab.mjs; pinned by test/vocab-drift.mjs.
import { VOCAB_METHODS } from "../vocab.generated";

// The safelist hazard on the *typed* surface: `no-dynamic-class-argument` guards
// addClass/setClass/cssClass, but a non-literal argument into any of the ~159
// typed styling methods (`.bg(color)`, `.w("px", width)`) is equally invisible
// to the safelist extractor — it fails the css build, which single-pass agents
// never run. This rule moves that failure to lint time with the extractor's own
// remediation. Ternaries are flagged even with two literal branches: the
// extractor resolves literals only ("anything else (variable, ternary, call) →
// unresolved"), so `cond ? "a" : "b"` still fails the build — branch with
// .when()/.whenElse() instead.

const STYLING_METHODS: ReadonlySet<string> = new Set(VOCAB_METHODS);

// Chain callbacks whose parameter is a Tag — a vocab call on that parameter is
// fluent styling even with no element constructor in sight.
const FLUENT_CONTEXT_METHODS: ReadonlySet<string> = new Set([
  "when",
  "whenElse",
  "whenMatch",
  "apply",
]);

// Same set as prefer-variadic-children/prefer-foreach; kept local so the rules
// stay independent.
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

function isStaticArg(node: any): boolean {
  if (node.type === "Literal") return true;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return true;
  if (node.type === "Identifier" && node.name === "undefined") return true;
  if (node.type === "UnaryExpression" && node.operator === "-" && node.argument.type === "Literal") {
    return true;
  }
  return false;
}

type ChainInfo = {
  rootElementCall: boolean;
  rootIdentifier: string | null;
  vocabLinks: number;
  stringEvidence: boolean;
};

// A fluent styling value never contains whitespace and never starts with a
// selector sigil — "#chart" (d3), ".box" (gsap), "border-box padding-box" are
// not fluent tokens, "6", "primary", "px", "[13px]", "success/10" are.
function isTokenShaped(v: string): boolean {
  return v.length > 0 && !/\s/.test(v) && !/^[#.]/.test(v);
}

function hasStringLiteralArg(call: any): boolean {
  return call.arguments.some(
    (arg: any) =>
      (arg.type === "Literal" && typeof arg.value === "string" && isTokenShaped(arg.value)) ||
      (arg.type === "TemplateLiteral" &&
        arg.expressions.length === 0 &&
        isTokenShaped(String(arg.quasis[0]?.value?.cooked ?? ""))),
  );
}

function walkChain(node: any): ChainInfo {
  let vocabLinks = 1;
  let rootElementCall = false;
  let rootIdentifier: string | null = null;
  // Fluent styling chains carry token-shaped string-literal arguments ("6",
  // "primary", "px"); colliding non-fluent chains carry none (sharp's
  // .rotate().resize(w, h)) or selector strings (d3's .select("#chart")) —
  // require the evidence before the link-count gate fires.
  let stringEvidence = hasStringLiteralArg(node);

  let cur: any = node.callee.object;
  for (;;) {
    if (cur.type === "CallExpression") {
      if (
        cur.callee.type === "MemberExpression" &&
        !cur.callee.computed &&
        cur.callee.property.type === "Identifier"
      ) {
        if (STYLING_METHODS.has(cur.callee.property.name)) {
          vocabLinks++;
          if (hasStringLiteralArg(cur)) stringEvidence = true;
        }
        cur = cur.callee.object;
        continue;
      }
      if (cur.callee.type === "Identifier" && ELEMENT_FUNCTIONS.has(cur.callee.name)) {
        rootElementCall = true;
      }
      break;
    }
    if (cur.type === "Identifier") rootIdentifier = cur.name;
    break;
  }

  let p: any = node;
  while (
    p.parent &&
    p.parent.type === "MemberExpression" &&
    p.parent.object === p &&
    p.parent.parent &&
    p.parent.parent.type === "CallExpression" &&
    p.parent.parent.callee === p.parent
  ) {
    if (
      !p.parent.computed &&
      p.parent.property.type === "Identifier" &&
      STYLING_METHODS.has(p.parent.property.name)
    ) {
      vocabLinks++;
      if (hasStringLiteralArg(p.parent.parent)) stringEvidence = true;
    }
    p = p.parent.parent;
  }

  return { rootElementCall, rootIdentifier, vocabLinks, stringEvidence };
}

function isWhenMatchCaseValue(fn: any): boolean {
  const property = fn.parent;
  if (!property || property.type !== "Property" || property.value !== fn) return false;
  const obj = property.parent;
  if (!obj || obj.type !== "ObjectExpression") return false;
  const call = obj.parent;
  return (
    !!call &&
    call.type === "CallExpression" &&
    call.arguments.includes(obj) &&
    call.callee.type === "MemberExpression" &&
    !call.callee.computed &&
    call.callee.property.type === "Identifier" &&
    call.callee.property.name === "whenMatch"
  );
}

function isParamRooted(node: any, rootIdentifier: string): boolean {
  let cur: any = node.parent;
  while (cur) {
    if (
      cur.type === "ArrowFunctionExpression" ||
      cur.type === "FunctionExpression" ||
      cur.type === "FunctionDeclaration"
    ) {
      if (
        cur.params.some((param: any) => param.type === "Identifier" && param.name === rootIdentifier)
      ) {
        return true;
      }
    }
    cur = cur.parent;
  }
  return false;
}

function isTagCallbackParam(node: any, rootIdentifier: string, sourceCode: any): boolean {
  let cur: any = node.parent;
  while (cur) {
    if (cur.type === "ArrowFunctionExpression" || cur.type === "FunctionExpression") {
      const owns = cur.params.some(
        (param: any) => param.type === "Identifier" && param.name === rootIdentifier,
      );
      if (owns) {
        if (
          cur.parent &&
          cur.parent.type === "CallExpression" &&
          cur.parent.arguments.includes(cur) &&
          cur.parent.callee.type === "MemberExpression" &&
          !cur.parent.callee.computed &&
          cur.parent.callee.property.type === "Identifier" &&
          FLUENT_CONTEXT_METHODS.has(cur.parent.callee.property.name)
        ) {
          return true;
        }
        // .whenMatch case branches receive the Tag as a property value, not a
        // direct argument: Span(s).whenMatch(s, { active: t => t.bg(…) }).
        if (isWhenMatchCaseValue(cur)) return true;
        let up: any = cur.parent;
        while (up) {
          if (up.type === "VariableDeclarator" && up.id && (up.id as any).typeAnnotation) {
            const annotation = sourceCode.getText((up.id as any).typeAnnotation);
            if (/\bStyler(For)?\b/.test(annotation)) return true;
          }
          up = up.parent;
        }
      }
    }
    cur = cur.parent;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow non-literal arguments to the typed styling methods — the safelist extractor cannot resolve them, so it fails the css build (and a dropped class renders unstyled under Tailwind v4)",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      dynamicArg:
        ".{{method}}({{argText}}) uses a non-literal argument the safelist extractor can't resolve — the css build fails on it, and a dropped class is invisible to Tailwind v4 (renders unstyled). Inline the literal (branch with .when()/.whenElse()/.whenMatch() or Match, one literal per branch), or add the token to staticManifest (defineTheme()).",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const sourceCode = context.sourceCode;
    return {
      CallExpression(node: any) {
        if (
          node.callee.type !== "MemberExpression" ||
          node.callee.computed ||
          node.callee.property.type !== "Identifier"
        ) {
          return;
        }
        const method: string = node.callee.property.name;
        if (!STYLING_METHODS.has(method)) return;
        if (node.arguments.length === 0) return;

        const dynamicArg = node.arguments.find((arg: any) => !isStaticArg(arg));
        if (dynamicArg === undefined) return;

        const chain = walkChain(node);
        // Module-object chains (d3, knex, gsap, sharp) can stack vocab-named
        // links; the link-count gate additionally requires the chain root to
        // be a parameter of an enclosing function — a receiver a fluent
        // callback or styler was handed, never an imported library object.
        const fluent =
          chain.rootElementCall ||
          (chain.rootIdentifier !== null &&
            ((chain.vocabLinks >= 2 &&
              chain.stringEvidence &&
              isParamRooted(node, chain.rootIdentifier)) ||
              isTagCallbackParam(node, chain.rootIdentifier, sourceCode)));
        if (!fluent) return;

        const argText = sourceCode.getText(dynamicArg);
        context.report({
          node: dynamicArg,
          messageId: "dynamicArg",
          data: {
            method,
            argText: argText.length > 40 ? `${argText.slice(0, 40)}…` : argText,
          },
        });
      },
    };
  },
};

export = rule;
