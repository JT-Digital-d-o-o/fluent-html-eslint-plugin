import { Div, Button } from "fluent-html";

// ✅ GOOD: Use dedicated methods

// Use .background() for background colors
const example1 = Div()
  .background("red-500");

// Chain dedicated methods for multiple styles
const example2 = Div()
  .padding("4")
  .margin("2")
  .background("blue-500");

// Methods chain safely - no overrides!
const example3 = Div()
  .background("green-700")
  .padding("4")
  .background("red-500");  // This will add both bg-green-700 and bg-red-500
// (Note: While both classes are added, CSS cascade means the last one wins.
//  But at least nothing gets overwritten!)

// Use dedicated flex methods
const example4 = Div()
  .flex()
  .justifyContent("center")
  .alignItems("center")
  .gap("4");

// Use dedicated typography methods
const example5 = Div()
  .textSize("2xl")
  .fontWeight("bold")
  .textAlign("center");

// Use .addClass() for pseudo-classes and responsive variants
const example6 = Button("Click me")
  .padding("x", "6")
  .padding("y", "3")
  .background("blue-500")
  .textColor("white")
  .rounded("lg")
  .addClass("hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 md:px-8");

// Use .setClass() ONLY for custom classes
const example7 = Div()
  .setClass("my-custom-component another-custom-class");

// Combine dedicated methods with addClass for pseudo-states
const example8 = Div()
  .flex()
  .justifyContent("between")
  .alignItems("center")
  .padding("4")
  .background("white")
  .shadow("lg")
  .addClass("hover:shadow-xl transition-shadow duration-300");

// Complex card component done right
const card = Div([
  Div("Card Title")
    .textSize("2xl")
    .fontWeight("bold")
    .margin("bottom", "4"),

  Div("Card content goes here")
    .textColor("gray-600")
    .margin("bottom", "6"),

  Button("Action")
    .padding("x", "4")
    .padding("y", "2")
    .background("blue-500")
    .textColor("white")
    .rounded()
    .cursor("pointer")
    .addClass("hover:bg-blue-600 active:scale-95 transition-all")
])
  .background("white")
  .padding("6")
  .rounded("xl")
  .shadow("lg")
  .border()
  .borderColor("gray-200")
  .w("full")
  .maxW("md");
