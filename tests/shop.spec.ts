import { test, expect } from "./test-setup";
import { CartPage } from "../pages/CartPage";
import { LoginPage } from "../pages/LoginPage";
import path from "node:path";
import { existsSync } from "node:fs";
import { products } from "../testData/data";
import { loginData } from "../testData/data";


const envPath = path.resolve(__dirname, "..", ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

const email = process.env.EMAIL ?? "";
const password = process.env.PASSWORD ?? "";


test.describe("Login",{tag: ["@smoke","@Login", "@invaild"]}, () =>{
    test.describe.configure({ mode: "parallel"});

    test('invalid login should stay on login page', async ({ loginPage })=>{
    await loginPage.login(loginData.email, loginData.password);
    });  
});


test.describe("Dashboard",{tag: ["@smoke", "@Dashboard","@vaild"]}, () =>{
    test.describe.configure({ mode: "parallel"});

    test.beforeEach(async ({ loginPage })=>{
    if (!email || !password){
        throw new Error("Set EMAIL and PASSWORD inside the .env file ");
    }

    await loginPage.login(email , password);
    });


    test('List ZARA COAT 3 in Dashboard', async ({ dashboard })=>{
        await dashboard.expectProduct(products.zara);
    });
     test('List ADIDAS ORIGINAL in Dashboard', async ({ dashboard })=>{
        await dashboard.expectProduct(products.adidas);
    });
     test('List iphone 13 pro in Dashboard', async ({ dashboard })=>{
        await dashboard.expectProduct(products.iphone);
    });

});

test.describe("Dashboard",{tag: ["@smoke", "@Cart","@invaild"]}, () =>{
    test.describe.configure({ mode: "parallel"});

    test('cannot add samsung edgy that does not exist', async ({ dashboard })=>{
        await dashboard.expectProduct(products.samsung);
    });  
});

test.describe('Cart',{tag:'@regression'}, () =>{
    test.describe.configure({ mode : "serial"});

 test.beforeEach(async ({ loginPage })=>{
    if (!email || !password){
        throw new Error("Set EMAIL and PASSWORD inside the .env file ");
    }

         await loginPage.login(email , password);
    });


    test('add ZARA COAT 3 to the cart',async ({ dashboard })=>{
        await dashboard.addProduct(products.zara);
    });

    test("show ZARA COAT 3 in the cart", async({ dashboard, cartPage })=>{
        await dashboard.addProduct(products.zara);
        await cartPage.open();
        await cartPage.expectedAddedProduct(products.zara);
    });

    test('remove zara coat 3 from cart',async ({ dashboard ,cartPage })=>{
        await dashboard.addProduct(products.zara);

        await cartPage.open();
        await cartPage.expectedAddedProduct(products.zara);
        await cartPage.removeProductFromCart(products.zara);
    });

    test('removing one of two products keeps the other in the cart', async ({ dashboard, cartPage }) => {
        const { zara, adidas } = products;

        await cartPage.clear();
        await dashboard.open();
        await dashboard.addProducts(zara, adidas);
        await cartPage.open();

        const result = await cartPage.removeItems(adidas);

        expect(result).toEqual({ removed: [adidas], notFound: [] });
        await cartPage.expectProducts([zara]);
    });

    test.afterAll(async ({browser}) => {
        const page = await browser.newPage();
        const loginPage = new LoginPage(page);
        const cartPage = new CartPage(page);

        await loginPage.login(email,password);
        await cartPage.open();
        await cartPage.removeProductFromCart(products.zara);
        await page.close();
    });

});
