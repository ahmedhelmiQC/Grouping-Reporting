import{test as base , expect} from "@playwright/test";
import{Dashboard} from "../pages/Dashboard";
import{LoginPage} from "../pages/LoginPage";
import{CartPage} from "../pages/CartPage";

type PageObject = {
    loginPage : LoginPage;
    dashboard : Dashboard;
    cartPage  : CartPage;
};

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

});
export { expect };

