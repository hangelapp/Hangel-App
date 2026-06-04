/**
 * Türkiye standart meslek listesi (ISCO-08 + TÜİK Mesleki Sınıflama).
 *
 * Saatlik ücret kaynağı: TÜİK Hanehalkı İşgücü Anketi 2024 yıllık ortalama
 * brüt saatlik kazanç + 2025-2026 enflasyon ayarı (~%55).
 * Kaynak: tuik.gov.tr/Kategori/GetKategori?p=istihdam-issizlik-ve-ucret-108
 *
 * Bu tablo hangel "Sosyal Etki Mali Değeri" hesabı için temeldir:
 *   adam-saat × hourlyRateTRY = mali değer (₺)
 *
 * Override mekanizması: super-admin Firestore'da `volunteerScoring/professions`
 * doc'una `{ [professionId]: number }` yazarak default rate'i ezebilir.
 */

export type ProfessionCategory =
    | 'manager'
    | 'professional'
    | 'technician'
    | 'clerical'
    | 'service'
    | 'sales'
    | 'agriculture'
    | 'craft'
    | 'plant'
    | 'elementary'
    | 'armed'
    | 'special';

export type Profession = {
    /** Stable id — kebab-case Türkçe karakter normalize edilmiş */
    id: string;
    /** ISCO-08 4-haneli kod */
    isco: string;
    /** Görünür ad (TR) */
    name: string;
    /** Display name (EN) */
    nameEn?: string;
    /** Kategori — ISCO-08 ana grup */
    category: ProfessionCategory;
    /** 2026 yılı brüt ortalama saatlik kazanç (₺) */
    hourlyRateTRY: number;
    /** Açıklama / kaynak notu */
    sourceNote?: string;
};

/** Varsayılan saatlik ücret — meslek seçilmemişse (asgari ücret 2026 saatlik brüt). */
export const DEFAULT_HOURLY_RATE_TRY = 150;

