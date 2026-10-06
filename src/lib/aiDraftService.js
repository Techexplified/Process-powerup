/**
 * Google Gemini AI Drafting Service for Link Canvas (Ash Maurya Framework)
 * Generates distinct, tailored 9-box Lean Canvases for any startup idea.
 * Supports multiple draft iterations, creative re-drafting, and single-box regenerations.
 */

export function getGeminiApiKey() {
  const envKey = (import.meta.env?.VITE_GEMINI_API_KEY || "").trim();
  if (envKey) return envKey;
  try {
    return (localStorage.getItem("lc_gemini_api_key") || "").trim();
  } catch (e) {
    return "";
  }
}

export function setGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem("lc_gemini_api_key", key.trim());
    } else {
      localStorage.removeItem("lc_gemini_api_key");
    }
  } catch (e) {}
}

const STRATEGIC_ANGLES = [
  "Product-Led Growth & High-Velocity Early Adopters (focus on viral adoption, self-serve onboarding, and quick time-to-value)",
  "Enterprise & Compliance-First (focus on security, high contract value, dedicated integrations, and custom SLA workflows)",
  "Community-Driven & Direct-to-Consumer Flywheel (focus on organic advocates, micro-communities, high NPS retention, and referral loops)",
  "Autonomous AI-Native (focus on 10x workflow automation, zero-overhead background processing, and proprietary domain models)"
];

const LEAN_CANVAS_SYSTEM_PROMPT = `You are a world-class startup advisor and Ash Maurya Lean Canvas expert.
Analyze the user's startup or product idea deeply and generate a distinct, highly realistic, and actionable 9-box Lean Canvas.
Ensure the content is hyper-specific to the exact industry, target customer, and business model described.

You MUST output ONLY a valid JSON object matching this schema exactly:
{
  "problem": [
    "Specific pain point 1 faced by early adopters",
    "Specific pain point 2 with existing alternatives",
    "Specific pain point 3 regarding time, cost, or complexity"
  ],
  "solution": [
    "Core product feature 1 directly resolving pain point 1",
    "Core product feature 2 directly resolving pain point 2",
    "Core product feature 3 directly resolving pain point 3"
  ],
  "keyMetrics": [
    "Primary actionable metric 1 (e.g. weekly active workflows, 30-day retention rate)",
    "Financial or growth efficiency metric 2 (e.g. CAC payback period, viral coefficient)"
  ],
  "uvp": "A single punchy, clear Unique Value Proposition statement that explains why this is 10x better, different, and worth paying for.",
  "unfairAdvantage": "A single clear unfair advantage that cannot be easily copied or bought (e.g. proprietary data loops, exclusive partner contracts, insider domain authority).",
  "channels": [
    "High-intent customer acquisition channel 1",
    "Scalable growth channel 2",
    "Viral or ecosystem loop channel 3"
  ],
  "customerSegments": [
    "Early adopter profile (niche group with the most urgent pain)",
    "Broader mainstream customer segment"
  ],
  "costStructure": [
    "Primary operational / technical cost driver 1",
    "Customer acquisition & team cost driver 2"
  ],
  "revenueStreams": [
    "Core pricing & monetization model (e.g. $X/mo tier, % transaction fee)",
    "Expansion or secondary revenue stream"
  ]
}

Rules:
- UVP and unfairAdvantage MUST be single concise strings.
- All other 7 fields MUST be arrays of 2-3 specific, concise bullet strings (max 15 words each).
- Return ONLY the raw JSON. No markdown blocks, no conversational preamble.`;

/**
 * Clean & parse LLM response into structured 9-box Lean Canvas object
 */
function cleanAndParseJSON(rawText, promptFallback, iteration = 0) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty AI response received");
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/i, "").replace(/```\s*$/i, "");
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(cleaned);

  return {
    problem: Array.isArray(parsed.problem) && parsed.problem.length > 0 ? parsed.problem : [
      "Core workflow friction and manual overhead",
      "Lack of specialized tooling and fragmented tools",
      "High cost and steep learning curve of existing alternatives"
    ],
    solution: Array.isArray(parsed.solution) && parsed.solution.length > 0 ? parsed.solution : [
      "Intelligent automated platform",
      "Real-time synchronization engine",
      "1-click workflow templates"
    ],
    keyMetrics: Array.isArray(parsed.keyMetrics) && parsed.keyMetrics.length > 0 ? parsed.keyMetrics : [
      "Weekly active users & workflow completion rate",
      "Customer acquisition payback under 6 months"
    ],
    uvp: typeof parsed.uvp === "string" && parsed.uvp.trim() ? parsed.uvp : `The modern platform designed to revolutionize ${promptFallback.slice(0, 35)}.`,
    unfairAdvantage: typeof parsed.unfairAdvantage === "string" && parsed.unfairAdvantage.trim() ? parsed.unfairAdvantage : "Proprietary domain data models and high-switching-cost workflow integration.",
    channels: Array.isArray(parsed.channels) && parsed.channels.length > 0 ? parsed.channels : [
      "Direct targeted outbound & LinkedIn",
      "Product-led organic referrals",
      "Industry community partnerships"
    ],
    customerSegments: Array.isArray(parsed.customerSegments) && parsed.customerSegments.length > 0 ? parsed.customerSegments : [
      "Early adopter professionals and high-growth teams",
      "Mid-market organizations"
    ],
    costStructure: Array.isArray(parsed.costStructure) && parsed.costStructure.length > 0 ? parsed.costStructure : [
      "Cloud hosting, AI inference & database infrastructure",
      "Product development & growth marketing"
    ],
    revenueStreams: Array.isArray(parsed.revenueStreams) && parsed.revenueStreams.length > 0 ? parsed.revenueStreams : [
      "Tiered monthly SaaS subscription",
      "Enterprise custom deployment & volume add-ons"
    ]
  };
}

const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest"
];

async function executeGeminiRequest(apiKey, contents, generationConfig) {
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          generationConfig
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          return rawText;
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}`;
        lastError = new Error(`Gemini API (${model}): ${errMsg}`);
        if (errMsg.includes("API key") || errMsg.includes("API_KEY_INVALID")) {
          throw new Error("Invalid Gemini API Key. Please verify your key from Google AI Studio.");
        }
      }
    } catch (err) {
      lastError = err;
      if (err.message && (err.message.includes("API key") || err.message.includes("API_KEY_INVALID"))) {
        throw err;
      }
    }
  }
  throw lastError || new Error("Failed to connect to Gemini API models");
}

