import { expect , type Locator , type Page } from "@playwright/test";

export class CartPage{

    private readonly cartlink: Locator;

    constructor(private readonly page:Page){
        this.cartlink = page.locator("button[routerlink='/dashboard/cart']");    }

    async open(){
    await this.cartlink.click();
}
 async expectedAddedProduct(name:string){
    await expect(this.page.locator(".cartSection h3")
    .filter({hasText:name})).toBeVisible();
 }

 async removeProductFromCart(name:string){
    await this.open();

    const row = this.page.locator(".cartWrap li").filter({hasText:name});

    if((await row.count())=== 0) return;

    await row.locator(".btn-danger").click();
    await expect(row).toHaveCount(0);
 }
}

