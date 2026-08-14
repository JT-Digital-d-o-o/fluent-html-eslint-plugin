const { RuleTester } = require("eslint");

const noKnownModifiersInSetclass = require("../dist/rules/no-known-modifiers-in-setclass");
const noSetclassInWhenApplyCallback = require("../dist/rules/no-setclass-in-when-apply-callback");
const noSetclassAfterFluentModifier = require("../dist/rules/no-setclass-after-fluent-modifier");
const preferVariadicChildren = require("../dist/rules/prefer-variadic-children");
const preferForeach = require("../dist/rules/prefer-foreach");
const noConditionalInSetclass = require("../dist/rules/no-conditional-in-setclass");
const noInnerHtmlSwap = require("../dist/rules/no-innerhtml-swap");
const preferSetMethod = require("../dist/rules/prefer-set-method");
const preferToggle = require("../dist/rules/prefer-toggle");
const noRawIds = require("../dist/rules/no-raw-ids");
const noTernaryInViewBuilder = require("../dist/rules/no-ternary-in-view-builder");
const noConflictingClassesInSetclass = require("../dist/rules/no-conflicting-classes-in-setclass");
const noRemovedV4Utilities = require("../dist/rules/no-removed-v4-utilities");
const noRawIconString = require("../dist/rules/no-raw-icon-string");

const tester = new RuleTester({ parserOptions: { ecmaVersion: 2020, sourceType: "module" } });

let passCount = 0;
let failCount = 0;

function runSuite(name, rule, tests) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(name);
  console.log("=".repeat(50));
  try {
    tester.run(name, rule, tests);
    const total = tests.valid.length + tests.invalid.length;
    passCount += total;
    console.log(`  ✅ ${total} cases passed`);
  } catch (e) {
    failCount++;
    console.log(`  ❌ FAILED: ${e.message}`);
  }
}

// ------------------------------------
// no-known-modifiers-in-setclass (addClass violations)
// ------------------------------------

