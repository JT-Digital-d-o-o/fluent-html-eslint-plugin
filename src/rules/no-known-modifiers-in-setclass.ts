import { Rule } from "eslint";

// Configuration for auto-fixable patterns
interface FixablePattern {
  // The prefix or exact string to match
  pattern: string;
  // The method name to use
  methodName: string;
  // If true, pattern is an exact match (no value extraction)
  exactMatch?: boolean;
  // For exact matches, the value to pass (if any)
  fixedValue?: string;
  // For directional patterns (e.g., padding('x', value))
  direction?: string;
}

// Fixable patterns for auto-fix support
// Order matters: more specific patterns should come first
const FIXABLE_PATTERNS: FixablePattern[] = [
  // Padding - directional first (more specific)
  { pattern: "px-", methodName: "padding", direction: "x" },
  { pattern: "py-", methodName: "padding", direction: "y" },
  { pattern: "pt-", methodName: "padding", direction: "t" },
  { pattern: "pb-", methodName: "padding", direction: "b" },
  { pattern: "pl-", methodName: "padding", direction: "l" },
  { pattern: "pr-", methodName: "padding", direction: "r" },
  { pattern: "p-", methodName: "padding" },

  // Margin - directional first
  { pattern: "mx-", methodName: "margin", direction: "x" },
  { pattern: "my-", methodName: "margin", direction: "y" },
  { pattern: "mt-", methodName: "margin", direction: "t" },
  { pattern: "mb-", methodName: "margin", direction: "b" },
  { pattern: "ml-", methodName: "margin", direction: "l" },
  { pattern: "mr-", methodName: "margin", direction: "r" },
  { pattern: "m-", methodName: "margin" },

  // Background colors
  { pattern: "bg-", methodName: "background" },

  // Text colors (specific colors before generic text-)
  { pattern: "text-white", methodName: "textColor", exactMatch: true, fixedValue: "white" },
  { pattern: "text-black", methodName: "textColor", exactMatch: true, fixedValue: "black" },
  { pattern: "text-transparent", methodName: "textColor", exactMatch: true, fixedValue: "transparent" },
  { pattern: "text-current", methodName: "textColor", exactMatch: true, fixedValue: "current" },

  // Text alignment (before generic text- patterns)
  { pattern: "text-left", methodName: "textAlign", exactMatch: true, fixedValue: "left" },
  { pattern: "text-center", methodName: "textAlign", exactMatch: true, fixedValue: "center" },
  { pattern: "text-right", methodName: "textAlign", exactMatch: true, fixedValue: "right" },
  { pattern: "text-justify", methodName: "textAlign", exactMatch: true, fixedValue: "justify" },
  { pattern: "text-start", methodName: "textAlign", exactMatch: true, fixedValue: "start" },
  { pattern: "text-end", methodName: "textAlign", exactMatch: true, fixedValue: "end" },

  // Text sizes
  { pattern: "text-xs", methodName: "textSize", exactMatch: true, fixedValue: "xs" },
  { pattern: "text-sm", methodName: "textSize", exactMatch: true, fixedValue: "sm" },
  { pattern: "text-base", methodName: "textSize", exactMatch: true, fixedValue: "base" },
  { pattern: "text-lg", methodName: "textSize", exactMatch: true, fixedValue: "lg" },
  { pattern: "text-xl", methodName: "textSize", exactMatch: true, fixedValue: "xl" },
  { pattern: "text-2xl", methodName: "textSize", exactMatch: true, fixedValue: "2xl" },
  { pattern: "text-3xl", methodName: "textSize", exactMatch: true, fixedValue: "3xl" },
  { pattern: "text-4xl", methodName: "textSize", exactMatch: true, fixedValue: "4xl" },
  { pattern: "text-5xl", methodName: "textSize", exactMatch: true, fixedValue: "5xl" },
  { pattern: "text-6xl", methodName: "textSize", exactMatch: true, fixedValue: "6xl" },
  { pattern: "text-7xl", methodName: "textSize", exactMatch: true, fixedValue: "7xl" },
  { pattern: "text-8xl", methodName: "textSize", exactMatch: true, fixedValue: "8xl" },
  { pattern: "text-9xl", methodName: "textSize", exactMatch: true, fixedValue: "9xl" },

  // Text colors (prefix patterns for color classes like text-red-500)
  { pattern: "text-slate-", methodName: "textColor" },
  { pattern: "text-gray-", methodName: "textColor" },
  { pattern: "text-zinc-", methodName: "textColor" },
  { pattern: "text-neutral-", methodName: "textColor" },
  { pattern: "text-stone-", methodName: "textColor" },
  { pattern: "text-red-", methodName: "textColor" },
  { pattern: "text-orange-", methodName: "textColor" },
  { pattern: "text-amber-", methodName: "textColor" },
  { pattern: "text-yellow-", methodName: "textColor" },
  { pattern: "text-lime-", methodName: "textColor" },
  { pattern: "text-green-", methodName: "textColor" },
  { pattern: "text-emerald-", methodName: "textColor" },
  { pattern: "text-teal-", methodName: "textColor" },
  { pattern: "text-cyan-", methodName: "textColor" },
  { pattern: "text-sky-", methodName: "textColor" },
  { pattern: "text-blue-", methodName: "textColor" },
  { pattern: "text-indigo-", methodName: "textColor" },
  { pattern: "text-violet-", methodName: "textColor" },
  { pattern: "text-purple-", methodName: "textColor" },
  { pattern: "text-fuchsia-", methodName: "textColor" },
  { pattern: "text-pink-", methodName: "textColor" },
  { pattern: "text-rose-", methodName: "textColor" },

  // Border colors
  { pattern: "border-slate-", methodName: "borderColor" },
  { pattern: "border-gray-", methodName: "borderColor" },
  { pattern: "border-zinc-", methodName: "borderColor" },
  { pattern: "border-neutral-", methodName: "borderColor" },
  { pattern: "border-stone-", methodName: "borderColor" },
  { pattern: "border-red-", methodName: "borderColor" },
  { pattern: "border-orange-", methodName: "borderColor" },
  { pattern: "border-amber-", methodName: "borderColor" },
  { pattern: "border-yellow-", methodName: "borderColor" },
  { pattern: "border-lime-", methodName: "borderColor" },
  { pattern: "border-green-", methodName: "borderColor" },
  { pattern: "border-emerald-", methodName: "borderColor" },
  { pattern: "border-teal-", methodName: "borderColor" },
  { pattern: "border-cyan-", methodName: "borderColor" },
  { pattern: "border-sky-", methodName: "borderColor" },
  { pattern: "border-blue-", methodName: "borderColor" },
  { pattern: "border-indigo-", methodName: "borderColor" },
  { pattern: "border-violet-", methodName: "borderColor" },
  { pattern: "border-purple-", methodName: "borderColor" },
  { pattern: "border-fuchsia-", methodName: "borderColor" },
  { pattern: "border-pink-", methodName: "borderColor" },
  { pattern: "border-rose-", methodName: "borderColor" },
  { pattern: "border-white", methodName: "borderColor", exactMatch: true, fixedValue: "white" },
  { pattern: "border-black", methodName: "borderColor", exactMatch: true, fixedValue: "black" },
  { pattern: "border-transparent", methodName: "borderColor", exactMatch: true, fixedValue: "transparent" },

  // Font weight
  { pattern: "font-thin", methodName: "fontWeight", exactMatch: true, fixedValue: "thin" },
  { pattern: "font-extralight", methodName: "fontWeight", exactMatch: true, fixedValue: "extralight" },
  { pattern: "font-light", methodName: "fontWeight", exactMatch: true, fixedValue: "light" },
  { pattern: "font-normal", methodName: "fontWeight", exactMatch: true, fixedValue: "normal" },
  { pattern: "font-medium", methodName: "fontWeight", exactMatch: true, fixedValue: "medium" },
  { pattern: "font-semibold", methodName: "fontWeight", exactMatch: true, fixedValue: "semibold" },
  { pattern: "font-bold", methodName: "fontWeight", exactMatch: true, fixedValue: "bold" },
  { pattern: "font-extrabold", methodName: "fontWeight", exactMatch: true, fixedValue: "extrabold" },
  { pattern: "font-black", methodName: "fontWeight", exactMatch: true, fixedValue: "black" },

  // Sizing
  { pattern: "max-w-", methodName: "maxW" },
  { pattern: "min-w-", methodName: "minW" },
  { pattern: "max-h-", methodName: "maxH" },
  { pattern: "min-h-", methodName: "minH" },
  { pattern: "w-", methodName: "w" },
  { pattern: "h-", methodName: "h" },

  // Flexbox
  { pattern: "flex-row-reverse", methodName: "flexDirection", exactMatch: true, fixedValue: "row-reverse" },
  { pattern: "flex-col-reverse", methodName: "flexDirection", exactMatch: true, fixedValue: "col-reverse" },
  { pattern: "flex-row", methodName: "flexDirection", exactMatch: true, fixedValue: "row" },
  { pattern: "flex-col", methodName: "flexDirection", exactMatch: true, fixedValue: "col" },
  { pattern: "flex-wrap-reverse", methodName: "flexWrap", exactMatch: true, fixedValue: "wrap-reverse" },
  { pattern: "flex-wrap", methodName: "flexWrap", exactMatch: true, fixedValue: "wrap" },
  { pattern: "flex-nowrap", methodName: "flexWrap", exactMatch: true, fixedValue: "nowrap" },
  { pattern: "flex-1", methodName: "flex", exactMatch: true, fixedValue: "1" },
  { pattern: "flex-auto", methodName: "flex", exactMatch: true, fixedValue: "auto" },
  { pattern: "flex-initial", methodName: "flex", exactMatch: true, fixedValue: "initial" },
  { pattern: "flex-none", methodName: "flex", exactMatch: true, fixedValue: "none" },
  { pattern: "flex", methodName: "flex", exactMatch: true },

  // Shrink & Grow
  { pattern: "shrink-0", methodName: "shrink", exactMatch: true, fixedValue: "0" },
  { pattern: "shrink", methodName: "shrink", exactMatch: true },
  { pattern: "grow-0", methodName: "grow", exactMatch: true, fixedValue: "0" },
  { pattern: "grow", methodName: "grow", exactMatch: true },

  // Align self
  { pattern: "self-auto", methodName: "alignSelf", exactMatch: true, fixedValue: "auto" },
  { pattern: "self-start", methodName: "alignSelf", exactMatch: true, fixedValue: "start" },
  { pattern: "self-end", methodName: "alignSelf", exactMatch: true, fixedValue: "end" },
  { pattern: "self-center", methodName: "alignSelf", exactMatch: true, fixedValue: "center" },
  { pattern: "self-stretch", methodName: "alignSelf", exactMatch: true, fixedValue: "stretch" },
  { pattern: "self-baseline", methodName: "alignSelf", exactMatch: true, fixedValue: "baseline" },

  // Justify content
  { pattern: "justify-start", methodName: "justifyContent", exactMatch: true, fixedValue: "start" },
  { pattern: "justify-end", methodName: "justifyContent", exactMatch: true, fixedValue: "end" },
  { pattern: "justify-center", methodName: "justifyContent", exactMatch: true, fixedValue: "center" },
  { pattern: "justify-between", methodName: "justifyContent", exactMatch: true, fixedValue: "between" },
  { pattern: "justify-around", methodName: "justifyContent", exactMatch: true, fixedValue: "around" },
  { pattern: "justify-evenly", methodName: "justifyContent", exactMatch: true, fixedValue: "evenly" },
  { pattern: "justify-normal", methodName: "justifyContent", exactMatch: true, fixedValue: "normal" },
  { pattern: "justify-stretch", methodName: "justifyContent", exactMatch: true, fixedValue: "stretch" },

  // Align items
  { pattern: "items-start", methodName: "alignItems", exactMatch: true, fixedValue: "start" },
  { pattern: "items-end", methodName: "alignItems", exactMatch: true, fixedValue: "end" },
  { pattern: "items-center", methodName: "alignItems", exactMatch: true, fixedValue: "center" },
  { pattern: "items-baseline", methodName: "alignItems", exactMatch: true, fixedValue: "baseline" },
  { pattern: "items-stretch", methodName: "alignItems", exactMatch: true, fixedValue: "stretch" },

  // Gap
  { pattern: "gap-x-", methodName: "gap", direction: "x" },
  { pattern: "gap-y-", methodName: "gap", direction: "y" },
  { pattern: "gap-", methodName: "gap" },

  // Grid
  { pattern: "grid-cols-", methodName: "gridCols" },
  { pattern: "grid-rows-", methodName: "gridRows" },
  { pattern: "grid", methodName: "grid", exactMatch: true },

  // Column span
  { pattern: "col-span-", methodName: "colSpan" },

  // Aspect ratio
  { pattern: "aspect-auto", methodName: "aspect", exactMatch: true, fixedValue: "auto" },
  { pattern: "aspect-square", methodName: "aspect", exactMatch: true, fixedValue: "square" },
  { pattern: "aspect-video", methodName: "aspect", exactMatch: true, fixedValue: "video" },

  // Space between children
  { pattern: "space-x-", methodName: "spaceX" },
  { pattern: "space-y-", methodName: "spaceY" },

  // Divide
  { pattern: "divide-x-", methodName: "divideX" },
  { pattern: "divide-y-", methodName: "divideY" },
  { pattern: "divide-x", methodName: "divideX", exactMatch: true },
  { pattern: "divide-y", methodName: "divideY", exactMatch: true },

  // Border width
  { pattern: "border-2", methodName: "border", exactMatch: true, fixedValue: "2" },
  { pattern: "border-4", methodName: "border", exactMatch: true, fixedValue: "4" },
  { pattern: "border-8", methodName: "border", exactMatch: true, fixedValue: "8" },
  { pattern: "border-0", methodName: "border", exactMatch: true, fixedValue: "0" },
  { pattern: "border", methodName: "border", exactMatch: true },

  // Rounded
  { pattern: "rounded-none", methodName: "rounded", exactMatch: true, fixedValue: "none" },
  { pattern: "rounded-sm", methodName: "rounded", exactMatch: true, fixedValue: "sm" },
  { pattern: "rounded-md", methodName: "rounded", exactMatch: true, fixedValue: "md" },
  { pattern: "rounded-lg", methodName: "rounded", exactMatch: true, fixedValue: "lg" },
  { pattern: "rounded-xl", methodName: "rounded", exactMatch: true, fixedValue: "xl" },
  { pattern: "rounded-2xl", methodName: "rounded", exactMatch: true, fixedValue: "2xl" },
  { pattern: "rounded-3xl", methodName: "rounded", exactMatch: true, fixedValue: "3xl" },
  { pattern: "rounded-full", methodName: "rounded", exactMatch: true, fixedValue: "full" },
  { pattern: "rounded", methodName: "rounded", exactMatch: true },

  // Shadow
  { pattern: "shadow-sm", methodName: "shadow", exactMatch: true, fixedValue: "sm" },
  { pattern: "shadow-md", methodName: "shadow", exactMatch: true, fixedValue: "md" },
  { pattern: "shadow-lg", methodName: "shadow", exactMatch: true, fixedValue: "lg" },
  { pattern: "shadow-xl", methodName: "shadow", exactMatch: true, fixedValue: "xl" },
  { pattern: "shadow-2xl", methodName: "shadow", exactMatch: true, fixedValue: "2xl" },
  { pattern: "shadow-inner", methodName: "shadow", exactMatch: true, fixedValue: "inner" },
  { pattern: "shadow-none", methodName: "shadow", exactMatch: true, fixedValue: "none" },
  { pattern: "shadow", methodName: "shadow", exactMatch: true },

  // Position
  { pattern: "static", methodName: "position", exactMatch: true, fixedValue: "static" },
  { pattern: "fixed", methodName: "position", exactMatch: true, fixedValue: "fixed" },
  { pattern: "absolute", methodName: "position", exactMatch: true, fixedValue: "absolute" },
  { pattern: "relative", methodName: "position", exactMatch: true, fixedValue: "relative" },
  { pattern: "sticky", methodName: "position", exactMatch: true, fixedValue: "sticky" },

  // Z-index
  { pattern: "z-", methodName: "zIndex" },

  // Opacity
  { pattern: "opacity-", methodName: "opacity" },

  // Cursor
  { pattern: "cursor-", methodName: "cursor" },

  // Overflow
  { pattern: "overflow-x-", methodName: "overflow", direction: "x" },
  { pattern: "overflow-y-", methodName: "overflow", direction: "y" },
  { pattern: "overflow-hidden", methodName: "overflow", exactMatch: true, fixedValue: "hidden" },
  { pattern: "overflow-auto", methodName: "overflow", exactMatch: true, fixedValue: "auto" },
  { pattern: "overflow-scroll", methodName: "overflow", exactMatch: true, fixedValue: "scroll" },
  { pattern: "overflow-visible", methodName: "overflow", exactMatch: true, fixedValue: "visible" },
  { pattern: "overflow-clip", methodName: "overflow", exactMatch: true, fixedValue: "clip" },

  // Object fit
  { pattern: "object-", methodName: "objectFit" },

  // Display
  { pattern: "hidden", methodName: "hidden", exactMatch: true },
  { pattern: "block", methodName: "display", exactMatch: true, fixedValue: "block" },
  { pattern: "inline-block", methodName: "display", exactMatch: true, fixedValue: "inline-block" },
  { pattern: "inline-flex", methodName: "display", exactMatch: true, fixedValue: "inline-flex" },
  { pattern: "inline-grid", methodName: "display", exactMatch: true, fixedValue: "inline-grid" },
  { pattern: "inline", methodName: "display", exactMatch: true, fixedValue: "inline" },
  { pattern: "flow-root", methodName: "display", exactMatch: true, fixedValue: "flow-root" },
  { pattern: "contents", methodName: "display", exactMatch: true, fixedValue: "contents" },
  { pattern: "list-item", methodName: "display", exactMatch: true, fixedValue: "list-item" },

  // Inset / Position offsets
  { pattern: "inset-", methodName: "inset" },
  { pattern: "top-", methodName: "top" },
  { pattern: "right-", methodName: "right" },
  { pattern: "bottom-", methodName: "bottom" },
  { pattern: "left-", methodName: "left" },

  // Transitions & Animation
  { pattern: "transition-", methodName: "transition" },
  { pattern: "transition", methodName: "transition", exactMatch: true },
  { pattern: "duration-", methodName: "duration" },
  { pattern: "animate-", methodName: "animate" },

  // Ring
  { pattern: "ring-0", methodName: "ring", exactMatch: true, fixedValue: "0" },
  { pattern: "ring-1", methodName: "ring", exactMatch: true, fixedValue: "1" },
  { pattern: "ring-2", methodName: "ring", exactMatch: true, fixedValue: "2" },
  { pattern: "ring-4", methodName: "ring", exactMatch: true, fixedValue: "4" },
  { pattern: "ring-8", methodName: "ring", exactMatch: true, fixedValue: "8" },
  { pattern: "ring", methodName: "ring", exactMatch: true },

  // Ring colors (prefix patterns)
  { pattern: "ring-slate-", methodName: "ringColor" },
  { pattern: "ring-gray-", methodName: "ringColor" },
  { pattern: "ring-zinc-", methodName: "ringColor" },
  { pattern: "ring-neutral-", methodName: "ringColor" },
  { pattern: "ring-stone-", methodName: "ringColor" },
  { pattern: "ring-red-", methodName: "ringColor" },
  { pattern: "ring-orange-", methodName: "ringColor" },
  { pattern: "ring-amber-", methodName: "ringColor" },
  { pattern: "ring-yellow-", methodName: "ringColor" },
  { pattern: "ring-lime-", methodName: "ringColor" },
  { pattern: "ring-green-", methodName: "ringColor" },
  { pattern: "ring-emerald-", methodName: "ringColor" },
  { pattern: "ring-teal-", methodName: "ringColor" },
  { pattern: "ring-cyan-", methodName: "ringColor" },
  { pattern: "ring-sky-", methodName: "ringColor" },
  { pattern: "ring-blue-", methodName: "ringColor" },
  { pattern: "ring-indigo-", methodName: "ringColor" },
  { pattern: "ring-violet-", methodName: "ringColor" },
  { pattern: "ring-purple-", methodName: "ringColor" },
  { pattern: "ring-fuchsia-", methodName: "ringColor" },
  { pattern: "ring-pink-", methodName: "ringColor" },
  { pattern: "ring-rose-", methodName: "ringColor" },
  { pattern: "ring-white", methodName: "ringColor", exactMatch: true, fixedValue: "white" },
  { pattern: "ring-black", methodName: "ringColor", exactMatch: true, fixedValue: "black" },
  { pattern: "ring-transparent", methodName: "ringColor", exactMatch: true, fixedValue: "transparent" },

  // Transforms
  { pattern: "scale-", methodName: "scale" },
  { pattern: "rotate-", methodName: "rotate" },
  { pattern: "translate-x-", methodName: "translate", direction: "x" },
  { pattern: "translate-y-", methodName: "translate", direction: "y" },

  // Interactivity
  { pattern: "select-", methodName: "select" },
  { pattern: "pointer-events-", methodName: "pointerEvents" },

  // Whitespace
  { pattern: "whitespace-", methodName: "whitespace" },

  // Accessibility
  { pattern: "sr-only", methodName: "srOnly", exactMatch: true },

  // Outline
  { pattern: "outline-", methodName: "outline" },
];

