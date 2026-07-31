import { Rule } from "eslint";
import { FixablePattern, getFixableTables } from "../derive-fixable";

// FIXABLE_PATTERNS + MODIFIER_MAP are derived from fluent-html/class-vocab at
// rule-load (see ../derive-fixable) — the ~780-line hand table lived here and
// drifted. Derivation is lazy so only this rule needs the peer dependency.

interface MatchResult {
  pattern: FixablePattern;
  className: string;
  methodCall: string;
}

function matchClass(className: string): MatchResult | null {
  for (const pattern of getFixableTables().patterns) {
    if (pattern.exactMatch) {
      if (className === pattern.pattern) {
        let methodCall: string;
        if (pattern.direction && pattern.fixedValue) {
          methodCall = `.${pattern.methodName}("${pattern.direction}", "${pattern.fixedValue}")`;
        } else if (pattern.fixedValue) {
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
  const match = matchClass(className);
  if (match) {
    const method = getFixableTables().modifierMap[match.pattern.pattern]
      || `${match.pattern.methodName}()`;
    return [{ className, method }];
  }
  return [];
}

// Variant prefixes that map to .on() (pseudo-classes/states)
const STATE_VARIANTS = new Set([
  "hover", "focus", "active", "disabled", "visited",
  "first", "last", "odd", "even",
  "focus-within", "focus-visible",
  "group-hover", "peer-hover", "peer-focus",
  "checked", "required", "invalid", "placeholder",
  "empty", "enabled", "read-only", "dark",
]);

// Variant prefixes that map to .at() (breakpoints)
const BREAKPOINT_VARIANTS = new Set([
  "sm", "md", "lg", "xl", "2xl",
]);

function parseVariantPrefix(className: string): { variant: string; variantMethod: "on" | "at"; baseClass: string } | null {
  const colonIndex = className.indexOf(":");
  if (colonIndex === -1) return null;

  const prefix = className.slice(0, colonIndex);
  const baseClass = className.slice(colonIndex + 1);

  // Skip multi-level variants (sm:hover:bg-blue-500) for now
  if (baseClass.includes(":")) return null;

  if (STATE_VARIANTS.has(prefix)) {
    return { variant: prefix, variantMethod: "on", baseClass };
  }
  if (BREAKPOINT_VARIANTS.has(prefix)) {
    return { variant: prefix, variantMethod: "at", baseClass };
  }

  return null;
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
      useVariantMethod: "Avoid using .{{callee}}() with '{{className}}'. Use .{{variantMethod}}(\"{{variant}}\", t => t.{{method}}) instead.",
      useVariantMethodGeneric: "Avoid using .{{callee}}() with '{{className}}'. Use .{{variantMethod}}(\"{{variant}}\", t => t.addClass(\"{{baseClass}}\")) instead.",
    },
    schema: [
      {
        type: "object" as const,
        properties: {
          ignoredClasses: {
            type: "array" as const,
            items: { type: "string" as const },
            uniqueItems: true,
            description: "Class names to ignore (e.g. custom CSS classes like 'bg-grid' that aren't Tailwind utilities)",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] as { ignoredClasses?: string[] } | undefined;
    const ignoredClasses = new Set(options?.ignoredClasses ?? []);

    function reportClassViolation(node: any, calleeName: string, className: string) {
      if (ignoredClasses.has(className)) return;
      // Check for variant prefix (hover:, sm:, etc.)
      if (className.includes(":")) {
        const parsed = parseVariantPrefix(className);
        if (!parsed) return;
        const violations = checkClassForKnownModifiers(parsed.baseClass);
        if (violations.length > 0) {
          for (const violation of violations) {
            context.report({
              node: node as any,
              messageId: "useVariantMethod",
              data: {
                callee: calleeName,
                className,
                variantMethod: parsed.variantMethod,
                variant: parsed.variant,
                method: violation.method,
              },
            });
          }
        } else {
          // Unknown base class but still has a variant prefix — should use .on()/.at()
          context.report({
            node: node as any,
            messageId: "useVariantMethodGeneric",
            data: {
              callee: calleeName,
              className,
              variantMethod: parsed.variantMethod,
              variant: parsed.variant,
              baseClass: parsed.baseClass,
            },
          });
        }
        return;
      }

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

    function checkStringArg(node: any, calleeName: string) {
      if (node.type === "Literal" && typeof node.value === "string") {
        const classNames = node.value.split(/\s+/).filter(Boolean);
        for (const className of classNames) {
          reportClassViolation(node, calleeName, className);
        }
      }

      if (node.type === "TemplateLiteral") {
        for (const quasi of node.quasis) {
          if (quasi.value.cooked) {
            const classNames = quasi.value.cooked.split(/\s+/).filter(Boolean);
            for (const className of classNames) {
              reportClassViolation(node, calleeName, className);
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

        // Check if there's an argument
        if (node.arguments.length === 0) {
          return;
        }

        const arg = node.arguments[0];

        // Handle setClasses array (no auto-fix due to complexity)
        if (calleeName === "setClasses") {
          if (arg.type !== "ArrayExpression") return;
          for (const element of arg.elements) {
            if (element) checkStringArg(element, calleeName);
          }
          return;
        }

        // Handle string literals
        if (arg.type === "Literal" && typeof arg.value === "string") {
          const classNames = arg.value.split(/\s+/).filter(Boolean);
          const fixableClasses: MatchResult[] = [];
          const remainingClasses: string[] = [];

          for (const className of classNames) {
            // Ignored classes are never flagged or auto-fixed
            if (ignoredClasses.has(className)) {
              remainingClasses.push(className);
              continue;
            }
            // Variant classes (hover:, sm:, etc.) can't be auto-fixed — keep as remaining
            if (className.includes(":")) {
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
            if (ignoredClasses.has(className)) continue;
            // Variant classes — report with variant-aware message (no autofix)
            if (className.includes(":")) {
              const parsed = parseVariantPrefix(className);
              if (!parsed) continue;
              const violations = checkClassForKnownModifiers(parsed.baseClass);
              if (violations.length > 0) {
                for (const violation of violations) {
                  context.report({
                    node: arg as any,
                    messageId: "useVariantMethod",
                    data: {
                      callee: calleeName,
                      className,
                      variantMethod: parsed.variantMethod,
                      variant: parsed.variant,
                      method: violation.method,
                    },
                  });
                }
              } else {
                context.report({
                  node: arg as any,
                  messageId: "useVariantMethodGeneric",
                  data: {
                    callee: calleeName,
                    className,
                    variantMethod: parsed.variantMethod,
                    variant: parsed.variant,
                    baseClass: parsed.baseClass,
                  },
                });
              }
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
                reportClassViolation(arg, calleeName, className);
              }
            }
          }
        }
      },
    };
  },
};

export = rule;
