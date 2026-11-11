import { expect , type Locator , type Page } from "@playwright/test";

export class Dashboard{

    private readonly cards: Locator;

    constructor (private readonly page:Page){
        this.cards = page.locator(".card-body");
    }

    async open(){
        await this.page.getByRole("button", {name: /HOME/}).click();
        await expect(this.cards.first()).toBeVisible();
    }

    async addProducts(...productNames: string[]){
        for (const name of productNames) await this.addProduct(name);
    }

    async addProduct(ptroductName: string){
        const saved = this.page.waitForResponse(
            (res) => res.url().includes("/user/add-to-cart") && res.ok(),
        );
        await this.cards.filter({hasText: ptroductName})
        .getByRole("button", {name: /Add To Cart/ }).click();
        await saved;

        await expect(this.page.locator("#toast-container")).toBeVisible();
    }

    async expectProduct(name: string){
        await expect(this.cards.filter({hasText: name})).toBeVisible();
    }

    async expectNoProduct(name: string){
        await expect(this.cards.first()).toBeVisible();
        await expect(this.cards.filter({hasText: name})).toHaveCount(0);
    }
}