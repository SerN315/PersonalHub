import React, { useEffect, useState } from "react";
import BaseWidget from "./BaseWidget";
import "../../styles/widgets/todolist.scss";
import WidgetProps from "@/app/types/widget";
import axios from "axios";

interface Todo {
  id: number;
  widget_id: string;
  text: string;
  completed?: boolean;
}

export default function TodoListWidget(props: WidgetProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const { id: widgetId } = props;

  // Fetch todos on mount
  useEffect(() => {
    if (!widgetId) return;
    axios
      .get(`/api/todos/${widgetId}`)
      .then((res) => setTodos(res.data))
      .catch((err) => console.error("Failed to fetch todos", err));
  }, [widgetId]);

  // Add todo
  const handleAddTodo = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    axios
      .post("/api/todos", { widget_id: widgetId, text: trimmed })
      .then((res) => {
        setTodos([...todos, res.data]);
        setInput("");
      })
      .catch((err) => console.error("Failed to add todo", err));
  };

  // Delete todo
  const handleRemoveTodo = (id: number) => {
    axios
      .delete(`/api/todos/${id}`)
      .then(() => setTodos(todos.filter((todo) => todo.id !== id)))
      .catch((err) => console.error("Failed to delete todo", err));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <BaseWidget title="Todo List" {...props}>
      <div className="todoList__container">
        <div className="todoList__input">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Add a new task..."
          />
          <button onClick={handleAddTodo}>Add</button>
        </div>
        <ul className="todoList__items">
          {todos.map((todo) => (
            <li key={todo.id}>
              <span>{todo.text}</span>
              <button onClick={() => handleRemoveTodo(todo.id)}>✕</button>
            </li>
          ))}
        </ul>
      </div>
    </BaseWidget>
  );
}
