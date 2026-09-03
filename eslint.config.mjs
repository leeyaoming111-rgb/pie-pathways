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
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
