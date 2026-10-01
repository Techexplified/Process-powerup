import React, { useState } from "react";
import { getAllAvailableMembers } from "../lib/processStore.js";

export default function AddStepDialog({ isOpen, onClose, onAddStep }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const members = getAllAvailableMembers();

  function toggleAssignee(id) {
    if (selectedAssignees.includes(id)) {
      setSelectedAssignees(selectedAssignees.filter((x) => x !== id));
    } else {
      setSelectedAssignees([...selectedAssignees, id]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Step name is required.");
      return;
    }

    onAddStep({
      id: `step-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      targetDate: targetDate || null,
      assignees: selectedAssignees.length > 0 ? selectedAssignees : ["SC"],
      status: "pending",
      holdReasons: [],
    });

    setName("");
    setDescription("");
    setTargetDate("");
    setSelectedAssignees([]);
    setShowMemberPicker(false);
    setError("");
    onClose();
  }

  return (
    <div className="proc-dialog-backdrop" onClick={onClose}>
      <div
        className="proc-dialog-card proc-add-step-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="proc-dialog-header">
          <h3 className="proc-dialog-title">Add Step</h3>
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
              <label className="proc-dialog-label">Step Name *</label>
              <input
                type="text"
                className="proc-dialog-input"
                placeholder="Enter step name.."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
            </div>

            <div className="proc-dialog-group">
              <label className="proc-dialog-label">Description</label>
              <textarea
                className="proc-dialog-textarea"
                rows={3}
                placeholder="Enter step description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="proc-dialog-two-cols">
              <div className="proc-dialog-group">
                <label className="proc-dialog-label">Target Date (Optional)</label>
                <div className="proc-input-icon-wrap">
                  <input
                    type="date"
                    className="proc-dialog-input"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="proc-dialog-group">
                <label className="proc-dialog-label">Tag People (Optional)</label>
                <div className="proc-member-picker-wrap">
                  <button
                    type="button"
                    className="proc-dialog-select-btn"
                    onClick={() => setShowMemberPicker(!showMemberPicker)}
                  >
                    <span>
                      {selectedAssignees.length === 0
                        ? "👥 Tag people..."
                        : `${selectedAssignees.length} people tagged`}
                    </span>
                    <span>▾</span>
                  </button>

                  {showMemberPicker && (
                    <div className="proc-member-dropdown-menu">
                      {members.map((m) => {
                        const isSel = selectedAssignees.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            className={`proc-member-dropdown-item ${isSel ? "selected" : ""}`}
                            onClick={() => toggleAssignee(m.id)}
                          >
                            <span
                              className="proc-dropdown-avatar"
                              style={{ background: m.bg, color: m.text }}
                            >
                              {m.initials}
                            </span>
                            <span className="proc-dropdown-name">{m.name}</span>
                            {isSel && <span className="proc-dropdown-check">✓</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
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
            <button type="submit" className="proc-dialog-btn-create-solid">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
