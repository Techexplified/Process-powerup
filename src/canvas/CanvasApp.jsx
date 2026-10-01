import React, { useState, useEffect } from "react";
import "./canvas.css";
import {
  INITIAL_BOARD_LISTS,
  loadBoardCards,
  saveBoardCards,
  TEAM_MEMBERS,
} from "../lib/processStore.js";
import { ProcessIcon } from "../lib/icons.jsx";
import BoardCard from "./BoardCard.jsx";
import CardDetailModal from "./CardDetailModal.jsx";
import AddCardModal from "./AddCardModal.jsx";

export default function CanvasApp({ t }) {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMemberFilter, setSelectedMemberFilter] = useState("all");
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [directCardMode, setDirectCardMode] = useState(false);

  // Initialize and check Trello card context
  useEffect(() => {
    const loadedCards = loadBoardCards();
    setCards(loadedCards);

    // Check if we are running inside a direct Trello card context (e.g., card-back-section or card-button modal)
    if (t && typeof t.card === "function") {
      t.card("id", "name", "desc")
        .then((trelloCard) => {
          if (trelloCard && trelloCard.id) {
            // Find existing or create placeholder
            let matched = loadedCards.find((c) => c.id === trelloCard.id);
            if (!matched) {
              matched = {
                id: trelloCard.id,
                title: trelloCard.name || "Trello Card",
                description: trelloCard.desc || "",
                listId: "list-deployment",
                assignees: ["SC"],
                labels: [{ name: "Trello", color: "purple" }],
              };
            }
            setSelectedCard(matched);
            setDirectCardMode(true);
          }
        })
        .catch(() => {
          // Normal sandbox/board mode
        });
    }

    // Auto-size Trello modal/iframe if supported
    if (t && typeof t.sizeTo === "function") {
      t.sizeTo("#root").catch(() => {});
    }
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

  // Filter cards by search and member
  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMember =
      selectedMemberFilter === "all" ||
      (c.assignees && c.assignees.includes(selectedMemberFilter));

    return matchesSearch && matchesMember;
  });

  return (
    <div className="proc-app-wrapper">
      {/* 1. TOP APP HEADER */}
      <header className="proc-top-header">
        <div className="proc-top-header-left">
          <div className="proc-app-logo">
            <ProcessIcon width={20} height={20} />
          </div>
          <div className="proc-header-titles">
            <div className="proc-board-title-row">
              <h1 className="proc-board-title">Process & Workflow Board</h1>
              <span className="proc-powerup-badge">⚡ Process Power-Up</span>
            </div>
            <p className="proc-board-subtitle">
              Select any card to configure multi-step processes, assignees, blockers & hold reasons.
            </p>
          </div>
        </div>

        {/* Controls: Search, Member Filter, Add Card */}
        <div className="proc-top-header-right">
          <div className="proc-search-box">
            <span className="proc-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search cards or processes..."
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

          <div className="proc-member-filter-group">
            <select
              className="proc-member-filter-select"
              value={selectedMemberFilter}
              onChange={(e) => setSelectedMemberFilter(e.target.value)}
              title="Filter cards by member"
            >
              <option value="all">All Members</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.initials})
                </option>
              ))}
            </select>
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

      {/* 2. KANBAN BOARD VIEW */}
      <main className="proc-board-canvas custom-slim-scrollbar">
        <div className="proc-board-columns">
          {INITIAL_BOARD_LISTS.map((list) => {
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
      </main>

      {/* 3. CARD DETAIL MODAL (With Embedded Process Power-Up for the Selected Card) */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => {
            setSelectedCard(null);
            // Refresh cards to update card badge counters on the board
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
      />
    </div>
  );
}
