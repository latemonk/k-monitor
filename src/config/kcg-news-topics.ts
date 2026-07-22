/**
 * KCG fork — 뉴스 패널 주제 선택.
 * 주제 = 해당 카테고리 digest 안에서 보여줄 소스 이름 부분집합.
 * 소스 이름은 서버 digest 레지스트리(server/worldmonitor/news/v1/_feeds.ts)와
 * 1:1 이어야 실제 아이템이 잡힌다(서버에 없는 client-only 소스는 digest 경로에서
 * 빈 값 — 여기 넣어도 무해하지만 콘텐츠는 서버 등재 소스에서만 온다).
 */

export interface KcgNewsTopic {
  id: string;
  label: string;
  /** 빈 배열 = 전체(필터 없음) */
  sources: string[];
}

export const KCG_NEWS_TOPICS: Record<string, KcgNewsTopic[]> = {
  politics: [
    { id: 'all', label: '전체', sources: [] },
    { id: 'politics', label: '정치', sources: ['정치 뉴스'] },
    { id: 'economy', label: '경제', sources: ['경제 뉴스', '한국경제', '머니투데이'] },
    { id: 'society', label: '사회', sources: ['사회 뉴스', '뉴시스 속보', 'JTBC 속보'] },
    {
      id: 'broadcast',
      label: '방송·통신',
      sources: ['연합뉴스', '연합뉴스TV', 'SBS 뉴스', 'MBN'],
    },
  ],
  intel: [
    { id: 'all', label: '전체', sources: [] },
    {
      id: 'maritime',
      label: '해양',
      sources: [
        '해양경찰 뉴스', '해양수산부', '해상사고 뉴스', '불법조업 뉴스',
        '한국해운신문', '쉬핑뉴스넷', '현대해양', '해사정보신문',
        '해양한국', '한국수산경제',
      ],
    },
    { id: 'nk', label: '북한', sources: ['연합뉴스 북한', '데일리NK', '통일부'] },
    { id: 'disaster', label: '재난', sources: ['재난 뉴스', '기상특보 뉴스', '행정안전부'] },
    {
      id: 'region',
      label: '지역',
      sources: ['인천일보', '제주일보', '전남일보', '강원도민일보', '경남신문'],
    },
  ],
};

export function getKcgNewsTopics(category: string): KcgNewsTopic[] | null {
  return KCG_NEWS_TOPICS[category] ?? null;
}

/**
 * Google News 검색 기반 KCG 쿼리 피드 — 제목이 "기사제목 - 매체명"(중첩 가능)
 * 형태로 와서 리스트가 지저분해진다. 이 소스들에 한해 트레일링 매체명을 걷어낸다.
 */
const KCG_GN_QUERY_SOURCES = new Set([
  '해양경찰 뉴스', '해상사고 뉴스', '기상특보 뉴스', '불법조업 뉴스',
  '정치 뉴스', '경제 뉴스', '사회 뉴스', '재난 뉴스',
]);

export function cleanKcgNewsTitle(source: string, title: string): string {
  if (!KCG_GN_QUERY_SOURCES.has(source)) return title;
  let cleaned = title;
  // 마지막 " - " 뒤 짧은 꼬리(≤30자)만 매체명으로 간주해 최대 2회 제거
  // (정책브리핑처럼 "… - 섹션 | 잡동사니 - 매체명" 이중 꼬리 대응).
  for (let i = 0; i < 2; i++) {
    const idx = cleaned.lastIndexOf(' - ');
    if (idx <= 0) break;
    const tail = cleaned.slice(idx + 3).trim();
    if (tail.length === 0 || tail.length > 30) break;
    cleaned = cleaned.slice(0, idx).trimEnd();
  }
  return cleaned.length >= 5 ? cleaned : title;
}
