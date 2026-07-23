// api/kcg-anomaly.js
var config = { runtime: "edge" };
var SYSTEM_PROMPT = `\uB2F9\uC2E0\uC740 \uD574\uC5ED \uAD00\uC81C \uC0C1\uD669\uC2E4\uC758 \uC120\uBC15 \uD65C\uB3D9 \uD310\uB3C5 \uBD84\uC11D\uAD00\uC774\uB2E4. \uD55C\uAD6D \uADFC\uD574 \uAC10\uC2DC \uAD6C\uC5ED\uC758 \uD604\uC7AC \uC120\uBC15 \uD65C\uB3D9 \uC694\uC57D\uACFC \uC9C1\uC804 \uC694\uC57D(\uBCA0\uC774\uC2A4\uB77C\uC778), \uADF8\uB9AC\uACE0 \uAD00\uC81C \uADFC\uBB34\uC790\uAC00 \uC785\uB825\uD55C "\uD3C9\uC18C \uAE30\uC900"\uACFC "\uACBD\uBCF4 \uAE30\uC900"\uC744 \uBC1B\uB294\uB2E4. \uD604\uC7AC \uD65C\uB3D9\uC774 \uD3C9\uC18C \uAE30\uC900\uC5D0\uC11C \uC720\uC758\uBBF8\uD558\uAC8C \uBC97\uC5B4\uB0AC\uB294\uC9C0, \uACBD\uBCF4 \uAE30\uC900\uC5D0 \uD574\uB2F9\uD558\uB294 \uD65C\uB3D9\uC774 \uC788\uB294\uC9C0 \uD310\uB2E8\uD558\uB77C.

\u2605\u2605 \uC624\uD0D0 \uBC29\uC9C0(\uB9E4\uC6B0 \uC911\uC694): \uC544\uB798\uB294 \uC815\uC0C1\uC801\xB7\uBC18\uBCF5\uC801 \uD604\uC0C1\uC774\uBA70 \uC774\uC0C1 \uD65C\uB3D9\uC774 \uC544\uB2C8\uB2E4. \uC774\uB7F0 \uAC83\uB9CC \uBCF4\uC774\uBA74 anomaly_score\uB97C \uB0AE\uAC8C(0~15) \uC8FC\uACE0 triggered=false\uB85C \uD558\uB77C:
 \u2460 \uC5B4\uC120\uC758 \uC870\uC5C5 \uC2DC\uAC04\uB300(\uC0C8\uBCBD \uCD9C\uD56D\xB7\uC800\uB141 \uC785\uD56D)\uC5D0 \uB530\uB978 \uCC99\uC218 \uC99D\uAC10
 \u2461 \uC5EC\uAC1D\uC120\xB7\uC815\uAE30 \uD654\uBB3C\uC120\uC758 \uC815\uC2DC \uC6B4\uD56D \uD328\uD134
 \u2462 \uAE30\uC0C1 \uC545\uD654 \uC2DC \uC120\uBC15\uB4E4\uC774 \uD56D\uB9CC\xB7\uBB18\uBC15\uC9C0\uB85C \uB300\uD53C\uD574 \uC9D1\uACB0\uD558\uB294 \uD604\uC0C1
 \u2463 \uC18C\uC218 \uC120\uBC15(1~2\uCC99)\uC758 \uC77C\uC2DC\uC801 \uC18D\uB825\xB7\uCE68\uB85C \uBCC0\uD654
 \u2464 \uC9D1\uACC4 \uC2DC\uCC28\uB85C \uC778\uD55C \uC18C\uD3ED(\xB120% \uC774\uB0B4)\uC758 \uCC99\uC218 \uBCC0\uB3D9
\uC774\uC0C1 \uD65C\uB3D9\uC73C\uB85C \uD310\uB2E8\uD558\uB824\uBA74 \uB2E4\uC74C \uAC19\uC740 \uB69C\uB837\uD55C \uC2E0\uD638\uAC00 \uD544\uC694\uD558\uB2E4: \uD2B9\uC815 \uAD6C\uC5ED\uC5D0\uC11C \uB2E4\uC218 \uC120\uBC15\uC758 AIS \uC2E0\uD638 \uB3D9\uC2DC \uC18C\uC2E4, \uC57C\uAC04 \uACE0\uC18D \uC774\uB3D9 \uC120\uBC15\uC758 \uC811\uADFC, \uAD6D\uC801 \uBBF8\uC0C1\xB7\uBE44\uC815\uC0C1 \uAD6D\uC801 \uC870\uD569 \uC120\uBC15\uC758 \uCD9C\uD604\uC774\uB098 \uCCB4\uB958, \uB450 \uC120\uBC15\uC758 \uD574\uC0C1 \uBC00\uCC29(\uD658\uC801 \uC758\uC2EC), \uACBD\uBCF4 \uAE30\uC900\uC5D0 \uBA85\uC2DC\uB41C \uC870\uAC74\uC758 \uCDA9\uC871, \uD3C9\uC18C \uB300\uBE44 \uD2B9\uC815 \uAD6D\uC801 \uC120\uBC15\uC758 \uAE09\uACA9\uD55C \uC99D\uAC00. \uC694\uC57D\uC5D0 \uD574\uC591 \uAE30\uC0C1\xB7\uC218\uC628 \uAD00\uCE21\uC774 \uD3EC\uD568\uB418\uBA74 \uD574\uC0C1\uAE30\uC0C1 \uD2B9\uC774\uB3C4 \uD568\uAED8 \uD310\uC815\uD558\uB77C: \uD30C\uACE0\xB7\uB3CC\uD48D\uC758 \uAE09\uACA9\uD55C \uC0C1\uC2B9\uC774\uB098 \uC704\uD5D8(\uACBD\uACC4 \uC774\uC0C1) \uB2E8\uACC4 \uC9C4\uC785, \uC9C1\uC804 \uC9D1\uACC4 \uB300\uBE44 \uC218\uC628\xB7\uD30C\uACE0\uC758 \uAE09\uBCC0\uC740 \uC870\uC5C5\xB7\uD56D\uD589 \uC548\uC804 \uACBD\uBCF4 \uB300\uC0C1\uC774\uB2E4(\uB2E8, \uC774\uBBF8 \uD3C9\uC2DC\uBD80\uD130 \uC720\uC9C0\uB418\uB358 \uB3D9\uC77C \uC218\uC900\uC758 \uC8FC\uC758 \uB2E8\uACC4\uB294 \uBC18\uBCF5 \uACBD\uBCF4\uD558\uC9C0 \uC54A\uB294\uB2E4). \uC560\uB9E4\uD558\uBA74 \uC815\uC0C1\uC73C\uB85C \uBCF4\uC218\uC801\uC73C\uB85C \uD310\uB2E8\uD558\uACE0 \uC810\uC218\uB97C \uB0AE\uCDB0\uB77C. \uBCF4\uC774\uB294 \uC218\uCE58\uB9CC \uADFC\uAC70\uB85C \uD558\uACE0 \uCD94\uCE21\uD558\uC9C0 \uB9C8\uB77C. \uBC18\uB4DC\uC2DC JSON\uB9CC \uCD9C\uB825\uD558\uB77C. \uBAA8\uB4E0 \uBB38\uC790\uC5F4 \uAC12\uC740 \uD55C\uAD6D\uC5B4\uB85C \uC4F4\uB2E4.

\uCD9C\uB825 JSON \uC2A4\uD0A4\uB9C8:
{"triggered": boolean, "anomaly_score": 0~100 \uC815\uC218, "severity": "info"|"watch"|"warning"|"critical", "confidence": "low"|"medium"|"high", "headline": "\uD55C \uC904 \uC694\uC57D(50\uC790 \uC774\uB0B4)", "changes": ["\uBCC0\uD654\xB7\uADFC\uAC70 \uD56D\uBAA9", ...], "caveats": "\uD310\uB2E8\uC758 \uD55C\uACC4\xB7\uC720\uC758\uC810"}`;
// KCG fork(07-24 사장님 지시): 공중 감시 프리셋용 항공 도메인 프롬프트.
var AVIATION_SYSTEM_PROMPT = `당신은 공역 관제 상황실의 항공기 활동 판독 분석관이다. 한반도 권역의 현재 항공기 활동 요약과 직전 요약(베이스라인), 그리고 관제 근무자가 입력한 "평소 기준"과 "경보 기준"을 받는다. 현재 활동이 평소 기준에서 유의미하게 벗어났는지, 경보 기준에 해당하는 활동이 있는지 판단하라.

★★ 오탐 방지(매우 중요): 아래는 정상적·반복적 현상이며 이상 활동이 아니다. 이런 것만 보이면 anomaly_score를 낮게(0~15) 주고 triggered=false로 하라:
 ① 시간대(심야 편수 감소, 아침·저녁 러시) 에 따른 항공기 수 증감
 ② 민항 정기편의 순항·접근·이륙 패턴과 공항 주변 저고도 통과
 ③ 접근·착륙 단계의 정상 강하(활주로 방향 정렬 포함)
 ④ 소수 기체(1~2대)의 일시적 콜사인 미송출(수신 공백·전파 음영)
 ⑤ 집계 시차로 인한 소폭(±20% 이내)의 대수 변동
이상 활동으로 판단하려면 다음 같은 뚜렷한 신호가 필요하다: 비상 스쿼크(7500·7600·7700) 송출, 다수 항공기의 동시 신호 소실, 콜사인 없는 기체의 저고도 체공·선회, 공항 접근 경로와 무관한 저고도 고속 비행, 경보 기준에 명시된 조건의 충족, 평소 대비 특정 구역 활동의 급격한 변화. 애매하면 정상으로 보수적으로 판단하고 점수를 낮춰라. 보이는 수치만 근거로 하고 추측하지 마라. 반드시 JSON만 출력하라. 모든 문자열 값은 한국어로 쓴다.

출력 JSON 스키마:
{"triggered": boolean, "anomaly_score": 0~100 정수, "severity": "info"|"watch"|"warning"|"critical", "confidence": "low"|"medium"|"high", "headline": "한 줄 요약(50자 이내)", "changes": ["변화·근거 항목", ...], "caveats": "판단의 한계·유의점"}`;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}
function providers() {
  const list = [];
  if (process.env.LLM_API_URL && process.env.LLM_API_KEY) {
    list.push({
      url: process.env.LLM_API_URL,
      key: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL || "gpt-4o-mini"
    });
  }
  if (process.env.GROQ_API_KEY) {
    list.push({
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile"
    });
  }
  return list;
}
function clampStr(v, max) {
  return String(v ?? "").slice(0, max);
}
function extractJson(text) {
  const cleaned = String(text || "").replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}
