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
  workers: process.env.CI ? 2 : undefined,
  projects: [
    {
      name: "chromuim",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter :[
    process.env.CI ? ['github'] : ['list'],
    ['html',{open: 'never', outputFolder: "reporta"}],
    ["json", {outputFile: "reports/results.json"}],
    ["allure-playwright", { outputFolder : "allure-results"}],
  ],
});