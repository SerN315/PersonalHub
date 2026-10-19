"use client";
import React, { useState } from "react";
import Modal from "@/app/components/ui/Modal";
import BaseButton from "@/app/components/ui/BaseButton";
import BaseInput from "@/app/components/ui/BaseInput";
import BasicIcon from "@/app/components/ultis/icons";
import "../../styles/widgets/todoModal.scss";

interface TodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (todoData: { text: string; type: string; color: string }) => void;
  initialData?: { text: string; type: string; color: string };
  mode: "add" | "edit";
}

const TODO_TYPES = ["Personal", "Work", "Home", "Health", "Shopping", "Ideas"];

// The same palette as the rest of the app (stored as plain hex so any device renders it the same way).
const TODO_COLORS = [
  { name: "Clay", value: "#c46f4a" },
  { name: "Butter", value: "#e0ad2f" },
  { name: "Peach", value: "#ec8b62" },
  { name: "Rose", value: "#d4687d" },
  { name: "Sage", value: "#7c9d77" },
  { name: "Sky", value: "#5e96b8" },
  { name: "Lilac", value: "#9c84bd" },
  { name: "Stone", value: "#9a8f84" },
];

// Mounted fresh for every task (the parent keys it), so the form always starts from the right values.
export default function TodoModal({ isOpen, onClose, onSave, initialData, mode }: TodoModalProps) {
  const [text, setText] = useState(initialData?.text ?? "");
  const [type, setType] = useState(initialData?.type ?? "Personal");
  const [color, setColor] = useState(initialData?.color ?? TODO_COLORS[0].value);

  const finalType = type.trim() || "Personal";
  const canSave = text.trim().length > 0;

  const save = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!canSave) return;
    onSave({ text: text.trim(), type: finalType, color });
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={mode === "add" ? "Add a task" : "Edit task"}
      width={480}
      footer={
        <>
          <BaseButton variant="ghost" onClick={onClose}>
            Cancel
          </BaseButton>
          <BaseButton onClick={() => save()} disabled={!canSave}>
            {mode === "add" ? "Add task" : "Save changes"}
          </BaseButton>
        </>
      }
    >
      <form className="taskForm" onSubmit={save}>
        <div className="field">
          <label className="field__label" htmlFor="task-text">
            What needs doing?
          </label>
          <textarea id="task-text" className="input" rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Water the plants…" autoFocus />
        </div>

        <div className="field">
          <span className="field__label" id="task-type-label">
            Type
          </span>
          <div className="taskForm__chips" role="radiogroup" aria-labelledby="task-type-label">
            {TODO_TYPES.map((t) => (
              <button key={t} type="button" role="radio" aria-checked={type === t} className="taskForm__chip" onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
          <BaseInput aria-label="Custom type" placeholder="…or type your own" maxLength={40} value={TODO_TYPES.includes(type) ? "" : type} onChange={(e) => setType(e.target.value)} />
        </div>

        <div className="field">
          <span className="field__label" id="task-color-label">
            Colour
          </span>
          <div className="swatches" role="radiogroup" aria-labelledby="task-color-label">
            {TODO_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={color === c.value}
                aria-label={c.name}
                title={c.name}
                className="swatches__item"
                style={{ ["--swatch" as string]: c.value }}
                onClick={() => setColor(c.value)}
              >
                {color === c.value && <BasicIcon icon="Tick02Icon" size={14} strokeWidth={2.6} color="#fff" />}
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
