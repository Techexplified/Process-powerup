import React, { useState } from "react";
import ProcessPowerUp from "./ProcessPowerUp.jsx";
import { getMemberById, INITIAL_BOARD_LISTS } from "../lib/processStore.js";

export default function CardDetailModal({
  card,
  onClose,
  onDeleteCard,
  t = null,
}) {
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(false);

  if (!card) return null;

  const currentList = INITIAL_BOARD_LISTS.find((l) => l.id === card.listId) || {
    title: "Active Board",
  };

  return (
    <div className="proc-card-modal-backdrop" onClick={onClose}>
      <div
        className="proc-card-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* CARD TOP HEADER */}
        <div className="proc-card-modal-header">
          <div className="proc-card-modal-title-col">
            <div className="proc-card-modal-title-row">
              <span className="proc-card-type-icon">💳</span>
              <h2 className="proc-card-modal-title">{card.title}</h2>
            </div>
            <p className="proc-card-modal-subline">
              in list <strong className="proc-list-highlight">{currentList.title}</strong>
            </p>
          </div>

          <div className="proc-card-modal-top-actions">
            <button
              type="button"
              className="proc-card-btn-delete-card"
              onClick={() => setShowDeleteCardConfirm(true)}
              title="Delete entire card from board"
            >
              🗑️ Delete Card
            </button>
            <button
              type="button"
              className="proc-card-modal-close"
              onClick={onClose}
              aria-label="Close card modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CARD BODY CONTENT */}
        <div className="proc-card-modal-body custom-slim-scrollbar">
          {/* Card Meta details: Members & Labels */}
          <div className="proc-card-meta-bar">
            {card.assignees && card.assignees.length > 0 && (
              <div className="proc-meta-item">
                <span className="proc-meta-label">MEMBERS</span>
                <div className="proc-meta-avatars-row">
                  {card.assignees.map((memId) => {
                    const member = getMemberById(memId);
                    return (
                      <span
                        key={memId}
                        className="proc-member-badge"
                        style={{ background: member.bg, color: member.text }}
                        title={member.name}
                      >
                        {member.initials}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {card.labels && card.labels.length > 0 && (
              <div className="proc-meta-item">
                <span className="proc-meta-label">LABELS</span>
                <div className="proc-labels-row">
                  {card.labels.map((lbl, idx) => (
                    <span
                      key={idx}
                      className={`proc-card-label-badge label-${lbl.color || "blue"}`}
                    >
                      {lbl.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Description */}
          {card.description && (
            <div className="proc-card-desc-box">
              <span className="proc-desc-label">Description</span>
              <p className="proc-desc-content">{card.description}</p>
            </div>
          )}

          {/* PROCESS POWER-UP SECTION (BELONGS TO THIS SELECTED CARD) */}
          <div className="proc-powerup-embed-container">
            <ProcessPowerUp
              cardId={card.id}
              cardTitle={card.title}
              cardDescription={card.description}
              t={t}
            />
          </div>
        </div>

        {/* DELETE CARD CONFIRMATION MODAL */}
        {showDeleteCardConfirm && (
          <div
            className="proc-modal-backdrop"
            style={{ zIndex: 1100 }}
            onClick={() => setShowDeleteCardConfirm(false)}
          >
            <div
              className="proc-modal-dialog proc-modal-small"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="proc-modal-header proc-modal-header-danger">
                <div className="proc-modal-title-group">
                  <span className="proc-modal-icon">⚠️</span>
                  <h3 className="proc-modal-title">Delete Entire Card</h3>
                </div>
                <button
                  type="button"
                  className="proc-modal-close-btn"
                  onClick={() => setShowDeleteCardConfirm(false)}
                >
                  ✕
                </button>
              </div>

              <div className="proc-modal-body">
                <p className="proc-delete-warning-text">
                  Are you sure you want to delete this card from the board?
                </p>
                <div className="proc-delete-target-preview">
                  <strong>"{card.title}"</strong>
                </div>
                <p className="proc-delete-note">
                  ⚠️ This action will permanently remove this card and all its attached process data from the board.
                </p>
              </div>

              <div className="proc-modal-footer">
                <button
                  type="button"
                  className="proc-btn proc-btn-secondary"
                  onClick={() => setShowDeleteCardConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="proc-btn proc-btn-danger"
                  onClick={() => {
                    onDeleteCard(card.id);
                    setShowDeleteCardConfirm(false);
                    onClose();
                  }}
                >
                  Confirm Delete Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
