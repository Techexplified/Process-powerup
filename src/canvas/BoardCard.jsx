import React, { useState, useEffect } from "react";
import { getMemberById, loadCardProcess, calculateProcessStats } from "../lib/processStore.js";
import { ProcessIcon } from "../lib/icons.jsx";

export default function BoardCard({ card, onSelectCard, t = null }) {
  const [processSummary, setProcessSummary] = useState(null);

  useEffect(() => {
    let isMounted = true;
    loadCardProcess(card.id, t).then((data) => {
      if (isMounted && data && data.enabled && data.steps?.length > 0) {
        const stats = calculateProcessStats(data.steps);
        setProcessSummary(stats);
      } else if (isMounted) {
        setProcessSummary(null);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [card.id, t]);

  return (
    <div
      className="proc-board-card"
      onClick={() => onSelectCard(card)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectCard(card);
        }
      }}
    >
      {/* Card Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="proc-board-card-labels">
          {card.labels.map((lbl, idx) => (
            <span
              key={idx}
              className={`proc-board-label-pill label-${lbl.color || "blue"}`}
            >
              {lbl.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Title */}
      <h4 className="proc-board-card-title">{card.title}</h4>

      {/* Footer: Process Badges & Member Avatars */}
      <div className="proc-board-card-footer">
        <div className="proc-board-card-badges">
          {processSummary ? (
            <div className="proc-card-process-badge-group">
              <span
                className={`proc-badge-pill ${
                  processSummary.done === processSummary.total
                    ? "badge-all-done"
                    : "badge-progress"
                }`}
                title="Process step progress"
              >
                <ProcessIcon width={12} height={12} />
                <span>
                  {processSummary.done}/{processSummary.total} steps
                </span>
              </span>

              {processSummary.held > 0 && (
                <span
                  className="proc-badge-pill badge-held-alert"
                  title={`${processSummary.held} step(s) on hold`}
                >
                  ⏸ {processSummary.held} held
                </span>
              )}
            </div>
          ) : (
            <span className="proc-board-card-empty-proc">
              <ProcessIcon width={11} height={11} /> Power-Up Available
            </span>
          )}
        </div>

        {/* Member Avatars */}
        {card.assignees && card.assignees.length > 0 && (
          <div className="proc-board-card-avatars">
            {card.assignees.map((memId) => {
              const member = getMemberById(memId);
              return (
                <span
                  key={memId}
                  className="proc-board-avatar"
                  style={{ background: member.bg, color: member.text }}
                  title={member.name}
                >
                  {member.initials}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
