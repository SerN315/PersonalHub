import React, { useEffect, useState } from "react";
import BaseWidget from "./BaseWidget";
import TodoModal from "./TodoModal";
import "../../styles/widgets/todolist.scss";
import WidgetProps from "@/app/types/widget";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  updateTodosOrder,
  Todo,
} from "@/app/apis/todos";

export default function TodoListWidget(props: WidgetProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [draggedTodo, setDraggedTodo] = useState<number | null>(null);
  const { id: widgetId } = props;

  // Fetch todos on mount
  useEffect(() => {
    if (!widgetId) return;
    loadTodos();
  }, [widgetId]);

  const loadTodos = async () => {
    try {
      const data = await getTodos(widgetId);
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos", error);
    }
  };

  // Add todo
  const handleAddTodo = async (todoData: {
    text: string;
    type: string;
    color: string;
  }) => {
    try {
      const newTodo = await createTodo({
        widget_id: widgetId,
        text: todoData.text,
        type: todoData.type,
        color: todoData.color,
        order_index: todos.length,
      });
      setTodos([...todos, newTodo]);
    } catch (error) {
      console.error("Failed to add todo", error);
    }
  };

  // Edit todo
  const handleEditTodo = async (todoData: {
    text: string;
    type: string;
    color: string;
  }) => {
    if (!editingTodo) return;
    try {
      const updatedTodo = await updateTodo(editingTodo.id, todoData);
      setTodos(todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)));
      setEditingTodo(null);
    } catch (error) {
      console.error("Failed to edit todo", error);
    }
  };

  // Delete todo
  const handleRemoveTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (error) {
      console.error("Failed to delete todo", error);
    }
  };

  // Toggle completed
  const handleToggleCompleted = async (todo: Todo) => {
    try {
      const updatedTodo = await updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos(todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)));
    } catch (error) {
      console.error("Failed to toggle completed", error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, todoId: number) => {
    setDraggedTodo(todoId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedTodo === null || draggedTodo === targetId) return;

    const draggedIndex = todos.findIndex((t) => t.id === draggedTodo);
    const targetIndex = todos.findIndex((t) => t.id === targetId);

    const newTodos = [...todos];
    const [removed] = newTodos.splice(draggedIndex, 1);
    newTodos.splice(targetIndex, 0, removed);

    // Update order_index for all todos
    const updatedTodos = newTodos.map((todo, index) => ({
      ...todo,
      order_index: index,
    }));

    setTodos(updatedTodos);
    setDraggedTodo(null);

    // Update in database
    try {
      await updateTodosOrder(
        updatedTodos.map((t) => ({ id: t.id, order_index: t.order_index }))
      );
    } catch (error) {
      console.error("Failed to update order", error);
    }
  };

  const handleDragEnd = () => {
    setDraggedTodo(null);
  };

  const openAddModal = () => {
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  const filteredTodos = showCompleted
    ? todos
    : todos.filter((todo) => !todo.completed);

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <BaseWidget title="Todo List" {...props}>
      <div className="todoList__container">
        <div className="todoList__header">
          <h3>Your Tasks</h3>
          <div className="todoList__timeLeft">
            {completedCount}/{todos.length} · Completed
          </div>
        </div>
        <div className="todoList__content">
          <div className="todoList__infoActions">
            <div className="todoList__Count">
              {filteredTodos.length} Item{filteredTodos.length !== 1 ? "s" : ""}
            </div>
            <div className="todoList__CompletedToggle">
              <label>
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                />
                Show Completed
              </label>
            </div>
          </div>
          <div className="todoList__TaskList">
            <ul className="todoList__items">
              {filteredTodos.map((todo) => (
                <li
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, todo.id)}
                  onDragEnd={handleDragEnd}
                  className={`${draggedTodo === todo.id ? "dragging" : ""} ${
                    todo.completed ? "completed" : ""
                  }`}
                  style={{ backgroundColor: todo.color }}
                  onDoubleClick={() => openEditModal(todo)}
                >
                  <div className="todoList__items__Status">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => handleToggleCompleted(todo)}
                    />
                  </div>
                  <span className="todoList__items__Text">{todo.text}</span>

                  <span
                    className={`todoList__items__Type type-${todo.type.toLowerCase()}`}
                  >
                    {todo.type}
                  </span>
                  <button
                    className="todoList__items__deleteBtn"
                    onClick={() => handleRemoveTodo(todo.id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="todoList__addButton">
          <button onClick={openAddModal}>+ Add Item</button>
        </div>
      </div>

      <TodoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={editingTodo ? handleEditTodo : handleAddTodo}
        initialData={
          editingTodo
            ? {
                text: editingTodo.text,
                type: editingTodo.type,
                color: editingTodo.color,
              }
            : undefined
        }
        mode={editingTodo ? "edit" : "add"}
      />
    </BaseWidget>
  );
}
