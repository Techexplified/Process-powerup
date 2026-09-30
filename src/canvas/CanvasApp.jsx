import React, { useState, useEffect } from "react";
import "./canvas.css";
import { ProcessIcon } from "../lib/icons.jsx";

export default function CanvasApp({ t }) {
  const [filter, setFilter] = useState("all"); // all | active | held | done
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [newStepDesc, setNewStepDesc] = useState("");
  const [newStepDate, setNewStepDate] = useState("2026-10-15");
  const [newStepAssignee, setNewStepAssignee] = useState("SC");

  useEffect(() => {
    if (t && typeof t.sizeTo === "function") {
      t.sizeTo("#root").catch(() => {});
    }
  }, [t, showAddStep, filter]);

  const [steps, setSteps] = useState([
    {
      id: 1,
      title: "Audit OAuth2 token exchange endpoints for rate-limiting vulnerability",
      description: "Ensure token endpoints are protected against brute force attempts.",
      status: "done", // done | held | pending
      dueDate: "Oct 02",
      assignee: { initials: "SC", name: "Sarah Connor", bg: "#065f46", text: "#34d399" },
      holdReason: null,
    },
    {
      id: 2,
      title: "Verify third-party SMS verification provider API latency under 200ms",
      description: "Run benchmark against vendor staging webhook.",
      status: "held",
      dueDate: "Oct 08",
      assignee: { initials: "AR", name: "Alex Rivera", bg: "#1e40af", text: "#60a5fa" },
      holdReason: {
        text: "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal.",
        tagged: { initials: "DH", name: "Devon Hayes" },
      },
    },
    {
      id: 3,
      title: "Execute cross-browser Cypress regression suite on Chrome, Firefox, Safari",
      description: "Verify checkout and login flows on all major desktop browsers.",
      status: "held",
      dueDate: "Oct 10",
      assignee: { initials: "ER", name: "Elena Rossi", bg: "#581c87", text: "#c084fc" },
      holdReason: {
        text: "Security certificate renewal pending on staging cluster.",
        tagged: { initials: "DH", name: "Devon Hayes" },
      },
    },
    {
      id: 4,
      title: "Final security sanity test & production container deployment",
      description: "Verify production rollout readiness with release manager.",
      status: "pending",
      dueDate: "Oct 12",
      assignee: { initials: "ER", name: "Elena Rossi", bg: "#581c87", text: "#c084fc" },
      holdReason: null,
    },
  ]);

  // Statistics
  const totalSteps = steps.length;
  const doneCount = steps.filter((s) => s.status === "done").length;
  const heldCount = steps.filter((s) => s.status === "held").length;
  const pendingCount = steps.filter((s) => s.status === "pending").length;
  const progressPercent = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0;

  // Filtered steps
  const filteredSteps = steps.filter((s) => {
    if (filter === "done") return s.status === "done";
    if (filter === "held") return s.status === "held";
    if (filter === "active") return s.status === "pending";
    return true;
  });

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

  function handleDeleteStep(id) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function handleAddStepSubmit(e) {
    e.preventDefault();
    if (!newStepName.trim()) return;

    const newStep = {
      id: Date.now(),
      title: newStepName.trim(),
      description: newStepDesc.trim() || "Multi-step workflow task item.",
      status: "pending",
      dueDate: "Oct 15",
      assignee:
        newStepAssignee === "SC"
          ? { initials: "SC", name: "Sarah Connor", bg: "#065f46", text: "#34d399" }
          : newStepAssignee === "AR"
          ? { initials: "AR", name: "Alex Rivera", bg: "#1e40af", text: "#60a5fa" }
          : { initials: "ER", name: "Elena Rossi", bg: "#581c87", text: "#c084fc" },
      holdReason: null,
    };

    setSteps((prev) => [...prev, newStep]);
    setNewStepName("");
    setNewStepDesc("");
    setShowAddStep(false);
  }

  return (
    <div className="proc-container">
      {/* 1. COMPACT UNIFIED HEADER */}
      <header className="proc-header">
        <div className="proc-header-top">
          <div className="proc-header-title-group">
            <div className="proc-app-icon">
              <ProcessIcon width={18} height={18} />
            </div>
            <div>
              <div className="proc-title-row">
                <h1 className="proc-title">Deployment & Verification Process</h1>
                <span className="proc-status-badge">Active</span>
              </div>
              <p className="proc-desc">
                Mandatory verification workflow before triggering production deployment gate.
              </p>
            </div>
          </div>

          <div className="proc-header-meta">
            <div className="proc-meta-date">
              <span className="calendar-icon">📅</span>
              <span>Oct 10, 2026</span>
            </div>
          </div>
        </div>

        {/* Progress & Filters Bar */}
        <div className="proc-progress-row">
          <div className="proc-progress-track-wrapper">
            <div className="proc-progress-track">
              <div
                className="proc-progress-fill-done"
                style={{ width: `${progressPercent}%` }}
              ></div>
              <div
                className="proc-progress-fill-held"
                style={{ width: `${(heldCount / totalSteps) * 100}%` }}
              ></div>
            </div>
            <span className="proc-progress-text">
              {doneCount}/{totalSteps} Completed ({progressPercent}%)
            </span>
          </div>

          {/* Clean Segmented Filter Tabs */}
          <div className="proc-filter-tabs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`proc-tab ${filter === "all" ? "active" : ""}`}
            >
              All <span className="tab-count">{totalSteps}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`proc-tab ${filter === "active" ? "active" : ""}`}
            >
              Pending <span className="tab-count">{pendingCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("held")}
              className={`proc-tab ${filter === "held" ? "active-amber" : ""}`}
            >
              On Hold <span className="tab-count count-amber">{heldCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter("done")}
              className={`proc-tab ${filter === "done" ? "active-emerald" : ""}`}
            >
              Done <span className="tab-count count-emerald">{doneCount}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. CLEAN STEP LIST */}
      <main className="proc-body custom-slim-scrollbar">
        <div className="proc-steps-group">
          {filteredSteps.map((step, idx) => {
            const isDone = step.status === "done";
            const isHeld = step.status === "held";

            return (
              <div key={step.id} className={`proc-card ${isHeld ? "proc-card-held" : ""} ${isDone ? "proc-card-done" : ""}`}>
                <div className="proc-card-main">
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleStepStatus(step.id)}
                    className={`proc-check-btn ${isDone ? "checked" : ""}`}
                    title={isDone ? "Mark as Incomplete" : "Mark as Complete"}
                  >
                    {isDone && (
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Step Content */}
                  <div className="proc-card-body">
                    <div className="proc-card-title-row">
                      <span className={`proc-card-title ${isDone ? "text-done" : ""}`}>
                        {idx + 1}. {step.title}
                      </span>
                      {isDone && <span className="pill-done">Done</span>}
                      {isHeld && <span className="pill-held">On Hold</span>}
                    </div>

                    {step.description && (
                      <p className="proc-card-desc">{step.description}</p>
                    )}
                  </div>

                  {/* Right Actions & Meta */}
                  <div className="proc-card-right">
                    <span className="proc-due-pill">📅 {step.dueDate}</span>

                    <span
                      className="proc-avatar-badge"
                      style={{ background: step.assignee.bg, color: step.assignee.text }}
                      title={step.assignee.name}
                    >
                      {step.assignee.initials}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleStepHold(step.id)}
                      className={`proc-hold-toggle ${isHeld ? "is-held" : ""}`}
                      title={isHeld ? "Resume Step" : "Put Step on Hold"}
                    >
                      <span>{isHeld ? "⏸ Held" : "Hold"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteStep(step.id)}
                      className="proc-delete-btn"
                      title="Delete Step"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Compact Hold Banner (Only if Held) */}
                {isHeld && step.holdReason && (
                  <div className="proc-hold-banner">
                    <div className="proc-hold-banner-left">
                      <span className="proc-hold-tag">⚠️ HOLD REASON</span>
                      <span className="proc-hold-msg">{step.holdReason.text}</span>
                    </div>

                    <div className="proc-hold-banner-right">
                      <span className="proc-hold-tagged">
                        Tagged: <strong>{step.holdReason.tagged?.name}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleStepHold(step.id)}
                        className="proc-resume-pill-btn"
                      >
                        ▶ Resume
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline Add Step Form */}
        {showAddStep && (
          <form onSubmit={handleAddStepSubmit} className="proc-form-card">
            <div className="proc-form-title-bar">
              <h4>Add New Step</h4>
              <button
                type="button"
                onClick={() => setShowAddStep(false)}
                className="proc-form-close"
              >
                ✕
              </button>
            </div>

            <div className="proc-form-fields">
              <input
                type="text"
                required
                autoFocus
                placeholder="Step title (e.g. Run integration tests)..."
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                className="proc-input-clean"
              />

              <input
                type="text"
                placeholder="Description / acceptance criteria..."
                value={newStepDesc}
                onChange={(e) => setNewStepDesc(e.target.value)}
                className="proc-input-clean"
              />

              <div className="proc-form-inline-row">
                <div style={{ flex: 1 }}>
                  <label className="proc-mini-label">Due Date</label>
                  <input
                    type="date"
                    value={newStepDate}
                    onChange={(e) => setNewStepDate(e.target.value)}
                    className="proc-input-clean"
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label className="proc-mini-label">Assignee</label>
                  <select
                    value={newStepAssignee}
                    onChange={(e) => setNewStepAssignee(e.target.value)}
                    className="proc-select-clean"
                  >
                    <option value="SC">Sarah Connor (SC)</option>
                    <option value="AR">Alex Rivera (AR)</option>
                    <option value="ER">Elena Rossi (ER)</option>
                  </select>
                </div>
              </div>

              <div className="proc-form-btn-row">
                <button type="submit" className="proc-submit-btn">
                  Save Step
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStep(false)}
                  className="proc-cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* 3. SLEEK FIXED BOTTOM BAR */}
      <footer className="proc-footer">
        <button
          type="button"
          onClick={() => setShowAddStep(!showAddStep)}
          className="proc-primary-add-btn"
        >
          {showAddStep ? "✕ Close Form" : "+ Add Step"}
        </button>

        <div className="proc-footer-summary">
          <span>{totalSteps} Steps</span>
          <span className="proc-bullet">·</span>
          <span className="text-emerald">{doneCount} Completed</span>
          <span className="proc-bullet">·</span>
          <span className="text-amber">{heldCount} On Hold</span>
        </div>
      </footer>
    </div>
  );
}
