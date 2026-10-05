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
import CardBackSection from "./CardBackSection.jsx";

export default function CanvasApp({ t }) {
  const [boardName, setBoardName] = useState("My Trello board");
  const [lists, setLists] = useState(INITIAL_BOARD_LISTS);
  const [cards, setCards] = useState([]);
  const [members, setMembers] = useState(getAllAvailableMembers());
  const [selectedCard, setSelectedCard] = useState(null);
  const [isDirectCardMode, setIsDirectCardMode] = useState(false);
  const [isCardBackMode, setIsCardBackMode] = useState(() => {
    if (typeof window !== "undefined" && window.location) {
      const p = new URLSearchParams(window.location.search);
      return p.get("view") === "card-back-section" || p.get("view") === "card-back";
    }
    return false;
  });
  const [loading, setLoading] = useState(true);

  // Initialize and check Trello context
  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (t) {
        // 1. FIRST check if opened inside a card context (card-button or card-back-section)
        let resolvedCard = null;
        if (typeof t.card === "function") {
          try {
            const activeTrelloCard = await t.card("id", "name", "desc", "idList", "idMembers", "labels", "due");
            if (activeTrelloCard && activeTrelloCard.id) {
              let cleanDesc = activeTrelloCard.desc || "";
              if (cleanDesc.includes("cardlytics:") || cleanDesc.includes("tracked by Cardlytics")) {
                cleanDesc = cleanDesc.split("\n").filter((l) => !l.includes("cardlytics") && !l.includes("tracked by Cardlytics")).join("\n").trim();
              }

              resolvedCard = {
                id: activeTrelloCard.id,
                listId: activeTrelloCard.idList || "list-1",
                title: activeTrelloCard.name || "Card Workflow",
                description: cleanDesc || "Generated from Lean Canvas (Solution)",
                assignees: activeTrelloCard.idMembers || [],
                labels: (activeTrelloCard.labels || []).map((l) => ({ name: l.name || l.color, color: l.color })),
                due: activeTrelloCard.due,
              };
              if (isMounted) {
                setSelectedCard(resolvedCard);
                setIsDirectCardMode(true);
              }
            }
          } catch (e) {
            console.warn("Could not read card context:", e);
          }
        }

        // 2. Fetch Board Data
        const trelloData = await fetchTrelloBoardData(t);
        if (isMounted) {
          if (trelloData) {
            if (trelloData.boardName) setBoardName(trelloData.boardName);
            if (trelloData.lists && trelloData.lists.length > 0) {
              setLists(trelloData.lists);
            }
            if (trelloData.cards && trelloData.cards.length > 0) {
              setCards(trelloData.cards);
              saveBoardCards(trelloData.cards);
            }
          }
          setMembers(getAllAvailableMembers());
          setLoading(false);
        }
        return;
      }

      // Standalone dev preview fallback (ONLY in local preview without Trello iframe host)
      if (isMounted) {
        const localCards = loadBoardCards();
        setCards(localCards);
        setLists(INITIAL_BOARD_LISTS);
        setMembers(getAllAvailableMembers());
        if (localCards.length > 0) {
          setSelectedCard(localCards[0]);
        }
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

  function handleOpenFullModal(cardTarget) {
    if (t && typeof t.modal === "function") {
      try {
        t.modal({
          url: "./canvas.html",
          accentColor: "#161b22",
          height: 630,
          fullscreen: false,
          title: "Process Power-Up",
        });
        return;
      } catch (e) {
        console.warn("t.modal() failed, fallback to in-app view:", e);
      }
    }
    // Fallback for standalone sandbox
    setIsCardBackMode(false);
    if (cardTarget) {
      setSelectedCard(cardTarget);
    }
  }

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

  // 1. CARD BACK SECTION VIEW (Iframe embedded in Trello card back)
  if (isCardBackMode) {
    const targetCard = selectedCard || (cards.length > 0 ? cards[0] : null);

    return (
      <div className="proc-cardback-wrapper">
        <CardBackSection
          card={targetCard}
          onOpenFullView={() => handleOpenFullModal(targetCard)}
          t={t}
        />
      </div>
    );
  }

  // 2. FULL PROCESS DETAIL VIEW (In Modal popup or direct card mode)
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

  // 3. MAIN BOARD PROCESSES PICKER (From top board button)
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
