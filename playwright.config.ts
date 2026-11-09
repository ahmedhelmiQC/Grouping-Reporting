import { existsSync } from "node:fs";
import { defineConfig, devices, type ReporterDescription } from "@playwright/test";

if (existsSync(".env")) {
  process.loadEnvFile();
}

// In CI each suite writes a blob report; the workflow merges them into one HTML/JSON report.
const reporter: ReporterDescription[] = process.env.CI
  ? [["github"], ["blob"]]
  : [
      ["list"],
      ["html", { open: "never", outputFolder: "reporta" }],
      ["json", { outputFile: "reports/results.json" }],
      ["allure-playwright", { resultsDir: "allure-results" }],
    ];

export default defineConfig({
  testDir: "./tests",
  // All tests share one account, so the cart tests break when run in parallel.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter,
  use: {
    ...devices["Desktop Chrome"],
    // Screenshots are taken for every test by the fixture in tests/test-setup.ts.
    screenshot: "off",
    trace: "retain-on-failure",
  },
  // Modes: pick one with --project. Tags (utils/tags.ts) filter further with --grep.
  projects: [
    { name: "smoke", grep: /@smoke/ },
    { name: "regression", grep: /@regression/ },
    { name: "full" },
  ],
});
