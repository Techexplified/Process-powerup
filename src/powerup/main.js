/* global TrelloPowerUp */
import { isAuthorized } from "../lib/auth.js";

const ICON_URL =
  typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/icons/icon.svg`
    : "./icons/icon.svg";

TrelloPowerUp.initialize({
  // Trello queries this capability to decide whether to prompt the member to authorize
  "authorization-status": async function (t) {
    const authorized = await isAuthorized(t);
    return { authorized };
  },

  // Called when Trello prompts authorization
  "show-authorization": function (t) {
    return t.popup({
      title: "Authorize Process Power-Up",
      url: "./auth.html",
      height: 340,
    });
  },

  // Called when member opens Power-Up settings from the board menu
  "show-settings": function (t) {
    return t.popup({
      title: "Process Power-Up Settings",
      url: "./settings.html",
      height: 290,
    });
  },

  // Adds a Process Power-Up button in the top board header
  "board-buttons": function () {
    return [
      {
        icon: {
          dark: ICON_URL,
          light: ICON_URL,
        },
        text: "Process Power-Up",
        callback: async function (t) {
          const authorized = await isAuthorized(t);
          if (!authorized) {
            return t.popup({
              title: "Authorize Process Power-Up",
              url: "./auth.html",
              height: 340,
            });
          }

          // User is already authorized -> open centered modal dialog with sleek dark header
          return t.modal({
            url: "./canvas.html",
            accentColor: "#161b22",
            height: 630,
            fullscreen: false,
            title: "Process Power-Up",
          });
        },
      },
    ];
  },

  // Card button: quick action on back of card
  "card-buttons": async function () {
    return [
      {
        icon: ICON_URL,
        text: "Process Power-Up",
        callback: async function (t) {
          const authorized = await isAuthorized(t);
          if (!authorized) {
            return t.popup({
              title: "Authorize Process Power-Up",
              url: "./auth.html",
              height: 340,
            });
          }

          // User is authorized -> open centered modal dialog with sleek dark header
          return t.modal({
            url: "./canvas.html",
            accentColor: "#161b22",
            height: 630,
            fullscreen: false,
            title: "Process Power-Up",
          });
        },
      },
    ];
  },

  // Card Badges: Shows dynamic step progress & hold alert on FRONT of cards on the board
  "card-badges": async function (t) {
    try {
      let processData = null;
      try {
        processData = await t.get("card", "shared", "processData");
      } catch (e) {}

      if (!processData && typeof window !== "undefined" && window.localStorage) {
        try {
          const cardInfo = await t.card("id", "name");
          if (cardInfo && cardInfo.id) {
            const saved = localStorage.getItem(`process_powerup_card_${cardInfo.id}`);
            if (saved) {
              processData = JSON.parse(saved);
            }
          }
        } catch (e2) {}
      }

      if (!processData || !processData.enabled || !Array.isArray(processData.steps) || processData.steps.length === 0) {
        return [];
      }

      const total = processData.steps.length;
      const done = processData.steps.filter((s) => s.status === "done").length;
      const held = processData.steps.filter((s) => s.status === "held").length;

      const badges = [
        {
          text: `${done}/${total} steps`,
          icon: ICON_URL,
          color: done === total ? "green" : "blue",
        },
      ];

      if (held > 0) {
        badges.push({
          text: `${held} on hold`,
          color: "yellow",
        });
      }

      return badges;
    } catch (e) {
      return [];
    }
  },

  // Card Back Section: Embeds the interactive Process widget on the back of every Trello card
  "card-back-section": function (t) {
    return {
      title: "Process Power-Up",
      icon: ICON_URL,
      content: {
        type: "iframe",
        url: t.signUrl("./canvas.html?view=card-back-section"),
        height: 220,
      },
      action: {
        text: "Open Full View",
        callback: function (t) {
          return t.modal({
            url: "./canvas.html",
            accentColor: "#161b22",
            height: 630,
            fullscreen: false,
            title: "Process Power-Up",
          });
        },
      },
    };
  },

  // Card Detail Badges: Shows badges below the card title inside the card view
  "card-detail-badges": async function (t) {
    try {
      let processData = null;
      try {
        processData = await t.get("card", "shared", "processData");
      } catch (e) {}

      if (!processData && typeof window !== "undefined" && window.localStorage) {
        try {
          const cardInfo = await t.card("id", "name");
          if (cardInfo && cardInfo.id) {
            const saved = localStorage.getItem(`process_powerup_card_${cardInfo.id}`);
            if (saved) {
              processData = JSON.parse(saved);
            }
          }
        } catch (e2) {}
      }

      if (!processData || !processData.enabled || !Array.isArray(processData.steps) || processData.steps.length === 0) {
        return [];
      }

      const total = processData.steps.length;
      const done = processData.steps.filter((s) => s.status === "done").length;
      const held = processData.steps.filter((s) => s.status === "held").length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;

      const badges = [
        {
          title: "Process",
          text: `${done}/${total} completed (${percent}%)`,
          color: done === total ? "green" : "blue",
          callback: function (t) {
            return t.modal({
              url: "./canvas.html",
              accentColor: "#161b22",
              height: 630,
              fullscreen: false,
              title: "Process Power-Up",
            });
          },
        },
      ];

      if (held > 0) {
        badges.push({
          title: "Status",
          text: `⚠️ ${held} on hold`,
          color: "yellow",
        });
      }

      return badges;
    } catch (e) {
      return [];
    }
  },
});

