/**
 * MMSI → flag state resolution (KCG fork).
 *
 * The first 3 digits of an MMSI are the Maritime Identification Digits
 * (MID, ITU assignment) identifying the flag state. AIS position reports
 * carry no explicit nationality field, so this is the standard way to
 * derive vessel nationality from live AIS data.
 */

export interface FlagInfo {
  /** ISO 3166-1 alpha-2 (uppercase). 'XX' = unknown. */
  iso: string;
  /** Korean short name for display. */
  nameKo: string;
}

// Compact MID table — East Asia / Pacific neighbors get priority coverage,
// followed by the major flag-of-convenience registries and trading fleets
// commonly seen in Korean waters.
const MID_TABLE: Record<string, FlagInfo> = {
  // Korea and immediate neighbors
  '440': { iso: 'KR', nameKo: '대한민국' },
  '441': { iso: 'KR', nameKo: '대한민국' },
  '445': { iso: 'KP', nameKo: '북한' },
  '412': { iso: 'CN', nameKo: '중국' },
  '413': { iso: 'CN', nameKo: '중국' },
  '414': { iso: 'CN', nameKo: '중국' },
  '453': { iso: 'MO', nameKo: '마카오' },
  '477': { iso: 'HK', nameKo: '홍콩' },
  '416': { iso: 'TW', nameKo: '대만' },
  '431': { iso: 'JP', nameKo: '일본' },
  '432': { iso: 'JP', nameKo: '일본' },
  '273': { iso: 'RU', nameKo: '러시아' },
  // Southeast / South Asia
  '533': { iso: 'MY', nameKo: '말레이시아' },
  '525': { iso: 'ID', nameKo: '인도네시아' },
  '563': { iso: 'SG', nameKo: '싱가포르' },
  '564': { iso: 'SG', nameKo: '싱가포르' },
  '565': { iso: 'SG', nameKo: '싱가포르' },
  '566': { iso: 'SG', nameKo: '싱가포르' },
  '567': { iso: 'TH', nameKo: '태국' },
  '574': { iso: 'VN', nameKo: '베트남' },
  '548': { iso: 'PH', nameKo: '필리핀' },
  '419': { iso: 'IN', nameKo: '인도' },
  // Flag-of-convenience registries (common in commercial traffic)
  '352': { iso: 'PA', nameKo: '파나마' },
  '351': { iso: 'PA', nameKo: '파나마' },
  '353': { iso: 'PA', nameKo: '파나마' },
  '354': { iso: 'PA', nameKo: '파나마' },
  '355': { iso: 'PA', nameKo: '파나마' },
  '356': { iso: 'PA', nameKo: '파나마' },
  '357': { iso: 'PA', nameKo: '파나마' },
  '370': { iso: 'PA', nameKo: '파나마' },
  '371': { iso: 'PA', nameKo: '파나마' },
  '372': { iso: 'PA', nameKo: '파나마' },
  '373': { iso: 'PA', nameKo: '파나마' },
  '374': { iso: 'PA', nameKo: '파나마' },
  '636': { iso: 'LR', nameKo: '라이베리아' },
  '637': { iso: 'LR', nameKo: '라이베리아' },
  '538': { iso: 'MH', nameKo: '마셜제도' },
  '518': { iso: 'CK', nameKo: '쿡제도' },
  '308': { iso: 'BS', nameKo: '바하마' },
  '309': { iso: 'BS', nameKo: '바하마' },
  '311': { iso: 'BS', nameKo: '바하마' },
  '215': { iso: 'MT', nameKo: '몰타' },
  '229': { iso: 'MT', nameKo: '몰타' },
  '248': { iso: 'MT', nameKo: '몰타' },
  '249': { iso: 'MT', nameKo: '몰타' },
  '256': { iso: 'MT', nameKo: '몰타' },
  '209': { iso: 'CY', nameKo: '키프로스' },
  '210': { iso: 'CY', nameKo: '키프로스' },
  '212': { iso: 'CY', nameKo: '키프로스' },
  '572': { iso: 'TV', nameKo: '투발루' },
  '577': { iso: 'VU', nameKo: '바누아투' },
  '620': { iso: 'KM', nameKo: '코모로' },
  '671': { iso: 'TG', nameKo: '토고' },
  '613': { iso: 'CM', nameKo: '카메룬' },
  '511': { iso: 'PW', nameKo: '팔라우' },
  '529': { iso: 'KI', nameKo: '키리바시' },
  '312': { iso: 'BZ', nameKo: '벨리즈' },
  '341': { iso: 'KN', nameKo: '세인트키츠네비스' },
  '375': { iso: 'VC', nameKo: '세인트빈센트' },
  '376': { iso: 'VC', nameKo: '세인트빈센트' },
  '377': { iso: 'VC', nameKo: '세인트빈센트' },
  '667': { iso: 'SL', nameKo: '시에라리온' },
  '677': { iso: 'TZ', nameKo: '탄자니아' },
  '450': { iso: 'MN', nameKo: '몽골' }, // Mongolia open registry — Korea-waters watch item
  '457': { iso: 'MN', nameKo: '몽골' },
  // Major trading fleets
  '366': { iso: 'US', nameKo: '미국' },
  '367': { iso: 'US', nameKo: '미국' },
  '368': { iso: 'US', nameKo: '미국' },
  '369': { iso: 'US', nameKo: '미국' },
  '232': { iso: 'GB', nameKo: '영국' },
  '233': { iso: 'GB', nameKo: '영국' },
  '234': { iso: 'GB', nameKo: '영국' },
  '235': { iso: 'GB', nameKo: '영국' },
  '211': { iso: 'DE', nameKo: '독일' },
  '218': { iso: 'DE', nameKo: '독일' },
  '226': { iso: 'FR', nameKo: '프랑스' },
  '227': { iso: 'FR', nameKo: '프랑스' },
  '228': { iso: 'FR', nameKo: '프랑스' },
  '244': { iso: 'NL', nameKo: '네덜란드' },
  '245': { iso: 'NL', nameKo: '네덜란드' },
  '246': { iso: 'NL', nameKo: '네덜란드' },
  '219': { iso: 'DK', nameKo: '덴마크' },
  '220': { iso: 'DK', nameKo: '덴마크' },
  '257': { iso: 'NO', nameKo: '노르웨이' },
  '258': { iso: 'NO', nameKo: '노르웨이' },
  '259': { iso: 'NO', nameKo: '노르웨이' },
  '240': { iso: 'GR', nameKo: '그리스' },
  '239': { iso: 'GR', nameKo: '그리스' },
  '241': { iso: 'GR', nameKo: '그리스' },
  '247': { iso: 'IT', nameKo: '이탈리아' },
  '503': { iso: 'AU', nameKo: '호주' },
  '512': { iso: 'NZ', nameKo: '뉴질랜드' },
  '422': { iso: 'IR', nameKo: '이란' },
  '470': { iso: 'AE', nameKo: 'UAE' },
  '576': { iso: 'AE', nameKo: 'UAE' },
  '403': { iso: 'SA', nameKo: '사우디' },
};

