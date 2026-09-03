import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * eslint-config-next ships native flat configs, so no compat shim is needed.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "eval-results/**",
      "src/lib/knowledge.generated.ts",
      // Vendored Claude Code skill packages under .claude/skills/ — third-party
      // tooling scripts, not app code. Not ours to lint.
      ".claude/**",
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
