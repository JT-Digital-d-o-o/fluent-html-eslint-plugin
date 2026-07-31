import noKnownModifiersInSetclass = require("./rules/no-known-modifiers-in-setclass");
import noUnnecessarySpacesInSetclass = require("./rules/no-unnecessary-spaces-in-setclass");
import noDuplicateClassesInSetclass = require("./rules/no-duplicate-classes-in-setclass");
import noConflictingClassesInSetclass = require("./rules/no-conflicting-classes-in-setclass");
import noEmptySetclass = require("./rules/no-empty-setclass");
import noMultipleSetclassInChain = require("./rules/no-multiple-setclass-in-chain");
import noSetclassAfterFluentModifier = require("./rules/no-setclass-after-fluent-modifier");
import noSetclassInWhenApplyCallback = require("./rules/no-setclass-in-when-apply-callback");
import preferVariadicChildren = require("./rules/prefer-variadic-children");
import preferForeach = require("./rules/prefer-foreach");
import noConditionalInSetclass = require("./rules/no-conditional-in-setclass");
import noInnerHtmlSwap = require("./rules/no-innerhtml-swap");
import preferSetMethod = require("./rules/prefer-set-method");
import preferToggle = require("./rules/prefer-toggle");
import noRawIds = require("./rules/no-raw-ids");
import noTernaryInViewBuilder = require("./rules/no-ternary-in-view-builder");
import noSuperfluousViewReturnType = require("./rules/no-superfluous-view-return-type");
import anchorRequiresCursorPointer = require("./rules/anchor-requires-cursor-pointer");
import preferUnitOverload = require("./rules/prefer-unit-overload");
import preferHtmxApi = require("./rules/prefer-htmx-api");
import preferFormFor = require("./rules/prefer-form-for");
import noRemovedV4Utilities = require("./rules/no-removed-v4-utilities");
import noRawIconString = require("./rules/no-raw-icon-string");
import noFluentEquivalentInSetstyle = require("./rules/no-fluent-equivalent-in-setstyle");
import noTailwindInRawClass = require("./rules/no-tailwind-in-raw-class");
import noDynamicClassArgument = require("./rules/no-dynamic-class-argument");
import noTailwindInCssclass = require("./rules/no-tailwind-in-cssclass");

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
    "prefer-foreach": preferForeach,
    "no-conditional-in-setclass": noConditionalInSetclass,
    "no-innerhtml-swap": noInnerHtmlSwap,
    "prefer-set-method": preferSetMethod,
    "prefer-toggle": preferToggle,
    "no-raw-ids": noRawIds,
    "no-ternary-in-view-builder": noTernaryInViewBuilder,
    "no-superfluous-view-return-type": noSuperfluousViewReturnType,
    "anchor-requires-cursor-pointer": anchorRequiresCursorPointer,
    "prefer-unit-overload": preferUnitOverload,
    "prefer-htmx-api": preferHtmxApi,
    "prefer-form-for": preferFormFor,
    "no-removed-v4-utilities": noRemovedV4Utilities,
    "no-raw-icon-string": noRawIconString,
    "no-fluent-equivalent-in-setstyle": noFluentEquivalentInSetstyle,
    "no-tailwind-in-raw-class": noTailwindInRawClass,
    "no-dynamic-class-argument": noDynamicClassArgument,
    "no-tailwind-in-cssclass": noTailwindInCssclass,
  },
  configs: {
    recommended: {
      plugins: ["fluent-html"],
      rules: {
        // Escape-hatch closure rule set (error-level, CI-blocking):
        // no-tailwind-in-raw-class supersedes no-known-modifiers-in-setclass.
        "fluent-html/no-tailwind-in-raw-class": "error",
        "fluent-html/no-dynamic-class-argument": "error",
        "fluent-html/no-tailwind-in-cssclass": "error",
        "fluent-html/no-unnecessary-spaces-in-setclass": "warn",
        "fluent-html/no-duplicate-classes-in-setclass": "warn",
        "fluent-html/no-conflicting-classes-in-setclass": "warn",
        "fluent-html/no-empty-setclass": "warn",
        "fluent-html/no-multiple-setclass-in-chain": "error",
        "fluent-html/no-setclass-after-fluent-modifier": "error",
        "fluent-html/no-setclass-in-when-apply-callback": "error",
        "fluent-html/prefer-variadic-children": "warn",
        "fluent-html/prefer-foreach": "warn",
        "fluent-html/no-conditional-in-setclass": "warn",
        "fluent-html/no-innerhtml-swap": "error",
        "fluent-html/prefer-set-method": "warn",
        "fluent-html/prefer-toggle": "warn",
        "fluent-html/no-raw-ids": "warn",
        "fluent-html/no-ternary-in-view-builder": "warn",
        "fluent-html/no-superfluous-view-return-type": "warn",
        "fluent-html/anchor-requires-cursor-pointer": "warn",
        "fluent-html/prefer-unit-overload": "warn",
        "fluent-html/prefer-htmx-api": "warn",
        "fluent-html/prefer-form-for": "warn",
        "fluent-html/no-removed-v4-utilities": "error",
        "fluent-html/no-raw-icon-string": "warn",
        "fluent-html/no-fluent-equivalent-in-setstyle": "warn",
      },
    },
  },
};

export = plugin;
