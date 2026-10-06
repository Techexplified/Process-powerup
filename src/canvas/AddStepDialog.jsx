import React, { useState, useEffect, useRef } from "react";
import { getAllAvailableMembers, getMemberById } from "../lib/processStore.js";
import { CalendarIcon, CloseIcon } from "../lib/icons.jsx";

export default function AddStepDialog({ isOpen, onClose, onAddStep }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [error, setError] = useState("");
  const pickerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowMemberPicker(false);
      }
    }

    if (showMemberPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMemberPicker]);

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
      assignees: selectedAssignees,
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
          <div className="proc-dialog-title-group">
            <h3 className="proc-dialog-title">Add Step</h3>
          </div>
          <button
            type="button"
            className="proc-dialog-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon width={13} height={13} />
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
                placeholder="Enter step name..."
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
                <div className="proc-date-input-wrapper">
                  <input
                    type="date"
                    className="proc-dialog-date-input"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="proc-dialog-group">
                <label className="proc-dialog-label">Tag People (Optional)</label>
                <div className="proc-member-picker-wrap" ref={pickerRef}>
                  <button
                    type="button"
                    className="proc-dialog-select-btn"
                    onClick={() => setShowMemberPicker(!showMemberPicker)}
                  >
                    <div className="proc-select-btn-inner">
                      {selectedAssignees.length === 0 ? (
                        <span className="proc-select-placeholder">👥 Tag people...</span>
                      ) : (
                        <div className="proc-selected-avatars-row">
                          {selectedAssignees.map((id) => {
                            const mem = getMemberById(id);
                            return (
                              <span
                                key={id}
                                className="proc-tag-mini-avatar"
                                style={{ background: mem.bg, color: mem.text }}
                                title={mem.name}
                              >
                                {mem.initials}
                              </span>
                            );
                          })}
                          <span className="proc-selected-count-label">
                            {selectedAssignees.length} selected
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="proc-dropdown-arrow-caret">▾</span>
                  </button>

                  {showMemberPicker && (
                    <div className="proc-dialog-member-dropdown custom-slim-scrollbar">
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
                            <div className="proc-dropdown-info">
                              <span className="proc-dropdown-name">{m.name}</span>
                              <span className="proc-dropdown-role">{m.role || "Member"}</span>
                            </div>
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

