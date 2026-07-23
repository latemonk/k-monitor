/**
 * KCG fork — Korean display labels for server-provided English domain terms
 * (UN Comtrade HS product labels, chokepoint names, war-risk tiers, country
 * names). The upstream RPC payloads carry English labels; these helpers map
 * them for the Korean-only console without touching the server contracts.
 */

// HS4 codes tracked by the bilateral store (_bilateral-hs4-lazy.ts HS4_LABELS)
const KO_HS4_LABELS: Record<string, string> = {
  '2709': '원유',
  '2711': 'LNG·석유가스',
  '8542': '반도체',
  '8517': '스마트폰·통신장비',
  '8703': '승용차',
  '3004': '의약품',
  '7108': '금',
  '2710': '석유제품',
  '8471': '컴퓨터',
  '8411': '터보제트·터빈',
  '7601': '알루미늄',
  '7202': '합금철(철강)',
  '3901': '플라스틱(폴리에틸렌)',
  '2902': '화학제품(탄화수소)',
  '1001': '밀',
  '1201': '대두',
  '6204': '여성 의류(직물)',
  '0203': '돼지고기',
  '8704': '상용차',
  '8708': '자동차 부품',
};

export function koHs4Label(hs4: string, fallback: string): string {
  return KO_HS4_LABELS[hs4] ?? fallback;
}

// HS2 sector labels (supply-chain HS2_SHORT_LABELS mirror)
const KO_HS2_LABELS: Record<string, string> = {
  '27': '에너지',
  '84': '기계',
  '85': '전자',
  '87': '자동차',
  '30': '의약품',
  '72': '철강',
  '39': '플라스틱',
  '29': '화학',
  '10': '곡물',
  '62': '의류',
};

export function koHs2Label(hs2: string, fallback: string): string {
  return KO_HS2_LABELS[hs2] ?? fallback;
}

// Chokepoint / strategic waterway names. Server payloads send display names
// (mixed case), config sends ids — support both.
const KO_CHOKEPOINT_BY_KEY: Record<string, string> = {
  taiwan_strait: '대만해협',
  malacca_strait: '믈라카 해협',
  hormuz_strait: '호르무즈 해협',
  bosphorus: '보스포루스 해협',
  suez: '수에즈 운하',
  panama: '파나마 운하',
  gibraltar: '지브롤터 해협',
  bab_el_mandeb: '바브엘만데브 해협',
  cape_of_good_hope: '희망봉 항로',
  dover_strait: '도버 해협',
  korea_strait: '대한해협',
  'taiwan strait': '대만해협',
  'malacca strait': '믈라카 해협',
  'strait of malacca': '믈라카 해협',
  'hormuz strait': '호르무즈 해협',
  'strait of hormuz': '호르무즈 해협',
  'bosphorus strait': '보스포루스 해협',
  'suez canal': '수에즈 운하',
  'panama canal': '파나마 운하',
  'strait of gibraltar': '지브롤터 해협',
  'bab el-mandeb': '바브엘만데브 해협',
  'cape of good hope': '희망봉 항로',
  'dover strait': '도버 해협',
  'english channel': '영국해협',
};

export function koChokepointName(idOrName: string): string {
  if (!idOrName) return idOrName;
  return KO_CHOKEPOINT_BY_KEY[idOrName.trim().toLowerCase()] ?? idOrName;
}

// War-risk tier (proto enum suffix, underscores already stripped by callers)
const KO_WAR_RISK_TIERS: Record<string, string> = {
  UNSPECIFIED: '보통',
  NORMAL: '보통',
  ELEVATED: '주의',
  HIGH: '높음',
  CRITICAL: '심각',
  'WAR ZONE': '전쟁 지역',
};

export function koWarRiskTier(tierShort: string): string {
  return KO_WAR_RISK_TIERS[tierShort.trim().toUpperCase()] ?? tierShort;
}

let displayNames: Intl.DisplayNames | null | undefined;

/**
 * ISO2 country code → Korean country name (falls back to the input).
 * Non-code inputs (already-resolved names) pass through unchanged.
 */
/**
 * Preferred Korean display name for a country. Resolves from the ISO2 code
 * (covers every country via Intl.DisplayNames); falls back to the provided
 * (English) name when the code can't be resolved to a localized name.
 */
export function koCountryDisplayName(code: string, fallback: string): string {
  const resolved = koCountryName(code);
  return /^[A-Z]{2}$/.test(resolved) ? fallback : resolved;
}

export function koCountryName(codeOrName: string): string {
  if (!/^[A-Za-z]{2}$/.test(codeOrName)) return codeOrName;
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(['ko'], { type: 'region' });
    } catch {
      displayNames = null;
    }
  }
  if (!displayNames) return codeOrName.toUpperCase();
  try {
    return displayNames.of(codeOrName.toUpperCase()) ?? codeOrName.toUpperCase();
  } catch {
    return codeOrName.toUpperCase();
  }
}
