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

const LIST_COLOR_PALETTES = [
  { bg: "rgba(139, 92, 246, 0.18)", text: "#c4b5fd", border: "rgba(139, 92, 246, 0.35)" }, // Purple
  { bg: "rgba(59, 130, 246, 0.18)", text: "#93c5fd", border: "rgba(59, 130, 246, 0.35)" }, // Blue
  { bg: "rgba(16, 185, 129, 0.18)", text: "#6ee7b7", border: "rgba(16, 185, 129, 0.35)" }, // Emerald
  { bg: "rgba(245, 158, 11, 0.18)", text: "#fcd34d", border: "rgba(245, 158, 11, 0.35)" }, // Amber
  { bg: "rgba(236, 72, 153, 0.18)", text: "#f472b6", border: "rgba(236, 72, 153, 0.35)" }, // Pink
  { bg: "rgba(14, 165, 233, 0.18)", text: "#7dd3fc", border: "rgba(14, 165, 233, 0.35)" }, // Sky
  { bg: "rgba(249, 115, 22, 0.18)", text: "#fdba74", border: "rgba(249, 115, 22, 0.35)" }, // Orange
];

function getListBadgeStyle(listIndex = 0) {
  const idx = Math.abs(listIndex) % LIST_COLOR_PALETTES.length;
  return LIST_COLOR_PALETTES[idx];
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
  const [selectedList, setSelectedList] = useState("all");
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState("all");
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'with_process' | 'no_process' | 'on_hold'
  const [cardProcesses, setCardProcesses] = useState({});
  const [collapsedLists, setCollapsedLists] = useState({});
  const [expandedCardLimits, setExpandedCardLimits] = useState({});
  const toolbarRef = React.useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setIsListMenuOpen(false);
        setIsMemberMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Expand only first list by default when in all lists mode
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

  // Filter cleanCards by selected list first
  const scopedCards = cleanCards.filter((card) => {
    const listId = card.listId || card.idList;
    if (selectedList !== "all" && listId !== selectedList) return false;
    return true;
  });

  // Compute scoped counts
  const totalCardsCount = scopedCards.length;
  let withProcessCount = 0;
  let noProcessCount = 0;
  let onHoldCount = 0;

  scopedCards.forEach((card) => {
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

  const selectedListObj = selectedList === "all" ? null : displayLists.find((l) => l.id === selectedList);
  const selectedMemberObj = selectedMember === "all" ? null : members.find((m) => m.id === selectedMember);
  const isFilteringActive = searchQuery.trim() !== "" || selectedMember !== "all" || filterMode !== "all" || selectedList !== "all";

  // Filter cards
  const filteredCards = scopedCards.filter((card) => {
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

  const listsToRender = selectedList === "all"
    ? displayLists
    : displayLists.filter((l) => l.id === selectedList);

  return (
    <div className="proc-picker-screen">
      {/* PINNED TOP TOOLBAR */}
      <div className="proc-picker-pinned-toolbar" ref={toolbarRef}>
        {/* Top Bar */}
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

        {/* Search, List Filter & Member Filter Bar */}
        <div className="proc-picker-filter-row">
          <div className="proc-search-field">
            <SearchIcon width={14} height={14} className="proc-search-icon" />
            <input
              type="text"
              placeholder="Search cards..."
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

          {/* List Selector Dropdown */}
          <div className="proc-list-filter-wrapper">
            <button
              type="button"
              className={`proc-list-filter-btn ${selectedList !== "all" ? "active-filter" : ""}`}
              onClick={() => {
                setIsListMenuOpen(!isListMenuOpen);
                setIsMemberMenuOpen(false);
              }}
            >
              <span className="proc-filter-list-name">
                {selectedList === "all"
                  ? "List: All Lists"
                  : `List: ${selectedListObj?.title || selectedListObj?.name || "Selected List"}`}
              </span>
              <ChevronDownIcon width={12} height={12} className="proc-filter-chevron" />
            </button>

            {isListMenuOpen && (
              <div className="proc-list-dropdown-menu custom-slim-scrollbar">
                <div
                  className={`proc-list-menu-item ${selectedList === "all" ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedList("all");
                    setIsListMenuOpen(false);
                  }}
                >
                  <span className="proc-list-menu-title">All Lists</span>
                  <span className="proc-list-menu-count">{cleanCards.length}</span>
                </div>
                {displayLists.map((l) => {
                  const lCount = cleanCards.filter((c) => (c.listId || c.idList) === l.id).length;
                  return (
                    <div
                      key={l.id}
                      className={`proc-list-menu-item ${selectedList === l.id ? "selected" : ""}`}
                      onClick={() => {
                        setSelectedList(l.id);
                        setIsListMenuOpen(false);
                      }}
                    >
                      <span className="proc-list-menu-title">{l.title || l.name}</span>
                      <span className="proc-list-menu-count">{lCount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Member Dropdown */}
          <div className="proc-member-filter-wrapper">
            <button
              type="button"
              className={`proc-member-filter-btn ${selectedMember !== "all" ? "active-filter" : ""}`}
              onClick={() => {
                setIsMemberMenuOpen(!isMemberMenuOpen);
                setIsListMenuOpen(false);
              }}
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
              {selectedListObj
                ? `No cards in "${selectedListObj.title || selectedListObj.name}" match the current filter.`
                : selectedMemberObj
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
                  setSelectedList("all");
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

        {/* LINEAR STYLE HIGH-DENSITY TABLE */}
        {filteredCards.length > 0 && (
          <div className="proc-linear-table-container">
            {/* Table Header */}
            <div className="proc-table-header-row">
              <div className="proc-th-col col-name">CARD NAME</div>
              <div className="proc-th-col col-list">LIST NAME</div>
              <div className="proc-th-col col-progress">PROGRESS</div>
              <div className="proc-th-col col-status">STATUS</div>
              <div className="proc-th-col col-assignee">ASSIGNEE</div>
              <div className="proc-th-col col-actions">ACTIONS</div>
            </div>

            {/* Table Body */}
            <div className="proc-table-body">
              {filteredCards.map((card) => {
                const listId = card.listId || card.idList;
                const listIdx = displayLists.findIndex((l) => l.id === listId);
                const listObj = displayLists[listIdx] || lists.find((l) => l.id === listId) || { title: "List", name: "List" };
                const listName = listObj.title || listObj.name || "General";
                const listBadge = getListBadgeStyle(listIdx >= 0 ? listIdx : 0);

                const proc = cardProcesses[card.id];
                const hasProc = Boolean(proc && proc.enabled && proc.steps && proc.steps.length > 0);
                const stats = hasProc ? calculateProcessStats(proc.steps) : null;
                const isHeld = stats && stats.held > 0;
                const isAllDone = stats && stats.done === stats.total;
                const displayTitle = getDisplayTitle(card.title) || "Untitled card";

                const firstAssignee = Array.isArray(card.assignees) && card.assignees[0];
                const memberObj = firstAssignee ? getMemberById(firstAssignee) : null;

                return (
                  <div
                    key={card.id}
                    className={`proc-table-row ${hasProc ? "row-has-proc" : "row-no-proc"} ${isHeld ? "row-held" : ""}`}
                    onClick={() => onSelectCard(card)}
                  >
                    {/* Col 1: Card Name */}
                    <div className="proc-td-col col-name">
                      <div className={`proc-td-icon-box ${hasProc ? "icon-active" : "icon-neutral"}`}>
                        {hasProc ? (
                          <ProcessIcon width={14} height={14} />
                        ) : (
                          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" />
                          </svg>
                        )}
                      </div>
                      <div className="proc-td-title-wrapper">
                        <span className="proc-td-card-title">{displayTitle}</span>
                        {hasProc && proc.title && (
                          <span className="proc-td-proc-subtitle">{proc.title}</span>
                        )}
                      </div>
                    </div>

                    {/* Col 2: List Name */}
                    <div className="proc-td-col col-list">
                      <span
                        className="proc-td-list-badge"
                        style={{
                          backgroundColor: listBadge.bg,
                          color: listBadge.text,
                          borderColor: listBadge.border,
                        }}
                      >
                        {listName}
                      </span>
                    </div>

                    {/* Col 3: Progress */}
                    <div className="proc-td-col col-progress">
                      {hasProc ? (
                        <div className="proc-td-progress-group">
                          <div className="proc-td-mini-dashes">
                            {proc.steps.map((st, sIdx) => (
                              <span
                                key={st.id || sIdx}
                                className={`proc-td-dash ${
                                  st.status === "done"
                                    ? "dash-done"
                                    : st.status === "held"
                                    ? "dash-held"
                                    : "dash-todo"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="proc-td-progress-count">
                            {stats.done}/{stats.total}
                          </span>
                        </div>
                      ) : (
                        <span className="proc-td-empty-dash">—</span>
                      )}
                    </div>

                    {/* Col 4: Status */}
                    <div className="proc-td-col col-status">
                      {hasProc ? (
                        isHeld ? (
                          <span className="proc-table-status-pill pill-amber">
                            <span className="proc-status-dot dot-amber"></span>
                            {stats.held} on hold
                          </span>
                        ) : isAllDone ? (
                          <span className="proc-table-status-pill pill-done">
                            <span className="proc-status-dot dot-done"></span>
                            Complete
                          </span>
                        ) : (
                          <span className="proc-table-status-pill pill-inprogress">
                            <span className="proc-status-dot dot-inprogress"></span>
                            In Progress
                          </span>
                        )
                      ) : (
                        <span className="proc-table-status-pill pill-neutral">
                          <span className="proc-status-dot dot-neutral"></span>
                          No process
                        </span>
                      )}
                    </div>

                    {/* Col 5: Assignee */}
                    <div className="proc-td-col col-assignee">
                      {memberObj ? (
                        <div className="proc-td-assignee-cell" title={memberObj.name}>
                          <span
                            className="proc-td-avatar"
                            style={{ background: memberObj.bg, color: memberObj.text }}
                          >
                            {memberObj.initials}
                          </span>
                          <span className="proc-td-member-name">{memberObj.name}</span>
                        </div>
                      ) : (
                        <span className="proc-td-unassigned">Unassigned</span>
                      )}
                    </div>

                    {/* Col 6: Actions */}
                    <div className="proc-td-col col-actions">
                      {hasProc ? (
                        <button
                          type="button"
                          className="proc-table-action-btn btn-open"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCard(card);
                          }}
                        >
                          Open
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="proc-table-action-btn btn-setup"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCard(card);
                          }}
                        >
                          <PlusIcon width={11} height={11} /> Set Up
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
