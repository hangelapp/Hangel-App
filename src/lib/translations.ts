export const languages = [
    { value: 'tr', label: 'Türkçe' },
    { value: 'en', label: 'English' },
    { value: 'ru', label: 'Русский' },
    { value: 'ar', label: 'العربية' },
    { value: 'fa', label: 'فارسی' },
    { value: 'es', label: 'Español' },
    { value: 'ha', label: 'Hausa' },
] as const;

export type Language = typeof languages[number]['value'];

export const translations: Record<Language, any> = {
  tr: {
    title: 'yok öyle yalnız başına mücadele etmek!',
    subtitle: 'Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.',
    nav: {
      market: 'Markalar',
      ngos: 'STK\'lar',
      clubs: 'Öğrenci Kulüpleri',
      donations: 'Bağışlarım',
      applications: 'Başvurularım',
      badges: 'Rozetler ve Sertifikalar',
      messages: 'Mesajlarım',
      leaderboard: 'Liderlik Tablosu',
      invite: 'Arkadaş Davet Et',
      impactStory: 'Etki Story',
      library: 'Kütüphane',
      admin: 'Yönetim Paneli',
      superAdmin: 'Admin Paneli',
      settings: 'Ayarlar',
      about: 'Hakkımızda',
      merchant: 'Üye İşyeri',
      ngoOnboarding: 'STK Başvurusu',
      support: 'Destek',
      logout: 'Çıkış Yap',
      emergency: 'Acil Durum',
      notifications: 'Bildirimler',
      timeline: 'Akış',
      profile: 'Profil',
      wallet: 'Cüzdanım',
      login: 'Giriş Yap',
      register: 'Kayıt Ol',
      search: 'Platformda Ara',
      volunteering: 'Gönüllülük'
    },
    common: {
      search: 'Ara...',
      more: 'Daha fazla',
      apply: 'Hemen Başvur',
      start: 'Hemen Başla',
    }
  },
  en: {
    title: "There's no such thing as struggling alone!",
    subtitle: 'We grow hope and work together for social problems.',
    nav: {
      market: 'Brands',
      ngos: 'NGOs',
      clubs: 'Student Clubs',
      donations: 'My Donations',
      applications: 'My Applications',
      badges: 'Badges & Certificates',
      messages: 'Messages',
      leaderboard: 'Leaderboard',
      invite: 'Invite Friends',
      impactStory: 'Impact Story',
      library: 'Library',
      admin: 'Admin Panel',
      superAdmin: 'Super Admin',
      settings: 'Settings',
      about: 'About Us',
      merchant: 'Merchant',
      ngoOnboarding: 'NGO Onboarding',
      support: 'Support',
      logout: 'Logout',
      emergency: 'Emergency',
      notifications: 'Notifications',
      timeline: 'Timeline',
      profile: 'Profile',
      wallet: 'My Wallet',
      login: 'Login',
      register: 'Register',
      search: 'Search Platform',
      volunteering: 'Volunteering'
    },
    common: {
      search: 'Search...',
      more: 'More',
      apply: 'Apply Now',
      start: 'Get Started',
    }
  },
  // Other languages omitted for brevity in this manual revert
};

