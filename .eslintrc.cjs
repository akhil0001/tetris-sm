module.exports = {
  extends: ["eslint:recommended", 'plugin:@typescript-eslint/recommended-type-checked'],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  rules: {
    "newline-per-chained-call": "warn"
  },
  root: true,
};
