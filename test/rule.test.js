const { RuleTester } = require("eslint");

const noKnownModifiersInSetclass = require("../dist/rules/no-known-modifiers-in-setclass");
const noSetclassInWhenApplyCallback = require("../dist/rules/no-setclass-in-when-apply-callback");
const noSetclassAfterFluentModifier = require("../dist/rules/no-setclass-after-fluent-modifier");
const preferVariadicChildren = require("../dist/rules/prefer-variadic-children");
const noConditionalInSetclass = require("../dist/rules/no-conditional-in-setclass");
const noInnerHtmlSwap = require("../dist/rules/no-innerhtml-swap");
const preferSetMethod = require("../dist/rules/prefer-set-method");
const noRawIds = require("../dist/rules/no-raw-ids");
const noTernaryInViewBuilder = require("../dist/rules/no-ternary-in-view-builder");

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
      output: `Div().background("red-500").addClass("bg-grid")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "bg-red-500", method: "background()" } }],
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
    // font-mono → .fontFamily("mono")
    {
      code: `Div().addClass("font-mono")`,
      output: `Div().fontFamily("mono")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "font-mono", method: "fontFamily('mono')" } }],
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
      output: `Div().shadowColor("coral/30")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "shadow-coral/30", method: "shadowColor()" } }],
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
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "backdrop-blur-sm", method: "backdropBlur()" } }],
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
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "ease-out", method: "ease()" } }],
    },
    // addClass with single base utility
    {
      code: `Div().addClass("mt-2")`,
      output: `Div().margin("t", "2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "mt-2", method: "margin('t', ...)" } }],
    },
    // addClass with variant prefix — suggest .on()
    {
      code: `Div().addClass("hover:bg-blue-600")`,
      errors: [{ messageId: "useVariantMethod", data: { callee: "addClass", className: "hover:bg-blue-600", variantMethod: "on", variant: "hover", method: "background()" } }],
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
        { messageId: "useVariantMethod", data: { callee: "addClass", className: "hover:bg-blue-600", variantMethod: "on", variant: "hover", method: "background()" } },
        { messageId: "useVariantMethod", data: { callee: "addClass", className: "focus:ring-2", variantMethod: "on", variant: "focus", method: "ring('2')" } },
      ],
    },
    // addClass with base utility + modifier-prefixed class — keeps modifier class in addClass
    {
      code: `Div().addClass("p-4 hover:bg-blue-600")`,
      output: `Div().padding("4").addClass("hover:bg-blue-600")`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "p-4", method: "padding()" } },
        { messageId: "useVariantMethod", data: { callee: "addClass", className: "hover:bg-blue-600", variantMethod: "on", variant: "hover", method: "background()" } },
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
      output: `Div().margin("t", "2").padding("4")`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "mt-2", method: "margin('t', ...)" } },
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "p-4", method: "padding()" } },
      ],
    },
    // setClass still works (regression check)
    {
      code: `Div().setClass("mt-2")`,
      output: `Div().margin("t", "2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "setClass", className: "mt-2", method: "margin('t', ...)" } }],
    },
    // setClasses with a string literal element that has a known modifier
    {
      code: `Div().setClasses(["p-4", isActive && "active"])`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "setClasses", className: "p-4", method: "padding()" } }],
    },
    // setClasses with multiple known modifiers
    {
      code: `Div().setClasses(["mt-2", "rounded"])`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "setClasses", className: "mt-2", method: "margin('t', ...)" } },
        { messageId: "useKnownModifier", data: { callee: "setClasses", className: "rounded", method: "rounded()" } },
      ],
    },
    // addClass with list-disc
    {
      code: `Div().addClass("list-disc")`,
      output: `Div().listStyleType("disc")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-disc", method: "listStyleType('disc')" } }],
    },
    // addClass with list-inside
    {
      code: `Div().addClass("list-inside")`,
      output: `Div().listStylePosition("inside")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-inside", method: "listStylePosition('inside')" } }],
    },
    // addClass with list-disc list-inside combined
    {
      code: `Div().addClass("list-disc list-inside")`,
      output: `Div().listStyleType("disc").listStylePosition("inside")`,
      errors: [
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "list-disc", method: "listStyleType('disc')" } },
        { messageId: "useKnownModifier", data: { callee: "addClass", className: "list-inside", method: "listStylePosition('inside')" } },
      ],
    },
    // addClass with list-none
    {
      code: `Div().addClass("list-none")`,
      output: `Div().listStyleType("none")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-none", method: "listStyleType('none')" } }],
    },
    // addClass with list-decimal
    {
      code: `Div().addClass("list-decimal")`,
      output: `Div().listStyleType("decimal")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "list-decimal", method: "listStyleType('decimal')" } }],
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
      code: `Div("x").apply(t => t.addClass("a")).padding("4").setClass("override")`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "padding", method: "setClass" } }],
    },
    // setClasses after apply() — same problem
    {
      code: `Div("x").apply(t => t.addClass("a")).setClasses(["override"])`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "apply", method: "setClasses" } }],
    },
    // setClasses after padding()
    {
      code: `Div("x").padding("4").setClasses(["override"])`,
      errors: [{ messageId: "setClassAfterModifier", data: { modifier: "padding", method: "setClasses" } }],
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
    { code: `Div().addAttribute("data-id", "123")` },
    { code: `Div().addAttribute("x-on:click", "open = true")` },
  ],
  invalid: [
    // type
    {
      code: `Button().addAttribute("type", "submit")`,
      output: `Button().setType("submit")`,
      errors: [{ messageId: "preferSetMethod" }],
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
      code: `Div(isAdmin ? Span("Admin").bold() : Span("User"))`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
  ],
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
    { code: `A("Click").setHref("/page").setClass("text-blue-500").cursor("pointer").padding("4")` },
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
      code: `A("Click", Span("icon")).setHref("/page").padding("4")`,
      output: `A("Click", Span("icon")).setHref("/page").padding("4").cursor("pointer")`,
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
    { code: `Div().padding("4")` },
    { code: `Div().gap("x", "2")` },
    { code: `Div().top("0")` },
    // Already using unit overload — no warning
    { code: `Div().w("px", 200)` },
    { code: `Div().minH("rem", 12)` },
    { code: `Div().padding("em", 1.5)` },
    // Bracket values on non-unit methods — not our concern
    { code: `Div().textSize("[13px]")` },
    { code: `Div().opacity("[0.33]")` },
    { code: `Div().zIndex("[999]")` },
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
      code: `Div().padding("[16px]")`,
      output: `Div().padding("px", 16)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "padding", unit: "px", amount: "16", raw: "[16px]" } }],
    },
    {
      code: `Div().margin("[1.5rem]")`,
      output: `Div().margin("rem", 1.5)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "margin", unit: "rem", amount: "1.5", raw: "[1.5rem]" } }],
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
      code: `Div().padding("[0.75rem]")`,
      output: `Div().padding("rem", 0.75)`,
      errors: [{ messageId: "preferUnitOverload", data: { method: "padding", unit: "rem", amount: "0.75", raw: "[0.75rem]" } }],
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
      code: `Div().padding("4").w("[200px]").background("white")`,
      output: `Div().padding("4").w("px", 200).background("white")`,
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
    // formFor usage — correct
    { code: `const f = formFor(); f.input("email", "email")` },
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
// Summary
// ------------------------------------

console.log(`\n${"=".repeat(50)}`);
console.log("TEST SUMMARY");
console.log("=".repeat(50));
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log("=".repeat(50));

if (failCount > 0) process.exit(1);
