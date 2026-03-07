import { Rule } from "eslint";

// Groups of mutually exclusive Tailwind classes
const CONFLICT_GROUPS: string[][] = [
  // Display
  ["block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid", "contents", "flow-root", "hidden"],

  // Position
  ["static", "fixed", "absolute", "relative", "sticky"],

  // Flex direction
  ["flex-row", "flex-row-reverse", "flex-col", "flex-col-reverse"],

  // Flex wrap
  ["flex-wrap", "flex-wrap-reverse", "flex-nowrap"],

  // Justify content
  ["justify-start", "justify-end", "justify-center", "justify-between", "justify-around", "justify-evenly", "justify-stretch"],

  // Align items
  ["items-start", "items-end", "items-center", "items-baseline", "items-stretch"],

  // Align content
  ["content-start", "content-end", "content-center", "content-between", "content-around", "content-evenly", "content-stretch"],

  // Align self
  ["self-auto", "self-start", "self-end", "self-center", "self-stretch", "self-baseline"],

  // Text align
  ["text-left", "text-center", "text-right", "text-justify", "text-start", "text-end"],

  // Vertical align
  ["align-baseline", "align-top", "align-middle", "align-bottom", "align-text-top", "align-text-bottom", "align-sub", "align-super"],

  // Font style
  ["italic", "not-italic"],

  // Font weight
  ["font-thin", "font-extralight", "font-light", "font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold", "font-black"],

  // Text transform
  ["uppercase", "lowercase", "capitalize", "normal-case"],

  // Text decoration
  ["underline", "overline", "line-through", "no-underline"],

  // Whitespace
  ["whitespace-normal", "whitespace-nowrap", "whitespace-pre", "whitespace-pre-line", "whitespace-pre-wrap", "whitespace-break-spaces"],

  // Word break
  ["break-normal", "break-words", "break-all", "break-keep"],

  // Overflow
  ["overflow-auto", "overflow-hidden", "overflow-clip", "overflow-visible", "overflow-scroll"],
  ["overflow-x-auto", "overflow-x-hidden", "overflow-x-clip", "overflow-x-visible", "overflow-x-scroll"],
  ["overflow-y-auto", "overflow-y-hidden", "overflow-y-clip", "overflow-y-visible", "overflow-y-scroll"],

  // Object fit
  ["object-contain", "object-cover", "object-fill", "object-none", "object-scale-down"],

  // Object position
  ["object-bottom", "object-center", "object-left", "object-left-bottom", "object-left-top", "object-right", "object-right-bottom", "object-right-top", "object-top"],

  // Visibility
  ["visible", "invisible", "collapse"],

  // Pointer events
  ["pointer-events-none", "pointer-events-auto"],

  // Resize
  ["resize-none", "resize-y", "resize-x", "resize"],

  // User select
  ["select-none", "select-text", "select-all", "select-auto"],

  // Cursor
  ["cursor-auto", "cursor-default", "cursor-pointer", "cursor-wait", "cursor-text", "cursor-move", "cursor-help", "cursor-not-allowed", "cursor-none", "cursor-context-menu", "cursor-progress", "cursor-cell", "cursor-crosshair", "cursor-vertical-text", "cursor-alias", "cursor-copy", "cursor-no-drop", "cursor-grab", "cursor-grabbing", "cursor-all-scroll", "cursor-col-resize", "cursor-row-resize", "cursor-n-resize", "cursor-e-resize", "cursor-s-resize", "cursor-w-resize", "cursor-ne-resize", "cursor-nw-resize", "cursor-se-resize", "cursor-sw-resize", "cursor-ew-resize", "cursor-ns-resize", "cursor-nesw-resize", "cursor-nwse-resize", "cursor-zoom-in", "cursor-zoom-out"],

  // List style type
  ["list-none", "list-disc", "list-decimal"],

  // List style position
  ["list-inside", "list-outside"],

  // Box sizing
  ["box-border", "box-content"],

  // Float
  ["float-start", "float-end", "float-right", "float-left", "float-none"],

  // Clear
  ["clear-start", "clear-end", "clear-left", "clear-right", "clear-both", "clear-none"],

  // Table layout
  ["table-auto", "table-fixed"],

  // Border collapse
  ["border-collapse", "border-separate"],
];