runSuite("no-known-modifiers-in-setclass (addClass)", noKnownModifiersInSetclass, {
  valid: [
    // addClass with non-utility class — fine
    { code: `Div().addClass("custom-widget")` },
    // addClass with unrecognized variant prefix — fine
    { code: `Div().addClass("print:hidden")` },
    // addClass with multi-level variant — skipped for now
    { code: `Div().addClass("sm:hover:bg-blue-600")` },
    // ignoredClasses — custom CSS classes with bg- prefix should not be flagged
    { code: `Div().addClass("bg-grid")`, options: [{ ignoredClasses: ["bg-grid"] }] },
    { code: `Div().addClass("bg-glow bg-glow-1 bg-glow-2")`, options: [{ ignoredClasses: ["bg-glow", "bg-glow-1", "bg-glow-2"] }] },
    // ignoredClasses with other utilities — only ignored classes are skipped
    { code: `Div().setClass("bg-grid custom-thing")`, options: [{ ignoredClasses: ["bg-grid"] }] },
  ],
  invalid: [
    // ignoredClasses — bg-red-500 is NOT in the ignore list, so it's still flagged
    {
      code: `Div().addClass("bg-grid bg-red-500")`,
      options: [{ ignoredClasses: ["bg-grid"] }],
      output: `Div().bg("red-500").addClass("bg-grid")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "bg-red-500", method: "bg()" } }],
    },
    // flex-shrink-0 should suggest shrink("0"), not flex()
    {
      code: `Div().addClass("flex-shrink-0")`,
      output: `Div().shrink("0")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "flex-shrink-0", method: "shrink('0')" } }],
    },
    // flex-grow-0 should suggest grow("0"), not flex()
    {
      code: `Div().addClass("flex-grow-0")`,
      output: `Div().grow("0")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "flex-grow-0", method: "grow('0')" } }],
    },
    // font-mono → .font("mono")
    {
      code: `Div().addClass("font-mono")`,
      output: `Div().font("mono")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "font-mono", method: "font('mono')" } }],
    },
    // gradient from/via/to
    {
      code: `Div().addClass("from-coral")`,
      output: `Div().from("coral")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "from-coral", method: "from()" } }],
    },
    // group marker
    {
      code: `Div().addClass("group")`,
      output: `Div().group()`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "group", method: "group()" } }],
    },
    // shadow color (not shadow size)
    {
      code: `Div().addClass("shadow-coral/30")`,
      output: `Div().shadow("coral/30")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "shadow-coral/30", method: "shadow()" } }],
    },
    // shadow-md still maps to .shadow("md") — exact match takes priority
    {
      code: `Div().addClass("shadow-md")`,
      output: `Div().shadow("md")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "shadow-md", method: "shadow('md')" } }],
    },
    // backdrop-blur
    {
      code: `Div().addClass("backdrop-blur-sm")`,
      output: `Div().backdropBlur("sm")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "backdrop-blur-sm", method: "backdropBlur('sm')" } }],
    },
    // line-clamp
    {
      code: `Div().addClass("line-clamp-2")`,
      output: `Div().lineClamp("2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "line-clamp-2", method: "lineClamp()" } }],
    },
    // antialiased
    {
      code: `Div().addClass("antialiased")`,
      output: `Div().antialiased()`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "antialiased", method: "antialiased()" } }],
    },
    // tabular-nums
    {
      code: `Div().addClass("tabular-nums")`,
      output: `Div().tabularNums()`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "tabular-nums", method: "tabularNums()" } }],
    },
    // underline-offset
    {
      code: `Div().addClass("underline-offset-2")`,
      output: `Div().underlineOffset("2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "underline-offset-2", method: "underlineOffset()" } }],
    },
    // ease
    {
      code: `Div().addClass("ease-out")`,
      output: `Div().ease("out")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "ease-out", method: "ease('out')" } }],
    },
    // addClass with single base utility
    {
      code: `Div().addClass("mt-2")`,
      output: `Div().mt("2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "mt-2", method: "mt()" } }],
    },
    // addClass with variant prefix — suggest .on()
    {
      code: `Div().addClass("hover:bg-blue-600")`,
      errors: [{ messageId: "useVariantMethod", data: { callee: "addClass", className: "hover:bg-blue-600", variantMethod: "on", variant: "hover", method: "bg()" } }],
    },
    // addClass with responsive prefix — suggest .at()
    {
      code: `Div().addClass("md:w-1/2")`,
      errors: [{ messageId: "useVariantMethod", data: { callee: "addClass", className: "md:w-1/2", variantMethod: "at", variant: "md", method: "w()" } }],
    },
    // addClass with multiple variant-prefixed classes
    {
      code: `Div().addClass("hover:bg-blue-600 focus:ring-2")`,
      errors: [
        { messageId: "useVariantMethod", data: { callee: "addClass", className: "hover:bg-blue-600", variantMethod: "on", variant: "hover", method: "bg()" } },
        { messageId: "useVariantMethod", data: { callee: "addClass", className: "focus:ring-2", variantMethod: "on", variant: "focus", method: "ring('2')" } },
      ],
    },
    // addClass with base utility + modifier-prefixed class — keeps modifier class in addClass
    {
      code: `Div().addClass("p-4 hover:bg-blue-600")`,
      output: `Div().p("4").addClass("hover:bg-blue-600")`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "p-4", method: "p()" } },
        { messageId: "useVariantMethod", data: { callee: "addClass", className: "hover:bg-blue-600", variantMethod: "on", variant: "hover", method: "bg()" } },
      ],
    },
    // addClass with unknown base class but known variant — still caught
    {
      code: `Div().addClass("hover:unknown-modifier")`,
      errors: [{ messageId: "useVariantMethodGeneric", data: { callee: "addClass", className: "hover:unknown-modifier", variantMethod: "on", variant: "hover", baseClass: "unknown-modifier" } }],
    },
    // addClass with multiple base utilities
    {
      code: `Div().addClass("mt-2 p-4")`,
      output: `Div().mt("2").p("4")`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "mt-2", method: "mt()" } },
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "p-4", method: "p()" } },
      ],
    },
    // setClass still works (regression check)
    {
      code: `Div().setClass("mt-2")`,
      output: `Div().mt("2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "setClass", className: "mt-2", method: "mt()" } }],
    },
    // setClasses with a string literal element that has a known modifier
    {
      code: `Div().setClasses(["p-4", isActive && "active"])`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "setClasses", className: "p-4", method: "p()" } }],
    },
    // setClasses with multiple known modifiers
    {
      code: `Div().setClasses(["mt-2", "rounded"])`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "setClasses", className: "mt-2", method: "mt()" } },
        { messageId: "useKnownModifier", data: { callee: "setClasses", className: "rounded", method: "rounded()" } },
      ],
    },
    // addClass with list-disc
    {
      code: `Div().addClass("list-disc")`,
      output: `Div().list("disc")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-disc", method: "list('disc')" } }],
    },
    // addClass with list-inside
    {
      code: `Div().addClass("list-inside")`,
      output: `Div().list("inside")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-inside", method: "list('inside')" } }],
    },
    // addClass with list-disc list-inside combined
    {
      code: `Div().addClass("list-disc list-inside")`,
      output: `Div().list("disc").list("inside")`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "list-disc", method: "list('disc')" } },
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "list-inside", method: "list('inside')" } },
      ],
    },
    // addClass with list-none
    {
      code: `Div().addClass("list-none")`,
      output: `Div().list("none")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-none", method: "list('none')" } }],
    },
    // addClass with list-decimal
    {
      code: `Div().addClass("list-decimal")`,
      output: `Div().list("decimal")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-decimal", method: "list('decimal')" } }],
    },
  ],
});

// ------------------------------------
// no-setclass-in-when-apply-callback
// ------------------------------------

runSuite("no-setclass-in-when-apply-callback", noSetclassInWhenApplyCallback, {
  valid: [
    // addClass in when() callback — correct
    { code: `Div("x").when(true, t => t.addClass("foo"))` },
    // addClass in apply() callback — correct
    { code: `Div("x").apply(t => t.addClass("foo"))` },
    // setClass outside of when/apply — not our concern
    { code: `Div("x").setClass("foo")` },
    // setClass in a chain with when — but NOT inside the callback
    { code: `Div("x").when(true, t => t.addClass("a")).setClass("base")` },
    // Nested arrow that isn't a when/apply callback
    { code: `items.map(x => x.setClass("foo"))` },
    // apply with addClass only
    { code: `Div("x").apply(t => t.addClass("a"), t => t.addClass("b"))` },
    // setClasses outside callback — correct
    { code: `Div("x").setClasses(["base", isActive && "active"])` },
  ],
  invalid: [
    // setClass inside when() callback
    {
      code: `Div("x").when(true, t => t.setClass("foo"))`,
      errors: [{ messageId: "setClassInWhenCallback" }],
    },
    // setClass inside apply() callback
    {
      code: `Div("x").apply(t => t.setClass("foo"))`,
      errors: [{ messageId: "setClassInApplyCallback" }],
    },
    // setClass inside apply() with multiple callbacks — second one
    {
      code: `Div("x").apply(t => t.addClass("a"), t => t.setClass("b"))`,
      errors: [{ messageId: "setClassInApplyCallback" }],
    },
    // setClass in when() with block body
    {
      code: `Div("x").when(true, (t) => { return t.setClass("foo"); })`,
      errors: [{ messageId: "setClassInWhenCallback" }],
    },
    // setClass in chained when().apply() — both flagged
    {
      code: `Div("x").when(true, t => t.setClass("a")).apply(t => t.setClass("b"))`,
      errors: [
        { messageId: "setClassInWhenCallback" },
        { messageId: "setClassInApplyCallback" },
      ],
    },
    // setClasses inside when() callback
    {
      code: `Div("x").when(true, t => t.setClasses(["foo"]))`,
      errors: [{ messageId: "setClassInWhenCallback" }],
    },
    // setClasses inside apply() callback
    {
      code: `Div("x").apply(t => t.setClasses(["foo"]))`,
      errors: [{ messageId: "setClassInApplyCallback" }],
    },
  ],
});

// ------------------------------------
// no-setclass-after-fluent-modifier (updated with apply/when)
// ------------------------------------

runSuite("no-setclass-after-fluent-modifier (apply/when)", noSetclassAfterFluentModifier, {
  valid: [
    // setClass before apply — correct order
    { code: `Div("x").setClass("base").apply(t => t.addClass("extra"))` },
    // setClass before when — correct order
    { code: `Div("x").setClass("base").when(true, t => t.addClass("extra"))` },
    // No setClass at all
    { code: `Div("x").apply(t => t.addClass("foo"))` },
    // setClasses before apply — correct order
    { code: `Div("x").setClasses(["base"]).apply(t => t.addClass("extra"))` },
  ],
  invalid: [
    // setClass after apply() in chain
    {
      code: `Div("x").apply(t => t.addClass("a")).setClass("override")`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "apply", method: "setClass" } }],
    },
    // setClass after when() in chain
    {
      code: `Div("x").when(true, t => t.addClass("a")).setClass("override")`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "when", method: "setClass" } }],
    },
    // setClass after apply + other modifiers
    {
      code: `Div("x").apply(t => t.addClass("a")).p("4").setClass("override")`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "p", method: "setClass" } }],
    },
    // setClasses after apply() — same problem
    {
      code: `Div("x").apply(t => t.addClass("a")).setClasses(["override"])`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "apply", method: "setClasses" } }],
    },
    // setClasses after padding()
    {
      code: `Div("x").p("4").setClasses(["override"])`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "p", method: "setClasses" } }],
    },
  ],
});

// ------------------------------------
// prefer-variadic-children
// ------------------------------------

runSuite("prefer-variadic-children", preferVariadicChildren, {
  valid: [
    // Variadic form — correct
    { code: `Div(H1("Title"), P("Body"))` },
    // Single child — not flagged (ambiguous)
    { code: `Div([P("Only")])` },
    // Non-element function — not our concern
    { code: `myFunc([a, b])` },
    // Variable (not array literal) — can't lint
    { code: `Div(items)` },
    // Spread in array — can't convert
    { code: `Div([...items, P("extra")])` },
    // String child — not an array
    { code: `Div("hello")` },
    // Empty array — not flagged (0 elements)
    { code: `Div([])` },
  ],
  invalid: [
    // Array with 2+ elements
    {
      code: `Div([H1("Title"), P("Body")])`,
      output: `Div(H1("Title"), P("Body"))`,
      errors: [{ messageId: "preferVariadic" }],
    },
    // Works for other element functions
    {
      code: `Ul([Li("A"), Li("B"), Li("C")])`,
      output: `Ul(Li("A"), Li("B"), Li("C"))`,
      errors: [{ messageId: "preferVariadic" }],
    },
    // Form elements
    {
      code: `Form([Input(), Button("Submit")])`,
      output: `Form(Input(), Button("Submit"))`,
      errors: [{ messageId: "preferVariadic" }],
    },
    // Table
    {
      code: `Table([Thead(Tr()), Tbody(Tr())])`,
      output: `Table(Thead(Tr()), Tbody(Tr()))`,
      errors: [{ messageId: "preferVariadic" }],
    },
  ],
});

// ------------------------------------
// prefer-foreach
// ------------------------------------

runSuite("prefer-foreach", preferForeach, {
  valid: [
    // Already using ForEach — correct
    { code: `Div(ForEach(items, (i) => Li(i)))` },
    // Plain variadic children — no map
    { code: `Div(Card(a), Card(b))` },
    // Array literal child — that's prefer-variadic-children's job, not a .map()
    { code: `Div([Li("A"), Li("B")])` },
    // .map() on a NON-element call (descriptor array, data transform) — not children
    { code: `f.select("role", OPTIONS.map((o) => ({ value: o })))` },
    { code: `const ids = items.map((i) => i.id)` },
    { code: `myFunc(items.map((i) => i.id))` },
    // .map().join(...) — the direct arg is .join, not .map
    { code: `Span(words.map((w) => w).join(", "))` },
    // Computed member — not a literal .map access
    { code: `Div(items["map"](fn))` },
    // Array.from in a non-element call — data transform, not children
    { code: `myFunc(Array.from(set))` },
    { code: `const pages = Array.from({ length: n }, (_, i) => i + 1)` },
  ],
  invalid: [
    // Array-child form, named component, ForEach added to the import
    {
      code: `import { Div } from "fluent-html";\nDiv(STATS.map(StatBlock))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(STATS, StatBlock))`,
      errors: [{ messageId: "preferForeach", data: { name: "Div", list: "STATS" } }],
    },
    // Spread form, named component — the `...` is dropped, import extended
    {
      code: `import { Div } from "fluent-html";\nDiv(...CARDS.map(TestimonialCard))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(CARDS, TestimonialCard))`,
      errors: [{ messageId: "preferForeach" }],
    },
    // Inline arrow with index, ForEach already imported — no import change
    {
      code: `import { Div, ForEach } from "fluent-html";\nDiv(...POSTS.map((post, i) => PostCell(post, i)))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(POSTS, (post, i) => PostCell(post, i)))`,
      errors: [{ messageId: "preferForeach" }],
    },
    // Multiple violations in one file — import is added exactly once
    {
      code: `import { Div } from "fluent-html";\nDiv(A.map(x));\nDiv(...B.map(y));`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(A, x));\nDiv(ForEach(B, y));`,
      errors: [{ messageId: "preferForeach" }, { messageId: "preferForeach" }],
    },
    // Non-fixable: callback reads the 3rd `array` param — flagged, not auto-fixed
    {
      code: `import { Ul } from "fluent-html";\nUl(...items.map((x, i, arr) => Li(arr.length)))`,
      output: null,
      errors: [{ messageId: "preferForeach" }],
    },
    // Non-fixable: `.map(fn, thisArg)` — the second arg has no ForEach slot
    {
      code: `import { Div } from "fluent-html";\nDiv(...items.map(fn, thisArg))`,
      output: null,
      errors: [{ messageId: "preferForeach" }],
    },
    // The audit's escapee: count iteration via Array.from({length}) → ForEach count overload
    {
      code: `import { Div, ForEach } from "fluent-html";\nDiv(...Array.from({ length: 5 }, (_, i) => Dot(i)))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(5, (i) => Dot(i)))`,
      errors: [{ messageId: "preferForeachProducer" }],
    },
    // {length} form with the element param used — can't prove the rewrite, report only
    {
      code: `import { Div } from "fluent-html";\nDiv(...Array.from({ length: 5 }, (x, i) => Dot(x, i)))`,
      output: null,
      errors: [{ messageId: "preferForeachProducer" }],
    },
    // {length} form, index unused — zero-arg ForEach callback
    {
      code: `import { Div, ForEach } from "fluent-html";\nDiv(...Array.from({ length: n }, () => Skeleton()))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(n, () => Skeleton()))`,
      errors: [{ messageId: "preferForeachProducer" }],
    },
    // Array.from(iterable, cb) — same (item, index) contract as ForEach
    {
      code: `import { Div, ForEach } from "fluent-html";\nDiv(...Array.from(set, (v) => Li(v)))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(set, (v) => Li(v)))`,
      errors: [{ messageId: "preferForeachProducer" }],
    },
    // Array.from(iterable) without a mapper — identity render
    {
      code: `import { Div, ForEach } from "fluent-html";\nDiv(...Array.from(views))`,
      output: `import { Div, ForEach } from "fluent-html";\nDiv(ForEach(views, (v) => v))`,
      errors: [{ messageId: "preferForeachProducer" }],
    },
    // .flatMap() is array-producing too — flagged, no mechanical fix
    {
      code: `Div(items.flatMap((i) => Li(i)))`,
      output: null,
      errors: [{ messageId: "preferForeachProducer" }],
    },
    // Array.of spread — flagged, no fix
    {
      code: `Div(...Array.of(Li("a"), Li("b")))`,
      output: null,
      errors: [{ messageId: "preferForeachProducer" }],
    },
  ],
});

