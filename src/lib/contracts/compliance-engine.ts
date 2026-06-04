/**
 * Rule-based, deterministic compliance scoring engine.
 *
 * LLM çağrısı YAPMAZ. Yalnızca markdown içeriği üzerinde başlık + anahtar
 * kelime taraması yapar. Tüm çağrılar idempotent ve saf fonksiyondur — aynı
 * input → aynı output.
 *
 * Algoritma:
 *   1. Her jurisdiction için zorunlu konuların (`RequiredTopic`) listesi var.
 *   2. Contract markdown'u başlıklara (`##`/`###`) bölünür.
 *   3. Her başlık + altındaki gövde için topic match fonksiyonları çalışır.
 *   4. Eşleşen topic → `compliantSections`. Eşleşmeyen → `missingSections`.
 *   5. Score = round((matched / total) * 100).
 *   6. Eksik topic için kısa şablon önerisi üretilir (`buildSuggestion`).
 *
 * Yeni jurisdiction eklerken: `REQUIRED_TOPICS[jurisdiction]` altına ~15-25
 * topic ekle. Her topic için en az 1 keyword listesi (TR/EN karışık olabilir).
 */

import type {
  ComplianceJurisdiction,
  ComplianceScore,
  ComplianceSeverity,
  ComplianceSuggestion,
  CompliantSection,
  MissingSection,
} from './compliance-types';
import { COMPLIANCE_JURISDICTIONS } from './compliance-types';

interface RequiredTopic {
  /** Stable topic id (snake_case veya kebab-case). */
  topic: string;
  /** Match için case-insensitive anahtar kelime/expression listesi. AT LEAST 1 match → topic karşılanmış. */
  keywords: string[];
  /** Madde/kanun referansları (admin UI'da gösterilir). */
  laws: string[];
  severity: ComplianceSeverity;
  /** Eksik durumda kullanılan kısa şablon. */
  template: string;
  /** Varsa örnek docs/contracts/{docId}.md referansı. */
  sourceDoc?: string;
}

/**
 * Tüm 12 jurisdiction için zorunlu topic listesi. Sayılar tutarlı olsun diye
 * çoğu blok 18-22 topic içerir.
 *
 * Keyword stratejisi: jurisdiction'a özgü kanun/madde adları + standart konu
 * isimleri. Tek bir doğal dil yeterli — KVKK için TR, GDPR için EN baskındır.
 */
