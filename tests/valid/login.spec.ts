import { test, expect } from "../test-setup";
import { Tag } from "../../utils/tags";
import products from "../../testData/products.json";

test.describe("Valid login", { tag: [Tag.login, Tag.positive] }, () => {

    test("registered user logs in and sees the full product catalogue",
        { tag: [Tag.smoke, Tag.e2e] },
        async ({ loginPage, dashboard, credentials }) => {
            await loginPage.login(credentials.email, credentials.password);
            await dashboard.expectProducts(Object.values(products.catalogue));
        });

    test("signed-in user signs out and returns to the login page",
        { tag: Tag.regression },
        async ({ loginPage, page, credentials }) => {
            await loginPage.login(credentials.email, credentials.password);
            await loginPage.logout();
            await expect(page).toHaveURL(/#\/auth\/login/);
        });
});
