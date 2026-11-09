import {test } from "@playwright/test";
import {Dashboard} from "../pages/Dashboard";
import { CartPage } from "../pages/CartPage";
import {LoginPage} from "../pages/LoginPage";
test.use({
    launchOptions: {slowMo: 800},
});

const email = process.env.EMAIL ?? "";
const password =  process.env.PASSWORD ?? "";

const productName = "ZARA COAT 3";


test.beforeEach(async ({page})=>{
    if (!email || !password){
        throw new Error("Set EMAIL and PASSWORD inside the .env file ");
    }

    const loginPage = new LoginPage(page);
    await loginPage.login(email , password);
})
test.afterEach(async ({page})=>{
 const loginPage = new LoginPage(page);
 await loginPage.logout();
});

test.describe("Dashboard",{tag: "@smoke"}, () =>{
    test.describe.configure({ mode: "parallel"});

    test('List ZARA COAT 3', async ({page})=>{
        const dashboard = new Dashboard(page);
        await dashboard.expectProduct(productName);
    });
    test('List ADIDAS ORIGINAL', async ({page})=>{
        const dashboard = new Dashboard(page);
        await dashboard.expectProduct(productName);
    });
    test('List IPHONE 13', async ({page})=>{
        const dashboard = new Dashboard(page);
        await dashboard.expectProduct(productName);
    });
})

test.describe('Cart',{tag:'@regression'}, () =>{
    test.describe.configure({ mode : "serial"});

test.afterAll(async ({browser}) => {
    const page = await browser.newPage();
     const loginPage = new LoginPage(page);
    const cartPage = new CartPage(page);

    await loginPage.login(email,password);
    await cartPage.open();
    await cartPage.removeProductFromCart(productName);
    await page.close();
});

test('add ZARA COAT 3',async ({page})=>{
    const dashboard = new Dashboard(page);
    await dashboard.addProduct(productName);
});
test("show ZARA COAT 3 in the cart", async({page})=>{
    const cartPage = new CartPage(page);
    const dashboard = new Dashboard(page);
    await dashboard.addProduct(productName);
    await cartPage.open();
    await cartPage.expectedAddedProduct(productName);
});
});