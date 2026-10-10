/**
 * Run on staged files before each commit (see .husky/pre-commit).
 *
 * Commands are chunked rather than run in one shot: lint-staged passes absolute
 * paths, so a large commit (e.g. 60+ files) builds an argv beyond the Windows
 * command-line limit (~8k chars) and the hook dies with
 * "The command line is too long." before ESLint even runs.
 *
 * @type {import("lint-staged").Configuration}
 */
const CHUNK_SIZE = 12;

/** Split staged filenames into batches that stay well inside the argv limit. */
function chunk(filenames) {
  const batches = [];
  for (let i = 0; i < filenames.length; i += CHUNK_SIZE) {
    batches.push(filenames.slice(i, i + CHUNK_SIZE));
  }
  return batches;
}

/** Quote so paths containing spaces or shell metacharacters survive. */
function quote(files) {
  return files.map((file) => `"${file}"`).join(" ");
}

const config = {
  "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}": (filenames) =>
    chunk(filenames).flatMap((files) => [
      `eslint --fix --no-warn-ignored ${quote(files)}`,
      `prettier --write ${quote(files)}`,
    ]),
  "*.{json,css,md,yml,yaml}": (filenames) =>
    chunk(filenames).map((files) => `prettier --write ${quote(files)}`),
};

export default config;
