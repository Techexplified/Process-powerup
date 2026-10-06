/* global TrelloPowerUp */
import React from "react";
import ReactDOM from "react-dom/client";
import CanvasApp from "./CanvasApp.jsx";

let t = null;
try {
  if (typeof TrelloPowerUp !== "undefined" && typeof TrelloPowerUp.iframe === "function") {
    t = TrelloPowerUp.iframe();
  }
} catch (e) {}

if (!t) {
  t = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    closeModal: () => {},
    sizeTo: () => Promise.resolve(),
    modal: () => Promise.resolve(),
    popup: () => Promise.resolve(),
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CanvasApp t={t} />
  </React.StrictMode>
);
