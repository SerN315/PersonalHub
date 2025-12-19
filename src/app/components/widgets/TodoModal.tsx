import React, { useState } from "react";
import "../../styles/widgets/todoModal.scss";

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todoData: {
    text: string;
    type: string;
    color: string;
  }) => void;
  initialData?: {
    text: string;
    type: string;
    color: string;
  };
  mode: "add" | "edit";
}

const TODO_TYPES = ["Diary", "Sweets", "Gluten", "Work", "Personal", "Shopping", "Other"];

const TODO_COLORS = [
  { name: "Gray", value: "#9CA3AF" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#10B981" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
];

export default function TodoModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode,
}: TodoModalProps) {
  const [text, setText] = useState(initialData?.text || "");
  const [type, setType] = useState(initialData?.type || "Personal");
  const [customType, setCustomType] = useState("");
  const [color, setColor] = useState(initialData?.color || "#9CA3AF");

  if (!isOpen) return null;

  const handleSave = () => {
    const finalType = customType.trim() || type;
    if (text.trim() && finalType.trim()) {
      onSave({ text, type: finalType, color });
      handleClose();
    }
  };

  const handleClose = () => {
    setText("");
    setType("Personal");
    setCustomType("");
    setColor("#9CA3AF");
    onClose();
  };

  return (
    <div className="todoModal__overlay" onClick={handleClose}>
      <div className="todoModal__content" onClick={(e) => e.stopPropagation()}>
        <div className="todoModal__header">
          <h3>{mode === "add" ? "Add New Task" : "Edit Task"}</h3>
          <button className="todoModal__closeBtn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="todoModal__body">
          <div className="todoModal__field">
            <label>Task Description</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your task..."
              rows={3}
              autoFocus
            />
          </div>

          <div className="todoModal__field">
            <label>Type</label>
            <div className="todoModal__typeGrid">
              {TODO_TYPES.map((t) => (
                <button
                  key={t}
                  className={`todoModal__typeBtn ${type === t && !customType ? "active" : ""}`}
                  onClick={() => {
                    setType(t);
                    setCustomType("");
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="todoModal__customTypeInput"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Or enter custom type..."
            />
          </div>

          <div className="todoModal__field">
            <label>Item Color</label>
            <div className="todoModal__colorGrid">
              {TODO_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`todoModal__colorBtn ${
                    color === c.value ? "active" : ""
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                >
                  {color === c.value && (
                    <span className="todoModal__checkmark">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="todoModal__footer">
          <button className="todoModal__cancelBtn" onClick={handleClose}>
            Cancel
          </button>
          <button
            className="todoModal__saveBtn"
            onClick={handleSave}
            disabled={!text.trim()}
          >
            {mode === "add" ? "Add Task" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
