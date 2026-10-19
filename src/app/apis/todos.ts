import { api } from "./http";

export interface Todo {
  id: number;
  widget_id: string;
  text: string;
  type: string;
  color: string;
  completed: boolean;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export const getTodos = (widgetId: string) => api<Todo[]>(`/api/todos/${encodeURIComponent(widgetId)}`);

export const createTodo = (todo: {
  widget_id: string;
  text: string;
  type: string;
  color: string;
  order_index: number;
}) => api<Todo>("/api/todos", { method: "POST", body: todo });

export const updateTodo = (id: number, updates: Partial<Todo>) =>
  api<Todo>(`/api/todos/${id}`, { method: "PUT", body: updates });

export const deleteTodo = async (id: number): Promise<void> => {
  await api<null>(`/api/todos/${id}`, { method: "DELETE" });
};

export const updateTodosOrder = async (todos: { id: number; order_index: number }[]): Promise<void> => {
  await api("/api/todos/bulk-update-order", { method: "POST", body: { todos } });
};
