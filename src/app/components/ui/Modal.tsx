"use client";

import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import BasicIcon from "@/app/components/ultis/icons";
import "@/app/styles/ui/controls.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
  // Pass a header-less layout (the settings dialog draws its own chrome).
  bare?: boolean;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

// The element that had focus before a dialog opened. Tracked globally because an autoFocus field inside the
// dialog takes focus (at mount) before any effect of ours could read document.activeElement.
let lastFocusOutsideDialog: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (target && !target.closest('[role="dialog"]')) lastFocusOutsideDialog = target;
    },
    true
  );
}

// An accessible dialog: portal, Escape/backdrop to close, focus moved in and trapped, focus restored on close, page scroll locked.
export default function Modal({ open, onClose, title, width = 520, footer, children, bare = false }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = lastFocusOutsideDialog;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>("[autofocus], input, textarea") ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="modalBackdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="modalPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ ["--modal-w" as string]: `${width}px` }}
      >
        {bare ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="modalPanel__header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="iconBtn" onClick={onClose} aria-label="Close">
              <BasicIcon icon="Cancel01Icon" size={20} />
            </button>
          </div>
        )}
        {bare ? children : <div className="modalPanel__body">{children}</div>}
        {footer && <div className="modalPanel__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