const REQUIRED_TOPICS: Record<ComplianceJurisdiction, RequiredTopic[]> = {
  TR: [
    { topic: 'data_controller', keywords: ['veri sorumlusu', 'data controller'], laws: ['KVKK m.3', 'KVKK m.10'], severity: 'high', template: '## Veri Sorumlusu\n\nVeri sorumlusu: hangel [ünvan]. İletişim: kvkk@hangel.org. VERBİS sicil no: [placeholder].', sourceDoc: 'tr-kvkk-aydinlatma' },
    { topic: 'data_categories', keywords: ['kişisel veri kategorileri', 'işlenen kişisel veriler', 'veri tipleri'], laws: ['KVKK m.10/1-a'], severity: 'high', template: '## İşlenen Kişisel Veri Kategorileri\n\nKimlik, iletişim, konum, özel nitelikli sağlık (kan grubu), finansal, cihaz/teknik, pazarlama izinleri.', sourceDoc: 'tr-kvkk-aydinlatma' },
    { topic: 'purposes', keywords: ['işlenme amaç', 'işleme amaçları', 'amaçlar'], laws: ['KVKK m.4/2', 'KVKK m.10/1-b'], severity: 'high', template: '## İşlenme Amaçları\n\nÜyelik, acil kan çağrısı eşleştirme, bağış işlemi, yasal yükümlülük, güvenlik.', sourceDoc: 'tr-kvkk-aydinlatma' },
    { topic: 'legal_basis', keywords: ['hukuki sebep', 'işleme şartı', 'm. 5/2', 'm. 6/3', 'açık rıza'], laws: ['KVKK m.5', 'KVKK m.6'], severity: 'high', template: '## Hukuki Sebep\n\nSözleşmenin ifası (m.5/2-c), açık rıza (m.5/1, m.6/3), kanuni yükümlülük (m.5/2-a), meşru menfaat (m.5/2-f).', sourceDoc: 'tr-kvkk-aydinlatma' },
    { topic: 'explicit_consent', keywords: ['açık rıza', 'explicit consent'], laws: ['KVKK m.3/1-a', 'KVKK m.6/3'], severity: 'high', template: '## Açık Rıza\n\nSağlık verisi (kan grubu) ve pazarlama iletişimi için açık rıza alınır; geri çekilebilir.', sourceDoc: 'tr-acik-riza-saglik-verisi' },
    { topic: 'data_subject_rights', keywords: ['ilgili kişi hakları', 'm. 11', 'haklarınız', 'KVKK m.11'], laws: ['KVKK m.11', 'KVKK m.13'], severity: 'high', template: '## İlgili Kişi Hakları (m.11)\n\nBilgi talep, düzeltme, silme, itiraz, taşınabilirlik. Başvuru: kvkk@hangel.org.', sourceDoc: 'tr-kvkk-aydinlatma' },
    { topic: 'transfer_domestic', keywords: ['yurt içi aktarım', 'yurtiçi aktarım', 'aktarım'], laws: ['KVKK m.8'], severity: 'high', template: '## Yurt İçi Aktarım\n\nÖdeme sağlayıcı, resmi merciler, çağrı eşleştirmesi için ilgili kullanıcılar.' },
    { topic: 'transfer_international', keywords: ['yurt dışı aktarım', 'yurtdışı aktarım', 'uluslararası aktarım', 'm. 9'], laws: ['KVKK m.9', 'KVKK Yurt Dışı Aktarım Rehberi 2024'], severity: 'high', template: '## Yurt Dışı Aktarım\n\nBulut sağlayıcılar (Google Cloud / Firebase, Apple) — KVKK m.9 uyarınca yeterlilik kararı veya bağlayıcı kurumsal kurallar.' },
    { topic: 'retention', keywords: ['saklama süresi', 'saklama', 'imha', 'silme süresi'], laws: ['KVKK m.7', 'Kişisel Veri Saklama ve İmha Yönetmeliği'], severity: 'high', template: '## Saklama ve İmha\n\nVeri kategorisine göre saklama süreleri ve KVK Kurumu Yönetmeliği uyarınca imha politikası.' },
    { topic: 'security_measures', keywords: ['veri güvenliği', 'teknik ve idari tedbir', 'güvenlik önlem'], laws: ['KVKK m.12'], severity: 'high', template: '## Veri Güvenliği\n\nŞifreleme, erişim kontrolü, denetim logları, sızıntı bildirim prosedürü (72 saat).' },
    { topic: 'health_data', keywords: ['sağlık verisi', 'özel nitelikli', 'kan grubu', 'm. 6'], laws: ['KVKK m.6', 'Kişisel Sağlık Verileri Yönetmeliği'], severity: 'high', template: '## Sağlık Verisi (Özel Nitelikli)\n\nKan grubu yalnızca açık rıza ile işlenir; KVKK m.6/3 ve Sağlık Bakanlığı yönetmeliği uygulanır.' },
    { topic: 'child_data', keywords: ['çocuk', 'küçük', 'velayet', '18 yaş', 'ebeveyn'], laws: ['KVKK m.5', 'Çocuk Hakları Sözleşmesi'], severity: 'medium', template: '## Çocuk Verisi\n\n18 yaş altı kullanıcıdan veri toplanmaz / velayet sahibi onayı zorunludur.' },
    { topic: 'cookies', keywords: ['çerez', 'cookie', 'tracking', 'izleme'], laws: ['KVKK m.5', '5651 sayılı Kanun'], severity: 'medium', template: '## Çerezler\n\nZorunlu/analitik/pazarlama çerez kategorileri ve kullanıcı tercih merkezi.', sourceDoc: 'tr-cerez-politikasi' },
    { topic: 'marketing_consent', keywords: ['pazarlama', 'iys', 'ticari elektronik', 'reklam'], laws: ['KVKK m.5', '6563 sayılı Kanun (İYS)'], severity: 'medium', template: '## Pazarlama İletişimi\n\nİYS entegre açık rıza, çıkış (opt-out) bağlantısı her iletide.', sourceDoc: 'tr-acik-riza-pazarlama' },
    { topic: 'breach_notification', keywords: ['veri ihlali', 'sızıntı', 'breach', 'KVKK Kurulu'], laws: ['KVKK m.12/5', 'KVKK Kararı 2019/10'], severity: 'high', template: '## Veri İhlali Bildirimi\n\n72 saat içinde KVK Kurumu ve etkilenen kişiye bildirim prosedürü.' },
    { topic: 'verbis', keywords: ['verbis', 'sicil'], laws: ['Veri Sorumluları Sicili Yönetmeliği'], severity: 'medium', template: '## VERBİS Sicil Kaydı\n\nVERBİS sicil no: [placeholder]. Kayıt yenileme süreci tanımlanmıştır.' },
    { topic: 'automated_decision', keywords: ['otomatik karar', 'profilleme', 'otomatik işleme'], laws: ['KVKK m.11/1-g'], severity: 'medium', template: '## Otomatik Karar Verme\n\nAlgoritmik eşleştirme süreci ve insan denetim hakkı.' },
    { topic: 'governing_law', keywords: ['uygulanacak hukuk', 'yetkili mahkeme', 'tahkim'], laws: ['HMK'], severity: 'low', template: '## Uygulanacak Hukuk ve Yetki\n\nTürkiye Cumhuriyeti hukuku; İstanbul Mahkemeleri yetkilidir.' },
    { topic: 'updates_to_policy', keywords: ['güncelleme', 'değişiklik', 'revizyon', 'yürürlük'], laws: [], severity: 'low', template: '## Politika Güncellemeleri\n\nÖnemli değişikliklerde kullanıcıya bildirim ve yeniden onay.' },
    { topic: 'contact', keywords: ['iletişim', 'başvuru', 'kvkk@', 'e-posta'], laws: ['KVKK m.13'], severity: 'medium', template: '## İletişim\n\nVeri sorumlusu temsilcisi: [ad]. Başvuru: kvkk@hangel.org.' },
  ],

  EU: [
    { topic: 'controller', keywords: ['controller', 'data controller'], laws: ['GDPR Art.4(7)', 'GDPR Art.13'], severity: 'high', template: '## Data Controller\n\nhangel acts as data controller. Contact: privacy@hangel.org. EU representative: [Art.27 rep].', sourceDoc: 'eu-privacy-policy' },
    { topic: 'eu_representative', keywords: ['Article 27', 'art. 27', 'EU representative'], laws: ['GDPR Art.27'], severity: 'high', template: '## EU Representative (Art.27)\n\n[Name, address] — designated where controller is outside the EU.' },
    { topic: 'dpo', keywords: ['data protection officer', 'dpo'], laws: ['GDPR Art.37-39'], severity: 'medium', template: '## Data Protection Officer\n\nDPO: [name], contact: dpo@hangel.org.' },
    { topic: 'lawful_basis', keywords: ['lawful basis', 'legal basis', 'art. 6', 'article 6'], laws: ['GDPR Art.6'], severity: 'high', template: '## Lawful Basis\n\nContract performance, consent, legal obligation, legitimate interests, vital interests.', sourceDoc: 'eu-privacy-policy' },
    { topic: 'special_category', keywords: ['special category', 'art. 9', 'sensitive data', 'health data'], laws: ['GDPR Art.9'], severity: 'high', template: '## Special Category Data\n\nHealth data (blood type) processed under Art.9(2)(a) explicit consent.' },
    { topic: 'data_subject_rights', keywords: ['data subject rights', 'right to access', 'right to erasure', 'art. 15', 'art. 17'], laws: ['GDPR Art.15-22'], severity: 'high', template: '## Data Subject Rights\n\nAccess, rectification, erasure, restriction, portability, objection, automated-decision opt-out.', sourceDoc: 'eu-privacy-policy' },
    { topic: 'consent_withdrawal', keywords: ['withdraw consent', 'withdrawal of consent', 'art. 7'], laws: ['GDPR Art.7(3)'], severity: 'high', template: '## Withdrawing Consent\n\nConsent may be withdrawn at any time via account settings; no retroactive effect.' },
    { topic: 'international_transfer', keywords: ['international transfer', 'third country', 'art. 44', 'scc', 'standard contractual clauses', 'adequacy'], laws: ['GDPR Art.44-49'], severity: 'high', template: '## International Transfers\n\nTransfers under Art.46 SCCs or adequacy decisions (UK, Switzerland, etc.).' },
    { topic: 'retention', keywords: ['retention period', 'data retention', 'storage limitation'], laws: ['GDPR Art.5(1)(e)'], severity: 'high', template: '## Data Retention\n\nCategory-specific retention schedule and deletion procedures.' },
    { topic: 'security', keywords: ['security', 'art. 32', 'technical and organisational measures'], laws: ['GDPR Art.32'], severity: 'high', template: '## Security Measures\n\nEncryption at rest/transit, access controls, audit logging, regular penetration testing.' },
    { topic: 'breach_notification', keywords: ['data breach', 'art. 33', 'art. 34', '72 hours'], laws: ['GDPR Art.33-34'], severity: 'high', template: '## Breach Notification\n\nSupervisory authority notification within 72 hours; data subject notification when high risk.' },
    { topic: 'dpia', keywords: ['dpia', 'data protection impact assessment', 'art. 35'], laws: ['GDPR Art.35'], severity: 'medium', template: '## DPIA\n\nHigh-risk processing (health data matching) assessed under Art.35.', sourceDoc: 'eu-dpia-template' },
    { topic: 'children', keywords: ['children', 'child', 'art. 8', 'age of consent', '16 years'], laws: ['GDPR Art.8'], severity: 'medium', template: '## Children\n\nMinimum age 16 (EU); parental consent required below threshold.' },
    { topic: 'cookies_eprivacy', keywords: ['cookies', 'eprivacy', 'tracking technologies'], laws: ['ePrivacy Directive 2002/58', 'GDPR Art.6'], severity: 'medium', template: '## Cookies / ePrivacy\n\nGranular consent banner, strictly-necessary vs analytics/marketing.', sourceDoc: 'eu-cookie-policy' },
    { topic: 'profiling', keywords: ['profiling', 'automated decision', 'art. 22'], laws: ['GDPR Art.22'], severity: 'medium', template: '## Automated Decision-Making\n\nNo solely-automated decisions with legal effect; matching is reviewable.' },
    { topic: 'supervisory_authority', keywords: ['supervisory authority', 'complaint', 'right to lodge'], laws: ['GDPR Art.77'], severity: 'medium', template: '## Right to Complain\n\nRight to lodge complaint with lead supervisory authority.' },
    { topic: 'dsa_compliance', keywords: ['digital services act', 'dsa', 'illegal content'], laws: ['Regulation (EU) 2022/2065 (DSA)'], severity: 'low', template: '## Digital Services Act\n\nNotice-and-action mechanism, transparency reports, trusted flaggers.', sourceDoc: 'eu-dsa-compliance' },
    { topic: 'ai_act', keywords: ['ai act', 'artificial intelligence', 'high-risk ai'], laws: ['Regulation (EU) 2024/1689 (AI Act)'], severity: 'low', template: '## AI Act Statement\n\nMatching uses limited-risk AI; transparency and human oversight applied.', sourceDoc: 'eu-ai-act-statement' },
    { topic: 'contact_privacy', keywords: ['contact', 'privacy@', 'data protection'], laws: ['GDPR Art.13(1)(a)'], severity: 'medium', template: '## Contact\n\nprivacy@hangel.org for all data protection enquiries.' },
    { topic: 'changes_to_policy', keywords: ['changes to', 'updates to', 'amendments'], laws: [], severity: 'low', template: '## Changes to this Policy\n\nMaterial changes notified in-app; effective date displayed.' },
  ],

  UK: [
    { topic: 'controller', keywords: ['controller', 'data controller'], laws: ['UK GDPR Art.4(7)', 'DPA 2018 s.6'], severity: 'high', template: '## Data Controller\n\nhangel — UK representative: [name].', sourceDoc: 'uk-privacy-policy' },
    { topic: 'uk_representative', keywords: ['UK representative', 'article 27 uk'], laws: ['UK GDPR Art.27'], severity: 'high', template: '## UK Representative\n\nUK representative under UK GDPR Art.27: [contact].' },
    { topic: 'ico_complaint', keywords: ['ico', 'information commissioner'], laws: ['DPA 2018 s.165'], severity: 'high', template: '## ICO Complaints\n\nRight to complain to the Information Commissioner\'s Office: ico.org.uk.' },
    { topic: 'lawful_basis', keywords: ['lawful basis', 'art. 6'], laws: ['UK GDPR Art.6'], severity: 'high', template: '## Lawful Basis\n\nContract, consent, legal obligation, legitimate interests.' },
    { topic: 'special_category', keywords: ['special category', 'art. 9', 'health'], laws: ['UK GDPR Art.9', 'DPA 2018 Sch.1'], severity: 'high', template: '## Special Category Data\n\nHealth data under Art.9(2)(a) + DPA 2018 Sch.1 Part 1.' },
    { topic: 'data_subject_rights', keywords: ['data subject rights', 'right to access', 'subject access'], laws: ['UK GDPR Art.15-22'], severity: 'high', template: '## Your Rights\n\nAccess, rectification, erasure, restriction, portability, objection.' },
    { topic: 'international_transfer', keywords: ['international transfer', 'idta', 'addendum', 'uk extension'], laws: ['UK GDPR Art.44-49', 'IDTA'], severity: 'high', template: '## International Transfers\n\nIDTA or UK Addendum to EU SCCs for non-adequate countries.' },
    { topic: 'retention', keywords: ['retention period', 'storage limitation'], laws: ['UK GDPR Art.5(1)(e)'], severity: 'high', template: '## Retention\n\nCategory-specific retention schedule.' },
    { topic: 'security', keywords: ['security', 'art. 32', 'technical measures'], laws: ['UK GDPR Art.32'], severity: 'high', template: '## Security\n\nEncryption, access controls, regular testing.' },
    { topic: 'breach_notification', keywords: ['breach', '72 hours', 'art. 33'], laws: ['UK GDPR Art.33-34'], severity: 'high', template: '## Breach Notification\n\nICO notification within 72 hours.' },
    { topic: 'children', keywords: ['children', 'age', '13 years', 'age appropriate'], laws: ['DPA 2018 s.9', 'Age Appropriate Design Code'], severity: 'medium', template: '## Children\n\nMinimum age 13 (UK); Children\'s Code applied.' },
    { topic: 'cookies_pecr', keywords: ['cookies', 'pecr'], laws: ['PECR 2003'], severity: 'medium', template: '## Cookies (PECR)\n\nGranular consent; strictly-necessary exempt.', sourceDoc: 'uk-privacy-policy' },
    { topic: 'profiling', keywords: ['automated decision', 'profiling', 'art. 22'], laws: ['UK GDPR Art.22'], severity: 'medium', template: '## Automated Decisions\n\nMeaningful information about logic and right to human review.' },
    { topic: 'dpo', keywords: ['data protection officer', 'dpo'], laws: ['UK GDPR Art.37'], severity: 'medium', template: '## DPO\n\nDPO: [name]; dpo@hangel.org.' },
    { topic: 'marketing_consent', keywords: ['marketing', 'electronic marketing', 'pecr'], laws: ['PECR Reg.22'], severity: 'medium', template: '## Marketing\n\nOpt-in consent for electronic marketing; one-click unsubscribe.' },
    { topic: 'contact', keywords: ['contact', 'privacy@'], laws: ['UK GDPR Art.13'], severity: 'medium', template: '## Contact\n\nprivacy@hangel.org for data protection.' },
    { topic: 'changes', keywords: ['changes to', 'updates to'], laws: [], severity: 'low', template: '## Changes\n\nMaterial changes notified.' },
    { topic: 'governing_law', keywords: ['governing law', 'jurisdiction'], laws: ['DPA 2018'], severity: 'low', template: '## Governing Law\n\nLaws of England and Wales.' },
  ],

  'US-CA': [
    { topic: 'categories_collected', keywords: ['categories of personal information', 'categories we collect', 'identifiers'], laws: ['CCPA 1798.100', 'CPRA'], severity: 'high', template: '## Categories Collected\n\nIdentifiers, customer records, geolocation, sensitive personal information (health).', sourceDoc: 'us-california-privacy-notice' },
    { topic: 'sources', keywords: ['sources of personal information', 'sources we collect from'], laws: ['CCPA 1798.110'], severity: 'high', template: '## Sources\n\nDirectly from you, devices, service providers.' },
    { topic: 'business_purposes', keywords: ['business purpose', 'commercial purpose'], laws: ['CCPA 1798.140(d)', 'CCPA 1798.140(e)'], severity: 'high', template: '## Business Purposes\n\nService delivery, security, fraud detection, legal compliance.' },
    { topic: 'third_parties', keywords: ['third parties', 'service providers', 'sharing'], laws: ['CCPA 1798.115'], severity: 'high', template: '## Third Parties\n\nPayment processors, cloud hosting, analytics — limited by service-provider contracts.' },
    { topic: 'sale_or_share', keywords: ['sale of personal information', 'sharing for cross-context', 'do not sell'], laws: ['CCPA 1798.120', 'CPRA'], severity: 'high', template: '## Sale or Share\n\nWe do not sell or share personal information for cross-context behavioural advertising.' },
    { topic: 'right_to_know', keywords: ['right to know', 'right of access'], laws: ['CCPA 1798.110', 'CCPA 1798.115'], severity: 'high', template: '## Right to Know\n\nRequest categories, sources, purposes, recipients of your personal information.' },
    { topic: 'right_to_delete', keywords: ['right to delete', 'right of deletion'], laws: ['CCPA 1798.105'], severity: 'high', template: '## Right to Delete\n\nDelete personal information collected from you, subject to exceptions.' },
    { topic: 'right_to_correct', keywords: ['right to correct', 'correction'], laws: ['CPRA 1798.106'], severity: 'high', template: '## Right to Correct\n\nRequest correction of inaccurate personal information.' },
    { topic: 'right_to_opt_out', keywords: ['right to opt-out', 'opt out of sale', 'gpc', 'global privacy control'], laws: ['CCPA 1798.120', 'CPRA'], severity: 'high', template: '## Right to Opt-Out\n\nOpt-out link + Global Privacy Control signal honoured.' },
    { topic: 'sensitive_pi_limit', keywords: ['sensitive personal information', 'limit use of sensitive'], laws: ['CPRA 1798.121'], severity: 'high', template: '## Limit Use of Sensitive PI\n\nLink to limit use of sensitive personal information.' },
    { topic: 'retention_periods', keywords: ['retention period', 'how long we keep'], laws: ['CCPA 1798.100(a)(3)'], severity: 'high', template: '## Retention\n\nCategory-specific retention; criteria disclosed.' },
    { topic: 'minors', keywords: ['minors', 'children under 16', '13 years'], laws: ['CCPA 1798.120(c)', 'COPPA'], severity: 'high', template: '## Minors\n\nNo sale of PI of minors under 16 without affirmative consent.', sourceDoc: 'us-coppa-notice' },
    { topic: 'non_discrimination', keywords: ['non-discrimination', 'will not discriminate'], laws: ['CCPA 1798.125'], severity: 'medium', template: '## Non-Discrimination\n\nWe will not discriminate against you for exercising your rights.' },
    { topic: 'authorized_agent', keywords: ['authorized agent', 'verifiable consumer request'], laws: ['CCPA 1798.135'], severity: 'medium', template: '## Authorized Agents\n\nRequests via authorized agents accepted with written authorization.' },
    { topic: 'metrics_disclosure', keywords: ['metrics', 'requests received', 'response time'], laws: ['CCPA Regs §7102'], severity: 'low', template: '## Annual Metrics\n\nAnnual disclosure of requests received and median response time.' },
    { topic: 'contact', keywords: ['contact', 'privacy@', 'toll-free'], laws: ['CCPA 1798.130(a)(1)'], severity: 'medium', template: '## Contact\n\nprivacy@hangel.org; toll-free: [number].' },
    { topic: 'last_updated', keywords: ['last updated', 'effective date'], laws: ['CCPA Regs §7011'], severity: 'low', template: '## Last Updated\n\nReviewed annually; effective date disclosed.' },
    { topic: 'financial_incentive', keywords: ['financial incentive', 'price difference'], laws: ['CCPA 1798.125(b)'], severity: 'low', template: '## Financial Incentives\n\nNone offered.' },
  ],

  DE: [
    { topic: 'controller', keywords: ['verantwortlicher', 'controller'], laws: ['DSGVO Art.4(7)', 'BDSG §3'], severity: 'high', template: '## Verantwortlicher\n\nhangel — Kontakt: datenschutz@hangel.org.', sourceDoc: 'de-bdsg-supplement' },
    { topic: 'dpo', keywords: ['datenschutzbeauftragter', 'data protection officer'], laws: ['BDSG §38', 'DSGVO Art.37'], severity: 'high', template: '## Datenschutzbeauftragter\n\nDSB: [name], dpo@hangel.org. Pflicht ab 20 Beschäftigten.' },
    { topic: 'lawful_basis', keywords: ['rechtsgrundlage', 'art. 6', 'lawful basis'], laws: ['DSGVO Art.6'], severity: 'high', template: '## Rechtsgrundlage\n\nVertrag, Einwilligung, gesetzliche Verpflichtung, berechtigtes Interesse.' },
    { topic: 'employment_data', keywords: ['beschäftigungs', 'employee data', 'bdsg §26'], laws: ['BDSG §26'], severity: 'medium', template: '## Beschäftigtendatenschutz\n\nVerarbeitung nach BDSG §26.' },
    { topic: 'special_category', keywords: ['besondere kategorien', 'special category', 'art. 9'], laws: ['DSGVO Art.9', 'BDSG §22'], severity: 'high', template: '## Besondere Kategorien\n\nGesundheitsdaten (Blutgruppe) nach Art.9 Abs.2 lit.a + BDSG §22.' },
    { topic: 'data_subject_rights', keywords: ['betroffenenrechte', 'rights', 'art. 15'], laws: ['DSGVO Art.15-22'], severity: 'high', template: '## Ihre Rechte\n\nAuskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch.' },
    { topic: 'consent_withdrawal', keywords: ['widerruf', 'withdraw consent'], laws: ['DSGVO Art.7(3)'], severity: 'high', template: '## Widerruf der Einwilligung\n\nJederzeit widerruflich.' },
    { topic: 'international_transfer', keywords: ['drittland', 'international transfer', 'scc'], laws: ['DSGVO Art.44-49'], severity: 'high', template: '## Drittlandübermittlung\n\nNur unter Art.46 SCC oder Angemessenheitsbeschluss.' },
    { topic: 'retention', keywords: ['speicherdauer', 'aufbewahrungsfrist', 'retention'], laws: ['DSGVO Art.5(1)(e)', 'HGB §257'], severity: 'high', template: '## Speicherdauer\n\nKategoriespezifisch; handels-/steuerrechtliche Pflichten 6-10 Jahre.' },
    { topic: 'security', keywords: ['sicherheit', 'art. 32', 'technische und organisatorische'], laws: ['DSGVO Art.32', 'BDSG §64'], severity: 'high', template: '## Sicherheit\n\nVerschlüsselung, Zugriffskontrollen, Audit-Logs.' },
    { topic: 'breach_notification', keywords: ['datenpanne', 'breach', '72 stunden'], laws: ['DSGVO Art.33-34', 'BDSG §65'], severity: 'high', template: '## Datenpannen\n\nMeldung an Aufsichtsbehörde innerhalb 72 Stunden.' },
    { topic: 'supervisory_authority', keywords: ['aufsichtsbehörde', 'beschwerderecht'], laws: ['BDSG §40', 'DSGVO Art.77'], severity: 'high', template: '## Aufsichtsbehörde\n\nBeschwerderecht bei zuständiger Landes-Datenschutzbehörde.' },
    { topic: 'children', keywords: ['kinder', 'minderjährige', '16 jahren', 'art. 8'], laws: ['DSGVO Art.8'], severity: 'medium', template: '## Kinder\n\nMindestalter 16 Jahre in Deutschland.' },
    { topic: 'cookies', keywords: ['cookies', 'tracking', 'ttdsg'], laws: ['TTDSG §25', 'DSGVO'], severity: 'medium', template: '## Cookies (TTDSG)\n\nGranulare Einwilligung nach §25 TTDSG.' },
    { topic: 'profiling', keywords: ['profiling', 'automatisierte entscheidung', 'art. 22'], laws: ['DSGVO Art.22'], severity: 'medium', template: '## Profiling\n\nKeine ausschließlich automatisierten Entscheidungen.' },
    { topic: 'imprint', keywords: ['impressum', 'imprint'], laws: ['TMG §5', 'DDG'], severity: 'high', template: '## Impressum\n\nAnbieterkennzeichnung nach §5 DDG.' },
    { topic: 'contact', keywords: ['kontakt', 'contact', 'datenschutz@'], laws: ['DSGVO Art.13'], severity: 'medium', template: '## Kontakt\n\ndatenschutz@hangel.org.' },
    { topic: 'changes', keywords: ['änderungen', 'changes to'], laws: [], severity: 'low', template: '## Änderungen\n\nWesentliche Änderungen werden mitgeteilt.' },
  ],

  FR: [
    { topic: 'controller', keywords: ['responsable de traitement', 'data controller'], laws: ['RGPD Art.4(7)', 'Loi 78-17 Art.3'], severity: 'high', template: '## Responsable de Traitement\n\nhangel — contact: dpo@hangel.org.', sourceDoc: 'fr-loi-informatique-libertes' },
    { topic: 'dpo', keywords: ['délégué à la protection', 'dpo', 'data protection officer'], laws: ['RGPD Art.37', 'Loi 78-17'], severity: 'medium', template: '## Délégué à la Protection des Données\n\nDPO: [nom], dpo@hangel.org.' },
    { topic: 'lawful_basis', keywords: ['base légale', 'art. 6', 'lawful basis'], laws: ['RGPD Art.6'], severity: 'high', template: '## Base Légale\n\nContrat, consentement, obligation légale, intérêt légitime.' },
    { topic: 'special_category', keywords: ['catégories particulières', 'special category', 'art. 9', 'données de santé'], laws: ['RGPD Art.9', 'Loi 78-17 Art.6'], severity: 'high', template: '## Catégories Particulières\n\nDonnées de santé (groupe sanguin) sous Art.9.2.a consentement explicite.' },
    { topic: 'data_subject_rights', keywords: ['droits des personnes', 'droit d\'accès', 'art. 15'], laws: ['RGPD Art.15-22', 'Loi 78-17 Art.48'], severity: 'high', template: '## Vos Droits\n\nAccès, rectification, effacement, limitation, portabilité, opposition.' },
    { topic: 'consent_withdrawal', keywords: ['retrait du consentement', 'withdraw consent'], laws: ['RGPD Art.7(3)'], severity: 'high', template: '## Retrait du Consentement\n\nÀ tout moment via les paramètres du compte.' },
    { topic: 'international_transfer', keywords: ['transfert international', 'pays tiers'], laws: ['RGPD Art.44-49'], severity: 'high', template: '## Transferts Internationaux\n\nClauses contractuelles types (CCT) ou décision d\'adéquation.' },
    { topic: 'retention', keywords: ['durée de conservation', 'retention'], laws: ['RGPD Art.5(1)(e)'], severity: 'high', template: '## Durée de Conservation\n\nDurées spécifiques par catégorie.' },
    { topic: 'security', keywords: ['sécurité', 'art. 32', 'mesures techniques'], laws: ['RGPD Art.32'], severity: 'high', template: '## Sécurité\n\nChiffrement, contrôles d\'accès, journalisation.' },
    { topic: 'breach_notification', keywords: ['violation de données', 'breach', '72 heures'], laws: ['RGPD Art.33-34'], severity: 'high', template: '## Violations de Données\n\nNotification CNIL sous 72 heures.' },
    { topic: 'cnil', keywords: ['cnil', 'autorité de contrôle'], laws: ['Loi 78-17'], severity: 'high', template: '## CNIL\n\nDroit de réclamation auprès de la CNIL: cnil.fr.' },
    { topic: 'children', keywords: ['enfants', 'mineurs', '15 ans'], laws: ['RGPD Art.8', 'Loi 78-17 Art.45'], severity: 'medium', template: '## Mineurs\n\nÂge de consentement: 15 ans en France.' },
    { topic: 'cookies', keywords: ['cookies', 'traceurs', 'cnil recommandation'], laws: ['Loi 78-17 Art.82', 'CNIL Délibération 2020-091'], severity: 'medium', template: '## Cookies\n\nConsentement granulaire conforme aux lignes directrices CNIL.' },
    { topic: 'profiling', keywords: ['profilage', 'décision automatisée', 'art. 22'], laws: ['RGPD Art.22'], severity: 'medium', template: '## Profilage\n\nPas de décision uniquement automatisée à effet juridique.' },
    { topic: 'contact', keywords: ['contact', 'dpo@', 'délégué'], laws: ['RGPD Art.13'], severity: 'medium', template: '## Contact\n\ndpo@hangel.org.' },
    { topic: 'changes', keywords: ['modifications', 'mises à jour'], laws: [], severity: 'low', template: '## Modifications\n\nNotification des modifications importantes.' },
    { topic: 'health_data_hds', keywords: ['hds', 'hébergeur de données de santé'], laws: ['CSP L1111-8'], severity: 'medium', template: '## HDS\n\nHébergement données de santé via prestataire certifié HDS.' },
  ],

  ES: [
    { topic: 'controller', keywords: ['responsable del tratamiento', 'data controller'], laws: ['RGPD Art.4(7)', 'LOPDGDD Art.5'], severity: 'high', template: '## Responsable\n\nhangel — contacto: dpo@hangel.org.', sourceDoc: 'es-lopdgdd-supplement' },
    { topic: 'dpo', keywords: ['delegado de protección', 'dpd', 'data protection officer'], laws: ['LOPDGDD Art.34', 'RGPD Art.37'], severity: 'medium', template: '## Delegado de Protección de Datos\n\nDPD: [nombre], dpo@hangel.org.' },
    { topic: 'lawful_basis', keywords: ['base jurídica', 'base legal', 'art. 6'], laws: ['RGPD Art.6', 'LOPDGDD Art.6'], severity: 'high', template: '## Base Jurídica\n\nContrato, consentimiento, obligación legal, interés legítimo.' },
    { topic: 'special_category', keywords: ['categorías especiales', 'datos de salud', 'art. 9'], laws: ['RGPD Art.9', 'LOPDGDD Art.9'], severity: 'high', template: '## Categorías Especiales\n\nDatos de salud (grupo sanguíneo) bajo consentimiento explícito.' },
    { topic: 'data_subject_rights', keywords: ['derechos del interesado', 'derecho de acceso', 'art. 15'], laws: ['RGPD Art.15-22', 'LOPDGDD Art.13-18'], severity: 'high', template: '## Tus Derechos\n\nAcceso, rectificación, supresión, limitación, portabilidad, oposición.' },
    { topic: 'consent_withdrawal', keywords: ['retirar el consentimiento', 'revocación'], laws: ['RGPD Art.7(3)'], severity: 'high', template: '## Retirada del Consentimiento\n\nEn cualquier momento.' },
    { topic: 'international_transfer', keywords: ['transferencia internacional', 'país tercero'], laws: ['RGPD Art.44-49'], severity: 'high', template: '## Transferencias Internacionales\n\nCláusulas contractuales tipo o decisión de adecuación.' },
    { topic: 'retention', keywords: ['plazo de conservación', 'retention'], laws: ['RGPD Art.5(1)(e)', 'LOPDGDD Art.32'], severity: 'high', template: '## Conservación\n\nPlazos por categoría de datos.' },
    { topic: 'security', keywords: ['seguridad', 'art. 32', 'medidas técnicas'], laws: ['RGPD Art.32'], severity: 'high', template: '## Seguridad\n\nCifrado, controles de acceso, registros de auditoría.' },
    { topic: 'breach_notification', keywords: ['violación de datos', 'breach', '72 horas'], laws: ['RGPD Art.33-34'], severity: 'high', template: '## Brechas\n\nNotificación a la AEPD en 72 horas.' },
    { topic: 'aepd', keywords: ['aepd', 'agencia española'], laws: ['LOPDGDD'], severity: 'high', template: '## AEPD\n\nDerecho a reclamar ante la AEPD: aepd.es.' },
    { topic: 'children', keywords: ['menores', '14 años'], laws: ['LOPDGDD Art.7', 'RGPD Art.8'], severity: 'medium', template: '## Menores\n\nEdad mínima de consentimiento: 14 años en España.' },
    { topic: 'cookies', keywords: ['cookies', 'guía aepd'], laws: ['LSSI-CE Art.22', 'AEPD Guía Cookies'], severity: 'medium', template: '## Cookies\n\nConsentimiento granular siguiendo la Guía AEPD.' },
    { topic: 'profiling', keywords: ['perfilado', 'decisiones automatizadas'], laws: ['RGPD Art.22'], severity: 'medium', template: '## Perfilado\n\nDecisiones automatizadas reviewable por humano.' },
    { topic: 'digital_will', keywords: ['testamento digital', 'derecho al olvido'], laws: ['LOPDGDD Art.96'], severity: 'low', template: '## Testamento Digital\n\nDerechos post-mortem sobre datos personales.' },
    { topic: 'contact', keywords: ['contacto', 'dpo@'], laws: ['RGPD Art.13'], severity: 'medium', template: '## Contacto\n\ndpo@hangel.org.' },
    { topic: 'changes', keywords: ['cambios', 'modificaciones'], laws: [], severity: 'low', template: '## Cambios\n\nNotificación de cambios sustanciales.' },
  ],

  IT: [
    { topic: 'controller', keywords: ['titolare del trattamento', 'data controller'], laws: ['GDPR Art.4(7)', 'Codice Privacy Art.4'], severity: 'high', template: '## Titolare del Trattamento\n\nhangel — contatto: dpo@hangel.org.', sourceDoc: 'it-codice-privacy' },
    { topic: 'dpo', keywords: ['responsabile della protezione', 'rpd', 'dpo'], laws: ['GDPR Art.37'], severity: 'medium', template: '## RPD/DPO\n\nRPD: [nome], dpo@hangel.org.' },
    { topic: 'lawful_basis', keywords: ['base giuridica', 'art. 6'], laws: ['GDPR Art.6', 'Codice Privacy'], severity: 'high', template: '## Base Giuridica\n\nContratto, consenso, obbligo legale, legittimo interesse.' },
    { topic: 'special_category', keywords: ['categorie particolari', 'dati sanitari', 'art. 9'], laws: ['GDPR Art.9', 'Codice Privacy Art.2-sexies'], severity: 'high', template: '## Categorie Particolari\n\nDati sanitari (gruppo sanguigno) con consenso esplicito.' },
    { topic: 'data_subject_rights', keywords: ['diritti dell\'interessato', 'diritto di accesso', 'art. 15'], laws: ['GDPR Art.15-22'], severity: 'high', template: '## I Tuoi Diritti\n\nAccesso, rettifica, cancellazione, limitazione, portabilità, opposizione.' },
    { topic: 'consent_withdrawal', keywords: ['revoca del consenso', 'withdraw'], laws: ['GDPR Art.7(3)'], severity: 'high', template: '## Revoca del Consenso\n\nIn qualsiasi momento.' },
    { topic: 'international_transfer', keywords: ['trasferimento internazionale', 'paese terzo'], laws: ['GDPR Art.44-49'], severity: 'high', template: '## Trasferimenti Internazionali\n\nClausole contrattuali tipo o decisione di adeguatezza.' },
    { topic: 'retention', keywords: ['periodo di conservazione', 'retention'], laws: ['GDPR Art.5(1)(e)'], severity: 'high', template: '## Conservazione\n\nPeriodi specifici per categoria.' },
    { topic: 'security', keywords: ['sicurezza', 'art. 32', 'misure tecniche'], laws: ['GDPR Art.32'], severity: 'high', template: '## Sicurezza\n\nCifratura, controlli di accesso, audit log.' },
    { topic: 'breach_notification', keywords: ['violazione', 'breach', '72 ore'], laws: ['GDPR Art.33-34'], severity: 'high', template: '## Violazioni\n\nNotifica al Garante entro 72 ore.' },
    { topic: 'garante', keywords: ['garante', 'autorità di controllo'], laws: ['Codice Privacy Art.154'], severity: 'high', template: '## Garante\n\nDiritto di reclamo al Garante: garanteprivacy.it.' },
    { topic: 'children', keywords: ['minori', '14 anni'], laws: ['Codice Privacy Art.2-quinquies', 'GDPR Art.8'], severity: 'medium', template: '## Minori\n\nEtà del consenso: 14 anni in Italia.' },
    { topic: 'cookies', keywords: ['cookie', 'tracker', 'garante cookie'], laws: ['Garante Linee Guida Cookie 2021'], severity: 'medium', template: '## Cookie\n\nConsenso granulare secondo Linee Guida Garante 2021.' },
    { topic: 'profiling', keywords: ['profilazione', 'decisione automatizzata'], laws: ['GDPR Art.22'], severity: 'medium', template: '## Profilazione\n\nDecisioni automatizzate revisionabili da umano.' },
    { topic: 'contact', keywords: ['contatto', 'dpo@'], laws: ['GDPR Art.13'], severity: 'medium', template: '## Contatto\n\ndpo@hangel.org.' },
    { topic: 'changes', keywords: ['modifiche', 'aggiornamenti'], laws: [], severity: 'low', template: '## Modifiche\n\nNotifica di modifiche sostanziali.' },
    { topic: 'deceased_persons', keywords: ['persone decedute', 'deceduti'], laws: ['Codice Privacy Art.2-terdecies'], severity: 'low', template: '## Persone Decedute\n\nDiritti esercitabili dagli aventi causa.' },
  ],

  CA: [
    { topic: 'controller', keywords: ['organization', 'controller', 'accountable'], laws: ['PIPEDA Sch.1 4.1'], severity: 'high', template: '## Organization\n\nhangel — privacy officer: privacy@hangel.org.' },
    { topic: 'privacy_officer', keywords: ['privacy officer', 'chief privacy', 'accountable individual'], laws: ['PIPEDA 4.1.1'], severity: 'high', template: '## Privacy Officer\n\nDesignated privacy officer: [name], privacy@hangel.org.' },
    { topic: 'purposes', keywords: ['identifying purposes', 'purpose of collection'], laws: ['PIPEDA 4.2'], severity: 'high', template: '## Identifying Purposes\n\nPurposes identified at or before collection.' },
    { topic: 'consent', keywords: ['consent', 'meaningful consent', 'express consent'], laws: ['PIPEDA 4.3'], severity: 'high', template: '## Consent\n\nMeaningful, knowledge-based consent; opt-in for sensitive data.' },
    { topic: 'limiting_collection', keywords: ['limiting collection', 'minimum necessary'], laws: ['PIPEDA 4.4'], severity: 'high', template: '## Limiting Collection\n\nOnly what is necessary for identified purposes.' },
    { topic: 'limiting_use', keywords: ['limiting use', 'retention', 'disclosure'], laws: ['PIPEDA 4.5'], severity: 'high', template: '## Limiting Use, Disclosure, Retention\n\nUsed only for stated purposes; retained as long as necessary.' },
    { topic: 'accuracy', keywords: ['accuracy', 'accurate', 'up-to-date'], laws: ['PIPEDA 4.6'], severity: 'medium', template: '## Accuracy\n\nReasonable steps to keep information accurate.' },
    { topic: 'safeguards', keywords: ['safeguards', 'security', 'protection'], laws: ['PIPEDA 4.7'], severity: 'high', template: '## Safeguards\n\nPhysical, organizational, technological safeguards.' },
    { topic: 'openness', keywords: ['openness', 'transparency', 'readily available'], laws: ['PIPEDA 4.8'], severity: 'medium', template: '## Openness\n\nPolicies and practices made readily available.' },
    { topic: 'individual_access', keywords: ['access to personal information', 'individual access'], laws: ['PIPEDA 4.9'], severity: 'high', template: '## Individual Access\n\nAccess and challenge accuracy of personal information.' },
    { topic: 'challenging_compliance', keywords: ['challenging compliance', 'complaint procedure'], laws: ['PIPEDA 4.10'], severity: 'medium', template: '## Challenging Compliance\n\nComplaint procedure; escalation to OPC.' },
    { topic: 'opc_complaint', keywords: ['privacy commissioner', 'opc', 'office of the privacy'], laws: ['PIPEDA s.11'], severity: 'high', template: '## OPC Complaints\n\nRight to complain to Office of the Privacy Commissioner of Canada.' },
    { topic: 'breach_notification', keywords: ['breach of security safeguards', 'breach notification', 'real risk of significant harm'], laws: ['PIPEDA s.10.1', 'Breach of Security Safeguards Regs'], severity: 'high', template: '## Breach Notification\n\nNotification to OPC and individuals when real risk of significant harm.' },
    { topic: 'international_transfer', keywords: ['cross-border transfer', 'transfer outside canada'], laws: ['PIPEDA Sch.1 4.1.3'], severity: 'high', template: '## Cross-Border Transfers\n\nContractual safeguards for transfers outside Canada.' },
    { topic: 'children', keywords: ['children', 'minors', 'youth'], laws: ['OPC Guidance: Children'], severity: 'medium', template: '## Children\n\nAge-appropriate consent; parental consent for young children.' },
    { topic: 'quebec_law25', keywords: ['law 25', 'quebec', 'projet de loi 64'], laws: ['Quebec Law 25 / Bill 64'], severity: 'medium', template: '## Quebec (Law 25)\n\nSpecific rights for Quebec residents (privacy impact, mobility).' },
    { topic: 'cookies', keywords: ['cookies', 'tracking technologies'], laws: ['PIPEDA'], severity: 'low', template: '## Cookies\n\nConsent-based cookie management.' },
    { topic: 'changes', keywords: ['changes to', 'updates to'], laws: [], severity: 'low', template: '## Changes\n\nMaterial changes notified.' },
  ],

  AU: [
    { topic: 'controller', keywords: ['app entity', 'apps', 'organisation'], laws: ['Privacy Act 1988', 'APP 1'], severity: 'high', template: '## APP Entity\n\nhangel — privacy@hangel.org.' },
    { topic: 'app1_open_transparent', keywords: ['app 1', 'open and transparent', 'management of personal information'], laws: ['APP 1'], severity: 'high', template: '## APP 1\n\nOpen and transparent management of personal information.' },
    { topic: 'app3_collection', keywords: ['app 3', 'collection of solicited', 'reasonably necessary'], laws: ['APP 3'], severity: 'high', template: '## APP 3 — Collection\n\nReasonably necessary collection; sensitive info with consent.' },
    { topic: 'app5_notification', keywords: ['app 5', 'notification of collection', 'collection notice'], laws: ['APP 5'], severity: 'high', template: '## APP 5 — Notification\n\nNotification at or before collection.' },
    { topic: 'app6_use_disclosure', keywords: ['app 6', 'use or disclosure', 'primary purpose'], laws: ['APP 6'], severity: 'high', template: '## APP 6 — Use/Disclosure\n\nPrimary purpose use; secondary requires consent or exception.' },
    { topic: 'app7_direct_marketing', keywords: ['app 7', 'direct marketing', 'opt-out marketing'], laws: ['APP 7'], severity: 'medium', template: '## APP 7 — Direct Marketing\n\nOpt-out mechanism in every marketing communication.' },
    { topic: 'app8_cross_border', keywords: ['app 8', 'cross-border disclosure', 'overseas recipient'], laws: ['APP 8'], severity: 'high', template: '## APP 8 — Cross-Border\n\nReasonable steps to ensure overseas recipient compliance.' },
    { topic: 'app10_quality', keywords: ['app 10', 'quality of personal information', 'accurate'], laws: ['APP 10'], severity: 'medium', template: '## APP 10 — Quality\n\nAccurate, up-to-date, complete.' },
    { topic: 'app11_security', keywords: ['app 11', 'security of personal information'], laws: ['APP 11'], severity: 'high', template: '## APP 11 — Security\n\nReasonable steps to protect; destroy or de-identify when no longer needed.' },
    { topic: 'app12_access', keywords: ['app 12', 'access to personal information'], laws: ['APP 12'], severity: 'high', template: '## APP 12 — Access\n\nProvide access on request; limited refusal grounds.' },
    { topic: 'app13_correction', keywords: ['app 13', 'correction of personal information'], laws: ['APP 13'], severity: 'medium', template: '## APP 13 — Correction\n\nCorrect on request; associated statement if refused.' },
    { topic: 'sensitive_information', keywords: ['sensitive information', 'health information'], laws: ['Privacy Act s.6FA'], severity: 'high', template: '## Sensitive Information\n\nHealth/genetic/biometric — express consent.' },
    { topic: 'breach_notification', keywords: ['notifiable data breach', 'eligible data breach', 'ndb'], laws: ['Privacy Act Part IIIC', 'NDB Scheme'], severity: 'high', template: '## NDB Scheme\n\nNotification to OAIC and affected individuals when eligible breach.' },
    { topic: 'oaic_complaint', keywords: ['oaic', 'office of the australian information', 'commissioner'], laws: ['Privacy Act s.36'], severity: 'high', template: '## OAIC Complaints\n\nRight to complain to OAIC.' },
    { topic: 'children', keywords: ['children', 'capacity', 'parental consent'], laws: ['OAIC Children Guidance'], severity: 'medium', template: '## Children\n\nCapacity assessment; parental consent below threshold.' },
    { topic: 'cookies', keywords: ['cookies', 'tracking', 'online identifiers'], laws: ['Privacy Act'], severity: 'low', template: '## Cookies\n\nConsent for non-essential cookies.' },
    { topic: 'changes', keywords: ['changes to', 'updates to'], laws: [], severity: 'low', template: '## Changes\n\nMaterial changes notified.' },
  ],

  JP: [
    { topic: 'controller', keywords: ['事業者', 'business operator', 'controller'], laws: ['個人情報保護法 第16条', 'APPI Art.16'], severity: 'high', template: '## 事業者\n\nhangel — 連絡先: privacy@hangel.org.' },
    { topic: 'purpose_of_use', keywords: ['利用目的', 'purpose of use'], laws: ['APPI Art.17'], severity: 'high', template: '## 利用目的\n\n会員登録、緊急献血マッチング、寄付処理、法令遵守、セキュリティ.' },
    { topic: 'consent_special_care', keywords: ['要配慮個人情報', 'special care', 'sensitive'], laws: ['APPI Art.2(3)', 'APPI Art.17(2)'], severity: 'high', template: '## 要配慮個人情報\n\n血液型は要配慮個人情報として明示同意の下で取得.' },
    { topic: 'third_party_provision', keywords: ['第三者提供', 'third party provision', 'opt-out'], laws: ['APPI Art.27'], severity: 'high', template: '## 第三者提供\n\n明示同意またはオプトアウト届出.' },
    { topic: 'international_transfer', keywords: ['外国にある第三者', 'cross-border', 'foreign country'], laws: ['APPI Art.28', 'PPC Rules'], severity: 'high', template: '## 越境移転\n\n本人同意またはPPC基準の同等措置.' },
    { topic: 'data_subject_rights', keywords: ['開示請求', 'disclosure', '訂正', 'right to disclosure'], laws: ['APPI Art.33-35'], severity: 'high', template: '## 本人の権利\n\n開示、訂正、利用停止、第三者提供停止.' },
    { topic: 'retention', keywords: ['保有期間', 'retention period'], laws: ['APPI Art.22'], severity: 'medium', template: '## 保有期間\n\nカテゴリ別の保存期間.' },
    { topic: 'security_measures', keywords: ['安全管理措置', 'security measures'], laws: ['APPI Art.23'], severity: 'high', template: '## 安全管理措置\n\n組織的、人的、物理的、技術的安全管理措置.' },
    { topic: 'breach_notification', keywords: ['漏えい', 'breach', 'leak', '個人情報保護委員会'], laws: ['APPI Art.26', 'PPC Rules Art.7'], severity: 'high', template: '## 漏えい等の報告\n\nPPCへの速報3-5日、確報30日以内.' },
    { topic: 'ppc_complaint', keywords: ['個人情報保護委員会', 'ppc', 'personal information protection commission'], laws: ['APPI Art.131'], severity: 'high', template: '## PPCへの相談\n\n個人情報保護委員会への苦情申出.' },
    { topic: 'pseudonymization', keywords: ['仮名加工情報', 'pseudonymized', 'anonymized'], laws: ['APPI Art.41-42'], severity: 'medium', template: '## 仮名加工情報\n\n統計目的の仮名加工処理.' },
    { topic: 'children', keywords: ['未成年', 'children', '保護者'], laws: ['APPI Guideline'], severity: 'medium', template: '## 未成年者\n\n保護者の同意を取得.' },
    { topic: 'cookies', keywords: ['cookie', 'クッキー', 'tracking'], laws: ['APPI Art.31', 'Telecommunications Business Act'], severity: 'medium', template: '## Cookie\n\n利用目的明示と同意取得.' },
    { topic: 'contact', keywords: ['お問い合わせ', 'contact', 'privacy@'], laws: ['APPI Art.32'], severity: 'medium', template: '## お問い合わせ\n\nprivacy@hangel.org.' },
    { topic: 'changes', keywords: ['変更', 'updates'], laws: [], severity: 'low', template: '## 変更\n\n重要な変更は通知.' },
    { topic: 'joint_use', keywords: ['共同利用', 'joint use'], laws: ['APPI Art.27(5)'], severity: 'low', template: '## 共同利用\n\n該当する場合のみ詳細を公表.' },
  ],

  BR: [
    { topic: 'controller', keywords: ['controlador', 'data controller'], laws: ['LGPD Art.5(VI)'], severity: 'high', template: '## Controlador\n\nhangel — contato: dpo@hangel.org.' },
    { topic: 'dpo_encarregado', keywords: ['encarregado', 'dpo', 'data protection officer'], laws: ['LGPD Art.41'], severity: 'high', template: '## Encarregado\n\nEncarregado: [nome], dpo@hangel.org.' },
    { topic: 'lawful_basis', keywords: ['hipóteses legais', 'base legal', 'art. 7'], laws: ['LGPD Art.7', 'LGPD Art.11'], severity: 'high', template: '## Bases Legais\n\nConsentimento, execução de contrato, obrigação legal, legítimo interesse.' },
    { topic: 'sensitive_data', keywords: ['dados sensíveis', 'dado sensível', 'art. 11'], laws: ['LGPD Art.11'], severity: 'high', template: '## Dados Sensíveis\n\nTipo sanguíneo tratado com consentimento específico.' },
    { topic: 'data_subject_rights', keywords: ['direitos do titular', 'art. 18'], laws: ['LGPD Art.18'], severity: 'high', template: '## Direitos do Titular\n\nAcesso, correção, anonimização, portabilidade, eliminação, revogação.' },
    { topic: 'consent_withdrawal', keywords: ['revogação do consentimento'], laws: ['LGPD Art.8(5)'], severity: 'high', template: '## Revogação do Consentimento\n\nA qualquer momento via configurações.' },
    { topic: 'international_transfer', keywords: ['transferência internacional', 'art. 33'], laws: ['LGPD Art.33-36'], severity: 'high', template: '## Transferência Internacional\n\nPaís adequado ou cláusulas-padrão aprovadas pela ANPD.' },
    { topic: 'retention', keywords: ['período de retenção', 'retenção'], laws: ['LGPD Art.15'], severity: 'high', template: '## Retenção\n\nPeríodos específicos por categoria.' },
    { topic: 'security', keywords: ['segurança', 'art. 46'], laws: ['LGPD Art.46-49'], severity: 'high', template: '## Segurança\n\nMedidas técnicas e administrativas adequadas.' },
    { topic: 'breach_notification', keywords: ['incidente de segurança', 'comunicação à anpd', 'breach'], laws: ['LGPD Art.48'], severity: 'high', template: '## Incidentes\n\nComunicação à ANPD em prazo razoável.' },
    { topic: 'anpd', keywords: ['anpd', 'autoridade nacional'], laws: ['LGPD Art.55'], severity: 'high', template: '## ANPD\n\nDireito de reclamar à Autoridade Nacional de Proteção de Dados.' },
    { topic: 'children', keywords: ['crianças', 'adolescentes', 'menor'], laws: ['LGPD Art.14'], severity: 'high', template: '## Crianças e Adolescentes\n\nConsentimento específico de pelo menos um dos pais.' },
    { topic: 'public_health', keywords: ['saúde pública', 'tutela da saúde'], laws: ['LGPD Art.11(II)(f)'], severity: 'medium', template: '## Saúde Pública\n\nTratamento para tutela da saúde por profissionais.' },
    { topic: 'cookies', keywords: ['cookies', 'rastreadores'], laws: ['LGPD Art.7', 'Marco Civil'], severity: 'medium', template: '## Cookies\n\nConsentimento granular conforme orientação da ANPD.' },
    { topic: 'automated_decision', keywords: ['decisões automatizadas', 'art. 20'], laws: ['LGPD Art.20'], severity: 'medium', template: '## Decisões Automatizadas\n\nDireito à revisão por pessoa natural.' },
    { topic: 'contact', keywords: ['contato', 'dpo@'], laws: ['LGPD Art.9'], severity: 'medium', template: '## Contato\n\ndpo@hangel.org.' },
    { topic: 'changes', keywords: ['alterações', 'atualizações'], laws: [], severity: 'low', template: '## Alterações\n\nNotificação de mudanças relevantes.' },
  ],
};

