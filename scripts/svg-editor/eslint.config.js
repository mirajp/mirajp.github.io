import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["src/components/tools/svg-editor/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/render/**",
                "**/ui/**",
                "**/state/**",
                "react",
                "react/**",
                "astro",
                "astro/**",
              ],
              message:
                "Core modules must not depend on render, UI, state, React, or Astro.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/tools/svg-editor/state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/**", "astro", "astro/**"],
              message: "State modules must not depend on React or Astro.",
            },
          ],
        },
      ],
    },
  },
];
