import { test, expect } from "../test-setup";
import { Tag } from "../../utils/tags";
import products from "../../testData/products.json";

const { zara, adidas, iphone } = products.catalogue;

test.describe("Valid cart", { tag: [Tag.cart, Tag.positive, Tag.regression] }, () => {

    test.beforeEach(async ({ loginPage, cartPage, dashboard, credentials }) => {
        await loginPage.login(credentials.email, credentials.password);
        await cartPage.clear();
        await dashboard.open();
    });

    test("adding a product shows it in the cart with matching price and totals",
        { tag: [Tag.smoke, Tag.e2e] },
        async ({ dashboard, cartPage }) => {
            await dashboard.addProduct(zara);
            await cartPage.open();

            await cartPage.expectProducts([zara]);
            await cartPage.expectTotalsMatchItems();
            expect(await cartPage.productId(zara)).toMatch(/^[a-f0-9]{24}$/);
        });

    test("removing one product keeps the others and updates count and totals",
        async ({ dashboard, cartPage }) => {
            await dashboard.addProducts(zara, adidas, iphone);
            await cartPage.open();
            await cartPage.expectProducts([zara, adidas, iphone]);

            const result = await cartPage.removeItems(adidas);

            expect(result).toEqual({ removed: [adidas], notFound: [] });
            await cartPage.expectProducts([zara, iphone]);
            await cartPage.open();
            await cartPage.expectTotalsMatchItems();
        });

    test("removing several products at once leaves only the remaining product",
        async ({ dashboard, cartPage }) => {
            await dashboard.addProducts(zara, adidas, iphone);
            await cartPage.open();

            const result = await cartPage.removeItems(zara, iphone);

            expect(result).toEqual({ removed: [zara, iphone], notFound: [] });
            await cartPage.expectProducts([adidas]);
            await cartPage.open();
            await cartPage.expectTotalsMatchItems();
        });

    test("cart totals update without a reload after removing a product",
        { annotation: { type: "known defect", description: "After a removal the Subtotal/Total add the new total to the old one until the cart page is reloaded." } },
        async ({ dashboard, cartPage }) => {
            test.fail();
            await dashboard.addProducts(zara, adidas);
            await cartPage.open();

            await cartPage.removeItems(adidas);

            await cartPage.expectTotalsMatchItems();
        });

    test("removing every product empties the cart and hides checkout",
        async ({ dashboard, cartPage }) => {
            await dashboard.addProducts(zara, adidas);
            await cartPage.open();

            const result = await cartPage.removeItems(zara, adidas);

            expect(result.removed).toEqual([zara, adidas]);
            await cartPage.expectEmpty();
        });
});
