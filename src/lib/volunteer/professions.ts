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
    /** 2026 yılı brüt ortalama saatlik kazanç (₺) — Sosyal Etki MALİ Değeri hesabı için */
    hourlyRateTRY: number;
    /**
     * Saat başı Sosyal Etki Puanı — uzmanlık + topluma katkı endeksli (20-200).
     * Adam-saat × pointsPerHour = Sosyal Etki PUANI (mali değerden ayrı).
     * Default ≈ clamp(round(hourlyRateTRY / 5), 20, 200), kategoriye göre tweak.
     */
    pointsPerHour: number;
    /** Açıklama / kaynak notu */
    sourceNote?: string;
};

/** Varsayılan saatlik ücret — meslek seçilmemişse (asgari ücret 2026 saatlik brüt). */
export const DEFAULT_HOURLY_RATE_TRY = 150;

/** Varsayılan saat başı puan — meslek seçilmemişse. */
export const DEFAULT_POINTS_PER_HOUR = 30;

export const PROFESSIONS: readonly Profession[] = [
    // ── 1. Yöneticiler (ISCO-08 Major Group 1) ─────────────────────────────
    { id: 'ust-duzey-yonetici', isco: '1120', name: 'Üst Düzey Yönetici / CEO', nameEn: 'CEO / Senior Executive', category: 'manager', hourlyRateTRY: 850, pointsPerHour: 170, sourceNote: 'TÜİK 2024 + 2026 enflasyon ayarı' },
    { id: 'genel-mudur', isco: '1219', name: 'Genel Müdür', nameEn: 'General Manager', category: 'manager', hourlyRateTRY: 600, pointsPerHour: 120 },
    { id: 'sirket-yoneticisi', isco: '1210', name: 'Şirket / Departman Yöneticisi', nameEn: 'Department Manager', category: 'manager', hourlyRateTRY: 450, pointsPerHour: 90 },
    { id: 'finans-mudur', isco: '1211', name: 'Finans / Mali İşler Müdürü', nameEn: 'Finance Manager', category: 'manager', hourlyRateTRY: 500, pointsPerHour: 100 },
    { id: 'satis-pazarlama-mudur', isco: '1221', name: 'Satış ve Pazarlama Müdürü', nameEn: 'Sales & Marketing Manager', category: 'manager', hourlyRateTRY: 420, pointsPerHour: 84 },
    { id: 'ik-mudur', isco: '1212', name: 'İnsan Kaynakları Müdürü', nameEn: 'HR Manager', category: 'manager', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'bilgi-teknolojileri-mudur', isco: '1330', name: 'BT / Yazılım Müdürü', nameEn: 'IT Manager', category: 'manager', hourlyRateTRY: 550, pointsPerHour: 110 },
    { id: 'restoran-mudur', isco: '1412', name: 'Restoran / Otel Müdürü', nameEn: 'Restaurant / Hotel Manager', category: 'manager', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'stk-yoneticisi', isco: '1431', name: 'STK / Vakıf Yöneticisi', nameEn: 'NGO / Foundation Manager', category: 'manager', hourlyRateTRY: 250, pointsPerHour: 50 },
    { id: 'okul-mudur', isco: '1345', name: 'Okul Müdürü', nameEn: 'School Principal', category: 'manager', hourlyRateTRY: 320, pointsPerHour: 64 },

    // ── 2. Profesyoneller (ISCO-08 Major Group 2) ──────────────────────────
    { id: 'doktor', isco: '2211', name: 'Doktor / Hekim', nameEn: 'Physician', category: 'professional', hourlyRateTRY: 750, pointsPerHour: 150, sourceNote: 'Sağlık-Sen 2025 + güncelleme' },
    { id: 'uzman-doktor', isco: '2212', name: 'Uzman Doktor', nameEn: 'Specialist Physician', category: 'professional', hourlyRateTRY: 950, pointsPerHour: 190 },
    { id: 'dis-hekimi', isco: '2261', name: 'Diş Hekimi', nameEn: 'Dentist', category: 'professional', hourlyRateTRY: 700, pointsPerHour: 140 },
    { id: 'eczaci', isco: '2262', name: 'Eczacı', nameEn: 'Pharmacist', category: 'professional', hourlyRateTRY: 450, pointsPerHour: 90 },
    { id: 'veteriner', isco: '2250', name: 'Veteriner Hekim', nameEn: 'Veterinarian', category: 'professional', hourlyRateTRY: 400, pointsPerHour: 80 },
    { id: 'psikolog', isco: '2634', name: 'Psikolog / Psikoterapist', nameEn: 'Psychologist', category: 'professional', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'sosyal-hizmet-uzmani', isco: '2635', name: 'Sosyal Hizmet Uzmanı', nameEn: 'Social Worker', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },

    { id: 'yazilim-muhendisi', isco: '2512', name: 'Yazılım Mühendisi / Geliştirici', nameEn: 'Software Engineer', category: 'professional', hourlyRateTRY: 550, pointsPerHour: 110 },
    { id: 'veri-bilimci', isco: '2511', name: 'Veri Bilimci / Veri Analisti', nameEn: 'Data Scientist / Analyst', category: 'professional', hourlyRateTRY: 580, pointsPerHour: 116 },
    { id: 'devops-muhendisi', isco: '2513', name: 'DevOps / Cloud Mühendisi', nameEn: 'DevOps / Cloud Engineer', category: 'professional', hourlyRateTRY: 600, pointsPerHour: 120 },
    { id: 'sistem-yoneticisi', isco: '2522', name: 'Sistem Yöneticisi', nameEn: 'Systems Administrator', category: 'professional', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'siber-guvenlik-uzmani', isco: '2529', name: 'Siber Güvenlik Uzmanı', nameEn: 'Cybersecurity Specialist', category: 'professional', hourlyRateTRY: 620, pointsPerHour: 124 },

    { id: 'insaat-muhendisi', isco: '2142', name: 'İnşaat Mühendisi', nameEn: 'Civil Engineer', category: 'professional', hourlyRateTRY: 450, pointsPerHour: 90 },
    { id: 'makine-muhendisi', isco: '2144', name: 'Makine Mühendisi', nameEn: 'Mechanical Engineer', category: 'professional', hourlyRateTRY: 420, pointsPerHour: 84 },
    { id: 'elektrik-muhendisi', isco: '2151', name: 'Elektrik / Elektronik Mühendisi', nameEn: 'Electrical / Electronics Engineer', category: 'professional', hourlyRateTRY: 440, pointsPerHour: 88 },
    { id: 'endustri-muhendisi', isco: '2141', name: 'Endüstri Mühendisi', nameEn: 'Industrial Engineer', category: 'professional', hourlyRateTRY: 400, pointsPerHour: 80 },
    { id: 'kimya-muhendisi', isco: '2145', name: 'Kimya Mühendisi', nameEn: 'Chemical Engineer', category: 'professional', hourlyRateTRY: 430, pointsPerHour: 86 },
    { id: 'ziraat-muhendisi', isco: '2132', name: 'Ziraat Mühendisi', nameEn: 'Agricultural Engineer', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'cevre-muhendisi', isco: '2143', name: 'Çevre Mühendisi', nameEn: 'Environmental Engineer', category: 'professional', hourlyRateTRY: 320, pointsPerHour: 64 },

    { id: 'mimar', isco: '2161', name: 'Mimar', nameEn: 'Architect', category: 'professional', hourlyRateTRY: 400, pointsPerHour: 80 },
    { id: 'sehir-planci', isco: '2164', name: 'Şehir Plancısı', nameEn: 'Urban Planner', category: 'professional', hourlyRateTRY: 370, pointsPerHour: 74 },
    { id: 'ic-mimar', isco: '2162', name: 'İç Mimar / Tasarımcı', nameEn: 'Interior Designer', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'grafik-tasarimci', isco: '2166', name: 'Grafik Tasarımcı', nameEn: 'Graphic Designer', category: 'professional', hourlyRateTRY: 250, pointsPerHour: 50 },
    { id: 'ux-tasarimci', isco: '2519', name: 'UX / UI Tasarımcı', nameEn: 'UX / UI Designer', category: 'professional', hourlyRateTRY: 450, pointsPerHour: 90 },

    { id: 'avukat', isco: '2611', name: 'Avukat', nameEn: 'Lawyer / Attorney', category: 'professional', hourlyRateTRY: 600, pointsPerHour: 120 },
    { id: 'hakim-savci', isco: '2612', name: 'Hâkim / Savcı', nameEn: 'Judge / Prosecutor', category: 'professional', hourlyRateTRY: 700, pointsPerHour: 140 },
    { id: 'noter', isco: '2619', name: 'Noter', nameEn: 'Notary', category: 'professional', hourlyRateTRY: 850, pointsPerHour: 170 },

    { id: 'muhasebeci', isco: '2411', name: 'Muhasebeci / Mali Müşavir', nameEn: 'Accountant', category: 'professional', hourlyRateTRY: 350, pointsPerHour: 70 },
    { id: 'denetci', isco: '2411', name: 'Denetçi / Bağımsız Denetçi', nameEn: 'Auditor', category: 'professional', hourlyRateTRY: 500, pointsPerHour: 100 },
    { id: 'finansal-analist', isco: '2413', name: 'Finansal Analist', nameEn: 'Financial Analyst', category: 'professional', hourlyRateTRY: 480, pointsPerHour: 96 },
    { id: 'bankaci', isco: '2412', name: 'Bankacı / Yatırım Uzmanı', nameEn: 'Banker / Investment Advisor', category: 'professional', hourlyRateTRY: 420, pointsPerHour: 84 },

    { id: 'oğretmen-okul-oncesi', isco: '2342', name: 'Okul Öncesi Öğretmeni', nameEn: 'Preschool Teacher', category: 'professional', hourlyRateTRY: 200, pointsPerHour: 40 },
    { id: 'oğretmen-ilkokul', isco: '2341', name: 'Sınıf Öğretmeni', nameEn: 'Primary School Teacher', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'oğretmen-ortaokul', isco: '2330', name: 'Ortaokul / Lise Öğretmeni', nameEn: 'Secondary School Teacher', category: 'professional', hourlyRateTRY: 240, pointsPerHour: 48 },
    { id: 'oğretmen-ozel-egitim', isco: '2352', name: 'Özel Eğitim Öğretmeni', nameEn: 'Special Education Teacher', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'akademisyen', isco: '2310', name: 'Akademisyen / Öğretim Üyesi', nameEn: 'Academic / University Lecturer', category: 'professional', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'arastirmaci', isco: '2310', name: 'Araştırmacı / Bilim İnsanı', nameEn: 'Researcher / Scientist', category: 'professional', hourlyRateTRY: 350, pointsPerHour: 70 },

    { id: 'gazeteci', isco: '2642', name: 'Gazeteci', nameEn: 'Journalist', category: 'professional', hourlyRateTRY: 240, pointsPerHour: 48 },
    { id: 'yazar', isco: '2641', name: 'Yazar / Editör', nameEn: 'Writer / Editor', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'cevirmen', isco: '2643', name: 'Çevirmen / Mütercim Tercüman', nameEn: 'Translator / Interpreter', category: 'professional', hourlyRateTRY: 260, pointsPerHour: 52 },

    // ── 3. Teknisyenler ve Yardımcı Profesyoneller (Major Group 3) ─────────
    { id: 'hemsire', isco: '2221', name: 'Hemşire', nameEn: 'Nurse', category: 'technician', hourlyRateTRY: 260, pointsPerHour: 52 },
    { id: 'ebe', isco: '2222', name: 'Ebe', nameEn: 'Midwife', category: 'technician', hourlyRateTRY: 240, pointsPerHour: 48 },
    { id: 'saglik-teknisyeni', isco: '3211', name: 'Sağlık Teknisyeni (Lab/Görüntüleme)', nameEn: 'Health Technician', category: 'technician', hourlyRateTRY: 200, pointsPerHour: 40 },
    { id: 'paramedic', isco: '3258', name: 'Paramedik / Acil Sağlık Teknikeri', nameEn: 'Paramedic', category: 'technician', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'fizyoterapist', isco: '2264', name: 'Fizyoterapist', nameEn: 'Physiotherapist', category: 'professional', hourlyRateTRY: 320, pointsPerHour: 64 },
    { id: 'diyetisyen', isco: '2265', name: 'Diyetisyen', nameEn: 'Dietitian', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },

    { id: 'elektrik-teknikeri', isco: '3113', name: 'Elektrik Teknikeri', nameEn: 'Electrical Technician', category: 'technician', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'bilgisayar-teknikeri', isco: '3513', name: 'Bilgisayar / Ağ Teknikeri', nameEn: 'Computer Technician', category: 'technician', hourlyRateTRY: 200, pointsPerHour: 40 },
    { id: 'cad-cizer', isco: '3118', name: 'CAD Çizici / Teknik Ressam', nameEn: 'CAD Drafter', category: 'technician', hourlyRateTRY: 220, pointsPerHour: 44 },

    { id: 'sosyal-medya-uzmani', isco: '2434', name: 'Sosyal Medya / Dijital Pazarlama Uzmanı', nameEn: 'Social Media / Digital Marketing Specialist', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'icerik-uretici', isco: '2641', name: 'İçerik Üreticisi / Yaratıcı', nameEn: 'Content Creator', category: 'professional', hourlyRateTRY: 240, pointsPerHour: 48 },
    { id: 'video-prodüktor', isco: '2654', name: 'Video Yapımcı / Editör', nameEn: 'Video Producer / Editor', category: 'professional', hourlyRateTRY: 260, pointsPerHour: 52 },
    { id: 'fotografci', isco: '3431', name: 'Fotoğrafçı', nameEn: 'Photographer', category: 'technician', hourlyRateTRY: 220, pointsPerHour: 44 },

    // ── 4. Büro Hizmetleri (Major Group 4) ────────────────────────────────
    { id: 'sekreter', isco: '4120', name: 'Sekreter / Asistan', nameEn: 'Secretary / Assistant', category: 'clerical', hourlyRateTRY: 130, pointsPerHour: 26 },
    { id: 'ofis-elemani', isco: '4110', name: 'Genel Ofis Elemanı', nameEn: 'Office Clerk', category: 'clerical', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'cagri-merkezi-temsilci', isco: '4222', name: 'Çağrı Merkezi Temsilcisi', nameEn: 'Call Center Agent', category: 'clerical', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'muhasebe-elemani', isco: '4311', name: 'Muhasebe Elemanı', nameEn: 'Accounting Clerk', category: 'clerical', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'veri-giris-elemani', isco: '4132', name: 'Veri Giriş Elemanı', nameEn: 'Data Entry Operator', category: 'clerical', hourlyRateTRY: 95, pointsPerHour: 20 },

    // ── 5. Hizmet ve Satış (Major Group 5) ────────────────────────────────
    { id: 'asci', isco: '3434', name: 'Aşçı / Chef', nameEn: 'Cook / Chef', category: 'service', hourlyRateTRY: 160, pointsPerHour: 32 },
    { id: 'garson', isco: '5131', name: 'Garson / Servis Personeli', nameEn: 'Waiter / Waitress', category: 'service', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'barmen', isco: '5132', name: 'Barmen', nameEn: 'Bartender', category: 'service', hourlyRateTRY: 120, pointsPerHour: 24 },
    { id: 'kuafor', isco: '5141', name: 'Kuaför / Berber', nameEn: 'Hairdresser / Barber', category: 'service', hourlyRateTRY: 140, pointsPerHour: 28 },

    { id: 'guvenlik-gorevlisi', isco: '5414', name: 'Güvenlik Görevlisi', nameEn: 'Security Guard', category: 'service', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'itfaiyeci', isco: '5411', name: 'İtfaiyeci', nameEn: 'Firefighter', category: 'service', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'polis', isco: '5412', name: 'Polis Memuru', nameEn: 'Police Officer', category: 'armed', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'cocuk-bakicisi', isco: '5311', name: 'Çocuk Bakıcısı', nameEn: 'Childcare Worker', category: 'service', hourlyRateTRY: 120, pointsPerHour: 24 },
    { id: 'yasli-bakicisi', isco: '5322', name: 'Yaşlı / Hasta Bakıcısı', nameEn: 'Elderly / Patient Caregiver', category: 'service', hourlyRateTRY: 130, pointsPerHour: 26 },

    { id: 'magaza-satis-elemani', isco: '5223', name: 'Mağaza Satış Elemanı', nameEn: 'Retail Sales Worker', category: 'sales', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'kasiyer', isco: '5230', name: 'Kasiyer', nameEn: 'Cashier', category: 'sales', hourlyRateTRY: 95, pointsPerHour: 20 },
    { id: 'satis-danismani', isco: '3322', name: 'Satış Danışmanı', nameEn: 'Sales Consultant', category: 'sales', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'emlak-danismani', isco: '3334', name: 'Emlak Danışmanı', nameEn: 'Real Estate Agent', category: 'sales', hourlyRateTRY: 220, pointsPerHour: 44 },

    // ── 6. Tarım & Hayvancılık (Major Group 6) ────────────────────────────
    { id: 'ciftci', isco: '6111', name: 'Çiftçi / Bahçıvan', nameEn: 'Farmer / Gardener', category: 'agriculture', hourlyRateTRY: 95, pointsPerHour: 20 },
    { id: 'arici', isco: '6123', name: 'Arıcı', nameEn: 'Beekeeper', category: 'agriculture', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'balikci', isco: '6222', name: 'Balıkçı', nameEn: 'Fisher', category: 'agriculture', hourlyRateTRY: 110, pointsPerHour: 22 },

    // ── 7. Sanat & Zanaat (Major Group 7) ─────────────────────────────────
    { id: 'marangoz', isco: '7115', name: 'Marangoz / Doğramacı', nameEn: 'Carpenter', category: 'craft', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'tesisatci', isco: '7126', name: 'Tesisatçı (Su / Doğalgaz)', nameEn: 'Plumber', category: 'craft', hourlyRateTRY: 160, pointsPerHour: 32 },
    { id: 'elektrikci', isco: '7411', name: 'Elektrikçi', nameEn: 'Electrician', category: 'craft', hourlyRateTRY: 150, pointsPerHour: 30 },
    { id: 'kaynakci', isco: '7212', name: 'Kaynakçı', nameEn: 'Welder', category: 'craft', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'boyaci', isco: '7131', name: 'Boyacı / Badanacı', nameEn: 'Painter', category: 'craft', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'duvarci', isco: '7112', name: 'Duvarcı / İnşaat İşçisi', nameEn: 'Mason / Bricklayer', category: 'craft', hourlyRateTRY: 120, pointsPerHour: 24 },
    { id: 'oto-tamircisi', isco: '7231', name: 'Oto Tamircisi', nameEn: 'Auto Mechanic', category: 'craft', hourlyRateTRY: 150, pointsPerHour: 30 },
    { id: 'terzi', isco: '7531', name: 'Terzi', nameEn: 'Tailor', category: 'craft', hourlyRateTRY: 120, pointsPerHour: 24 },

    // ── 8. Operatörler ve Sürücüler (Major Group 8) ───────────────────────
    { id: 'tir-soforu', isco: '8332', name: 'TIR / Kamyon Şoförü', nameEn: 'Truck Driver', category: 'plant', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'taksi-soforu', isco: '8322', name: 'Taksi / Servis Şoförü', nameEn: 'Taxi / Service Driver', category: 'plant', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'forklift-operatoru', isco: '8344', name: 'Forklift / İş Makinesi Operatörü', nameEn: 'Forklift / Heavy Equipment Operator', category: 'plant', hourlyRateTRY: 130, pointsPerHour: 26 },

    // ── 9. Nitelik Gerektirmeyen Meslekler (Major Group 9) ────────────────
    { id: 'temizlik-personeli', isco: '9112', name: 'Temizlik Personeli', nameEn: 'Cleaner', category: 'elementary', hourlyRateTRY: 95, pointsPerHour: 20 },
    { id: 'kurye', isco: '9621', name: 'Kurye / Dağıtım Elemanı', nameEn: 'Courier / Delivery Worker', category: 'elementary', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'tarim-isci', isco: '9211', name: 'Tarım İşçisi (mevsimlik)', nameEn: 'Agricultural Laborer', category: 'elementary', hourlyRateTRY: 90, pointsPerHour: 20 },
    { id: 'insaat-isci', isco: '9313', name: 'İnşaat Düz İşçisi', nameEn: 'Construction Laborer', category: 'elementary', hourlyRateTRY: 100, pointsPerHour: 20 },

    // ── 10. Silahlı Kuvvetler (Major Group 0) ─────────────────────────────
    { id: 'subay', isco: '0110', name: 'Subay / Astsubay', nameEn: 'Military Officer / NCO', category: 'armed', hourlyRateTRY: 280, pointsPerHour: 56 },

    // ── Özel kategoriler (öğrenci, ev hanımı, emekli, işsiz) ──────────────
    { id: 'ogrenci', isco: '9999', name: 'Öğrenci', nameEn: 'Student', category: 'special', hourlyRateTRY: 100, pointsPerHour: 20, sourceNote: 'Asgari ücret saatlik brüt referans' },
    { id: 'ev-hanimi', isco: '9999', name: 'Ev Hanımı / Ev Erkeği', nameEn: 'Homemaker', category: 'special', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'emekli', isco: '9999', name: 'Emekli', nameEn: 'Retired', category: 'special', hourlyRateTRY: 150, pointsPerHour: 30, sourceNote: 'Eski meslek + tecrübe karması' },
    { id: 'issiz', isco: '9999', name: 'İş Arayan', nameEn: 'Job Seeker', category: 'special', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'lise-ogrencisi', isco: '9999', name: 'Lise Öğrencisi', nameEn: 'High School Student', category: 'special', hourlyRateTRY: 100, pointsPerHour: 25 },
    { id: 'universite-ogrencisi', isco: '9999', name: 'Üniversite Öğrencisi', nameEn: 'University Student', category: 'special', hourlyRateTRY: 100, pointsPerHour: 30 },
    { id: 'lisansustu-ogrencisi', isco: '9999', name: 'Yüksek Lisans / Doktora Öğrencisi', nameEn: 'Graduate Student', category: 'special', hourlyRateTRY: 200, pointsPerHour: 50 },
    { id: 'stajyer', isco: '9999', name: 'Stajyer / Çırak', nameEn: 'Intern / Apprentice', category: 'special', hourlyRateTRY: 110, pointsPerHour: 25 },
    { id: 'freelancer', isco: '9999', name: 'Serbest Çalışan / Freelancer', nameEn: 'Freelancer', category: 'special', hourlyRateTRY: 280, pointsPerHour: 55 },
    { id: 'girisimci', isco: '9999', name: 'Girişimci / Şirket Kurucusu', nameEn: 'Entrepreneur', category: 'special', hourlyRateTRY: 400, pointsPerHour: 80 },
    { id: 'diger', isco: '9999', name: 'Diğer / Belirtilmemiş', nameEn: 'Other / Unspecified', category: 'special', hourlyRateTRY: DEFAULT_HOURLY_RATE_TRY, pointsPerHour: DEFAULT_POINTS_PER_HOUR },

    // ── EK: Yeni / nadir ama önemli meslekler (2026-06-06 eklemeleri) ────────
    // Yöneticiler
    { id: 'saglik-mudur', isco: '1342', name: 'Sağlık Kurumu Müdürü', nameEn: 'Health Service Manager', category: 'manager', hourlyRateTRY: 420, pointsPerHour: 84 },
    { id: 'lojistik-mudur', isco: '1324', name: 'Lojistik / Tedarik Müdürü', nameEn: 'Supply Chain Manager', category: 'manager', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'arge-mudur', isco: '1223', name: 'Ar-Ge Müdürü', nameEn: 'R&D Manager', category: 'manager', hourlyRateTRY: 550, pointsPerHour: 110 },
    { id: 'urun-yoneticisi', isco: '2421', name: 'Ürün Yöneticisi / Product Manager', nameEn: 'Product Manager', category: 'manager', hourlyRateTRY: 520, pointsPerHour: 104 },
    { id: 'proje-yoneticisi', isco: '1213', name: 'Proje Yöneticisi (PMI)', nameEn: 'Project Manager', category: 'manager', hourlyRateTRY: 400, pointsPerHour: 80 },

    // Profesyoneller — Bilim
    { id: 'biyolog', isco: '2131', name: 'Biyolog', nameEn: 'Biologist', category: 'professional', hourlyRateTRY: 260, pointsPerHour: 52 },
    { id: 'kimyager', isco: '2113', name: 'Kimyager', nameEn: 'Chemist', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'fizikci', isco: '2111', name: 'Fizikçi', nameEn: 'Physicist', category: 'professional', hourlyRateTRY: 300, pointsPerHour: 60 },
    { id: 'matematikci', isco: '2120', name: 'Matematikçi / İstatistikçi', nameEn: 'Mathematician / Statistician', category: 'professional', hourlyRateTRY: 320, pointsPerHour: 64 },
    { id: 'jeolog', isco: '2114', name: 'Jeolog / Jeofizikçi', nameEn: 'Geologist / Geophysicist', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },

    // Profesyoneller — Sosyal Bilimler
    { id: 'sosyolog', isco: '2632', name: 'Sosyolog', nameEn: 'Sociologist', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'antropolog', isco: '2632', name: 'Antropolog', nameEn: 'Anthropologist', category: 'professional', hourlyRateTRY: 230, pointsPerHour: 46 },
    { id: 'tarihci-arkeolog', isco: '2633', name: 'Tarihçi / Arkeolog', nameEn: 'Historian / Archaeologist', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'filozof', isco: '2633', name: 'Filozof / Etik Uzmanı', nameEn: 'Philosopher / Ethics Specialist', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'imam', isco: '2636', name: 'İmam / Müezzin', nameEn: 'Imam / Muezzin', category: 'professional', hourlyRateTRY: 180, pointsPerHour: 36 },

    // Profesyoneller — Mühendislik (yeni)
    { id: 'biyomedikal-muhendis', isco: '2149', name: 'Biyomedikal Mühendisi', nameEn: 'Biomedical Engineer', category: 'professional', hourlyRateTRY: 460, pointsPerHour: 92 },
    { id: 'gida-muhendis', isco: '2141', name: 'Gıda Mühendisi', nameEn: 'Food Engineer', category: 'professional', hourlyRateTRY: 340, pointsPerHour: 68 },
    { id: 'tekstil-muhendis', isco: '2141', name: 'Tekstil Mühendisi', nameEn: 'Textile Engineer', category: 'professional', hourlyRateTRY: 320, pointsPerHour: 64 },
    { id: 'havacilik-muhendis', isco: '2144', name: 'Havacılık / Uzay Mühendisi', nameEn: 'Aerospace Engineer', category: 'professional', hourlyRateTRY: 580, pointsPerHour: 116 },
    { id: 'gemi-muhendis', isco: '2144', name: 'Gemi İnşaat / Deniz Mühendisi', nameEn: 'Marine Engineer', category: 'professional', hourlyRateTRY: 480, pointsPerHour: 96 },

    // Profesyoneller — Dijital (yeni nesil)
    { id: 'yapay-zeka-uzmani', isco: '2519', name: 'Yapay Zeka / ML Mühendisi', nameEn: 'AI / ML Engineer', category: 'professional', hourlyRateTRY: 720, pointsPerHour: 144 },
    { id: 'blockchain-gelistirici', isco: '2519', name: 'Blockchain / Web3 Geliştirici', nameEn: 'Blockchain / Web3 Developer', category: 'professional', hourlyRateTRY: 680, pointsPerHour: 136 },
    { id: 'oyun-gelistirici', isco: '2513', name: 'Oyun Geliştiricisi', nameEn: 'Game Developer', category: 'professional', hourlyRateTRY: 480, pointsPerHour: 96 },
    { id: 'qa-test-muhendis', isco: '2514', name: 'QA / Test Mühendisi', nameEn: 'QA / Test Engineer', category: 'professional', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'dijital-pazarlama-uzmani', isco: '2434', name: 'Performance Marketing / SEO Uzmanı', nameEn: 'Performance Marketing / SEO Specialist', category: 'professional', hourlyRateTRY: 320, pointsPerHour: 64 },
    { id: 'e-ticaret-uzmani', isco: '2434', name: 'E-Ticaret Uzmanı', nameEn: 'E-Commerce Specialist', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },

    // Sanat & Kültür
    { id: 'ressam', isco: '2651', name: 'Ressam / Plastik Sanatçı', nameEn: 'Painter / Visual Artist', category: 'professional', hourlyRateTRY: 200, pointsPerHour: 40 },
    { id: 'heykeltras', isco: '2651', name: 'Heykeltıraş', nameEn: 'Sculptor', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'muzisyen', isco: '2652', name: 'Müzisyen', nameEn: 'Musician', category: 'professional', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'tiyatro-oyuncusu', isco: '2655', name: 'Tiyatro / Sinema Oyuncusu', nameEn: 'Actor', category: 'professional', hourlyRateTRY: 250, pointsPerHour: 50 },
    { id: 'dansci-koreograf', isco: '2653', name: 'Dansçı / Koreograf', nameEn: 'Dancer / Choreographer', category: 'professional', hourlyRateTRY: 210, pointsPerHour: 42 },
    { id: 'ses-muhendisi', isco: '2654', name: 'Ses / Stüdyo Mühendisi', nameEn: 'Sound Engineer', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },
    { id: 'animator', isco: '2166', name: 'Animasyon / Motion Designer', nameEn: 'Animator / Motion Designer', category: 'professional', hourlyRateTRY: 320, pointsPerHour: 64 },

    // Teknisyenler / Sağlık (yeni)
    { id: 'anestezi-teknisyeni', isco: '3211', name: 'Anestezi Teknisyeni', nameEn: 'Anesthesia Technician', category: 'technician', hourlyRateTRY: 230, pointsPerHour: 46 },
    { id: 'radyoloji-teknisyeni', isco: '3211', name: 'Radyoloji Teknisyeni', nameEn: 'Radiology Technician', category: 'technician', hourlyRateTRY: 240, pointsPerHour: 48 },
    { id: 'agiz-dis-saglik-teknisyeni', isco: '3251', name: 'Ağız-Diş Sağlığı Teknisyeni', nameEn: 'Dental Hygienist', category: 'technician', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'optisyen', isco: '3254', name: 'Optisyen', nameEn: 'Optician', category: 'technician', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'odyolog', isco: '2266', name: 'Odyolog', nameEn: 'Audiologist', category: 'professional', hourlyRateTRY: 260, pointsPerHour: 52 },
    { id: 'konusma-terapisti', isco: '2266', name: 'Konuşma / Dil Terapisti', nameEn: 'Speech Therapist', category: 'professional', hourlyRateTRY: 280, pointsPerHour: 56 },

    // Hizmet (yeni)
    { id: 'fitness-egitmeni', isco: '3423', name: 'Fitness / Spor Eğitmeni', nameEn: 'Fitness Trainer', category: 'service', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'yoga-pilates-egitmeni', isco: '3423', name: 'Yoga / Pilates Eğitmeni', nameEn: 'Yoga / Pilates Instructor', category: 'service', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'masaj-terapisti', isco: '3255', name: 'Masaj / Manuel Terapi Uzmanı', nameEn: 'Massage Therapist', category: 'service', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'kabin-gorevlisi', isco: '5111', name: 'Uçuş / Kabin Görevlisi', nameEn: 'Flight Attendant', category: 'service', hourlyRateTRY: 200, pointsPerHour: 40 },
    { id: 'rehber', isco: '5113', name: 'Tur Rehberi', nameEn: 'Tour Guide', category: 'service', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'evcil-hayvan-egitmeni', isco: '5164', name: 'Evcil Hayvan Eğitmeni / Bakıcı', nameEn: 'Pet Trainer / Caretaker', category: 'service', hourlyRateTRY: 140, pointsPerHour: 28 },

    // Zanaat (yeni)
    { id: 'firinci-pastaci', isco: '7512', name: 'Fırıncı / Pastacı', nameEn: 'Baker / Pastry Chef', category: 'craft', hourlyRateTRY: 130, pointsPerHour: 26 },
    { id: 'kasap-etci', isco: '7511', name: 'Kasap / Etçi', nameEn: 'Butcher', category: 'craft', hourlyRateTRY: 130, pointsPerHour: 26 },
    { id: 'ayakkabi-tamircisi', isco: '7536', name: 'Ayakkabı / Çanta Tamircisi', nameEn: 'Cobbler / Bag Repair', category: 'craft', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'saat-tamircisi', isco: '7311', name: 'Saatçi / Saat Tamircisi', nameEn: 'Watchmaker', category: 'craft', hourlyRateTRY: 130, pointsPerHour: 26 },
    { id: 'kuyumcu', isco: '7313', name: 'Kuyumcu / Sarraf', nameEn: 'Jeweler', category: 'craft', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'cilingir', isco: '7222', name: 'Çilingir / Anahtarcı', nameEn: 'Locksmith', category: 'craft', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'cam-ustasi', isco: '7314', name: 'Cam / Seramik Ustası', nameEn: 'Glass / Ceramic Artisan', category: 'craft', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'mermerci', isco: '7113', name: 'Mermerci / Taşçı', nameEn: 'Stonemason', category: 'craft', hourlyRateTRY: 140, pointsPerHour: 28 },
    { id: 'klima-sogutma', isco: '7127', name: 'Klima / Soğutma Teknisyeni', nameEn: 'HVAC / Refrigeration Technician', category: 'craft', hourlyRateTRY: 170, pointsPerHour: 34 },
    { id: 'catici', isco: '7121', name: 'Çatıcı', nameEn: 'Roofer', category: 'craft', hourlyRateTRY: 130, pointsPerHour: 26 },

    // Operatör / Sürücüler (yeni)
    { id: 'otobus-soforu', isco: '8331', name: 'Otobüs / Belediye Şoförü', nameEn: 'Bus Driver', category: 'plant', hourlyRateTRY: 130, pointsPerHour: 26 },
    { id: 'motorlu-kurye', isco: '8323', name: 'Motorlu Kurye / Moto Kurye', nameEn: 'Motorcycle Courier', category: 'plant', hourlyRateTRY: 120, pointsPerHour: 24 },
    { id: 'tren-operatoru', isco: '8311', name: 'Tren / Metro Sürücüsü', nameEn: 'Train Driver', category: 'plant', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'gemi-kaptani', isco: '3151', name: 'Gemi Kaptanı', nameEn: 'Ship Captain', category: 'plant', hourlyRateTRY: 380, pointsPerHour: 76 },
    { id: 'pilot', isco: '3153', name: 'Pilot (Uçak / Helikopter)', nameEn: 'Pilot', category: 'professional', hourlyRateTRY: 850, pointsPerHour: 170 },
    { id: 'drone-pilotu', isco: '3155', name: 'Drone / İHA Pilotu', nameEn: 'Drone Pilot', category: 'technician', hourlyRateTRY: 260, pointsPerHour: 52 },

    // Asker / Güvenlik (genişletilmiş)
    { id: 'astsubay', isco: '0210', name: 'Astsubay', nameEn: 'Non-Commissioned Officer', category: 'armed', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'er', isco: '0310', name: 'Er / Erbaş', nameEn: 'Soldier / Enlisted', category: 'armed', hourlyRateTRY: 110, pointsPerHour: 22 },
    { id: 'sahil-guvenlik', isco: '0210', name: 'Sahil Güvenlik', nameEn: 'Coast Guard', category: 'armed', hourlyRateTRY: 240, pointsPerHour: 48 },
    { id: 'jandarma', isco: '5412', name: 'Jandarma', nameEn: 'Gendarmerie', category: 'armed', hourlyRateTRY: 220, pointsPerHour: 44 },
    { id: 'ozel-guvenlik-yoneticisi', isco: '3411', name: 'Özel Güvenlik Şefi / Yöneticisi', nameEn: 'Private Security Manager', category: 'armed', hourlyRateTRY: 180, pointsPerHour: 36 },
    { id: 'gardiyan', isco: '5413', name: 'İnfaz Koruma Memuru / Gardiyan', nameEn: 'Prison Guard', category: 'armed', hourlyRateTRY: 160, pointsPerHour: 32 },

    // Elementary (yeni)
    { id: 'kapici-temizlik', isco: '9111', name: 'Apartman Görevlisi / Kapıcı', nameEn: 'Janitor / Building Caretaker', category: 'elementary', hourlyRateTRY: 90, pointsPerHour: 20 },
    { id: 'cop-toplama', isco: '9613', name: 'Çöp Toplama / Geri Dönüşüm İşçisi', nameEn: 'Refuse Collector', category: 'elementary', hourlyRateTRY: 100, pointsPerHour: 20 },
    { id: 'cam-silici', isco: '9612', name: 'Cam Silici / Yüksek Asansör Temizliği', nameEn: 'Window / Rope Access Cleaner', category: 'elementary', hourlyRateTRY: 110, pointsPerHour: 22 },
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
 * Adam-saat × hourlyRate = Sosyal Etki MALİ DEĞERİ (₺).
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

/**
 * Etkin saat başı puan çöz: aynı override mekanizması ile ama farklı
 * Firestore key (`points`). Adam-saat × pointsPerHour = Sosyal Etki PUANI.
 *
 * @param professionId - meslek id
 * @param overrides - Firestore `volunteerScoring/professions` doc'undan { [id]: number }
 */
export function resolvePointsPerHour(
    professionId: string | undefined | null,
    overrides?: Readonly<Record<string, number>>,
): number {
    if (professionId && overrides && typeof overrides[professionId] === 'number') {
        return overrides[professionId];
    }
    const p = findProfession(professionId);
    return p?.pointsPerHour ?? DEFAULT_POINTS_PER_HOUR;
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
