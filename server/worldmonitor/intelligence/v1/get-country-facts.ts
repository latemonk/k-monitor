import type {
  ServerContext,
  GetCountryFactsRequest,
  GetCountryFactsResponse,
} from '../../../../src/generated/server/worldmonitor/intelligence/v1/service_server';

import { cachedFetchJson } from '../../../_shared/redis';
import { CHROME_UA } from '../../../_shared/constants';

const FACTS_TTL = 86400;
const NEGATIVE_TTL = 120;
const UPSTREAM_TIMEOUT = 10_000;

interface RestCountryData {
  name?: { common?: string };
  population?: number;
  capital?: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name?: string }>;
  area?: number;
}

interface WikidataBinding {
  headLabel?: { value?: string };
  officeLabel?: { value?: string };
}

interface WikidataResponse {
  results?: { bindings?: WikidataBinding[] };
}

interface WikipediaSummary {
  extract?: string;
  thumbnail?: { source?: string };
}

const EMPTY: GetCountryFactsResponse = {
  headOfState: '',
  headOfStateTitle: '',
  wikipediaSummary: '',
  wikipediaThumbnailUrl: '',
  population: 0,
  capital: '',
  languages: [],
  currencies: [],
  areaSqKm: 0,
  countryName: '',
};

export async function getCountryFacts(
  _ctx: ServerContext,
  req: GetCountryFactsRequest,
): Promise<GetCountryFactsResponse> {
  if (!req.countryCode) return EMPTY;

  const code = req.countryCode.toUpperCase();

  const [rcData, wikiData] = await Promise.all([
    fetchRestCountries(code),
    fetchWikidata(code),
  ]);

  const countryName = rcData?.name?.common ?? '';

  const wikiSummary = countryName ? await fetchWikipediaSummary(code, countryName) : null;

  return {
    headOfState: wikiData?.headOfState ?? '',
    headOfStateTitle: wikiData?.headOfStateTitle ?? '',
    wikipediaSummary: wikiSummary?.extract ?? '',
    wikipediaThumbnailUrl: wikiSummary?.thumbnailUrl ?? '',
    population: rcData?.population ?? 0,
    capital: rcData?.capital?.[0] ?? '',
    languages: rcData?.languages ? Object.values(rcData.languages) : [],
    currencies: rcData?.currencies
      ? Object.values(rcData.currencies).map(c => c.name ?? '').filter(Boolean)
      : [],
    areaSqKm: rcData?.area ?? 0,
    countryName,
  };
}

// KCG fork(07-23): restcountries.com 은 v1~v4 를 폐기하고 v5 를 API 키
// 필수(Bearer)로 전환 — 기존 v3.1 호출은 200 + {success:false} 봉투를
// 돌려줘서 국가 개요 카드가 조용히 비어 있었다. 같은 스키마의 무키
// 대체 소스 2종으로 교체:
//   - world-countries(npm, jsDelivr CDN) 정적 JSON — 이름·수도·언어·통화·
//     면적 (restcountries 가 쓰던 mledoze/countries 원본 데이터)
//   - World Bank SP.POP.TOTL(mrv=1) — 인구
// RestCountryData 반환 형태는 그대로 유지해 아래 소비부는 무변경.
const WORLD_COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-countries@5.1.0/countries.json';
const WORLD_COUNTRIES_CACHE_KEY = 'intel:country-facts:world-countries:v1';
const WORLD_COUNTRIES_TTL = 30 * 86400; // 정적 패키지 — 사실상 불변

interface WorldCountryEntry {
  cca2?: string;
  name?: { common?: string };
  capital?: string[];
  languages?: Record<string, string>;
  currencies?: Record<string, { name?: string }>;
  area?: number;
}

