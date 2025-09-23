import { useEffect, useRef } from "react";

export default function Modal({ open, title, children, actions, onClose }) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    // Prefer focusing inputs on open; fallback to any focusable
    const preferInput = containerRef.current?.querySelector(
      'input, select, textarea, [contenteditable="true"]'
    );
    const allFocusable = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!containerRef.current.contains(document.activeElement)) {
      if (preferInput) {
        preferInput.focus({ preventScroll: true });
      } else if (allFocusable && allFocusable.length > 0) {
        allFocusable[0].focus({ preventScroll: true });
      }
    }

    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab" && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div ref={containerRef} className="w-full max-w-md overflow-hidden nb-card">
        <div className="flex items-center justify-between border-b-2 px-4 py-3">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md border px-3 py-1 text-sm nb-button" aria-label="Close">Close</button>
        </div>
        <div className="p-4 text-sm text-gray-800">{children}</div>
        {Array.isArray(actions) && actions.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-t-2 px-4 py-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
