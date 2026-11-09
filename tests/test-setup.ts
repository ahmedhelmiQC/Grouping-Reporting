import{test as base , expect, type TestInfo} from "@playwright/test";
import{Dashboard} from "../pages/Dashboard";
import{LoginPage} from "../pages/LoginPage";
import{CartPage} from "../pages/CartPage";
import{CheckoutPage} from "../pages/CheckoutPage";

type Credentials = { email: string; password: string };

type PageObject = {
    loginPage : LoginPage;
    dashboard : Dashboard;
    cartPage  : CartPage;
    checkoutPage : CheckoutPage;
    credentials : Credentials;
    screenshotEveryTest : void;
};

const slug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// e.g. passed-valid-cart-removing-one-product-keeps-the-others-and-updates-count-and-totals.png
function screenshotName(testInfo: TestInfo){
    const outcome = testInfo.status !== testInfo.expectedStatus ? "failed"
        : testInfo.expectedStatus === "failed" ? "expected-failure" : "passed";
    const spec = slug(testInfo.titlePath[0].replace(/\.spec\.ts$/, ""));
    const retry = testInfo.retry ? `-retry${testInfo.retry}` : "";
    return `${outcome}-${spec}-${slug(testInfo.title).slice(0, 120)}${retry}.png`;
}

export const test = base.extend<PageObject>({
    loginPage: async({page}, use)=>{
        await use(new LoginPage(page));
    },

    dashboard : async ({page}, use)=>{
        await use(new Dashboard(page));
    },

    cartPage: async({page}, use)=>{
        await use(new CartPage(page));
    },

    checkoutPage: async({page}, use)=>{
        await use(new CheckoutPage(page));
    },

    credentials: async({}, use)=>{
        const email = process.env.EMAIL ?? "";
        const password = process.env.PASSWORD ?? "";
        if (!email || !password){
            throw new Error("Set EMAIL and PASSWORD in the .env file (locally) or as GitHub Secrets (CI).");
        }
        await use({ email, password });
    },

    // Runs after the test body and hooks, so the screenshot shows the final page state.
    screenshotEveryTest: [async({page}, use, testInfo)=>{
        await use();
        if (testInfo.status === "skipped") return;

        const name = screenshotName(testInfo);
        const path = testInfo.outputPath(name);
        try {
            await page.screenshot({ path, fullPage: true, timeout: 10_000 });
            await testInfo.attach(name, { path, contentType: "image/png" });
        } catch (error) {
            await testInfo.attach(`${name}-capture-error.txt`, { body: String(error), contentType: "text/plain" });
        }
    }, { auto: true }],
});
export { expect };
