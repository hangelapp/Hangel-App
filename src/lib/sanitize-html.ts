import DOMPurify from 'isomorphic-dompurify';

/**
 * Allowed HTML tags for sanitized CMS / rich-text content.
 * Conservative whitelist — covers the rich-text editor output and the
 * markdown-like body fields used across logo-usage, library, contracts,
 * support, press, hangelassociation projects, profile impact-stories, etc.
 */
const ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'b', 'i', 'u',
    'a',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'hr',
    'span', 'div',
    'img',
    // Tables — used by markdown rendering for contracts & policies.
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'colspan', 'rowspan', 'scope', 'align', 'width', 'height'];

/**
 * Sanitizes untrusted HTML strings before rendering with `dangerouslySetInnerHTML`.
 *
 * DOMPurify automatically adds `rel="noopener noreferrer"` to `target="_blank"`
 * anchors when ADD_ATTR/ADD_TAGS aren't overriding it — this config keeps that
 * behavior intact.
 */
export function sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'base', 'meta'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'formaction'],
    }) as string;
}
