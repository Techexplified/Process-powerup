// Central Process & Card Store with dynamic Trello board sync and LocalStorage persistence
import { apiFetch } from "./trelloApi.js";

// Palette generator for member avatars
const MEMBER_COLORS = [
  { bg: "#065f46", text: "#34d399" }, // Emerald
  { bg: "#1e40af", text: "#60a5fa" }, // Blue
  { bg: "#581c87", text: "#c084fc" }, // Purple
  { bg: "#0e7490", text: "#38bdf8" }, // Cyan
  { bg: "#b45309", text: "#fbbf24" }, // Amber
  { bg: "#9f1239", text: "#fb7185" }, // Rose
  { bg: "#3730a3", text: "#a5b4fc" }, // Indigo
  { bg: "#064e3b", text: "#6ee7b7" }, // Teal
];

export function getMemberColor(id = "") {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MEMBER_COLORS.length;
  return MEMBER_COLORS[index];
}

// In-memory cache for dynamic board members
let dynamicMembersMap = new Map();

export const DEFAULT_MEMBERS = [
  { id: "SC", initials: "SC", name: "Sarah Connor", bg: "#065f46", text: "#34d399", role: "SecOps Lead" },
  { id: "AR", initials: "AR", name: "Alex Rivera", bg: "#1e40af", text: "#60a5fa", role: "Backend Engineer" },
  { id: "ER", initials: "ER", name: "Elena Rostova", bg: "#581c87", text: "#c084fc", role: "QA Engineer" },
  { id: "MV", initials: "MV", name: "Marcus Vance", bg: "#0e7490", text: "#38bdf8", role: "DevOps Engineer" },
  { id: "DH", initials: "DH", name: "Devon Hayes", bg: "#b45309", text: "#fbbf24", role: "IT SecOps" },
];

export const TEAM_MEMBERS = DEFAULT_MEMBERS;

export const INITIAL_BOARD_LISTS = [
  { id: "list-backlog", title: "Backlog" },
  { id: "list-in-progress", title: "In Progress" },
  { id: "list-deployment", title: "Deployment Gate" },
  { id: "list-done", title: "Done" },
];

export const INITIAL_CARDS = [
  {
    id: "card-deploy-gate",
    listId: "list-deployment",
    title: "Deployment Gate & Production Verification",
    description: "Final verification and approval pipeline before triggering production container deployment.",
    assignees: ["SC", "AR", "ER"],
    labels: [{ name: "Release", color: "purple" }, { name: "High Priority", color: "red" }],
    createdAt: "2026-10-01",
  },
  {
    id: "card-oauth-hardening",
    listId: "list-in-progress",
    title: "OAuth2 Token Exchange & API Hardening",
    description: "Implement rate-limiting and rotating secrets for OAuth endpoints.",
    assignees: ["SC", "AR"],
    labels: [{ name: "Security", color: "blue" }],
    createdAt: "2026-10-02",
  },
  {
    id: "card-stripe-checkout",
    listId: "list-backlog",
    title: "Stripe Checkout & Billing Webhook Engine",
    description: "Support multi-currency invoicing and automatic payment retry webhooks.",
    assignees: ["AR", "MV"],
    labels: [{ name: "Feature", color: "green" }],
    createdAt: "2026-10-03",
  },
  {
    id: "card-ws-latency",
    listId: "list-backlog",
    title: "Real-time WebSocket Latency Optimization",
    description: "Audit edge gateway connections and reduce round-trip ping latency under 80ms.",
    assignees: ["MV", "DH"],
    labels: [{ name: "Performance", color: "yellow" }],
    createdAt: "2026-10-04",
  },
  {
    id: "card-soc2-audit",
    listId: "list-done",
    title: "Quarterly SOC2 Compliance Audit",
    description: "Access logs, role segregation, and database snapshot verification.",
    assignees: ["SC", "DH"],
    labels: [{ name: "Compliance", color: "cyan" }],
    createdAt: "2026-09-28",
  },
];

