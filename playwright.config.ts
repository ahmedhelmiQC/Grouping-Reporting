import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const envPath = path.resolve(__dirname, ".env");
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}
export default defineConfig({
  fullyParallel : false,
  testDir: "./tests",
  retries: process.env.CI ? 2 : undefined,
  // All tests share one account; a login in a parallel worker can wipe cart changes made in another.
  workers: 1,
  use: {
    // Screenshots are taken for every test by the fixture in tests/test-setup.ts.
    screenshot: "off",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromuim",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter :[
    process.env.CI ? ['github'] : ['list'],
    ['html',{open: 'never', outputFolder: "report"}],
    ["json", {outputFile: "reports/results.json"}],
    ["allure-playwright", { resultsDir : "allure-results"}],
  ],
});