/**
 * Markdown'u başlık bölümlerine ayır. Her bölüm: heading text + altındaki
 * gövde (sonraki başlığa kadar). H1 (`#`) atlanır (genelde belge başlığıdır);
 * H2+ (`##`, `###` …) bölüm olarak sayılır.
 */
interface MarkdownSection {
  heading: string;
  body: string;
}

function splitMarkdownSections(md: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];
  const lines = md.split(/\r?\n/);
  let currentHeading: string | null = null;
  let currentBody: string[] = [];

  const flush = () => {
    if (currentHeading !== null) {
      sections.push({ heading: currentHeading, body: currentBody.join('\n') });
    }
    currentHeading = null;
    currentBody = [];
  };

  for (const line of lines) {
    const h = /^(#{2,6})\s+(.*)$/.exec(line);
    if (h) {
      flush();
      currentHeading = h[2].trim();
      continue;
    }
    if (currentHeading !== null) currentBody.push(line);
  }
  flush();
  return sections;
}

/** İçeriği lowercase + normalize ederek case-insensitive arama yapar. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ');
}

function topicMatches(topic: RequiredTopic, normalizedContent: string): boolean {
  for (const kw of topic.keywords) {
    if (normalizedContent.includes(kw.toLowerCase())) return true;
  }
  return false;
}

/**
 * Hangi bölüm hangi topic'i karşıladığını döner. Bir bölüm birden fazla
 * topic'i karşılayabilir; bir topic en az 1 bölüm tarafından karşılandığında
 * "compliant" sayılır.
 */
