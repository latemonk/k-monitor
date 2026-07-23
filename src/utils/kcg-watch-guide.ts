/**
 * KCG fork(07-24 사장님 지시) — 관심 등록 안내 인터랙션.
 *
 * 지도(우클릭 메뉴·플로팅 카드)에서 관심 선박/항공기를 등록하는 순간,
 * 등록 지점에서 아래 카드(패널)의 해당 행까지 칩(🚢/✈️)이 날아가고
 * 도착한 행이 잠깐 빛난다 — "등록하면 어디에 보이는지"를 눈으로 따라가게.
 *
 * 흐름: 등록 주체가 announceWatchAdded() 호출 → 'kcg:watch-added' 이벤트
 * → 수신 패널이 (동기적으로) detail.handled 를 세우고 관심 탭/섹션으로
 * 전환한 뒤 flyWatchChip()+pulseWatchRow() 실행. 현재 감시 탭 프리셋에
 * 해당 카드가 없어 아무도 안 받으면 토스트로 위치를 알려준다.
 */
import { showToast } from '@/utils/toast';

export const KCG_WATCH_ADDED_EVENT = 'kcg:watch-added';

export interface KcgWatchAddedDetail {
  kind: 'vessel' | 'aircraft';
  id: string;
  label: string;
  /** 칩 출발점(등록 UI 의 화면 좌표, px). */
  fromX: number;
  fromY: number;
  /** 안내를 수행한 패널이 동기적으로 true 로 바꾼다. */
  handled?: boolean;
}

export function announceWatchAdded(detail: KcgWatchAddedDetail): void {
  try {
    window.dispatchEvent(new CustomEvent(KCG_WATCH_ADDED_EVENT, { detail }));
  } catch { /* SSR/테스트 환경 */ }
  if (!detail.handled) {
    showToast(detail.kind === 'vessel'
      ? `${detail.label} — 관심 선박으로 등록했어요. 「해역 선박 현황」 카드의 관심 탭에서 볼 수 있어요`
      : `${detail.label} — 관심 항공기로 등록했어요. 「공역 항공기 현황」 카드에서 볼 수 있어요`);
  }
}

/**
 * 등록 지점 → 목표 행까지 칩 비행(~0.85초, 살짝 포물선).
 * 패널 스무스 스크롤 중에도 목표를 놓치지 않도록 WAAPI 대신 rAF 로
 * 매 프레임 목표 rect 를 다시 읽는다.
 */
export function flyWatchChip(
  fromX: number,
  fromY: number,
  target: HTMLElement,
  kind: 'vessel' | 'aircraft',
  onArrive?: () => void,
): void {
  const chip = document.createElement('div');
  chip.textContent = kind === 'vessel' ? '🚢' : '✈️';
  chip.setAttribute('aria-hidden', 'true');
  chip.style.cssText = [
    'position:fixed', 'left:0', 'top:0', 'z-index:3000', 'font-size:20px',
    'pointer-events:none', 'will-change:transform,opacity',
    'filter:drop-shadow(0 2px 6px rgba(0,209,255,0.8))',
  ].join(';');
  document.body.appendChild(chip);
  const DURATION_MS = 850;
  const started = performance.now();
  const ease = (t: number) => 1 - (1 - t) ** 3;
  const step = (now: number) => {
    if (!chip.isConnected) return;
    const t = Math.min(1, (now - started) / DURATION_MS);
    const r = target.getBoundingClientRect();
    const endX = r.left + Math.min(r.width, 140) / 2;
    const endY = r.top + r.height / 2;
    const k = ease(t);
    const x = fromX + (endX - fromX) * k;
    // 위로 40px 떴다가 내려앉는 포물선 — 직선보다 시선을 잘 끈다.
    const y = fromY + (endY - fromY) * k + Math.sin(Math.PI * k) * -40;
    chip.style.transform = `translate(${x - 10}px, ${y - 10}px) scale(${1 - 0.35 * k})`;
    chip.style.opacity = t > 0.85 ? String(1 - (t - 0.85) / 0.15) : '1';
    if (t < 1) { requestAnimationFrame(step); return; }
    chip.remove();
    onArrive?.();
  };
  requestAnimationFrame(step);
}

/** 도착한 행을 두 번 펄스(하이라이트). 전역 keyframes 는 1회만 주입. */
export function pulseWatchRow(el: HTMLElement): void {
  if (!document.getElementById('kcg-watch-pulse-style')) {
    const style = document.createElement('style');
    style.id = 'kcg-watch-pulse-style';
    style.textContent = `
      @keyframes kcg-watch-pulse {
        0% { box-shadow: 0 0 0 0 rgba(0,209,255,0.65); background: rgba(0,209,255,0.18); }
        100% { box-shadow: 0 0 0 14px rgba(0,209,255,0); background: transparent; }
      }
      .kcg-watch-pulse { animation: kcg-watch-pulse 1.1s ease-out 2; border-radius: 6px; }
    `;
    document.head.appendChild(style);
  }
  el.classList.add('kcg-watch-pulse');
  setTimeout(() => el.classList.remove('kcg-watch-pulse'), 2400);
}
