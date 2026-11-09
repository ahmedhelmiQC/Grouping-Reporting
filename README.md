# Playwright Shop Tests — Grouping & Reporting

End-to-end tests for the [Rahul Shetty Academy practice shop](https://rahulshettyacademy.com/client/) written with Playwright + TypeScript. Tests are grouped with **tags** and **modes**, every test gets a screenshot, and results are published as an HTML report locally and in GitHub Actions.

## Project architecture

The project uses the **Page Object Model**: each screen of the shop has one class in `pages/`, and tests only talk to those classes, never to raw selectors.

```
pages/
  LoginPage.ts          login(), invalidlogin(), logout()
  Dashboard.ts          open(), addProduct(), addProducts(), expectProduct()
  CartPage.ts           open(), removeItem(), removeItems(), clear(), expectProducts(), expectEmpty()
tests/
  test-setup.ts         custom `test` with fixtures: loginPage, dashboard, cartPage,
                        and an automatic screenshot after every test
  shop.spec.ts          Login, Dashboard and Cart test groups
testData/
  data.ts               product names and invalid login data
utils/
  capture-report.mts    screenshots the generated HTML report
playwright.config.ts    reporters, trace setting, workers, .env loading
.github/workflows/
  shop-tests.yml        CI pipeline
```

Tests receive page objects as fixtures instead of creating them:

```ts
test("show ZARA COAT 3 in the cart", async ({ dashboard, cartPage }) => {
    await dashboard.addProduct(products.zara);
    await cartPage.open();
    await cartPage.expectedAddedProduct(products.zara);
});
```

## Tags

Tags describe **what** a test covers. They are set on a `test.describe` block and inherited by every test in it:

```ts
test.describe("Dashboard", { tag: ["@smoke", "@Dashboard", "@vaild"] }, () => { ... });
```

| Tag | Meaning |
| --- | --- |
| `@smoke` | Fast checks of the critical path (login, product list) |
| `@regression` | Broader functional checks (cart add / show / remove) |
| `@Login` | Login feature |
| `@Dashboard` | Product list feature |
| `@Cart` | Cart feature |
| `@vaild` | Valid (positive) scenario |
| `@invaild` | Invalid (negative) scenario |

Tags are shown next to each test in the HTML report and can be used to select tests:

```bash
npx playwright test --grep @smoke                  # only smoke tests
npx playwright test --grep @regression             # only regression tests
npx playwright test --grep "@vaild"                # only valid scenarios
npx playwright test --grep "@invaild"              # only invalid scenarios
npx playwright test --grep @smoke --grep-invert @invaild   # smoke tests without invalid ones
npx playwright test --grep @Cart --list            # preview the selection without running it
```

## Modes

Modes describe **how** the tests in a group run. They are set with `test.describe.configure`, separately from tags:

| Mode | Used by | Behaviour |
| --- | --- | --- |
| `parallel` | Login, Dashboard | Tests in the group are independent and may run in any order. |
| `serial` | Cart | Tests run in order; if one fails, the rest of the group is skipped. Needed because they share one cart. |

```ts
test.describe("Cart", { tag: "@regression" }, () => {
    test.describe.configure({ mode: "serial" });
    ...
});
```

`playwright.config.ts` sets `workers: 1` because every test logs into the **same shop account**: a login from a second worker can wipe cart changes made by another. So `parallel` groups are allowed to run in parallel, but the project currently runs them one at a time.

## Valid and Invalid scenarios

| Class | Tag | Tests |
| --- | --- | --- |
| **Valid (positive)** | `@vaild` | List ZARA COAT 3 / ADIDAS ORIGINAL / iphone 13 pro in Dashboard |
| **Invalid (negative)** | `@invaild` | invalid login should stay on login page; cannot add samsung edgy that does not exist |
| Cart flow | `@regression` | add ZARA COAT 3; show it in the cart; remove it; removing one of two products keeps the other |

Invalid login data and product names come from `testData/data.ts`. Valid credentials come from `.env` locally and GitHub Secrets in CI.

## RemoveItem implementation

`CartPage` removes products **by name, never by position**. A cart row is found by its product heading using an exact, case-insensitive match. The cart shows `iphone 13 pro` while the dashboard shows `IPHONE 13 PRO`, and "ZARA" must not match "ZARA COAT 3".

```ts
item(name: string){
    const exactName = new RegExp(`^\\s*${escapeRegExp(name.trim())}\\s*$`, "i");
    return this.items.filter({has: this.page.getByRole("heading", {name: exactName})});
}
```

| Method | What it does |
| --- | --- |
| `removeItem(name)` | Clicks the row's delete button, waits for the row to disappear and for the item count to drop by one (or the empty-cart message). Returns `false` if the product is not in the cart. |
| `removeItems(...names)` | Removes any number of products and returns `{ removed, notFound }`. Products not in the cart are reported, not thrown. Duplicate names are removed once. |
| `clear()` | Opens the cart and removes everything in it. |
| `removeProductFromCart(name)` | Opens the cart, then removes one product. |
| `expectProducts(names)` | Asserts exactly these products remain (order and case ignored). |
| `expectEmpty()` | Asserts the empty-cart message is shown and no rows remain. |

```ts
await dashboard.addProducts(zara, adidas);
await cartPage.open();

const result = await cartPage.removeItems(adidas);

expect(result).toEqual({ removed: [adidas], notFound: [] });
await cartPage.expectProducts([zara]);
```

## Local execution

```bash
npm ci
npx playwright install chromium
```

Create `.env` in the project root (it is git-ignored):

```
EMAIL=your-registered-email@example.com
PASSWORD=your-password
```

Run every command from the **project root**. Running `npx playwright test` from inside `tests/` skips `playwright.config.ts`, so no report is created and `.env` is not loaded.

| Command | What it does |
| --- | --- |
| `npm test` | run all tests |
| `npm run test:smoke` | run `@smoke` tests |
| `npm run test:regression` | run `@regression` tests |
| `npx playwright test --headed` | run with a visible browser |
| `npm run typecheck` | TypeScript check |
| `npm run report` | open the HTML report |
| `npm run report:screenshots` | screenshot the HTML report |

## GitHub Actions execution

`.github/workflows/shop-tests.yml` runs on pushes to `main` and `playwright`, on pull requests, and manually from the **Actions** tab (**Run workflow**).

1. Check out the code, install Node, dependencies and Chromium.
2. Type-check.
3. Run `tests/shop.spec.ts`. Failed tests are retried up to 2 times on CI.
4. Screenshot the HTML report.
5. Upload artifacts, **even when tests fail**:

| Artifact | Contents |
| --- | --- |
| `html-report` | `reporta/` HTML report |
| `json-results` | `reports/results.json` |
| `app-screenshots-and-traces` | every test screenshot + traces of failed tests |
| `report-screenshots` | screenshots of the HTML report |

Credentials are read from repository secrets. Add them under **Settings → Secrets and variables → Actions**: `EMAIL` and `PASSWORD`.

Download artifacts from the workflow run page (**Summary → Artifacts**).

## HTML report generation

The HTML reporter is configured in `playwright.config.ts`:

```ts
["html", { open: "never", outputFolder: "reporta" }],
["json", { outputFile: "reports/results.json" }],
["allure-playwright", { resultsDir: "allure-results" }],
```

Every run overwrites the report with the latest results. Open it with `npm run report` or open `reporta/index.html`. Each test entry shows its tags, its Passed/Failed status, its screenshot, and for failures the error and a **View Trace** link.

## Screenshot locations

There are two kinds of screenshots, kept apart by folder and file name.

**App screenshots** show the shop at the end of a test. They are taken for **every test, passed or failed**, by the automatic `screenshotEveryTest` fixture in `tests/test-setup.ts`, and attached to that test in the HTML report.

```
test-results/<test-folder>/<passed|failed>-<spec>-<test-title>.png
```

Example: `failed-shop-invalid-login-should-stay-on-login-page.png`. On CI retries, `-retry1` / `-retry2` is appended.

**HTML report screenshots** show the report itself, never the application. Every file starts with `report-`:

| File | Report view |
| --- | --- |
| `report-screenshots/report-01-all-results.png` | all tests with Passed/Failed status |
| `report-screenshots/report-02-passed.png` | passed tests |
| `report-screenshots/report-03-failed.png` | failed tests |
| `report-screenshots/report-04-smoke.png` | `@smoke` tests |
| `report-screenshots/report-05-regression.png` | `@regression` tests |

Traces of failed tests are saved as `test-results/<test-folder>/trace.zip` (`npx playwright show-trace <file>`).