// ------------------------------------
// no-conditional-in-setclass
// ------------------------------------

runSuite("no-conditional-in-setclass", noConditionalInSetclass, {
  valid: [
    // Plain string — fine
    { code: `Div().setClass("foo bar")` },
    // Plain template literal without expressions — fine
    { code: "Div().setClass(`foo bar`)" },
    // setClasses with array — correct pattern
    { code: `Div().setClasses(["base", condition && "active"])` },
    // when() — correct pattern
    { code: `Div().when(cond, t => t.addClass("active"))` },
  ],
  invalid: [
    // Template literal with ternary expression
    {
      code: "Div().setClass(`base ${isActive ? 'active' : ''}`)",
      errors: [{ messageId: "noConditionalSetClass" }],
    },
    // Template literal with variable
    {
      code: "Div().setClass(`base ${cls}`)",
      errors: [{ messageId: "noConditionalSetClass" }],
    },
    // Ternary as direct arg
    {
      code: `Div().setClass(cond ? "a" : "b")`,
      errors: [{ messageId: "noConditionalSetClass" }],
    },
    // String concatenation
    {
      code: `Div().setClass("base " + extra)`,
      errors: [{ messageId: "noConditionalSetClass" }],
    },
  ],
});

// ------------------------------------
// no-innerhtml-swap
// ------------------------------------

runSuite("no-innerhtml-swap", noInnerHtmlSwap, {
  valid: [
    // outerHTML — correct
    { code: `hx("/api", { swap: "outerHTML" })` },
    // outerHTML scroll:top — correct
    { code: `hx("/api", { swap: "outerHTML scroll:top" })` },
    // beforeend — fine (for infinite scroll etc.)
    { code: `hx("/api", { swap: "beforeend" })` },
    // No swap specified — fine
    { code: `hx("/api", { target: "#list" })` },
  ],
  invalid: [
    // innerHTML in hx()
    {
      code: `hx("/api", { swap: "innerHTML" })`,
      output: `hx("/api", { swap: "outerHTML" })`,
      errors: [{ messageId: "noInnerHtmlSwap" }],
    },
    // innerHTML in setHtmx options
    {
      code: `Div().setHtmx("/api", { swap: "innerHTML" })`,
      output: `Div().setHtmx("/api", { swap: "outerHTML" })`,
      errors: [{ messageId: "noInnerHtmlSwap" }],
    },
    // innerHTML in hxGet options
    {
      code: `Button("Go").hxGet("/api", { swap: "innerHTML" })`,
      output: `Button("Go").hxGet("/api", { swap: "outerHTML" })`,
      errors: [{ messageId: "noInnerHtmlSwap" }],
    },
  ],
});

// ------------------------------------
// prefer-set-method
// ------------------------------------

