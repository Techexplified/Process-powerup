import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  saveCardProcess,
  calculateProcessStats,
  getMemberById,
} from "../lib/processStore.js";
import { ProcessIcon, CheckIcon } from "../lib/icons.jsx";
import AddStepDialog from "./AddStepDialog.jsx";
import HoldReasonDialog from "./HoldReasonDialog.jsx";

export default function ProcessDetailView({
  card,
  onBack,
  onClose,
  t = null,
}) {
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddStepDialog, setShowAddStepDialog] = useState(false);
  const [holdingStep, setHoldingStep] = useState(null);
  const [activeStepMenu, setActiveStepMenu] = useState(null);
  const [reassignStepId, setReassignStepId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

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

  // Toggle Process Enable
  function handleToggleProcessEnable() {
    const nextEnabled = !processData?.enabled;
    const updated = {
      ...processData,
      enabled: nextEnabled,
      title: processData?.title || `${card.title} process`,
      description:
        processData?.description ||
        card.description ||
        "Mandatory verification workflow before triggering production deployment gate.",
      status: nextEnabled ? "Active" : "Draft",
      steps: processData?.steps?.length ? processData.steps : [],
    };
    updateAndPersist(updated);
  }

  // Add Step
  function handleAddStep(newStep) {
    const updated = {
      ...processData,
      steps: [...(processData.steps || []), newStep],
    };
    updateAndPersist(updated);
  }

  // Toggle Step Status (To do / Done / Held)
  function handleSetStepStatus(stepId, newStatus) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: newStatus,
        };
      }
      return step;
    });
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  // Submit Hold
  function handleSubmitHold(stepId, holdReasonObj) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: "held",
          holdReasons: [...(step.holdReasons || []), holdReasonObj],
        };
      }
      return step;
    });
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  // Resume Step
  function handleResumeStep(stepId) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        return {
          ...step,
          status: "pending",
        };
      }
      return step;
    });
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  // Delete Step
  function handleDeleteStep(stepId) {
    const updatedSteps = (processData.steps || []).filter((s) => s.id !== stepId);
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  if (loading) {
    return (
      <div className="proc-detail-loading">
        <div className="proc-spinner"></div>
        <span>Loading card process...</span>
      </div>
    );
  }

  // Disabled State
  if (!processData?.enabled) {
    return (
      <div className="proc-detail-container custom-slim-scrollbar">
        <div className="proc-detail-header-nav">
          <button type="button" className="proc-btn-back" onClick={onBack}>
            ← Back to all cards
          </button>
          <button type="button" className="proc-dialog-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="proc-disabled-hero-card">
          <div className="proc-disabled-hero-top">
            <div className="proc-hero-icon-box">
              <ProcessIcon width={22} height={22} />
            </div>
            <div className="proc-hero-titles">
              <h3 className="proc-hero-title">Process</h3>
              <p className="proc-hero-desc">Turn on to add steps to this card.</p>
            </div>
            <label className="proc-toggle-switch">
              <input
                type="checkbox"
                checked={false}
                onChange={handleToggleProcessEnable}
              />
              <span className="proc-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  const steps = processData.steps || [];
  const stats = calculateProcessStats(steps);

  return (
    <div className="proc-detail-container custom-slim-scrollbar">
      {/* 1. TOP HEADER */}
      <div className="proc-detail-header">
        <div className="proc-detail-header-left">
          {onBack && (
            <button
              type="button"
              className="proc-btn-back-icon"
              onClick={onBack}
              title="Back to all cards"
            >
              ←
            </button>
          )}

          <div className="proc-detail-app-icon">
            <ProcessIcon width={20} height={20} />
          </div>

          <div className="proc-detail-titles-col">
            <div className="proc-detail-title-row">
              <h2 className="proc-detail-main-title">
                {processData.title || card.title}
              </h2>
              <span className="proc-badge-active">Active</span>
            </div>
            <p className="proc-detail-desc">
              {processData.description ||
                "Mandatory verification workflow before triggering production deployment gate."}
            </p>
          </div>
        </div>

        <div className="proc-detail-header-right">
          {card.due && (
            <span className="proc-detail-due-pill">
              📅 {new Date(card.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          <button
            type="button"
            className="proc-btn-icon-options"
            onClick={handleToggleProcessEnable}
            title="Turn off Process on this card"
          >
            ⚙
          </button>
          <button
            type="button"
            className="proc-btn-icon-close"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. PROGRESS BAR & STATUS BREAKDOWN */}
      <div className="proc-detail-progress-section">
        <div className="proc-detail-progress-top">
          <div className="proc-progress-pct-col">
            <span className="proc-progress-big-pct">{stats.percent}%</span>
            <span className="proc-progress-sub-frac">
              {stats.done} of {stats.total} steps
            </span>
          </div>

          <div className="proc-progress-legend-row">
            <span className="proc-legend-item legend-done">
              <span className="proc-legend-dot dot-emerald"></span>
              <span>{stats.done} done</span>
            </span>
            <span className="proc-legend-item legend-held">
              <span className="proc-legend-dot dot-amber"></span>
              <span>{stats.held} on hold</span>
            </span>
            <span className="proc-legend-item legend-todo">
              <span className="proc-legend-dot dot-gray"></span>
              <span>{stats.pending} to do</span>
            </span>
          </div>
        </div>

        {/* Segmented multi-color progress track */}
        <div className="proc-segmented-track">
          {steps.map((s, i) => {
            const isDone = s.status === "done";
            const isHeld = s.status === "held";
            return (
              <div
                key={s.id || i}
                className={`proc-track-segment ${
                  isDone ? "seg-done" : isHeld ? "seg-held" : "seg-todo"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 3. STEP LIST */}
      <div className="proc-detail-steps-list">
        {steps.map((step, idx) => {
          const isDone = step.status === "done";
          const isHeld = step.status === "held";
          const isTodo = step.status === "pending" || !step.status;
          const holdReasons = step.holdReasons || [];
          const primaryHoldReason = holdReasons[0];

          return (
            <div
              key={step.id}
              className={`proc-step-item-card ${
                isDone ? "item-done" : isHeld ? "item-held" : "item-todo"
              }`}
            >
              <div className="proc-step-item-header">
                {/* Status Icon */}
                <div
                  className={`proc-step-status-icon ${
                    isDone ? "icon-done" : isHeld ? "icon-held" : "icon-todo"
                  }`}
                  onClick={() =>
                    handleSetStepStatus(step.id, isDone ? "pending" : "done")
                  }
                  title="Toggle status"
                >
                  {isDone ? (
                    <CheckIcon width={13} height={13} />
                  ) : isHeld ? (
                    <span>⏸</span>
                  ) : (
                    <span>○</span>
                  )}
                </div>

                {/* Step Title & Meta */}
                <div className="proc-step-content-col">
                  <h4 className={`proc-step-item-title ${isDone ? "title-done" : ""}`}>
                    {step.name}
                  </h4>

                  {step.description && !isDone && (
                    <p className="proc-step-item-desc">{step.description}</p>
                  )}

                  <div className="proc-step-meta-row">
                    {step.targetDate && (
                      <span className="proc-step-meta-date">
                        📅 {step.targetDate}
                      </span>
                    )}

                    {step.assignees && step.assignees.length > 0 && (
                      <div className="proc-step-avatar-bubbles">
                        {step.assignees.map((memId) => {
                          const member = getMemberById(memId);
                          return (
                            <span
                              key={memId}
                              className="proc-step-mini-avatar"
                              style={{ background: member.bg, color: member.text }}
                              title={member.name}
                            >
                              {member.initials}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {isHeld && holdReasons.length > 1 && (
                      <span className="proc-hold-count-badge">
                        {holdReasons.length} hold reasons
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Dropdown Button & Menu */}
                <div className="proc-step-right-actions">
                  {isDone ? (
                    <button
                      type="button"
                      className="proc-status-pill-btn pill-btn-done"
                      onClick={() => handleSetStepStatus(step.id, "pending")}
                    >
                      Done ▾
                    </button>
                  ) : isHeld ? (
                    <button
                      type="button"
                      className="proc-status-pill-btn pill-btn-held"
                      onClick={() => handleResumeStep(step.id)}
                    >
                      Held ▾
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="proc-status-pill-btn pill-btn-todo"
                      onClick={() => {
                        setHoldingStep(step);
                      }}
                    >
                      To do ▾
                    </button>
                  )}

                  <button
                    type="button"
                    className="proc-step-btn-more"
                    onClick={() => handleDeleteStep(step.id)}
                    title="Delete step"
                  >
                    🗑
                  </button>
                </div>
              </div>

              {/* Hold Reason Banner (When Step is Held) */}
              {isHeld && (
                <div className="proc-held-card-banner">
                  <div className="proc-held-banner-body">
                    <p className="proc-held-reason-text">
                      {primaryHoldReason?.reason ||
                        "Step placed on hold. Waiting for blocker resolution."}
                    </p>

                    <div className="proc-held-unblocker-row">
                      {primaryHoldReason?.taggedPeople &&
                      primaryHoldReason.taggedPeople.length > 0 ? (
                        primaryHoldReason.taggedPeople.map((id) => {
                          const mem = getMemberById(id);
                          return (
                            <span key={id} className="proc-unblocker-tag">
                              <span
                                className="proc-unblocker-tag-avatar"
                                style={{ background: mem.bg, color: mem.text }}
                              >
                                {mem.initials}
                              </span>
                              <span className="proc-unblocker-tag-name">
                                {mem.name}
                              </span>
                            </span>
                          );
                        })
                      ) : (
                        <span className="proc-unblocker-tag">
                          <span className="proc-unblocker-tag-avatar">DH</span>
                          <span className="proc-unblocker-tag-name">
                            Devon Hayes
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="proc-btn-resume-held"
                    onClick={() => handleResumeStep(step.id)}
                  >
                    ▶ Resume
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. BOTTOM ACTION BAR */}
      <div className="proc-detail-footer-bar">
        <button
          type="button"
          className="proc-btn-add-step-outline"
          onClick={() => setShowAddStepDialog(true)}
        >
          + Add step
        </button>

        <span className="proc-footer-step-counter">
          {stats.total} steps · {stats.done} completed
        </span>
      </div>

      {/* MODALS */}
      <AddStepDialog
        isOpen={showAddStepDialog}
        onClose={() => setShowAddStepDialog(false)}
        onAddStep={handleAddStep}
      />

      <HoldReasonDialog
        isOpen={Boolean(holdingStep)}
        step={holdingStep}
        onClose={() => setHoldingStep(null)}
        onSubmitHold={handleSubmitHold}
      />
    </div>
  );
}
