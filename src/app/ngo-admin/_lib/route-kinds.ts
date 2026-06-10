/**
 * /ngo-admin alt route'larının hangi entity türlerine (STK/Marka/Kulüp) ait
 * olduğunu tanımlar. EntityRouteGuard layout'tan bunu kullanır.
 *
 * Default (listede olmayan path'ler): tüm türlere açık (örn. /ngo-admin/manage-profile,
 * inbox, posts, settings, support, users — entity-agnostic temel sayfalar).
 */
export type EntityKind = 'ngo' | 'brand' | 'club';

export const ROUTE_KINDS: Record<string, EntityKind[]> = {
    // STK-only menü item'lar
    '/ngo-admin/transparency': ['ngo'],
    '/ngo-admin/funds': ['ngo'],
    '/ngo-admin/volunteer': ['ngo'],
    '/ngo-admin/volunteer-portal': ['ngo'],
    '/ngo-admin/website': ['ngo'],
    '/ngo-admin/sms': ['ngo'],
    '/ngo-admin/mail': ['ngo'],
    '/ngo-admin/messaging-packages': ['ngo'],
    '/ngo-admin/ads': ['ngo'],
    '/ngo-admin/online-meeting': ['ngo'],
    '/ngo-admin/design-tools': ['ngo'],
    '/ngo-admin/payment-systems': ['ngo'],
    '/ngo-admin/marketing': ['ngo'],
    '/ngo-admin/accounting': ['ngo'],
    '/ngo-admin/crm': ['ngo'],
    '/ngo-admin/virtual-pbx': ['ngo'],
    '/ngo-admin/virtual-office': ['ngo'],
    '/ngo-admin/university-volunteering': ['ngo'],
    '/ngo-admin/field-team': ['ngo'],
    '/ngo-admin/dm': ['ngo'],
    '/ngo-admin/ecommerce': ['ngo'],
    '/ngo-admin/hr-integration': ['ngo'],
    '/ngo-admin/analytics-tools': ['ngo'],

    // Marka-only menü item'lar
    '/ngo-admin/sustainability': ['brand'],
    '/ngo-admin/reports': ['brand'],
    '/ngo-admin/brand-earnings': ['brand'],

    // Kulüp + STK ortak
    '/ngo-admin/events': ['ngo', 'club'],

    // STK + Marka ortak (donor side)
    '/ngo-admin/donations': ['ngo', 'brand'],

    // Tüm türlere açık (entity-agnostic):
    // /ngo-admin, /ngo-admin/dashboard, /ngo-admin/manage-profile,
    // /ngo-admin/qr, /ngo-admin/inbox, /ngo-admin/posts, /ngo-admin/impact-story,
    // /ngo-admin/demographics, /ngo-admin/users, /ngo-admin/settings,
    // /ngo-admin/support — listede olmaması = tüm türlere izinli.
};

export function isRouteAllowedForKind(pathname: string, kind: EntityKind | null): {
    allowed: boolean;
    requiredKinds: EntityKind[] | null;
} {
    if (!kind) {
        return { allowed: true, requiredKinds: null };
    }
    // Tam eşleşme önce
    let requiredKinds = ROUTE_KINDS[pathname];
    // Alt path için (örn. /ngo-admin/donations/123): parent path'i bul
    if (!requiredKinds) {
        const parentKey = Object.keys(ROUTE_KINDS).find(k => pathname.startsWith(k + '/'));
        if (parentKey) requiredKinds = ROUTE_KINDS[parentKey];
    }
    if (!requiredKinds) {
        // Listede yok → tüm türlere açık
        return { allowed: true, requiredKinds: null };
    }
    return { allowed: requiredKinds.includes(kind), requiredKinds };
}
