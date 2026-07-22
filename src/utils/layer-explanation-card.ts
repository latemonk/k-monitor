import type { LayerExplanation } from '@/config/map-layer-definitions';
import { escapeHtml } from '@/utils/sanitize';

// KCG fork: 카드 전면 한글화. evidence(내부 파일 경로)는 사용자 노출 금지
// 정책에 따라 렌더하지 않는다.
export function renderLayerExplanationCard(layerLabel: string, explanation: LayerExplanation): string {
  const list = (items: string[]): string => items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  const related = explanation.related.length > 0
    ? explanation.related.map(item => `<span>${escapeHtml(item)}</span>`).join('')
    : '<span>레이어 안내</span>';
  const coverageLabel = explanation.coverage === 'curated' ? '검증된 설명' : '기본 설명';

  return `
    <div class="layer-explanation-header">
      <div>
        <span class="layer-explanation-kicker">${escapeHtml(explanation.category)}</span>
        <strong>${escapeHtml(layerLabel)}</strong>
      </div>
      <button class="layer-explanation-close" aria-label="닫기">×</button>
    </div>
    <div class="layer-explanation-content">
      <div class="layer-explanation-status ${explanation.coverage}">${coverageLabel}</div>
      <p class="layer-explanation-purpose">${escapeHtml(explanation.purpose)}</p>
      <div class="layer-explanation-grid">
        <section>
          <span>출처</span>
          <p>${escapeHtml(explanation.source)}</p>
        </section>
        <section>
          <span>갱신 주기</span>
          <p>${escapeHtml(explanation.freshness)}</p>
        </section>
        <section>
          <span>신뢰도</span>
          <p>${escapeHtml(explanation.confidence)}</p>
        </section>
      </div>
      <div class="layer-explanation-section">
        <span>유의사항</span>
        <ul>${list(explanation.limitations)}</ul>
      </div>
      <div class="layer-explanation-section">
        <span>같이 보면 좋아요</span>
        <div class="layer-explanation-related">${related}</div>
      </div>
    </div>
  `;
}
