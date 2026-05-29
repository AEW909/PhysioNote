"use client";

import { useState } from "react";

type FocusDeleteButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string | undefined>;
  confirmMessage: string;
  label: string;
  disabled?: boolean;
};

export function FocusDeleteButton({
  action,
  hiddenFields,
  confirmMessage,
  label,
  disabled = false,
}: FocusDeleteButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label={label}
        className="focus-delete-icon"
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
      >
        ×
      </button>

      {open ? (
        <div className="modal-backdrop" role="presentation">
          <div
            aria-modal="true"
            className="modal-card focus-delete-modal"
            role="dialog"
          >
            <h2>{label}</h2>
            <p>{confirmMessage}</p>
            <div className="workspace-actions">
              <button className="button button-secondary" onClick={() => setOpen(false)} type="button">
                Cancel
              </button>
              <form action={action}>
                {Object.entries(hiddenFields).map(([key, value]) => (
                  <input key={key} name={key} type="hidden" value={value ?? ""} />
                ))}
                <button className="button button-danger" type="submit">
                  Confirm delete
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