const UNKNOWN_FLAG: FlagInfo = { iso: 'XX', nameKo: '미상' };

export function flagFromMmsi(mmsi: string | number | undefined | null): FlagInfo {
  const s = String(mmsi ?? '').trim();
  if (s.length < 3) return UNKNOWN_FLAG;
  return MID_TABLE[s.slice(0, 3)] ?? UNKNOWN_FLAG;
}

/** ISO alpha-2 → regional-indicator flag emoji ('XX' → white flag). */
export function flagEmoji(iso: string): string {
  if (!/^[A-Z]{2}$/.test(iso) || iso === 'XX') return '\u{1F3F3}\u{FE0F}';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso.charCodeAt(0) - 65, A + iso.charCodeAt(1) - 65);
}

/** AIS ship type (ITU-R M.1371 first digit classes) → Korean label. */
export function shipTypeKo(shipType: number | undefined | null): string {
  const t = Number(shipType);
  if (!Number.isFinite(t) || t <= 0) return '미상';
  if (t === 30) return '어선';
  if (t === 31 || t === 32) return '예인선(예항)';
  if (t === 33) return '준설·수중작업선';
  if (t === 35) return '군함';
  if (t === 36) return '요트(범선)';
  if (t === 37) return '레저보트';
  if (t >= 40 && t <= 49) return '고속선';
  if (t === 50) return '도선선';
  if (t === 51) return '수색구조선';
  if (t === 52) return '예인선';
  if (t === 53) return '항만지원선';
  if (t === 55) return '경비함정';
  if (t >= 60 && t <= 69) return '여객선';
  if (t >= 70 && t <= 79) return '화물선';
  if (t >= 80 && t <= 89) return '유조선(탱커)';
  if (t >= 90 && t <= 99) return '기타 선박';
  return '기타';
}

/**
 * Flag → deck.gl RGBA color for the vessel layer. Categories chosen for
 * operational salience in Korean waters, not aesthetics: ROK blue-cyan,
 * PRC orange, Japan green, Russia violet, DPRK red, unknown-flag bright
 * pink (needs attention), everything else neutral gray.
 */
export function flagColor(iso: string): [number, number, number, number] {
  switch (iso) {
    case 'KR': return [0, 209, 255, 230];
    case 'CN': return [255, 140, 26, 230];
    case 'JP': return [46, 204, 113, 230];
    case 'RU': return [155, 89, 255, 230];
    case 'KP': return [231, 60, 60, 240];
    case 'XX': return [255, 64, 160, 240];
    default: return [170, 178, 189, 210];
  }
}


/**
 * 선종 기반 색상 (마린트래픽 스타일) — 화물 주황, 탱커 빨강, 어선 연두,
 * 여객 파랑, 예인·작업 청록, 고속 보라, 기타 회색. 북한/국적미상 선박은
 * 선종과 무관하게 경보색으로 오버라이드(관제 시인성).
 */
export function shipTypeColor(shipType: number | undefined | null, flagIso?: string): [number, number, number, number] {
  if (flagIso === 'KP') return [255, 0, 60, 255];
  if (flagIso === 'XX') return [255, 20, 147, 255];
  const t = Number(shipType);
  if (!Number.isFinite(t) || t <= 0) return [168, 168, 168, 230];
  if (t === 30) return [154, 205, 50, 240];
  if ((t >= 31 && t <= 33) || (t >= 50 && t <= 53)) return [0, 188, 212, 240];
  if (t === 35 || t === 55) return [255, 255, 255, 240];
  if (t >= 40 && t <= 49) return [186, 85, 211, 240];
  if (t >= 60 && t <= 69) return [41, 121, 255, 240];
  if (t >= 70 && t <= 79) return [243, 156, 18, 240];
  if (t >= 80 && t <= 89) return [231, 76, 60, 240];
  return [168, 168, 168, 230];
}