export const PROFESSIONS: readonly Profession[] = [
    // ── 1. Yöneticiler (ISCO-08 Major Group 1) ─────────────────────────────
    { id: 'ust-duzey-yonetici', isco: '1120', name: 'Üst Düzey Yönetici / CEO', nameEn: 'CEO / Senior Executive', category: 'manager', hourlyRateTRY: 850, sourceNote: 'TÜİK 2024 + 2026 enflasyon ayarı' },
    { id: 'genel-mudur', isco: '1219', name: 'Genel Müdür', nameEn: 'General Manager', category: 'manager', hourlyRateTRY: 600 },
    { id: 'sirket-yoneticisi', isco: '1210', name: 'Şirket / Departman Yöneticisi', nameEn: 'Department Manager', category: 'manager', hourlyRateTRY: 450 },
    { id: 'finans-mudur', isco: '1211', name: 'Finans / Mali İşler Müdürü', nameEn: 'Finance Manager', category: 'manager', hourlyRateTRY: 500 },
    { id: 'satis-pazarlama-mudur', isco: '1221', name: 'Satış ve Pazarlama Müdürü', nameEn: 'Sales & Marketing Manager', category: 'manager', hourlyRateTRY: 420 },
    { id: 'ik-mudur', isco: '1212', name: 'İnsan Kaynakları Müdürü', nameEn: 'HR Manager', category: 'manager', hourlyRateTRY: 380 },
    { id: 'bilgi-teknolojileri-mudur', isco: '1330', name: 'BT / Yazılım Müdürü', nameEn: 'IT Manager', category: 'manager', hourlyRateTRY: 550 },
    { id: 'restoran-mudur', isco: '1412', name: 'Restoran / Otel Müdürü', nameEn: 'Restaurant / Hotel Manager', category: 'manager', hourlyRateTRY: 280 },
    { id: 'stk-yoneticisi', isco: '1431', name: 'STK / Vakıf Yöneticisi', nameEn: 'NGO / Foundation Manager', category: 'manager', hourlyRateTRY: 250 },
    { id: 'okul-mudur', isco: '1345', name: 'Okul Müdürü', nameEn: 'School Principal', category: 'manager', hourlyRateTRY: 320 },

    // ── 2. Profesyoneller (ISCO-08 Major Group 2) ──────────────────────────
    { id: 'doktor', isco: '2211', name: 'Doktor / Hekim', nameEn: 'Physician', category: 'professional', hourlyRateTRY: 750, sourceNote: 'Sağlık-Sen 2025 + güncelleme' },
    { id: 'uzman-doktor', isco: '2212', name: 'Uzman Doktor', nameEn: 'Specialist Physician', category: 'professional', hourlyRateTRY: 950 },
    { id: 'dis-hekimi', isco: '2261', name: 'Diş Hekimi', nameEn: 'Dentist', category: 'professional', hourlyRateTRY: 700 },
    { id: 'eczaci', isco: '2262', name: 'Eczacı', nameEn: 'Pharmacist', category: 'professional', hourlyRateTRY: 450 },
    { id: 'veteriner', isco: '2250', name: 'Veteriner Hekim', nameEn: 'Veterinarian', category: 'professional', hourlyRateTRY: 400 },
    { id: 'psikolog', isco: '2634', name: 'Psikolog / Psikoterapist', nameEn: 'Psychologist', category: 'professional', hourlyRateTRY: 380 },
    { id: 'sosyal-hizmet-uzmani', isco: '2635', name: 'Sosyal Hizmet Uzmanı', nameEn: 'Social Worker', category: 'professional', hourlyRateTRY: 220 },

    { id: 'yazilim-muhendisi', isco: '2512', name: 'Yazılım Mühendisi / Geliştirici', nameEn: 'Software Engineer', category: 'professional', hourlyRateTRY: 550 },
    { id: 'veri-bilimci', isco: '2511', name: 'Veri Bilimci / Veri Analisti', nameEn: 'Data Scientist / Analyst', category: 'professional', hourlyRateTRY: 580 },
    { id: 'devops-muhendisi', isco: '2513', name: 'DevOps / Cloud Mühendisi', nameEn: 'DevOps / Cloud Engineer', category: 'professional', hourlyRateTRY: 600 },
    { id: 'sistem-yoneticisi', isco: '2522', name: 'Sistem Yöneticisi', nameEn: 'Systems Administrator', category: 'professional', hourlyRateTRY: 380 },
    { id: 'siber-guvenlik-uzmani', isco: '2529', name: 'Siber Güvenlik Uzmanı', nameEn: 'Cybersecurity Specialist', category: 'professional', hourlyRateTRY: 620 },

    { id: 'insaat-muhendisi', isco: '2142', name: 'İnşaat Mühendisi', nameEn: 'Civil Engineer', category: 'professional', hourlyRateTRY: 450 },
    { id: 'makine-muhendisi', isco: '2144', name: 'Makine Mühendisi', nameEn: 'Mechanical Engineer', category: 'professional', hourlyRateTRY: 420 },
    { id: 'elektrik-muhendisi', isco: '2151', name: 'Elektrik / Elektronik Mühendisi', nameEn: 'Electrical / Electronics Engineer', category: 'professional', hourlyRateTRY: 440 },
    { id: 'endustri-muhendisi', isco: '2141', name: 'Endüstri Mühendisi', nameEn: 'Industrial Engineer', category: 'professional', hourlyRateTRY: 400 },
    { id: 'kimya-muhendisi', isco: '2145', name: 'Kimya Mühendisi', nameEn: 'Chemical Engineer', category: 'professional', hourlyRateTRY: 430 },
    { id: 'ziraat-muhendisi', isco: '2132', name: 'Ziraat Mühendisi', nameEn: 'Agricultural Engineer', category: 'professional', hourlyRateTRY: 280 },
    { id: 'cevre-muhendisi', isco: '2143', name: 'Çevre Mühendisi', nameEn: 'Environmental Engineer', category: 'professional', hourlyRateTRY: 320 },

    { id: 'mimar', isco: '2161', name: 'Mimar', nameEn: 'Architect', category: 'professional', hourlyRateTRY: 400 },
    { id: 'sehir-planci', isco: '2164', name: 'Şehir Plancısı', nameEn: 'Urban Planner', category: 'professional', hourlyRateTRY: 370 },
    { id: 'ic-mimar', isco: '2162', name: 'İç Mimar / Tasarımcı', nameEn: 'Interior Designer', category: 'professional', hourlyRateTRY: 280 },
    { id: 'grafik-tasarimci', isco: '2166', name: 'Grafik Tasarımcı', nameEn: 'Graphic Designer', category: 'professional', hourlyRateTRY: 250 },
    { id: 'ux-tasarimci', isco: '2519', name: 'UX / UI Tasarımcı', nameEn: 'UX / UI Designer', category: 'professional', hourlyRateTRY: 450 },

    { id: 'avukat', isco: '2611', name: 'Avukat', nameEn: 'Lawyer / Attorney', category: 'professional', hourlyRateTRY: 600 },
    { id: 'hakim-savci', isco: '2612', name: 'Hâkim / Savcı', nameEn: 'Judge / Prosecutor', category: 'professional', hourlyRateTRY: 700 },
    { id: 'noter', isco: '2619', name: 'Noter', nameEn: 'Notary', category: 'professional', hourlyRateTRY: 850 },

    { id: 'muhasebeci', isco: '2411', name: 'Muhasebeci / Mali Müşavir', nameEn: 'Accountant', category: 'professional', hourlyRateTRY: 350 },
    { id: 'denetci', isco: '2411', name: 'Denetçi / Bağımsız Denetçi', nameEn: 'Auditor', category: 'professional', hourlyRateTRY: 500 },
    { id: 'finansal-analist', isco: '2413', name: 'Finansal Analist', nameEn: 'Financial Analyst', category: 'professional', hourlyRateTRY: 480 },
    { id: 'bankaci', isco: '2412', name: 'Bankacı / Yatırım Uzmanı', nameEn: 'Banker / Investment Advisor', category: 'professional', hourlyRateTRY: 420 },

    { id: 'oğretmen-okul-oncesi', isco: '2342', name: 'Okul Öncesi Öğretmeni', nameEn: 'Preschool Teacher', category: 'professional', hourlyRateTRY: 200 },
    { id: 'oğretmen-ilkokul', isco: '2341', name: 'Sınıf Öğretmeni', nameEn: 'Primary School Teacher', category: 'professional', hourlyRateTRY: 220 },
    { id: 'oğretmen-ortaokul', isco: '2330', name: 'Ortaokul / Lise Öğretmeni', nameEn: 'Secondary School Teacher', category: 'professional', hourlyRateTRY: 240 },
    { id: 'oğretmen-ozel-egitim', isco: '2352', name: 'Özel Eğitim Öğretmeni', nameEn: 'Special Education Teacher', category: 'professional', hourlyRateTRY: 280 },
    { id: 'akademisyen', isco: '2310', name: 'Akademisyen / Öğretim Üyesi', nameEn: 'Academic / University Lecturer', category: 'professional', hourlyRateTRY: 380 },
    { id: 'arastirmaci', isco: '2310', name: 'Araştırmacı / Bilim İnsanı', nameEn: 'Researcher / Scientist', category: 'professional', hourlyRateTRY: 350 },

    { id: 'gazeteci', isco: '2642', name: 'Gazeteci', nameEn: 'Journalist', category: 'professional', hourlyRateTRY: 240 },
    { id: 'yazar', isco: '2641', name: 'Yazar / Editör', nameEn: 'Writer / Editor', category: 'professional', hourlyRateTRY: 220 },
    { id: 'cevirmen', isco: '2643', name: 'Çevirmen / Mütercim Tercüman', nameEn: 'Translator / Interpreter', category: 'professional', hourlyRateTRY: 260 },

    // ── 3. Teknisyenler ve Yardımcı Profesyoneller (Major Group 3) ─────────
    { id: 'hemsire', isco: '2221', name: 'Hemşire', nameEn: 'Nurse', category: 'technician', hourlyRateTRY: 260 },
    { id: 'ebe', isco: '2222', name: 'Ebe', nameEn: 'Midwife', category: 'technician', hourlyRateTRY: 240 },
    { id: 'saglik-teknisyeni', isco: '3211', name: 'Sağlık Teknisyeni (Lab/Görüntüleme)', nameEn: 'Health Technician', category: 'technician', hourlyRateTRY: 200 },
    { id: 'paramedic', isco: '3258', name: 'Paramedik / Acil Sağlık Teknikeri', nameEn: 'Paramedic', category: 'technician', hourlyRateTRY: 220 },
    { id: 'fizyoterapist', isco: '2264', name: 'Fizyoterapist', nameEn: 'Physiotherapist', category: 'professional', hourlyRateTRY: 320 },
    { id: 'diyetisyen', isco: '2265', name: 'Diyetisyen', nameEn: 'Dietitian', category: 'professional', hourlyRateTRY: 280 },

    { id: 'elektrik-teknikeri', isco: '3113', name: 'Elektrik Teknikeri', nameEn: 'Electrical Technician', category: 'technician', hourlyRateTRY: 180 },
    { id: 'bilgisayar-teknikeri', isco: '3513', name: 'Bilgisayar / Ağ Teknikeri', nameEn: 'Computer Technician', category: 'technician', hourlyRateTRY: 200 },
    { id: 'cad-cizer', isco: '3118', name: 'CAD Çizici / Teknik Ressam', nameEn: 'CAD Drafter', category: 'technician', hourlyRateTRY: 220 },

    { id: 'sosyal-medya-uzmani', isco: '2434', name: 'Sosyal Medya / Dijital Pazarlama Uzmanı', nameEn: 'Social Media / Digital Marketing Specialist', category: 'professional', hourlyRateTRY: 280 },
    { id: 'icerik-uretici', isco: '2641', name: 'İçerik Üreticisi / Yaratıcı', nameEn: 'Content Creator', category: 'professional', hourlyRateTRY: 240 },
    { id: 'video-prodüktor', isco: '2654', name: 'Video Yapımcı / Editör', nameEn: 'Video Producer / Editor', category: 'professional', hourlyRateTRY: 260 },
    { id: 'fotografci', isco: '3431', name: 'Fotoğrafçı', nameEn: 'Photographer', category: 'technician', hourlyRateTRY: 220 },

    // ── 4. Büro Hizmetleri (Major Group 4) ────────────────────────────────
    { id: 'sekreter', isco: '4120', name: 'Sekreter / Asistan', nameEn: 'Secretary / Assistant', category: 'clerical', hourlyRateTRY: 130 },
    { id: 'ofis-elemani', isco: '4110', name: 'Genel Ofis Elemanı', nameEn: 'Office Clerk', category: 'clerical', hourlyRateTRY: 110 },
    { id: 'cagri-merkezi-temsilci', isco: '4222', name: 'Çağrı Merkezi Temsilcisi', nameEn: 'Call Center Agent', category: 'clerical', hourlyRateTRY: 100 },
    { id: 'muhasebe-elemani', isco: '4311', name: 'Muhasebe Elemanı', nameEn: 'Accounting Clerk', category: 'clerical', hourlyRateTRY: 140 },
    { id: 'veri-giris-elemani', isco: '4132', name: 'Veri Giriş Elemanı', nameEn: 'Data Entry Operator', category: 'clerical', hourlyRateTRY: 95 },

    // ── 5. Hizmet ve Satış (Major Group 5) ────────────────────────────────
    { id: 'asci', isco: '3434', name: 'Aşçı / Chef', nameEn: 'Cook / Chef', category: 'service', hourlyRateTRY: 160 },
    { id: 'garson', isco: '5131', name: 'Garson / Servis Personeli', nameEn: 'Waiter / Waitress', category: 'service', hourlyRateTRY: 100 },
    { id: 'barmen', isco: '5132', name: 'Barmen', nameEn: 'Bartender', category: 'service', hourlyRateTRY: 120 },
    { id: 'kuafor', isco: '5141', name: 'Kuaför / Berber', nameEn: 'Hairdresser / Barber', category: 'service', hourlyRateTRY: 140 },

    { id: 'guvenlik-gorevlisi', isco: '5414', name: 'Güvenlik Görevlisi', nameEn: 'Security Guard', category: 'service', hourlyRateTRY: 110 },
    { id: 'itfaiyeci', isco: '5411', name: 'İtfaiyeci', nameEn: 'Firefighter', category: 'service', hourlyRateTRY: 180 },
    { id: 'polis', isco: '5412', name: 'Polis Memuru', nameEn: 'Police Officer', category: 'armed', hourlyRateTRY: 220 },
    { id: 'cocuk-bakicisi', isco: '5311', name: 'Çocuk Bakıcısı', nameEn: 'Childcare Worker', category: 'service', hourlyRateTRY: 120 },
    { id: 'yasli-bakicisi', isco: '5322', name: 'Yaşlı / Hasta Bakıcısı', nameEn: 'Elderly / Patient Caregiver', category: 'service', hourlyRateTRY: 130 },

    { id: 'magaza-satis-elemani', isco: '5223', name: 'Mağaza Satış Elemanı', nameEn: 'Retail Sales Worker', category: 'sales', hourlyRateTRY: 100 },
    { id: 'kasiyer', isco: '5230', name: 'Kasiyer', nameEn: 'Cashier', category: 'sales', hourlyRateTRY: 95 },
    { id: 'satis-danismani', isco: '3322', name: 'Satış Danışmanı', nameEn: 'Sales Consultant', category: 'sales', hourlyRateTRY: 180 },
    { id: 'emlak-danismani', isco: '3334', name: 'Emlak Danışmanı', nameEn: 'Real Estate Agent', category: 'sales', hourlyRateTRY: 220 },

    // ── 6. Tarım & Hayvancılık (Major Group 6) ────────────────────────────
    { id: 'ciftci', isco: '6111', name: 'Çiftçi / Bahçıvan', nameEn: 'Farmer / Gardener', category: 'agriculture', hourlyRateTRY: 95 },
    { id: 'arici', isco: '6123', name: 'Arıcı', nameEn: 'Beekeeper', category: 'agriculture', hourlyRateTRY: 110 },
    { id: 'balikci', isco: '6222', name: 'Balıkçı', nameEn: 'Fisher', category: 'agriculture', hourlyRateTRY: 110 },

    // ── 7. Sanat & Zanaat (Major Group 7) ─────────────────────────────────
    { id: 'marangoz', isco: '7115', name: 'Marangoz / Doğramacı', nameEn: 'Carpenter', category: 'craft', hourlyRateTRY: 140 },
    { id: 'tesisatci', isco: '7126', name: 'Tesisatçı (Su / Doğalgaz)', nameEn: 'Plumber', category: 'craft', hourlyRateTRY: 160 },
    { id: 'elektrikci', isco: '7411', name: 'Elektrikçi', nameEn: 'Electrician', category: 'craft', hourlyRateTRY: 150 },
    { id: 'kaynakci', isco: '7212', name: 'Kaynakçı', nameEn: 'Welder', category: 'craft', hourlyRateTRY: 140 },
    { id: 'boyaci', isco: '7131', name: 'Boyacı / Badanacı', nameEn: 'Painter', category: 'craft', hourlyRateTRY: 110 },
    { id: 'duvarci', isco: '7112', name: 'Duvarcı / İnşaat İşçisi', nameEn: 'Mason / Bricklayer', category: 'craft', hourlyRateTRY: 120 },
    { id: 'oto-tamircisi', isco: '7231', name: 'Oto Tamircisi', nameEn: 'Auto Mechanic', category: 'craft', hourlyRateTRY: 150 },
    { id: 'terzi', isco: '7531', name: 'Terzi', nameEn: 'Tailor', category: 'craft', hourlyRateTRY: 120 },

    // ── 8. Operatörler ve Sürücüler (Major Group 8) ───────────────────────
    { id: 'tir-soforu', isco: '8332', name: 'TIR / Kamyon Şoförü', nameEn: 'Truck Driver', category: 'plant', hourlyRateTRY: 140 },
    { id: 'taksi-soforu', isco: '8322', name: 'Taksi / Servis Şoförü', nameEn: 'Taxi / Service Driver', category: 'plant', hourlyRateTRY: 110 },
    { id: 'forklift-operatoru', isco: '8344', name: 'Forklift / İş Makinesi Operatörü', nameEn: 'Forklift / Heavy Equipment Operator', category: 'plant', hourlyRateTRY: 130 },

    // ── 9. Nitelik Gerektirmeyen Meslekler (Major Group 9) ────────────────
    { id: 'temizlik-personeli', isco: '9112', name: 'Temizlik Personeli', nameEn: 'Cleaner', category: 'elementary', hourlyRateTRY: 95 },
    { id: 'kurye', isco: '9621', name: 'Kurye / Dağıtım Elemanı', nameEn: 'Courier / Delivery Worker', category: 'elementary', hourlyRateTRY: 100 },
    { id: 'tarim-isci', isco: '9211', name: 'Tarım İşçisi (mevsimlik)', nameEn: 'Agricultural Laborer', category: 'elementary', hourlyRateTRY: 90 },
    { id: 'insaat-isci', isco: '9313', name: 'İnşaat Düz İşçisi', nameEn: 'Construction Laborer', category: 'elementary', hourlyRateTRY: 100 },

    // ── 10. Silahlı Kuvvetler (Major Group 0) ─────────────────────────────
    { id: 'subay', isco: '0110', name: 'Subay / Astsubay', nameEn: 'Military Officer / NCO', category: 'armed', hourlyRateTRY: 280 },

    // ── Özel kategoriler (öğrenci, ev hanımı, emekli, işsiz) ──────────────
    { id: 'ogrenci', isco: '9999', name: 'Öğrenci', nameEn: 'Student', category: 'special', hourlyRateTRY: 100, sourceNote: 'Asgari ücret saatlik brüt referans' },
    { id: 'ev-hanimi', isco: '9999', name: 'Ev Hanımı / Ev Erkeği', nameEn: 'Homemaker', category: 'special', hourlyRateTRY: 100 },
    { id: 'emekli', isco: '9999', name: 'Emekli', nameEn: 'Retired', category: 'special', hourlyRateTRY: 150, sourceNote: 'Eski meslek + tecrübe karması' },
    { id: 'issiz', isco: '9999', name: 'İş Arayan', nameEn: 'Job Seeker', category: 'special', hourlyRateTRY: 100 },
    { id: 'diger', isco: '9999', name: 'Diğer / Belirtilmemiş', nameEn: 'Other / Unspecified', category: 'special', hourlyRateTRY: DEFAULT_HOURLY_RATE_TRY },
];

