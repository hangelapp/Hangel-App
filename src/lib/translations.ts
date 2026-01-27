
export const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'ar', label: 'العربية' },
    { value: 'zh', label: '中文' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ja', label: '日本語' },
    { value: 'bn', label: 'বাংলা' },
    { value: 'pa', label: 'ਪੰਜਾਬੀ' },
    { value: 'jv', label: 'Basa Jawa' },
    { value: 'ko', label: '한국어' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'te', label: 'తెలుగు' },
    { value: 'mr', label: 'मराठी' },
    { value: 'ta', label: 'தமிழ்' },
    { value: 'ur', label: 'اردو' },
    { value: 'it', label: 'Italiano' },
] as const;

export type Language = typeof languages[number]['value'];

export type Translation = {
  title: string;
  subtitle: string;
};

export const translations: Record<Language, Translation> = {
  tr: {
    title: 'yok öyle yalnız başına mücadele etmek!',
    subtitle: 'Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.',
  },
  en: {
    title: "There's no such thing as struggling alone!",
    subtitle: 'We grow hope and work together for social problems.',
  },
  de: {
    title: 'Es gibt kein alleiniges Kämpfen!',
    subtitle: 'Wir lassen Hoffnung wachsen und arbeiten gemeinsam für soziale Probleme.',
  },
  fr: {
    title: "Il n'y a pas de lutte en solitaire !",
    subtitle: "Nous cultivons l'espoir et travaillons ensemble pour les problèmes sociaux.",
  },
  es: {
    title: '¡No existe tal cosa como luchar solo!',
    subtitle: 'Cultivamos la esperanza y trabajamos juntos por los problemas sociales.',
  },
  ar: {
    title: 'لا يوجد شيء اسمه النضال وحيدًا!',
    subtitle: 'نحن ننمي الأمل ونعمل معًا من أجل المشاكل الاجتماعية.',
  },
  zh: {
    title: '没有所谓的独自奋斗！',
    subtitle: '我们增长希望，共同为社会问题而努力。',
  },
  hi: {
    title: 'अकेले संघर्ष करने जैसी कोई चीज़ नहीं है!',
    subtitle: 'हम आशा बढ़ाते हैं और सामाजिक समस्याओं के लिए मिलकर काम करते हैं।',
  },
  pt: {
    title: 'Não existe tal coisa como lutar sozinho!',
    subtitle: 'Nós cultivamos a esperança e trabalhamos juntos pelos problemas sociais.',
  },
  ru: {
    title: 'Нет такого понятия, как бороться в одиночку!',
    subtitle: 'Мы растим надежду и вместе работаем над социальными проблемами.',
  },
  ja: {
    title: '一人で奮闘するなんてことはない！',
    subtitle: '私たちは希望を育て、社会問題のために共に働きます。',
  },
  bn: {
    title: 'একা সংগ্রাম করার মতো কিছু নেই!',
    subtitle: 'আমরা আশা বাড়াই এবং সামাজিক সমস্যার জন্য একসাথে কাজ করি।',
  },
  pa: {
    title: 'ਇਕੱਲੇ ਸੰਘਰਸ਼ ਕਰਨ ਵਰਗੀ ਕੋਈ ਚੀਜ਼ ਨਹੀਂ ਹੈ!',
    subtitle: 'ਅਸੀਂ ਉਮੀਦ ਵਧਾਉਂਦੇ ਹਾਂ ਅਤੇ ਸਮਾਜਿਕ ਸਮੱਸਿਆਵਾਂ ਲਈ ਮਿਲ ਕੇ ਕੰਮ ਕਰਦੇ ਹਾਂ।',
  },
  jv: {
    title: 'Ora ana sing jenenge berjuang dhewe!',
    subtitle: 'Kita ngembangake pangarep-arep lan kerja bareng kanggo masalah sosial.',
  },
  ko: {
    title: '혼자서 고군분투하는 것은 없습니다!',
    subtitle: '우리는 희망을 키우고 사회 문제를 위해 함께 노력합니다.',
  },
  vi: {
    title: 'Không có chuyện phải vật lộn một mình!',
    subtitle: 'Chúng tôi vun trồng hy vọng và cùng nhau giải quyết các vấn đề xã hội.',
  },
  te: {
    title: 'ఒంటరిగా పోరాడటం అనేదేమీ లేదు!',
    subtitle: 'మేము ఆశను పెంచుతాము మరియు సామాజిక సమస్యల కోసం కలిసి పనిచేస్తాము।',
  },
  mr: {
    title: 'एकट्याने संघर्ष करणे असे काहीही नाही!',
    subtitle: 'आम्ही आशा वाढवतो आणि सामाजिक समस्यांसाठी एकत्र काम करतो।',
  },
  ta: {
    title: 'தனியாக போராடுவது என்பது எதுவும் இல்லை!',
    subtitle: 'நாங்கள் நம்பிக்கையை வளர்க்கிறோம், சமூகப் பிரச்சினைகளுக்காக ஒன்றிணைந்து செயல்படுகிறோம்।',
  },
  ur: {
    title: 'اکیلے جدوجہد کرنے جیسی کوئی چیز نہیں ہے!',
    subtitle: 'ہم امید بڑھاتے ہیں اور سماجی مسائل کے لیے مل کر کام کرتے ہیں۔',
  },
  it: {
    title: 'Non esiste una cosa come lottare da soli!',
    subtitle: 'Coltiviamo la speranza e lavoriamo insieme per i problemi sociali.',
  },
};