function mapSectionsToTopics(sections: MarkdownSection[], topics: RequiredTopic[]): {
  compliantSections: CompliantSection[];
  matchedTopicIds: Set<string>;
} {
  const compliantBySection = new Map<string, Set<string>>();
  const matchedTopicIds = new Set<string>();

  for (const section of sections) {
    const sectionBlob = normalize(`${section.heading}\n${section.body}`);
    for (const topic of topics) {
      if (topicMatches(topic, sectionBlob)) {
        matchedTopicIds.add(topic.topic);
        const laws = compliantBySection.get(section.heading) ?? new Set<string>();
        for (const l of topic.laws) laws.add(l);
        compliantBySection.set(section.heading, laws);
      }
    }
  }

  const compliantSections: CompliantSection[] = [];
  compliantBySection.forEach((laws, heading) => {
    compliantSections.push({ heading, matchedLaws: Array.from(laws).sort() });
  });
  compliantSections.sort((a, b) => a.heading.localeCompare(b.heading));

  return { compliantSections, matchedTopicIds };
}

function buildSuggestion(topic: RequiredTopic): ComplianceSuggestion {
  const out: ComplianceSuggestion = {
    topic: topic.topic,
    sourceText: topic.template,
  };
  if (topic.sourceDoc) out.sourceDoc = topic.sourceDoc;
  return out;
}