export const INITIAL_PROCESS_BY_CARD = {
  "card-deploy-gate": {
    enabled: true,
    title: "Deployment & Verification Process",
    description: "Mandatory verification workflow before triggering production deployment gate.",
    dueDate: "2026-10-12",
    status: "Active",
    steps: [
      {
        id: "step-1",
        name: "Audit OAuth2 token exchange endpoints for rate-limiting vulnerability",
        description: "Ensure token endpoints are protected against brute force attempts.",
        status: "done",
        targetDate: "2026-10-02",
        assignees: ["SC"],
        holdReasons: [],
      },
      {
        id: "step-2",
        name: "Verify third-party SMS verification provider API latency under 200ms",
        description: "Run benchmark against vendor staging webhook.",
        status: "held",
        targetDate: "2026-10-08",
        assignees: ["AR"],
        holdReasons: [
          {
            id: "hr-1",
            reason: "Twilio staging webhook test credentials expired. Waiting on IT SecOps renewal.",
            taggedPeople: ["DH"],
            createdAt: "2026-10-05T10:30:00Z",
          },
        ],
      },
      {
        id: "step-3",
        name: "Execute cross-browser Cypress regression suite on Chrome, Firefox, Safari",
        description: "Verify checkout and login flows on all major desktop browsers.",
        status: "held",
        targetDate: "2026-10-10",
        assignees: ["ER"],
        holdReasons: [
          {
            id: "hr-2",
            reason: "Security certificate renewal pending on staging cluster.",
            taggedPeople: ["DH", "MV"],
            createdAt: "2026-10-06T14:15:00Z",
          },
          {
            id: "hr-3",
            reason: "Safari webkit headless runner experiencing intermittent timeout.",
            taggedPeople: ["ER"],
            createdAt: "2026-10-07T09:00:00Z",
          },
        ],
      },
      {
        id: "step-4",
        name: "Final security sanity test & production container deployment",
        description: "Verify production rollout readiness with release manager.",
        status: "pending",
        targetDate: "2026-10-12",
        assignees: ["ER", "MV"],
        holdReasons: [],
      },
    ],
  },
  "card-oauth-hardening": {
    enabled: true,
    title: "OAuth2 Hardening Workflow",
    description: "Endpoint security review and rate limiting verification.",
    dueDate: "2026-10-14",
    status: "Active",
    steps: [
      {
        id: "step-201",
        name: "Review JWT key rotation algorithm",
        description: "Verify automated secret rotation via Vault.",
        status: "done",
        targetDate: "2026-10-05",
        assignees: ["SC"],
        holdReasons: [],
      },
      {
        id: "step-202",
        name: "Stress test token issuance under 5000 req/sec",
        description: "Run k6 load test against auth service staging endpoint.",
        status: "pending",
        targetDate: "2026-10-09",
        assignees: ["AR"],
        holdReasons: [],
      },
    ],
  },
};

const STORAGE_KEY_CARDS = "process_powerup_board_cards_v1";
const STORAGE_KEY_PROCESS_PREFIX = "process_powerup_card_";

/**
 * Register dynamic members fetched from Trello
 */
export function registerDynamicMembers(members = []) {
  members.forEach((m) => {
    if (m && m.id) {
      const color = getMemberColor(m.id);
      dynamicMembersMap.set(m.id, {
        id: m.id,
        initials: m.initials || (m.fullName || m.username || "MB").substring(0, 2).toUpperCase(),
        name: m.fullName || m.username || "Member",
        avatar: m.avatar || m.avatarUrl || null,
        bg: color.bg,
        text: color.text,
      });
    }
  });
}

/**
 * Get member object by ID
 */
export function getMemberById(id) {
  if (!id) return { id: "unknown", initials: "?", name: "Unknown", bg: "#334155", text: "#cbd5e1" };
  
  if (dynamicMembersMap.has(id)) {
    return dynamicMembersMap.get(id);
  }

  const defaultFound = DEFAULT_MEMBERS.find((m) => m.id === id);
  if (defaultFound) return defaultFound;

  const color = getMemberColor(id);
  return {
    id,
    initials: id.substring(0, 2).toUpperCase(),
    name: id,
    bg: color.bg,
    text: color.text,
  };
}

/**
 * Get all available members
 */
export function getAllAvailableMembers() {
  if (dynamicMembersMap.size > 0) {
    return Array.from(dynamicMembersMap.values());
  }
  return DEFAULT_MEMBERS;
}

/**
 * Robustly fetch live data from Trello board (lists, cards, members)
 */
