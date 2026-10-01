// Central Process & Card Store with persistence support for both Trello Power-Up context and LocalStorage

export const TEAM_MEMBERS = [
  { id: "SC", initials: "SC", name: "Sarah Connor", bg: "#065f46", text: "#34d399", role: "SecOps Lead" },
  { id: "AR", initials: "AR", name: "Alex Rivera", bg: "#1e40af", text: "#60a5fa", role: "Backend Engineer" },
  { id: "ER", initials: "ER", name: "Elena Rostova", bg: "#581c87", text: "#c084fc", role: "QA Engineer" },
  { id: "MV", initials: "MV", name: "Marcus Vance", bg: "#0e7490", text: "#38bdf8", role: "DevOps Engineer" },
  { id: "DH", initials: "DH", name: "Devon Hayes", bg: "#b45309", text: "#fbbf24", role: "IT SecOps" },
];

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
  "card-soc2-audit": {
    enabled: true,
    title: "SOC2 Compliance Verification",
    description: "Verify infrastructure audit trail & IAM access controls.",
    dueDate: "2026-09-30",
    status: "Completed",
    steps: [
      {
        id: "step-301",
        name: "Collect CloudTrail and access logs",
        description: "Archive immutable logs in S3 Glacier bucket.",
        status: "done",
        targetDate: "2026-09-29",
        assignees: ["DH"],
        holdReasons: [],
      },
      {
        id: "step-302",
        name: "Executive sign-off on penetration test results",
        description: "Obtain SecOps leadership sign-off.",
        status: "done",
        targetDate: "2026-09-30",
        assignees: ["SC"],
        holdReasons: [],
      },
    ],
  },
};

const STORAGE_KEY_CARDS = "process_powerup_board_cards_v1";
const STORAGE_KEY_PROCESS_PREFIX = "process_powerup_card_";

/**
 * Get member object by ID
 */
export function getMemberById(id) {
  return TEAM_MEMBERS.find((m) => m.id === id) || {
    id,
    initials: id.substring(0, 2).toUpperCase(),
    name: id,
    bg: "#334155",
    text: "#cbd5e1",
  };
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
export async function loadCardProcess(cardId, t = null) {
  if (!cardId) return null;

  // 1. Try loading from Trello Power-Up card-shared storage
  if (t && typeof t.get === "function") {
    try {
      const trelloData = await t.get("card", "shared", "processData");
      if (trelloData) return trelloData;
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

  // 3. Fallback to initial process if defined for this sample card
  if (INITIAL_PROCESS_BY_CARD[cardId]) {
    return JSON.parse(JSON.stringify(INITIAL_PROCESS_BY_CARD[cardId]));
  }

  // Default empty process structure (disabled)
  return {
    enabled: false,
    title: "Deployment & Verification Process",
    description: "Manage multi-step workflows, step assignees, hold reasons, dates.",
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
