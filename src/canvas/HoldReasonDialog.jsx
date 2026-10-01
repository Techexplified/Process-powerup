import React, { useState } from "react";
import { getAllAvailableMembers } from "../lib/processStore.js";
import { PauseIcon, CloseIcon } from "../lib/icons.jsx";

export default function HoldReasonDialog({
  isOpen,
  onClose,
  step,
  onSubmitHold,
}) {
  const [reason, setReason] = useState("");
  const [selectedUnblockers, setSelectedUnblockers] = useState(["DH"]);
  const [error, setError] = useState("");

  if (!isOpen || !step) return null;

  const members = getAllAvailableMembers();

  function toggleUnblocker(id) {
    if (selectedUnblockers.includes(id)) {
      setSelectedUnblockers(selectedUnblockers.filter((x) => x !== id));
    } else {
      setSelectedUnblockers([...selectedUnblockers, id]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please enter a reason for placing this step on hold.");
      return;
    }

    onSubmitHold(step.id, {
      id: `hr-${Date.now()}`,
      reason: reason.trim(),
      taggedPeople: selectedUnblockers,
      createdAt: new Date().toISOString(),
    });

    setReason("");
    setSelectedUnblockers(["DH"]);
    setError("");
    onClose();
  }

  return (
    <div className="proc-dialog-backdrop" onClick={onClose}>
      <div
        className="proc-dialog-card proc-dialog-hold-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="proc-dialog-header">
          <div className="proc-hold-dialog-title-left">
            <div className="proc-hold-circle-glyph">
              <span className="proc-hold-glyph-pause">⏸</span>
            </div>
            <div className="proc-hold-headings-wrap">
              <div className="proc-hold-main-title-row">
                <h3 className="proc-dialog-title">Hold Reason</h3>
                <span className="proc-badge-hold-pill">● HOLD</span>
              </div>
              <p className="proc-dialog-subtitle" title={step.name}>
                {step.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="proc-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon width={14} height={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="proc-dialog-form">
          <div className="proc-dialog-body">
            {error && <div className="proc-dialog-error">{error}</div>}

            <div className="proc-dialog-group">
              <label className="proc-dialog-label proc-label-amber-highlight">
                Reason for Hold *
              </label>
              <textarea
                className="proc-dialog-textarea proc-textarea-amber-border"
                rows={3}
                placeholder="Enter reason for placing this step on hold (e.g. Waiting for client credentials)..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
            </div>

            <div className="proc-dialog-group">
              <label className="proc-dialog-label">
                <span className="proc-tag-people-icon">👥</span> Tag People (Optional)
              </label>
              <div className="proc-unblocker-grid-2col custom-slim-scrollbar">
                {members.map((m) => {
                  const isSelected = selectedUnblockers.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      className={`proc-unblocker-card-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleUnblocker(m.id)}
                    >
                      <span
                        className="proc-unblocker-circle-avatar"
                        style={{ background: m.bg, color: m.text }}
                      >
                        {m.initials}
                      </span>
                      <div className="proc-unblocker-info-col">
                        <div className="proc-unblocker-item-name">{m.name}</div>
                        <div className="proc-unblocker-item-role">{m.role || "Member"}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="proc-dialog-footer">
            <button
              type="button"
              className="proc-dialog-btn-cancel-link"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="proc-dialog-btn-submit-hold">
              <span className="proc-btn-hold-icon">⏸</span>
              <span>Submit Hold</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
