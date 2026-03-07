module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  plugins: ["fluent-html"],
  extends: ["plugin:fluent-html/recommended"],
  rules: {
    // You can adjust the severity level
    "fluent-html/no-known-modifiers-in-setclass": "warn", // or "error" or "off"
  },
};
