import React, { useState, useEffect } from "react";
import {
  loadCardProcess,
  calculateProcessStats,
  getMemberById,
} from "../lib/processStore.js";
import {
  ProcessIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  PlusIcon,
} from "../lib/icons.jsx";

function getDisplayTitle(title) {
  if (!title) return null;
  const trimmed = title.trim();
  if (!trimmed) return null;
  const hasLettersOrDigits = /[\p{L}\p{N}]/u.test(trimmed);
  if (!hasLettersOrDigits) return null;
  return trimmed;
}

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
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'with_process' | 'no_process' | 'on_hold'
  const [cardProcesses, setCardProcesses] = useState({});
  const [collapsedLists, setCollapsedLists] = useState({});
  const [expandedCardLimits, setExpandedCardLimits] = useState({});

  // Expand only first list by default
  useEffect(() => {
    if (lists.length > 0) {
      const initialCollapsed = {};
      lists.slice(1).forEach((l) => {
        initialCollapsed[l.id] = true;
      });
      setCollapsedLists(initialCollapsed);
    }
  }, [lists]);

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

  // Exclude Cardlytics lists and metadata cards completely
  const isCardlyticsText = (str) => Boolean(str && str.toLowerCase().includes("cardlytics"));

  const displayLists = lists.filter((l) => {
    const name = l.name || l.title || "";
    return !isCardlyticsText(name);
  });

  const cardlyticsListIds = new Set(
    lists
      .filter((l) => isCardlyticsText(l.name || l.title))
      .map((l) => l.id)
  );

  const cleanCards = cards.filter((c) => {
    const listId = c.listId || c.idList;
    if (cardlyticsListIds.has(listId)) return false;
    const title = c.title || c.name || "";
    const desc = c.description || c.desc || "";
    if (isCardlyticsText(title) || isCardlyticsText(desc) || desc.toLowerCase().includes("tracked by cardlytics")) {
      return false;
    }
    return true;
  });

  // Compute global counts
  const totalCardsCount = cleanCards.length;
  let withProcessCount = 0;
  let noProcessCount = 0;
  let onHoldCount = 0;

  cleanCards.forEach((card) => {
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

  const selectedMemberObj = selectedMember === "all" ? null : members.find((m) => m.id === selectedMember);
  const isFilteringActive = searchQuery.trim() !== "" || selectedMember !== "all" || filterMode !== "all";

  // Filter cards
  const filteredCards = cleanCards.filter((card) => {
    const p = cardProcesses[card.id];
    const hasProcess = Boolean(p && p.enabled && p.steps && p.steps.length > 0);
    const isHeld = Boolean(p?.steps?.some((s) => s.status === "held"));

    const matchesSearch =
      searchQuery.trim() === "" ||
      (card.title && card.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMember =
      selectedMember === "all" ||
      (Array.isArray(card.assignees) &&
        card.assignees.some((a) => {
          if (!a) return false;
          if (a === selectedMember) return true;
          if (typeof a === "object" && a.id === selectedMember) return true;
          if (selectedMemberObj) {
            const smId = (selectedMemberObj.id || "").toLowerCase();
            const smName = (selectedMemberObj.name || "").toLowerCase();
            const smInitials = (selectedMemberObj.initials || "").toLowerCase();
            const smUsername = (selectedMemberObj.username || "").toLowerCase();
            const aStr = (typeof a === "string" ? a : a.id || a.name || a.username || "").toLowerCase();
            return (
              aStr === smId ||
              aStr === smName ||
              aStr === smInitials ||
              aStr === smUsername
            );
          }
          return false;
        }));

    if (!matchesSearch || !matchesMember) return false;

    if (filterMode === "with_process") return hasProcess;
    if (filterMode === "no_process") return !hasProcess;
    if (filterMode === "on_hold") return isHeld;

    return true;
  });

  return (
    <div className="proc-picker-screen">
      {/* PINNED TOP TOOLBAR */}
      <div className="proc-picker-pinned-toolbar">
        {/* Top Bar matching exact reference design */}
        <div className="proc-picker-top-bar">
          <div className="proc-brand-title-col">
            <div className="proc-brand-icon-box">
              <ProcessIcon width={18} height={18} />
            </div>
            <div>
              <h2 className="proc-brand-heading">Processes</h2>
              <p className="proc-brand-subtext">
                Pick a card to view or set up its process.
              </p>
            </div>
          </div>

          <div className="proc-top-status-col">
            <span className="proc-synced-badge">
              <span className="proc-synced-dot"></span> Synced
            </span>
          </div>
        </div>

        {/* Search & Member Filter Bar */}
        <div className="proc-picker-filter-row">
          <div className="proc-search-field">
            <SearchIcon width={14} height={14} className="proc-search-icon" />
            <input
              type="text"
              placeholder="Search cards"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="proc-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="proc-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="proc-member-filter-wrapper">
            <button
              type="button"
              className="proc-member-filter-btn"
              onClick={() => setIsMemberMenuOpen(!isMemberMenuOpen)}
            >
              {selectedMemberObj ? (
                <span
                  className="proc-filter-avatar"
                  style={{ background: selectedMemberObj.bg, color: selectedMemberObj.text }}
                >
                  {selectedMemberObj.initials}
                </span>
              ) : (
                <span className="proc-filter-avatar-default">SB</span>
              )}
              <span className="proc-filter-member-name">
                {selectedMemberObj ? selectedMemberObj.name : "Anyone"}
              </span>
              <ChevronDownIcon width={12} height={12} className="proc-filter-chevron" />
            </button>

            {isMemberMenuOpen && (
              <div className="proc-member-dropdown-menu">
                <div
                  className={`proc-member-menu-item ${selectedMember === "all" ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedMember("all");
                    setIsMemberMenuOpen(false);
                  }}
                >
                  <span className="proc-filter-avatar-default">SB</span>
                  <span>Anyone</span>
                </div>
                {members.map((m) => (
                  <div
                    key={m.id}
                    className={`proc-member-menu-item ${selectedMember === m.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedMember(m.id);
                      setIsMemberMenuOpen(false);
                    }}
                  >
                    <span
                      className="proc-filter-avatar"
                      style={{ background: m.bg, color: m.text }}
                    >
                      {m.initials}
                    </span>
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="proc-filter-pills-row">
          <button
            type="button"
            className={`proc-pill-btn ${filterMode === "all" ? "active" : ""}`}
            onClick={() => setFilterMode("all")}
          >
            All {totalCardsCount}
          </button>
          <button
            type="button"
            className={`proc-pill-btn ${filterMode === "with_process" ? "active" : ""}`}
            onClick={() => setFilterMode("with_process")}
          >
            With process {withProcessCount}
          </button>
          <button
            type="button"
            className={`proc-pill-btn ${filterMode === "no_process" ? "active" : ""}`}
            onClick={() => setFilterMode("no_process")}
          >
            No process {noProcessCount}
          </button>
          <button
            type="button"
            className={`proc-pill-btn pill-amber ${filterMode === "on_hold" ? "active" : ""}`}
            onClick={() => setFilterMode("on_hold")}
          >
            On hold {onHoldCount}
          </button>
        </div>
      </div>

      {/* SINGLE SCROLL CONTAINER FOR THE LIST */}
      <div className="proc-picker-list-container custom-slim-scrollbar">
        {filteredCards.length === 0 && (
          <div className="proc-empty-filter-state">
            <div className="proc-empty-filter-icon">🔍</div>
            <h4 className="proc-empty-filter-title">No cards found</h4>
            <p className="proc-empty-filter-subtitle">
              {selectedMemberObj
                ? `No cards assigned to ${selectedMemberObj.name} match the current filter.`
                : searchQuery
                ? `No cards match "${searchQuery}".`
                : "No cards available in this view."}
            </p>
            {isFilteringActive && (
              <button
                type="button"
                className="proc-btn-clear-filters"
                onClick={() => {
                  setSelectedMember("all");
                  setSearchQuery("");
                  setFilterMode("all");
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {displayLists.map((list) => {
          const listCards = filteredCards.filter((c) => c.listId === list.id);
          if (listCards.length === 0) return null;

          const isCollapsed = Boolean(collapsedLists[list.id]);
          const visibleLimit = expandedCardLimits[list.id] || 4;
          const visibleCards = listCards.slice(0, visibleLimit);
          const hasMore = listCards.length > visibleLimit;

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
            <div key={list.id} className="proc-list-group">
              {/* Group Header */}
              <div
                className="proc-list-header"
                onClick={() => toggleCollapseList(list.id)}
              >
                <div className="proc-list-header-left">
                  <span className="proc-list-icon-box">
                    {isCollapsed ? (
                      <ChevronRightIcon width={13} height={13} />
                    ) : (
                      <ChevronDownIcon width={13} height={13} />
                    )}
                  </span>
                  <span className="proc-list-title">{list.title}</span>
                  <span className="proc-list-count-meta">
                    {listCards.length} cards · {listWithProcess} with process
                  </span>
                </div>

                <div className="proc-list-header-right">
                  {listOnHold > 0 && (
                    <span className="proc-status-pill pill-amber">
                      {listOnHold} on hold
                    </span>
                  )}
                  {listComplete > 0 && (
                    <span className="proc-status-pill pill-done">
                      {listComplete} complete
                    </span>
                  )}
                </div>
              </div>

              {/* Group Cards */}
              {!isCollapsed && (
                <div className="proc-list-items">
                  {visibleCards.map((card, cIndex) => {
                    const proc = cardProcesses[card.id];
                    const hasProc = Boolean(
                      proc && proc.enabled && proc.steps && proc.steps.length > 0
                    );
                    const stats = hasProc ? calculateProcessStats(proc.steps) : null;
                    const isHeld = stats && stats.held > 0;
                    const isAllDone = stats && stats.done === stats.total;
                    const displayTitle = getDisplayTitle(card.title);

                    // Row Type 1: Card WITH a process (Highlighted outline if first card / selected)
                    if (hasProc) {
                      return (
                        <div
                          key={card.id}
                          className={`proc-card-row with-process ${cIndex === 0 ? "highlight-active" : ""}`}
                          onClick={() => onSelectCard(card)}
                        >
                          <div className="proc-card-row-left">
                            <div className="proc-card-glyph-box glyph-active">
                              <ProcessIcon width={14} height={14} />
                            </div>
                            <div className="proc-card-row-text">
                              <h4 className="proc-card-row-title">
                                {displayTitle || <span className="proc-untitled-fallback">Untitled card</span>}
                              </h4>
                              <div className="proc-card-row-subline">
                                <span className="proc-proc-name">
                                  {proc.title || "Deployment and verification"}
                                </span>
                                <div className="proc-mini-dashes">
                                  {proc.steps.map((st, sIdx) => (
                                    <span
                                      key={st.id || sIdx}
                                      className={`proc-dash-seg ${
                                        st.status === "done"
                                          ? "dash-done"
                                          : st.status === "held"
                                          ? "dash-held"
                                          : "dash-todo"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="proc-dash-frac">
                                  {stats.done}/{stats.total}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="proc-card-row-right">
                            {isHeld && (
                              <span className="proc-status-pill pill-amber">
                                {stats.held} on hold
                              </span>
                            )}
                            {!isHeld && !isAllDone && (
                              <span className="proc-status-pill pill-in-progress">
                                In progress
                              </span>
                            )}
                            {isAllDone && (
                              <span className="proc-status-pill pill-done">
                                Complete
                              </span>
                            )}

                            {card.assignees && card.assignees.length > 0 && (
                              <span
                                className="proc-member-avatar-chip"
                                style={{
                                  background: getMemberById(card.assignees[0]).bg,
                                  color: getMemberById(card.assignees[0]).text,
                                }}
                                title={getMemberById(card.assignees[0]).name}
                              >
                                {getMemberById(card.assignees[0]).initials}
                              </span>
                            )}

                            <ChevronRightIcon width={14} height={14} className="proc-row-chevron-icon" />
                          </div>
                        </div>
                      );
                    }

                    // Row Type 2: Card WITHOUT a process (Exact 2-line structure with Title + No process yet + Set up button)
                    return (
                      <div
                        key={card.id}
                        className="proc-card-row no-process"
                        onClick={() => onSelectCard(card)}
                      >
                        <div className="proc-card-row-left">
                          <div className="proc-card-glyph-box glyph-neutral">
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="4" y="4" width="16" height="16" rx="2" />
                            </svg>
                          </div>
                          <div className="proc-card-row-text">
                            <h4 className="proc-card-row-title">
                              {displayTitle || <span className="proc-untitled-fallback">Untitled card</span>}
                            </h4>
                            <div className="proc-card-row-subline">
                              <span className="proc-no-proc-subtext">No process yet</span>
                            </div>
                          </div>
                        </div>

                        <div className="proc-card-row-right">
                          <button
                            type="button"
                            className="proc-btn-setup-outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCard(card);
                            }}
                          >
                            <PlusIcon width={12} height={12} className="proc-btn-setup-icon" /> Set up
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {hasMore && (
                    <button
                      type="button"
                      className="proc-show-more-link"
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