async function fetchWorldCountriesIndex(): Promise<Record<string, WorldCountryEntry> | null> {
  try {
    return await cachedFetchJson<Record<string, WorldCountryEntry>>(
      WORLD_COUNTRIES_CACHE_KEY,
      WORLD_COUNTRIES_TTL,
      async () => {
        try {
          const resp = await fetch(WORLD_COUNTRIES_URL, {
            headers: { 'User-Agent': CHROME_UA },
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
          });
          if (!resp.ok) return null;
          const data = (await resp.json()) as WorldCountryEntry[];
          if (!Array.isArray(data) || data.length === 0) return null;
          const byCode: Record<string, WorldCountryEntry> = {};
          for (const entry of data) {
            if (entry?.cca2) byCode[entry.cca2.toUpperCase()] = entry;
          }
          return byCode;
        } catch {
          return null;
        }
      },
      NEGATIVE_TTL,
    );
  } catch {
    return null;
  }
}

async function fetchWorldBankPopulation(code: string): Promise<number> {
  try {
    const result = await cachedFetchJson<{ population: number }>(
      `intel:country-facts:population:${code}`,
      FACTS_TTL,
      async () => {
        try {
          const resp = await fetch(
            `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}/indicator/SP.POP.TOTL?format=json&mrv=1`,
            { headers: { 'User-Agent': CHROME_UA }, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT) },
          );
          if (!resp.ok) return null;
          const data = await resp.json() as [unknown, Array<{ value?: number | null }>?];
          const value = Number(data?.[1]?.[0]?.value ?? 0);
          return Number.isFinite(value) && value > 0 ? { population: value } : null;
        } catch {
          return null;
        }
      },
      NEGATIVE_TTL,
    );
    return result?.population ?? 0;
  } catch {
    return 0;
  }
}

async function fetchRestCountries(code: string): Promise<RestCountryData | null> {
  const [index, population] = await Promise.all([
    fetchWorldCountriesIndex(),
    fetchWorldBankPopulation(code),
  ]);
  const entry = index?.[code];
  if (!entry) return null;
  return {
    name: entry.name,
    population,
    capital: entry.capital,
    languages: entry.languages,
    currencies: entry.currencies,
    area: entry.area,
  };
}

interface WikiResult {
  headOfState: string;
  headOfStateTitle: string;
}

async function fetchWikidata(code: string): Promise<WikiResult | null> {
  if (!/^[A-Z]{2}$/.test(code)) return null;
  try {
    return await cachedFetchJson<WikiResult>(
      `intel:country-facts:wiki:${code}`,
      FACTS_TTL,
      async () => {
        try {
          const sparql = `SELECT ?headLabel ?officeLabel WHERE { ?country wdt:P297 "${code}". ?country p:P35 ?stmt. ?stmt ps:P35 ?head. FILTER NOT EXISTS { ?stmt pq:P582 ?end } OPTIONAL { ?stmt pq:P39 ?office } SERVICE wikibase:label { bd:serviceParam wikibase:language "en" } } LIMIT 1`;
          const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(sparql)}`;
          const resp = await fetch(url, {
            headers: { 'User-Agent': CHROME_UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
          });
          if (!resp.ok) return null;
          const data = (await resp.json()) as WikidataResponse;
          const binding = data.results?.bindings?.[0];
          if (!binding) return null;
          return {
            headOfState: binding.headLabel?.value ?? '',
            headOfStateTitle: binding.officeLabel?.value ?? '',
          };
        } catch {
          return null;
        }
      },
      NEGATIVE_TTL,
    );
  } catch {
    return null;
  }
}

interface WikiSummaryResult {
  extract: string;
  thumbnailUrl: string;
}

async function fetchWikipediaSummary(code: string, countryName: string): Promise<WikiSummaryResult | null> {
  try {
    return await cachedFetchJson<WikiSummaryResult>(
      `intel:country-facts:wikisummary:${code}`,
      FACTS_TTL,
      async () => {
        try {
          const encoded = encodeURIComponent(countryName);
          const resp = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`, {
            headers: { 'User-Agent': CHROME_UA },
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
          });
          if (!resp.ok) return null;
          const data = (await resp.json()) as WikipediaSummary;
          return {
            extract: data.extract ?? '',
            thumbnailUrl: data.thumbnail?.source ?? '',
          };
        } catch {
          return null;
        }
      },
      NEGATIVE_TTL,
    );
  } catch {
    return null;
  }
}
