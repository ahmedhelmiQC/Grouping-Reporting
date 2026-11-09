import { expect , type Locator , type Page } from "@playwright/test";

export type RemoveResult = { removed: string[]; notFound: string[] };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export class CartPage{

    private readonly cartlink: Locator;
    private readonly items: Locator;
    private readonly emptyMessage: Locator;

    constructor(private readonly page:Page){
        this.cartlink = page.locator("button[routerlink='/dashboard/cart']");
        this.items = page.locator(".cartWrap li");
        this.emptyMessage = page.getByRole("heading", {name: "No Products in Your Cart !"});
    }

    async open(){
        if (!this.page.url().includes("#/dashboard/cart")){
            const loaded = this.page.waitForResponse((res) => res.url().includes("/user/get-cart-products/"));
            await this.cartlink.click();
            await loaded;
        }
        await expect(this.items.first().or(this.emptyMessage)).toBeVisible();
    }

    // The cart shows names in their stored case (e.g. "iphone 13 pro"), so match exactly but ignore case.
    item(name: string){
        const exactName = new RegExp(`^\\s*${escapeRegExp(name.trim())}\\s*$`, "i");
        return this.items.filter({has: this.page.getByRole("heading", {name: exactName})});
    }

    async productNames(){
        return (await this.items.locator("h3").allInnerTexts()).map((n) => n.trim());
    }

    async expectedAddedProduct(name:string){
        await expect(this.item(name)).toBeVisible();
    }

    /** Removes one product by name. Returns false if it is not in the cart. */
    async removeItem(name: string){
        const row = this.item(name);
        if ((await row.count()) === 0) return false;

        const remaining = (await this.items.count()) - 1;
        await row.locator(".btn-danger").click();
        await expect(row).toHaveCount(0);
        if (remaining === 0) await expect(this.emptyMessage).toBeVisible();
        else await expect(this.items).toHaveCount(remaining);
        return true;
    }

    /** Removes any number of products; names not in the cart are reported instead of throwing. */
    async removeItems(...names: string[]): Promise<RemoveResult>{
        const result: RemoveResult = { removed: [], notFound: [] };
        for (const name of new Set(names)){
            (await this.removeItem(name) ? result.removed : result.notFound).push(name);
        }
        return result;
    }

    async clear(){
        await this.open();
        await this.removeItems(...await this.productNames());
        await this.expectEmpty();
    }

    async removeProductFromCart(name:string){
        await this.open();
        await this.removeItem(name);
    }

    async expectProducts(names: string[]){
        const normalize = (n: string) => n.trim().toUpperCase();
        await expect.poll(async () => (await this.productNames()).map(normalize).sort())
            .toEqual(names.map(normalize).sort());
    }

    async expectEmpty(){
        await expect(this.emptyMessage).toBeVisible();
        await expect(this.items).toHaveCount(0);
    }
}
