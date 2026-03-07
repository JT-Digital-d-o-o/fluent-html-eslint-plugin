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
    // addClass with pseudo-class prefix — intended use
    { code: `Div().addClass("hover:bg-blue-600")` },
    // addClass with responsive prefix — intended use
    { code: `Div().addClass("md:w-1/2")` },
    // addClass with multiple modifier-prefixed classes — fine
    { code: `Div().addClass("hover:bg-blue-600 focus:ring-2")` },
    // addClass with non-utility class — fine
    { code: `Div().addClass("custom-widget")` },
  ],
  invalid: [
    // addClass with single base utility
    {
      code: `Div().addClass("mt-2")`,
      output: `Div().margin("t", "2")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "mt-2", method: "margin('t', ...)" } }],
    },
    // addClass with base utility + modifier-prefixed class — keeps modifier class in addClass
    {
      code: `Div().addClass("p-4 hover:bg-blue-600")`,
      output: `Div().padding("4").addClass("hover:bg-blue-600")`,
      errors: [{ messageId: "useKnownModifier", data: { callee: "addClass", className: "p-4", method: "padding()" } }],
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
  ],
  invalid: [
    // Direct ternary argument
    {
      code: `Div(isLoggedIn ? UserPanel() : LoginForm())`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Ternary among other children
    {
      code: `Div(Header(), isAdmin ? AdminPanel() : null, Footer())`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Ternary inside array children
    {
      code: `Div([Header(), isAdmin ? AdminPanel() : null])`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Div" } }],
    },
    // Works with other element functions
    {
      code: `Ul(isExpanded ? FullList() : Summary())`,
      errors: [{ messageId: "noTernaryInViewBuilder", data: { name: "Ul" } }],
    },
    // Multiple ternaries
    {
      code: `Div(a ? B() : C(), d ? E() : F())`,
      errors: [
        { messageId: "noTernaryInViewBuilder", data: { name: "Div" } },
        { messageId: "noTernaryInViewBuilder", data: { name: "Div" } },
      ],
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
