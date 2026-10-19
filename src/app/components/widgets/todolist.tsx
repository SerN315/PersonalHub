"use client";
import React, { memo, useEffect, useState } from "react";
import BaseWidget from "./BaseWidget";
import TodoModal from "./TodoModal";
import BasicIcon from "../ultis/icons";
import "../../styles/widgets/todolist.scss";
import WidgetProps from "@/app/types/widget";
import { getTodos, createTodo, updateTodo, deleteTodo, updateTodosOrder, Todo } from "@/app/apis/todos";

type TodoInput = { text: string; type: string; color: string };

function TodoListWidget(props: WidgetProps) {
  const { id: widgetId } = props;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; editing: Todo | null }>({ open: false, editing: null });
  const [draggedTodo, setDraggedTodo] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTodos(widgetId)
      .then((data) => {
        if (cancelled) return;
        setTodos(data);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [widgetId]);

  // Every change waits for the server's answer; a failure shows a short notice instead of silently doing nothing.
  const attempt = async (action: () => Promise<void>, message: string) => {
    try {
      setNotice("");
      await action();
    } catch {
      setNotice(message);
    }
  };

  const handleAdd = (input: TodoInput) =>
    attempt(async () => {
      const created = await createTodo({ widget_id: widgetId, ...input, order_index: todos.length });
      setTodos((prev) => [...prev, created]);
    }, "Couldn't add that task.");

  const handleEdit = (input: TodoInput) =>
    attempt(async () => {
      if (!modal.editing) return;
      const updated = await updateTodo(modal.editing.id, input);
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }, "Couldn't save your changes.");

  const handleRemove = (todoId: number) =>
    attempt(async () => {
      await deleteTodo(todoId);
      setTodos((prev) => prev.filter((t) => t.id !== todoId));
    }, "Couldn't remove that task.");

  const handleToggle = (todo: Todo) =>
    attempt(async () => {
      const updated = await updateTodo(todo.id, { completed: !todo.completed });
      setTodos((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    }, "Couldn't update that task.");

  const handleDrop = (event: React.DragEvent, targetId: number) => {
    event.preventDefault();
    if (draggedTodo === null || draggedTodo === targetId) return;
    const from = todos.findIndex((t) => t.id === draggedTodo);
    const to = todos.findIndex((t) => t.id === targetId);
    const reordered = [...todos];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const next = reordered.map((todo, index) => ({ ...todo, order_index: index }));
    setTodos(next);
    setDraggedTodo(null);
    attempt(() => updateTodosOrder(next.map((t) => ({ id: t.id, order_index: t.order_index }))), "Couldn't save the new order.");
  };

  const completed = todos.filter((t) => t.completed).length;
  const visible = showCompleted ? todos : todos.filter((t) => !t.completed);
  const progress = todos.length === 0 ? 0 : completed / todos.length;

  return (
    <BaseWidget title="To-do" {...props}>
      <div className="todo">
        <header className="todo__header">
          <h3>To-do</h3>
          <span className="todo__count" aria-label={`${completed} of ${todos.length} done`}>
            {completed}/{todos.length}
          </span>
        </header>
        <div className="todo__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="Tasks done">
          <span style={{ width: `${progress * 100}%` }} />
        </div>

        <ul className="todo__list">
          {visible.map((todo) => (
            <li
              key={todo.id}
              draggable
              onDragStart={(e) => {
                setDraggedTodo(todo.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, todo.id)}
              onDragEnd={() => setDraggedTodo(null)}
              className={`todo__item ${todo.completed ? "is-done" : ""} ${draggedTodo === todo.id ? "is-dragging" : ""}`}
              style={{ ["--dot" as string]: todo.color }}
            >
              <label className="todo__check">
                <input type="checkbox" checked={todo.completed} onChange={() => handleToggle(todo)} />
                <span className="todo__box" aria-hidden>
                  <BasicIcon icon="Tick02Icon" size={14} strokeWidth={2.4} />
                </span>
                <span className="sr-only">Done: {todo.text}</span>
              </label>
              <span className="todo__text" onDoubleClick={() => setModal({ open: true, editing: todo })}>
                {todo.text}
              </span>
              <span className="todo__type">{todo.type}</span>
              <span className="todo__actions">
                <button type="button" onClick={() => setModal({ open: true, editing: todo })} aria-label={`Edit ${todo.text}`}>
                  <BasicIcon icon="Edit02Icon" size={15} />
                </button>
                <button type="button" onClick={() => handleRemove(todo.id)} aria-label={`Delete ${todo.text}`}>
                  <BasicIcon icon="Delete02Icon" size={15} />
                </button>
              </span>
            </li>
          ))}
        </ul>

        {loaded && !failed && visible.length === 0 && (
          <p className="todo__empty">{todos.length === 0 ? "Nothing planned. A quiet day?" : "All done. Enjoy the calm."}</p>
        )}
        {failed && <p className="todo__empty">Couldn&apos;t load your tasks.</p>}
        {notice && (
          <p className="todo__notice" role="alert">
            {notice}
          </p>
        )}

        <footer className="todo__footer">
          <button type="button" className="todo__add" onClick={() => setModal({ open: true, editing: null })}>
            <BasicIcon icon="PlusSignIcon" size={16} /> Add a task
          </button>
          <label className="todo__toggle">
            <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
            Show done
          </label>
        </footer>
      </div>

      <TodoModal
        key={modal.editing?.id ?? "new"}
        isOpen={modal.open}
        mode={modal.editing ? "edit" : "add"}
        initialData={modal.editing ? { text: modal.editing.text, type: modal.editing.type, color: modal.editing.color } : undefined}
        onClose={() => setModal({ open: false, editing: null })}
        onSave={modal.editing ? handleEdit : handleAdd}
      />
    </BaseWidget>
  );
}

export default memo(TodoListWidget);
