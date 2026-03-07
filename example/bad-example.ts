import { Div, Button } from "fluent-html";

// ❌ BAD: These will trigger linter warnings

// Using setClass with background color
const example1 = Div()
  .setClass("bg-red-500");
// Warning: Avoid using .setClass() with 'bg-red-500'. Use .background() instead

// Using setClass with multiple known modifiers
const example2 = Div()
  .setClass("p-4 m-2 bg-blue-500");
// Warnings:
//   - 'p-4' should use .padding()
//   - 'm-2' should use .margin()
//   - 'bg-blue-500' should use .background()

// This is the real problem: setClass overrides previous styles
const example3 = Div()
  .background("green-700")  // Sets bg-green-700
  .padding("4")             // Sets p-4
  .setClass("bg-red-500");  // ❌ Overwrites everything! Only bg-red-500 remains
// Warning: Avoid using .setClass() with 'bg-red-500'. Use .background() instead

// Using setClass with flex utilities
const example4 = Div()
  .setClass("flex justify-center items-center gap-4");
// Warnings:
//   - 'flex' should use .flex()
//   - 'justify-center' should use .justifyContent('center')
//   - 'items-center' should use .alignItems('center')
//   - 'gap-4' should use .gap()

// Using setClass with typography
const example5 = Div()
  .setClass("text-2xl font-bold text-center");
// Warnings:
//   - 'text-2xl' should use .textSize('2xl')
//   - 'font-bold' should use .fontWeight('bold')
//   - 'text-center' should use .textAlign('center')
