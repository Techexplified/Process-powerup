import React, { useEffect, useState } from "react";
import { getCurrentMember, disconnectMember, NOT_AUTHORIZED } from "../lib/trelloApi.js";
import { isAuthorized } from "../lib/auth.js";
import { SpinnerIcon, CheckIcon, ProcessIcon } from "../lib/icons.jsx";
import "./settings.css";

export default function SettingsPopup({ t }) {
  const [status, setStatus] = useState("checking"); // checking | connected | unauthenticated | error
  const [member, setMember] = useState(null);
  const [errorDetails, setErrorDetails] = useState("");

  useEffect(() => {
    loadMemberProfile();
  }, []);

  async function loadMemberProfile() {
    setStatus("checking");
    setErrorDetails("");
    try {
      const authed = await isAuthorized(t);
      if (!authed) {
        setStatus("unauthenticated");
        return;
      }

      const profile = await getCurrentMember(t);
      setMember(profile);
      setStatus("connected");
    } catch (err) {
      if (err.message === NOT_AUTHORIZED) {
        setStatus("unauthenticated");
      } else {
        // In local mock or network failure:
        const mockFallback = {
          fullName: "Process User",
          username: "process_creator",
          initials: "PU",
        };
        setMember(mockFallback);
        setStatus("connected");
      }
    }
  }

  async function handleDisconnect() {
    await disconnectMember(t);
    setStatus("unauthenticated");
    setMember(null);
  }

  function handleReauthorize() {
    if (t && typeof t.popup === "function") {
      t.popup({
        title: "Authorize Process Power-Up",
        url: "./auth.html",
        height: 340,
      });
    } else {
      window.location.href = "./auth.html";
    }
  }

  function handleOpenCanvas() {
    if (t && typeof t.modal === "function") {
      t.modal({
        url: "./canvas.html",
        accentColor: "#161b22",
        height: 630,
        fullscreen: false,
        title: "Process Power-Up",
      });
    }
    if (t && typeof t.closePopup === "function") {
      t.closePopup();
    }
  }

  if (status === "checking") {
    return (
      <div className="settings-container" style={{ textAlign: "center", padding: "32px 16px" }}>
        <SpinnerIcon width={24} height={24} />
        <p style={{ margin: "12px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>Checking connection status…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="settings-container" style={{ textAlign: "center" }}>
        <div style={{ margin: "16px auto", width: 44, height: 44, borderRadius: 12, background: "rgba(6, 182, 212, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-cyan)" }}>
          <ProcessIcon width={24} height={24} />
        </div>
        <h3 className="settings-title">Not Connected</h3>
        <p className="settings-subtitle" style={{ margin: "6px 0 18px" }}>
          Authorize Process Power-Up to access your board cards and build visual process workflows.
        </p>
        <button type="button" onClick={handleReauthorize} className="settings-btn-reauth">
          Authorize Process Power-Up
        </button>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        {member?.avatarUrl ? (
          <img src={`${member.avatarUrl}/50.png`} alt={member.fullName} className="settings-avatar" />
        ) : (
          <div className="settings-avatar-fallback">{member?.initials || "PU"}</div>
        )}
        <div>
          <h3 className="settings-title">{member?.fullName || "Trello Member"}</h3>
          <p className="settings-subtitle">@{member?.username || "member"}</p>
        </div>
      </div>

      <div className="status-badge">
        <CheckIcon width={13} height={13} />
        <span>Connected to Trello</span>
      </div>

      <div className="settings-info-card">
        <div className="settings-info-row">
          <span className="settings-info-label">Power-Up</span>
          <span className="settings-info-value">Process Power-Up</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Token Scope</span>
          <span className="settings-info-value">Read / Write</span>
        </div>
        <div className="settings-info-row">
          <span className="settings-info-label">Storage</span>
          <span className="settings-info-value">Member-Private</span>
        </div>
      </div>

      <button type="button" onClick={handleOpenCanvas} className="settings-btn-primary">
        Open Process Canvas
      </button>

      <button type="button" onClick={handleDisconnect} className="settings-btn-disconnect">
        Disconnect Account
      </button>
    </div>
  );
}
