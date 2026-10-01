import React, { useState, useEffect } from "react";
import "./canvas.css";
import {
  INITIAL_BOARD_LISTS,
  loadBoardCards,
  saveBoardCards,
  fetchTrelloBoardData,
  getAllAvailableMembers,
} from "../lib/processStore.js";
import { ProcessIcon } from "../lib/icons.jsx";
import BoardCard from "./BoardCard.jsx";
import CardDetailModal from "./CardDetailModal.jsx";
import AddCardModal from "./AddCardModal.jsx";

export default function CanvasApp({ t }) {
  const [boardName, setBoardName] = useState("Process & Workflow Board");
  const [lists, setLists] = useState(INITIAL_BOARD_LISTS);
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState(getAllAvailableMembers());
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberFilter, setSelectedMemberFilter] = useState("all");
  const [selectedListTab, setSelectedListTab] = useState("all");
  const [layoutMode, setLayoutMode] = useState("grouped"); // 'grouped' (vertical no scroll) | 'tabs' | 'kanban'
  const [collapsedLists, setCollapsedLists] = useState({});
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [isTrelloSynced, setIsTrelloSynced] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and check Trello context
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      // 1. Fetch live Trello Board data (lists, cards, members)
      if (t) {
        const trelloData = await fetchTrelloBoardData(t);
        if (isMounted && trelloData) {
          if (trelloData.boardName) setBoardName(trelloData.boardName);
          if (trelloData.lists && trelloData.lists.length > 0) {
            setLists(trelloData.lists);
          }
          if (trelloData.cards && trelloData.cards.length > 0) {
            setCards(trelloData.cards);
            saveBoardCards(trelloData.cards);
          } else {
            setCards(loadBoardCards());
          }
          setMembers(getAllAvailableMembers());
          setIsTrelloSynced(true);
          setLoading(false);

          // If opened on a specific Trello card (card button or card back section)
          if (typeof t.card === "function") {
            try {
              const currentTrelloCard = await t.card("id", "name", "desc", "idList", "idMembers", "labels", "due");
              if (currentTrelloCard && currentTrelloCard.id) {
                const matchedCard = (trelloData.cards || []).find((c) => c.id === currentTrelloCard.id) || {
                  id: currentTrelloCard.id,
                  listId: currentTrelloCard.idList || (trelloData.lists[0]?.id || "list-1"),
                  title: currentTrelloCard.name || "Card Workflow",
                  description: currentTrelloCard.desc || "",
                  assignees: currentTrelloCard.idMembers || [],
                  labels: (currentTrelloCard.labels || []).map((l) => ({ name: l.name || l.color, color: l.color })),
                  due: currentTrelloCard.due,
                };
                setSelectedCard(matchedCard);
              }
            } catch (e) {
              console.warn("Could not read active card context:", e);
            }
          }
          return;
        }
      }

      // 2. Fallback to LocalStorage data for standalone dev mode
      if (isMounted) {
        const localCards = loadBoardCards();
        setCards(localCards);
        setLists(INITIAL_BOARD_LISTS);
        setMembers(getAllAvailableMembers());
        setLoading(false);
      }
    }

    initData();

    // Auto-size Trello modal if supported
    if (t && typeof t.sizeTo === "function") {
      t.sizeTo("#root").catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [t]);

  // Save cards when updated
  function handleUpdateCards(updatedCards) {
    setCards(updatedCards);
    saveBoardCards(updatedCards);
  }

  // Add new card
  function handleAddCard(newCard) {
    const updated = [...cards, newCard];
    handleUpdateCards(updated);
    // Open the newly created card directly
    setSelectedCard(newCard);
  }

  // Delete card from board
  function handleDeleteCard(cardId) {
    const updated = cards.filter((c) => c.id !== cardId);
    handleUpdateCards(updated);
    setSelectedCard(null);
  }

  // Toggle list collapse in Grouped view
  function toggleListCollapse(listId) {
    setCollapsedLists((prev) => ({
      ...prev,
      [listId]: !prev[listId],
    }));
  }

  // Filter cards by search, member, and optional list tab
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMember =
      selectedMemberFilter === "all" ||
      (c.assignees && c.assignees.includes(selectedMemberFilter));

    const matchesTab =
      layoutMode !== "tabs" ||
      selectedListTab === "all" ||
      c.listId === selectedListTab;

    return matchesSearch && matchesMember && matchesTab;
  });

  return (
    <div className="proc-app-wrapper">
      {/* 1. TOP APP HEADER */}
      <header className="proc-top-header">
        <div className="proc-top-header-left">
          <div className="proc-app-logo">
            <ProcessIcon width={22} height={22} />
          </div>
          <div className="proc-header-titles">
            <div className="proc-board-title-row">
              <h1 className="proc-board-title">{boardName}</h1>
              <span className="proc-powerup-badge">
                {isTrelloSynced ? "⚡ Live Trello Sync" : "⚡ Process Power-Up"}
              </span>
            </div>
            <p className="proc-board-subtitle">
              Configure multi-step workflows, step assignees, blockers & hold reasons.
            </p>
          </div>
        </div>

        {/* Header Controls: Search, Member Filter, Layout Switcher, Add Card */}
        <div className="proc-top-header-right">
          {/* Search Box */}
          <div className="proc-search-box">
            <span className="proc-search-icon">🔍</span>
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
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Member Filter Dropdown */}
          <div className="proc-member-filter-group">
            <select
              className="proc-member-filter-select"
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              title="Filter cards by member"
            >
              <option value="all">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.initials ? `(${m.initials})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Modern Layout Switcher (No Horizontal Scroll!) */}
          <div className="proc-layout-switcher" title="Switch layout view">
            <button
              type="button"
              className={`proc-layout-btn ${layoutMode === "grouped" ? "active" : ""}`}
              onClick={() => setLayoutMode("grouped")}
              title="Grouped Lists View (Vertical scroll - No horizontal scrolling)"
            >
              📋 Grouped
            </button>
            <button
              type="button"
              className={`proc-layout-btn ${layoutMode === "tabs" ? "active" : ""}`}
              onClick={() => setLayoutMode("tabs")}
              title="List Tabs View (Filter by List)"
            >
              🏷️ Tabs
            </button>
            <button
              type="button"
              className={`proc-layout-btn ${layoutMode === "kanban" ? "active" : ""}`}
              onClick={() => setLayoutMode("kanban")}
              title="Kanban Board Columns"
            >
              ▦ Columns
            </button>
          </div>

          <button
            type="button"
            className="proc-btn proc-btn-primary proc-add-card-btn"
            onClick={() => setShowAddCardModal(true)}
          >
            + New Card
          </button>
        </div>
      </header>

      {/* List Tabs Bar (when in Tabs mode) */}
      {layoutMode === "tabs" && (
        <div className="proc-list-tabs-bar custom-slim-scrollbar">
          <button
            type="button"
            className={`proc-list-tab-pill ${selectedListTab === "all" ? "active" : ""}`}
            onClick={() => setSelectedListTab("all")}
          >
            All Cards <span className="tab-pill-count">{filteredCards.length}</span>
          </button>
          {lists.map((list) => {
            const count = cards.filter((c) => c.listId === list.id).length;
            return (
              <button
                key={list.id}
                type="button"
                className={`proc-list-tab-pill ${selectedListTab === list.id ? "active" : ""}`}
                onClick={() => setSelectedListTab(list.id)}
              >
                {list.title} <span className="tab-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. MAIN BOARD CONTENT */}
      <main className="proc-main-content custom-slim-scrollbar">
        {loading ? (
          <div className="proc-loading-state">
            <div className="proc-spinner"></div>
            <span>Loading live board data...</span>
          </div>
        ) : layoutMode === "grouped" ? (
          /* =========================================================
             MODE A: VERTICAL GROUPED LIST VIEW (NO HORIZONTAL SCROLL)
             ========================================================= */
          <div className="proc-vertical-grouped-view">
            {lists.map((list) => {
              const listCards = filteredCards.filter((c) => c.listId === list.id);
              const isCollapsed = collapsedLists[list.id];

              return (
                <section key={list.id} className="proc-grouped-section">
                  <div
                    className="proc-grouped-header"
                    onClick={() => toggleListCollapse(list.id)}
                  >
                    <div className="proc-grouped-header-left">
                      <span className="proc-grouped-arrow">
                        {isCollapsed ? "▶" : "▼"}
                      </span>
                      <h3 className="proc-grouped-title">{list.title}</h3>
                      <span className="proc-grouped-count">{listCards.length} cards</span>
                    </div>

                    <button
                      type="button"
                      className="proc-grouped-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddCardModal(true);
                      }}
                      title={`Add card to ${list.title}`}
                    >
                      + Add Card
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="proc-grouped-cards-grid">
                      {listCards.length === 0 ? (
                        <div className="proc-grouped-empty">
                          <span>No cards in this list</span>
                        </div>
                      ) : (
                        listCards.map((card) => (
                          <BoardCard
                            key={card.id}
                            card={card}
                            onSelectCard={(c) => setSelectedCard(c)}
                            t={t}
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        ) : layoutMode === "tabs" ? (
          /* =========================================================
             MODE B: LIST TABS GRID VIEW
             ========================================================= */
          <div className="proc-tabs-grid-container">
            <div className="proc-tabs-grid">
              {filteredCards.length === 0 ? (
                <div className="proc-tab-empty-box">
                  <p>No cards match the current list or filter.</p>
                </div>
              ) : (
                filteredCards.map((card) => (
                  <BoardCard
                    key={card.id}
                    card={card}
                    onSelectCard={(c) => setSelectedCard(c)}
                    t={t}
                  />
                ))
              )}
            </div>
          </div>
        ) : (
          /* =========================================================
             MODE C: CLASSIC KANBAN COLUMNS
             ========================================================= */
          <div className="proc-board-columns custom-slim-scrollbar">
            {lists.map((list) => {
              const listCards = filteredCards.filter((c) => c.listId === list.id);

              return (
                <div key={list.id} className="proc-board-column">
                  <div className="proc-column-header">
                    <div className="proc-column-title-group">
                      <h3 className="proc-column-title">{list.title}</h3>
                      <span className="proc-column-count">{listCards.length}</span>
                    </div>
                    <button
                      type="button"
                      className="proc-column-add-btn"
                      onClick={() => setShowAddCardModal(true)}
                      title={`Add card to ${list.title}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="proc-column-cards custom-slim-scrollbar">
                    {listCards.length === 0 ? (
                      <div className="proc-column-empty">
                        <span>No cards in this list</span>
                      </div>
                    ) : (
                      listCards.map((card) => (
                        <BoardCard
                          key={card.id}
                          card={card}
                          onSelectCard={(c) => setSelectedCard(c)}
                          t={t}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. CARD DETAIL MODAL (With Embedded Process Power-Up for the Selected Card) */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => {
            setSelectedCard(null);
            setCards([...loadBoardCards()]);
          }}
          onDeleteCard={handleDeleteCard}
          t={t}
        />
      )}

      {/* 4. ADD CARD MODAL */}
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onAddCard={handleAddCard}
        lists={lists}
        members={members}
      />
    </div>
  );
}
