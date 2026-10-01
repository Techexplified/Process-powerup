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
  TrashIcon,
  UsersIcon,
} from "../lib/icons.jsx";
import AddStepDialog from "./AddStepDialog.jsx";
import HoldReasonDialog from "./HoldReasonDialog.jsx";

function formatDateShort(dateStr) {
  if (!dateStr) return "2026-10-08";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return dateStr;
  }
}

function cleanWorkflowDescription(desc, cardTitle) {
  if (!desc || desc.includes("cardlytics:") || desc.includes("tracked by Cardlytics")) {
    return "Mandatory verification workflow before triggering production deployment gate.";
  }
  return desc;
}

function cleanWorkflowTitle(title, cardTitle) {
  if (!title || title.includes("cardlytics:")) {
    return cardTitle ? `${cardTitle} Process` : "Deployment & Verification Process";
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
  const [showAddStepDialog, setShowAddStepDialog] = useState(false);
  const [holdingStep, setHoldingStep] = useState(null);
  const [reassignStep, setReassignStep] = useState(null);

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
      title: processData?.title || `${card.title} Process`,
      description:
        processData?.description ||
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

  // Delete Reason
  function handleDeleteHoldReason(stepId, reasonId) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        const nextReasons = (step.holdReasons || []).filter((r) => r.id !== reasonId);
        return {
          ...step,
          holdReasons: nextReasons,
          status: nextReasons.length === 0 ? "pending" : "held",
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
  const isEnabled = processData?.enabled !== false;
  const formattedDueDate = card.due || processData?.dueDate || "2026-10-10";
  const displayTitle = cleanWorkflowTitle(processData?.title, card.title);
  const displayDesc = cleanWorkflowDescription(processData?.description, card.title);

  return (
    <div className="proc-detail-view">
      {/* SCROLLABLE MAIN CONTENT */}
      <div className="proc-detail-scroll-area custom-slim-scrollbar">
        {/* 1. TOP NAV & ACTIONS BAR */}
        <div className="proc-top-nav-bar">
          {onBack ? (
            <button type="button" className="proc-btn-back-link" onClick={onBack}>
              ← Back to cards
            </button>
          ) : (
            <div className="proc-top-brand-label">
              <ProcessIcon width={14} height={14} />
              <span>PROCESSES</span>
            </div>
          )}

          <div className="proc-top-right-actions">
            <span className="proc-date-box-pill">
              <CalendarIcon width={12} height={12} />
              <span>{formattedDueDate}</span>
            </span>

            <button
              type="button"
              className={`proc-btn-enable-toggle ${isEnabled ? "enabled" : ""}`}
              onClick={handleToggleProcessEnable}
            >
              {isEnabled ? "✓ Process Enabled" : "+ Enable Process / Task"}
            </button>

            <button
              type="button"
              className="proc-btn-delete-card-process"
              onClick={handleToggleProcessEnable}
              title="Disable workflow"
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        </div>

        {/* 2. UNIFIED ACTIVE PROCESS & TELEMETRY CARD */}
        {isEnabled && (
          <div className="proc-active-process-card">
            <div className="proc-active-heading-row">
              <span className="proc-active-toggle-icon">
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                  <rect x="2" y="6" width="20" height="12" rx="6" />
                  <circle cx="16" cy="12" r="3.5" fill="#10b981" />
                </svg>
              </span>
              <h3 className="proc-active-process-title">{displayTitle}</h3>
              <span className="proc-tag-active">Active</span>
            </div>

            <p className="proc-active-process-desc">{displayDesc}</p>

            {/* Progress Breakdown Row */}
            <div className="proc-progress-stats-row">
              <div className="proc-progress-label-col">
                <span className="proc-progress-bold-txt">Progress: {stats.percent}%</span>
                <span className="proc-progress-muted-txt">
                  · {stats.done}/{stats.total} steps completed
                </span>
              </div>

              <div className="proc-progress-pills-col">
                {stats.held > 0 && (
                  <span className="proc-stat-badge stat-amber">
                    🟡 {stats.held} on hold
                  </span>
                )}
                {stats.pending > 0 && (
                  <span className="proc-stat-badge stat-red">
                    🔴 {stats.pending} pending
                  </span>
                )}
                {stats.done > 0 && (
                  <span className="proc-stat-badge stat-green">
                    🟢 {stats.done} done
                  </span>
                )}
              </div>
            </div>

            {/* Segmented Progress Track */}
            <div className="proc-segmented-progress-track">
              {steps.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className={`proc-track-segment ${
                    s.status === "done"
                      ? "seg-green"
                      : s.status === "held"
                      ? "seg-amber"
                      : "seg-gray"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

      {/* 4. STEP ITEMS LIST */}
      <div className="proc-steps-stack-container">
        {steps.map((step, idx) => {
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
            <div
              key={step.id}
              className={`proc-step-row-card ${
                isHeld ? "step-held-border" : isDone ? "step-done-border" : "step-pending-border"
              }`}
            >
              {/* Main Step Line */}
              <div className="proc-step-header-line">
                <div className="proc-step-header-left">
                  {/* Glowing Status Dot */}
                  <span
                    className={`proc-step-glow-dot ${
                      isDone ? "glow-green" : isHeld ? "glow-amber" : "glow-gray"
                    }`}
                  />

                  {/* Checkbox */}
                  <div
                    className={`proc-step-checkbox-box ${isDone ? "checked" : ""}`}
                    onClick={() => handleToggleStepDone(step.id)}
                    title="Toggle done"
                  >
                    {isDone && <CheckIcon width={12} height={12} />}
                  </div>

                  {/* Number & Name */}
                  <div className="proc-step-title-wrapper">
                    <span className="proc-step-idx">{idx + 1}.</span>
                    <span className={`proc-step-name-text ${isDone ? "done-strike" : ""}`}>
                      {step.name}
                    </span>
                    {isDone && <span className="proc-step-pill-done">Done</span>}
                    {isHeld && <span className="proc-step-pill-held">Held</span>}
                  </div>
                </div>

                {/* Right Step Actions: Hold, Avatar, Date, Delete */}
                <div className="proc-step-header-right">
                  {step.targetDate && (
                    <span className="proc-step-date-chip" title="Target Date">
                      <CalendarIcon width={11} height={11} />
                      <span>{step.targetDate}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    className={`proc-btn-step-hold-pill ${isHeld ? "is-held" : ""}`}
                    onClick={() => {
                      if (isHeld) {
                        handleResumeStep(step.id);
                      } else {
                        setHoldingStep(step);
                      }
                    }}
                    title={isHeld ? "Click to resume" : "Place on hold"}
                  >
                    <span className="proc-hold-circle-icon">⏸</span>
                    <span>{isHeld ? "Held" : "Hold"}</span>
                  </button>

                  <span
                    className="proc-step-avatar-circle"
                    style={{ background: member.bg, color: member.text }}
                    title={member.name}
                  >
                    {member.initials}
                  </span>

                  <button
                    type="button"
                    className="proc-btn-step-delete-icon"
                    onClick={() => handleDeleteStep(step.id)}
                    title="Delete step"
                  >
                    <TrashIcon width={13} height={13} />
                  </button>
                </div>
              </div>

              {/* Step Description */}
              {step.description && (
                <p className="proc-step-desc-text">{step.description}</p>
              )}

              {/* Embedded Hold Reason Container (Matching Reference Design 1) */}
              {isHeld && (
                <div className="proc-step-hold-reasons-box">
                  <div className="proc-hold-box-top-row">
                    <div className="proc-hold-badge-reason-left">
                      <span className="proc-hold-solid-badge">● HOLD</span>
                      <span className="proc-hold-main-text">
                        {primaryHoldReason?.reason ||
                          "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal."}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="proc-btn-hold-resume-ghost"
                      onClick={() => handleResumeStep(step.id)}
                    >
                      <PlayIcon width={10} height={10} />
                      <span>Resume</span>
                    </button>
                  </div>

                  <div className="proc-hold-box-bottom-row">
                    <span className="proc-assigned-hold-label">Assigned to Hold:</span>
                    <span className="proc-assigned-hold-member-pill">
                      <span
                        className="proc-assigned-avatar"
                        style={{ background: taggedMember.bg, color: taggedMember.text }}
                      >
                        {taggedMember.initials}
                      </span>
                      <span className="proc-assigned-name">{taggedMember.name}</span>
                    </span>

                    <button
                      type="button"
                      className="proc-btn-reassign-link-yellow"
                      onClick={() => setHoldingStep(step)}
                    >
                      Reassign / Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {/* 5. FIXED BOTTOM FOOTER */}
      <div className="proc-detail-bottom-bar">
        <button
          type="button"
          className="proc-btn-add-steps-primary"
          onClick={() => setShowAddStepDialog(true)}
        >
          <PlusIcon width={14} height={14} />
          <span>Add Steps</span>
        </button>

        <div className="proc-footer-telemetry-text">
          <span>{stats.total} Steps</span>
          <span>•</span>
          <span className="proc-foot-done">{stats.done} Completed</span>
          {stats.held > 0 && (
            <>
              <span>•</span>
              <span className="proc-foot-held">{stats.held} On Hold</span>
            </>
          )}
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

      {/* Reassign Dialog */}
      {reassignStep && (
        <div className="proc-dialog-backdrop" onClick={() => setReassignStep(null)}>
          <div className="proc-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="proc-dialog-header">
              <h3 className="proc-dialog-title">Reassign Unblocker</h3>
              <button
                type="button"
                className="proc-dialog-close-btn"
                onClick={() => setReassignStep(null)}
              >
                ✕
              </button>
            </div>
            <div className="proc-dialog-body">
              <div className="proc-reassign-members-grid">
                {getAllAvailableMembers().map((mem) => (
                  <div
                    key={mem.id}
                    className="proc-reassign-member-card"
                    onClick={() => handleReassignUnblocker(reassignStep.id, mem.id)}
                  >
                    <span
                      className="proc-reassign-avatar"
                      style={{ background: mem.bg, color: mem.text }}
                    >
                      {mem.initials}
                    </span>
                    <div>
                      <div className="proc-reassign-name">{mem.name}</div>
                      <div className="proc-reassign-role">{mem.role || "Member"}</div>
                    </div>
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