// Map for display purposes (used in error messages)
const MODIFIER_MAP: Record<string, string> = {};
for (const p of FIXABLE_PATTERNS) {
  if (p.exactMatch) {
    if (p.fixedValue) {
      MODIFIER_MAP[p.pattern] = `${p.methodName}('${p.fixedValue}')`;
    } else {
      MODIFIER_MAP[p.pattern] = `${p.methodName}()`;
    }
  } else if (p.direction) {
    MODIFIER_MAP[p.pattern] = `${p.methodName}('${p.direction}', ...)`;
  } else {
    MODIFIER_MAP[p.pattern] = `${p.methodName}()`;
  }
}

interface MatchResult {
  pattern: FixablePattern;
  className: string;
  methodCall: string;
}

function matchClass(className: string): MatchResult | null {
  for (const pattern of FIXABLE_PATTERNS) {
    if (pattern.exactMatch) {
      if (className === pattern.pattern) {
        let methodCall: string;
        if (pattern.fixedValue) {
          methodCall = `.${pattern.methodName}("${pattern.fixedValue}")`;
        } else {
          methodCall = `.${pattern.methodName}()`;
        }
        return { pattern, className, methodCall };
      }
    } else {
      if (className.startsWith(pattern.pattern)) {
        const value = className.slice(pattern.pattern.length);
        let methodCall: string;
        if (pattern.direction) {
          methodCall = `.${pattern.methodName}("${pattern.direction}", "${value}")`;
        } else {
          methodCall = `.${pattern.methodName}("${value}")`;
        }
        return { pattern, className, methodCall };
      }
    }
  }
  return null;
}