runSuite("prefer-set-method", preferSetMethod, {
  valid: [
    // Using dedicated setter — correct
    { code: `Button("Save").setType("submit")` },
    { code: `Input().setPlaceholder("Name")` },
    { code: `Img().setSrc("photo.jpg")` },
    // addAttribute for non-standard/custom attrs — fine
    { code: `Div().addAttribute("x-on:click", "open = true")` },
    { code: `Div().addAttribute("hx-foo", "bar")` },
    // boolean attributes are NOT handled here (no dedicated setters in v6) — see prefer-toggle
    { code: `Button().addAttribute("disabled", "")` },
    { code: `Input().addAttribute("checked", "checked")` },
  ],
  invalid: [
    // type
    {
      code: `Button().addAttribute("type", "submit")`,
      output: `Button().setType("submit")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
    // role / title — 1:1 string setters (auto-fixable)
    {
      code: `Div("Alert").addAttribute("role", "alert")`,
      output: `Div("Alert").setRole("alert")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
    {
      code: `Button("?").addAttribute("title", "Help")`,
      output: `Button("?").setTitle("Help")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
    // aria-* / data-* / style / tabindex — typed setters, report only (no auto-fix)
    {
      code: `Button("Menu").addAttribute("aria-label", "Open")`,
      output: `Button("Menu").addAttribute("aria-label", "Open")`,
      errors: [{ messageId: "preferTypedSetter" }],
    },
    {
      code: `Div().addAttribute("data-id", "123")`,
      output: `Div().addAttribute("data-id", "123")`,
      errors: [{ messageId: "preferTypedSetter" }],
    },
    {
      code: `Div().addAttribute("style", "color: red")`,
      output: `Div().addAttribute("style", "color: red")`,
      errors: [{ messageId: "preferTypedSetter" }],
    },
    {
      code: `Div().addAttribute("tabindex", "0")`,
      output: `Div().addAttribute("tabindex", "0")`,
      errors: [{ messageId: "preferTypedSetter" }],
    },
    // placeholder
    {
      code: `Input().addAttribute("placeholder", "Enter name")`,
      output: `Input().setPlaceholder("Enter name")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
    // src
    {
      code: `Img().addAttribute("src", "photo.jpg")`,
      output: `Img().setSrc("photo.jpg")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
    // href
    {
      code: `A("Link").addAttribute("href", "/page")`,
      output: `A("Link").setHref("/page")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
    // name
    {
      code: `Input().addAttribute("name", "email")`,
      output: `Input().setName("email")`,
      errors: [{ messageId: "preferSetMethod" }],
    },
  ],
});

// ------------------------------------
// prefer-toggle
// ------------------------------------

runSuite("prefer-toggle", preferToggle, {
  valid: [
    // Already using .toggle — correct
    { code: `Input().toggle("checked")` },
    { code: `Button("Save").toggle("disabled", isLoading)` },
    // addAttribute for a non-boolean attr — prefer-set-method's job, not this rule
    { code: `Input().addAttribute("type", "checkbox")` },
    { code: `Div().addAttribute("data-open", "true")` },
  ],
  invalid: [
    // static literal value → auto-fix to bare .toggle()
    {
      code: `Button().addAttribute("disabled", "")`,
      output: `Button().toggle("disabled")`,
      errors: [{ messageId: "preferToggle" }],
    },
    {
      code: `Input().addAttribute("checked", "checked")`,
      output: `Input().toggle("checked")`,
      errors: [{ messageId: "preferToggle" }],
    },
    {
      code: `Option("A").addAttribute("selected", "true")`,
      output: `Option("A").toggle("selected")`,
      errors: [{ messageId: "preferToggle" }],
    },
    // dynamic value → report WITHOUT auto-fix (author must move the condition into the 2nd arg)
    {
      code: `Input().addAttribute("disabled", isDisabled ? "disabled" : "")`,
      output: `Input().addAttribute("disabled", isDisabled ? "disabled" : "")`,
      errors: [{ messageId: "preferToggle" }],
    },
  ],
});

// ------------------------------------
// no-raw-ids
// ------------------------------------

runSuite("no-raw-ids", noRawIds, {
  valid: [
    // Using defineIds reference — correct
    { code: `Div().setId(ids.userList)` },
    // Using createId — correct
    { code: `Div().setId(userId)` },
    // target with ids reference — correct
    { code: `hx("/api", { target: ids.userList })` },
    // target with id() helper — correct
    { code: `hx("/api", { target: id("user-list") })` },
    // target without # prefix (CSS class, etc.) — not an ID
    { code: `hx("/api", { target: ".container" })` },
    // target: "this" — special HTMX value
    { code: `hx("/api", { target: "this" })` },
  ],
  invalid: [
    // Hardcoded setId
    {
      code: `Div().setId("profile-response-target")`,
      errors: [{ messageId: "noRawSetId", data: { id: "profile-response-target" } }],
    },
    // Hardcoded setId — simple
    {
      code: `Div().setId("user-list")`,
      errors: [{ messageId: "noRawSetId", data: { id: "user-list" } }],
    },
    // Hardcoded target with #
    {
      code: `hx("/api", { target: "#user-list" })`,
      errors: [{ messageId: "noRawTarget", data: { target: "#user-list", suggestion: "userList" } }],
    },
    // Hardcoded target in hxGet options
    {
      code: `Button("Go").hxGet("/api", { target: "#result" })`,
      errors: [{ messageId: "noRawTarget", data: { target: "#result", suggestion: "result" } }],
    },
    // Hardcoded target in setHtmx
    {
      code: `Div().setHtmx("/api", { target: "#main-content" })`,
      errors: [{ messageId: "noRawTarget", data: { target: "#main-content", suggestion: "mainContent" } }],
    },
  ],
});

// ------------------------------------
// no-ternary-in-view-builder
// ------------------------------------

runSuite("no-ternary-in-view-builder", noTernaryInViewBuilder, {
  valid: [
    // No ternary — plain children
    { code: `Div(H1("Title"), P("Body"))` },
    // .when() pattern — correct
    { code: `Div().when(isAdmin, t => t.children(AdminPanel()))` },
    // Ternary outside a view builder — not our concern
    { code: `const x = cond ? "a" : "b"` },
    // Non-element function with ternary — fine
    { code: `myFunc(cond ? a : b)` },
    // Logical AND (not ternary) — fine
    { code: `Div(isAdmin && AdminPanel())` },
    // Ternary with literal values — fine
    { code: `Div(isActive ? "Active" : "Inactive")` },
    // Ternary with template literal — fine
    { code: `Span(count > 0 ? "yes" : "no")` },
    // Ternary with null literal — fine (both sides literals)
    { code: `Div(isReady ? "Ready" : null)` },
    // Ternary with non-element function call — fine (unknown)
    { code: `Div(cond ? getText() : "fallback")` },
    // Ternary with non-element function calls on both sides — fine
    { code: `Div(isLoggedIn ? getUserPanel() : getLoginForm())` },
  ],
  invalid: [
    // Direct ternary with known view elements
    {
      code: `Div(isLoggedIn ? Span("Yes") : P("No"))`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Ternary with one side being a known view element, other null
    {
      code: `Div(Header(), isAdmin ? Nav("admin") : null, Footer())`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Ternary inside array children
    {
      code: `Div([Header(), isAdmin ? Nav("admin") : null])`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Works with other element functions
    {
      code: `Ul(isExpanded ? Li("A") : Li("B"))`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Ul" } }],
    },
    // Multiple ternaries with view elements
    {
      code: `Div(a ? Span("a") : Span("b"), d ? Em("d") : Em("e"))`,
      errors: [
        { messageId: "noTernaryInViewBuilder", data: { name: "Div" } },
        { messageId: "noTernaryInViewBuilder", data: { name: "Div" } },
      ],
    },
    // Chained view element in ternary
    {
      code: `Div(isAdmin ? Span("Admin").font("bold") : Span("User"))`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Variable-assignment form — the audit's escapee
    {
      code: `const badge = active ? Span("On") : Span("Off")`,
      errors: [{ messageId: "noTernaryAssignment", data: { name: "badge" } }],
    },
    // Assignment (not declaration) form
    {
      code: `let panel; panel = admin ? Div("A") : Div("B")`,
      errors: [{ messageId: "noTernaryAssignment", data: { name: "panel" } }],
    },
    // Chained elements on both sides
    {
      code: `const row = ok ? Td(v).bg("x") : Td("—")`,
      errors: [{ messageId: "noTernaryAssignment", data: { name: "row" } }],
    },
  ],
});

// no-ternary-in-view-builder — assignment form stays quiet on non-view ternaries
runSuite("no-ternary-in-view-builder (assignment escapes)", noTernaryInViewBuilder, {
  valid: [
    // Value ternary — MatchValue territory, not this rule (both sides literals)
    { code: `const cls = ok ? "success" : "danger"` },
    // One side unknown — don't guess
    { code: `const x = cond ? getPanel() : Div("fallback")` },
    // Ternary over non-element calls
    { code: `const y = cond ? fnA() : fnB()` },
  ],
  invalid: [],
});

// ------------------------------------
// anchor-requires-cursor-pointer
// ------------------------------------

const anchorRequiresCursorPointer = require("../dist/rules/anchor-requires-cursor-pointer");

runSuite("anchor-requires-cursor-pointer", anchorRequiresCursorPointer, {
  valid: [
    // A() with cursor("pointer") — correct
    { code: `A("Click").setHref("/page").cursor("pointer")` },
    // cursor("pointer") before other methods
    { code: `A("Click").cursor("pointer").setHref("/page")` },
    // cursor-pointer via addClass
    { code: `A("Click").addClass("cursor-pointer")` },
    // cursor-pointer via setClass
    { code: `A("Click").setClass("cursor-pointer")` },
    // cursor-pointer in mixed classes
    { code: `A("Click").setClass("text-blue-500 cursor-pointer underline")` },
    // Not an anchor — no warning
    { code: `Div("hello")` },
    // Not an anchor — no warning
    { code: `Button("Go").setHref("/page")` },
    // A() with cursor("pointer") deep in chain
    { code: `A("Click").setHref("/page").setClass("text-blue-500").cursor("pointer").p("4")` },
    // Verb-chained anchors — the click verbs stamp cursor-pointer themselves (T4)
    { code: `A("Home").nav(routes.home())` },
    { code: `A("Pending").tab(routes.list({ status: "pending" }))` },
    { code: `A("Save").submit(routes.update())` },
    { code: `A("More").fragment(ids.list, routes.page({ p: 2 }))` },
    { code: `A("Dismiss").fire(routes.dismiss())` },
    // Verb deep in the chain still counts
    { code: `A("Home").p("2").nav(routes.home())` },
    // Explicit non-pointer cursor + verb — the dev's cursor wins, verb skips, no flag
    { code: `A("Drag").cursor("grab").nav(routes.home())` },
  ],
  invalid: [
    // A() without cursor
    {
      code: `A("Click")`,
      output: `A("Click").cursor("pointer")`,
      errors: [{ messageId: "missingCursorPointer" }],
    },
    // A() with href but no cursor
    {
      code: `A("Click").setHref("/page")`,
      output: `A("Click").setHref("/page").cursor("pointer")`,
      errors: [{ messageId: "missingCursorPointer" }],
    },
    // A() with other cursor value (not "pointer")
    {
      code: `A("Click").cursor("default")`,
      output: `A("Click").cursor("default").cursor("pointer")`,
      errors: [{ messageId: "missingCursorPointer" }],
    },
    // A() with styling but no cursor
    {
      code: `A("Click").setHref("/page").setClass("text-blue-500 underline")`,
      output: `A("Click").setHref("/page").setClass("text-blue-500 underline").cursor("pointer")`,
      errors: [{ messageId: "missingCursorPointer" }],
    },
    // A() with children and chaining but no cursor
    {
      code: `A("Click", Span("icon")).setHref("/page").p("4")`,
      output: `A("Click", Span("icon")).setHref("/page").p("4").cursor("pointer")`,
      errors: [{ messageId: "missingCursorPointer" }],
    },
  ],
});

// ------------------------------------
// no-superfluous-view-return-type
// ------------------------------------

const noSuperfluousViewReturnType = require("../dist/rules/no-superfluous-view-return-type");

const tsTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
});

function runTsSuite(name, rule, tests) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(name);
  console.log("=".repeat(50));
  try {
    tsTester.run(name, rule, tests);
    const total = tests.valid.length + tests.invalid.length;
    passCount += total;
    console.log(`  ✅ ${total} cases passed`);
  } catch (e) {
    failCount++;
    console.log(`  ❌ FAILED: ${e.message}`);
  }
}

runTsSuite("no-superfluous-view-return-type", noSuperfluousViewReturnType, {
  valid: [
    // No return type — correct
    `function MyView({ title }: Props) { return Div(title); }`,
    // Non-View return type — not our concern
    `function getCount(): number { return 42; }`,
    // Arrow function without return type
    `const MyView = ({ title }: Props) => Div(title);`,
    // Returns string, not View
    `function getName(): string { return "hello"; }`,
    // Multi-statement, no return type
    `function MyView({ title }: Props) { const x = 1; return Div(title); }`,
  ],
  invalid: [
    // Function declaration with : View
    {
      code: `function MyView({ title }: Props): View { return Div(title); }`,
      output: `function MyView({ title }: Props) { return Div(title); }`,
      errors: [{ messageId: "superfluousReturnType", data: { type: "View" } }],
    },
    // Arrow function with : View
    {
      code: `const MyView = ({ title }: Props): View => Div(title);`,
      output: `const MyView = ({ title }: Props) => Div(title);`,
      errors: [{ messageId: "superfluousReturnType", data: { type: "View" } }],
    },
    // Multi-statement function with : View
    {
      code: `function MyView({ title }: Props): View { const x = 1; const y = 2; return Div(title); }`,
      output: `function MyView({ title }: Props) { const x = 1; const y = 2; return Div(title); }`,
      errors: [{ messageId: "superfluousReturnType", data: { type: "View" } }],
    },
    // Function expression with : View
    {
      code: `const MyView = function({ title }: Props): View { return Div(title); }`,
      output: `const MyView = function({ title }: Props) { return Div(title); }`,
      errors: [{ messageId: "superfluousReturnType", data: { type: "View" } }],
    },
  ],
});

// ------------------------------------
// prefer-unit-overload
// ------------------------------------

const preferUnitOverload = require("../dist/rules/prefer-unit-overload");

runSuite("prefer-unit-overload", preferUnitOverload, {
  valid: [
    // Named Tailwind values — no warning
    { code: `Div().w("full")` },
    { code: `Div().minH("screen")` },
    { code: `Div().p("4")` },
    { code: `Div().gap("x", "2")` },
    { code: `Div().top("0")` },
    // Already using unit overload — no warning
    { code: `Div().w("px", 200)` },
    { code: `Div().minH("rem", 12)` },
    { code: `Div().p("em", 1.5)` },
    // Bracket values on non-unit methods (opacity/zIndex have no unit overload) — not our concern
    { code: `Div().opacity("[0.33]")` },
    { code: `Div().z("[999]")` },
    // Bracket values without a recognized CSS unit
    { code: `Div().w("[calc(100%-2rem)]")` },
    { code: `Div().h("[var(--height)]")` },
    { code: `Div().minH("[100cqw]")` },
    // Non-numeric bracket values
    { code: `Div().w("[fit-content]")` },
    // Template literals — skip
    { code: "Div().w(`[${size}px]`)" },
  ],
  invalid: [
    // Sizing methods
    {
      code: `Div().w("[200px]")`,
      output: `Div().w("px", 200)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "w", unit: "px", amount: "200", raw: "[200px]" } }],
    },
    // Scalar unit methods (F-C-160) — textSize now has the unit overload
    {
      code: `Div().text("[13px]")`,
      output: `Div().text("px", 13)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "text", unit: "px", amount: "13", raw: "[13px]" } }],
    },
    {
      code: `Div().h("[100vh]")`,
      output: `Div().h("vh", 100)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "h", unit: "vh", amount: "100", raw: "[100vh]" } }],
    },
    {
      code: `Div().minH("[180px]")`,
      output: `Div().minH("px", 180)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "minH", unit: "px", amount: "180", raw: "[180px]" } }],
    },
    {
      code: `Div().maxW("[64rem]")`,
      output: `Div().maxW("rem", 64)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "maxW", unit: "rem", amount: "64", raw: "[64rem]" } }],
    },
    {
      code: `Div().minW("[300px]")`,
      output: `Div().minW("px", 300)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "minW", unit: "px", amount: "300", raw: "[300px]" } }],
    },
    {
      code: `Div().maxH("[80dvh]")`,
      output: `Div().maxH("dvh", 80)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "maxH", unit: "dvh", amount: "80", raw: "[80dvh]" } }],
    },
    // Spacing
    {
      code: `Div().p("[16px]")`,
      output: `Div().p("px", 16)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "p", unit: "px", amount: "16", raw: "[16px]" } }],
    },
    {
      code: `Div().m("[1.5rem]")`,
      output: `Div().m("rem", 1.5)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "m", unit: "rem", amount: "1.5", raw: "[1.5rem]" } }],
    },
    {
      code: `Div().gap("[8px]")`,
      output: `Div().gap("px", 8)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "gap", unit: "px", amount: "8", raw: "[8px]" } }],
    },
    // Position
    {
      code: `Div().top("[10px]")`,
      output: `Div().top("px", 10)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "top", unit: "px", amount: "10", raw: "[10px]" } }],
    },
    {
      code: `Div().left("[50vw]")`,
      output: `Div().left("vw", 50)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "left", unit: "vw", amount: "50", raw: "[50vw]" } }],
    },
    {
      code: `Div().inset("[0px]")`,
      output: `Div().inset("px", 0)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "inset", unit: "px", amount: "0", raw: "[0px]" } }],
    },
    {
      code: `Div().right("[2rem]")`,
      output: `Div().right("rem", 2)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "right", unit: "rem", amount: "2", raw: "[2rem]" } }],
    },
    {
      code: `Div().bottom("[100%]")`,
      output: `Div().bottom("%", 100)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "bottom", unit: "%", amount: "100", raw: "[100%]" } }],
    },
    // Decimal values
    {
      code: `Div().p("[0.75rem]")`,
      output: `Div().p("rem", 0.75)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "p", unit: "rem", amount: "0.75", raw: "[0.75rem]" } }],
    },
    // All unit types
    {
      code: `Div().h("[100svh]")`,
      output: `Div().h("svh", 100)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "h", unit: "svh", amount: "100", raw: "[100svh]" } }],
    },
    {
      code: `Div().h("[100lvh]")`,
      output: `Div().h("lvh", 100)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "h", unit: "lvh", amount: "100", raw: "[100lvh]" } }],
    },
    {
      code: `Div().w("[50em]")`,
      output: `Div().w("em", 50)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "w", unit: "em", amount: "50", raw: "[50em]" } }],
    },
    // In a chain
    {
      code: `Div().p("4").w("[200px]").bg("white")`,
      output: `Div().p("4").w("px", 200).bg("white")`,
      errors: [{ messageId: "preferUnitOverload" }],
    },
  ],
});

// ------------------------------------
// prefer-htmx-api
// ------------------------------------

const preferHtmxApi = require("../dist/rules/prefer-htmx-api");

runSuite("prefer-htmx-api", preferHtmxApi, {
  valid: [
    // Using the HTMX API
    { code: `Div().hxGet("/endpoint")` },
    { code: `Div().hxPost("/endpoint", { trigger: "change", include: "this" })` },
    { code: `Div().setHtmx({ endpoint: "/api", method: "post", vals: { key: "val" } })` },
    // addAttribute with non-hx attributes is fine
    { code: `Div().addAttribute("data-foo", "bar")` },
    { code: `Div().addAttribute("aria-label", "hello")` },
    // Dynamic attribute names
    { code: `Div().addAttribute(attrName, "value")` },
  ],
  invalid: [
    {
      code: `Div().addAttribute("hx-trigger", "change")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-trigger" } }],
    },
    {
      code: `Div().addAttribute("hx-include", "this")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-include" } }],
    },
    {
      code: `Div().addAttribute("hx-vals", JSON.stringify({ filePath, line }))`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-vals" } }],
    },
    {
      code: `Div().addAttribute("hx-get", "/api/data")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-get" } }],
    },
    {
      code: `Div().addAttribute("hx-post", "/api/submit")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-post" } }],
    },
    {
      code: `Div().addAttribute("hx-target", "#result")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-target" } }],
    },
    {
      code: `Div().addAttribute("hx-swap", "outerHTML")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-swap" } }],
    },
    // Multiple hx-* in a chain
    {
      code: `Div().addAttribute("hx-trigger", "change").addAttribute("hx-include", "this").addAttribute("hx-vals", "{}")`,
      errors: [
        { messageId: "preferHtmxApi", data: { attr: "hx-vals" } },
        { messageId: "preferHtmxApi", data: { attr: "hx-include" } },
        { messageId: "preferHtmxApi", data: { attr: "hx-trigger" } },
      ],
    },
    {
      code: `Div().addAttribute("hx-confirm", "Are you sure?")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-confirm" } }],
    },
    {
      code: `Div().addAttribute("hx-boost", "true")`,
      errors: [{ messageId: "preferHtmxApi", data: { attr: "hx-boost" } }],
    },
  ],
});

