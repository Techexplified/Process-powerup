import React, { useState } from "react";
import { INITIAL_BOARD_LISTS, TEAM_MEMBERS } from "../lib/processStore.js";

export default function AddCardModal({ isOpen, onClose, onAddCard }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listId, setListId] = useState(INITIAL_BOARD_LISTS[0].id);
  const [selectedAssignees, setSelectedAssignees] = useState(["SC"]);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function toggleAssignee(id) {
    if (selectedAssignees.includes(id)) {
      setSelectedAssignees(selectedAssignees.filter((x) => x !== id));
    } else {
      setSelectedAssignees([...selectedAssignees, id]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Card Title is required.");
      return;
    }

    onAddCard({
      id: `card-${Date.now()}`,
      listId,
      title: title.trim(),
      description: description.trim(),
      assignees: selectedAssignees,
      labels: [{ name: "Task", color: "blue" }],
      createdAt: new Date().toISOString(),
    });

    setTitle("");
    setDescription("");
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
            <span className="proc-modal-icon">💳</span>
            <h3 className="proc-modal-title">Create New Card</h3>
          </div>
          <button
            type="button"
            className="proc-modal-close-btn"
            onClick={onClose}
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
                Card Title <span className="proc-required">*</span>
              </label>
              <input
                type="text"
                className="proc-input-text"
                placeholder="Enter card title..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError("");
                }}
                autoFocus
              />
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">List / Column</label>
              <select
                className="proc-select"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {INITIAL_BOARD_LISTS.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">Description (Optional)</label>
              <textarea
                className="proc-textarea"
                rows={3}
                placeholder="Enter card description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="proc-form-group">
              <label className="proc-form-label">Members (Optional)</label>
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
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