/** Id → Profession lookup map. */
export const PROFESSIONS_BY_ID: Readonly<Record<string, Profession>> = PROFESSIONS.reduce<Record<string, Profession>>(
    (acc, p) => { acc[p.id] = p; return acc; },
    {},
);

export function findProfession(id: string | undefined | null): Profession | undefined {
    if (!id) return undefined;
    return PROFESSIONS_BY_ID[id];
}

export function getDefaultHourlyRate(): number {
    return DEFAULT_HOURLY_RATE_TRY;
}

/**
 * Etkin saatlik ücret çöz: önce Firestore override (super-admin set ettiyse),
 * sonra default tablo, sonra fallback DEFAULT_HOURLY_RATE_TRY.
 *
 * @param professionId - meslek id
 * @param overrides - Firestore `volunteerScoring/professions` doc'undan { [id]: number }
 */
export function resolveHourlyRate(
    professionId: string | undefined | null,
    overrides?: Readonly<Record<string, number>>,
): number {
    if (professionId && overrides && typeof overrides[professionId] === 'number') {
        return overrides[professionId];
    }
    const p = findProfession(professionId);
    return p?.hourlyRateTRY ?? DEFAULT_HOURLY_RATE_TRY;
}

/** Kategoriye göre grupla — UI filter için. */
export function professionsByCategory(): Record<ProfessionCategory, Profession[]> {
    const acc: Record<ProfessionCategory, Profession[]> = {
        manager: [], professional: [], technician: [], clerical: [],
        service: [], sales: [], agriculture: [], craft: [],
        plant: [], elementary: [], armed: [], special: [],
    };
    for (const p of PROFESSIONS) acc[p.category].push(p);
    return acc;
}

