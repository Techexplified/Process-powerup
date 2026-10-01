import React from "react";

export default function DeleteConfirmModal({ isOpen, onClose, step, onConfirmDelete }) {
  if (!isOpen || !step) return null;

  return (
    <div className="proc-modal-backdrop" onClick={onClose}>
      <div
        className="proc-modal-dialog proc-modal-small"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="proc-modal-header proc-modal-header-danger">
          <div className="proc-modal-title-group">
            <span className="proc-modal-icon">🗑️</span>
            <h3 className="proc-modal-title">Delete Process Step</h3>
          </div>
          <button
            type="button"
            className="proc-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="proc-modal-body">
          <p className="proc-delete-warning-text">
            Are you sure you want to delete this process step?
          </p>
          <div className="proc-delete-target-preview">
            <strong>"{step.name}"</strong>
          </div>
          <p className="proc-delete-note">
            ℹ️ This will only delete this specific step. The parent card will remain unaffected.
          </p>
        </div>

        <div className="proc-modal-footer">
          <button
            type="button"
            className="proc-btn proc-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="proc-btn proc-btn-danger"
            onClick={() => {
              onConfirmDelete(step.id);
              onClose();
            }}
          >
            Delete Step
          </button>
        </div>
      </div>
    </div>
  );
}
