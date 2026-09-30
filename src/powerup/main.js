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
            height: 560,
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
            height: 560,
            fullscreen: false,
            title: "Process Power-Up",
          });
        },
      },
    ];
  },

  // Card Back Section: Embeds the Processes Multi-Step Workflow UI directly on the back of cards
  "card-back-section": function (t) {
    return {
      title: "Processes",
      icon: ICON_URL,
      content: {
        type: "iframe",
        url: t.signUrl("./canvas.html"),
        height: 620,
      },
    };
  },

  // Card Badges: Shows step progress & hold alert on front of cards
  "card-badges": async function () {
    return [
      {
        text: "2/4 steps",
        icon: ICON_URL,
        color: "green",
      },
      {
        text: "1 on hold",
        color: "yellow",
      },
    ];
  },
});

