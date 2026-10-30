import { z } from 'zod';

// Contratos que o front espera. Mantenha alinhado com os tipos usados pela app.
export const todoSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  title: z.string().min(1),
  completed: z.boolean(),
});

export const todoListSchema = z.array(todoSchema).min(1);

export const createdTodoSchema = todoSchema.pick({ title: true, completed: true }).extend({
  id: z.number().int().positive(),
});
