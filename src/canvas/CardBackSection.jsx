import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  saveCardProcess,
  calculateProcessStats,
  getMemberById,
} from "../lib/processStore.js";
import { ProcessIcon, CheckIcon, CalendarIcon, PlusIcon } from "../lib/icons.jsx";

export default function CardBackSection({
  card,
  onOpenFullView,
  onAddStepClick,
  t = null,
}) {
  const [activeCard, setActiveCard] = useState(card);
  const [processData, setProcessData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Resolve exact card from Trello iframe context if available
  useEffect(() => {
    let isMounted = true;

    async function resolveCardAndProcess() {
      let resolvedCard = card;

      if (t && typeof t.card === "function") {
        try {
          let tCard = null;
          try {
            tCard = await t.card("all");
          } catch (e1) {
            try {
              tCard = await t.card("id", "name", "desc", "idList", "idMembers", "labels", "due");
            } catch (e2) {
              try {
                tCard = await t.card();
              } catch (e3) {}
            }
          }

          if (tCard && tCard.id) {
            let cleanDesc = tCard.desc || "";
            if (cleanDesc.includes("cardlytics:") || cleanDesc.includes("tracked by Cardlytics")) {
              cleanDesc = cleanDesc.split("\n").filter((l) => !l.includes("cardlytics") && !l.includes("tracked by Cardlytics")).join("\n").trim();
            }
            resolvedCard = {
              id: tCard.id,
              listId: tCard.idList || "list-1",
              title: tCard.name || "Card Workflow",
              description: cleanDesc || "Generated from Lean Canvas (Solution)",
              assignees: tCard.idMembers || [],
              labels: (tCard.labels || []).map((l) => ({ name: l.name || l.color, color: l.color })),
              due: tCard.due,
            };
          }
        } catch (e) {}
      }

      if (isMounted) {
        setActiveCard(resolvedCard);
        if (resolvedCard && resolvedCard.id) {
          const data = await loadCardProcess(resolvedCard.id, t, resolvedCard.title, resolvedCard.description);
          if (isMounted) {
            setProcessData(data);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    }

    resolveCardAndProcess();

    return () => {
      isMounted = false;
    };
  }, [card?.id, card?.title, card?.description, t]);

  // Adjust iframe height dynamically in Trello
  useEffect(() => {
    if (t && typeof t.sizeTo === "function") {
      const timer = setTimeout(() => {
        t.sizeTo("#root").catch(() => {});
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [processData, loading, t]);

  function updateAndPersist(newData) {
    setProcessData(newData);
    if (activeCard && activeCard.id) {
      saveCardProcess(activeCard.id, newData, t);
    }
  }

  // Toggle Process Enable / Disable
  function handleToggleSwitch() {
    const nextEnabled = !processData?.enabled;
    const defaultTitle = activeCard?.title
      ? `${activeCard.title} Workflow`
      : "Process Workflow";
    const defaultDesc =
      activeCard?.description || "Generated from Lean Canvas (Solution)";

    const resolvedTitle =
      processData?.title && !processData.title.includes("Assigned to Me")
        ? processData.title
        : defaultTitle;
    const resolvedDesc =
      processData?.description && !processData.description.includes("cardlytics")
        ? processData.description
        : defaultDesc;

    const updated = {
      ...processData,
      enabled: nextEnabled,
      title: resolvedTitle,
      description: resolvedDesc,
      status: nextEnabled ? "Active" : "Draft",
      steps: processData?.steps?.length ? processData.steps : [],
    };
    updateAndPersist(updated);
  }

  // Toggle Step Completion (Done <-> Pending)
  function handleToggleDone(stepId, e) {
    if (e) e.stopPropagation();
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

  // Handle redirect to main popup modal
  function handleRedirectToFullModal(e) {
    if (e) e.stopPropagation();
    const cardId = activeCard?.id || card?.id || "";
    if (onOpenFullView) {
      onOpenFullView(activeCard || card);
      return;
    }
    if (t && typeof t.modal === "function") {
      t.modal({
        url: `./canvas.html?cardId=${encodeURIComponent(cardId)}`,
        accentColor: "#161b22",
        height: 630,
        fullscreen: false,
        title: "Process Power-Up",
      });
    }
  }

  if (loading) {
    return (
      <div className="proc-cardback-loading">
        <div className="proc-spinner"></div>
        <span>Loading Process...</span>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: PROCESS IS NOT ENABLED
  // ==========================================
  if (!processData?.enabled) {
    return (
      <div className="proc-cardback-container proc-cardback-disabled" onClick={handleToggleSwitch}>
        <div className="proc-cardback-disabled-inner">
          <div className="proc-cardback-disabled-left">
            <div className="proc-cardback-icon-box">
              <ProcessIcon width={16} height={16} />
            </div>
            <div className="proc-cardback-disabled-text">
              <span className="proc-cardback-disabled-title">PROCESS</span>
              <p className="proc-cardback-disabled-subtitle">enable to add steps</p>
            </div>
          </div>

          <div className="proc-cardback-disabled-right" onClick={(e) => e.stopPropagation()}>
            <label className="proc-toggle-switch" title="Enable Process for this card">
              <input
                type="checkbox"
                checked={false}
                onChange={handleToggleSwitch}
              />
              <span className="proc-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: PROCESS IS ENABLED (ACTIVE VIEW)
  // ==========================================
  const steps = processData.steps || [];
  const stats = calculateProcessStats(steps);
  const displayTitle =
    processData.title && !processData.title.includes("Assigned to Me")
      ? processData.title
      : activeCard?.title
      ? `${activeCard.title} Workflow`
      : "Process Workflow";
  const displayDesc =
    processData.description && !processData.description.includes("cardlytics")
      ? processData.description
      : activeCard?.description || "Generated from Lean Canvas (Solution)";

  return (
    <div className="proc-cardback-container proc-cardback-active">
      {/* 1. ACTIVE PROCESS HERO CARD */}
      <div className="proc-cardback-hero-card" onClick={handleRedirectToFullModal}>
        {/* Header Row: Toggle + Title + Active Pill */}
        <div className="proc-cardback-header-row">
          <div className="proc-cardback-title-group">
            <div className="proc-cardback-toggle-wrap" onClick={(e) => e.stopPropagation()}>
              <label className="proc-toggle-switch" title="Toggle Process Enable / Disable">
                <input
                  type="checkbox"
                  checked={true}
                  onChange={handleToggleSwitch}
                />
                <span className="proc-toggle-slider"></span>
              </label>
            </div>

            <h3 className="proc-cardback-process-title" title={displayTitle}>
              {displayTitle}
            </h3>

            <span className="proc-cardback-active-badge">Active</span>
          </div>

          <button
            type="button"
            className="proc-cardback-open-modal-icon-btn"
            onClick={handleRedirectToFullModal}
            title="Open in full detailed modal view"
          >
            <span style={{ fontSize: "11px", fontWeight: 600 }}>Detailed View</span>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
        </div>

        {/* Subtitle / Description */}
        <p className="proc-cardback-subtitle">{displayDesc}</p>

        {/* Progress Metrics & Bar */}
        <div className="proc-cardback-progress-section">
          <div className="proc-cardback-progress-label-row">
            <span className="proc-cardback-progress-bold">
              Progress: {stats.percent}%
            </span>
            <span className="proc-cardback-progress-meta">
              • {stats.done}/{stats.total} steps completed
            </span>
            {stats.held > 0 && (
              <span className="proc-cardback-held-pill">
                ⚠️ {stats.held} on hold
              </span>
            )}
          </div>

          <div className="proc-cardback-progress-bar-track">
            <div
              className="proc-cardback-progress-bar-fill-done"
              style={{ width: `${stats.percent}%` }}
            />
            {stats.held > 0 && stats.total > 0 && (
              <div
                className="proc-cardback-progress-bar-fill-held"
                style={{ width: `${(stats.held / stats.total) * 100}%` }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. COMPACT STEPS LIST (If steps exist) */}
      {steps.length > 0 && (
        <div className="proc-cardback-steps-list custom-slim-scrollbar">
          {steps.map((step, idx) => {
            const isDone = step.status === "done";
            const isHeld = step.status === "held";
            const holdFirst = step.holdReasons?.[0];
            const assignees = (step.assignees || []).map((aId) =>
              typeof aId === "object" ? aId : getMemberById(aId)
            );

            return (
              <div
                key={step.id || idx}
                className={`proc-cardback-step-item ${
                  isDone ? "is-done" : isHeld ? "is-held" : "is-pending"
                }`}
                onClick={handleRedirectToFullModal}
              >
                <div className="proc-cardback-step-left">
                  <button
                    type="button"
                    className={`proc-cardback-checkbox ${isDone ? "checked" : ""}`}
                    onClick={(e) => handleToggleDone(step.id, e)}
                    title={isDone ? "Mark as Pending" : "Mark as Done"}
                  >
                    {isDone && <CheckIcon width={10} height={10} />}
                  </button>

                  <span className={`proc-cardback-step-name ${isDone ? "done-strike" : ""}`}>
                    {step.name}
                  </span>
                </div>

                <div className="proc-cardback-step-right" onClick={(e) => e.stopPropagation()}>
                  {step.targetDate && (
                    <span className="proc-cardback-date-chip">
                      <CalendarIcon width={10} height={10} />
                      <span>{step.targetDate}</span>
                    </span>
                  )}

                  {isHeld && (
                    <span className="proc-cardback-badge-held">Held</span>
                  )}
                  {isDone && (
                    <span className="proc-cardback-badge-done">Done</span>
                  )}

                  {assignees.length > 0 && (
                    <div className="proc-cardback-avatars-row">
                      {assignees.slice(0, 2).map((m, mIdx) => (
                        <span
                          key={m.id || mIdx}
                          className="proc-cardback-avatar"
                          style={{ background: m.bg, color: m.text }}
                          title={m.name}
                        >
                          {m.initials}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {isHeld && holdFirst && (
                  <div className="proc-cardback-hold-reason-banner">
                    <span>⚠️ Blocker: {holdFirst.reason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. FOOTER ACTIONS */}
      <div className="proc-cardback-footer-row">
        <button
          type="button"
          className="proc-cardback-btn-add-steps"
          onClick={handleRedirectToFullModal}
          title="Add new verification steps"
        >
          <PlusIcon width={13} height={13} />
          <span>Add Steps</span>
        </button>

        <div className="proc-cardback-telemetry-meta">
          <span>{stats.total} Steps</span>
          <span>•</span>
          <span className="proc-telemetry-done">{stats.done} Completed</span>
          {stats.held > 0 && (
            <>
              <span>•</span>
              <span className="proc-telemetry-held">{stats.held} On Hold</span>
            </>
          )}
        </div>

        <button
          type="button"
          className="proc-cardback-btn-open-full"
          onClick={handleRedirectToFullModal}
        >
          <span>Open Full View ↗</span>
        </button>
      </div>
    </div>
  );
}
