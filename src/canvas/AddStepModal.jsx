import React, { useState } from "react";
import { TEAM_MEMBERS } from "../lib/processStore.js";

export default function AddStepModal({ isOpen, onClose, onAddStep }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState(["SC"]);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function toggleAssignee(memberId) {
    if (selectedAssignees.includes(memberId)) {
      setSelectedAssignees(selectedAssignees.filter((id) => id !== memberId));
    } else {
      setSelectedAssignees([...selectedAssignees, memberId]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Step Name is required.");
      return;
    }

    onAddStep({
      id: `step-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      targetDate: targetDate || null,
      assignees: selectedAssignees,
      status: "pending",
      holdReasons: [],
    });

    setName("");
    setDescription("");
    setTargetDate("");
    setSelectedAssignees(["SC"]);
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
        <div className="proc-modal-header">
          <div className="proc-modal-title-group">
            <span className="proc-modal-icon">➕</span>
            <h3 className="proc-modal-title">Add Step</h3>
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

        <form onSubmit={handleSubmit} className="proc-modal-form">
          <div className="proc-modal-body">
            {error && (
              <div className="proc-modal-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="proc-form-group">
              <label className="proc-form-label">
                Step Name <span className="proc-required">*</span>
              </label>
              <input
                type="text"
                className="proc-input-text"
                placeholder="Enter step name..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">Description (Optional)</label>
              <textarea
                className="proc-textarea"
                rows={3}
                placeholder="Enter step description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">Target Date (Optional)</label>
              <input
                type="date"
                className="proc-input-date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">Tag People (Optional)</label>
              <div className="proc-members-picker">
                {TEAM_MEMBERS.map((member) => {
                  const isSelected = selectedAssignees.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`proc-member-pill ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleAssignee(member.id)}
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
            <button type="submit" className="proc-btn proc-btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
