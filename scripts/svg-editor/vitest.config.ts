import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/svg-editor/{core,io,state}/**/*.test.ts"],
  },
});
