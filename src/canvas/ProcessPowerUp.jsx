import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  saveCardProcess,
  calculateProcessStats,
  getMemberById,
} from "../lib/processStore.js";
import { ProcessIcon, CheckIcon } from "../lib/icons.jsx";
import AddStepModal from "./AddStepModal.jsx";
import HoldModal from "./HoldModal.jsx";
import DeleteConfirmModal from "./DeleteConfirmModal.jsx";

export default function ProcessPowerUp({ cardId, cardTitle, t = null }) {
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'pending' | 'held' | 'done'

  // Modals state
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [holdingStep, setHoldingStep] = useState(null);
  const [isAdditionalHoldReason, setIsAdditionalHoldReason] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);

  // Load process for this specific card
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadCardProcess(cardId, t).then((data) => {
      if (isMounted) {
        setProcessData(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cardId, t]);

  // Persist helper
  function updateAndPersist(newData) {
    setProcessData(newData);
    saveCardProcess(cardId, newData, t);
  }

  // 1. Enable Process Power-Up for this card
  function handleEnableProcess() {
    const updated = {
      ...processData,
      enabled: true,
      title: processData?.title || `${cardTitle || "Card"} Workflow Process`,
      description:
        processData?.description ||
        "Mandatory verification workflow before triggering production deployment gate.",
      status: "Active",
      steps: processData?.steps?.length ? processData.steps : [],
    };
    updateAndPersist(updated);
  }

  // 2. Add a new step
  function handleAddStep(newStep) {
    const updated = {
      ...processData,
      steps: [...(processData.steps || []), newStep],
    };
    updateAndPersist(updated);
  }

  // 3. Toggle step completion (Pending <-> Done)
  function handleToggleDone(stepId) {
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

  // 4. Submit Hold (first or additional hold reason)
  function handleSubmitHold(stepId, holdReasonObj) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        const existingReasons = step.holdReasons || [];
        return {
          ...step,
          status: "held",
          holdReasons: [...existingReasons, holdReasonObj],
        };
      }
      return step;
    });

    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  // 5. Resume a held step (Held -> Pending)
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

  // 6. Remove an individual hold reason
  function handleRemoveHoldReason(stepId, reasonId) {
    const updatedSteps = (processData.steps || []).map((step) => {
      if (step.id === stepId) {
        const remainingReasons = (step.holdReasons || []).filter(
          (hr) => hr.id !== reasonId
        );
        return {
          ...step,
          // If no hold reasons remain, automatically switch back to pending
          status: remainingReasons.length === 0 ? "pending" : step.status,
          holdReasons: remainingReasons,
        };
      }
      return step;
    });

    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  // 7. Delete step
  function handleConfirmDeleteStep(stepId) {
    const updatedSteps = (processData.steps || []).filter((s) => s.id !== stepId);
    updateAndPersist({
      ...processData,
      steps: updatedSteps,
    });
  }

  if (loading) {
    return (
      <div className="proc-loading-state">
        <div className="proc-spinner"></div>
        <span>Loading Process Power-Up...</span>
      </div>
    );
  }

  // ==========================================
  // VIEW A: POWER-UP IS DISABLED FOR THIS CARD
  // ==========================================
  if (!processData?.enabled) {
    return (
      <div className="proc-powerup-section proc-section-disabled">
        <div className="proc-section-heading">
          <div className="proc-heading-title-row">
            <ProcessIcon width={17} height={17} className="proc-accent-icon" />
            <span className="proc-section-main-title">PROCESS</span>
          </div>
          <p className="proc-section-subtitle">
            Manage multi-step workflows, step assignees, hold reasons, dates.
          </p>
        </div>

        <div className="proc-disabled-box">
          <div className="proc-disabled-icon">⚡</div>
          <div className="proc-disabled-text-group">
            <h4 className="proc-disabled-title">Enable to add steps</h4>
            <p className="proc-disabled-desc">
              Track detailed operational workflows, approval gates, blockers, and step assignees for this card.
            </p>
          </div>
          <button
            type="button"
            className="proc-btn proc-btn-primary proc-enable-btn"
            onClick={handleEnableProcess}
          >
            Enable Process / Task
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: POWER-UP IS ENABLED FOR THIS CARD
  // ==========================================
  const steps = processData.steps || [];
  const stats = calculateProcessStats(steps);

  // Filter steps according to active tab
  const filteredSteps = steps.filter((step) => {
    if (filter === "pending") return step.status === "pending";
    if (filter === "held") return step.status === "held";
    if (filter === "done") return step.status === "done";
    return true;
  });

  return (
    <div className="proc-powerup-section proc-section-enabled">
      {/* 1. TOP PROCESS SECTION HEADER */}
      <div className="proc-section-heading">
        <div className="proc-heading-title-row">
          <ProcessIcon width={17} height={17} className="proc-accent-icon" />
          <span className="proc-section-main-title">PROCESS</span>
          <span className="proc-active-pill">Active</span>
        </div>
        <p className="proc-section-subtitle">
          Manage multi-step workflows, step assignees, hold reasons, dates.
        </p>
      </div>

      {/* 2. PROCESS HEADER CARD */}
      <div className="proc-process-card">
        <div className="proc-process-header-top">
          <div className="proc-process-title-group">
            <h3 className="proc-process-title">
              {processData.title || "Deployment & Verification Process"}
            </h3>
            <p className="proc-process-desc">
              {processData.description ||
                "Mandatory verification workflow before triggering production deployment gate."}
            </p>
          </div>

          <div className="proc-process-header-actions">
            <button
              type="button"
              className="proc-btn proc-btn-sm proc-btn-primary"
              onClick={() => setShowAddStepModal(true)}
            >
              + Add Steps
            </button>
          </div>
        </div>

        {/* Dynamic Progress & Metrics */}
        <div className="proc-metrics-row">
          <div className="proc-progress-summary">
            <div className="proc-progress-labels">
              <span className="proc-progress-pct">Progress: {stats.percent}%</span>
              <span className="proc-progress-fraction">
                {stats.done}/{stats.total} steps completed
              </span>
            </div>
            <div className="proc-progress-bar-track">
              <div
                className="proc-progress-bar-done"
                style={{ width: `${stats.percent}%` }}
                title={`${stats.done} Done`}
              />
              <div
                className="proc-progress-bar-held"
                style={{
                  width: `${stats.total > 0 ? (stats.held / stats.total) * 100 : 0}%`,
                }}
                title={`${stats.held} On Hold`}
              />
            </div>
          </div>

          {/* Dynamic Status Counters */}
          <div className="proc-status-counters">
            <span className="proc-counter-pill counter-held">
              {stats.held} on hold
            </span>
            <span className="proc-counter-pill counter-pending">
              {stats.pending} pending
            </span>
            <span className="proc-counter-pill counter-done">
              {stats.done} done
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="proc-filter-bar">
          <div className="proc-filter-group">
            <button
              type="button"
              className={`proc-filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All <span className="proc-tab-badge">{stats.total}</span>
            </button>
            <button
              type="button"
              className={`proc-filter-tab ${filter === "pending" ? "active" : ""}`}
              onClick={() => setFilter("pending")}
            >
              Pending <span className="proc-tab-badge">{stats.pending}</span>
            </button>
            <button
              type="button"
              className={`proc-filter-tab tab-held ${filter === "held" ? "active" : ""}`}
              onClick={() => setFilter("held")}
            >
              On Hold <span className="proc-tab-badge badge-held">{stats.held}</span>
            </button>
            <button
              type="button"
              className={`proc-filter-tab tab-done ${filter === "done" ? "active" : ""}`}
              onClick={() => setFilter("done")}
            >
              Done <span className="proc-tab-badge badge-done">{stats.done}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. STEPS LIST */}
      <div className="proc-steps-container">
        {filteredSteps.length === 0 ? (
          <div className="proc-steps-empty">
            {steps.length === 0 ? (
              <div className="proc-empty-content">
                <span className="proc-empty-icon">📝</span>
                <p className="proc-empty-title">No process steps added yet</p>
                <p className="proc-empty-desc">
                  Click "Add Steps" to create verification, review, and deployment checklist items.
                </p>
                <button
                  type="button"
                  className="proc-btn proc-btn-primary"
                  onClick={() => setShowAddStepModal(true)}
                >
                  + Add Steps
                </button>
              </div>
            ) : (
              <p className="proc-filter-empty-text">
                No steps found matching the "{filter}" filter.
              </p>
            )}
          </div>
        ) : (
          <div className="proc-steps-list">
            {filteredSteps.map((step, index) => {
              const isDone = step.status === "done";
              const isHeld = step.status === "held";
              const isPending = step.status === "pending";
              const holdReasonsList = step.holdReasons || [];

              return (
                <div
                  key={step.id}
                  className={`proc-step-row ${
                    isDone ? "step-done" : isHeld ? "step-held" : "step-pending"
                  }`}
                >
                  <div className="proc-step-main">
                    {/* Left: Checkbox Action */}
                    <button
                      type="button"
                      className={`proc-step-checkbox ${isDone ? "checked" : ""}`}
                      onClick={() => handleToggleDone(step.id)}
                      title={isDone ? "Mark as Incomplete" : "Mark as Done"}
                    >
                      {isDone && <CheckIcon width={13} height={13} />}
                    </button>

                    {/* Middle: Title, Description, Status Pill */}
                    <div className="proc-step-body">
                      <div className="proc-step-title-line">
                        <span className={`proc-step-name ${isDone ? "name-done" : ""}`}>
                          {step.name}
                        </span>
                        {isDone && (
                          <span className="proc-status-tag tag-done">
                            <CheckIcon width={11} height={11} /> Done
                          </span>
                        )}
                        {isHeld && (
                          <span className="proc-status-tag tag-held">
                            ⏸ Held
                          </span>
                        )}
                        {isPending && (
                          <span className="proc-status-tag tag-pending">
                            Pending
                          </span>
                        )}
                      </div>

                      {step.description && (
                        <p className="proc-step-description">{step.description}</p>
                      )}
                    </div>

                    {/* Right: Target Date, Assigned Person, Hold Action, Delete Action */}
                    <div className="proc-step-meta-actions">
                      {step.targetDate && (
                        <span className="proc-step-date-pill" title="Target Date">
                          📅 {step.targetDate}
                        </span>
                      )}

                      {/* Tagged / Assigned People */}
                      {step.assignees && step.assignees.length > 0 && (
                        <div className="proc-step-assignees-group">
                          {step.assignees.map((memId) => {
                            const member = getMemberById(memId);
                            return (
                              <span
                                key={memId}
                                className="proc-member-badge"
                                style={{ background: member.bg, color: member.text }}
                                title={`Assigned: ${member.name}`}
                              >
                                {member.initials}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Hold Action Button */}
                      {!isDone && (
                        <>
                          {isHeld ? (
                            <button
                              type="button"
                              className="proc-step-btn-resume"
                              onClick={() => handleResumeStep(step.id)}
                              title="Resume step from hold"
                            >
                              ▶ Resume
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="proc-step-btn-hold"
                              onClick={() => {
                                setHoldingStep(step);
                                setIsAdditionalHoldReason(false);
                              }}
                              title="Place step on hold"
                            >
                              Hold
                            </button>
                          )}
                        </>
                      )}

                      {/* Delete Step Action */}
                      <button
                        type="button"
                        className="proc-step-delete-btn"
                        onClick={() => setDeletingStep(step)}
                        title="Delete this step"
                        aria-label="Delete Step"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* 4. HOLD REASON SECTION (When Step is Held) */}
                  {isHeld && (
                    <div className="proc-step-hold-section">
                      <div className="proc-hold-section-header">
                        <div className="proc-hold-section-title">
                          <span className="proc-hold-icon">⚠️</span>
                          <span className="proc-hold-title-text">
                            Hold Reasons ({holdReasonsList.length})
                          </span>
                        </div>

                        <button
                          type="button"
                          className="proc-btn-add-more-hold"
                          onClick={() => {
                            setHoldingStep(step);
                            setIsAdditionalHoldReason(true);
                          }}
                        >
                          + Add more hold reason
                        </button>
                      </div>

                      {holdReasonsList.length > 0 ? (
                        <div className="proc-hold-reasons-list">
                          {holdReasonsList.map((hr, hrIndex) => (
                            <div key={hr.id || hrIndex} className="proc-hold-reason-card">
                              <div className="proc-hold-reason-top">
                                <span className="proc-hr-num">{hrIndex + 1}.</span>
                                <div className="proc-hr-content">
                                  <p className="proc-hr-text">{hr.reason}</p>
                                  {hr.taggedPeople && hr.taggedPeople.length > 0 && (
                                    <div className="proc-hr-tagged-row">
                                      <span className="proc-hr-tagged-label">Tagged:</span>
                                      {hr.taggedPeople.map((memId) => {
                                        const member = getMemberById(memId);
                                        return (
                                          <span
                                            key={memId}
                                            className="proc-hr-member-tag"
                                            title={member.name}
                                          >
                                            <span
                                              className="proc-hr-mini-avatar"
                                              style={{ background: member.bg, color: member.text }}
                                            >
                                              {member.initials}
                                            </span>
                                            <span className="proc-hr-member-name">
                                              {member.name}
                                            </span>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="proc-hr-remove-btn"
                                  onClick={() => handleRemoveHoldReason(step.id, hr.id)}
                                  title="Remove this hold reason"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="proc-hold-reason-card">
                          <p className="proc-hr-text">
                            Step placed on hold. Waiting for blocker resolution.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. MODALS */}
      {/* Add Step Modal */}
      <AddStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onAddStep={handleAddStep}
      />

      {/* Hold Reason Modal */}
      <HoldModal
        isOpen={Boolean(holdingStep)}
        step={holdingStep}
        isAdditionalReason={isAdditionalHoldReason}
        onClose={() => {
          setHoldingStep(null);
          setIsAdditionalHoldReason(false);
        }}
        onSubmitHold={handleSubmitHold}
      />

      {/* Delete Step Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingStep)}
        step={deletingStep}
        onClose={() => setDeletingStep(null)}
        onConfirmDelete={handleConfirmDeleteStep}
      />
    </div>
  );
}
