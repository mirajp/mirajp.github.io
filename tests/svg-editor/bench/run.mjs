import { startVitest } from "vitest/node";

const testFile = "tests/svg-editor/bench/history-bench.test.ts";
const vitest = await startVitest(
  "test",
  [testFile],
  { run: true, watch: false, config: false },
  {
    test: {
      include: [testFile],
      reporters: ["default"],
    },
  },
);
const failed = vitest.state
  .getFiles()
  .some((file) => file.result?.state === "fail");
await vitest.close();
if (failed) process.exitCode = 1;
