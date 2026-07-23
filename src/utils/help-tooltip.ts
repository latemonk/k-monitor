// KCG fork: (?) 도움말 커스텀 툴팁 공용 유틸 (07-23 사장님 리포트 — 국가
// 패널의 native title 툴팁이 환경에 따라 아예 안 뜸).
//
// 동작: 호버/포커스 즉시 표시 + 클릭 토글(터치), 패널 overflow 클리핑을
// 피하려고 body 에 fixed 좌표로 포털. 뷰포트 가로 클램프 + 아래 공간 부족
// 시 위로 전개 — Panel.ts infoTooltip(v46)·ResilienceWidget(v52)과 동일
// 패턴을 한 곳으로 모았다. 스타일은 기존 .panel-info-tooltip 재사용.
//
// 반환값은 cleanup 함수 — 앵커가 DOM 에서 제거되어도 포털된 툴팁은 남기
// 때문에, 카드를 다시 그리는 쪽(패널 show()/destroy())에서 반드시 호출해야
// 누수가 없다.

export function attachHelpTooltip(anchor: HTMLElement, text: string): () => void {
  let tooltip: HTMLDivElement | null = null;

  const ensureTooltip = (): HTMLDivElement => {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.className = 'panel-info-tooltip kcg-help-tooltip';
    tooltip.textContent = text;
    tooltip.style.position = 'fixed';
    document.body.appendChild(tooltip);
    return tooltip;
  };

  const show = (): void => {
    const tip = ensureTooltip();
    const rect = anchor.getBoundingClientRect();
    tip.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
    tip.style.top = `${Math.round(rect.bottom + 8)}px`;
    tip.style.removeProperty('--kcg-tooltip-shift');
    tip.classList.add('visible');
    requestAnimationFrame(() => {
      const tipRect = tip.getBoundingClientRect();
      const margin = 8;
      let shift = 0;
      if (tipRect.left < margin) shift = margin - tipRect.left;
      else if (tipRect.right > window.innerWidth - margin) shift = window.innerWidth - margin - tipRect.right;
      if (shift !== 0) tip.style.setProperty('--kcg-tooltip-shift', `${Math.round(shift)}px`);
      if (tipRect.bottom > window.innerHeight - margin) {
        tip.style.top = `${Math.round(rect.top - tipRect.height - 8)}px`;
      }
    });
  };

  const hide = (): void => {
    tooltip?.classList.remove('visible');
  };

  const toggle = (e: Event): void => {
    e.stopPropagation();
    if (tooltip?.classList.contains('visible')) hide();
    else show();
  };

  anchor.addEventListener('mouseenter', show);
  anchor.addEventListener('mouseleave', hide);
  anchor.addEventListener('focus', show);
  anchor.addEventListener('blur', hide);
  anchor.addEventListener('click', toggle);

  return () => {
    anchor.removeEventListener('mouseenter', show);
    anchor.removeEventListener('mouseleave', hide);
    anchor.removeEventListener('focus', show);
    anchor.removeEventListener('blur', hide);
    anchor.removeEventListener('click', toggle);
    tooltip?.remove();
    tooltip = null;
  };
}
