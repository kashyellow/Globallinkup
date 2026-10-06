/**
 * Commit message convention for GlobalLinkup.
 * See docs/COMMITS.md for the human-readable reference.
 *
 * @type {import("@commitlint/types").UserConfig}
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Keep scopes aligned with the feature domains and infra areas.
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "persona",
        "posts",
        "connect",
        "marketplace",
        "admin",
        "i18n",
        "ui",
        "db",
        "config",
        "deps",
        "docs",
        "ci",
      ],
    ],
  },
};

export default config;
