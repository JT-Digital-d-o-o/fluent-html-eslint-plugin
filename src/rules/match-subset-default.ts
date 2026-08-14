import { Rule } from "eslint";

// The shipped-P1 shape (prose-to-compiler candidate 4): a Match/whenMatch over
// a finite literal union or enum that carries a default while its cases cover a
// strict subset — the default silently absorbs the missing members (the Wise
// payment-status Match rendered "Waiting for payment…" with a live .poll() on
// PARTIALLY_REFUNDED). Types alone can't catch it: the default overload
// legitimately exists for intentional subsets, so lint + disable-with-reason is
// the right escalation tier.
//
// This is the plugin's first type-aware rule: it resolves the discriminant's
// union through the TypeScript checker (parserServices), and no-ops gracefully
// when no program is available (`typescript` is an optional peer — nothing here
// imports it; the checker comes from the consumer's parser services). Bails on
// open string/number, type parameters, non-literal union members, and cases
// objects with computed or spread keys. Numeric enum members are reported by
// member name, not value.

type Member = { key: string; display: string };

function literalMembers(type: any): Member[] | null {
  if (!type.isUnion || !type.isUnion()) return null;
  const members: Member[] = [];
  for (const t of type.types) {
    const isString = t.isStringLiteral();
    const isNumber = t.isNumberLiteral();
    if (!isString && !isNumber) return null;
    const key = String(t.value);
    const display = isNumber && t.symbol && t.symbol.name ? String(t.symbol.name) : key;
    if (!members.some((m) => m.key === key)) members.push({ key, display });
  }
  return members.length >= 2 ? members : null;
}

function caseKeys(casesObj: any): Set<string> | null {
  const keys = new Set<string>();
  for (const prop of casesObj.properties) {
    if (prop.type !== "Property" || prop.computed) return null;
    if (prop.key.type === "Identifier") keys.add(prop.key.name);
    else if (
      prop.key.type === "Literal" &&
      (typeof prop.key.value === "string" || typeof prop.key.value === "number")
    ) {
      keys.add(String(prop.key.value));
    } else return null;
  }
  return keys;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A Match/whenMatch over a resolvable finite literal union or enum may not carry a default that hides a strict subset of cases — missing members are reported by name; a default over full coverage is unreachable",
      category: "Possible Errors",
      recommended: true,
    },
    messages: {
      subsetDefault:
        "{{callee}} over '{{typeName}}' carries a default that silently absorbs: {{missing}}. Add an explicit case per member and delete the default (a new enum member then becomes a compile error), or eslint-disable with a reason if the fall-through is intentional.",
      unreachableDefault:
        "{{callee}} over '{{typeName}}' covers every member — the default is unreachable. Delete it so a new member becomes a compile error instead of falling through silently.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const services: any =
      (context.sourceCode as any).parserServices ?? (context as any).parserServices;
    if (!services || !services.program || !services.esTreeNodeToTSNodeMap) return {};
    const checker = services.program.getTypeChecker();

    // At a reference site, control-flow analysis substitutes a type
    // parameter's constraint — the flow type of `s: T extends "a" | "b"` is a
    // plain union, indistinguishable from a real one. The type-parameter bail
    // must therefore inspect the symbol's *declared* type.
    function declaredTypeIsTypeParameter(tsNode: any): boolean {
      const sym = checker.getSymbolAtLocation(tsNode);
      if (!sym) return false;
      const declared =
        typeof checker.getTypeOfSymbol === "function"
          ? checker.getTypeOfSymbol(sym)
          : checker.getTypeOfSymbolAtLocation(sym, tsNode);
      return (
        !!declared && typeof declared.isTypeParameter === "function" && declared.isTypeParameter()
      );
    }

    function discriminantType(discNode: any, key: string | null): any | null {
      const tsNode = services.esTreeNodeToTSNodeMap.get(discNode);
      if (!tsNode) return null;
      if (declaredTypeIsTypeParameter(tsNode)) return null;
      const type = checker.getTypeAtLocation(tsNode);
      if (key === null) return type;
      const prop = checker.getPropertyOfType(type, key);
      if (!prop) return null;
      return checker.getTypeOfSymbolAtLocation(prop, tsNode);
    }

    function check(callee: string, discNode: any, key: string | null, casesObj: any, defaultArg: any): void {
      const keys = caseKeys(casesObj);
      if (keys === null) return;
      const type = discriminantType(discNode, key);
      if (type === null) return;
      const members = literalMembers(type);
      if (members === null) return;

      const missing = members.filter((m) => !keys.has(m.key));
      const typeName = checker.typeToString(type);
      if (missing.length > 0) {
        context.report({
          node: defaultArg,
          messageId: "subsetDefault",
          data: { callee, typeName, missing: missing.map((m) => m.display).join(", ") },
        });
      } else {
        context.report({
          node: defaultArg,
          messageId: "unreachableDefault",
          data: { callee, typeName },
        });
      }
    }

    return {
      CallExpression(node: any) {
        if (node.callee.type === "Identifier" && node.callee.name === "Match") {
          const args = node.arguments;
          if (args.length === 3 && args[1].type === "ObjectExpression") {
            check("Match", args[0], null, args[1], args[2]);
          } else if (
            args.length === 4 &&
            args[1].type === "Literal" &&
            typeof args[1].value === "string" &&
            args[2].type === "ObjectExpression"
          ) {
            check("Match", args[0], args[1].value, args[2], args[3]);
          }
          return;
        }
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "whenMatch" &&
          node.arguments.length === 3 &&
          node.arguments[1].type === "ObjectExpression"
        ) {
          check("whenMatch", node.arguments[0], null, node.arguments[1], node.arguments[2]);
        }
      },
    };
  },
};

export = rule;