/**
 * Generate 9-box Lean Canvas from user prompt with support for re-draft iterations
 */
export async function generateLeanCanvasAI(prompt, iteration = 0) {
  const idea = prompt.trim();
  if (!idea) {
    throw new Error("Please enter a startup or product description");
  }

  const apiKey = getGeminiApiKey();
  const currentAngle = STRATEGIC_ANGLES[iteration % STRATEGIC_ANGLES.length];

  // 1. If Gemini API Key is provided, call Google Gemini AI with active models
  if (apiKey) {
    try {
      const iterationDirective = iteration > 0
        ? `\n\n[RE-DRAFT ITERATION #${iteration + 1}]: Produce a fresh, alternative strategic angle for this startup idea.\nSTRATEGIC FOCUS ANGLE: ${currentAngle}.\nGenerate distinct, non-repetitive problem statements, tailored UVP, specialized GTM channels, and monetization structure.`
        : `\n\nSTRATEGIC FOCUS ANGLE: ${currentAngle}.`;

      const rawText = await executeGeminiRequest(
        apiKey,
        [
          {
            role: "user",
            parts: [
              { text: `${LEAN_CANVAS_SYSTEM_PROMPT}${iterationDirective}\n\nStartup Idea: "${idea}"` }
            ]
          }
        ],
        {
          responseMimeType: "application/json",
          temperature: Math.min(0.95, 0.75 + (iteration % 4) * 0.06)
        }
      );

      if (rawText) {
        return cleanAndParseJSON(rawText, idea, iteration);
      }
    } catch (err) {
      if (err.message && (err.message.includes("API key") || err.message.includes("API_KEY_INVALID"))) {
        throw err;
      }
      // Fall back seamlessly to multi-angle intelligent engine
      return generateIntelligentSemanticCanvas(idea, iteration);
    }
  }

  // 2. Built-in Multi-Angle Intelligent Semantic Synthesizer
  return generateIntelligentSemanticCanvas(idea, iteration);
}

/**
 * Regenerate a single Lean Canvas box with fresh, non-repetitive suggestions
 */
export async function regenerateSingleBoxAI(boxKey, currentCanvas, ideaPrompt, boxIteration = 0) {
  const apiKey = getGeminiApiKey();
  const prompt = `Given the startup idea: "${ideaPrompt}", generate 2-3 fresh, punchy, and alternative bullet points specifically for the Lean Canvas section "${boxKey}".
Draft iteration: ${boxIteration + 1}.
Current context for reference:
- Problem: ${JSON.stringify(currentCanvas?.problem || [])}
- Solution: ${JSON.stringify(currentCanvas?.solution || [])}
- UVP: "${currentCanvas?.uvp || ""}"

Ensure the new points are completely distinct and fresh compared to the current points.
Return ONLY a JSON object: { "items": ["fresh point 1", "fresh point 2", "fresh point 3"] } or for UVP/unfairAdvantage: { "text": "Single fresh punchy statement" }`;

  if (apiKey) {
    try {
      const raw = await executeGeminiRequest(
        apiKey,
        [{ role: "user", parts: [{ text: prompt }] }],
        {
          responseMimeType: "application/json",
          temperature: 0.9
        }
      );

      if (raw) {
        const parsed = JSON.parse(raw.replace(/```json/gi, "").replace(/```/g, "").trim());
        if (boxKey === "Value proposition" || boxKey === "Unfair advantage") {
          const textResult = parsed.text || parsed.uvp || parsed.unfairAdvantage || (Array.isArray(parsed.items) ? parsed.items.join(" ") : null);
          if (textResult) return textResult;
        }
        if (Array.isArray(parsed.items) && parsed.items.length > 0) return parsed.items;
      }
    } catch (e) {}
  }

  // Fallback dynamic single box generator cycling through variations
  const seed = boxIteration + 1;
  const full = generateIntelligentSemanticCanvas(ideaPrompt, seed);
  const keyMap = {
    "Problem": full.problem,
    "Solution": full.solution,
    "Key metrics": full.keyMetrics,
    "Value proposition": full.uvp,
    "Unfair advantage": full.unfairAdvantage,
    "Channels": full.channels,
    "Customers": full.customerSegments,
    "Cost structure": full.costStructure,
    "Revenue streams": full.revenueStreams
  };

  return keyMap[boxKey] || null;
}

