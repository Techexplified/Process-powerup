import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  saveCardProcess,
  calculateProcessStats,
  getMemberById,
} from "../lib/processStore.js";
import { CheckIcon } from "../lib/icons.jsx";

export default function CardBackSidebar({
  card,
  onOpenFullView,
  onAddStepClick,
  t = null,
}) {
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    loadCardProcess(card.id, t, card.title, card.description).then((data) => {
      if (isMounted) {
        setProcessData(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [card.id, card.title, card.description, t]);

  function updateAndPersist(newData) {
    setProcessData(newData);
    saveCardProcess(card.id, newData, t);
  }

  function handleToggleSwitch() {
    const nextEnabled = !processData?.enabled;
    const updated = {
      ...processData,
      enabled: nextEnabled,
      title: processData?.title || `${card.title} process`,
      description: processData?.description || card.description || "",
      status: nextEnabled ? "Active" : "Draft",
      steps: processData?.steps?.length ? processData.steps : [],
    };
    updateAndPersist(updated);
  }

  function handleToggleDone(stepId) {
    const updatedSteps = (processData.steps || []).map((s) => {
      if (s.id === stepId) {
        return {
          ...s,
          status: s.status === "done" ? "pending" : "done",
        };
      }
      return s;
    });
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  if (loading) {
    return (
      <div className="proc-sidebar-widget proc-sidebar-loading">
        <div className="proc-spinner"></div>
      </div>
    );
  }

  // Disabled State
  if (!processData?.enabled) {
    return (
      <div className="proc-sidebar-widget proc-sidebar-disabled">
        <div className="proc-sidebar-header-row">
          <div className="proc-sidebar-title-group">
            <span className="proc-sidebar-icon">⚡</span>
            <span className="proc-sidebar-title">Process</span>
          </div>
          <label className="proc-toggle-switch">
            <input
              type="checkbox"
              checked={false}
              onChange={handleToggleSwitch}
            />
            <span className="proc-toggle-slider"></span>
          </label>
        </div>
        <p className="proc-sidebar-desc">Turn on to add steps to this card.</p>
      </div>
    );
  }

  const steps = processData.steps || [];
  const stats = calculateProcessStats(steps);

  return (
    <div className="proc-sidebar-widget proc-sidebar-active">
      {/* Top Header */}
      <div className="proc-sidebar-header-row">
        <div className="proc-sidebar-title-group">
          <span className="proc-sidebar-icon">⚡</span>
          <span className="proc-sidebar-title">Process</span>
        </div>
        <label className="proc-toggle-switch">
          <input
            type="checkbox"
            checked={true}
            onChange={handleToggleSwitch}
          />
          <span className="proc-toggle-slider"></span>
        </label>
      </div>

      <div className="proc-sidebar-card-name-row">
        <h4 className="proc-sidebar-card-name">
          {processData.title || card.title}
        </h4>
        <span className="proc-badge-active-mini">Active</span>
      </div>

      {/* Progress Line & Segmented Track */}
      <div className="proc-sidebar-progress-box">
        <div className="proc-sidebar-progress-labels">
          <span>
            {stats.done} of {stats.total} done
          </span>
          {stats.held > 0 && (
            <span className="proc-sidebar-held-text">
              · {stats.held} on hold
            </span>
          )}
        </div>

        <div className="proc-segmented-track-mini">
          {steps.map((s, idx) => (
            <div
              key={s.id || idx}
              className={`proc-seg-mini ${
                s.status === "done"
                  ? "seg-done"
                  : s.status === "held"
                  ? "seg-held"
                  : "seg-todo"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Compact Steps List */}
      <div className="proc-sidebar-steps-list">
        {steps.map((step) => {
          const isDone = step.status === "done";
          const isHeld = step.status === "held";
          const firstHold = step.holdReasons?.[0];

          return (
            <div
              key={step.id}
              className={`proc-sidebar-step-row ${
                isDone ? "step-done" : isHeld ? "step-held" : ""
              }`}
            >
              <div className="proc-sidebar-step-top">
                <button
                  type="button"
                  className={`proc-sidebar-check ${isDone ? "checked" : ""}`}
                  onClick={() => handleToggleDone(step.id)}
                >
                  {isDone && <CheckIcon width={10} height={10} />}
                </button>

                <span
                  className={`proc-sidebar-step-title ${isDone ? "line-through" : ""}`}
                >
                  {step.name}
                </span>
              </div>

              <div className="proc-sidebar-step-bottom">
                <div className="proc-sidebar-step-meta">
                  {step.targetDate && (
                    <span className="proc-sidebar-date">{step.targetDate}</span>
                  )}
                  {step.assignees?.[0] && (
                    <span
                      className="proc-sidebar-avatar"
                      style={{
                        background: getMemberById(step.assignees[0]).bg,
                        color: getMemberById(step.assignees[0]).text,
                      }}
                    >
                      {getMemberById(step.assignees[0]).initials}
                    </span>
                  )}
                </div>

                {isDone && <span className="proc-sidebar-tag-done">Done</span>}
                {isHeld && <span className="proc-sidebar-tag-held">Held</span>}
              </div>

              {isHeld && firstHold && (
                <div className="proc-sidebar-hold-preview">
                  <span>
                    ⚠️ {firstHold.reason} ·{" "}
                    {firstHold.taggedPeople?.[0]
                      ? getMemberById(firstHold.taggedPeople[0]).name
                      : "Devon H."}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="proc-sidebar-footer">
        <button
          type="button"
          className="proc-btn-sidebar-add-step"
          onClick={onAddStepClick || onOpenFullView}
        >
          + Add step
        </button>

        <button
          type="button"
          className="proc-link-open-full"
          onClick={onOpenFullView}
        >
          Open full view
        </button>
      </div>
    </div>
  );
}
