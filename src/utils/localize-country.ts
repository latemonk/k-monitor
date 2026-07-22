/**
 * KCG fork — ISO 국가코드 → 한국어 국가명 (브라우저 내장 Intl.DisplayNames).
 * 별도 사전 없이 전 세계 국가명을 한국어로 표시한다. 실패 시 원문 유지.
 */
let display: Intl.DisplayNames | null | undefined;

export function localizeCountryName(code: string | undefined | null, fallback: string): string {
  if (!code || !/^[A-Za-z]{2}$/.test(code)) return fallback;
  if (display === undefined) {
    try {
      display = new Intl.DisplayNames(['ko'], { type: 'region' });
    } catch {
      display = null;
    }
  }
  if (!display) return fallback;
  try {
    const name = display.of(code.toUpperCase());
    return name && name !== code.toUpperCase() ? name : fallback;
  } catch {
    return fallback;
  }
}
