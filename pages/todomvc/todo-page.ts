import { expect, type Locator, type Page } from '@playwright/test';

export class TodoPage {
  readonly newTodo: Locator;
  readonly items: Locator;
  readonly counter: Locator;
  readonly clearCompleted: Locator;

  constructor(private readonly page: Page) {
    this.newTodo = page.getByPlaceholder('What needs to be done?');
    this.items = page.getByTestId('todo-item');
    this.counter = page.getByTestId('todo-count');
    this.clearCompleted = page.getByRole('button', { name: 'Clear completed' });
  }

  async goto(filter: '' | 'active' | 'completed' = '') {
    await this.page.goto(`#/${filter}`);
    await expect(this.newTodo).toBeVisible();
  }

  async add(...titles: string[]) {
    for (const title of titles) {
      await this.newTodo.fill(title);
      await this.newTodo.press('Enter');
    }
  }

  item(title: string): Locator {
    return this.items.filter({ hasText: title });
  }

  async toggle(title: string) {
    await this.item(title).getByRole('checkbox').check();
  }

  async filter(name: 'All' | 'Active' | 'Completed') {
    await this.page.getByRole('link', { name, exact: true }).click();
  }
}
