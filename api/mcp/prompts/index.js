// api/mcp/prompts/index.ts
var PROMPT_REGISTRY = [
  {
    name: "country-briefing",
    description: "Multi-tool country brief: quantitative risk score + LLM-synthesised intelligence brief + macro indicators for a single ISO 3166-1 alpha-2 country.",
    arguments: [
      {
        name: "iso2",
        description: 'ISO 3166-1 alpha-2 country code (e.g. "DE", "US", "CN", "IR"). Case-sensitive \u2014 pass uppercase.',
        required: true
      }
    ],
    steps: [
      {
        tool: "get_country_risk",
        args: { country_code: "${iso2}" },
        jmespath: "{cii: cii, components: components, travelAdvisory: travelAdvisory, sanctionsExposure: sanctionsExposure}",
        purpose: "Quantitative Composite Instability Index (CII) + component breakdown + travel advisory + OFAC sanctions exposure."
      },
      {
        tool: "get_country_brief",
        args: { country_code: "${iso2}" },
        jmespath: "{country_code: country_code, brief: brief}",
        purpose: "LLM-synthesised geopolitical + economic narrative grounded on the latest headlines."
      },
      {
        tool: "get_country_macro",
        args: { countries: ["${iso2}"] },
        jmespath: "{macro: data.macro.countries, growth: data.growth.countries, labor: data.labor.countries}",
        purpose: "IMF WEO macro/growth/labor indicators (one-country slice; external excluded \u2014 broad WEO retraction 2026-04)."
      }
    ],
    intro: "Build a country briefing for ${iso2}. Execute the three steps below in order; combine the results into a single concise brief (CII score and components, travel/sanctions posture, the LLM brief, then the key macro indicators)."
  },
  {
    name: "energy-shock-watch",
    description: "Active energy supply disruptions, fuel shortages, and government crisis policies. Optional country filter narrows the country-keyed slices; omit for a global view.",
    arguments: [
      {
        name: "country",
        description: 'Optional ISO 3166-1 alpha-2 country code to focus on (e.g. "DE", "IN"). Omit for the global energy bundle.',
        required: false
      }
    ],
    steps: [
      {
        tool: "get_energy_intelligence",
        args: { country: "${country}" },
        jmespath: '{disruptions: data.disruptions.events, fuel_shortages: data."fuel-shortages".shortages, crisis_policies: data."crisis-policies".policies}',
        purpose: "Active disruptions + per-country fuel shortages + government crisis policies. Three slices of the energy bundle most relevant to a near-term shock."
      }
    ],
    intro: "Surface active energy disruptions, fuel shortages, and the government crisis-policy posture${country_suffix}. Call the step below, then summarise: are there active disruptions right now, and which countries / policies are in scope?",
    intro_substitutions: {
      country_suffix: { when_present: " for ${country}", when_absent: " (global view)" }
    }
  },
  {
    name: "market-open-prep",
    description: "Pre-market briefing: equity, commodity, and crypto quotes with per-symbol percent changes. Designed to be cheap to read \u2014 only changePercent + symbol are projected per asset class.",
    arguments: [],
    steps: [
      {
        tool: "get_market_data",
        args: { asset_class: ["equity", "commodity", "crypto"] },
        jmespath: '{equity: data."stocks-bootstrap".quotes[*].{symbol: symbol, changePercent: changePercent}, commodity: data."commodities-bootstrap".quotes[*].{symbol: symbol, changePercent: changePercent}, crypto: data.crypto.quotes[*].{symbol: symbol, changePercent: changePercent}}',
        purpose: "Per-asset-class quote pairs (symbol + changePercent only). Skip ETF flows / sectors / Gulf / fear-greed \u2014 they belong in a deeper drill-down, not a session-opening read."
      }
    ],
    intro: "Prepare a market-open briefing. Call the step below to fetch equity, commodity, and crypto movers, then highlight the largest gainers and losers per asset class along with anything anomalous (e.g. correlated moves, single-name outliers)."
  },
  {
    name: "conflict-pulse",
    description: "Active conflict events (UCDP) + alert-flagged top news stories. Optional country filter narrows both feeds; omit for a global pulse.",
    arguments: [
      {
        name: "country",
        description: 'Optional country filter. UCDP event names use full country names ("United States"); news intelligence uses ISO 3166-1 alpha-2. Pass the most specific form that matches both \u2014 the postFilters are case-insensitive on substring/code respectively.',
        required: false
      }
    ],
    steps: [
      {
        tool: "get_conflict_events",
        args: { country: "${country}", min_fatalities: 1 },
        jmespath: 'data."ucdp-events".events',
        purpose: "UCDP armed-conflict events (\u22651 fatality) \u2014 the canonical low-noise feed for hot conflicts."
      },
      {
        tool: "get_news_intelligence",
        args: { country: "${country}", alerts_only: true },
        jmespath: "data.insights.topStories",
        purpose: "Alert-flagged top stories only \u2014 high signal-to-noise filter on the news layer."
      }
    ],
    intro: "Read the current conflict pulse${country_suffix}. Run both steps below and synthesise: where are the active conflict events, and what alert-flagged stories cluster with them? Be specific about geographies and sides.",
    intro_substitutions: {
      country_suffix: { when_present: " for ${country}", when_absent: " (global view)" }
    }
  },
  {
    name: "route-risk-check",
    description: 'Maritime chokepoint transit summary + risk posture for a single chokepoint (e.g. "hormuz", "suez", "malacca", "bab-el-mandeb", "panama"). The filter is case-insensitive substring against the chokepoint identifiers used by each dataset.',
    arguments: [
      {
        name: "chokepoint",
        description: 'Substring match against chokepoint identifiers \u2014 e.g. "hormuz" matches both "hormuz_strait" and "Strait of Hormuz". Use the most specific name you have.',
        required: true
      }
    ],
    steps: [
      {
        tool: "get_chokepoint_status",
        args: { chokepoint: "${chokepoint}" },
        jmespath: 'data."transit-summaries".summaries',
        purpose: "Per-chokepoint transit summary: today total / tanker / cargo, week-over-week change, risk level, incident count, disruption percentage, and a risk narrative."
      }
    ],
    intro: "Assess the current route risk for the ${chokepoint} chokepoint. Call the step below and surface: today's transit volume, week-over-week change, risk level + narrative, and any incidents in the trailing 7 days. Flag explicitly if the dataAvailable field is false."
  },
  {
    name: "freshness-audit",
    description: "Quick audit of cache freshness across three high-cadence cache tools. Reads each envelope's cached_at + stale flag (no full data payload) so the operator can see at a glance whether the bootstrap pipeline is up to date.",
    arguments: [],
    steps: [
      {
        tool: "get_market_data",
        args: { summary: true },
        jmespath: "{cached_at: cached_at, stale: stale}",
        purpose: "Market-data envelope freshness (10-min cadence on equity quotes; stale if any contributing key is older than its per-key budget)."
      },
      {
        tool: "get_energy_intelligence",
        args: { summary: true },
        jmespath: "{cached_at: cached_at, stale: stale}",
        purpose: "Energy bundle envelope freshness (multi-cadence \u2014 EIA daily, Ember daily, gas-storage daily, World Bank annual)."
      },
      {
        tool: "get_chokepoint_status",
        args: { summary: true },
        jmespath: "{cached_at: cached_at, stale: stale}",
        purpose: "Chokepoint transit-summary envelope freshness (10-min relay cadence on the live transit feeds)."
      }
    ],
    intro: "Audit the bootstrap pipeline freshness across markets, energy, and maritime chokepoints. For each step below, project ONLY the envelope (cached_at + stale) \u2014 the summary: true flag collapses the payload so this stays cheap. Then report a one-line freshness verdict per tool."
  }
];
var TOKEN_RE = /\$\{([^}]*)\}/g;
var MAX_PROMPT_ARG_LENGTH = 200;
function collectTokens(s) {
  const out = [];
  let m;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(s)) !== null) out.push(m[1] ?? "");
  return out;
}
function collectTokensFromValue(v, sink) {
  if (typeof v === "string") {
    for (const t of collectTokens(v)) sink.push(t);
    return;
  }
  if (Array.isArray(v)) {
    for (const x of v) collectTokensFromValue(x, sink);
    return;
  }
  if (v !== null && typeof v === "object") {
    for (const x of Object.values(v)) collectTokensFromValue(x, sink);
  }
}
function substituteString(s, values) {
  return s.replace(TOKEN_RE, (_, name) => values[name] ?? "");
}
function substituteValue(v, values) {
  if (typeof v === "string") return substituteString(v, values);
  if (Array.isArray(v)) return v.map((x) => substituteValue(x, values));
  if (v !== null && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = substituteValue(val, values);
    }
    return out;
  }
  return v;
}
function applyIntroSubstitutions(intro, intro_substitutions, values) {
  if (!intro_substitutions) return intro;
  let out = intro;
  for (const [tokenName, spec] of Object.entries(intro_substitutions)) {
    const argsReferenced = [
      ...collectTokens(spec.when_present),
      ...collectTokens(spec.when_absent)
    ];
    const isPresent = argsReferenced.some((arg) => (values[arg] ?? "").length > 0);
    const replacement = isPresent ? spec.when_present : spec.when_absent;
    out = out.split("${" + tokenName + "}").join(replacement);
  }
  return out;
}
function buildPromptResponse(promptName, providedArgs) {
  const prompt = PROMPT_REGISTRY.find((p) => p.name === promptName);
  if (!prompt) {
    return { ok: false, code: -32602, message: `Unknown prompt: ${promptName}` };
  }
  const values = {};
  for (const arg of prompt.arguments) {
    const raw = providedArgs?.[arg.name];
    if (raw == null || raw === "") {
      if (arg.required) {
        return { ok: false, code: -32602, message: `Missing required argument "${arg.name}" for prompt "${promptName}"` };
      }
      values[arg.name] = "";
      continue;
    }
    const value = String(raw);
    if (value.length > MAX_PROMPT_ARG_LENGTH) {
      return {
        ok: false,
        code: -32602,
        message: `Argument "${arg.name}" for prompt "${promptName}" exceeds the ${MAX_PROMPT_ARG_LENGTH}-character limit`
      };
    }
    values[arg.name] = value;
  }
  const renderedIntro = substituteString(
    applyIntroSubstitutions(prompt.intro, prompt.intro_substitutions, values),
    values
  );
  const lines = [renderedIntro, ""];
  prompt.steps.forEach((step, i) => {
    const rawArgs = substituteValue(step.args, values);
    const renderedArgs = Object.fromEntries(
      Object.entries(rawArgs).filter(([, v]) => v !== "")
    );
    lines.push(`Step ${i + 1} \u2014 ${step.tool}`);
    lines.push(`  purpose: ${substituteString(step.purpose, values)}`);
    lines.push(`  arguments: ${JSON.stringify(renderedArgs)}`);
    lines.push(`  jmespath: ${step.jmespath}`);
    lines.push("");
  });
  return {
    ok: true,
    description: prompt.description,
    messages: [
      { role: "user", content: { type: "text", text: lines.join("\n").trimEnd() } }
    ]
  };
}
function validatePromptRegistry() {
  const namesSeen = /* @__PURE__ */ new Set();
  for (const prompt of PROMPT_REGISTRY) {
    if (namesSeen.has(prompt.name)) {
      throw new Error(`api/mcp/prompts/index.ts: duplicate prompt name "${prompt.name}".`);
    }
    namesSeen.add(prompt.name);
    const argNames = /* @__PURE__ */ new Set();
    for (const arg of prompt.arguments) {
      if (argNames.has(arg.name)) {
        throw new Error(`api/mcp/prompts/index.ts: prompt "${prompt.name}" declares duplicate argument "${arg.name}".`);
      }
      argNames.add(arg.name);
    }
    const introTokens = new Set(prompt.intro_substitutions ? Object.keys(prompt.intro_substitutions) : []);
    const validateTokensIn = (where, s) => {
      for (const tok of collectTokens(s)) {
        if (!argNames.has(tok) && !introTokens.has(tok)) {
          throw new Error(`api/mcp/prompts/index.ts: prompt "${prompt.name}" ${where} references unknown token "\${${tok}}". Declared args: [${[...argNames].join(", ")}]${introTokens.size ? `; intro substitutions: [${[...introTokens].join(", ")}]` : ""}.`);
        }
      }
    };
    validateTokensIn("intro", prompt.intro);
    if (prompt.intro_substitutions) {
      for (const [name, spec] of Object.entries(prompt.intro_substitutions)) {
        for (const tok of collectTokens(spec.when_present)) {
          if (!argNames.has(tok)) {
            throw new Error(`api/mcp/prompts/index.ts: prompt "${prompt.name}" intro_substitutions.${name}.when_present references unknown token "\${${tok}}".`);
          }
        }
        for (const tok of collectTokens(spec.when_absent)) {
          if (!argNames.has(tok)) {
            throw new Error(`api/mcp/prompts/index.ts: prompt "${prompt.name}" intro_substitutions.${name}.when_absent references unknown token "\${${tok}}".`);
          }
        }
      }
    }
    for (const [i, step] of prompt.steps.entries()) {
      const sink = [];
      collectTokensFromValue(step.args, sink);
      for (const tok of sink) {
        if (!argNames.has(tok)) {
          throw new Error(`api/mcp/prompts/index.ts: prompt "${prompt.name}" step ${i + 1} (${step.tool}) args reference unknown token "\${${tok}}".`);
        }
      }
      validateTokensIn(`step ${i + 1} (${step.tool}) purpose`, step.purpose);
    }
  }
}
validatePromptRegistry();
var PROMPT_LIST_RESPONSE = PROMPT_REGISTRY.map((p) => ({
  name: p.name,
  description: p.description,
  arguments: p.arguments.map((a) => ({ ...a }))
}));
export {
  MAX_PROMPT_ARG_LENGTH,
  PROMPT_LIST_RESPONSE,
  PROMPT_REGISTRY,
  buildPromptResponse
};
