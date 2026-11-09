import { test } from "../test-setup";
import { Tag } from "../../utils/tags";
import users from "../../testData/users.json";

test.describe("Invalid login", { tag: [Tag.login, Tag.negative] }, () => {

    for (const data of users.invalidCredentials) {
        test(`login is rejected for ${data.scenario}`, { tag: Tag.smoke }, async ({ loginPage }) => {
            await loginPage.submit(data.email, data.password);
            await loginPage.expectLoginError(data.error);
        });
    }

    test("login is rejected for a registered email with a wrong password",
        { tag: Tag.regression },
        async ({ loginPage, credentials }) => {
            await loginPage.submit(credentials.email, users.wrongPassword);
            await loginPage.expectLoginError(users.loginError);
        });

    for (const data of users.invalidForms) {
        test(`login form shows validation errors for ${data.scenario}`, { tag: Tag.regression }, async ({ loginPage }) => {
            await loginPage.submit(data.email, data.password);
            await loginPage.expectFieldErrors(data.fieldErrors);
        });
    }
});
