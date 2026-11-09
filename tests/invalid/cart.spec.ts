import { test, expect } from "../test-setup";
import { Tag } from "../../utils/tags";
import products from "../../testData/products.json";

const { zara, adidas } = products.catalogue;
const missing = products.nonexistent;

test.describe("Invalid cart", { tag: [Tag.cart, Tag.negative] }, () => {

    test.beforeEach(async ({ loginPage, cartPage, dashboard, credentials }) => {
        await loginPage.login(credentials.email, credentials.password);
        await cartPage.clear();
        await dashboard.open();
    });

    test("nonexistent product is not listed on the dashboard",
        { tag: Tag.smoke },
        async ({ dashboard }) => {
            await dashboard.expectProductAbsent(missing);
        });

    test("removing a product that is not in the cart reports it and leaves the cart unchanged",
        { tag: Tag.regression },
        async ({ dashboard, cartPage }) => {
            await dashboard.addProduct(zara);
            await cartPage.open();

            const result = await cartPage.removeItems(missing);

            expect(result).toEqual({ removed: [], notFound: [missing] });
            await cartPage.expectProducts([zara]);
            await cartPage.expectTotalsMatchItems();
        });

    test("removing a mix of existing and nonexistent products removes only the existing ones",
        { tag: Tag.regression },
        async ({ dashboard, cartPage }) => {
            await dashboard.addProducts(zara, adidas);
            await cartPage.open();

            const result = await cartPage.removeItems(adidas, missing);

            expect(result).toEqual({ removed: [adidas], notFound: [missing] });
            await cartPage.expectProducts([zara]);
            await cartPage.open();
            await cartPage.expectTotalsMatchItems();
        });

    test("removing from an empty cart reports every product as not found",
        { tag: Tag.regression },
        async ({ cartPage }) => {
            await cartPage.open();

            const result = await cartPage.removeItems(zara, adidas);

            expect(result).toEqual({ removed: [], notFound: [zara, adidas] });
            await cartPage.expectEmpty();
        });
});
