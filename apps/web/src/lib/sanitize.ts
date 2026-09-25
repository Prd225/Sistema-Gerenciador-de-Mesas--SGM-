import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML antes de qualquer `dangerouslySetInnerHTML`. Uso
 * obrigatorio (docs/specs/ui-design-system.md, secao 1).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
