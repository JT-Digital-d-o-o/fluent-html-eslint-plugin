import { Rule } from "eslint";

const VIEW_TYPES = new Set(["View"]);

function getReturnTypeAnnotation(node: any): any | null {
  // Function declarations: function Foo(): View { ... }
  // Arrow functions assigned to variables are handled via parent
  const returnType = node.returnType?.typeAnnotation ?? node.returnType;
  if (!returnType) return null;

  // TSTypeAnnotation wraps the actual type
  const typeNode =
    returnType.type === "TSTypeAnnotation"
      ? returnType.typeAnnotation
      : returnType;

  if (
    typeNode.type === "TSTypeReference" &&
    typeNode.typeName?.type === "Identifier" &&
    VIEW_TYPES.has(typeNode.typeName.name)
  ) {
    return returnType;
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow superfluous View return type annotations on view builder functions. TypeScript can infer the return type.",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      superfluousReturnType:
        "Superfluous ': {{type}}' return type annotation. TypeScript can infer the return type of view builder functions.",
    },
    schema: [],
  },

  create(context: Rule.RuleContext): Rule.RuleListener {
    function check(node: any) {
      const annotation = getReturnTypeAnnotation(node);
      if (!annotation) return;

      const typeName =
        annotation.type === "TSTypeAnnotation"
          ? annotation.typeAnnotation.typeName.name
          : annotation.typeName.name;

      context.report({
        node: annotation,
        messageId: "superfluousReturnType",
        data: { type: typeName },
        fix(fixer: any) {
          // Remove `: View` — the annotation includes the colon in some parsers,
          // but to be safe we remove from just before the annotation to its end.
          const sourceCode = context.getSourceCode();
          const tokenBefore = sourceCode.getTokenBefore(annotation);
          if (tokenBefore && tokenBefore.value === ":") {
            return fixer.removeRange([tokenBefore.range[0], annotation.range[1]]);
          }
          return fixer.remove(annotation);
        },
      });
    }

    return {
      FunctionDeclaration: check,
      FunctionExpression: check,
      ArrowFunctionExpression: check,
    };
  },
};

export = rule;
