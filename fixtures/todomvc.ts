import { TodoPage } from '../pages/todomvc/todo-page';
import { test as base } from './test';

export const test = base.extend<{ todoPage: TodoPage }>({
  todoPage: async ({ page }, use) => {
    await use(new TodoPage(page));
  },
});

export { expect } from './test';
