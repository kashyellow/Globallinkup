/**
 * @type {import("prettier").Config &
 *   import("prettier-plugin-tailwindcss").PluginOptions}
 */
const config = {
  // Must be the last plugin (prettier-plugin-tailwindcss requirement).
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind CSS v4 resolves the theme from the CSS entry point.
  tailwindStylesheet: "./src/app/globals.css",
  tailwindFunctions: ["cn", "cva", "clsx"],
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
};

export default config;
