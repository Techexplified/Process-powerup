import React, { useState } from "react";
import "./canvas.css";
import { ProcessIcon } from "../lib/icons.jsx";

export default function CanvasApp({ t }) {
  // State for hardcoded workflow
  const [processEnabled, setProcessEnabled] = useState(true);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [newStepDate, setNewStepDate] = useState("2026-10-15");
  const [newStepAssignee, setNewStepAssignee] = useState("SC");

  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "Audit OAuth2 token exchange endpoints for rate-limiting vulnerability",
      description: "Ensure token endpoints are protected against brute force attempts.",
      status: "done", // done | held | pending
      dueDate: "2026-10-02",
      assignee: { initials: "SC", name: "Sarah Connor", color: "sc" },
      holdReason: null,
      holdReasonsList: [],
    },
    {
      id: 2,
      title: "Verify third-party SMS verification provider API latency under 200ms",
      description: "Run benchmark against vendor staging webhook.",
      status: "held",
      dueDate: "2026-10-08",
      assignee: { initials: "AR", name: "Alex Rivera", color: "ar" },
      holdReason: {
        text: "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal.",
        tagged: { initials: "DH", name: "Devon Hayes" },
      },
      holdReasonsList: [
        {
          id: 1,
          text: "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal.",
          tagged: { initials: "DH", name: "Devon Hayes" },
        },
      ],
    },
    {
      id: 3,
      title: "Execute cross-browser Cypress regression suite on Chrome, Firefox, Safari",
      description: "Verify checkout and login flows on all major desktop browsers.",
      status: "held",
      dueDate: "2026-10-10",
      assignee: { initials: "ER", name: "Elena Rossi", color: "er" },
      holdReason: {
        text: "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal.",
        tagged: { initials: "DH", name: "Devon Hayes" },
      },
      holdReasonsList: [
        {
          id: 1,
          text: "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal.",
          tagged: { initials: "DH", name: "Devon Hayes" },
        },
        {
          id: 2,
          text: "Security certificate renewal pending on staging cluster.",
          tagged: { initials: "SC", name: "Sarah Connor" },
        },
      ],
    },
    {
      id: 4,
      title: "Final security sanity test & production container deployment",
      description: "Verify production rollout readiness with release manager.",
      status: "pending",
      dueDate: "2026-10-12",
      assignee: { initials: "ER", name: "Elena Rossi", color: "er" },
      holdReason: null,
      holdReasonsList: [],
    },
  ]);

  // Calculations for progress & counts
  const totalSteps = steps.length;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const heldCount = steps.filter((s) => s.status === "held").length;
  const pendingCount = steps.filter((s) => s.status === "pending").length;
  const progressPercent = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;
  const heldPercent = totalSteps > 0 ? Math.round((heldCount / totalSteps) * 100) : 0;

  // Toggle step complete (done <-> pending)
  function toggleStepStatus(id) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: s.status === "done" ? "pending" : "done",
          };
        }
        return s;
      })
    );
  }

  // Toggle step hold
  function toggleStepHold(id) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.status === "held") {
            return { ...s, status: "pending" };
          }
          return {
            ...s,
            status: "held",
            holdReason: s.holdReason || {
              text: "Waiting for dependency verification / reviewer approval.",
              tagged: { initials: "DH", name: "Devon Hayes" },
            },
          };
        }
        return s;
      })
    );
  }

  // Delete step
  function handleDeleteStep(id) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  // Add new step
  function handleAddStepSubmit(e) {
    e.preventDefault();
    if (!newStepName.trim()) return;

    const newStep = {
      id: Date.now(),
      title: newStepName.trim(),
      description: newStepDesc.trim() || "Multi-step workflow task item.",
      status: "pending",
      dueDate: newStepDate,
      assignee:
        newStepAssignee === "SC"
          ? { initials: "SC", name: "Sarah Connor", color: "sc" }
          : newStepAssignee === "AR"
          ? { initials: "AR", name: "Alex Rivera", color: "ar" }
          : { initials: "ER", name: "Elena Rossi", color: "er" },
      holdReason: null,
      holdReasonsList: [],
    };

    setSteps((prev) => [...prev, newStep]);
    setNewStepName("");
    setNewStepDesc("");
    setShowAddStep(false);
  }

  return (
    <div className="proc-viewport-layout">
      {/* 1. FIXED TOP HEADER & SUMMARY */}
      <header className="proc-fixed-top">
        {/* Brand Bar */}
        <div className="proc-header-bar">
          <div className="proc-header-left">
            <div className="proc-brand-badge">
              <ProcessIcon width={19} height={19} />
            </div>
            <div>
              <div className="proc-title-row">
                <h1 className="proc-title">PROCESSES</h1>
                <span className="proc-powerup-tag">Power-Up</span>
              </div>
              <p className="proc-subtitle">
                Manage multi-step workflows, step assignees, hold reasons, and dates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProcessEnabled(!processEnabled)}
            className={`proc-btn-enable ${processEnabled ? "active" : ""}`}
          >
            {processEnabled ? "✓ Process Active" : "+ Enable Process / Task"}
          </button>
        </div>

        {processEnabled && (
          <div className="proc-summary-card">
            {/* Process Workflow Banner */}
            <div className="proc-banner">
              <div className="proc-banner-left">
                <div className="proc-toggle-circle">
                  <div className="proc-toggle-inner-dot"></div>
                </div>
                <div className="proc-banner-text-group">
                  <div className="proc-banner-title-row">
                    <h2 className="proc-banner-title">Deployment & Verification Process</h2>
                    <span className="proc-status-active">Active</span>
                  </div>
                  <p className="proc-banner-desc">
                    Mandatory verification workflow before triggering production deployment gate.
                  </p>
                </div>
              </div>

              <div className="proc-banner-right">
                <div className="proc-date-pill">
                  <span className="proc-calendar-icon">📅</span>
                  <span>2026-10-10</span>
                </div>
                <button type="button" className="proc-icon-btn proc-trash-btn" title="Delete Process">
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Label & Status Chips */}
            <div className="proc-progress-summary">
              <div className="proc-progress-label">
                <strong>Progress: {progressPercent}%</strong>
                <span className="proc-progress-sub">
                  {doneCount}/{totalSteps} steps completed
                </span>
              </div>

              <div className="proc-status-chips">
                <span className="proc-chip chip-hold">
                  <span className="dot dot-amber"></span> {heldCount} on hold
                </span>
                <span className="proc-chip chip-pending">
                  <span className="dot dot-pink"></span> {pendingCount} pending
                </span>
                <span className="proc-chip chip-done">
                  <span className="dot dot-emerald"></span> {doneCount} done
                </span>
              </div>
            </div>

            {/* Segmented Dual-tone Progress Bar */}
            <div className="proc-progress-bar-track">
              <div
                className="proc-bar-done"
                style={{ width: `${progressPercent}%` }}
                title={`${doneCount} Done`}
              ></div>
              <div
                className="proc-bar-held"
                style={{ width: `${heldPercent}%` }}
                title={`${heldCount} On Hold`}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* 2. SCROLLABLE MIDDLE STEPS LIST */}
      {processEnabled && (
        <main className="proc-scrollable-body custom-slim-scrollbar">
          <div className="proc-steps-list">
            {steps.map((step, index) => {
              const isDone = step.status === "done";
              const isHeld = step.status === "held";

              return (
                <div key={step.id} className={`proc-step-item ${isHeld ? "step-is-held" : ""}`}>
                  <div className="proc-step-main-row">
                    {/* Status Indicator Dot */}
                    <div className="proc-indicator-col">
                      <span
                        className={`proc-indicator-dot ${
                          isDone ? "dot-emerald" : isHeld ? "dot-amber" : "dot-gray"
                        }`}
                      ></span>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`proc-checkbox ${isDone ? "checked" : ""}`}
                      onClick={() => toggleStepStatus(step.id)}
                    >
                      {isDone && (
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Step Title & Details */}
                    <div className="proc-step-content">
                      <div className="proc-step-title-line">
                        <span className={`proc-step-title ${isDone ? "strikethrough" : ""}`}>
                          {index + 1}. {step.title}
                        </span>
                        {isDone && <span className="proc-step-tag tag-done">Done</span>}
                        {isHeld && <span className="proc-step-tag tag-held">Held</span>}
                      </div>

                      {step.description && (
                        <p className="proc-step-desc">{step.description}</p>
                      )}

                      {/* Meta pills: Due Date & Assignee */}
                      <div className="proc-step-meta-row">
                        {step.dueDate && (
                          <span className="proc-meta-pill date-pill">
                            <span>📅</span> {step.dueDate}
                          </span>
                        )}
                        {step.assignee && (
                          <span className={`proc-meta-pill assignee-pill pill-${step.assignee.color || "sc"}`}>
                            {step.assignee.initials}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions: Hold Button & Trash */}
                    <div className="proc-step-actions">
                      <button
                        type="button"
                        onClick={() => toggleStepHold(step.id)}
                        className={`proc-btn-hold ${isHeld ? "is-held" : ""}`}
                      >
                        <span className="hold-icon">⏸</span>
                        <span>{isHeld ? "Held" : "Hold"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="proc-icon-btn proc-trash-btn"
                        title="Delete Step"
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Hold Reason Box */}
                  {isHeld && (
                    <div className="proc-hold-details-box">
                      <div className="proc-hold-top">
                        <div className="proc-hold-reason-line">
                          <span className="proc-hold-badge">
                            <span className="hold-dot">●</span> HOLD
                          </span>
                          <span className="proc-hold-text">
                            {step.holdReason?.text || "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal."}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleStepHold(step.id)}
                          className="proc-btn-resume"
                        >
                          ▶ Resume
                        </button>
                      </div>

                      <div className="proc-hold-bottom">
                        <span className="proc-hold-assigned-label">Assigned to Hold:</span>
                        <span className="proc-hold-person-pill">
                          <span className="hold-person-avatar">
                            {step.holdReason?.tagged?.initials || "DH"}
                          </span>
                          <span>{step.holdReason?.tagged?.name || "Devon Hayes"}</span>
                        </span>

                        <button type="button" className="proc-hold-edit-link">
                          Reassign / Edit
                        </button>
                      </div>

                      {/* Multi-Hold List */}
                      {step.holdReasonsList && step.holdReasonsList.length > 1 && (
                        <div className="proc-multi-hold-list">
                          <div className="proc-multi-hold-header">
                            <span>ⓘ Hold Reasons ({step.holdReasonsList.length}):</span>
                            <button type="button" className="proc-add-more-hold-link">
                              + Add more hold reason
                            </button>
                          </div>
                          {step.holdReasonsList.map((hr, hrIdx) => (
                            <div key={hr.id || hrIdx} className="proc-sub-hold-item">
                              <span>#{hrIdx + 1} {hr.text}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span className="tagged-small">
                                  Tagged: <strong style={{ color: "#38bdf8" }}>{hr.tagged?.name}</strong>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline Add Step Form if opened */}
          {showAddStep && (
            <form onSubmit={handleAddStepSubmit} className="proc-add-step-form">
              <div className="proc-form-header">
                <h3 className="proc-form-title">Add Step</h3>
                <button
                  type="button"
                  onClick={() => setShowAddStep(false)}
                  className="proc-form-close"
                >
                  ✕
                </button>
              </div>

              <div className="proc-form-group">
                <label className="proc-form-label">Step Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter step name..."
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  className="proc-input"
                />
              </div>

              <div className="proc-form-group">
                <label className="proc-form-label">Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter step description..."
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  className="proc-textarea"
                />
              </div>

              <div className="proc-form-row">
                <div className="proc-form-group" style={{ flex: 1 }}>
                  <label className="proc-form-label">Due Date</label>
                  <input
                    type="date"
                    value={newStepDate}
                    onChange={(e) => setNewStepDate(e.target.value)}
                    className="proc-input"
                  />
                </div>

                <div className="proc-form-group" style={{ flex: 1 }}>
                  <label className="proc-form-label">Assignee</label>
                  <select
                    value={newStepAssignee}
                    onChange={(e) => setNewStepAssignee(e.target.value)}
                    className="proc-select"
                  >
                    <option value="SC">Sarah Connor (SC)</option>
                    <option value="AR">Alex Rivera (AR)</option>
                    <option value="ER">Elena Rossi (ER)</option>
                  </select>
                </div>
              </div>

              <div className="proc-form-actions">
                <button type="submit" className="proc-btn-submit">
                  Save Step
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStep(false)}
                  className="proc-btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </main>
      )}

      {/* 3. ALWAYS VISIBLE FIXED BOTTOM FOOTER */}
      {processEnabled && (
        <footer className="proc-fixed-bottom">
          <button
            type="button"
            onClick={() => setShowAddStep(!showAddStep)}
            className="proc-btn-add-steps"
          >
            {showAddStep ? "✕ Close Form" : "+ Add Steps"}
          </button>

          <div className="proc-footer-status">
            <span>{steps.length} Steps Total</span>
            <span className="proc-footer-dot">•</span>
            <span style={{ color: "#34d399" }}>{doneCount} Completed</span>
          </div>
        </footer>
      )}
    </div>
  );
}
