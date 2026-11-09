import { test } from "../test-setup";
import { Tag } from "../../utils/tags";
import products from "../../testData/products.json";
import users from "../../testData/users.json";

const { zara } = products.catalogue;

test.describe("Invalid checkout", { tag: [Tag.checkout, Tag.negative] }, () => {

    test.beforeEach(async ({ loginPage, cartPage, dashboard, credentials }) => {
        await loginPage.login(credentials.email, credentials.password);
        await cartPage.clear();
        await dashboard.open();
    });

    test("placing an order without shipping information is rejected",
        { tag: [Tag.regression, Tag.e2e] },
        async ({ dashboard, cartPage, checkoutPage }) => {
            await dashboard.addProduct(zara);
            await cartPage.open();
            await cartPage.checkout();

            await checkoutPage.placeOrder();

            await checkoutPage.expectOrderRejected(users.checkoutShippingError);
        });
});
