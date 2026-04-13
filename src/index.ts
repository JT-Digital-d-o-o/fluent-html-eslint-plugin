import noKnownModifiersInSetclass = require("./rules/no-known-modifiers-in-setclass");
import noUnnecessarySpacesInSetclass = require("./rules/no-unnecessary-spaces-in-setclass");
import noDuplicateClassesInSetclass = require("./rules/no-duplicate-classes-in-setclass");
import noConflictingClassesInSetclass = require("./rules/no-conflicting-classes-in-setclass");
import noEmptySetclass = require("./rules/no-empty-setclass");
import noMultipleSetclassInChain = require("./rules/no-multiple-setclass-in-chain");
import noSetclassAfterFluentModifier = require("./rules/no-setclass-after-fluent-modifier");
import noSetclassInWhenApplyCallback = require("./rules/no-setclass-in-when-apply-callback");
import preferVariadicChildren = require("./rules/prefer-variadic-children");
import noConditionalInSetclass = require("./rules/no-conditional-in-setclass");
import noInnerHtmlSwap = require("./rules/no-innerhtml-swap");
import preferSetMethod = require("./rules/prefer-set-method");
import noRawIds = require("./rules/no-raw-ids");
import noTernaryInViewBuilder = require("./rules/no-ternary-in-view-builder");
import noSuperfluousViewReturnType = require("./rules/no-superfluous-view-return-type");
import anchorRequiresCursorPointer = require("./rules/anchor-requires-cursor-pointer");
import preferUnitOverload = require("./rules/prefer-unit-overload");
import preferHtmxApi = require("./rules/prefer-htmx-api");
import preferFormFor = require("./rules/prefer-form-for");

const plugin = {
  rules: {
    "no-known-modifiers-in-setclass": noKnownModifiersInSetclass,
    "no-unnecessary-spaces-in-setclass": noUnnecessarySpacesInSetclass,
    "no-duplicate-classes-in-setclass": noDuplicateClassesInSetclass,
    "no-conflicting-classes-in-setclass": noConflictingClassesInSetclass,
    "no-empty-setclass": noEmptySetclass,
    "no-multiple-setclass-in-chain": noMultipleSetclassInChain,
    "no-setclass-after-fluent-modifier": noSetclassAfterFluentModifier,
    "no-setclass-in-when-apply-callback": noSetclassInWhenApplyCallback,
    "prefer-variadic-children": preferVariadicChildren,
    "no-conditional-in-setclass": noConditionalInSetclass,
    "no-innerhtml-swap": noInnerHtmlSwap,
    "prefer-set-method": preferSetMethod,
    "no-raw-ids": noRawIds,
    "no-ternary-in-view-builder": noTernaryInViewBuilder,
    "no-superfluous-view-return-type": noSuperfluousViewReturnType,
    "anchor-requires-cursor-pointer": anchorRequiresCursorPointer,
    "prefer-unit-overload": preferUnitOverload,
    "prefer-htmx-api": preferHtmxApi,
    "prefer-form-for": preferFormFor,
  },
  configs: {
    recommended: {
      plugins: ["fluent-html"],
      rules: {
        "fluent-html/no-known-modifiers-in-setclass": "warn",
        "fluent-html/no-unnecessary-spaces-in-setclass": "warn",
        "fluent-html/no-duplicate-classes-in-setclass": "warn",
        "fluent-html/no-conflicting-classes-in-setclass": "warn",
        "fluent-html/no-empty-setclass": "warn",
        "fluent-html/no-multiple-setclass-in-chain": "error",
        "fluent-html/no-setclass-after-fluent-modifier": "error",
        "fluent-html/no-setclass-in-when-apply-callback": "error",
        "fluent-html/prefer-variadic-children": "warn",
        "fluent-html/no-conditional-in-setclass": "warn",
        "fluent-html/no-innerhtml-swap": "error",
        "fluent-html/prefer-set-method": "warn",
        "fluent-html/no-raw-ids": "warn",
        "fluent-html/no-ternary-in-view-builder": "warn",
        "fluent-html/no-superfluous-view-return-type": "warn",
        "fluent-html/anchor-requires-cursor-pointer": "warn",
        "fluent-html/prefer-unit-overload": "warn",
        "fluent-html/prefer-htmx-api": "warn",
        "fluent-html/prefer-form-for": "warn",
      },
    },
  },
};

export = plugin;
