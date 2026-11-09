import { expect , type Locator , type Page } from "@playwright/test";

export class CheckoutPage{

    private readonly itemTitles: Locator;
    private readonly shippingEmail: Locator;
    private readonly placeOrderBtn: Locator;

    constructor(private readonly page:Page){
        this.itemTitles = page.locator(".item__title");
        this.shippingEmail = page.locator(".user__name label");
        this.placeOrderBtn = page.locator(".action__submit");
    }

    async expectOrderSummary(products: string[], email: string){
        await expect(this.page).toHaveURL(/#\/dashboard\/order/);
        await expect(this.itemTitles).toHaveText(products);
        await expect(this.shippingEmail).toHaveText(email);
    }

    async placeOrder(){
        await this.placeOrderBtn.click();
    }

    async expectOrderRejected(message: string){
        await expect(this.page.getByText(message, {exact: true})).toBeVisible();
        await expect(this.page).toHaveURL(/#\/dashboard\/order/);
    }
}
