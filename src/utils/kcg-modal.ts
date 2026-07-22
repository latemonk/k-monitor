/**
 * KCG fork — 공용 상세 모달. 카드 항목 클릭 시 상세 정보를 띄우는 가벼운
 * 오버레이(ESC/배경 클릭/닫기 버튼으로 닫힘). safeHtml 콘텐츠만 받는다.
 */
import { safeHtml, safeHtmlToString, type SafeHtml } from '@/utils/sanitize';
import { setTrustedHtml, trustedHtml } from '@/utils/dom-utils';

let styleInjected = false;

function ensureStyle(): void {
  if (styleInjected) return;
  styleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .kcg-modal-overlay { position: fixed; inset: 0; z-index: 10001; background: rgba(0,0,0,0.72); display: flex; align-items: center; justify-content: center; padding: 4vh 5vw; }
    .kcg-modal { background: #0f151b; border: 1px solid rgba(0,209,255,0.25); border-radius: 10px; max-width: 860px; width: 100%; max-height: 88vh; display: flex; flex-direction: column; box-shadow: 0 18px 60px rgba(0,0,0,0.6); }
    .kcg-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .kcg-modal-title { font-weight: 700; font-size: 14px; color: #e8f4fc; }
    .kcg-modal-close { background: none; border: none; color: #9ab; font-size: 16px; cursor: pointer; padding: 4px 8px; }
    .kcg-modal-close:hover { color: #fff; }
    .kcg-modal-body { padding: 14px 16px; overflow-y: auto; font-size: 12.5px; color: #d7e3ec; }
    .kcg-preset-choices { display: flex; flex-direction: column; gap: 10px; }
    .kcg-preset-choice { display: flex; align-items: flex-start; gap: 12px; width: 100%; text-align: left; background: rgba(255,255,255,0.03); border: 1px solid rgba(0,209,255,0.18); border-radius: 8px; padding: 12px 14px; cursor: pointer; color: #d7e3ec; transition: border-color 0.15s ease, background 0.15s ease; }
    .kcg-preset-choice:hover { border-color: rgba(0,209,255,0.55); background: rgba(0,209,255,0.06); }
    .kcg-preset-choice-icon { font-size: 20px; line-height: 1.2; }
    .kcg-preset-choice-name { font-weight: 700; font-size: 13px; color: #e8f4fc; margin-bottom: 3px; }
    .kcg-preset-choice-desc { font-size: 12px; color: #9fb4c4; line-height: 1.45; }
    .kcg-preset-choice-plain { border-style: dashed; border-color: rgba(255,255,255,0.16); }
    .kcg-preset-choice-plain:hover { border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.05); }
  `;
  document.head.appendChild(style);
}

/**
 * DOM-node variant: the caller builds the body element (with its own event
 * handlers) and gets back a close function. Used by the tab preset picker.
 */
export function showKcgModalNode(title: string, body: HTMLElement, maxWidth = 860): () => void {
  ensureStyle();
  const overlay = document.createElement('div');
  overlay.className = 'kcg-modal-overlay';

  const modal = document.createElement('div');
  modal.className = 'kcg-modal';
  modal.style.maxWidth = `${maxWidth}px`;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  const head = document.createElement('div');
  head.className = 'kcg-modal-head';
  const titleEl = document.createElement('span');
  titleEl.className = 'kcg-modal-title';
  titleEl.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'kcg-modal-close';
  closeBtn.setAttribute('aria-label', '닫기');
  closeBtn.textContent = '✕';
  head.append(titleEl, closeBtn);

  const bodyEl = document.createElement('div');
  bodyEl.className = 'kcg-modal-body';
  bodyEl.appendChild(body);

  modal.append(head, bodyEl);
  overlay.appendChild(modal);

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  return close;
}

// 단일 인스턴스: 상세→결과→추적처럼 연쇄 호출될 때 모달이 겹겹이 쌓이고
// ESC keydown 리스너가 누적되는 것을 막는다 — 새 모달이 이전 모달을 닫는다.
let activeModalClose: (() => void) | null = null;

export function showKcgModal(title: string, body: SafeHtml): void {
  ensureStyle();
  if (activeModalClose) { activeModalClose(); activeModalClose = null; }
  const overlay = document.createElement('div');
  overlay.className = 'kcg-modal-overlay';
  const titleSafe = safeHtmlToString(safeHtml`${title}`);
  setTrustedHtml(overlay, trustedHtml(`
    <div class="kcg-modal" role="dialog" aria-modal="true">
      <div class="kcg-modal-head">
        <span class="kcg-modal-title">${titleSafe}</span>
        <button class="kcg-modal-close" aria-label="닫기">✕</button>
      </div>
      <div class="kcg-modal-body">${safeHtmlToString(body)}</div>
    </div>
  `, 'kcg modal shell — title escaped via safeHtml, body is SafeHtml'));

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (activeModalClose === close) activeModalClose = null;
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || (e.target as HTMLElement).closest('.kcg-modal-close')) close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  activeModalClose = close;
}
