import {expect , type Locator , type Page} from "@playwright/test";

export class LoginPage{
    private readonly email:Locator;
    private readonly passweord: Locator;
    private readonly loginBtn : Locator;

    constructor (private readonly page:Page){
        this.email = page.getByPlaceholder("email@example.com");
        this.passweord = page.locator("#userPassword");
        this.loginBtn = page.locator("#login");
    }

    async login(email: string , password:string){
        await this.page.goto("https://rahulshettyacademy.com/client/#/auth/login");
        await this.email.fill(email);
        await this.passweord.fill(password);
        await this.loginBtn.click();

        await expect(
            this.page.getByRole("button", {name:/Sign Out/})
        ).toBeVisible();
    }

    async logout(){
        await this.page.getByRole("button", {name:/Sign Out/}).click();
        
        await expect(this.email).toBeVisible();
    }
}