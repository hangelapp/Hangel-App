/**
 * STK yönetici rol kapsamları (rol-bazlı kısıtlama).
 *
 * Yetkililer "Yetkili Yönetimi"nden bir roleTitle alır. 'Genel Yönetici' (ve
 * kuruluş sahibi / roleTitle'ı olmayan eski yetkili / süper-admin) TÜM modüllere
 * erişir; dar başlıklar yalnız kendi kapsamına erişir.
 *
 * Güvenli default: bilinmeyen/boş roleTitle → kısıtlama YOK (geriye dönük uyum).
 * Sadece aşağıda açıkça tanımlı dar başlıklar kısıtlanır.
 *
 * Hem nav görünürlüğünde (ngo-admin/layout) hem API yetkisinde
 * (messaging/server-auth requireNgoAdmin scope) kullanılır.
 */

export type NgoScope =
    | 'profile'
    | 'ads'
    | 'website'
    | 'finance'
    | 'volunteer'
    | 'posts'
    | 'messaging'
    | 'users';

// Dar başlık → izinli kapsamlar. Burada OLMAYAN başlık = tam erişim (güvenli).
const SCOPE_MAP: Record<string, NgoScope[]> = {
    'Finans Yöneticisi': ['profile', 'finance'],
    'Gönüllü Yöneticisi': ['profile', 'volunteer'],
    'Mini Blog Yöneticisi': ['profile', 'posts'],
};

/** Bu roleTitle verilen kapsama erişebilir mi? */
export function roleTitleHasScope(roleTitle: string | null | undefined, scope: NgoScope): boolean {
    if (!roleTitle || roleTitle === 'Genel Yönetici') return true; // sahip / Genel / eski yetkili → tümü
    const scopes = SCOPE_MAP[roleTitle];
    if (!scopes) return true; // bilinmeyen başlık → kısıtlama yok
    return scopes.includes(scope);
}
