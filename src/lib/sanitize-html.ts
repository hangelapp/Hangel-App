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

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'colspan', 'rowspan', 'scope', 'align', 'width', 'height', 'style'];

// `style` attribute'üne izin veriyoruz (zengin editör metin/zemin rengi mail'de
// inline style ister; class/dış CSS mail istemcilerinde çalışmaz). DOMPurify
// varsayılan olarak style İÇERİĞİNİ de güvenli CSS'e ayıklar (url()/expression()
// gibi tehlikeli değerleri atar). Yine de yüzeyi daraltmak için yalnız
// güvenli görsel özellikleri whitelist'liyoruz.
const ALLOWED_CSS_PROPS = [
    'color', 'background-color', 'background', 'text-align', 'font-weight',
    'font-style', 'text-decoration', 'font-size',
];

/**
 * Sanitizes untrusted HTML strings before rendering with `dangerouslySetInnerHTML`.
 *
 * DOMPurify automatically adds `rel="noopener noreferrer"` to `target="_blank"`
 * anchors when ADD_ATTR/ADD_TAGS aren't overriding it — this config keeps that
 * behavior intact.
 */
// `style` attribute'ünü yalnız güvenli görsel özelliklere daralt. DOMPurify
// tehlikeli değerleri (url(), expression(), javascript:) zaten atar; bu hook
// ek olarak izinli-liste dışı özellikleri (position, behavior vb.) da temizler.
let hookRegistered = false;
function ensureStyleHook() {
    if (hookRegistered) return;
    hookRegistered = true;
    DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
        if (data.attrName !== 'style') return;
        const safe = data.attrValue
            .split(';')
            .map((decl) => decl.trim())
            .filter((decl) => {
                const prop = decl.split(':')[0]?.trim().toLowerCase();
                return prop && ALLOWED_CSS_PROPS.includes(prop) && !/url\(|expression|javascript:/i.test(decl);
            })
            .join('; ');
        if (safe) data.attrValue = safe;
        else data.keepAttr = false;
    });
}

export function sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    ensureStyleHook();
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'meta'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'formaction'],
    }) as string;
}
