// Screenshots the generated HTML report (not the app) for each result view.
// Usage: npm run report:screenshots   (after a test run has produced the report)
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const reportFile = path.resolve("report", "index.html");
const outDir = path.resolve("report-screenshots");

const views: [name: string, filter: string][] = [
    ["report-01-all-results", ""],
    ["report-02-passed", "s:passed"],
    ["report-03-failed", "s:failed"],
    ["report-04-smoke", "@smoke"],
    ["report-05-regression", "@regression"],
];

if (!existsSync(reportFile)) {
    console.error(`No HTML report at ${reportFile}. Run the tests first.`);
    process.exit(1);
}
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
for (const [name, filter] of views) {
    await page.goto(`${pathToFileURL(reportFile).href}#?q=${encodeURIComponent(filter)}`);
    await page.locator(".subnav-item").first().waitFor();
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
    console.log(`saved report-screenshots/${name}.png`);
}
await browser.close();