// ------------------------------------
// prefer-form-for
// ------------------------------------

const preferFormFor = require("../dist/rules/prefer-form-for");

runSuite("prefer-form-for", preferFormFor, {
  valid: [
    // Form<T> binding usage — correct (no raw .setName on a field element)
    { code: `Form((f) => f.input("email", "email"))` },
    // Variable name — can't lint
    { code: `Input().setName(fieldName)` },
    // Template literal — can't lint
    { code: "Input().setName(`field_${i}`)" },
    // Button.setName — not a form field in the schema sense
    { code: `Button("Submit").setName("action")` },
    // Fieldset.setName — not a form field
    { code: `Fieldset().setName("group")` },
    // Output.setName — not a form field
    { code: `Output().setName("result")` },
    // Non-element function
    { code: `foo().setName("email")` },
    // No argument
    { code: `Input().setName()` },
  ],
  invalid: [
    // Input with literal setName
    {
      code: `Input("text").setName("email")`,
      errors: [{ messageId: "preferFormFor", data: { name: "email", element: "Input" } }],
    },
    // Input without type
    {
      code: `Input().setName("username")`,
      errors: [{ messageId: "preferFormFor", data: { name: "username", element: "Input" } }],
    },
    // Textarea with literal setName
    {
      code: `Textarea().setName("message")`,
      errors: [{ messageId: "preferFormFor", data: { name: "message", element: "Textarea" } }],
    },
    // Select with literal setName
    {
      code: `Select(Option("A")).setName("role")`,
      errors: [{ messageId: "preferFormFor", data: { name: "role", element: "Select" } }],
    },
    // Deep chain — still detects root element
    {
      code: `Input("email").setPlaceholder("you@example.com").setName("email").toggle("required")`,
      errors: [{ messageId: "preferFormFor", data: { name: "email", element: "Input" } }],
    },
  ],
});

// ------------------------------------
// no-removed-v4-utilities (C-04)
// ------------------------------------

runSuite("no-removed-v4-utilities", noRemovedV4Utilities, {
  valid: [
    // v4 slash opacity modifier — the correct form
    { code: `Div().setClass("bg-black/50")` },
    { code: `Div().addClass("text-white/75")` },
    // backdrop-opacity is a real v4 filter (NOT removed)
    { code: `Div().setClass("backdrop-opacity-50")` },
    // non-opacity utilities
    { code: `Div().setClass("bg-red-500 p-4 opacity-50")` },
    // method-call colors are untouched (rule only scans setClass/addClass strings)
    { code: `Div().bg("black/50")` },
  ],
  invalid: [
    {
      code: `Div().setClass("bg-opacity-50")`,
      errors: [{ messageId: "removedOpacity", data: { cls: "bg-opacity-50", util: "bg", amount: "50" } }],
    },
    {
      code: `Div().addClass("text-opacity-75")`,
      errors: [{ messageId: "removedOpacity", data: { cls: "text-opacity-75", util: "text", amount: "75" } }],
    },
    // mixed with valid classes — only the removed one flags
    {
      code: `Div().setClass("flex bg-opacity-50 p-4")`,
      errors: [{ messageId: "removedOpacity", data: { cls: "bg-opacity-50", util: "bg", amount: "50" } }],
    },
    // variant-prefixed
    {
      code: `Div().setClass("hover:border-opacity-30")`,
      errors: [{ messageId: "removedOpacity", data: { cls: "border-opacity-30", util: "border", amount: "30" } }],
    },
    // ring/divide/placeholder families
    {
      code: `Div().addClass("ring-opacity-40")`,
      errors: [{ messageId: "removedOpacity", data: { cls: "ring-opacity-40", util: "ring", amount: "40" } }],
    },
  ],
});

// ------------------------------------
// no-conflicting-classes-in-setclass — v4 gradient family (C-04)
// ------------------------------------