function checkClassForKnownModifiers(className: string): Array<{ className: string; method: string }> {
  const violations: Array<{ className: string; method: string }> = [];

  for (const [prefix, method] of Object.entries(MODIFIER_MAP)) {
    if (className === prefix.replace(/-$/, "") || className === prefix || className.startsWith(prefix)) {
      violations.push({ className, method });
      break; // Only report first match
    }
  }

  return violations;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when setClass() or addClass() is used with Tailwind classes that have dedicated fluent methods",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      useKnownModifier: "Avoid using .{{callee}}() with '{{className}}'. Use .{{method}} instead to prevent style overrides.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function checkStringArg(node: any, calleeName: string, isAddClass: boolean) {
      if (node.type === "Literal" && typeof node.value === "string") {
        const classNames = node.value.split(/\s+/).filter(Boolean);

        for (const className of classNames) {
          if (isAddClass && className.includes(":")) continue;
          const violations = checkClassForKnownModifiers(className);
          for (const violation of violations) {
            context.report({
              node: node as any,
              messageId: "useKnownModifier",
              data: {
                callee: calleeName,
                className: violation.className,
                method: violation.method,
              },
            });
          }
        }
      }

      if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          if (quasi.value.cooked) {
            const classNames = quasi.value.cooked.split(/\s+/).filter(Boolean);
            for (const className of classNames) {
              if (isAddClass && className.includes(":")) continue;
              const violations = checkClassForKnownModifiers(className);
              for (const violation of violations) {
                context.report({
                  node: node as any,
                  messageId: "useKnownModifier",
                  data: {
                    callee: calleeName,
                    className: violation.className,
                    method: violation.method,
                  },
                });
              }
            }
          }
        }
      }
    }

    return {
      CallExpression(node: any) {
        // Check if this is a method call
        if (node.callee.type !== "MemberExpression") {
          return;
        }

        // Check if the method name is "setClass", "setClasses", or "addClass"
        if (
          node.callee.property.type !== "Identifier" ||
          (node.callee.property.name !== "setClass" &&
            node.callee.property.name !== "setClasses" &&
            node.callee.property.name !== "addClass")
        ) {
          return;
        }

        const calleeName: string = node.callee.property.name;
        const isAddClass = calleeName === "addClass";

        // Check if there's an argument
        if (node.arguments.length === 0) {
          return;
        }

        const arg = node.arguments[0];

        // Handle setClasses array (no auto-fix due to complexity)
        if (calleeName === "setClasses") {
          if (arg.type !== "ArrayExpression") return;
          for (const element of arg.elements) {
            if (element) checkStringArg(element, calleeName, false);
          }
          return;
        }

        // Handle string literals
        if (arg.type === "Literal" && typeof arg.value === "string") {
          const classNames = arg.value.split(/\s+/).filter(Boolean);
          const fixableClasses: MatchResult[] = [];
          const remainingClasses: string[] = [];

          for (const className of classNames) {
            // For addClass, skip classes with modifier prefixes (hover:, focus:, md:, etc.)
            if (isAddClass && className.includes(":")) {
              remainingClasses.push(className);
              continue;
            }
            const match = matchClass(className);
            if (match) {
              fixableClasses.push(match);
            } else {
              remainingClasses.push(className);
            }
          }

          // Report violations
          for (const className of classNames) {
            // For addClass, skip classes with modifier prefixes
            if (isAddClass && className.includes(":")) {
              continue;
            }
            const violations = checkClassForKnownModifiers(className);
            for (const violation of violations) {
              const match = matchClass(className);

              context.report({
                node: arg as any,
                messageId: "useKnownModifier",
                data: {
                  callee: calleeName,
                  className: violation.className,
                  method: violation.method,
                },
                fix: match ? (fixer) => {
                  // Build the replacement
                  const methodCalls = fixableClasses.map(m => m.methodCall).join("");

                  if (remainingClasses.length === 0) {
                    // All classes can be converted - replace entire call
                    const argsEnd = node.range[1];
                    const dotStart = node.callee.property.range[0] - 1; // -1 for the dot

                    return fixer.replaceTextRange(
                      [dotStart, argsEnd],
                      methodCalls
                    );
                  } else {
                    // Some classes remain - keep original method with remaining, add fluent calls
                    const remainingCall = `.${calleeName}("${remainingClasses.join(" ")}")`;
                    const dotStart = node.callee.property.range[0] - 1;
                    const argsEnd = node.range[1];

                    return fixer.replaceTextRange(
                      [dotStart, argsEnd],
                      methodCalls + remainingCall
                    );
                  }
                } : undefined,
              });
            }
          }
        }

        // Handle template literals (no auto-fix for these due to complexity)
        if (arg.type === "TemplateLiteral") {
          for (const quasi of arg.quasis) {
            if (quasi.value.cooked) {
              const classNames = quasi.value.cooked.split(/\s+/).filter(Boolean);

              for (const className of classNames) {
                // For addClass, skip classes with modifier prefixes
                if (isAddClass && className.includes(":")) {
                  continue;
                }
                const violations = checkClassForKnownModifiers(className);

                for (const violation of violations) {
                  context.report({
                    node: arg as any,
                    messageId: "useKnownModifier",
                    data: {
                      callee: calleeName,
                      className: violation.className,
                      method: violation.method,
                    },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};

export = rule;
