const jsdoc = require("eslint-plugin-jsdoc");

module.exports = [
  {
    files: ["src/**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": ["warn", { publicOnly: false, require: { FunctionDeclaration: true } }],
      "jsdoc/require-param": "warn",
      "jsdoc/require-returns": "warn",
      "jsdoc/check-param-names": "warn",
      "jsdoc/check-types": "warn",
    },
  },
];
