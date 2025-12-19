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

// GET all todos for a widget
export const getTodos = async (widgetId: string): Promise<Todo[]> => {
  try {
    const response = await fetch(`/api/todos/${widgetId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch todos: ${response.statusText}`);
    }

    const todos = await response.json();
    return todos;
  } catch (error) {
    console.error("Error fetching todos:", error);
    throw error;
  }
};

// CREATE a new todo
export const createTodo = async (todoData: {
  widget_id: string;
  text: string;
  type: string;
  color: string;
  order_index: number;
}): Promise<Todo> => {
  try {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(todoData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create todo: ${response.statusText}`);
    }

    const newTodo = await response.json();
    return newTodo;
  } catch (error) {
    console.error("Error creating todo:", error);
    throw error;
  }
};

// UPDATE a todo
export const updateTodo = async (
  id: number,
  updates: Partial<Todo>
): Promise<Todo> => {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update todo: ${response.statusText}`);
    }

    const updatedTodo = await response.json();
    return updatedTodo;
  } catch (error) {
    console.error("Error updating todo:", error);
    throw error;
  }
};

// DELETE a todo
export const deleteTodo = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete todo: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error deleting todo:", error);
    throw error;
  }
};

// UPDATE multiple todos order
export const updateTodosOrder = async (
  todos: { id: number; order_index: number }[]
): Promise<void> => {
  try {
    const response = await fetch("/api/todos/bulk-update-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ todos }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update todos order: ${response.statusText}`);
    }
  } catch (error) {
    console.error("Error updating todos order:", error);
    throw error;
  }
};
