import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  saveCardProcess,
  calculateProcessStats,
  getMemberById,
  getAllAvailableMembers,
} from "../lib/processStore.js";
import {
  ProcessIcon,
  CheckIcon,
  CalendarIcon,
  MoreHorizontalIcon,
  ChevronDownIcon,
  CloseIcon,
  PlayIcon,
  PlusIcon,
} from "../lib/icons.jsx";
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
  const [activeStepMenuId, setActiveStepMenuId] = useState(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [expandedHoldStepId, setExpandedHoldStepId] = useState(null);
  const [reassignStep, setReassignStep] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadCardProcess(card.id, t, card.title, card.description).then((data) => {
      if (isMounted) {
        setProcessData(data);
        // Default expand first held step if any
        const firstHeld = data?.steps?.find((s) => s.status === "held");
        if (firstHeld) {
          setExpandedHoldStepId(firstHeld.id);
        }
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

  // Set Step Status
  function handleSetStepStatus(stepId, newStatus) {
    setActiveStatusMenuId(null);
    if (newStatus === "held") {
      const stepObj = (processData.steps || []).find((s) => s.id === stepId);
      if (stepObj) setHoldingStep(stepObj);
      return;
    }

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
    setExpandedHoldStepId(stepId);
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

  // Reassign Step Unblocker
  function handleReassignUnblocker(stepId, newMemberId) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId && step.holdReasons?.length > 0) {
        const updatedReasons = [...step.holdReasons];
        updatedReasons[0] = {
          ...updatedReasons[0],
          taggedPeople: [newMemberId],
        };
        return {
          ...step,
          holdReasons: updatedReasons,
        };
      }
      return step;
    });
    setReassignStep(null);
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  // Delete Step
  function handleDeleteStep(stepId) {
    setActiveStepMenuId(null);
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
        <span>Loading workflow...</span>
      </div>
    );
  }

  // Disabled State
  if (!processData?.enabled) {
    return (
      <div className="proc-detail-view custom-slim-scrollbar">
        <div className="proc-detail-header-nav">
          {onBack && (
            <button type="button" className="proc-btn-back" onClick={onBack}>
              ← Back to all cards
            </button>
          )}
          {onClose && (
            <button type="button" className="proc-dialog-close" onClick={onClose}>
              <CloseIcon width={14} height={14} />
            </button>
          )}
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
  const formattedDueDate = card.due
    ? new Date(card.due).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : processData.dueDate
    ? new Date(processData.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Oct 10";

  return (
    <div className="proc-detail-view custom-slim-scrollbar">
      {/* 1. HEADER */}
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
            <ProcessIcon width={18} height={18} />
          </div>

          <div className="proc-detail-titles-col">
            <div className="proc-detail-title-row">
              <h2 className="proc-detail-main-title">
                {processData.title || `${card.title} process`}
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
          <span className="proc-target-date-chip">
            <CalendarIcon width={12} height={12} className="proc-chip-icon" />
            <span>{formattedDueDate}</span>
          </span>

          <div className="proc-overflow-menu-wrapper">
            <button
              type="button"
              className="proc-btn-icon-options"
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              title="Options"
            >
              <MoreHorizontalIcon width={16} height={16} />
            </button>

            {showHeaderMenu && (
              <div className="proc-header-dropdown-menu">
                <div
                  className="proc-dropdown-item"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    handleToggleProcessEnable();
                  }}
                >
                  Turn off process
                </div>
                <div
                  className="proc-dropdown-item proc-item-danger"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    updateAndPersist({ ...processData, steps: [] });
                  }}
                >
                  Clear all steps
                </div>
              </div>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              className="proc-btn-icon-close"
              onClick={onClose}
              title="Close"
            >
              <CloseIcon width={14} height={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. PROGRESS AREA ("25%  ·  1 of 4 steps" + Segmented Bar + Legend) */}
      <div className="proc-detail-progress-section">
        <div className="proc-detail-progress-top">
          <div className="proc-progress-pct-row">
            <span className="proc-progress-big-pct">{stats.percent}%</span>
            <span className="proc-progress-dot-sep">·</span>
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

        {/* Segmented Bar (one segment per step) */}
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
        {steps.map((step) => {
          const isDone = step.status === "done";
          const isHeld = step.status === "held";
          const isPending = step.status === "pending" || !step.status;
          const holdReasons = step.holdReasons || [];
          const primaryHoldReason = holdReasons[0];
          const isHoldExpanded = isHeld && expandedHoldStepId === step.id;

          const taggedMember = primaryHoldReason?.taggedPeople?.[0]
            ? getMemberById(primaryHoldReason.taggedPeople[0])
            : getMemberById("DH");

          return (
            <div
              key={step.id}
              className={`proc-step-item-card ${
                isDone ? "item-done" : isHeld ? "item-held" : "item-todo"
              }`}
            >
              <div className="proc-step-item-header">
                {/* Status Indicator Glyph */}
                <div
                  className={`proc-step-status-icon ${
                    isDone ? "icon-done" : isHeld ? "icon-held" : "icon-todo"
                  }`}
                  onClick={() =>
                    handleSetStepStatus(step.id, isDone ? "pending" : "done")
                  }
                  title="Toggle done"
                >
                  {isDone ? (
                    <CheckIcon width={13} height={13} />
                  ) : isHeld ? (
                    <span className="proc-held-pause-glyph">⏸</span>
                  ) : (
                    <span className="proc-todo-circle-glyph">○</span>
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
                        <CalendarIcon width={11} height={11} />
                        <span>{step.targetDate}</span>
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

                    {/* Collapsed Hold Reason Chip (Expands on click) */}
                    {isHeld && !isHoldExpanded && (
                      <button
                        type="button"
                        className="proc-hold-reason-chip-btn"
                        onClick={() => setExpandedHoldStepId(step.id)}
                      >
                        {holdReasons.length > 1
                          ? `${holdReasons.length} hold reasons`
                          : "1 hold reason"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Dropdown Pill & Overflow Menu */}
                <div className="proc-step-right-actions">
                  <div className="proc-status-dropdown-wrapper">
                    <button
                      type="button"
                      className={`proc-status-pill-select ${
                        isDone
                          ? "status-done"
                          : isHeld
                          ? "status-held"
                          : "status-todo"
                      }`}
                      onClick={() =>
                        setActiveStatusMenuId(
                          activeStatusMenuId === step.id ? null : step.id
                        )
                      }
                    >
                      <span>{isDone ? "Done" : isHeld ? "Held" : "To do"}</span>
                      <ChevronDownIcon width={10} height={10} />
                    </button>

                    {activeStatusMenuId === step.id && (
                      <div className="proc-status-menu-dropdown">
                        <div
                          className={`proc-status-menu-item ${isPending ? "selected" : ""}`}
                          onClick={() => handleSetStepStatus(step.id, "pending")}
                        >
                          To do
                        </div>
                        <div
                          className="proc-status-menu-item"
                          onClick={() => handleSetStepStatus(step.id, "in_progress")}
                        >
                          In progress
                        </div>
                        <div
                          className={`proc-status-menu-item ${isHeld ? "selected" : ""}`}
                          onClick={() => handleSetStepStatus(step.id, "held")}
                        >
                          Held
                        </div>
                        <div
                          className={`proc-status-menu-item ${isDone ? "selected" : ""}`}
                          onClick={() => handleSetStepStatus(step.id, "done")}
                        >
                          Done
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Overflow Menu ("...") */}
                  <div className="proc-step-overflow-wrapper">
                    <button
                      type="button"
                      className="proc-step-btn-more"
                      onClick={() =>
                        setActiveStepMenuId(
                          activeStepMenuId === step.id ? null : step.id
                        )
                      }
                      title="More options"
                    >
                      <MoreHorizontalIcon width={15} height={15} />
                    </button>

                    {activeStepMenuId === step.id && (
                      <div className="proc-step-dropdown-menu">
                        <div
                          className="proc-dropdown-item proc-item-danger"
                          onClick={() => handleDeleteStep(step.id)}
                        >
                          Delete step
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Hold Reason Banner */}
              {isHoldExpanded && (
                <div className="proc-held-card-banner">
                  <div className="proc-held-banner-body">
                    <p className="proc-held-reason-text">
                      {primaryHoldReason?.reason ||
                        "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal."}
                    </p>

                    <div className="proc-held-unblocker-row">
                      <span
                        className="proc-unblocker-avatar"
                        style={{ background: taggedMember.bg, color: taggedMember.text }}
                      >
                        {taggedMember.initials}
                      </span>
                      <span className="proc-unblocker-name">
                        {taggedMember.name}
                      </span>
                      <span className="proc-unblocker-sep">·</span>
                      <button
                        type="button"
                        className="proc-btn-reassign"
                        onClick={() => setReassignStep(step)}
                      >
                        Reassign
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="proc-btn-resume-held"
                    onClick={() => handleResumeStep(step.id)}
                  >
                    <PlayIcon width={10} height={10} className="proc-resume-icon" />
                    <span>Resume</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. STICKY FOOTER */}
      <div className="proc-detail-footer-bar">
        <button
          type="button"
          className="proc-btn-add-step-secondary"
          onClick={() => setShowAddStepDialog(true)}
        >
          <PlusIcon width={13} height={13} />
          <span>Add step</span>
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

      {/* Reassign Dialog */}
      {reassignStep && (
        <div className="proc-dialog-backdrop" onClick={() => setReassignStep(null)}>
          <div className="proc-dialog-window" onClick={(e) => e.stopPropagation()}>
            <div className="proc-dialog-header">
              <h3 className="proc-dialog-title">Reassign unblocker</h3>
              <button
                type="button"
                className="proc-dialog-close"
                onClick={() => setReassignStep(null)}
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>
            <div className="proc-dialog-body">
              <p className="proc-reassign-sub">
                Select team member responsible for unblocking this step:
              </p>
              <div className="proc-members-picker-list">
                {getAllAvailableMembers().map((mem) => (
                  <div
                    key={mem.id}
                    className="proc-member-select-row"
                    onClick={() => handleReassignUnblocker(reassignStep.id, mem.id)}
                  >
                    <span
                      className="proc-member-picker-avatar"
                      style={{ background: mem.bg, color: mem.text }}
                    >
                      {mem.initials}
                    </span>
                    <span className="proc-member-picker-name">{mem.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
