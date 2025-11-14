/** @type {import("prettier").Config} */
export default {
  trailingComma: "none",
  plugins: ["prettier-plugin-astro"],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro"
      }
    }
  ]
};