/**
 * Bir contract markdown içeriğini ve hedef jurisdiction'ı alıp deterministik
 * ComplianceScore üretir. LLM yok, network yok, saf fonksiyon.
 *
 * @param contractSlug Firestore contracts/{slug} doc id.
 * @param markdown Contract markdown gövdesi (front matter stripped olabilir).
 * @param jurisdiction Hedef ülke kodu.
 * @param now Test edilebilirlik için inject edilebilir timestamp.
 */
export function scoreContract(
  contractSlug: string,
  markdown: string,
  jurisdiction: ComplianceJurisdiction,
  now: Date = new Date(),
): ComplianceScore {
  const topics = REQUIRED_TOPICS[jurisdiction];
  const sections = splitMarkdownSections(markdown);

  // Doc-level fallback: bazı kısa contract'larda heading yok (paragraph-only).
  // Bu durumda tüm body'i tek bir pseudo-section gibi tara.
  const sectionsForMatch: MarkdownSection[] = sections.length > 0
    ? sections
    : [{ heading: 'Document Body', body: markdown }];

  const { compliantSections, matchedTopicIds } = mapSectionsToTopics(sectionsForMatch, topics);

  const missingSections: MissingSection[] = [];
  const suggestions: ComplianceSuggestion[] = [];
  for (const topic of topics) {
    if (!matchedTopicIds.has(topic.topic)) {
      missingSections.push({
        topic: topic.topic,
        requiredLaws: topic.laws.slice(),
        severity: topic.severity,
      });
      suggestions.push(buildSuggestion(topic));
    }
  }
  // Severity sıralama: high → medium → low.
  const sevOrder: Record<ComplianceSeverity, number> = { high: 0, medium: 1, low: 2 };
  missingSections.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity] || a.topic.localeCompare(b.topic));

  const total = topics.length;
  const matched = matchedTopicIds.size;
  const score = total === 0 ? 0 : Math.round((matched / total) * 100);

  return {
    contractSlug,
    jurisdiction,
    score,
    compliantSections,
    missingSections,
    suggestions,
    lastScoredAt: now.toISOString(),
  };
}

/** Tek bir contract'ı tüm jurisdiction'lar için scorelar. */
export function scoreContractAllJurisdictions(
  contractSlug: string,
  markdown: string,
  now: Date = new Date(),
): ComplianceScore[] {
  return COMPLIANCE_JURISDICTIONS.map(j => scoreContract(contractSlug, markdown, j, now));
}

/** Topic kataloğunu admin UI / test için döner. (Tip-safe, mutate edilemez.) */
export function getRequiredTopicsFor(jurisdiction: ComplianceJurisdiction): ReadonlyArray<Readonly<RequiredTopic>> {
  return REQUIRED_TOPICS[jurisdiction];
}

/**
 * Tüm jurisdiction'lar için ham `RequiredTopic` kataloğunu dışa açar.
 * Migration script'leri (örn. `scripts/contracts-fill-templates.mjs`) topic
 * `template` alanını okuyup eksik bölümleri contract markdown'una eklemek için
 * kullanır. Bu export saf veridir — mutasyon önerilmez.
 */
export const REQUIRED_TOPICS_EXPORT = REQUIRED_TOPICS;
