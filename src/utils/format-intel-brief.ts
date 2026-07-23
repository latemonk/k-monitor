import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';

const SECTION_HEADERS = ['SITUATION NOW', 'WHAT THIS MEANS FOR', 'KEY RISKS', 'OUTLOOK', 'WATCH ITEMS'];

// KCG fork: the LLM keeps the English section markers (they are the machine-
// parsed contract, stable across models), and the UI renders them in Korean.
// "WHAT THIS MEANS FOR <name>" carries the country name through as a tail so
// both new Korean-name briefs and older cached English-name briefs display.
function koSectionHeader(trimmed: string): string {
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('SITUATION NOW')) return '현재 상황';
  if (upper.startsWith('WHAT THIS MEANS FOR')) {
    const tail = trimmed.slice('WHAT THIS MEANS FOR'.length).trim();
    return tail ? `${tail}에 미치는 영향` : '주요 영향';
  }
  if (upper.startsWith('KEY RISKS')) return '주요 리스크';
  if (upper.startsWith('OUTLOOK')) return '전망';
  if (upper.startsWith('WATCH ITEMS')) return '관찰 포인트';
  return trimmed;
}

const KO_OUTLOOK_LABELS: Record<string, string> = {
  'NEXT 24H': '24시간 내',
  'NEXT 48H': '48시간 내',
  'NEXT 72H': '72시간 내',
};

export interface IntelBriefCitationSource {
  title?: string;
  url?: string;
}

type IntelBriefCitationOptions =
  | { sources: readonly IntelBriefCitationSource[] }
  | { count: number; hrefPrefix: string };

/**
 * Converts structured LLM intel brief text into HTML.
 * Handles the 5-section format (SITUATION NOW / WHAT THIS MEANS FOR / KEY RISKS / OUTLOOK / WATCH ITEMS).
 * Falls back gracefully to paragraph rendering for older prose-format responses.
 *
 * @param text         Raw brief text from LLM
 * @param citationOpts Optional citation link config for source references like [1], [2]
 */
export function formatIntelBrief(
  text: string,
  citationOpts?: IntelBriefCitationOptions,
): string {
  const escaped = escapeHtml(text);
  const lines = escaped.split('\n');
  const out: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = SECTION_HEADERS.some(h => trimmed.toUpperCase().startsWith(h));

    if (isHeader) {
      if (inSection) out.push('</div>');
      out.push(`<div class="brief-section"><div class="brief-section-header">${koSectionHeader(trimmed)}</div>`);
      inSection = true;
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      out.push(`<div class="brief-bullet">${trimmed.replace(/^[•-]\s*/, '')}</div>`);
    } else if (trimmed.startsWith('NEXT ')) {
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx !== -1) {
        const label = trimmed.slice(0, colonIdx).trim();
        const koLabel = KO_OUTLOOK_LABELS[label.toUpperCase()] ?? label;
        const body = trimmed.slice(colonIdx + 1).trim();
        out.push(`<div class="brief-outlook-row"><strong class="brief-outlook-label">${koLabel}:</strong> ${body}</div>`);
      } else {
        out.push(`<div class="brief-para">${trimmed}</div>`);
      }
    } else if (trimmed) {
      out.push(`<div class="brief-para">${trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>`);
    }
  }

  if (inSection) out.push('</div>');
  let html = out.join('') || `<p>${escaped.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

  if (citationOpts && ('sources' in citationOpts || citationOpts.count > 0)) {
    html = html.replace(/\[(\d{1,2})\]/g, (_match, numStr) => {
      const n = parseInt(numStr, 10);
      if ('sources' in citationOpts) {
        const source = citationOpts.sources[n - 1];
        const href = sanitizeUrl(source?.url ?? '');
        return href
          ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cb-citation" title="${escapeHtml(source?.title ?? `Source ${n}`)}">[${n}]</a>`
          : `[${numStr}]`;
      }

      const { count, hrefPrefix } = citationOpts;
      return n >= 1 && n <= count
        ? `<a href="${hrefPrefix}${n}" class="cb-citation">[${n}]</a>`
        : `[${numStr}]`;
    });
  }

  return html;
}