var SEVERITIES = /* @__PURE__ */ new Set(["info", "watch", "warning", "critical"]);
var CONFIDENCES = /* @__PURE__ */ new Set(["low", "medium", "high"]);
async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "POST only" });
  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid JSON body" });
  }
  const baseline = clampStr(body.baseline, 2e3);
  const trigger = clampStr(body.trigger, 2e3);
  const current = clampStr(body.current, 8e3);
  const previous = clampStr(body.previous, 8e3);
  const systemPrompt = body.domain === "aviation" ? AVIATION_SYSTEM_PROMPT : SYSTEM_PROMPT;
  if (!current) return json(400, { error: "current summary required" });
  const userPrompt = [
    "[\uAD00\uC81C \uADFC\uBB34\uC790\uAC00 \uC785\uB825\uD55C \uD3C9\uC18C \uAE30\uC900]",
    baseline || "(\uC785\uB825 \uC5C6\uC74C \u2014 \uC77C\uBC18\uC801\uC778 \uD55C\uAD6D \uADFC\uD574 \uD1B5\uD56D \uD328\uD134\uC744 \uD3C9\uC18C\uB85C \uAC04\uC8FC)",
    "",
    "[\uAD00\uC81C \uADFC\uBB34\uC790\uAC00 \uC785\uB825\uD55C \uACBD\uBCF4 \uAE30\uC900]",
    trigger || "(\uC785\uB825 \uC5C6\uC74C \u2014 \uBA85\uBC31\uD55C \uC774\uC0C1 \uD65C\uB3D9\uB9CC \uACBD\uBCF4)",
    "",
    "[\uC9C1\uC804 \uC9D1\uACC4 \uC694\uC57D(\uBCA0\uC774\uC2A4\uB77C\uC778)]",
    previous || "(\uC9C1\uC804 \uC9D1\uACC4 \uC5C6\uC74C \u2014 \uCCAB \uC9D1\uACC4)",
    "",
    "[\uD604\uC7AC \uC9D1\uACC4 \uC694\uC57D]",
    current
  ].join("\n");
  const providerList = providers();
  if (providerList.length === 0) {
    return json(503, { error: "no LLM provider available" });
  }
  let lastUpstreamStatus = 0;
  for (const p of providerList) {
    try {
      const resp = await fetch(p.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${p.key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: p.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.2,
          // Reasoning-capable models (Gemini Flash via the OpenAI-compat
          // endpoint) spend hidden thinking tokens out of this budget, so
          // keep generous headroom for the actual JSON.
          max_tokens: 4096,
          response_format: { type: "json_object" }
        }),
        signal: AbortSignal.timeout(3e4)
      });
      if (!resp.ok) {
        lastUpstreamStatus = resp.status;
        if (resp.status === 400) {
          const retry = await fetch(p.url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${p.key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: p.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ],
              temperature: 0.2,
              max_tokens: 4096
            }),
            signal: AbortSignal.timeout(3e4)
          });
          if (retry.ok) {
            const data2 = await retry.json();
            const parsed2 = extractJson(data2?.choices?.[0]?.message?.content);
            if (parsed2) return json(200, normalize(parsed2, p.model));
          }
        }
        continue;
      }
      const data = await resp.json();
      const parsed = extractJson(data?.choices?.[0]?.message?.content);
      if (parsed) return json(200, normalize(parsed, p.model));
      lastUpstreamStatus = lastUpstreamStatus || 200;
    } catch {
    }
  }
  return json(502, { error: "LLM providers configured but unavailable", upstreamStatus: lastUpstreamStatus || void 0 });
}
function normalize(v, model) {
  const score = Math.max(0, Math.min(100, Math.round(Number(v.anomaly_score) || 0)));
  return {
    triggered: Boolean(v.triggered),
    anomaly_score: score,
    severity: SEVERITIES.has(v.severity) ? v.severity : score >= 80 ? "critical" : score >= 55 ? "warning" : score >= 30 ? "watch" : "info",
    confidence: CONFIDENCES.has(v.confidence) ? v.confidence : "medium",
    headline: clampStr(v.headline, 120) || "\uD310\uC815 \uACB0\uACFC",
    changes: Array.isArray(v.changes) ? v.changes.slice(0, 10).map((c) => clampStr(c, 300)) : [],
    caveats: clampStr(v.caveats, 500),
    model
  };
}
export {
  config,
  handler as default
};
