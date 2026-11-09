import {expect , type Locator , type Page} from "@playwright/test";

export class LoginPage{
    private readonly email:Locator;
    private readonly password: Locator;
    private readonly loginBtn : Locator;
    private readonly signOutBtn: Locator;
    private readonly toast: Locator;
    private readonly fieldErrors: Locator;

    constructor (private readonly page:Page){
        this.email = page.getByPlaceholder("email@example.com");
        this.password = page.locator("#userPassword");
        this.loginBtn = page.locator("#login");
        this.signOutBtn = page.getByRole("button", {name:/Sign Out/});
        this.toast = page.locator("#toast-container [role='alert']");
        this.fieldErrors = page.locator(".invalid-feedback");
    }

    async submit(email: string , password:string){
        await this.page.goto("https://rahulshettyacademy.com/client/#/auth/login");
        await this.email.fill(email);
        await this.password.fill(password);
        await this.loginBtn.click();
    }

    async login(email: string , password:string){
        await this.submit(email, password);
        await this.expectLoggedIn();
    }

    async expectLoggedIn(){
        await expect(this.signOutBtn).toBeVisible({ timeout: 15_000 });
    }

    async expectLoginError(message: string){
        await expect(this.toast.filter({hasText: message})).toBeVisible();
        await expect(this.signOutBtn).toBeHidden();
        await expect(this.page).toHaveURL(/#\/auth\/login/);
    }

    async expectFieldErrors(messages: string[]){
        await expect(this.fieldErrors).toHaveText(messages);
        await expect(this.signOutBtn).toBeHidden();
    }

    async logout(){
        if (!(await this.signOutBtn.isVisible())) return;
        await this.signOutBtn.click();
        await expect(this.email).toBeVisible();
    }
}
