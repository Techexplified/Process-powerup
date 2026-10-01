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
  CloseIcon,
  PlayIcon,
  PlusIcon,
} from "../lib/icons.jsx";
import AddStepDialog from "./AddStepDialog.jsx";
import HoldReasonDialog from "./HoldReasonDialog.jsx";

function formatDateShort(dateStr) {
  if (!dateStr) return "Oct 08";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr) {
  if (!dateStr) return "Oct 10, 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function cleanWorkflowDescription(desc, cardTitle) {
  if (!desc || desc.includes("cardlytics:") || desc.includes("tracked by Cardlytics")) {
    return `Mandatory verification and execution workflow for ${cardTitle || "this card"}.`;
  }
  return desc;
}

function cleanWorkflowTitle(title, cardTitle) {
  if (!title || title.includes("cardlytics:")) {
    return cardTitle ? `${cardTitle} Workflow` : "Deployment & Verification Process";
  }
  return title;
}

export default function ProcessDetailView({
  card,
  onBack,
  onClose,
  t = null,
}) {
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAddStepDialog, setShowAddStepDialog] = useState(false);
  const [holdingStep, setHoldingStep] = useState(null);

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

  // Add Step
  function handleAddStep(newStep) {
    const updated = {
      ...processData,
      steps: [...(processData.steps || []), newStep],
    };
    updateAndPersist(updated);
  }

  // Toggle Done checkbox
  function handleToggleStepDone(stepId) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        const nextStatus = step.status === "done" ? "pending" : "done";
        return {
          ...step,
          status: nextStatus,
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
        <span>Loading workflow...</span>
      </div>
    );
  }

  const steps = processData?.steps || [];
  const stats = calculateProcessStats(steps);
  const formattedDueDate = formatDateFull(card.due || processData?.dueDate || "2026-10-10");
  const displayTitle = cleanWorkflowTitle(processData?.title, card.title);
  const displayDesc = cleanWorkflowDescription(processData?.description, card.title);

  const filteredSteps = steps.filter((step) => {
    if (activeFilter === "pending") return step.status === "pending" || !step.status;
    if (activeFilter === "held") return step.status === "held";
    if (activeFilter === "done") return step.status === "done";
    return true;
  });

  return (
    <div className="proc-modal-shell custom-slim-scrollbar">
      {/* 1. TOP NAVIGATION / BREADCRUMB (Clean, No Duplicate Header) */}
      {onBack && (
        <div className="proc-modal-top-nav">
          <button type="button" className="proc-btn-back-clean" onClick={onBack}>
            ← Back to cards
          </button>
        </div>
      )}

      {/* 2. PROCESS HERO INFO BAR */}
      <div className="proc-hero-process-bar">
        <div className="proc-hero-icon-box">
          <ProcessIcon width={18} height={18} />
        </div>

        <div className="proc-hero-details">
          <div className="proc-hero-title-line">
            <h2 className="proc-hero-name">{displayTitle}</h2>
            <span className="proc-badge-active-pill">Active</span>
          </div>
          <p className="proc-hero-desc">{displayDesc}</p>
        </div>

        <div className="proc-hero-due-pill">
          <CalendarIcon width={13} height={13} />
          <span>{formattedDueDate}</span>
        </div>
      </div>

      {/* 3. PROGRESS & FILTER TABS ROW */}
      <div className="proc-progress-filter-row">
        <div className="proc-progress-left-side">
          <div className="proc-multi-segmented-track">
            {steps.length > 0 ? (
              steps.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className={`proc-track-seg ${
                    s.status === "done"
                      ? "seg-done"
                      : s.status === "held"
                      ? "seg-held"
                      : "seg-todo"
                  }`}
                />
              ))
            ) : (
              <div className="proc-track-seg seg-todo" style={{ width: "100%" }} />
            )}
          </div>
          <span className="proc-progress-count-text">
            {stats.done}/{stats.total} Completed ({stats.percent}%)
          </span>
        </div>

        <div className="proc-filter-pills-wrap">
          <button
            type="button"
            className={`proc-tab-filter-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All <span className="proc-tab-count">{stats.total}</span>
          </button>
          <button
            type="button"
            className={`proc-tab-filter-btn ${activeFilter === "pending" ? "active" : ""}`}
            onClick={() => setActiveFilter("pending")}
          >
            Pending <span className="proc-tab-count">{stats.pending}</span>
          </button>
          <button
            type="button"
            className={`proc-tab-filter-btn tab-held ${activeFilter === "held" ? "active" : ""}`}
            onClick={() => setActiveFilter("held")}
          >
            On Hold <span className="proc-tab-count count-held">{stats.held}</span>
          </button>
          <button
            type="button"
            className={`proc-tab-filter-btn tab-done ${activeFilter === "done" ? "active" : ""}`}
            onClick={() => setActiveFilter("done")}
          >
            Done <span className="proc-tab-count count-done">{stats.done}</span>
          </button>
        </div>
      </div>

      {/* 4. STEP CARDS STACK */}
      <div className="proc-step-cards-stack">
        {filteredSteps.length === 0 ? (
          <div className="proc-steps-empty-state">
            <p>No steps in this filter.</p>
          </div>
        ) : (
          filteredSteps.map((step, idx) => {
            const isDone = step.status === "done";
            const isHeld = step.status === "held";
            const holdReasons = step.holdReasons || [];
            const primaryHoldReason = holdReasons[0];
            const assigneeId = step.assignees?.[0] || "SC";
            const member = getMemberById(assigneeId);
            const taggedMember = primaryHoldReason?.taggedPeople?.[0]
              ? getMemberById(primaryHoldReason.taggedPeople[0])
              : getMemberById("DH");

            return (
              <div key={step.id} className="proc-step-card-item">
                {/* Step Top Row */}
                <div className="proc-step-top-line">
                  <div className="proc-step-left-heading">
                    <div
                      className={`proc-step-square-check ${isDone ? "checked" : ""}`}
                      onClick={() => handleToggleStepDone(step.id)}
                      title="Toggle done"
                    >
                      {isDone && <CheckIcon width={12} height={12} />}
                    </div>

                    <div className="proc-step-title-group">
                      <span className="proc-step-num-prefix">{idx + 1}.</span>
                      <span className={`proc-step-title-text ${isDone ? "done" : ""}`}>
                        {step.name}
                      </span>
                      {isDone && <span className="proc-step-pill-done">Done</span>}
                      {isHeld && <span className="proc-step-pill-held">On Hold</span>}
                    </div>
                  </div>

                  <div className="proc-step-right-meta">
                    {step.targetDate && (
                      <div className="proc-step-date-tag">
                        <CalendarIcon width={11} height={11} />
                        <span>{formatDateShort(step.targetDate)}</span>
                      </div>
                    )}

                    <span
                      className="proc-step-avatar-dot"
                      style={{ background: member.bg, color: member.text }}
                      title={member.name}
                    >
                      {member.initials}
                    </span>

                    {isHeld ? (
                      <button
                        type="button"
                        className="proc-btn-held-pill-tag"
                        onClick={() => handleResumeStep(step.id)}
                        title="Click to resume"
                      >
                        ⏸ Held
                      </button>
                    ) : !isDone ? (
                      <button
                        type="button"
                        className="proc-btn-hold-ghost-tag"
                        onClick={() => setHoldingStep(step)}
                      >
                        Hold
                      </button>
                    ) : null}

                    <button
                      type="button"
                      className="proc-btn-step-delete-clean"
                      onClick={() => handleDeleteStep(step.id)}
                      title="Delete step"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Step Description Line (if any) */}
                {step.description && (
                  <p className="proc-step-desc-text">{step.description}</p>
                )}

                {/* Embedded Hold Reason Banner */}
                {isHeld && primaryHoldReason && (
                  <div className="proc-embedded-hold-banner">
                    <div className="proc-hold-banner-left">
                      <span className="proc-hold-warning-label">⚠ HOLD REASON</span>
                      <span className="proc-hold-reason-msg" title={primaryHoldReason.reason}>
                        {primaryHoldReason.reason}
                      </span>
                    </div>

                    <div className="proc-hold-banner-right">
                      <span className="proc-tagged-person-txt">
                        Tagged: {taggedMember.name}
                      </span>
                      <button
                        type="button"
                        className="proc-btn-resume-play"
                        onClick={() => handleResumeStep(step.id)}
                      >
                        <PlayIcon width={10} height={10} />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 5. BOTTOM FOOTER BAR */}
      <div className="proc-modal-footer-bar">
        <button
          type="button"
          className="proc-btn-add-step-primary"
          onClick={() => setShowAddStepDialog(true)}
        >
          <PlusIcon width={13} height={13} />
          <span>Add Step</span>
        </button>

        <div className="proc-footer-summary-indicators">
          <span className="summary-total">{stats.total} Steps</span>
          <span className="summary-dot">•</span>
          <span className="summary-completed">{stats.done} Completed</span>
          <span className="summary-dot">•</span>
          <span className="summary-on-hold">{stats.held} On Hold</span>
        </div>
      </div>

      {/* DIALOGS */}
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


