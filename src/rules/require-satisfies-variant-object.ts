import { Rule } from "eslint";
import { getVariantTables } from "../derive-fixable";

// Object variants (llm-styling/object-variants) get their key/value
// spell-checking from TypeScript's excess-property checking — which only runs
// on OBJECT LITERALS in an argument position. An extracted const passed by
// name (`const glow = { opcaity: "50" }; Div().hover(glow)`) skips it: extra
// keys type-check, and the runtime throws on the unknown key instead of the
// compiler. The fix is to pin the declaration with
// `satisfies VariantStyleObject`, which restores the literal-level check at
// the declaration site.
//
// This rule enforces that: a non-literal styles argument to a tier-1 variant
// method or `.variant(name, styles)` must resolve (same file) to a
// declaration pinned with `satisfies VariantStyleObject`. Spread sources
// inside a variant-object literal have the same hole and the same fix.
// Unresolvable names (imports, parameters) are skipped — the declaration site
// is elsewhere; the rule fires where the declaration is visible.

const VARIANT_STYLE_TYPE = "VariantStyleObject";

function isSatisfiesVariantObject(node: any): boolean {
  return (
    node?.type === "TSSatisfiesExpression" &&
    node.typeAnnotation?.type === "TSTypeReference" &&
    node.typeAnnotation.typeName?.type === "Identifier" &&
    node.typeAnnotation.typeName.name === VARIANT_STYLE_TYPE
  );
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require `satisfies VariantStyleObject` on extracted variant style objects — excess-property key spell-checking does not reach through a plain variable",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      requireSatisfies:
        "'{{name}}' is passed to .{{callee}}() without `satisfies VariantStyleObject` on its declaration — key typos in it are not compile-checked (they throw at render time). Declare it as `const {{name}} = { ... } satisfies VariantStyleObject`.",
      requireSatisfiesSpread:
        "'{{name}}' is spread into a variant object without `satisfies VariantStyleObject` on its declaration — its keys bypass excess-property checking. Declare it as `const {{name}} = { ... } satisfies VariantStyleObject`.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    let tier1Names: ReadonlySet<string>;
    let styleKeys: ReadonlySet<string>;
    try {
      ({ tier1Names, styleKeys } = getVariantTables());
    } catch {
      return {}; // fluent-html peer missing — the derived-table rules already report this loudly
    }

    /** Do the object's literal keys all look like variant-object keys? (empty/no-literal-keys → false) */
    function keysLookVariant(obj: any): boolean {
      let sawKey = false;
      for (const prop of obj.properties) {
        if (prop.type !== "Property" || prop.computed) continue;
        const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.type === "Literal" ? String(prop.key.value) : null;
        if (key === null) continue;
        if (!styleKeys.has(key) && !tier1Names.has(key)) return false;
        sawKey = true;
      }
      return sawKey;
    }

    /**
     * The `satisfies`-pinned-ness of an identifier's same-file declaration;
     * null = unresolvable / not a variant-shaped object literal (a same-named
     * non-fluent call must never fire this rule, so anything whose keys don't
     * all belong to the variant surface is skipped).
     */
    function declarationPinned(node: any): boolean | null {
      const scope = context.sourceCode.getScope(node);
      let ref: any = scope.references.find((r: any) => r.identifier === node)?.resolved;
      if (!ref) {
        // Fallback: resolve by name through enclosing scopes.
        for (let s: any = scope; s; s = s.upper) {
          const v = s.variables.find((v2: any) => v2.name === node.name);
          if (v) { ref = v; break; }
        }
      }
      if (!ref || ref.defs.length === 0) return null;
      const def = ref.defs[ref.defs.length - 1];
      if (def.type !== "Variable" || !def.node.init) return null;
      const init = def.node.init;
      if (isSatisfiesVariantObject(init)) return true;
      if (init.type === "ObjectExpression" && keysLookVariant(init)) return false;
      return null;
    }

    function checkStylesArg(callee: string, arg: any): void {
      if (!arg) return;
      if (arg.type === "Identifier") {
        if (declarationPinned(arg) === false) {
          context.report({ node: arg, messageId: "requireSatisfies", data: { name: arg.name, callee } });
        }
        return;
      }
      if (arg.type === "ObjectExpression") {
        for (const prop of arg.properties) {
          if (prop.type === "SpreadElement" && prop.argument.type === "Identifier") {
            if (declarationPinned(prop.argument) === false) {
              context.report({ node: prop.argument, messageId: "requireSatisfiesSpread", data: { name: prop.argument.name, callee } });
            }
          }
          // Nested tier-1 keys hold variant objects too.
          if (prop.type === "Property" && prop.value?.type === "ObjectExpression") {
            checkStylesArg(callee, prop.value);
          }
        }
      }
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type !== "MemberExpression" || node.callee.property.type !== "Identifier") return;
        const name: string = node.callee.property.name;
        if (tier1Names.has(name) && node.arguments.length === 1) {
          checkStylesArg(name, node.arguments[0]);
        } else if (name === "variant" && node.arguments.length === 2) {
          checkStylesArg(name, node.arguments[1]);
        }
      },
    };
  },
};

export = rule;