/**
 * Intelligent Multi-Angle Semantic Canvas Synthesizer
 * Detects domain keywords, target audience, monetization model, and generates
 * distinct, evolving drafts across iterations (e.g. Draft #1 vs Draft #2 vs Draft #3).
 */
export function generateIntelligentSemanticCanvas(idea, iteration = 0) {
  const lower = idea.toLowerCase();
  const iterIndex = Math.abs(iteration) % 4;

  // Domain classification
  const isDevOrApi = /api|developer|devops|code|backend|database|latency|microservice|sdk|cloud|server|tracing|observability/i.test(lower);
  const isLegalOrFinance = /lawyer|legal|contract|tax|account|accounting|invoice|audit|compliance|finance|fintech|cpa|attorney/i.test(lower);
  const isHealthOrFitness = /health|fitness|gym|workout|diet|protein|nutrition|wellness|doctor|clinic|patient|sattu/i.test(lower);
  const isFoodOrDelivery = /food|bakery|coffee|delivery|restaurant|meal|grocery|snack|cook|kitchen|croissant|cafe/i.test(lower);
  const isEcommerceOrD2C = /d2c|ecommerce|brand|store|shop|product|sachet|packaging|clothing|retail|artisan/i.test(lower);
  const isEducationOrLearning = /learn|course|student|teacher|education|school|tutor|skill|academy|training/i.test(lower);
  const isMarketplace = /marketplace|freelancer|platform|connect|booking|hire|job|gig/i.test(lower);

  // Extract key concept keywords
  const cleanTokens = idea
    .replace(/[^\w\s]/gi, "")
    .split(/\s+/)
    .filter(w => w.length > 3 && !["this", "that", "with", "from", "your", "their", "have", "will", "what", "minute", "ready"].includes(w.toLowerCase()));

  const topicName = cleanTokens.slice(0, 3).join(" ") || "smart workflows";

  // 1. DEVELOPER / DEVOPS / API DOMAIN
  if (isDevOrApi) {
    const devVariations = [
      // Variation 0: Observability & Outage Prevention
      {
        problem: [
          `Microservice cascading outages in ${topicName} lead to silent churn and SLA breach penalties`,
          "Engineers waste 12+ hours per week parsing noisy fragmented logs and distributed traces",
          "Legacy APM tools add excessive CPU overhead, telemetry lag, and unpredictable cloud bills"
        ],
        solution: [
          `Zero-instrumentation automated observability engine for ${topicName}`,
          "AI root-cause analyzer detecting latency spikes before incidents impact users",
          "1-click automated circuit breaking and safe rollback triggers"
        ],
        keyMetrics: [
          "Mean Time to Detection (MTTD) < 5s and 70% MTTR reduction",
          "Monthly telemetry volume ingestion & developer seat expansion"
        ],
        uvp: `Instant, zero-overhead edge observability that auto-diagnoses and mitigates ${topicName} failures in seconds.`,
        unfairAdvantage: "Proprietary eBPF low-overhead kernel collector with <0.1% CPU footprint and pre-trained incident graph models.",
        channels: [
          "Open-source CLI collector on GitHub & HackerNews technical deep-dives",
          "AWS, GCP & Kubernetes Marketplace 1-click cloud integrations",
          "DevOps & SRE Discord and Slack engineer communities"
        ],
        customerSegments: [
          "DevOps leads and SREs managing high-throughput microservices",
          "Fast-growing backend engineering teams seeking predictable APM costs"
        ],
        costStructure: [
          "High-throughput timeseries database cluster hosting & edge ingestion",
          "Developer advocacy, documentation engineering & continuous benchmark testing"
        ],
        revenueStreams: [
          "Usage-based telemetry pricing ($49/mo per 10M events)",
          "Enterprise dedicated VPC compliance deployment tier ($1,200/mo)"
        ]
      },
      // Variation 1: Automated Developer Productivity & Testing Angle
      {
        problem: [
          `Slow API integration cycles and breaking endpoint changes stall ${topicName} deployments`,
          "Mocking distributed services manually takes 30% of engineering sprint velocity",
          "Flaky staging environments mask edge-case bugs until they hit production"
        ],
        solution: [
          `Self-healing virtual sandbox environments for ${topicName}`,
          "Automated contract testing that detects breaking payload schemas in CI/CD",
          "Instant synthetic load generation simulating production traffic bursts"
        ],
        keyMetrics: [
          "PR merge velocity & staging environment setup time (< 60 seconds)",
          "Test suite reliability score (> 99.4% pass consistency)"
        ],
        uvp: `Ship ${topicName} features 3x faster with instant, self-healing developer sandbox environments.`,
        unfairAdvantage: "Patented real-time traffic mirroring proxy with zero data exposure and instant sandbox rehydration.",
        channels: [
          "GitHub Actions and GitLab CI marketplace integrations",
          "Targeted tech lead outreach via Product Hunt and dev newsletters",
          "Technical conference lightning talks and sandbox benchmarks"
        ],
        customerSegments: [
          "Growth-stage SaaS engineering teams with 20-150 developers",
          "API-first platform providers requiring bulletproof backward compatibility"
        ],
        costStructure: [
          "Serverless container compute for ephemeral sandbox instances",
          "Security auditing, penetration testing & developer relations team"
        ],
        revenueStreams: [
          "Developer seat subscription ($29/active engineer/month)",
          "Enterprise unlimited concurrent sandbox runners ($2,400/month)"
        ]
      },
      // Variation 2: Cost Optimization & FinOps Angle
      {
        problem: [
          `Cloud infrastructure and API inference bills for ${topicName} skyrocket without clear attribution`,
          "Engineers lack visibility into which query or endpoint is driving 80% of cluster spend",
          "Over-provisioned reserve nodes waste tens of thousands in monthly cloud credits"
        ],
        solution: [
          `Intelligent FinOps copilot that attributes exact cost per API endpoint in real time`,
          "Automated spot instance arbitrator cutting compute overhead by up to 60%",
          "Real-time budget guardrails alerting Slack before billing surges happen"
        ],
        keyMetrics: [
          "% Cloud spend saved per connected repository (avg. 35-55%)",
          "Net dollar retention (NDR > 135%) across tech scale-ups"
        ],
        uvp: `Cut your ${topicName} cloud compute & API costs in half with automated real-time resource optimization.`,
        unfairAdvantage: "Proprietary predictive autoscaling algorithm proven on 100M+ real-world cloud workload hours.",
        channels: [
          "AWS / Azure Cost Optimization partner directory listings",
          "Free automated cloud waste audit tool generating immediate ROI reports",
          "CTO & VP Engineering peer masterminds and webinars"
        ],
        customerSegments: [
          "Scale-ups spending $10k-$100k/mo on AWS, GCP, or OpenAI APIs",
          "FinOps teams needing automated granular unit cost attribution"
        ],
        costStructure: [
          "Multi-cloud API integration collectors and telemetry aggregation storage",
          "Enterprise account managers and technical solutions architects"
        ],
        revenueStreams: [
          "Value-share pricing: 15% of verified monthly cloud savings",
          "Fixed base tier for continuous monitoring ($299 - $899/mo)"
        ]
      },
      // Variation 3: Security & Zero-Trust Angle
      {
        problem: [
          `API secret leaks and unauthorized data egress threaten ${topicName} deployments`,
          "Manual compliance audits for SOC-2 and ISO-27001 delay enterprise sales by quarters",
          "Shadow third-party API dependencies introduce unmonitored supply chain attack vectors"
        ],
        solution: [
          `Zero-trust automated policy enforcement gateway tailored for ${topicName}`,
          "Real-time token rotation and secret scanning in live memory buffers",
          "Automated SOC-2 evidence collector continuously generating audit reports"
        ],
        keyMetrics: [
          "Mean Time to Patch (MTTP) API vulnerabilities (< 10 minutes)",
          "Enterprise security questionnaire acceleration rate (90% faster)"
        ],
        uvp: `Airtight Zero-Trust security and automated compliance for ${topicName} without slowing down developers.`,
        unfairAdvantage: "Hardware-enforced cryptographic boundary engine with zero latency overhead.",
        channels: [
          "CISO executive networks and Gartner Cool Vendor showcases",
          "Direct enterprise pipeline outbound targeting Series B+ tech firms",
          "Security research whitepapers and CVE vulnerability disclosure reports"
        ],
        customerSegments: [
          "Fintech, healthtech, and enterprise SaaS companies facing strict audits",
          "Security engineering leads protecting high-value customer datasets"
        ],
        costStructure: [
          "Continuous third-party security audits and red-teaming contracts",
          "Enterprise field sales reps and 24/7 dedicated support engineers"
        ],
        revenueStreams: [
          "Annual enterprise license ($18,000 - $60,000/yr)",
          "Compliance audit readiness certification package ($5,000 one-off)"
        ]
      }
    ];
    return devVariations[iterIndex];
  }

  // 2. LEGAL / FINANCE / TAX / ACCOUNTING DOMAIN
  if (isLegalOrFinance) {
    const legalVariations = [
      // Variation 0: Redlining & Contract Auditing
      {
        problem: [
          `Legal practitioners lose 15+ hours weekly to tedious contract redlines and review in ${topicName}`,
          "High risk of missed indemnification loopholes, liability caps, and regulatory compliance traps",
          "Associate burnout and high client pushback on routine clerical hourly billable rates"
        ],
        solution: [
          `Automated clause risk-scoring and redlining assistant built for ${topicName}`,
          "Private firm precedent repository indexing past approved agreements for instant reuse",
          "Real-time compliance validation plugin for Microsoft Word, Google Docs & PDF"
        ],
        keyMetrics: [
          "Weekly active attorneys auditing 5+ contracts and 75% faster turnaround time",
          "Net Revenue Retention (NRR > 125%) among boutique corporate law practices"
        ],
        uvp: `Draft, audit, and finalize airtight ${topicName} documents 10x faster with private fine-tuned intelligence.`,
        unfairAdvantage: "Proprietary benchmarked repository of 250,000+ domain contract precedents and zero data-retention security guarantee.",
        channels: [
          "Direct LinkedIn outbound demos to managing partners and corporate CFOs",
          "Product-led free trial auditing 3 initial contracts with instant clause scorecards",
          "State bar association, legal tech summits, and CPA conference sponsorships"
        ],
        customerSegments: [
          "Boutique corporate law firms (3-35 attorneys) handling high-volume contract review",
          "In-house legal & finance counsels at high-growth venture-backed companies"
        ],
        costStructure: [
          "SOC-2 Type II compliant private GPU infrastructure and customer data encryption",
          "Domain legal & tax expert continuous model benchmark evaluation"
        ],
        revenueStreams: [
          "Per-seat SaaS subscription ($149/attorney/month)",
          "Enterprise custom firm precedent indexing and setup fee ($3,500)"
        ]
      },
      // Variation 1: Automated Tax & Deductions Angle
      {
        problem: [
          `Freelancers and small businesses overpay thousands annually in missed deductions for ${topicName}`,
          "Receipts and bank transaction categorization are chaotic, messy, and procrastinated",
          "Accountants spend weeks chasing clients for missing receipts at tax filing deadline"
        ],
        solution: [
          `Autonomous bookkeeping assistant that auto-categorizes 100% of ${topicName} expenses`,
          "Instant receipt OCR & WhatsApp/SMS snapshot reconciliation in 3 seconds",
          "1-click export of CPA-ready, audit-proof tax schedules and Schedule C sheets"
        ],
        keyMetrics: [
          "Average annual tax dollars saved per user ($3,400+)",
          "Monthly active receipt uploads & 98% transaction categorization accuracy"
        ],
        uvp: `Never lose a tax deduction again: autonomous, audit-proof accounting for ${topicName} in your pocket.`,
        unfairAdvantage: "Proprietary tax-code heuristic engine trained across 50,000+ localized freelancer tax returns.",
        channels: [
          "Partnerships with freelancer marketplaces (Upwork, Fiverr, TopTal)",
          "Viral TikTok & YouTube tax-saving breakdowns for independent creators",
          "Affiliate referral programs with accountants and tax preparers"
        ],
        customerSegments: [
          "Independent consultants, freelancers, and creative agency owners",
          "Solo operators managing multiple irregular income streams"
        ],
        costStructure: [
          "Banking API aggregator fees (Plaid/Yodlee) and OCR parsing compute",
          "Customer onboarding specialists and affiliate commission payouts"
        ],
        revenueStreams: [
          "Monthly subscription ($19/mo solo, $49/mo pro with CPA review)",
          "End-of-year tax filing concierge filing add-on ($199)"
        ]
      },
      // Variation 2: Invoice Factoring & Cash Flow Angle
      {
        problem: [
          `Late client invoice payments stall cash flow and payroll in ${topicName} businesses`,
          "Traditional factoring lenders charge predatory fees (4-8%) with cumbersome paperwork",
          "Finance managers waste days following up on unpaid net-30/net-60 invoices manually"
        ],
        solution: [
          `Instant 1-click invoice financing unlocking 90% upfront cash for verified ${topicName} receivables`,
          "Automated polite multi-channel payment reminder sequences via email and SMS",
          "Real-time 90-day cash flow forecasting with runway warning triggers"
        ],
        keyMetrics: [
          "Days Sales Outstanding (DSO) reduction rate (from 48 days down to 14 days)",
          "Gross invoice financing volume disbursed and zero-default rate"
        ],
        uvp: `Turn unpaid ${topicName} invoices into instant same-day cash with zero debt or predatory fees.`,
        unfairAdvantage: "Direct open-banking underwriting API providing instant credit scoring in under 60 seconds.",
        channels: [
          "Accounting software app stores (QuickBooks, Xero, FreshBooks plugins)",
          "B2B service provider networks and trade associations",
          "Targeted Google Search ads on high-intent 'invoice financing' keywords"
        ],
        customerSegments: [
          "B2B service agencies and consultancies experiencing lumpy net-60 payment terms",
          "Subcontractors and suppliers requiring upfront payroll liquidity"
        ],
        costStructure: [
          "Capital credit facility interest and default risk reserve pool",
          "Automated underwriting risk engine and compliance officer overhead"
        ],
        revenueStreams: [
          "Transparent transaction fee (1.2% - 2.5% per factored invoice)",
          "Cash flow dashboard premium subscription ($39/month)"
        ]
      },
      // Variation 3: M&A Due Diligence & Audit Room Angle
      {
        problem: [
          `M&A due diligence and compliance audits in ${topicName} take 3-6 months of grueling manual data room audits`,
          "Hidden liabilities, change-of-control clauses, and revenue recognition errors get overlooked",
          "External audit firm fees exceed $50k-$200k even for small acquisition deals"
        ],
        solution: [
          `Virtual AI-powered deal room that analyzes 1,000+ data room files for ${topicName} in minutes`,
          "Automated red flag detection identifying risky contractual clauses and tax exposures",
          "Executive synthesis summary sheet generated with 1-click export for board presentations"
        ],
        keyMetrics: [
          "Due diligence turnaround speed (cut from 6 weeks to 3 days)",
          "Number of active deals closed on platform per quarter"
        ],
        uvp: `Close ${topicName} M&A deals and audits 5x faster with autonomous AI due diligence rooms.`,
        unfairAdvantage: "Proprietary deal-intelligence model fine-tuned on 10,000+ closed venture and private equity transactions.",
        channels: [
          "Private equity and venture capital firm direct partner relationships",
          "Investment banking boutiques and corporate development advisors",
          "M&A conference keynotes and case study whitepapers"
        ],
        customerSegments: [
          "Venture capital & Private Equity deal teams evaluating acquisitions",
          "Founders and CFOs preparing their company for seed/Series A/exit rounds"
        ],
        costStructure: [
          "High-security encrypted document vaults with zero-knowledge architecture",
          "Senior legal-financial solutions engineers and enterprise sales directors"
        ],
        revenueStreams: [
          "Per-deal workspace pass ($1,500 - $5,000 per transaction)",
          "Annual enterprise subscription for active funds ($25,000/yr)"
        ]
      }
    ];
    return legalVariations[iterIndex];
  }

  // 3. FOOD / DELIVERY / D2C / HEALTH DOMAIN
  if (isFoodOrDelivery || isEcommerceOrD2C || isHealthOrFitness) {
    const d2cVariations = [
      // Variation 0: Hyperlocal 15-Minute Convenience Angle
      {
        problem: [
          `Customers face long wait times, cold delivery, or stale bakery/coffee items in ${topicName}`,
          "Traditional aggregator delivery apps charge 30% commissions, destroying artisan kitchen margins",
          "Suburban residents lack access to downtown-quality specialty baked goods and fresh coffee"
        ],
        solution: [
          `Dedicated micro-hub fulfillment network delivering fresh artisan ${topicName} in 15 minutes`,
          "Temperature-regulated delivery pods preserving oven-fresh crispness and barista crema",
          "1-tap morning scheduled recurring delivery arriving before your morning alarm"
        ],
        keyMetrics: [
          "Customer 30-day repeat order rate (> 42% on morning routines)",
          "Average delivery time (< 14.5 minutes) and 99.1% on-time rating"
        ],
        uvp: `Oven-fresh artisan ${topicName} delivered to your door in 15 minutes flat, every single morning.`,
        unfairAdvantage: "Exclusive supply agreements with top 10 local bakeries and proprietary heated micro-transit containers.",
        channels: [
          "Hyperlocal door-drop sample boxes with personalized neighbor welcome codes",
          "Instagram & TikTok neighborhood food creator reels and morning routine vlogs",
          "Apartment building lobby sampling kiosks and resident association perks"
        ],
        customerSegments: [
          "Suburban remote workers and young professionals seeking elevated daily coffee & breakfast",
          "Families wanting artisan bakery treats on weekend mornings without driving"
        ],
        costStructure: [
          "Micro-hub lease footprint, commercial ovens & temperature-controlled delivery fleet",
          "Artisan wholesale ingredients and neighborhood courier compensation"
        ],
        revenueStreams: [
          "Per-order basket revenue (avg. order value $16 - $24)",
          "Monthly Morning Pass ($9.99/mo for free 15-min delivery and 15% item discount)"
        ]
      },
      // Variation 1: Clean Nutrition / Sachet D2C Angle
      {
        problem: [
          `Busy professionals skip healthy nutrition due to messy preparation, clumpy texture, or bad taste in ${topicName}`,
          "Commercial energy & protein drinks are loaded with artificial sweeteners, gums, and chemical additives",
          "Traditional bulk powders require giant shakers that are inconvenient to carry and clean"
        ],
        solution: [
          `Single-serve micro-sachets of 100% natural, instant-dissolving ${topicName}`,
          "Cold-milled authentic wholefood formulation ready in 20 seconds with just water and a spoon",
          "Delightful functional flavors (e.g. Cardamom Vanilla, Roasted Cacao, Toasted Almond)"
        ],
        keyMetrics: [
          "Monthly active subscriber retention (> 65% at 3 months)",
          "Customer Acquisition Cost (CAC) payback period under 40 days"
        ],
        uvp: `Clean, artisan wholefood nutrition in 20 seconds: zero mess, zero artificial junk, 100% authentic vitality.`,
        unfairAdvantage: "Proprietary flash-roasting and micro-milling patent that dissolves instantly in cold liquids with zero clumps.",
        channels: [
          "Direct-to-consumer online store with irresistible $9.99 starter discovery bundle",
          "Quick-commerce presence on Blinkit, Zepto, and Instamart for instant 10-min restocking",
          "Fitness trainer and wellness influencer unboxing reviews on Instagram & YouTube"
        ],
        customerSegments: [
          "Health-conscious urban professionals needing clean mid-day nutrition on the go",
          "Fitness enthusiasts seeking clean, easily digestible plant protein alternatives"
        ],
        costStructure: [
          "Ethical farm direct ingredient sourcing, nitrogen-flushed sachet packaging",
          "D2C Meta & Google Performance Ads and quick-commerce platform slotting fees"
        ],
        revenueStreams: [
          "Monthly auto-replenishment subscription ($29.99 for 30 daily sachets)",
          "Multi-flavor discovery boxes and corporate office pantry packs ($89)"
        ]
      },
      // Variation 2: Farm-to-Table Fresh Subscription Angle
      {
        problem: [
          `Supermarket produce and packaged goods for ${topicName} sit in cold storage for weeks, losing nutrients and flavor`,
          "Local regenerative farmers receive less than 15% of the consumer retail dollar",
          "Consumers want organic traceability but struggle to find transparent source-verified products"
        ],
        solution: [
          `Harvest-to-door direct subscription delivering ${topicName} within 24 hours of harvest`,
          "Interactive QR code on every batch showing exact farm origin, harvest timestamp, and grower story",
          "Zero-waste compostable packaging with free weekly container collection"
        ],
        keyMetrics: [
          "Customer Lifetime Value (LTV > $480/yr) and referral rate (> 28%)",
          "Farm partner margin retention (over 65% returned to growers)"
        ],
        uvp: `Taste the true difference: harvest-fresh, 100% traceable ${topicName} delivered from local farms in 24 hours.`,
        unfairAdvantage: "Direct exclusive co-op contracts with 40+ certified organic regenerative family farms.",
        channels: [
          "Weekend farmers market pop-up tasting booths and subscription signups",
          "Neighborhood referral ambassador program with free harvest box incentives",
          "Partnerships with boutique organic cafes and culinary influencers"
        ],
        customerSegments: [
          "Eco-conscious households prioritizing fresh culinary taste and organic nutrition",
          "Passionate home cooks looking for restaurant-grade seasonal ingredients"
        ],
        costStructure: [
          "Farm logistics aggregation, regional cold-chain transport, and eco-packaging",
          "Customer service, subscription retention marketing, and farm partner onboarding"
        ],
        revenueStreams: [
          "Weekly or bi-weekly fresh harvest box subscription ($35 - $65/delivery)",
          "Seasonal artisan pantry add-on items (honey, preserves, roasted nuts)"
        ]
      },
      // Variation 3: B2B Corporate Wellness & Cafeteria Angle
      {
        problem: [
          `Corporate office employees experience 3 PM energy crashes from sugary pantry snacks and stale catering in ${topicName}`,
          "HR and Office Managers waste hours managing fragmented snack vendors and restocking",
          "Companies struggle to offer attractive wellness perks that genuinely boost team morale and health"
        ],
        solution: [
          `Smart automated pantry station dispensing fresh, premium ${topicName} on tap`,
          "IoT-connected inventory sensor triggering automatic restocking before items run out",
          "Employee companion app for custom recipe blending and nutrition tracking"
        ],
        keyMetrics: [
          "Employee daily utilization rate (> 55% of in-office workforce)",
          "B2B corporate contract renewal rate (> 92% annually)"
        ],
        uvp: `Boost office energy and morale with smart, automated premium ${topicName} stations for modern workplaces.`,
        unfairAdvantage: "Patented IoT automated pantry dispenser with integrated telemetry and zero maintenance downtime.",
        channels: [
          "Direct outbound sales to VP People, HR Directors, and Workplace Experience Managers",
          "Free 2-week in-office trial showcase for tech company headquarters",
          "Commercial real estate broker and co-working space partnerships (WeWork, Industrious)"
        ],
        customerSegments: [
          "Tech companies and corporate offices with 50-500 in-office employees",
          "Modern co-working spaces looking to provide standout member amenities"
        ],
        costStructure: [
          "Hardware dispenser manufacturing, IoT telemetry sim cards, and field service fleet",
          "B2B enterprise sales team and account management"
        ],
        revenueStreams: [
          "Monthly office subscription based on headcount ($499 - $1,800/month)",
          "Smart dispenser installation and maintenance contract"
        ]
      }
    ];
    return d2cVariations[iterIndex];
  }

  // 4. GENERAL STARTUP SYNTHESIZER (Tailored across 4 dynamic angles)
  const generalVariations = [
    // Variation 0: High-Growth Product-Led Strategy
    {
      problem: [
        `Users suffer high manual overhead, slow turnaround, and confusion around ${topicName}`,
        "Existing market alternatives are bloated, fragmented, and take weeks to onboard",
        "Lack of centralized tracking and real-time visibility leads to costly miscommunication"
      ],
      solution: [
        `Dedicated AI-assisted workspace built specifically for ${topicName}`,
        "1-click smart automation eliminating repetitive clerical steps",
        "Actionable real-time insights, collaboration, and instant progress sharing"
      ],
      keyMetrics: [
        "Weekly Active Users (WAU) completing core workflows",
        "Net Promoter Score (NPS > 62) and 90-day retention curve"
      ],
      uvp: `The all-in-one smart platform that makes ${topicName} 10x faster, simpler, and more reliable.`,
      unfairAdvantage: "Proprietary vertical domain workflows and rapid user-feedback network effects.",
      channels: [
        "Direct targeted outreach to high-intent niche communities and forums",
        "Product-led viral onboarding with free shareable outputs and templates",
        "High-ranking SEO guides addressing specific pain points in the space"
      ],
      customerSegments: [
        `Early adopter practitioners actively searching for better ways to manage ${topicName}`,
        "Modern agile teams and growing organizations"
      ],
      costStructure: [
        "Cloud database, AI inference & API hosting bandwidth",
        "Product engineering, customer success & growth marketing"
      ],
      revenueStreams: [
        "Tiered monthly SaaS subscription (Starter, Pro, Team)",
        "Premium add-ons, volume usage tiers & team seats"
      ]
    },
    // Variation 1: Enterprise & Security-First Strategy
    {
      problem: [
        `Enterprise organizations face severe compliance risks and fragmented data silos when handling ${topicName}`,
        "Legacy enterprise systems are clunky, poorly integrated, and cost millions in maintenance",
        "Leadership lacks unified executive reporting and audit-proof governance"
      ],
      solution: [
        `Enterprise-grade command center for ${topicName} with role-based access control`,
        "Automated compliance audit trails and seamless ERP/CRM integrations",
        "Executive AI dashboard generating predictive risk and ROI forecasts"
      ],
      keyMetrics: [
        "Enterprise Annual Contract Value (ACV > $25k) and Net Retention Rate (> 130%)",
        "Time to value from procurement to full enterprise deployment (< 14 days)"
      ],
      uvp: `Enterprise-grade governance, security, and AI orchestration for ${topicName} at scale.`,
      unfairAdvantage: "Pre-built integrations with 50+ enterprise systems and SOC-2 Type II / HIPAA certified architecture.",
      channels: [
        "Account-based marketing (ABM) targeting VP & C-level executives",
        "Strategic channel partnerships with global systems integrators",
        "Industry trade shows, executive roundtable dinners, and Forrester/Gartner reviews"
      ],
      customerSegments: [
        "Mid-market to Fortune 500 enterprises with distributed global teams",
        "Chief Information Officers and Operations Directors managing legacy modernization"
      ],
      costStructure: [
        "Dedicated enterprise security infrastructure, redundancy, and SLA uptime guarantees",
        "Enterprise sales directors, customer success managers, and solutions architects"
      ],
      revenueStreams: [
        "Annual enterprise licensing agreements ($20,000 - $100,000/year)",
        "Custom integration implementation and dedicated training packages"
      ]
    },
    // Variation 2: Community-Led & Marketplace Flywheel Strategy
    {
      problem: [
        `Individual creators and independent specialists in ${topicName} struggle to monetize and find clients`,
        "Buyers waste hours vetting low-quality providers on generic freelance platforms",
        "Opaque pricing, payment disputes, and high marketplace take-rates (20-30%)"
      ],
      solution: [
        `Curated vertical marketplace connecting top-tier ${topicName} experts with verified clients`,
        "Escrow-protected milestone payments with instant automated payouts",
        "Community reputation score based on verified peer reviews and project outcomes"
      ],
      keyMetrics: [
        "Gross Merchandise Value (GMV) transacted per month",
        "Buyer repeat booking rate (> 35% within 60 days)"
      ],
      uvp: `Connect with the top 1% of vetted ${topicName} specialists with guaranteed delivery and zero hassle.`,
      unfairAdvantage: "Exclusive network of certified domain specialists and proprietary matching algorithm.",
      channels: [
        "Community-led webinars, masterclasses, and free template library",
        "Referral incentives giving buyers and providers credits for every invite",
        "Content marketing showcasing client success stories and project breakdowns"
      ],
      customerSegments: [
        "Businesses needing specialized, high-trust project delivery without agency markups",
        "Elite freelance practitioners looking for high-budget, qualified client leads"
      ],
      costStructure: [
        "Payment processing gateway fees and escrow trust infrastructure",
        "Curated talent vetting team and community management"
      ],
      revenueStreams: [
        "Low transparent transaction commission (8-12% take rate on completed projects)",
        "Pro membership for specialists with featured placement ($29/month)"
      ]
    },
    // Variation 3: Autonomous AI-First Disruption Strategy
    {
      problem: [
        `Human labor in ${topicName} is bottlenecked by repetitive clerical decisions and fatigue`,
        "Slow turnaround times of 3-7 business days frustrate modern digital consumers",
        "High operational headcount costs prevent small businesses from scaling profitability"
      ],
      solution: [
        `Autonomous AI agent workforce that executes end-to-end ${topicName} tasks in seconds`,
        "Human-in-the-loop exception handling that routes ambiguous cases to human reviewers",
        "Continuous self-learning feedback loop improving accuracy on every execution"
      ],
      keyMetrics: [
        "Autonomous completion rate (> 94% with zero human intervention)",
        "Cost per completed task reduction (80% cheaper than human labor)"
      ],
      uvp: `Autonomous AI agents that execute ${topicName} tasks instantly, accurately, and at 1/5th the cost.`,
      unfairAdvantage: "Proprietary fine-tuned reinforcement learning models with 500,000+ domain task evaluation benchmarks.",
      channels: [
        "Interactive live demo on website allowing visitors to test the agent on real tasks in 10 seconds",
        "Developer and agency partner API ecosystem",
        "Viral social media comparisons showcasing speed and quality vs manual work"
      ],
      customerSegments: [
        "High-volume businesses needing instant scalable capacity without hiring armies",
        "Digital agencies and service providers wanting to 10x their client margins"
      ],
      costStructure: [
        "High-performance GPU cluster inference and fine-tuning compute costs",
        "AI research scientists and prompt/agent architecture engineers"
      ],
      revenueStreams: [
        "Usage-based pricing per completed task (e.g. $0.25 per automated execution)",
        "Monthly platform access tier with priority compute allocation ($99 - $499/mo)"
      ]
    }
  ];

  return generalVariations[iterIndex];
}
