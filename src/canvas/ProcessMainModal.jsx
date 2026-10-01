import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  calculateProcessStats,
  getMemberById,
} from "../lib/processStore.js";
import { ProcessIcon } from "../lib/icons.jsx";

export default function ProcessMainModal({
  boardName = "My Trello board",
  lists = [],
  cards = [],
  members = [],
  onSelectCard,
  onClose,
  t = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState("all");
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'with_process' | 'no_process' | 'on_hold'
  const [cardProcesses, setCardProcesses] = useState({});
  const [collapsedLists, setCollapsedLists] = useState({});
  const [expandedCardLimits, setExpandedCardLimits] = useState({});

  // Load processes for all board cards
  useEffect(() => {
    let isMounted = true;

    async function loadAllProcesses() {
      const results = {};
      for (const card of cards) {
        const pData = await loadCardProcess(card.id, t, card.title, card.description);
        results[card.id] = pData;
      }
      if (isMounted) {
        setCardProcesses(results);
      }
    }

    if (cards.length > 0) {
      loadAllProcesses();
    }

    return () => {
      isMounted = false;
    };
  }, [cards, t]);

  // Compute global counts
  const totalCardsCount = cards.length;
  let withProcessCount = 0;
  let noProcessCount = 0;
  let onHoldCount = 0;

  cards.forEach((card) => {
    const p = cardProcesses[card.id];
    if (p && p.enabled && p.steps && p.steps.length > 0) {
      withProcessCount++;
      const held = p.steps.filter((s) => s.status === "held").length;
      if (held > 0) onHoldCount++;
    } else {
      noProcessCount++;
    }
  });

  function toggleCollapseList(listId) {
    setCollapsedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }));
  }

  function showMoreForList(listId) {
    setExpandedCardLimits((prev) => ({
      ...prev,
      [listId]: (prev[listId] || 4) + 10,
    }));
  }

  // Filter cards
  const filteredCards = cards.filter((card) => {
    const p = cardProcesses[card.id];
    const hasProcess = Boolean(p && p.enabled && p.steps && p.steps.length > 0);
    const isHeld = Boolean(p?.steps?.some((s) => s.status === "held"));

    const matchesSearch =
      searchQuery.trim() === "" ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMember =
      selectedMember === "all" ||
      (card.assignees && card.assignees.includes(selectedMember));

    if (!matchesSearch || !matchesMember) return false;

    if (filterMode === "with_process") return hasProcess;
    if (filterMode === "no_process") return !hasProcess;
    if (filterMode === "on_hold") return isHeld;

    return true;
  });

  return (
    <div className="proc-modal-app-card">
      {/* 1. MODAL TOP HEADER */}
      <div className="proc-modal-top-bar">
        <div className="proc-modal-brand-col">
          <div className="proc-modal-brand-icon">
            <ProcessIcon width={20} height={20} />
          </div>
          <div>
            <h2 className="proc-modal-heading">Processes</h2>
            <p className="proc-modal-subtext">
              Pick a card to view or set up its process.
            </p>
          </div>
        </div>

        <div className="proc-modal-status-col">
          <span className="proc-synced-pill">
            <span className="proc-synced-dot"></span> Synced
          </span>
          <button
            type="button"
            className="proc-modal-close-icon"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. SEARCH & MEMBER FILTER BAR */}
      <div className="proc-modal-filter-row">
        <div className="proc-modal-search-field">
          <span className="proc-modal-search-glass">🔍</span>
          <input
            type="text"
            placeholder="Search cards"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="proc-modal-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="proc-modal-search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>

        <div className="proc-modal-member-dropdown">
          <select
            className="proc-modal-member-select"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="all">👤 Anyone</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.initials ? `(${m.initials})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. FILTER PILLS */}
      <div className="proc-modal-filter-pills-row">
        <button
          type="button"
          className={`proc-pill-filter ${filterMode === "all" ? "active" : ""}`}
          onClick={() => setFilterMode("all")}
        >
          All {totalCardsCount}
        </button>
        <button
          type="button"
          className={`proc-pill-filter ${filterMode === "with_process" ? "active" : ""}`}
          onClick={() => setFilterMode("with_process")}
        >
          With process {withProcessCount}
        </button>
        <button
          type="button"
          className={`proc-pill-filter ${filterMode === "no_process" ? "active" : ""}`}
          onClick={() => setFilterMode("no_process")}
        >
          No process {noProcessCount}
        </button>
        <button
          type="button"
          className={`proc-pill-filter pill-amber ${filterMode === "on_hold" ? "active" : ""}`}
          onClick={() => setFilterMode("on_hold")}
        >
          On hold {onHoldCount}
        </button>
      </div>

      {/* 4. COLLAPSIBLE LIST SECTIONS */}
      <div className="proc-modal-lists-viewport custom-slim-scrollbar">
        {lists.map((list) => {
          const listCards = filteredCards.filter((c) => c.listId === list.id);
          if (listCards.length === 0 && filterMode !== "all") return null;

          const isCollapsed = collapsedLists[list.id];
          const visibleLimit = expandedCardLimits[list.id] || 4;
          const visibleCards = listCards.slice(0, visibleLimit);
          const hasMore = listCards.length > visibleLimit;

          // Compute list specific process stats
          let listWithProcess = 0;
          let listOnHold = 0;
          let listComplete = 0;

          listCards.forEach((c) => {
            const p = cardProcesses[c.id];
            if (p && p.enabled && p.steps && p.steps.length > 0) {
              listWithProcess++;
              const held = p.steps.filter((s) => s.status === "held").length;
              const done = p.steps.filter((s) => s.status === "done").length;
              if (held > 0) listOnHold += held;
              if (done === p.steps.length) listComplete++;
            }
          });

          return (
            <div key={list.id} className="proc-list-accordion-group">
              {/* List Accordion Header */}
              <div
                className="proc-list-accordion-header"
                onClick={() => toggleCollapseList(list.id)}
              >
                <div className="proc-list-header-left">
                  <span className="proc-accordion-caret">
                    {isCollapsed ? "▶" : "▼"}
                  </span>
                  <span className="proc-accordion-list-icon">📋</span>
                  <span className="proc-accordion-list-name">{list.title}</span>
                  <span className="proc-accordion-list-meta">
                    {listCards.length} cards · {listWithProcess} with process
                  </span>
                </div>

                <div className="proc-list-header-right">
                  {listOnHold > 0 && (
                    <span className="proc-list-badge-held">
                      {listOnHold} on hold
                    </span>
                  )}
                  {listComplete > 0 && (
                    <span className="proc-list-badge-complete">
                      {listComplete} complete
                    </span>
                  )}
                </div>
              </div>

              {/* Cards Inside List */}
              {!isCollapsed && (
                <div className="proc-list-cards-table">
                  {visibleCards.map((card) => {
                    const proc = cardProcesses[card.id];
                    const hasProc = Boolean(
                      proc && proc.enabled && proc.steps && proc.steps.length > 0
                    );
                    const stats = hasProc ? calculateProcessStats(proc.steps) : null;
                    const isHeld = stats && stats.held > 0;
                    const isAllDone = stats && stats.done === stats.total;

                    return (
                      <div
                        key={card.id}
                        className={`proc-card-row-item ${hasProc ? "has-process" : ""}`}
                        onClick={() => onSelectCard(card)}
                      >
                        <div className="proc-card-row-left">
                          <div className="proc-card-row-icon">
                            <ProcessIcon width={16} height={16} />
                          </div>

                          <div className="proc-card-row-text">
                            <h4 className="proc-card-row-title">{card.title}</h4>

                            {hasProc ? (
                              <div className="proc-card-row-progress-line">
                                <span className="proc-proc-name-sub">
                                  {proc.title || "Deployment and verification"}
                                </span>
                                {/* Segmented Mini Progress Bar */}
                                <div className="proc-mini-segmented-bar">
                                  {proc.steps.map((st, sIdx) => (
                                    <span
                                      key={st.id || sIdx}
                                      className={`proc-mini-dash ${
                                        st.status === "done"
                                          ? "dash-done"
                                          : st.status === "held"
                                          ? "dash-held"
                                          : "dash-todo"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="proc-proc-frac">
                                  {stats.done}/{stats.total}
                                </span>
                              </div>
                            ) : (
                              <span className="proc-card-row-no-proc">
                                No process yet
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="proc-card-row-right">
                          {hasProc ? (
                            <>
                              {isHeld && (
                                <span className="proc-row-pill-held">
                                  {stats.held} on hold
                                </span>
                              )}
                              {!isHeld && !isAllDone && (
                                <span className="proc-row-pill-progress">
                                  In progress
                                </span>
                              )}
                              {isAllDone && (
                                <span className="proc-row-pill-complete">
                                  Complete
                                </span>
                              )}

                              {card.assignees && card.assignees.length > 0 && (
                                <span
                                  className="proc-row-avatar"
                                  style={{
                                    background: getMemberById(card.assignees[0]).bg,
                                    color: getMemberById(card.assignees[0]).text,
                                  }}
                                  title={getMemberById(card.assignees[0]).name}
                                >
                                  {getMemberById(card.assignees[0]).initials}
                                </span>
                              )}

                              <span className="proc-row-chevron">›</span>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="proc-btn-setup-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCard(card);
                              }}
                            >
                              + Set up
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <button
                      type="button"
                      className="proc-btn-show-more"
                      onClick={() => showMoreForList(list.id)}
                    >
                      Show {listCards.length - visibleLimit} more
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
