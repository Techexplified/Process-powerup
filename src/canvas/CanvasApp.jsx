import React, { useState, useEffect } from "react";
import "./canvas.css";
import {
  INITIAL_BOARD_LISTS,
  loadBoardCards,
  saveBoardCards,
  fetchTrelloBoardData,
  getAllAvailableMembers,
} from "../lib/processStore.js";
import ProcessMainModal from "./ProcessMainModal.jsx";
import ProcessDetailView from "./ProcessDetailView.jsx";

export default function CanvasApp({ t }) {
  const [boardName, setBoardName] = useState("My Trello board");
  const [lists, setLists] = useState(INITIAL_BOARD_LISTS);
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState(getAllAvailableMembers());
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDirectCardMode, setIsDirectCardMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize and check Trello context
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (t) {
        // Fetch Live Board Data
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
          setLoading(false);

          // Check if opened from card-button or card-back-section
          if (typeof t.card === "function") {
            try {
              const activeTrelloCard = await t.card("id", "name", "desc", "idList", "idMembers", "labels", "due");
              if (activeTrelloCard && activeTrelloCard.id) {
                const matched = (trelloData.cards || []).find((c) => c.id === activeTrelloCard.id) || {
                  id: activeTrelloCard.id,
                  listId: activeTrelloCard.idList || (trelloData.lists[0]?.id || "list-1"),
                  title: activeTrelloCard.name || "Card Workflow",
                  description: activeTrelloCard.desc || "",
                  assignees: activeTrelloCard.idMembers || [],
                  labels: (activeTrelloCard.labels || []).map((l) => ({ name: l.name || l.color, color: l.color })),
                  due: activeTrelloCard.due,
                };
                setSelectedCard(matched);
                setIsDirectCardMode(true);
              }
            } catch (e) {
              console.warn("Could not read card context:", e);
            }
          }
          return;
        }
      }

      // Standalone dev preview fallback
      if (isMounted) {
        setCards(loadBoardCards());
        setLists(INITIAL_BOARD_LISTS);
        setMembers(getAllAvailableMembers());
        setLoading(false);
      }
    }

    init();

    if (t && typeof t.sizeTo === "function") {
      t.sizeTo("#root").catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [t]);

  function handleCloseModal() {
    if (t && typeof t.closeModal === "function") {
      try {
        t.closeModal();
        return;
      } catch (e) {}
    }
    setSelectedCard(null);
  }

  if (loading) {
    return (
      <div className="proc-loading-screen">
        <div className="proc-spinner"></div>
        <span>Loading Processes...</span>
      </div>
    );
  }

  // If a card is selected (or in direct card mode): Render the full Process Detail View (Screenshot 2)
  if (selectedCard) {
    return (
      <div className="proc-app-container custom-slim-scrollbar">
        <ProcessDetailView
          card={selectedCard}
          onBack={isDirectCardMode ? null : () => setSelectedCard(null)}
          onClose={handleCloseModal}
          t={t}
        />
      </div>
    );
  }

  // Otherwise: Render the Main Board "Processes" Card Picker Modal (Screenshot 1)
  return (
    <div className="proc-app-container custom-slim-scrollbar">
      <ProcessMainModal
        boardName={boardName}
        lists={lists}
        cards={cards}
        members={members}
        onSelectCard={(c) => setSelectedCard(c)}
        onClose={handleCloseModal}
        t={t}
      />
    </div>
  );
}
