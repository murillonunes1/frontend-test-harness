import { expect, test } from '@playwright/test';
import { target } from '../../../fixtures/target';
import { expectContract, timed } from '../../../utils/contract';
import { faker } from '../../../utils/data';
import { createdTodoSchema, todoListSchema, todoSchema } from './schemas';

test.describe('API /todos: contrato consumido pelo front', { tag: '@api' }, () => {
  test.skip(!target.env.apiURL, 'apiURL não configurada para este ambiente');

  test('GET /todos lista tarefas no formato esperado', async ({ request }) => {
    const { response, durationMs } = await timed(() => request.get('todos'));
    const todos = await expectContract(response, todoListSchema, {
      maxDurationMs: 3_000,
      durationMs,
    });
    expect(new Set(todos.map((t) => t.id)).size, 'ids únicos').toBe(todos.length);
  });

  test('GET /todos?completed=true filtra por status', async ({ request }) => {
    const response = await request.get('todos', { params: { completed: true } });
    const todos = await expectContract(response, todoListSchema);
    expect(todos.every((t) => t.completed)).toBe(true);
  });

  test('GET /todos/:id retorna uma tarefa', async ({ request }) => {
    const todo = await expectContract(await request.get('todos/1'), todoSchema);
    expect(todo.id).toBe(1);
  });

  test('GET /todos/:id inexistente retorna 404', async ({ request }) => {
    const response = await request.get('todos/999999');
    expect(response.status()).toBe(404);
  });

  test('POST /todos cria tarefa e devolve o recurso', async ({ request }) => {
    const payload = { title: faker.lorem.sentence(), completed: false, userId: 1 };
    const response = await request.post('todos', { data: payload });
    const created = await expectContract(response, createdTodoSchema, { status: 201 });
    expect(created).toMatchObject({ title: payload.title, completed: false });
  });
});