runSuite("no-conflicting-classes (gradient family)", noConflictingClassesInSetclass, {
  valid: [
    // one gradient type + non-conflicting stops
    { code: `Div().setClass("bg-linear-to-r from-red-500 to-blue-500")` },
    { code: `Div().setClass("bg-radial from-white to-black")` },
  ],
  invalid: [
    // mixing gradient TYPES (v4)
    {
      code: `Div().setClass("bg-linear-to-r bg-radial")`,
      errors: [{ messageId: "conflictingClasses", data: { first: "bg-linear-to-r", second: "bg-radial" } }],
    },
    // v3→v4 migration artifact (bg-gradient- + bg-linear-)
    {
      code: `Div().setClass("bg-gradient-to-r bg-linear-to-l")`,
      errors: [{ messageId: "conflictingClasses", data: { first: "bg-gradient-to-r", second: "bg-linear-to-l" } }],
    },
    // two linear directions
    {
      code: `Div().setClass("bg-linear-to-r bg-linear-to-l")`,
      errors: [{ messageId: "conflictingClasses", data: { first: "bg-linear-to-r", second: "bg-linear-to-l" } }],
    },
  ],
});

// ------------------------------------
// no-raw-icon-string
// ------------------------------------

runSuite("no-raw-icon-string", noRawIconString, {
  valid: [
    // typed SVG builders — correct
    { code: `Svg(Path().setD("M0 0 L24 24"))` },
    // Raw() of non-SVG content is fine
    { code: `Raw("<strong>bold</strong>")` },
    { code: `Raw(htmlFromTrustedSource)` },
  ],
  invalid: [
    {
      code: `Raw("<svg viewBox='0 0 24 24'><path d='M0 0'/></svg>")`,
      errors: [{ messageId: "noRawIcon" }],
    },
    {
      code: "Raw(`<svg>${inner}</svg>`)",
      errors: [{ messageId: "noRawIcon" }],
    },
  ],
});

// ------------------------------------
// no-fluent-equivalent-in-setstyle
// ------------------------------------

const noFluentEquivalentInSetstyle = require("../dist/rules/no-fluent-equivalent-in-setstyle");

runSuite("no-fluent-equivalent-in-setstyle", noFluentEquivalentInSetstyle, {
  valid: [
    // dynamic values — the legitimate escape hatch
    { code: "Div().setStyle(`width: ${progress}%`)" },
    { code: "Div().setStyle(`background-color: ${color}`)" },
    // functional CSS — gradients, rgba, color-mix, clamp, var, url, calc
    { code: `Div().setStyle("background:linear-gradient(120deg,#1a4e86,#0a2340)")` },
    { code: `Div().setStyle("background:rgba(255,255,255,0.1)")` },
    { code: `Div().setStyle("border-color:color-mix(in srgb, red 50%, blue)")` },
    { code: `Div().setStyle("font-size:clamp(2.3rem,4.6vw,3.3rem)")` },
    { code: `Div().setStyle("border-top:1px solid var(--color-border)")` },
    { code: `Div().setStyles({ backgroundImage: "url('/img.png')", backgroundSize: "cover" })` },
    // properties with no fluent equivalent
    { code: `Div().setStyle("aspect-ratio:16/9")` },
    { code: `Div().setStyle("backdrop-filter:blur(4px)")` },
    // mixed: static part of a template decl touching an expression is skipped
    { code: "Div().setStyle(`margin: ${x}px 0`)" },
    // non-literal arg — skipped
    { code: `Div().setStyle(styleVar)` },
    // ignoredProperties option
    { code: `Div().setStyle("width:44px")`, options: [{ ignoredProperties: ["width"] }] },
    // unrelated setStyles value shapes — skipped
    { code: `Div().setStyles({ width: someVar })` },
  ],
  invalid: [
    // string form: unit-overload equivalents
    {
      code: `Div().setStyle("width:44px;height:44px")`,
      errors: [
        { messageId: "useFluentEquivalent", data: { decl: "width: 44px", suggestion: '.w("px", 44)' } },
        { messageId: "useFluentEquivalent", data: { decl: "height: 44px", suggestion: '.h("px", 44)' } },
      ],
    },
    {
      code: `Div().setStyle("font-size:1.9rem")`,
      errors: [{ messageId: "useFluentEquivalent", data: { decl: "font-size: 1.9rem", suggestion: '.text("rem", 1.9)' } }],
    },
    {
      code: `Div().setStyle("letter-spacing:0.13em;line-height:1.6")`,
      errors: [
        { messageId: "useFluentEquivalent", data: { decl: "letter-spacing: 0.13em", suggestion: '.tracking("em", 0.13)' } },
        { messageId: "useFluentEquivalent", data: { decl: "line-height: 1.6", suggestion: '.leading(…)' } },
      ],
    },
    // template literal: static declarations still flagged, dynamic ones skipped
    {
      code: "Div().setStyle(`width:44px;background:${tint}`)",
      errors: [{ messageId: "useFluentEquivalent", data: { decl: "width: 44px", suggestion: '.w("px", 44)' } }],
    },
    // plain colors → theme token
    {
      code: `Div().setStyle("color:#FDB813")`,
      errors: [{ messageId: "useFluentEquivalent", data: { decl: "color: #FDB813", suggestion: ".text(…) with a theme token" } }],
    },
    {
      code: `Div().setStyle("background:#fff")`,
      errors: [{ messageId: "useFluentEquivalent", data: { decl: "background: #fff", suggestion: ".bg(…) with a theme token" } }],
    },
    // keyword props
    {
      code: `Div().setStyle("white-space:nowrap")`,
      errors: [{ messageId: "useFluentEquivalent", data: { decl: "white-space: nowrap", suggestion: ".whitespace(…)" } }],
    },
    {
      code: `Div().setStyle("display:flex;position:absolute")`,
      errors: [
        { messageId: "useFluentEquivalent", data: { decl: "display: flex", suggestion: ".flex()" } },
        { messageId: "useFluentEquivalent", data: { decl: "position: absolute", suggestion: ".absolute()" } },
      ],
    },
    // multi-value shorthand
    {
      code: `Div().setStyle("padding:26px 24px 24px 28px")`,
      errors: [{ messageId: "useFluentEquivalent", data: { decl: "padding: 26px 24px 24px 28px", suggestion: ".p(…) per side" } }],
    },
    // setStyles object form: camelCase keys
    {
      code: `Div().setStyles({ fontSize: "14px", textAlign: "center" })`,
      errors: [
        { messageId: "useFluentEquivalent", data: { decl: "font-size: 14px", suggestion: '.text("px", 14)' } },
        { messageId: "useFluentEquivalent", data: { decl: "text-align: center", suggestion: ".text(…)" } },
      ],
    },
    {
      code: `Div().setStyles({ margin: "24px 0", zIndex: 999 })`,
      errors: [
        { messageId: "useFluentEquivalent", data: { decl: "margin: 24px 0", suggestion: ".m(…) per side" } },
        { messageId: "useFluentEquivalent", data: { decl: "z-index: 999", suggestion: ".z(…)" } },
      ],
    },
  ],
});

// ------------------------------------
// no-tailwind-in-raw-class (escape-hatch rule set)
// ------------------------------------

const noTailwindInRawClass = require("../dist/rules/no-tailwind-in-raw-class");
const noDynamicClassArgument = require("../dist/rules/no-dynamic-class-argument");
const noTailwindInCssclass = require("../dist/rules/no-tailwind-in-cssclass");

