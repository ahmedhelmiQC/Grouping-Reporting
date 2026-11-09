import { expect , type Locator , type Page } from "@playwright/test";

export class Dashboard{

    private readonly cards: Locator;

    constructor (private readonly page:Page){
        this.cards = page.locator(".card-body");
    }

    async addProduct(ptroductName: string){
        await this.cards.filter({hasText: ptroductName})
        .getByRole("button", {name: /Add To Cart/ }).click();

        await expect(this.page.locator("#toast-container")).toBeVisible();
    }

    async expectProduct(name: string){
    await expect(this.cards.filter({hasText: name})).toBeVisible();
    }
}