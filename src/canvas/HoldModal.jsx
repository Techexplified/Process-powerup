import React, { useState } from "react";
import { getAllAvailableMembers } from "../lib/processStore.js";

export default function HoldModal({
  isOpen,
  onClose,
  step,
  onSubmitHold,
  isAdditionalReason = false,
}) {
  const [reason, setReason] = useState("");
  const [selectedTaggedPeople, setSelectedTaggedPeople] = useState([]);
  const [error, setError] = useState("");

  if (!isOpen || !step) return null;

  function toggleTaggedPerson(memberId) {
    if (selectedTaggedPeople.includes(memberId)) {
      setSelectedTaggedPeople(selectedTaggedPeople.filter((id) => id !== memberId));
    } else {
      setSelectedTaggedPeople([...selectedTaggedPeople, memberId]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Hold Reason is REQUIRED. Please specify a reason for the hold.");
      return;
    }

    onSubmitHold(step.id, {
      id: `hr-${Date.now()}`,
      reason: reason.trim(),
      taggedPeople: selectedTaggedPeople,
      createdAt: new Date().toISOString(),
    });

    setReason("");
    setSelectedTaggedPeople([]);
    setError("");
    onClose();
  }

  return (
    <div className="proc-modal-backdrop" onClick={onClose}>
      <div
        className="proc-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="proc-modal-header proc-modal-header-hold">
          <div className="proc-modal-title-group">
            <span className="proc-modal-icon">⏸️</span>
            <h3 className="proc-modal-title">
              {isAdditionalReason ? "Add Additional Hold Reason" : "Hold Reason"}
            </h3>
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

        <div className="proc-modal-step-ref">
          <span className="proc-step-ref-tag">Target Step:</span>
          <span className="proc-step-ref-name">{step.name}</span>
        </div>

        <form onSubmit={handleSubmit} className="proc-modal-form">
          <div className="proc-modal-body">
            {error && (
              <div className="proc-modal-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="proc-form-group">
              <label className="proc-form-label">
                Reason for Hold <span className="proc-required">*</span>
              </label>
              <textarea
                className="proc-textarea"
                rows={4}
                placeholder="Enter reason for placing this step on hold..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">Tag People (Optional)</label>
              <div className="proc-members-picker">
                {getAllAvailableMembers().map((member) => {
                  const isSelected = selectedTaggedPeople.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`proc-member-pill ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleTaggedPerson(member.id)}
                    >
                      <span
                        className="proc-member-avatar"
                        style={{ background: member.bg, color: member.text }}
                      >
                        {member.initials}
                      </span>
                      <span className="proc-member-name">{member.name}</span>
                      {isSelected && <span className="proc-check-mark">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
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
              type="submit"
              className="proc-btn proc-btn-amber"
            >
              Submit Hold
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