// Prefix-based conflict groups (classes that share a prefix conflict)
const PREFIX_CONFLICTS: string[] = [
  "p-",      // padding
  "px-", "py-", "pt-", "pb-", "pl-", "pr-", "ps-", "pe-",
  "m-",      // margin
  "mx-", "my-", "mt-", "mb-", "ml-", "mr-", "ms-", "me-",
  "w-",      // width
  "h-",      // height
  "min-w-", "max-w-", "min-h-", "max-h-",
  "gap-", "gap-x-", "gap-y-",
  "text-",   // text size (but be careful - text-red-500 etc is color)
  "leading-", // line height
  "tracking-", // letter spacing
  "rounded-", "rounded-t-", "rounded-r-", "rounded-b-", "rounded-l-", "rounded-tl-", "rounded-tr-", "rounded-bl-", "rounded-br-",
  "border-", // border width (note: border-red-500 is color)
  "opacity-",
  "z-",
  "order-",
  "grid-cols-", "grid-rows-",
  "col-span-", "row-span-",
  "basis-",
  "grow-", "shrink-",
  "indent-",
  "space-x-", "space-y-",
  "divide-x-", "divide-y-",
  "ring-",
  "blur-", "brightness-", "contrast-", "grayscale-", "hue-rotate-", "invert-", "saturate-", "sepia-",
  "backdrop-blur-", "backdrop-brightness-", "backdrop-contrast-", "backdrop-grayscale-", "backdrop-hue-rotate-", "backdrop-invert-", "backdrop-opacity-", "backdrop-saturate-", "backdrop-sepia-",
  "transition-", "duration-", "ease-", "delay-", "animate-",
  "scale-", "rotate-", "translate-x-", "translate-y-", "skew-x-", "skew-y-",
  "origin-",
  "accent-",
  "caret-",
  "fill-", "stroke-",
  "sr-",
  "columns-",
  "aspect-",
  "inset-", "inset-x-", "inset-y-", "top-", "right-", "bottom-", "left-", "start-", "end-",
  "outline-",
];

function getConflictGroup(className: string): string | null {
  // Strip responsive/state prefixes (e.g., sm:, hover:, dark:)
  const baseClass = className.replace(/^(sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|dark:|group-hover:|peer-)+/, "");

  // Check exact match groups
  for (const group of CONFLICT_GROUPS) {
    if (group.includes(baseClass)) {
      return group.join("|");
    }
  }

  // Check prefix-based conflicts
  for (const prefix of PREFIX_CONFLICTS) {
    if (baseClass.startsWith(prefix) || baseClass === prefix.replace(/-$/, "")) {
      return `prefix:${prefix}`;
    }
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow conflicting Tailwind classes in setClass()",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      conflictingClasses: "Conflicting classes '{{first}}' and '{{second}}' - only one will take effect.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function checkForConflicts(node: any, value: string, nodeStart: number, seen: Map<string, string>) {
      const classes = value.split(/\s+/).filter(Boolean);

      let currentIndex = 0;
      for (const className of classes) {
        const classIndex = value.indexOf(className, currentIndex);
        currentIndex = classIndex + className.length;

        const group = getConflictGroup(className);
        if (group) {
          const existing = seen.get(group);
          if (existing && existing !== className) {
            context.report({
              node,
              messageId: "conflictingClasses",
              data: { first: existing, second: className },
              loc: {
                start: context.getSourceCode().getLocFromIndex(nodeStart + classIndex),
                end: context.getSourceCode().getLocFromIndex(nodeStart + classIndex + className.length),
              },
            });
          } else {
            seen.set(group, className);
          }
        }
      }
    }

    function checkStringNode(node: any, seen: Map<string, string>) {
      if (node.type === "Literal" && typeof node.value === "string") {
        checkForConflicts(node, node.value, node.range[0] + 1, seen);
      }
      if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          if (quasi.value.cooked) {
            checkForConflicts(quasi, quasi.value.cooked, quasi.range[0] + 1, seen);
          }
        }
      }
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression") return;
        if (node.callee.property.type !== "Identifier") return;

        const methodName = node.callee.property.name;

        if (methodName === "setClasses") {
          if (node.arguments.length === 0) return;
          const arg = node.arguments[0];
          if (arg.type !== "ArrayExpression") return;
          // Share a single seen map across all elements to catch cross-element conflicts
          const seen = new Map<string, string>();
          for (const element of arg.elements) {
            if (element) checkStringNode(element, seen);
          }
          return;
        }

        if (methodName !== "setClass") return;
        if (node.arguments.length === 0) return;

        const seen = new Map<string, string>();
        checkStringNode(node.arguments[0], seen);
      },
    };
  },
};

export = rule;
