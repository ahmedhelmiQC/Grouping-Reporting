# Playwright Shop Tests

End-to-end tests for the [Rahul Shetty Academy practice shop](https://rahulshettyacademy.com/client/) written with Playwright + TypeScript using the Page Object Model, with tags, execution modes, per-test screenshots and a GitHub Actions pipeline.

## Architecture

```
pages/                    Page Objects (one class per screen)
  LoginPage.ts              login / logout, login error + form validation assertions
  Dashboard.ts              product catalogue, add to cart
  CartPage.ts               cart rows, totals, dynamic removeItems()
  CheckoutPage.ts           order summary, place order
tests/
  test-setup.ts             fixtures: page objects, credentials, screenshot-after-every-test
  valid/                    Valid (positive) scenarios   -> tagged @positive
  invalid/                  Invalid (negative) scenarios -> tagged @negative
testData/
  products.json             catalogue product names + a nonexistent product
  users.json                invalid logins, expected error messages
utils/
  tags.ts                   the single list of tags (Tag.smoke, Tag.cart, ...)
  capture-report.mts        screenshots the HTML report itself
playwright.config.ts        modes (projects), reporters, trace/screenshot settings
.github/workflows/shop-tests.yml   CI pipeline
```

Tests never create page objects themselves; they receive them as fixtures from `tests/test-setup.ts`. Valid credentials are never stored in the repo: they come from `.env` locally and from GitHub Secrets in CI.

## Setup

```bash
npm ci
npx playwright install chromium
```

Create `.env` in the project root (it is git-ignored):

```
EMAIL=your-registered-email@example.com
PASSWORD=your-password
```

## Tags

Tags describe **what** a test covers. They are defined once in `utils/tags.ts` and applied with Playwright's `{ tag: [...] }` option on a `describe` (inherited by its tests) or on a single test.

| Tag | Meaning |
| --- | --- |
| `@smoke` | Fast, critical-path checks |
| `@regression` | Broader functional coverage |
| `@e2e` | Crosses several pages (login → cart → checkout) |
| `@positive` | Valid scenario (lives in `tests/valid/`) |
| `@negative` | Invalid scenario (lives in `tests/invalid/`) |
| `@login`, `@cart`, `@checkout` | Feature area |

## Modes

Modes describe **how much** to run. They are Playwright projects in `playwright.config.ts`, selected with `--project`:

| Mode | Runs |
| --- | --- |
| `full` | every test |
| `smoke` | tests tagged `@smoke` |
| `regression` | tests tagged `@regression` |

Always pass a `--project`: running `npx playwright test` with no project runs every mode, so tests would run more than once. The npm scripts below already do this.

Tags and modes combine: the mode chooses the set, `--grep` narrows it.

```bash
npx playwright test --project=regression --grep @cart                       # regression cart tests
npx playwright test --project=full --grep "(?=.*@login)(?=.*@negative)"     # invalid login tests
npx playwright test --project=smoke --grep-invert @e2e                      # smoke without e2e
npx playwright test --project=full --list                                   # preview the selection
```

## Scenario classification

| Suite | Folder | Tests |
| --- | --- | --- |
| Valid (`@positive`) | `tests/valid/` | login + catalogue, sign-out, add to cart with totals, remove one / several / all products, checkout summary, plus one known-defect test (below) |
| Invalid (`@negative`) | `tests/invalid/` | unregistered email, wrong password, empty form, malformed email, nonexistent product not listed, remove nonexistent product, remove mix of existing + nonexistent, remove from empty cart, place order without shipping info |

Invalid logins and expected messages are data-driven from `testData/users.json`; product names come from `testData/products.json`.

**Known site defect.** After removing a product, the cart's Subtotal/Total add the new total to the old one instead of replacing it; reloading the cart shows the correct value. Removal tests therefore verify totals after reopening the cart, and `Valid cart › cart totals update without a reload after removing a product` is marked `test.fail()` so it documents the bug. Playwright will report it as unexpectedly passing once the site is fixed.

## RemoveItem (`CartPage`)

Cart rows are located by their product-name heading (exact, case-insensitive, because the cart shows `iphone 13 pro` while the dashboard shows `IPHONE 13 PRO`), never by index. Each row's product ID is available through `productId(name)`.

```ts
await cartPage.removeItem("ZARA COAT 3");                          // true if removed, false if not in cart
const result = await cartPage.removeItems("ZARA COAT 3", "SAMSUNG EDGY");
// result = { removed: ["ZARA COAT 3"], notFound: ["SAMSUNG EDGY"] }

await cartPage.expectProducts(["ADIDAS ORIGINAL"]);  // remaining products + cart badge count
await cartPage.expectTotalsMatchItems();             // Subtotal and Total equal the sum of item prices
await cartPage.expectEmpty();                        // empty message, no rows, no Checkout, empty badge
await cartPage.clear();                              // removes everything (used in beforeEach)
```

Nonexistent products are reported in `notFound` instead of throwing, so tests can assert on them. Duplicate names are removed once.

## Commands

| Command | What it does |
| --- | --- |
| `npm run typecheck` | TypeScript check of pages, tests, utils and data |
| `npm test` | all tests (`full` mode) |
| `npm run test:smoke` / `test:regression` | run a mode |
| `npm run test:valid` / `test:invalid` | run only Valid or only Invalid scenarios |
| `npm run test:login` / `test:cart` / `test:checkout` / `test:e2e` | run one tag |
| `npm run report` | open the HTML report |
| `npm run report:screenshots` | screenshot the HTML report views |

All tests share one shop account, so they run with one worker; every cart/checkout test empties the cart before it starts.

## Reports and screenshots

| What | Where |
| --- | --- |
| HTML report | `reporta/index.html` |
| JSON results | `reports/results.json` |
| Allure results (local runs) | `allure-results/` |
| **App screenshots** (every test) | `test-results/<test-folder>/<outcome>-<spec>-<test-title>.png`, also attached to the test in the HTML report |
| Traces (failed tests) | `test-results/<test-folder>/trace.zip`, open with `npx playwright show-trace <file>` |
| **HTML report screenshots** | `report-screenshots/report-0N-<view>.png` |

App screenshots are taken by the automatic `screenshotEveryTest` fixture after each test finishes, so they show the final page state. The `<outcome>` prefix is `passed`, `failed` or `expected-failure`, and `-retryN` is appended for retries.

Report screenshots are a separate step that captures the generated report itself, never the application. All files start with `report-`:
`report-01-all-results`, `report-02-valid-positive`, `report-03-invalid-negative`, `report-04-passed`, `report-05-failed`.

## CI (GitHub Actions)

`.github/workflows/shop-tests.yml` runs on pushes to `main`/`playwright`, on pull requests, and manually (with a choice of mode and an optional tag filter).

1. Install dependencies and Chromium, then type-check.
2. Run the **Valid** suite, then the **Invalid** suite (the Invalid suite runs even if Valid fails). Each writes a blob report and its own `test-results/valid|invalid` folder.
3. Merge both blobs into one HTML report and one JSON file.
4. Screenshot the HTML report.
5. Upload artifacts, even when tests fail: `html-report`, `json-results`, `app-screenshots-and-traces`, `report-screenshots`.

CI retries a failed test up to 2 times.

**Required repository secrets** (Settings → Secrets and variables → Actions): `EMAIL` and `PASSWORD`.
