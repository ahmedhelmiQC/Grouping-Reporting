import { expect , type Locator , type Page } from "@playwright/test";

export class Dashboard{

    private readonly cards: Locator;
    private readonly productTitles: Locator;

    constructor (private readonly page:Page){
        this.cards = page.locator(".card-body");
        this.productTitles = this.cards.locator("h5 b");
    }

    async open(){
        await this.page.goto("https://rahulshettyacademy.com/client/#/dashboard/");
        await expect(this.cards.first()).toBeVisible();
    }

    async addProduct(productName: string){
        const added = this.page.waitForResponse(
            (res) => res.url().includes("/user/add-to-cart") && res.ok(),
        );
        await this.cards.filter({hasText: productName})
        .getByRole("button", {name: /Add To Cart/ }).click();
        await added;
        await expect(this.page.locator("#toast-container")).toBeVisible();
    }

    async addProducts(...productNames: string[]){
        for (const name of productNames) await this.addProduct(name);
    }

    async expectProduct(productName: string){
        await expect(this.cards.filter({hasText: productName})).toBeVisible();
    }

    async expectProductAbsent(productName: string){
        await expect(this.cards.first()).toBeVisible();
        await expect(this.productTitles.filter({hasText: productName})).toHaveCount(0);
    }

    async expectProducts(productNames: string[]){
        for (const name of productNames) await this.expectProduct(name);
    }
}
