import { Rule } from "eslint";

// Discriminant-IfThen chains survive every other tool (fluent-html census: 3-10
// per repo despite Match winning 25:10…35:4 where adopted). Two or more sibling
// IfThen calls whose conditions are `x.prop === literal` on one object.prop (or
// a bare identifier) are a hand-rolled, non-exhaustive Match with no narrowing.
// The same shape on consecutive `.when(x === lit, …)` links is a hand-rolled
// `.whenMatch`. Suggestion-only, never an autofix: the rewrite drops the
// IfThens' implicit render-nothing fall-through, so whether the resulting Match
// compiles depends on the discriminant's union — which a syntactic rule cannot
// see. Applying the suggestion is deliberate; a non-exhaustive result makes
// TypeScript name the missing members, which is the desired end state (fleet
// history: blind autofix sweeps introduced bugs twice — rideshare 94ea427,
// 1ced103).

type Discriminant = {
  text: string;
  node: any;
};

type EqCondition = {
  disc: Discriminant;
  literal: any;
};

function parseDiscriminant(node: any, sourceCode: any): Discriminant | null {
  if (node.type === "Identifier") return { text: sourceCode.getText(node), node };
  if (
    node.type === "MemberExpression" &&
    !node.computed &&
    !node.optional &&
    node.property.type === "Identifier"
  ) {
    return { text: sourceCode.getText(node), node };
  }
  return null;
}

function parseEquality(cond: any, sourceCode: any): EqCondition | null {
  if (cond.type !== "BinaryExpression" || cond.operator !== "===") return null;
  const isKeyLiteral = (n: any): boolean =>
    n.type === "Literal" && (typeof n.value === "string" || typeof n.value === "number");
  let literal: any;
  let discNode: any;
  if (isKeyLiteral(cond.right)) {
    literal = cond.right;
    discNode = cond.left;
  } else if (isKeyLiteral(cond.left)) {
    literal = cond.left;
    discNode = cond.right;
  } else {
    return null;
  }
  const disc = parseDiscriminant(discNode, sourceCode);
  if (disc === null) return null;
  return { disc, literal };
}

function caseKey(literal: any): string | null {
  const v = literal.value;
  if (typeof v === "string") return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(v) ? v : JSON.stringify(v);
  if (typeof v === "number") return /^\d+(\.\d+)?$/.test(String(v)) ? String(v) : null;
  return null;
}

function matchHead(disc: Discriminant, sourceCode: any): string {
  if (disc.node.type === "MemberExpression") {
    return `${sourceCode.getText(disc.node.object)}, "${disc.node.property.name}"`;
  }
  return disc.text;
}

type Group = { entries: { call: any; cond: EqCondition; index: number }[] };

function groupByDiscriminant(
  entries: { call: any; cond: EqCondition; index: number }[],
): Map<string, Group> {
  const groups = new Map<string, Group>();
  for (const entry of entries) {
    const key = entry.cond.disc.text;
    const group = groups.get(key);
    if (group) group.entries.push(entry);
    else groups.set(key, { entries: [entry] });
  }
  return groups;
}

function distinctKeys(entries: { cond: EqCondition }[]): string[] | null {
  const keys: string[] = [];
  // Collisions are detected on the *coerced* key — `1` and `"1"` are distinct
  // literals but the same object key, so a merged cases object would silently
  // drop a branch.
  const normalized = new Set<string>();
  for (const e of entries) {
    const key = caseKey(e.cond.literal);
    if (key === null) return null;
    const norm = String(e.cond.literal.value);
    if (normalized.has(norm)) return null;
    normalized.add(norm);
    keys.push(key);
  }
  return keys;
}

