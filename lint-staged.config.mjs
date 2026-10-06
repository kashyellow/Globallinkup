/**
 * Run on staged files before each commit (see .husky/pre-commit).
 *
 * @type {import("lint-staged").Configuration}
 */
const config = {
  "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}": ["eslint --fix --no-warn-ignored", "prettier --write"],
  "*.{json,css,md,yml,yaml}": ["prettier --write"],
};

export default config;
