import { test, expect } from "./test-setup";
import { CartPage } from "../pages/CartPage";
import { LoginPage } from "../pages/LoginPage";
import path from "node:path";
import { existsSync } from "node:fs";
import { products, loginData } from "../testData/data";

const envPath = path.resolve(__dirname, "..", ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const email = process.env.EMAIL ?? "";
const password = process.env.PASSWORD ?? "";

async function loginWithValidAccount(loginPage: LoginPage){
    if (!email || !password){
        throw new Error("Set EMAIL and PASSWORD inside the .env file");
    }
    await loginPage.login(email, password);
}

function signInAndOutAroundEachTest(){
    test.beforeEach(async ({ loginPage }) => {
        await loginWithValidAccount(loginPage);
    });

    test.afterEach(async ({ loginPage }) => {
        await loginPage.logout();
    });
}


test.describe("Login", { tag: ["@smoke", "@Login", "@valid"] }, () => {
    test("valid login shows Sign Out", async ({ loginPage }) => {
        await loginWithValidAccount(loginPage);
    });
});

test.describe("Login", { tag: ["@regression", "@Login", "@invalid"] }, () => {
    test("invalid login should stay on login page", async ({ loginPage }) => {
        await loginPage.invalidlogin(loginData.email, loginData.password);
    });
});


test.describe("Dashboard", { tag: ["@smoke", "@Dashboard", "@valid"] }, () => {
    signInAndOutAroundEachTest();

    test("List ZARA COAT 3 in Dashboard", async ({ dashboard }) => {
        await dashboard.expectProduct(products.zara);
    });

    test("List ADIDAS ORIGINAL in Dashboard", async ({ dashboard }) => {
        await dashboard.expectProduct(products.adidas);
    });

    test("List iphone 13 pro in Dashboard", async ({ dashboard }) => {
        await dashboard.expectProduct(products.iphone);
    });
});

test.describe("Dashboard", { tag: ["@regression", "@Dashboard", "@invalid"] }, () => {
    signInAndOutAroundEachTest();

    test("samsung edgy is not listed in Dashboard", async ({ dashboard }) => {
        await dashboard.expectNoProduct(products.samsung);
    });
});


test.describe("Cart", { tag: ["@regression", "@Cart"] }, () => {
    test.describe.configure({ mode: "serial" });

    signInAndOutAroundEachTest();

    test.beforeEach(async ({ cartPage, dashboard }) => {
        await cartPage.clear();
        await dashboard.open();
        await cartPage.expectCartCount(0);
    });

    test("add ADIDAS ORIGINAL to the cart", async ({ dashboard, cartPage }) => {
        await dashboard.addProduct(products.adidas);
        await cartPage.expectCartCount(1);
    });

    test("show ADIDAS ORIGINAL in the cart", async ({ dashboard, cartPage }) => {
        await dashboard.addProduct(products.adidas);
        await cartPage.open();
        await cartPage.expectedAddedProduct(products.adidas);
    });

    test("remove ZARA COAT 3 from the cart", async ({ dashboard, cartPage }) => {
        await dashboard.addProduct(products.zara);
        await cartPage.open();
        await cartPage.expectedAddedProduct(products.zara);
        await cartPage.expectCartCount(1);

        await cartPage.removeProductFromCart(products.zara);
        await cartPage.expectCartCount(0);
    });

    test("removing one of two products keeps the other in the cart", async ({ dashboard, cartPage }) => {
        const { zara, adidas } = products;

        await dashboard.addProducts(zara, adidas);
        await cartPage.open();
        await cartPage.expectCartCount(2);

        const result = await cartPage.removeItems(adidas);

        expect(result).toEqual({ removed: [adidas], notFound: [] });
        await cartPage.expectProducts([zara]);
        await cartPage.expectCartCount(1);
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage();
        const loginPage = new LoginPage(page);

        await loginWithValidAccount(loginPage);
        await new CartPage(page).clear();
        await loginPage.logout();
        await page.close();
    });
});