runSuite("no-tailwind-in-raw-class", noTailwindInRawClass, {
  valid: [
    // Category-C false-positive guards: Tailwind-shaped, but the root is not a
    // Tailwind utility root — never flagged (PRD rabbit hole).
    { code: `Div().addClass("sidebar-backdrop")` },
    { code: `Div().addClass("entry-row")` },
    { code: `Div().addClass("hamburger-line")` },
    { code: `Div().setClass("js-map-container")` },
    // bare single words are deliberately out of shape (collision-prone)
    { code: `Div().addClass("container")` },
    { code: `Div().addClass("card")` },
    // unknown variant head + unknown base — not recognizably Tailwind
    { code: `Div().addClass("foo:bar-baz")` },
    // ignoredClasses escape stays available
    { code: `Div().addClass("bg-grid")`, options: [{ ignoredClasses: ["bg-grid"] }] },
  ],
  invalid: [
    // mapped utility — autofix, message states the exact replacement
    {
      code: `Div().addClass("grid-cols-1")`,
      output: `Div().gridCols("1")`,
      errors: [{
        message: `'grid-cols-1' in .addClass() bypasses the typed surface. Replace with: .gridCols("1"). [autofix]`,
      }],
    },
    // the design's flagship case: variant token folds into the object form
    {
      code: `Div().addClass("grid-cols-1 sm:grid-cols-2")`,
      output: `Div().gridCols("1").sm({ gridCols: "2" })`,
      errors: [
        { messageId: "replaceWith", data: { callee: "addClass", className: "grid-cols-1", fluentChain: `.gridCols("1")` } },
        { messageId: "replaceWith", data: { callee: "addClass", className: "sm:grid-cols-2", fluentChain: `.sm({ gridCols: "2" })` } },
      ],
    },
    // state variant → tier-1 object method; multi-level variants nest as keys
    {
      code: `Div().addClass("hover:bg-blue-600")`,
      output: `Div().hover({ bg: "blue-600" })`,
      errors: [{ messageId: "replaceWith" }],
    },
    {
      code: `Div().addClass("sm:hover:bg-blue-600")`,
      output: `Div().sm({ hover: { bg: "blue-600" } })`,
      errors: [{ messageId: "replaceWith" }],
    },
    // 2xl spells its tier-1 member xl2; directional spacing flattens (px)
    {
      code: `Div().addClass("2xl:px-16")`,
      output: `Div().xl2({ px: "16" })`,
      errors: [{ messageId: "replaceWith" }],
    },
    // non-tier-1 outer head falls back to the generic .variant()
    {
      code: `Div().addClass("peer-invalid:text-red-600")`,
      output: `Div().variant("peer-invalid", { text: "red-600" })`,
      errors: [{ messageId: "replaceWith" }],
    },
    // bare optional utility under a variant → boolean-true entry
    {
      code: `Div().addClass("focus:ring")`,
      output: `Div().focus({ ring: true })`,
      errors: [{ messageId: "replaceWith" }],
    },
    // unknown-but-Tailwind-shaped with a real root (PRD: shadow-violet-500/40)
    {
      code: `Div().addClass("shadow-violet-500/40")`,
      output: `Div().shadow("violet-500/40")`,
      errors: [{ messageId: "replaceWith" }],
    },
    // Tailwind root with no fluent method → routes to .cssProp / vocab gap
    {
      code: `Div().addClass("basis-32")`,
      errors: [{ messageId: "tailwindNoMethod", data: { callee: "addClass", className: "basis-32", root: "basis" } }],
    },
    // mixed literal: mappable tokens rewritten, non-Tailwind kept in the call
    {
      code: `Div().addClass("p-4 sidebar-backdrop")`,
      output: `Div().p("4").addClass("sidebar-backdrop")`,
      errors: [{ messageId: "replaceWith" }],
    },
    // setClass flagged identically
    {
      code: `Div().setClass("flex items-center gap-4")`,
      output: `Div().flex().items("center").gap("4")`,
      errors: [
        { messageId: "replaceWith" },
        { messageId: "replaceWith" },
        { messageId: "replaceWith" },
      ],
    },
    // arbitrary-selector variant head is recognized → generic .variant()
    {
      code: `Div().addClass("[&>li]:p-2")`,
      output: `Div().variant("[&>li]", { p: "2" })`,
      errors: [{ messageId: "replaceWith" }],
    },
    // non-tier-1 head in NESTED position is not object-expressible — report, no autofix
    {
      code: `Div().addClass("hover:peer-invalid:underline")`,
      errors: [{ messageId: "variantNoMethod" }],
    },
    // setClasses array elements are analyzed (no autofix)
    {
      code: `Div().setClasses(["p-4", "entry-row"])`,
      errors: [{ messageId: "replaceWith" }],
    },
  ],
});

// ------------------------------------
// no-dynamic-class-argument
// ------------------------------------

runSuite("no-dynamic-class-argument", noDynamicClassArgument, {
  valid: [
    { code: `Div().addClass("p-4 bg-white")` },
    { code: `Div().setClass("container mx-auto")` },
    { code: `Div().cssClass("js-hook")` },
    // template literal without interpolation is static
    { code: "Div().addClass(`p-4`)" },
    // setClasses is the sanctioned conditional-array form — not this rule's target
    { code: `Div().setClasses([cond && "p-4"])` },
  ],
  invalid: [
    {
      code: `Div().addClass(colors)`,
      errors: [{
        message: `.addClass(colors) is invisible to the safelist extractor — styles can silently disappear in production. Use .when(...) / Match(...) with literal classes per branch, or defineTheme's staticManifest for token-driven values.`,
      }],
    },
    { code: `Div().addClass(cond ? "bg-red-500" : "bg-green-500")`, errors: [{ messageId: "dynamicArg" }] },
    { code: "Div().addClass(`bg-${color}`)", errors: [{ messageId: "dynamicArg" }] },
    { code: `Div().setClass(classNames.join(" "))`, errors: [{ messageId: "dynamicArg" }] },
    { code: `Div().cssClass(hookName)`, errors: [{ messageId: "dynamicArg" }] },
  ],
});

// ------------------------------------
// no-tailwind-in-cssclass
// ------------------------------------

runSuite("no-tailwind-in-cssclass", noTailwindInCssclass, {
  valid: [
    { code: `Div().cssClass("js-map-container")` },
    { code: `Div().cssClass("shepherd-target")` },
    { code: `Div().cssClass("sidebar-backdrop entry-row")` },
    // dynamic args are no-dynamic-class-argument's job
    { code: `Div().cssClass(name)` },
  ],
  invalid: [
    {
      code: `Div().cssClass("p-4")`,
      output: `Div().p("4")`,
      errors: [{ messageId: "tailwindInCssClass", data: { className: "p-4", fluentChain: `.p("4")` } }],
    },
    // mixed: utility extracted, legit hook kept
    {
      code: `Div().cssClass("js-hook bg-red-500")`,
      output: `Div().bg("red-500").cssClass("js-hook")`,
      errors: [{ messageId: "tailwindInCssClass" }],
    },
    // variant token is Tailwind by its head
    {
      code: `Div().cssClass("hover:bg-blue-600")`,
      output: `Div().hover({ bg: "blue-600" })`,
      errors: [{ messageId: "tailwindInCssClass" }],
    },
  ],
});

// ------------------------------------
// require-satisfies-variant-object (object-variants excess-property hole)
// ------------------------------------

const requireSatisfiesVariantObject = require("../dist/rules/require-satisfies-variant-object");

runTsSuite("require-satisfies-variant-object", requireSatisfiesVariantObject, {
  valid: [
    // inline object literals get excess-property checking from TS itself
    { code: `Div().hover({ bg: "blue-600" })` },
    { code: `Div().variant("data-[state=open]", { rounded: "lg" })` },
    // satisfies-pinned const — the declaration site re-runs the literal check
    { code: `const glow = { shadow: "lg", ring: 2 } satisfies VariantStyleObject; Div().hover(glow);` },
    { code: `const glow = { shadow: "lg" } satisfies VariantStyleObject; Div().hover({ ...glow, bg: "blue-600" });` },
    // unresolvable (imported/param) names are skipped — declaration site is elsewhere
    { code: `import { glow } from "./presets"; Div().hover(glow);` },
    // same-named non-fluent calls never fire (keys are not variant keys)
    { code: `const item = { priority: 1 }; queue.last(item);` },
    { code: `el.focus(options);` },
    // nested tier-1 keys with inline objects are fine
    { code: `Div().md({ hover: { bg: "blue-700" } })` },
  ],
  invalid: [
    {
      code: `const glow = { shadow: "lg", ring: 2 }; Div().hover(glow);`,
      errors: [{ messageId: "requireSatisfies" }],
    },
    {
      code: `const styles = { bg: "blue-50" }; Div().variant("aria-checked", styles);`,
      errors: [{ messageId: "requireSatisfies" }],
    },
    {
      code: `const glow = { shadow: "lg" }; Div().hover({ ...glow, bg: "blue-600" });`,
      errors: [{ messageId: "requireSatisfiesSpread" }],
    },
    {
      code: `const inner = { bg: "gray-800" }; Div().dark({ hover: { ...inner } });`,
      errors: [{ messageId: "requireSatisfiesSpread" }],
    },
  ],
});

// ------------------------------------
// prefer-nav-for-internal-links
// ------------------------------------

const preferNavForInternalLinks = require("../dist/rules/prefer-nav-for-internal-links");

runSuite("prefer-nav-for-internal-links", preferNavForInternalLinks, {
  valid: [
    // The right pattern — typed route through .nav
    { code: `A("Home").nav(routes.home())` },
    // External URLs stay on setHref
    { code: `A("Docs").setHref("https://example.com/docs")` },
    { code: `A("CDN").setHref("//cdn.example.com/x")` },
    { code: `A("Mail").setHref("mailto:hi@example.com")` },
    // New-tab link — full load is the point
    { code: `A("Report").setHref("/reports/1.pdf").setTarget("_blank")` },
    // Download link
    { code: `A("Export").setHref("/export.csv").setDownload("export.csv")` },
    { code: `A("Export").setHref("/export.csv").toggle("download")` },
    // Non-literal href — resolve()/variables are deliberate (OAuth redirects etc.)
    { code: `A(label).setHref(oauthRoutes.authorize.resolve({ provider }))` },
    { code: `A(s.label).setHref(s.id.selector)` },
    // Not an anchor
    { code: `Form().setHref("/x")` },
  ],
  invalid: [
    {
      code: `A("Settings").setHref("/settings")`,
      errors: [{ messageId: "preferNav" }],
    },
    // Deep in a chain, styling around it
    {
      code: `A("Billing").p("2").setHref("/billing").cursor("pointer")`,
      errors: [{ messageId: "preferNav" }],
    },
    // target="_self" is not an escape
    {
      code: `A("Home").setHref("/").setTarget("_self")`,
      errors: [{ messageId: "preferNav" }],
    },
  ],
});

// ------------------------------------
// prefer-match
// ------------------------------------

const preferMatch = require("../dist/rules/prefer-match");