export async function fetchTrelloBoardData(t) {
  if (!t) return null;

  try {
    let boardInfo = null;
    let membersList = [];

    // 1. Fetch Board Info and Members via Trello client
    if (typeof t.board === "function") {
      try {
        boardInfo = await t.board("id", "name", "members");
        if (boardInfo && boardInfo.members) {
          membersList = boardInfo.members;
          registerDynamicMembers(membersList);
        }
      } catch (e) {
        try {
          boardInfo = await t.board("all");
          if (boardInfo && boardInfo.members) {
            registerDynamicMembers(boardInfo.members);
          }
        } catch (e2) {
          console.warn("Could not fetch board info:", e2);
        }
      }
    }

    // 2. Fetch Active Member
    if (typeof t.member === "function") {
      try {
        const activeMember = await t.member("id", "fullName", "username", "initials", "avatar");
        if (activeMember && activeMember.id) {
          registerDynamicMembers([activeMember]);
        }
      } catch (e) {
        try {
          const activeMember = await t.member("all");
          if (activeMember && activeMember.id) {
            registerDynamicMembers([activeMember]);
          }
        } catch (e2) {}
      }
    }

    // 3. Fetch Real Lists with fallbacks
    let rawLists = null;
    if (typeof t.lists === "function") {
      try {
        rawLists = await t.lists("all");
      } catch (e) {
        try {
          rawLists = await t.lists("id", "name");
        } catch (e2) {
          try {
            rawLists = await t.lists();
          } catch (e3) {}
        }
      }
    }

    // 4. Fetch Real Cards with fallbacks
    let rawCards = null;
    if (typeof t.cards === "function") {
      try {
        rawCards = await t.cards("all");
      } catch (e) {
        try {
          rawCards = await t.cards("id", "name", "desc", "idList", "idMembers", "labels", "due", "badges");
        } catch (e2) {
          try {
            rawCards = await t.cards();
          } catch (e3) {}
        }
      }
    }

    // 5. REST API Fallback if lists or cards returned empty
    if ((!rawLists || rawLists.length === 0) && boardInfo && boardInfo.id) {
      try {
        const restLists = await apiFetch(t, `/boards/${boardInfo.id}/lists`, {
          params: {
            cards: "open",
            card_fields: "id,name,desc,idList,idMembers,labels,due,badges",
          },
        });
        if (Array.isArray(restLists) && restLists.length > 0) {
          rawLists = restLists;
          rawCards = [];
          restLists.forEach((list) => {
            if (Array.isArray(list.cards)) {
              rawCards.push(...list.cards);
            }
          });
        }
      } catch (apiErr) {
        console.warn("apiFetch fallback for lists failed:", apiErr);
      }
    }

    // Map lists
    const lists = Array.isArray(rawLists) && rawLists.length > 0
      ? rawLists.map((l) => ({
          id: l.id,
          title: l.name || l.title || "List",
        }))
      : INITIAL_BOARD_LISTS;

    // Map cards
    const cards = Array.isArray(rawCards) && rawCards.length > 0
      ? rawCards.map((c) => ({
          id: c.id,
          listId: c.idList || c.listId || (lists[0]?.id || "list-1"),
          title: c.name || c.title || "Card",
          description: c.desc || c.description || "",
          assignees: c.idMembers || c.assignees || [],
          labels: (c.labels || []).map((lbl) => ({
            name: lbl.name || lbl.color || "Label",
            color: lbl.color || "blue",
          })),
          due: c.due || null,
        }))
      : [];

    return {
      boardName: boardInfo?.name || "Trello Board",
      lists,
      cards,
      members: getAllAvailableMembers(),
    };
  } catch (err) {
    console.warn("Failed to fetch live Trello board data, using local state:", err);
    return null;
  }
}

/**
 * Load all cards on the board
 */
export function loadBoardCards() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CARDS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load cards from storage:", e);
  }
  return INITIAL_CARDS;
}

/**
 * Save all cards to local storage
 */
export function saveBoardCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error("Failed to save cards to storage:", e);
  }
}

/**
 * Load process data for a specific card
 */
export async function loadCardProcess(cardId, t = null, cardTitle = "", cardDesc = "") {
  if (!cardId) return null;

  // 1. Try loading from Trello Power-Up card-shared storage
  if (t && typeof t.get === "function") {
    try {
      const trelloData = await t.get("card", "shared", "processData");
      if (trelloData && trelloData.enabled !== undefined) {
        return trelloData;
      }
    } catch (e) {
      console.warn("Could not read from Trello storage:", e);
    }
  }

  // 2. Try loading from LocalStorage
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PROCESS_PREFIX}${cardId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load process for card:", cardId, e);
  }

  // 3. Fallback to sample initial process only for designated sample cards
  if (INITIAL_PROCESS_BY_CARD[cardId]) {
    return JSON.parse(JSON.stringify(INITIAL_PROCESS_BY_CARD[cardId]));
  }

  // Default clean process structure (disabled) using actual card name
  return {
    enabled: false,
    title: cardTitle ? `${cardTitle} Workflow` : "Deployment & Verification Process",
    description: cardDesc || "Manage multi-step workflows, step assignees, hold reasons, dates.",
    dueDate: "",
    status: "Draft",
    steps: [],
  };
}

/**
 * Save process data for a specific card
 */
export async function saveCardProcess(cardId, processData, t = null) {
  if (!cardId) return;

  // 1. Save to LocalStorage
  try {
    localStorage.setItem(`${STORAGE_KEY_PROCESS_PREFIX}${cardId}`, JSON.stringify(processData));
  } catch (e) {
    console.error("Failed to save process to localStorage:", e);
  }

  // 2. Save to Trello Power-Up card-shared storage
  if (t && typeof t.set === "function") {
    try {
      await t.set("card", "shared", "processData", processData);
    } catch (e) {
      console.warn("Could not save to Trello storage:", e);
    }
  }
}

/**
 * Calculate dynamic process metrics from steps
 */
export function calculateProcessStats(steps = []) {
  const total = steps.length;
  const done = steps.filter((s) => s.status === "done").length;
  const held = steps.filter((s) => s.status === "held").length;
  const pending = steps.filter((s) => s.status === "pending").length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    total,
    done,
    held,
    pending,
    percent,
  };
}
