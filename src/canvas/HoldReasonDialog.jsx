import React, { useState } from "react";
import { getAllAvailableMembers } from "../lib/processStore.js";

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
      setError("Please provide a reason for placing this step on hold.");
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
          <div className="proc-dialog-title-group">
            <span className="proc-hold-amber-icon">⏸</span>
            <div>
              <h3 className="proc-dialog-title">Put step on hold</h3>
              <p className="proc-dialog-subtitle">{step.name}</p>
            </div>
          </div>
          <button
            type="button"
            className="proc-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="proc-dialog-form">
          <div className="proc-dialog-body">
            {error && <div className="proc-dialog-error">{error}</div>}

            <div className="proc-dialog-group">
              <label className="proc-dialog-label">Reason</label>
              <textarea
                className="proc-dialog-textarea proc-textarea-amber-focus"
                rows={3}
                placeholder="Waiting for client credentials"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
            </div>

            <div className="proc-dialog-group">
              <label className="proc-dialog-label">Who's unblocking this</label>
              <div className="proc-unblocker-pills-wrap">
                {members.map((m) => {
                  const isSelected = selectedUnblockers.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`proc-unblocker-pill ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleUnblocker(m.id)}
                    >
                      <span
                        className="proc-unblocker-avatar"
                        style={{ background: m.bg, color: m.text }}
                      >
                        {m.initials}
                      </span>
                      <span className="proc-unblocker-name">{m.name}</span>
                      {isSelected && <span className="proc-unblocker-remove">✕</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="proc-dialog-footer">
            <button
              type="button"
              className="proc-dialog-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="proc-dialog-btn-submit-amber">
              Put on hold
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