runSuite("prefer-match", preferMatch, {
  valid: [
    // Single IfThen — no chain
    { code: `Div(IfThen(user.status === "ACTIVE", () => Badge()))` },
    // Two IfThen on different discriminants
    { code: `Div(IfThen(a.status === "x", () => A()), IfThen(b.kind === "y", () => B()))` },
    // Match already in use
    { code: `Div(Match(payment.status, { COMPLETED: () => Done(), FAILED: () => Retry() }))` },
    // Only one equality condition — the other is a comparison
    { code: `Div(IfThen(items.length > 0, () => List(items)), IfThen(flag === true, () => Empty()))` },
    // IfThen calls in different parents are not siblings
    { code: `Div(Div(IfThen(x.s === "a", () => A())), Div(IfThen(x.s === "b", () => B())))` },
    // .when chain without discriminant equality
    { code: `Badge(label).when(active, t => t.bg("success/10")).when(disabled, t => t.opacity("50"))` },
    // Single .when equality link
    { code: `Span(s).when(s === "active", t => t.bg("success/10")).p("2")` },
    // Optional chaining discriminant is skipped
    { code: `Div(IfThen(user?.status === "a", () => A()), IfThen(user?.status === "b", () => B()))` },
  ],
  invalid: [
    // Member discriminant → key-form Match suggestion
    {
      code: `Div(IfThen(payment.status === "COMPLETED", () => RefundForm()), IfThen(payment.status === "FAILED", () => RetryBanner()))`,
      errors: [{
        messageId: "preferMatch",
        suggestions: [{
          messageId: "suggestMatch",
          output: `Div(Match(payment, "status", { COMPLETED: () => RefundForm(), FAILED: () => RetryBanner() }))`,
        }],
      }],
    },
    // Identifier discriminant → value-form Match suggestion
    {
      code: `Div(IfThen(status === "active", () => Active()), IfThen(status === "closed", () => Closed()))`,
      errors: [{
        messageId: "preferMatch",
        suggestions: [{
          messageId: "suggestMatch",
          output: `Div(Match(status, { active: () => Active(), closed: () => Closed() }))`,
        }],
      }],
    },
    // Three-link chain, quoted key for a non-identifier literal
    {
      code: `Div(IfThen(x.s === "a", () => A()), IfThen(x.s === "in-progress", () => B()), IfThen(x.s === "c", () => C()))`,
      errors: [{
        messageId: "preferMatch",
        suggestions: [{
          messageId: "suggestMatch",
          output: `Div(Match(x, "s", { a: () => A(), "in-progress": () => B(), c: () => C() }))`,
        }],
      }],
    },
    // Numeric literal keys
    {
      code: `Div(IfThen(code === 1, () => A()), IfThen(code === 2, () => B()))`,
      errors: [{
        messageId: "preferMatch",
        suggestions: [{
          messageId: "suggestMatch",
          output: `Div(Match(code, { 1: () => A(), 2: () => B() }))`,
        }],
      }],
    },
    // Reversed literal side still matches
    {
      code: `Div(IfThen("a" === x.s, () => A()), IfThen("b" === x.s, () => B()))`,
      errors: [{ messageId: "preferMatch" }],
    },
    // Non-consecutive siblings — report, no suggestion (merging would reorder the DOM)
    {
      code: `Div(IfThen(x.s === "a", () => A()), Divider(), IfThen(x.s === "b", () => B()))`,
      errors: [{ messageId: "preferMatch" }],
    },
    // Duplicate literal — report, no suggestion (both branches render today)
    {
      code: `Div(IfThen(x.s === "a", () => A()), IfThen(x.s === "a", () => B()))`,
      errors: [{ messageId: "preferMatch" }],
    },
    // 1 and "1" coerce to the same object key — a merged cases object would
    // silently drop a branch, so report without suggestion
    {
      code: `Div(IfThen(code === 1, () => A()), IfThen(code === "1", () => B()))`,
      errors: [{ messageId: "preferMatch", suggestions: [] }],
    },
    // Non-function branch — report, no suggestion
    {
      code: `Div(IfThen(x.s === "a", viewA), IfThen(x.s === "b", viewB))`,
      errors: [{ messageId: "preferMatch" }],
    },
    // .when chain twin → .whenMatch suggestion
    {
      code: `Span(s).when(s === "active", t => t.bg("success/10")).when(s === "closed", t => t.bg("surface-2"))`,
      errors: [{
        messageId: "preferWhenMatch",
        suggestions: [{
          messageId: "suggestWhenMatch",
          output: `Span(s).whenMatch(s, { active: t => t.bg("success/10"), closed: t => t.bg("surface-2") })`,
        }],
      }],
    },
    // .when chain on a member discriminant
    {
      code: `Badge(o).when(o.state === "ok", t => t.text("success")).when(o.state === "err", t => t.text("danger"))`,
      errors: [{
        messageId: "preferWhenMatch",
        suggestions: [{
          messageId: "suggestWhenMatch",
          output: `Badge(o).whenMatch(o.state, { ok: t => t.text("success"), err: t => t.text("danger") })`,
        }],
      }],
    },
  ],
});

// ------------------------------------
// no-dynamic-typed-styling-arg
// ------------------------------------

const noDynamicTypedStylingArg = require("../dist/rules/no-dynamic-typed-styling-arg");

runSuite("no-dynamic-typed-styling-arg", noDynamicTypedStylingArg, {
  valid: [
    // Literals
    { code: `Div().bg("primary").p("6").rounded("card")` },
    // Unit overload with literal amount
    { code: `Div().w("px", 180).minH("rem", 12)` },
    // Static template literal
    { code: "Div().bg(`surface`)" },
    // Negative literal
    { code: `Div().z(-10)` },
    // undefined skips the call
    { code: `Div().border(undefined)` },
    // cssProp with literal args
    { code: `Div().cssProp("mask-repeat", "no-repeat")` },
    // Vocab-named methods with no fluent evidence — never flagged
    { code: `Array.from(items, (x) => renderRow(x))` },
    { code: `path.relative(baseDir, file)` },
    { code: `buffer.fill(value)` },
    { code: `store.select(selectorFn)` },
    // Bare single-link styler without annotation or fluent context (documented limitation)
    { code: `const f = (t) => t.bg(color)` },
    // Colliding non-fluent chains: vocab-named links on module objects never fire —
    // the link-count gate needs a param-rooted receiver and token-shaped string evidence
    { code: `sharp(input).rotate().resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: "cover" }).webp({ quality: 82 })` },
    { code: `d3.select("#chart").transition().duration(dur)` },
    { code: `d3.select("#label").text(d => d.label)` },
    { code: `knex.select("id", "name").from(tableName)` },
    { code: `gsap.timeline().to(".box", { x: 100 }).from(".other", { y: 50 })` },
    // Non-vocab methods take anything
    { code: `Div().setStyle("color", themeColor)` },
    { code: `Div().addAttribute("data-x", value)` },
  ],
  invalid: [
    // Identifier arg on an element-rooted chain
    {
      code: `Div().bg(color)`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "color" } }],
    },
    // Unit overload with a dynamic amount
    {
      code: `Div().w("px", width)`,
      errors: [{ messageId: "dynamicArg", data: { method: "w", argText: "width" } }],
    },
    // Member-expression lookup — the extractor's own headline example
    {
      code: `Div().bg(BG[status])`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "BG[status]" } }],
    },
    // Ternary — even with two literal branches the extractor can't resolve it
    {
      code: `Div().bg(cond ? "primary" : "surface")`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: `cond ? "primary" : "surface"` } }],
    },
    // Interpolated template literal
    {
      code: "Div().text(`${tone}`)",
      errors: [{ messageId: "dynamicArg", data: { method: "text", argText: "`${tone}`" } }],
    },
    // Call-expression arg
    {
      code: `Div().bg(pickColor())`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "pickColor()" } }],
    },
    // Two vocab links make the chain fluent even without an element root
    {
      code: `const card = (t) => t.p("6").bg(color)`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "color" } }],
    },
    // Callback param of a fluent context method
    {
      code: `Button("Save").when(isActive, (t) => t.bg(activeColor))`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "activeColor" } }],
    },
    // whenMatch case-object branches are Tag callbacks too
    {
      code: `Span(s).whenMatch(s, { active: t => t.bg(BG[s]), closed: t => t.bg("surface-2") })`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "BG[s]" } }],
    },
    // whenMatch default fn is a direct argument — covered by the context gate
    {
      code: `Span(s).whenMatch(s, { active: t => t.bg("success/10") }, t => t.bg(fallback))`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "fallback" } }],
    },
    // Match branches receive values, not Tags — their output chains root at
    // element constructors, so the existing evidence already covers them
    {
      code: `Match(x, "status", { PENDING: () => Span(label).bg(STATUS_BG[x.status]) })`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "STATUS_BG[x.status]" } }],
    },
    // cssProp with a dynamic value
    {
      code: `Div().cssProp("mask-repeat", repeatMode)`,
      errors: [{ messageId: "dynamicArg", data: { method: "cssProp", argText: "repeatMode" } }],
    },
    // Deep chain keeps the element root
    {
      code: `Span(label).p("2").text(SIZES[level]).rounded("control")`,
      errors: [{ messageId: "dynamicArg", data: { method: "text", argText: "SIZES[level]" } }],
    },
  ],
});

runTsSuite("no-dynamic-typed-styling-arg (Styler annotations)", noDynamicTypedStylingArg, {
  valid: [
    // Unrelated annotation, single link, no fluent context
    { code: `const f: Mapper = (t) => t.bg(color);` },
    // Annotated styler with literal args
    { code: `const card: Styler = (t) => t.p("6").bg("surface").rounded("card");` },
  ],
  invalid: [
    // Styler-annotated single-link body
    {
      code: `const accent: Styler = (t) => t.bg(color);`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "color" } }],
    },
    // StylerFor — the everyframe dynamic styler-map shape
    {
      code: `const byStatus: StylerFor<Status> = (s) => (t) => t.bg(BG[s]);`,
      errors: [{ messageId: "dynamicArg", data: { method: "bg", argText: "BG[s]" } }],
    },
  ],
});

// ------------------------------------
// Summary
// ------------------------------------

console.log(`\n${"=".repeat(50)}`);
console.log("TEST SUMMARY");
console.log("=".repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log("=".repeat(50));

if (failCount > 0) process.exit(1);
