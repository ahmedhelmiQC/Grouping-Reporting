import { test } from "../test-setup";
import { Tag } from "../../utils/tags";
import products from "../../testData/products.json";

const { zara } = products.catalogue;

test.describe("Valid checkout", { tag: [Tag.checkout, Tag.positive] }, () => {

    test.beforeEach(async ({ loginPage, cartPage, dashboard, credentials }) => {
        await loginPage.login(credentials.email, credentials.password);
        await cartPage.clear();
        await dashboard.open();
    });

    test("checkout shows the cart product and the signed-in user's email",
        { tag: [Tag.regression, Tag.e2e] },
        async ({ dashboard, cartPage, checkoutPage, credentials }) => {
            await dashboard.addProduct(zara);
            await cartPage.open();
            await cartPage.checkout();

            await checkoutPage.expectOrderSummary([zara], credentials.email);
        });
});
