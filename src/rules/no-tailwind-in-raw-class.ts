import { Rule } from "eslint";
import { analyzeToken, isTailwindToken, TokenAnalysis } from "../tailwind-token";
import { getVariantTables } from "../derive-fixable";

// The CI-blocking guard on raw Tailwind strings (llm-styling/escape-hatch;
// supersedes no-known-modifiers-in-setclass). Every whitespace token in an
// addClass/setClass/setClasses literal is analyzed: variant heads stripped
// (bracket-aware), then flagged when the derived fix table maps it, when it is
// Tailwind-shaped with a real Tailwind root, or when it carries a known
// variant head. Prefix-anchored — `sidebar-backdrop`/`entry-row` never match.
// Autofix rewrites the whole call to the fluent chain when EVERY flagged token
// is mappable (variant tokens included, via .on()/.at() wrappers).

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind utility classes in raw class strings (addClass/setClass) — they bypass the typed surface, the safelist extractor, and conflict detection",
      category: "Possible Errors",
      recommended: true,
    },
    fixable: "code",
    messages: {
      replaceWith:
        "'{{className}}' in .{{callee}}() bypasses the typed surface. Replace with: {{fluentChain}}. [autofix]",
      tailwindNoMethod:
        "'{{className}}' in .{{callee}}() is a Tailwind '{{root}}-*' utility with no fluent method. Use .cssProp() for arbitrary CSS, or file the vocab gap — raw strings are invisible to conflict detection.",
      variantNoMethod:
        "'{{className}}' in .{{callee}}() bypasses the typed surface. Move it into a variant style object — {{variantForm}} — using the canonical style keys.",
    },
    schema: [
      {
        type: "object" as const,
        properties: {
          ignoredClasses: {
            type: "array" as const,
            items: { type: "string" as const },
            uniqueItems: true,
            description: "Class names to ignore (prefer .cssClass() for legit non-Tailwind classes)",
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const options = context.options[0] as { ignoredClasses?: string[] } | undefined;
    const ignoredClasses = new Set(options?.ignoredClasses ?? []);

    function report(node: any, calleeName: string, a: TokenAnalysis, fix?: (fixer: Rule.RuleFixer) => Rule.Fix): void {
      if (a.fluentChain !== null) {
        context.report({
          node,
          messageId: "replaceWith",
          data: { callee: calleeName, className: a.token, fluentChain: a.fluentChain },
          ...(fix ? { fix } : {}),
        });
      } else if (a.heads.length > 0 && a.headsKnown) {
        const head = a.heads[0];
        const tier1 = getVariantTables().tier1ByPrefix[head];
        context.report({
          node,
          messageId: "variantNoMethod",
          data: {
            callee: calleeName,
            className: a.token,
            variantForm: tier1 !== undefined ? `.${tier1}({ ... })` : `.variant("${head}", { ... })`,
          },
        });
      } else if (a.classification.kind === "tailwind-unmapped") {
        context.report({
          node,
          messageId: "tailwindNoMethod",
          data: { callee: calleeName, className: a.token, root: a.classification.root },
        });
      }
    }

    function analyze(value: string): { flagged: TokenAnalysis[]; remaining: string[] } {
      const flagged: TokenAnalysis[] = [];
      const remaining: string[] = [];
      for (const token of value.split(/\s+/).filter(Boolean)) {
        if (ignoredClasses.has(token)) {
          remaining.push(token);
          continue;
        }
        const a = analyzeToken(token);
        if (isTailwindToken(a)) flagged.push(a);
        else remaining.push(token);
      }
      return { flagged, remaining };
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return;
        const calleeName: string = node.callee.property.name;
        if (calleeName !== "setClass" && calleeName !== "addClass" && calleeName !== "setClasses") return;
        if (node.arguments.length === 0) return;
        const arg = node.arguments[0];

        // setClasses([...]) — analyze each literal element, no autofix
        if (calleeName === "setClasses") {
          if (arg.type !== "ArrayExpression") return;
          for (const element of arg.elements) {
            if (element && element.type === "Literal" && typeof element.value === "string") {
              for (const a of analyze(element.value).flagged) report(element, calleeName, a);
            }
          }
          return;
        }

        if (arg.type === "Literal" && typeof arg.value === "string") {
          const { flagged, remaining } = analyze(arg.value);
          if (flagged.length === 0) return;

          // Whole-call autofix only when every flagged token has a fluent chain.
          const allMappable = flagged.every((a) => a.fluentChain !== null);
          const fix = allMappable
            ? (fixer: Rule.RuleFixer): Rule.Fix => {
                const chain = flagged.map((a) => a.fluentChain).join("");
                const keep = remaining.length > 0 ? `.${calleeName}("${remaining.join(" ")}")` : "";
                const dotStart = node.callee.property.range[0] - 1;
                return fixer.replaceTextRange([dotStart, node.range[1]], chain + keep);
              }
            : undefined;

          // Attach the fix to the first report only — one applied fix rewrites the call.
          flagged.forEach((a, i) => report(arg, calleeName, a, i === 0 ? fix : undefined));
          return;
        }

        // Template literals: analyze the static parts, no autofix.
        if (arg.type === "TemplateLiteral") {
          for (const quasi of arg.quasis) {
            if (!quasi.value.cooked) continue;
            for (const a of analyze(quasi.value.cooked).flagged) report(arg, calleeName, a);
          }
        }
      },
    };
  },
};

export = rule;
