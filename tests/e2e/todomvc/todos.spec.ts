import { expect, test } from '../../../fixtures/todomvc';

test.describe('TodoMVC: gerenciar tarefas', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ todoPage }) => {
    await todoPage.goto();
  });

  test('adiciona tarefas e atualiza o contador', async ({ todoPage }) => {
    await todoPage.add('Comprar leite', 'Pagar contas');

    await expect(todoPage.items).toHaveText(['Comprar leite', 'Pagar contas']);
    await expect(todoPage.counter).toHaveText('2 items left');
  });

  test('conclui uma tarefa e filtra por status', async ({ todoPage }) => {
    await todoPage.add('Estudar Playwright', 'Revisar PR');
    await todoPage.toggle('Estudar Playwright');

    await todoPage.filter('Active');
    await expect(todoPage.items).toHaveText(['Revisar PR']);

    await todoPage.filter('Completed');
    await expect(todoPage.items).toHaveText(['Estudar Playwright']);
  });

  test('limpa tarefas concluídas', async ({ todoPage }) => {
    await todoPage.add('Tarefa A', 'Tarefa B');
    await todoPage.toggle('Tarefa A');
    await todoPage.clearCompleted.click();

    await expect(todoPage.items).toHaveText(['Tarefa B']);
  });

  test('persiste tarefas após recarregar a página', async ({ page, todoPage }) => {
    await todoPage.add('Sobrevive ao reload');
    await page.reload();

    await expect(todoPage.item('Sobrevive ao reload')).toBeVisible();
  });
});