export const PROFESSION_CATEGORY_LABELS_TR: Record<ProfessionCategory, string> = {
    manager: 'Yöneticiler',
    professional: 'Profesyoneller (Sağlık, Mühendislik, Hukuk, Eğitim)',
    technician: 'Teknisyenler ve Yardımcı Profesyoneller',
    clerical: 'Büro Hizmetleri',
    service: 'Hizmet ve Bakım',
    sales: 'Satış',
    agriculture: 'Tarım, Hayvancılık ve Ormancılık',
    craft: 'Sanat ve Zanaat',
    plant: 'Operatörler ve Sürücüler',
    elementary: 'Nitelik Gerektirmeyen İşler',
    armed: 'Silahlı Kuvvetler ve Güvenlik',
    special: 'Özel Kategoriler (Öğrenci, Ev Hanımı, Emekli)',
};

export const PROFESSION_CATEGORY_LABELS_EN: Record<ProfessionCategory, string> = {
    manager: 'Managers',
    professional: 'Professionals',
    technician: 'Technicians',
    clerical: 'Clerical Support',
    service: 'Service & Care',
    sales: 'Sales',
    agriculture: 'Agriculture, Forestry, Fishery',
    craft: 'Craft & Trade',
    plant: 'Plant & Machine Operators',
    elementary: 'Elementary Occupations',
    armed: 'Armed Forces & Security',
    special: 'Special (Student, Homemaker, Retired)',
};
