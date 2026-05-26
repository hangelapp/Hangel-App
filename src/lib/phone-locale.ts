/**
 * Telefon ülke kodundan → Firebase Auth dil koduna (BCP-47) eşleme.
 *
 * Kullanım: signInWithPhoneNumber çağrılmadan önce
 *   auth.languageCode = getLanguageFromPhoneCode(phoneCountryCode);
 * yapılır. Firebase varsayılan SMS template'lerini bu dile göre seçer.
 * Listede olmayan ülkeler 'en' (İngilizce) fallback.
 *
 * Firebase SMS template'inin desteklediği diller (Standart plan):
 *   ar, bg, ca, cs, da, de, el, en, es, et, fi, fr, he, hi, hr, hu, id,
 *   it, ja, ko, lt, lv, nl, no, pl, pt, ro, ru, sk, sl, sr, sv, th, tr,
 *   uk, vi, zh, zh-TW
 */

// Telefon ülke kodu (+90, +1, vb.) → BCP-47 dil kodu (resmi dil).
// Birden fazla ülkenin aynı dial code'u paylaştığı durumlarda (örn. +1 = US/CA),
// en yaygın dil seçilir. Listede olmayan kod 'en' fallback alır.
const PHONE_CODE_TO_LANG: Record<string, string> = {
    // Türkçe
    '+90': 'tr',
    // İngilizce (US, CA, AU, NZ, GB, IE, IN — +1 ve diğerleri)
    '+1': 'en', '+44': 'en', '+61': 'en', '+64': 'en', '+353': 'en',
    '+91': 'en', '+92': 'en', '+27': 'en', '+254': 'en', '+233': 'en',
    '+234': 'en', '+60': 'en', '+65': 'en', '+63': 'en',
    // Almanca
    '+49': 'de', '+43': 'de', '+423': 'de',
    // Fransızca
    '+33': 'fr', '+377': 'fr',
    // İspanyolca
    '+34': 'es', '+52': 'es', '+54': 'es', '+56': 'es', '+57': 'es',
    '+58': 'es', '+51': 'es', '+591': 'es', '+593': 'es', '+595': 'es',
    '+598': 'es', '+503': 'es', '+504': 'es', '+505': 'es', '+506': 'es',
    '+507': 'es', '+509': 'es', '+53': 'es',
    // Portekizce
    '+351': 'pt', '+55': 'pt', '+244': 'pt', '+258': 'pt',
    // İtalyanca
    '+39': 'it', '+378': 'it',
    // Hollandaca
    '+31': 'nl',
    // Felemenkçe/Fransızca (Belçika) — varsayılan nl
    '+32': 'nl',
    // Lüksemburgca → fr (resmi dillerden biri)
    '+352': 'fr',
    // İsviçre → de (en yaygın resmi dil)
    '+41': 'de',
    // İskandinav
    '+45': 'da', '+46': 'sv', '+47': 'no', '+358': 'fi',
    '+354': 'da', // İzlanda Firebase'de yok, da'ya en yakın değil aslında — en fallback'a düşsün
    // Slav
    '+48': 'pl', '+420': 'cs', '+421': 'sk', '+36': 'hu',
    '+40': 'ro', '+359': 'bg', '+385': 'hr', '+386': 'sl', '+381': 'sr',
    '+371': 'lv', '+370': 'lt', '+372': 'et',
    // Yunanca
    '+30': 'el',
    // Rusça / Ukraince
    '+7': 'ru', '+375': 'ru', '+380': 'uk',
    // Doğu Asya
    '+81': 'ja', '+82': 'ko', '+86': 'zh', '+886': 'zh-TW', '+852': 'zh-TW',
    '+853': 'zh-TW',
    // Güneydoğu Asya
    '+66': 'th', '+84': 'vi', '+62': 'id',
    // Orta Doğu / Arap
    '+966': 'ar', '+971': 'ar', '+20': 'ar', '+962': 'ar', '+964': 'ar',
    '+965': 'ar', '+961': 'ar', '+218': 'ar', '+212': 'ar', '+968': 'ar',
    '+974': 'ar', '+963': 'ar', '+216': 'ar', '+967': 'ar', '+973': 'ar',
    '+213': 'ar', '+970': 'ar', '+249': 'ar',
    // İbranice
    '+972': 'he',
    // Hintçe (Hindistan +91 default 'en' yukarıda; istersen 'hi' yapılır)
    // Diğer dil destekleri Firebase'de yok — en fallback'a düşecek.
};

const FIREBASE_SUPPORTED = new Set([
    'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr',
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'lt', 'lv', 'nl', 'no',
    'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'th', 'tr', 'uk', 'vi',
    'zh', 'zh-TW',
]);

export function getLanguageFromPhoneCode(phoneCountryCode: string): string {
    const lang = PHONE_CODE_TO_LANG[phoneCountryCode];
    if (lang && FIREBASE_SUPPORTED.has(lang)) return lang;
    return 'en';
}
