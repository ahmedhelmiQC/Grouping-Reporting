import { expect , type Locator , type Page } from "@playwright/test";

export type RemoveResult = { removed: string[]; notFound: string[] };

const toAmount = (text: string) => Number(text.replace(/[^\d.]/g, ""));
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The cart shows names in their stored case (e.g. "iphone 13 pro") while the dashboard upper-cases them.
const normalize = (name: string) => name.trim().toUpperCase();

export class CartPage{

    private readonly items: Locator;
    private readonly emptyMessage: Locator;
    private readonly cartBadge: Locator;
    private readonly checkoutBtn: Locator;

    constructor(private readonly page:Page){
        this.items = page.locator(".cartWrap li");
        this.emptyMessage = page.getByRole("heading", {name: "No Products in Your Cart !"});
        this.cartBadge = page.locator("button[routerlink='/dashboard/cart'] label");
        this.checkoutBtn = page.getByRole("button", {name: "Checkout"});
    }

    // Navigates by URL because the order page overlays the nav bar's Cart button;
    // reloads when already on the cart so the data is fetched again.
    async open(){
        const loaded = this.page.waitForResponse((res) => res.url().includes("/user/get-cart-products/"));
        if (this.page.url().includes("#/dashboard/cart")) await this.page.reload();
        else await this.page.goto("https://rahulshettyacademy.com/client/#/dashboard/cart");
        await loaded;
        await expect(this.items.first().or(this.emptyMessage)).toBeVisible();
    }

    item(name: string){
        const exactName = new RegExp(`^\\s*${escapeRegExp(name.trim())}\\s*$`, "i");
        return this.items.filter({has: this.page.getByRole("heading", {name: exactName})});
    }

    async productNames(){
        return (await this.items.locator("h3").allInnerTexts()).map((n) => n.trim());
    }

    async productId(name: string){
        return (await this.item(name).locator(".itemNumber").innerText()).replace("#", "").trim();
    }

    async itemPrice(name: string){
        return toAmount(await this.item(name).locator(".prodTotal").innerText());
    }

    private totalRow(label: "Subtotal" | "Total"){
        return this.page.locator(".totalRow")
            .filter({has: this.page.locator(".label", {hasText: new RegExp(`^${label}$`)})})
            .locator(".value");
    }

    async subtotal(){
        return toAmount(await this.totalRow("Subtotal").innerText());
    }

    async total(){
        return toAmount(await this.totalRow("Total").innerText());
    }

    /** Removes one product by exact name. Returns false if it was not in the cart. */
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

    /** Removes any number of products by name; names not in the cart are reported, not thrown. */
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

    async checkout(){
        await this.checkoutBtn.click();
    }

    async expectedAddedProduct(name:string){
        await expect(this.item(name)).toBeVisible();
    }

    async expectProducts(names: string[]){
        await expect.poll(async () => (await this.productNames()).map(normalize).sort())
            .toEqual(names.map(normalize).sort());
        await expect(this.cartBadge).toHaveText(String(names.length));
    }

    async expectTotalsMatchItems(){
        const names = await this.productNames();
        let sum = 0;
        for (const name of names) sum += await this.itemPrice(name);
        expect(sum, "sum of item prices").toBeGreaterThan(0);
        await expect.poll(() => this.subtotal(), {message: "subtotal equals sum of item prices"}).toBe(sum);
        await expect.poll(() => this.total(), {message: "total equals sum of item prices"}).toBe(sum);
    }

    async expectEmpty(){
        await expect(this.emptyMessage).toBeVisible();
        await expect(this.items).toHaveCount(0);
        await expect(this.checkoutBtn).toBeHidden();
        await expect(this.cartBadge).toHaveText("");
    }
}