function isZeroParamFunction(node: any): boolean {
  return (
    (node.type === "ArrowFunctionExpression" || node.type === "FunctionExpression") &&
    node.params.length === 0
  );
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Sibling IfThen calls (or chained .when links) that dispatch on one discriminant are a hand-rolled Match/whenMatch — non-exhaustive and unnarrowed",
      category: "Best Practices",
      recommended: true,
    },
    hasSuggestions: true,
    messages: {
      preferMatch:
        "{{count}} sibling IfThen calls dispatch on {{discriminant}} — merge them into one Match({{head}}, { … }): exhaustive over the union (a new member becomes a compile error) and each branch receives the narrowed value.",
      suggestMatch:
        "Merge into a single Match — if the cases don't cover the whole union, TypeScript will name the missing members to add.",
      preferWhenMatch:
        "{{count}} chained .when(…) calls dispatch on {{discriminant}} — use .whenMatch({{discriminant}}, { … }): one styling branch per variant, and a missing case is a compile error.",
      suggestWhenMatch:
        "Merge into a single .whenMatch — if the cases don't cover the whole union, TypeScript will require the missing cases or an explicit default.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    const sourceCode = context.sourceCode;

    function checkIfThenSiblings(node: any): void {
      const entries: { call: any; cond: EqCondition; index: number }[] = [];
      node.arguments.forEach((arg: any, index: number) => {
        if (
          arg.type !== "CallExpression" ||
          arg.callee.type !== "Identifier" ||
          arg.callee.name !== "IfThen" ||
          arg.arguments.length < 2
        ) {
          return;
        }
        const cond = parseEquality(arg.arguments[0], sourceCode);
        if (cond !== null) entries.push({ call: arg, cond, index });
      });
      if (entries.length < 2) return;

      for (const group of groupByDiscriminant(entries).values()) {
        if (group.entries.length < 2) continue;
        const first = group.entries[0];
        const last = group.entries[group.entries.length - 1];
        const disc = first.cond.disc;
        const head = matchHead(disc, sourceCode);

        const keys = distinctKeys(group.entries);
        const consecutive = last.index - first.index === group.entries.length - 1;
        const cleanCallbacks = group.entries.every(
          (e) => e.call.arguments.length === 2 && isZeroParamFunction(e.call.arguments[1]),
        );

        const report: any = {
          node: first.call,
          messageId: "preferMatch",
          data: { count: String(group.entries.length), discriminant: disc.text, head },
        };
        if (keys !== null && consecutive && cleanCallbacks) {
          const cases = group.entries
            .map((e, i) => `${keys[i]}: ${sourceCode.getText(e.call.arguments[1])}`)
            .join(", ");
          report.suggest = [
            {
              messageId: "suggestMatch",
              fix: (fixer: Rule.RuleFixer) =>
                fixer.replaceTextRange(
                  [first.call.range[0], last.call.range[1]],
                  `Match(${head}, { ${cases} })`,
                ),
            },
          ];
        }
        context.report(report);
      }
    }

    function isWhenLink(node: any): boolean {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        !node.callee.computed &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "when" &&
        node.arguments.length === 2
      );
    }

    function checkWhenChain(node: any): void {
      // Only run from the outermost .when link, so each chain reports once.
      const parentMember = node.parent;
      if (
        parentMember &&
        parentMember.type === "MemberExpression" &&
        parentMember.object === node &&
        parentMember.parent &&
        isWhenLink(parentMember.parent) &&
        parentMember.parent.callee === parentMember
      ) {
        return;
      }

      const links: { call: any; cond: EqCondition | null }[] = [];
      let cur: any = node;
      while (isWhenLink(cur)) {
        links.unshift({ call: cur, cond: parseEquality(cur.arguments[0], sourceCode) });
        cur = cur.callee.object;
      }
      if (links.length < 2) return;

      const entries = links
        .map((link, index) => ({ call: link.call, cond: link.cond as EqCondition, index }))
        .filter((e) => e.cond !== null);

      for (const group of groupByDiscriminant(entries).values()) {
        if (group.entries.length < 2) continue;
        const first = group.entries[0];
        const last = group.entries[group.entries.length - 1];
        const disc = first.cond.disc;

        const keys = distinctKeys(group.entries);
        const consecutive = last.index - first.index === group.entries.length - 1;

        const report: any = {
          node: first.call.callee.property,
          messageId: "preferWhenMatch",
          data: { count: String(group.entries.length), discriminant: disc.text },
        };
        if (keys !== null && consecutive) {
          const cases = group.entries
            .map((e, i) => `${keys[i]}: ${sourceCode.getText(e.call.arguments[1])}`)
            .join(", ");
          report.suggest = [
            {
              messageId: "suggestWhenMatch",
              fix: (fixer: Rule.RuleFixer) =>
                fixer.replaceTextRange(
                  [first.call.callee.object.range[1], last.call.range[1]],
                  `.whenMatch(${disc.text}, { ${cases} })`,
                ),
            },
          ];
        }
        context.report(report);
      }
    }

    return {
      CallExpression(node: any) {
        checkIfThenSiblings(node);
        if (isWhenLink(node)) checkWhenChain(node);
      },
    };
  },
};

export = rule;
