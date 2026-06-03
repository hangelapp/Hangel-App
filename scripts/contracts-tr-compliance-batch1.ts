/**
 * scripts/contracts-tr-compliance-batch1.ts
 *
 * Ajan 3/10 — Batch 1: temel sözleşme/politika dökümanlarını (20 adet) %100 TR
 * mevzuat uyumlu hâle getirir. Çalışma alanı `contracts` koleksiyonu (Firestore).
 *
 * Görev kapsamı (BU LİSTE DIŞINDA HİÇBİR DOC GÜNCELLENMEZ — A4/A5 çakışma):
 *   - kvkk-aydinlatma-metni
 *   - kullanici-sozlesmesi
 *   - kurulus-sozlesmesi
 *   - marka-uyelik
 *   - stk-uyelik
 *   - ogrenci-kulup
 *   - seffaflik
 *   - kullanici-haklari-politikasi
 *   - cerez-politikasi
 *   - aydinlatma-metni-saglik-verisi      (yoksa oluştur)
 *   - pazarlama-acik-rizasi               (yoksa oluştur)
 *   - bagisci-sozlesmesi                  (yoksa oluştur)
 *   - gonullu-sozlesmesi                  (alias: gonulluluk-sozlesmesi)
 *   - surdurulebi-li-r-sosyal-fayda-i-s-bi-rli-gi-sozlesmesi (yoksa oluştur)
 *   - iso-27001-uyum-beyani
 *   - whistleblower-politikasi
 *   - kar-dagitim-politikasi
 *   - ucret-politikasi
 *   - kurumsal-risk-ve-uyum-komitesi-beyani
 *   - risk-yonetimi-ve-kriz-mudahale-politikasi
 *
 * Her doc için:
 *   - Mevcut Firestore content okunur (yoksa seed contractsData fallback)
 *   - Mevzuat referansları madde numaralarıyla eklenir (6698 KVKK, 5253, 5737,
 *     6098 TBK, 6502 TKHK, 6563 EHK, 5651, 5237 TCK, 193 GVK, 2860, vs.)
 *   - "Hangel" → "hangel" (gösterilen metinlerde lowercase)
 *   - status: 'taslak' KORUNUR (üst notu DRAFT kalır)
 *   - version: '2.0-tr', effectiveDate: '2026-06-03', jurisdictions: ['TR']
 *   - Mevcut slug/group/kind/targetGroups DEĞİŞMEZ
 *
 * Kullanım:
 *   # Dry-run (ilk 3 doc'un diff özetini gösterir)
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/macbookair/new-app/.firebase-service-account.json \
 *     npx tsx scripts/contracts-tr-compliance-batch1.ts --dry-run
 *
 *   # Apply (Firestore batch write — 20 doc tek commit)
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/macbookair/new-app/.firebase-service-account.json \
 *     npx tsx scripts/contracts-tr-compliance-batch1.ts --apply
 *
 * Exit codes:
 *   0  success
 *   1  any error (env, admin SDK, write failure)
 */

import { initializeApp, applicationDefault, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

// ---------- bootstrap ----------

function initAdmin(): void {
  if (getApps().length > 0) return;
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath && fs.existsSync(credsPath)) {
    const sa = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  const local = path.join(process.cwd(), '.firebase-service-account.json');
  if (fs.existsSync(local)) {
    const sa = JSON.parse(fs.readFileSync(local, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  initializeApp({ credential: applicationDefault() });
}

// ---------- içerik üretici yardımcıları ----------

/** Çıktı metinlerinde "Hangel" → "hangel". Teknik identifier'lar etkilenmez. */
function lowerHangel(s: string): string {
  return s.replace(/Hangel/g, 'hangel');
}

const EFFECTIVE_DATE = '2026-06-03';
const NEW_VERSION = '2.0-tr';
const DRAFT_BANNER = `<p><em>⚠️ Taslak — yürürlük tarihi: ${EFFECTIVE_DATE}. Bu metin hangel hukuk komitesi tarafından inceleme aşamasındadır; yayın onayı öncesi nihai metin değildir.</em></p>`;

/**
 * Tüm metinlerde ortak görünen "Hukuki Dayanak" referans listesi. Madde numaraları
 * Türk mevzuatından birebir alınmıştır.
 */
const TR_LEGISLATION_REFS: Record<string, string> = {
  kvkk: '6698 sayılı Kişisel Verilerin Korunması Kanunu (md.4, 5, 6, 10, 11, 12)',
  dernekler: '5253 sayılı Dernekler Kanunu (md.22, 25, 26) ve Dernekler Yönetmeliği',
  vakiflar: '5737 sayılı Vakıflar Kanunu (md.25, 26) ve Vakıflar Yönetmeliği',
  yardimToplama: '2860 sayılı Yardım Toplama Kanunu (md.6, 7, 8, 22) ve Yardım Toplama Esas ve Usulleri Hakkında Yönetmelik',
  tbk: '6098 sayılı Türk Borçlar Kanunu (md.20-25 genel işlem koşulları, md.49 vd.)',
  tkhk: '6502 sayılı Tüketicinin Korunması Hakkında Kanun (md.4, 48-Mesafeli Sözleşmeler Yönetmeliği)',
  ehk: '6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun (md.5, 6, 7, 11) ve Ticari İletişim Yönetmeliği',
  cyber5651: '5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Kanunu (md.4, 5, 8, 9)',
  tck: '5237 sayılı Türk Ceza Kanunu (md.135-140 kişisel veri suçları, md.243-245 bilişim suçları)',
  gvk: '193 sayılı Gelir Vergisi Kanunu (md.89/4, 89/10 bağış indirimi)',
  kvk: '5520 sayılı Kurumlar Vergisi Kanunu (md.10/1-c, 10/1-ç bağış ve yardımlar)',
  ttk: '6102 sayılı Türk Ticaret Kanunu (md.18, 39, 519, 522)',
  iskanun: '4857 sayılı İş Kanunu (md.5 eşit davranma, md.32 ücret)',
  isig: '6331 sayılı İş Sağlığı ve Güvenliği Kanunu',
  saglik3359: '3359 sayılı Sağlık Hizmetleri Temel Kanunu ve 663 sayılı KHK',
  kgm: 'Kişisel Sağlık Verileri Hakkında Yönetmelik (R.G. 21.06.2019/30808)',
  kvkkKurul: 'KVKK Kurul Kararları: 2018/10 (Yeterli Önlemler), 2019/78 (Aydınlatma Yükümlülüğü Tebliği)',
  cookie: 'Elektronik Haberleşme Sektöründe Kişisel Verilerin İşlenmesi ve Gizliliğin Korunması Hakkında Yönetmelik',
  whistle: '6362 sayılı Sermaye Piyasası Kanunu md.94 ve 5018 sayılı Kanun md.71; ISO 37002:2021 İhbar Yönetim Sistemi',
  risk: 'COSO ERM 2017, ISO 31000:2018 Risk Yönetimi, AFAD Türkiye Afet Müdahale Planı (TAMP)',
  iso27001: 'ISO/IEC 27001:2022 Bilgi Güvenliği Yönetim Sistemi, ISO/IEC 27701:2019 Gizlilik Eki, KVKK Kurul 2018/10 Yeterli Önlemler',
  kvkBag: '5520 sayılı KVK md.10/1-c (kamu yararına çalışan dernek/vakıflara bağış indirimi)',
};

/**
 * Standart "Hukuki Dayanak" bloğu — her doc'un ## başlığı olarak basılır.
 */
function legalBlock(refs: string[]): string {
  const items = refs.map(k => `<li>${TR_LEGISLATION_REFS[k] ?? k}</li>`).join('');
  return `
      <h4>Hukuki Dayanak ve Uyum Çerçevesi</h4>
      <ul>${items}</ul>
      <p>İşbu metin Türkiye Cumhuriyeti yargı yetkisinde ve Türk mevzuatına uygun olarak hazırlanmıştır.</p>`;
}

/** Standart kapanış: yetkili mahkeme + yürürlük + iletişim. */
function closingBlock(): string {
  return `
      <h4>Yetkili Mahkeme ve İletişim</h4>
      <p>İşbu metinden doğacak uyuşmazlıklarda İstanbul Merkez (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir. Kullanıcılar, KVKK md.11 kapsamındaki taleplerini <strong>kvkk@hangel.org</strong> adresine veya Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'de belirtilen yollarla iletebilir.</p>
      <h4>Yürürlük ve Versiyon</h4>
      <p>Versiyon: <strong>${NEW_VERSION}</strong> — Yürürlük: <strong>${EFFECTIVE_DATE}</strong>. Önceki sürüm ile maddi (major) değişiklik içeren güncellemelerde kullanıcılar yeniden onaya çağrılır.</p>`;
}

// ---------- 20 doc için TR-uyumlu içerik ----------

interface ContractBuilder {
  slug: string;
  title: string;
  group?: string;
  kind: 'contract' | 'policy';
  approvalType: 'acik-riza' | 'onay' | 'bilgilendirme';
  riskLevel: 'dusuk' | 'orta' | 'yuksek' | 'kritik';
  targetGroups: string[];
  legislationRefs: string[];
  body: string; // İçerik gövdesi (DRAFT banner ve closing dışında)
}

const BUILDERS: ContractBuilder[] = [
  // 1
  {
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    group: 'Gizlilik ve Veri Koruma',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'kritik',
    targetGroups: ['individual', 'ngo', 'brand', 'club'],
    legislationRefs: ['kvkk', 'kvkkKurul', 'cyber5651', 'tck'],
    body: `
      <h3>KVKK Aydınlatma Metni</h3>
      <h4>1. Veri Sorumlusunun Kimliği</h4>
      <p>Veri sorumlusu sıfatıyla hangel A.Ş. ("hangel"), Mersis No: [doldurulacak], adresi [doldurulacak], 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") md.10 ve "Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ" hükümlerine uygun olarak işbu aydınlatma metnini sunar.</p>
      <h4>2. İşlenen Kişisel Veri Kategorileri</h4>
      <ul>
        <li><strong>Kimlik:</strong> ad, soyad, TCKN/pasaport, doğum tarihi</li>
        <li><strong>İletişim:</strong> e-posta, telefon (E.164), adres</li>
        <li><strong>Müşteri İşlem:</strong> bağış, gönüllülük, kampanya başvuru kayıtları</li>
        <li><strong>İşlem Güvenliği:</strong> IP, log, oturum, cihaz parmak izi</li>
        <li><strong>Pazarlama:</strong> ayrı açık rıza kapsamında profil, segment, tercih verisi</li>
        <li><strong>Özel Nitelikli Veriler (md.6):</strong> sağlık verisi yalnızca ayrı yazılı açık rıza ile (ör. afet/yardım kampanyası başvurusunda)</li>
      </ul>
      <h4>3. İşleme Amaçları</h4>
      <p>KVKK md.4 ilkeleri (hukuka uygunluk, doğruluk, belirli ve meşru amaç, ölçülülük, sınırlı saklama) çerçevesinde; üyelik, hizmet sunumu, bağış-aktarım operasyonu, gönüllü eşleştirme, güvenlik, yasal yükümlülüklerin (5651, 213 VUK, 6493 ÖHK) yerine getirilmesi.</p>
      <h4>4. Hukuki Sebepler (KVKK md.5/6)</h4>
      <ul>
        <li>Sözleşmenin kurulması/ifası (md.5/2-c)</li>
        <li>Hukuki yükümlülük (md.5/2-ç) — 5651, 213 VUK</li>
        <li>Meşru menfaat (md.5/2-f) — dolandırıcılık önleme, ağ güvenliği</li>
        <li>Açık rıza (md.5/1, md.6/3) — pazarlama, sağlık verisi, yurt dışı aktarım</li>
      </ul>
      <h4>5. Aktarım (md.8, md.9)</h4>
      <p>Yurt içinde: bağış tahsilat sağlayıcısı (PCI-DSS uyumlu), bulut altyapısı (Türkiye lokasyonu öncelikli), bağımsız denetçi, yetkili kamu kurumları (talep hâlinde). Yurt dışına aktarım, KVKK md.9 kapsamında Kurul'un belirlediği yeterli korumalı ülkelere veya ayrı açık rıza/standart sözleşme zırhıyla yapılır.</p>
      <h4>6. Toplama Yöntemi ve Saklama Süresi</h4>
      <p>Veriler; web/mobil arayüz, API, e-posta ve çağrı kanalları üzerinden otomatik veya kısmen otomatik yollarla toplanır. KVKK md.7 ve "Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hâle Getirilmesi Hakkında Yönetmelik" uyarınca Saklama ve İmha Politikamızda tanımlı süreler sonunda imha edilir (genel kural: hukuki ilişki sonundan itibaren azami 10 yıl, log verisi 5651 md.5 uyarınca 2 yıl).</p>
      <h4>7. İlgili Kişi Hakları (md.11)</h4>
      <p>Veri sahibi; veri işlenip işlenmediğini öğrenme, bilgi talep etme, amaç dışı kullanılmadığını öğrenme, aktarıldığı tarafları bilme, eksik/yanlış işlenenleri düzelttirme, silme/yok etme, otomatik analiz sonucuna itiraz, zararın giderilmesini talep haklarına sahiptir. Talepler <strong>kvkk@hangel.org</strong> veya yazılı başvuru ile iletilir; 30 gün içinde ücretsiz sonuçlandırılır (Kurul tarifesi saklıdır).</p>${legalBlock(['kvkk', 'kvkkKurul', 'cyber5651', 'tck'])}`,
  },
  // 2
  {
    slug: 'kullanici-sozlesmesi',
    title: 'Kullanıcı Sözleşmesi',
    group: 'Ana Sözleşmeler',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'yuksek',
    targetGroups: ['individual'],
    legislationRefs: ['tbk', 'tkhk', 'ehk', 'cyber5651', 'kvkk', 'tck'],
    body: `
      <h3>Kullanıcı Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>İşbu sözleşme; hangel platformunu işleten <strong>hangel A.Ş.</strong> ("hangel") ile platforma bireysel kullanıcı sıfatıyla kayıt olan veya ziyaret eden gerçek kişi ("kullanıcı") arasında akdedilmiştir.</p>
      <h4>2. Konu ve Kapsam</h4>
      <p>Sözleşme; hangel platformunun sunduğu dijital hizmetlerin (üyelik, bağış, gönüllülük, kampanya takip, mesajlaşma) kullanım koşullarını, tarafların hak ve yükümlülüklerini düzenler. 6098 sayılı TBK md.20-25 anlamında genel işlem koşulu niteliğindedir; bağlayıcılığı için kullanıcının elektronik onayı alınır.</p>
      <h4>3. Hizmet Tanımı</h4>
      <p>hangel, 6563 sayılı EHK md.2/d kapsamında <strong>aracı hizmet sağlayıcı</strong> sıfatıyla içerik barındırır; ilan/kampanya içeriklerinin doğruluğundan ilan veren STK/marka/kulüp sorumludur. 5651 md.5 hükmü saklıdır.</p>
      <h4>4. Kullanıcı Yükümlülükleri</h4>
      <ul>
        <li>Hesap güvenliği (parola, MFA) kullanıcı sorumluluğundadır; kimlik bilgilerini üçüncü kişiyle paylaşamaz.</li>
        <li>5237 sayılı TCK md.125-127 (hakaret), md.135-140 (kişisel veri suçları), md.243-245 (bilişim suçları) kapsamında suç teşkil edebilecek içerik üretemez.</li>
        <li>5651 md.4 kapsamında hak ihlaline neden olan içeriği "uyar-kaldır" usulüne göre kaldırılması için talepte bulunabilir.</li>
        <li>Hizmeti dürüstlük kuralına (TMK md.2) ve sözleşmenin amacına uygun kullanır.</li>
      </ul>
      <h4>5. Hangel'in Hakları</h4>
      <p>hangel; hizmet kalitesini koruma, mevzuata aykırılık veya sözleşme ihlali tespiti hâlinde hesabı geçici/ kalıcı askıya alma, içerikleri 5651 ve 6563 çerçevesinde kaldırma hakkını saklı tutar.</p>
      <h4>6. Sorumluluk Sınırı</h4>
      <p>hangel; 6563 md.9 ve 5651 md.5 kapsamında aracı hizmet sağlayıcı olarak içeriği kontrol yükümlülüğünde değildir. Doğrudan hangel kusurundan kaynaklanmayan zararlardan TBK md.115 sınırları içinde sorumlu değildir.</p>
      <h4>7. Cayma Hakkı ve Tüketici Hakları</h4>
      <p>6502 sayılı TKHK md.48 ve Mesafeli Sözleşmeler Yönetmeliği md.15 uyarınca dijital içerik niteliğindeki hizmet derhal ifa edildiğinden cayma hakkı kapsam dışındadır; bağış işlemleri için Bağışçı Sözleşmesi hükümleri uygulanır.</p>
      <h4>8. Fesih</h4>
      <p>Kullanıcı, hesabını dilediği zaman silebilir. hangel; haklı sebebin varlığında (TBK md.435) sözleşmeyi derhal feshedebilir. Fesih sonrası KVKK md.7 saklama yükümlülüğü saklı kalmak üzere veriler imha edilir.</p>${legalBlock(['tbk', 'tkhk', 'ehk', 'cyber5651', 'kvkk', 'tck'])}`,
  },
  // 3
  {
    slug: 'kurulus-sozlesmesi',
    title: 'Kuruluş Sözleşmesi',
    group: 'Ana Sözleşmeler',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'yuksek',
    targetGroups: ['ngo', 'brand', 'club'],
    legislationRefs: ['dernekler', 'vakiflar', 'ttk', 'yardimToplama', 'kvkk'],
    body: `
      <h3>Kuruluş Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>İşbu sözleşme; hangel A.Ş. ile platforma tüzel kişi (dernek/vakıf/şirket/kooperatif/öğrenci kulübü) sıfatıyla kayıt olan ve yetkili temsilci tarafından elektronik onayı verilen kuruluş ("Kuruluş") arasında akdedilmiştir.</p>
      <h4>2. Kapsam</h4>
      <p>Kuruluşların hangel ekosistemindeki kurumsal temsil, veri paylaşımı, kampanya ve bağış aktarım faaliyetlerinin esaslarını düzenler.</p>
      <h4>3. Tüzel Kişilik Doğrulama</h4>
      <ul>
        <li>Dernekler: 5253 md.22 kapsamında DERBİS kaydı zorunlu</li>
        <li>Vakıflar: 5737 md.25-26 ve Vakıflar Genel Müdürlüğü kaydı</li>
        <li>Şirketler/Kooperatifler: 6102 TTK md.39 ticaret sicil ve Mersis</li>
        <li>Öğrenci kulüpleri: bağlı bulunduğu üniversite/İl Millî Eğitim onayı</li>
      </ul>
      <h4>4. Kuruluş Yükümlülükleri</h4>
      <p>Kuruluş; kendisine ilişkin sicil bilgilerinin doğruluğunu, faaliyetlerinin tabi olduğu mevzuata (Dernekler/Vakıflar/TTK) uygunluğunu, 2860 sayılı Yardım Toplama Kanunu kapsamında izin gerektiren yardım kampanyalarında ilgili mülki amir izninin alınmış olduğunu taahhüt eder.</p>
      <h4>5. Veri Sorumluluğu</h4>
      <p>Kuruluş ve hangel, KVKK md.3/ı uyarınca <strong>ortak veri sorumlusu</strong> sıfatıyla hareket eder. Veri işleme amacı/araçlarına ilişkin sorumluluk paylaşımı ek protokolde belirlenir.</p>
      <h4>6. Şeffaflık ve Raporlama</h4>
      <p>Kuruluş, hangel'in Şeffaflık Endeksi'ne dahil olarak yıllık faaliyet raporu ve bağış kullanım raporunu süresinde teslim eder.</p>
      <h4>7. Fesih ve Askıya Alma</h4>
      <p>Mevzuata aykırılık, kuruluş ehliyetinin kaybı (5253 md.36 kapatılma) veya hangel kurallarının ihlali hâlinde üyelik derhal sonlandırılır.</p>${legalBlock(['dernekler', 'vakiflar', 'ttk', 'yardimToplama', 'kvkk'])}`,
  },
  // 4
  {
    slug: 'marka-uyelik',
    title: 'Marka Üyelik Sözleşmesi',
    group: 'Kuruluş Tipine Özel Üyelikler',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'yuksek',
    targetGroups: ['brand'],
    legislationRefs: ['ttk', 'tkhk', 'ehk', 'cyber5651', 'kvkk', 'tck'],
    body: `
      <h3>Marka Üyelik Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>hangel A.Ş. ile platforma marka/şirket/kooperatif/sosyal işletme sıfatıyla başvuran tüzel kişi arasında akdedilmiştir.</p>
      <h4>2. Hizmet Kapsamı</h4>
      <p>Marka vitrini, kampanya yayını, affiliate tracking, bağış aktarım yönetimi. 6563 sayılı EHK md.5-6 kapsamında ticari elektronik ileti gönderiminde alıcının önceden onayı (İYS kaydı) zorunludur.</p>
      <h4>3. Marka Yükümlülükleri</h4>
      <ul>
        <li>6102 TTK kapsamında geçerli ticaret sicil, vergi numarası, IBAN ve Mersis bilgilerinin doğruluğu</li>
        <li>Ürün/hizmet sunumunda 6502 TKHK md.4 (ön bilgilendirme) ve md.61 (haksız ticari uygulamalar yasağı)</li>
        <li>Marka/patent ihlali içermeyen içerik (6769 sayılı Sınai Mülkiyet Kanunu)</li>
        <li>Bağış oranı taahhüdüne sadakat — aksi 6098 TBK md.49 vd. haksız fiil sorumluluğu doğurur</li>
      </ul>
      <h4>4. Komisyon ve Ödeme</h4>
      <p>Tahsil edilen bağış payları PCI-DSS uyumlu ödeme kuruluşu (6493 sayılı ÖHK lisanslı) aracılığıyla, ek protokolde belirlenen periyot ve komisyon yapısıyla aktarılır. Fatura/dekontlar 213 sayılı VUK md.229 vd. çerçevesinde düzenlenir.</p>
      <h4>5. Fikri Mülkiyet</h4>
      <p>Marka, logosunun hangel tarafından kampanya görünürlüğünde kullanılmasına izin verir; tersine, hangel marka materyallerini izinsiz kullanılamaz (5846 sayılı FSEK).</p>
      <h4>6. Fesih</h4>
      <p>30 gün önceden yazılı bildirimle fesih. Haklı sebep (TBK md.435) hâlinde derhal fesih.</p>${legalBlock(['ttk', 'tkhk', 'ehk', 'cyber5651', 'kvkk', 'tck'])}`,
  },
  // 5
  {
    slug: 'stk-uyelik',
    title: 'STK Üyelik Sözleşmesi',
    group: 'Kuruluş Tipine Özel Üyelikler',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'yuksek',
    targetGroups: ['ngo'],
    legislationRefs: ['dernekler', 'vakiflar', 'yardimToplama', 'kvk', 'gvk', 'kvkk'],
    body: `
      <h3>STK Üyelik Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>hangel A.Ş. ile platforma 5253 sayılı Dernekler Kanunu veya 5737 sayılı Vakıflar Kanunu kapsamında kurulmuş sivil toplum kuruluşu olarak üye olan tüzel kişi arasında akdedilmiştir.</p>
      <h4>2. Hizmet Kapsamı</h4>
      <p>Kurumsal profil, kampanya yayını, gönüllü çağrısı, bağış toplama, etki raporlama. Bağış toplama 2860 sayılı Yardım Toplama Kanunu md.6 kapsamında izne tabi ise STK gerekli izni bizzat alır.</p>
      <h4>3. STK Yükümlülükleri</h4>
      <ul>
        <li>5253 md.22 uyarınca DERBİS/Vakıflar G.M. kayıtlarının güncelliği</li>
        <li>5253 md.25 ve 5737 md.26 uyarınca yıllık beyanname ve denetim zorunluluğu</li>
        <li>Toplanan bağışların beyan edilen amaca uygun kullanımı (2860 md.22 — aksi suç)</li>
        <li>Kamu yararına çalışan dernek/vakıf statüsündeyse bağışçılara 193 GVK md.89/4 ve 5520 KVK md.10/1-c uyarınca makbuz düzenleme</li>
      </ul>
      <h4>4. Veri Ortaklığı</h4>
      <p>STK ve hangel, KVKK md.3 uyarınca <strong>ortak veri sorumlusu</strong>dur. Bağışçı/gönüllü verilerinin işleme amacı/araç sorumluluğu ek protokolde paylaşılır.</p>
      <h4>5. Fesih</h4>
      <p>30 gün önceden yazılı bildirimle fesih. 5253 md.36 kapsamında kapatılma kararı verilen STK'nın üyeliği derhal sonlandırılır.</p>${legalBlock(['dernekler', 'vakiflar', 'yardimToplama', 'kvk', 'gvk', 'kvkk'])}`,
  },
  // 6
  {
    slug: 'ogrenci-kulup',
    title: 'Öğrenci Kulüp Sözleşmesi',
    group: 'Kuruluş Tipine Özel Üyelikler',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'orta',
    targetGroups: ['club'],
    legislationRefs: ['dernekler', 'yardimToplama', 'kvkk'],
    body: `
      <h3>Öğrenci Kulüp Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>hangel A.Ş. ile bağlı bulunduğu üniversite (2547 sayılı YÖK Kanunu) veya İl Millî Eğitim Müdürlüğü (Millî Eğitim Bakanlığı Sosyal Etkinlikler Yönetmeliği) tarafından tanınmış öğrenci kulübü arasında akdedilmiştir.</p>
      <h4>2. Hizmet Kapsamı</h4>
      <p>Etkinlik yayını, gönüllü çağrısı, kampüs içi/dışı kampanya, duyuru paneli. 18 yaş altı üye varsa veli/vasi açık rızası (KVKK md.5/1 ve 5395 sayılı Çocuk Koruma Kanunu md.4) zorunludur.</p>
      <h4>3. Kulüp Yükümlülükleri</h4>
      <ul>
        <li>Üniversite/İl M.E.M. yönetmeliklerine uygun faaliyet</li>
        <li>2860 sayılı Yardım Toplama Kanunu md.6 izin alma — kampüs dışı bağış kampanyası için</li>
        <li>Etkinlik organizasyonunda 6331 sayılı İSG Kanunu ve genel güvenlik tedbirleri</li>
      </ul>
      <h4>4. Sorumluluk Sınırı</h4>
      <p>hangel, kulüp etkinliğinde meydana gelen üçüncü taraf zararlarından TBK md.66 vd. çerçevesinde doğrudan sorumlu değildir; sorumluluk organizatör kulüp ve bağlı kurum üzerindedir.</p>
      <h4>5. Fesih</h4>
      <p>Kulübün bağlı kurumla ilişkisinin kesilmesi veya 30 gün önceden yazılı bildirim ile fesih.</p>${legalBlock(['dernekler', 'yardimToplama', 'kvkk'])}`,
  },
  // 7
  {
    slug: 'seffaflik',
    title: 'Şeffaflık Endeksi Esasları',
    group: 'Kurumsal Yönetişim',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'orta',
    targetGroups: ['ngo', 'brand', 'club'],
    legislationRefs: ['dernekler', 'vakiflar', 'yardimToplama', 'ttk'],
    body: `
      <h3>Şeffaflık Endeksi Esasları</h3>
      <h4>1. Amaç</h4>
      <p>hangel ekosistemindeki kuruluşların kamuoyu ile paylaşacağı şeffaflık verilerinin standartlarını belirleyerek bağışçı ve gönüllü güvenini ölçülebilir biçimde desteklemek.</p>
      <h4>2. Kapsam</h4>
      <p>Tüm STK, marka ve kulüp üyelerinin finansal şeffaflık, yönetişim, etki ölçümü ve veri paylaşım süreçleri.</p>
      <h4>3. Endeks Bileşenleri</h4>
      <ul>
        <li>Finansal raporlama düzeyi (5253 md.25 / 5737 md.26 beyannameleri + IFRS for SMEs uyumu)</li>
        <li>Yönetim kurulu yapısı ve karar süreçleri (6102 TTK md.359 vd. analojisi)</li>
        <li>Bağış kullanımının izlenebilirliği (2860 md.22 amaca uygun kullanım)</li>
        <li>Etki ölçüm metodolojisi (SROI, Theory of Change)</li>
        <li>Bağımsız denetim uyumu (660 sayılı KGK düzenlemeleri)</li>
      </ul>
      <h4>4. Kuruluş Yükümlülükleri</h4>
      <p>Endekse dahil kuruluşlar yıllık faaliyet/mali tablo/etki verilerini paylaşmayı; anonimleştirilmiş özetlerin kamuoyu ile yayımlanmasına KVKK md.28/1-c (kamuya açık veri istisnası) çerçevesinde onay vermeyi kabul eder.</p>
      <h4>5. Skorlama ve İtiraz</h4>
      <p>hangel periyodik skor verir; kuruluşlar 30 gün içinde itiraz edebilir. İtirazlar bağımsız değerlendirme komitesince incelenir. İtiraz sürecinde 6098 TBK md.2 dürüstlük kuralı esas alınır.</p>${legalBlock(['dernekler', 'vakiflar', 'yardimToplama', 'ttk'])}`,
  },
  // 8
  {
    slug: 'kullanici-haklari-politikasi',
    title: 'Kullanıcı Hakları Politikası',
    group: 'Gizlilik ve Veri Koruma',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'yuksek',
    targetGroups: ['individual', 'ngo', 'brand', 'club'],
    legislationRefs: ['kvkk', 'kvkkKurul', 'tkhk'],
    body: `
      <h3>Kullanıcı Hakları Politikası</h3>
      <h4>1. Amaç</h4>
      <p>KVKK md.11'de tanımlanan ilgili kişi haklarının hangel platformunda nasıl kullanılacağını ve hangel'in başvuru süreçlerini düzenlemek.</p>
      <h4>2. Tanınan Haklar (KVKK md.11)</h4>
      <ul>
        <li>Kişisel verisinin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
        <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme</li>
        <li>Eksik/yanlış işlenmesi hâlinde düzeltilmesini isteme</li>
        <li>Md.7'de öngörülen şartlarla silinme/yok edilmesini isteme</li>
        <li>Düzeltme/silme/yok etmenin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
        <li>Münhasıran otomatik analiz sonucu aleyhine doğan sonuca itiraz</li>
        <li>Kanuna aykırı işleme sebebiyle zararın giderilmesini talep</li>
      </ul>
      <h4>3. Başvuru Yöntemi</h4>
      <p>"Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ" (R.G. 10.03.2018) md.5 uyarınca; ad-soyad, TCKN, adres/e-posta, talep konusu içeren başvuru <strong>kvkk@hangel.org</strong> adresine veya yazılı/noter/KEP yoluyla iletilir.</p>
      <h4>4. Yanıt Süresi</h4>
      <p>KVKK md.13 — talep tarihinden itibaren en geç <strong>30 gün</strong> içinde ücretsiz yanıt. İşlemin ayrıca bir maliyet gerektirmesi hâlinde Kurulca belirlenen tarifedeki ücret alınır.</p>
      <h4>5. Reddedilen veya Yanıtlanmayan Talepler</h4>
      <p>Kullanıcı, yanıttan tatmin olmazsa veya 30 gün içinde yanıt alamazsa KVKK md.14 uyarınca <strong>60 gün</strong> içinde Kişisel Verileri Koruma Kurulu'na şikâyet edebilir.</p>${legalBlock(['kvkk', 'kvkkKurul', 'tkhk'])}`,
  },
  // 9
  {
    slug: 'cerez-politikasi',
    title: 'Çerez Politikası',
    group: 'Gizlilik ve Veri Koruma',
    kind: 'policy',
    approvalType: 'acik-riza',
    riskLevel: 'orta',
    targetGroups: ['individual', 'ngo', 'brand', 'club'],
    legislationRefs: ['kvkk', 'cookie', 'cyber5651'],
    body: `
      <h3>Çerez Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in web/mobil arayüzlerinde kullanılan çerez (cookie) ve benzeri izleme teknolojilerinin türlerini, amaçlarını ve kullanıcı tercih mekanizmalarını açıklamaktır.</p>
      <h4>2. Hukuki Dayanak</h4>
      <p>KVKK md.5 (hukuki sebepler), Elektronik Haberleşme Sektöründe Kişisel Verilerin İşlenmesi ve Gizliliğin Korunması Hakkında Yönetmelik (R.G. 04.12.2020) md.6-7, KVKK Kurul 2020/482 sayılı karar.</p>
      <h4>3. Çerez Kategorileri</h4>
      <ul>
        <li><strong>Zorunlu (Strictly Necessary):</strong> oturum, güvenlik, CSRF — hukuki dayanak: meşru menfaat (md.5/2-f). Açık rıza aranmaz.</li>
        <li><strong>Tercih (Functional):</strong> dil, tema, erişilebilirlik. Açık rıza gerekir.</li>
        <li><strong>Performans/Analitik:</strong> Google Analytics (IP anonimleştirilmiş), Firebase Performance. Açık rıza.</li>
        <li><strong>Pazarlama/Hedefleme:</strong> 6563 EHK md.6 kapsamında ayrı açık rıza.</li>
      </ul>
      <h4>4. Tercih Yönetimi</h4>
      <p>İlk girişte CMP (Consent Management Platform) banner'ı sunulur. Kullanıcı her kategori için ayrı ayrı izin verebilir/reddebilir; "Tümünü Reddet" seçeneği "Tümünü Kabul Et" ile aynı görünürlükte ve aynı tıkla sunulur (KVKK Kurul 2022/1183).</p>
      <h4>5. Saklama Süreleri</h4>
      <p>Oturum çerezleri tarayıcı kapatıldığında silinir; kalıcı çerezler kategoriye göre 1 ay–13 ay arasında saklanır. Üçüncü taraf çerez politikaları ilgili sağlayıcının metinlerine tabidir.</p>
      <h4>6. Üçüncü Taraf Çerezleri</h4>
      <p>Google (Analytics, reCAPTCHA), Meta Pixel (pazarlama rızası varsa), Sentry (hata izleme — meşru menfaat). Üçüncü taraflar veri işleyici sıfatıyla DPA'larla sözleşmelidir.</p>${legalBlock(['kvkk', 'cookie', 'cyber5651'])}`,
  },
  // 10
  {
    slug: 'aydinlatma-metni-saglik-verisi',
    title: 'Sağlık Verisi İşlenmesine İlişkin Aydınlatma ve Açık Rıza Metni',
    group: 'Gizlilik ve Veri Koruma',
    kind: 'policy',
    approvalType: 'acik-riza',
    riskLevel: 'kritik',
    targetGroups: ['individual', 'ngo'],
    legislationRefs: ['kvkk', 'kgm', 'saglik3359', 'kvkkKurul'],
    body: `
      <h3>Sağlık Verisi Aydınlatma ve Açık Rıza Metni</h3>
      <h4>1. Veri Sorumlusu</h4>
      <p>hangel A.Ş. — KVKK md.6 anlamında özel nitelikli kişisel veri kategorisinde yer alan sağlık verisinin işlenmesi için işbu ayrı yazılı açık rıza talep edilmektedir.</p>
      <h4>2. İşlenen Sağlık Verisi</h4>
      <ul>
        <li>Engellilik/kronik hastalık durumu (gönüllülük başvurusunda uygun rol eşleştirme amacıyla)</li>
        <li>Acil durumlar için kan grubu/alerji (kullanıcı açık rıza ile beyan ederse)</li>
        <li>Afet/yardım kampanyalarında ihtiyaç tipi (tıbbi malzeme talebi)</li>
      </ul>
      <h4>3. İşleme Amacı</h4>
      <p>Yardım/gönüllülük eşleştirme, afet müdahale operasyonları, KVKK md.6/3 uyarınca açık rızaya dayalı hizmet sunumu. Sağlık Bakanlığı 3359 sayılı Kanun kapsamında yetkili kurumla veri paylaşımı kullanıcı izniyle yapılır.</p>
      <h4>4. Hukuki Sebep</h4>
      <p>KVKK md.6/2 — kanunlarda öngörülen hâller dışında işleme yasak; md.6/3 — açık rıza temel hukuki sebeptir. Sağlık verisi sağlık hizmeti sunumu amacı dışında işlenecekse Kurul'un belirlediği "yeterli önlemler" (2018/10 sayılı karar) uygulanır.</p>
      <h4>5. Aktarım</h4>
      <p>Sağlık verisi <strong>yurt dışına aktarılmaz</strong>; Türkiye'de KVKK uyumlu sunucularda saklanır. Sağlık Bakanlığı, AFAD, Kızılay gibi yetkili kurumlara yalnızca afet/acil durumda ve kullanıcı izniyle aktarılır.</p>
      <h4>6. Saklama Süresi</h4>
      <p>Kişisel Sağlık Verileri Hakkında Yönetmelik md.6 uyarınca işleme amacının ortadan kalkmasını takiben 1 yıl içinde imha veya anonimleştirme.</p>
      <h4>7. Açık Rıza Beyanı</h4>
      <p>"Yukarıda belirtilen sağlık verilerimin, açıklanan amaçlarla ve hukuki sebeplerle hangel tarafından işlenmesine, aktarılmasına ve belirtilen süre boyunca saklanmasına KVKK md.6/3 kapsamında <strong>açık rızam</strong> ile onay veriyorum. Bu rızayı dilediğim zaman <strong>kvkk@hangel.org</strong> üzerinden geri çekebileceğimi biliyorum."</p>${legalBlock(['kvkk', 'kgm', 'saglik3359', 'kvkkKurul'])}`,
  },
  // 11
  {
    slug: 'pazarlama-acik-rizasi',
    title: 'Pazarlama İletişimi Açık Rıza Metni',
    group: 'Gizlilik ve Veri Koruma',
    kind: 'policy',
    approvalType: 'acik-riza',
    riskLevel: 'orta',
    targetGroups: ['individual'],
    legislationRefs: ['kvkk', 'ehk', 'kvkkKurul'],
    body: `
      <h3>Pazarlama İletişimi Açık Rıza Metni</h3>
      <h4>1. Amaç</h4>
      <p>hangel tarafından gönderilecek ticari elektronik ileti (SMS, e-posta, push, çağrı) ve profilleme tabanlı pazarlama faaliyetleri için 6563 sayılı EHK md.6 ve KVKK md.5/1 kapsamında ayrı açık rıza alınması.</p>
      <h4>2. İşlenecek Veri</h4>
      <p>İletişim bilgileri, segment/profil etiketleri, kampanya etkileşim geçmişi, çerez tabanlı pazarlama tercihi.</p>
      <h4>3. Gönderim Mecraları ve İYS</h4>
      <p>Ticari elektronik ileti, "İleti Yönetim Sistemi" (İYS) üzerinden alınan onaya dayalı olarak gönderilir; alıcı, dilediği an İYS üzerinden veya iletideki "ret" linkiyle (EHK md.9) onayını çekebilir. Ret süresi <strong>3 iş günü</strong> içinde gönderim durdurulur.</p>
      <h4>4. Profilleme</h4>
      <p>Bağış/gönüllülük geçmişine dayalı kişiselleştirilmiş kampanya önerisi münhasıran otomatik karar değildir; kullanıcı her zaman insan değerlendirmesi talep edebilir (KVKK md.11/1-g).</p>
      <h4>5. Açık Rıza Beyanı</h4>
      <p>"hangel'in beni ticari kampanyalar, kişiselleştirilmiş öneriler ve duyurular hakkında SMS / e-posta / push / çağrı kanallarıyla bilgilendirmesine ve bu amaçla pazarlama profilim oluşturulmasına <strong>açık rıza</strong> veriyorum. Rızamı İYS ya da <strong>kvkk@hangel.org</strong> üzerinden geri çekebileceğimi biliyorum."</p>${legalBlock(['kvkk', 'ehk', 'kvkkKurul'])}`,
  },
  // 12
  {
    slug: 'bagisci-sozlesmesi',
    title: 'Bağışçı Sözleşmesi',
    group: 'Bağış ve Sosyal Fayda',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'yuksek',
    targetGroups: ['individual', 'brand'],
    legislationRefs: ['tbk', 'tkhk', 'yardimToplama', 'gvk', 'kvk', 'kvkk'],
    body: `
      <h3>Bağışçı Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>hangel A.Ş. ile platform üzerinden bağış yapan gerçek/tüzel kişi ("Bağışçı") arasında akdedilmiştir. hangel, bağış işleminde 6493 sayılı ÖHK lisanslı ödeme kuruluşu ve ilgili STK arasında <strong>aracı</strong> olarak hareket eder.</p>
      <h4>2. Bağışın Niteliği</h4>
      <p>Bağış, 6098 TBK md.285 vd. anlamında ivazsız kazandırmadır. Bağış işlemi tamamlandıktan sonra cayma hakkı bulunmamaktadır (6502 TKHK md.15/g — bedeli finansal piyasalardaki dalgalanmalara bağlı hizmetler ve ifa edilmiş hizmetler).</p>
      <h4>3. Bağışçı Yükümlülükleri</h4>
      <ul>
        <li>Beyan ettiği kimlik/ödeme bilgilerinin doğruluğu</li>
        <li>Suç gelirleri aklama veya terörün finansmanı amaçlı işlem yapmama (5549 sayılı Kanun, MASAK rehberleri)</li>
        <li>Üçüncü kişiye ait ödeme aracını yetkisiz kullanmama</li>
      </ul>
      <h4>4. hangel Yükümlülükleri</h4>
      <p>Bağışın hedeflenen STK/kampanyaya, ek protokolde belirlenen periyot ve şeffaflık raporu eşliğinde aktarılması; bağışçıya işlem makbuzu/dekontu sunulması; talep hâlinde 193 GVK md.89/4 veya 5520 KVK md.10/1-c kapsamında STK'nın makbuzunun temin edilmesinde yardımcı olunması.</p>
      <h4>5. İade Politikası</h4>
      <p>Hatalı/mükerrer/yetkisiz işlem hâlinde iade talebi 14 gün içinde <strong>destek@hangel.org</strong> üzerinden iletilir; meşru talepler 10 iş günü içinde ödeme kuruluşu üzerinden iade edilir.</p>
      <h4>6. Veri İşleme</h4>
      <p>Bağışçı verisi KVKK Aydınlatma Metni ve Pazarlama Açık Rıza Metni esaslarına tabidir.</p>${legalBlock(['tbk', 'tkhk', 'yardimToplama', 'gvk', 'kvk', 'kvkk'])}`,
  },
  // 13 — alias: mevcut Firestore slug "gonulluluk-sozlesmesi"
  {
    slug: 'gonulluluk-sozlesmesi',
    title: 'Gönüllülük Sözleşmesi',
    group: 'Ana Sözleşmeler',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'orta',
    targetGroups: ['individual'],
    legislationRefs: ['tbk', 'iskanun', 'isig', 'kvkk'],
    body: `
      <h3>Gönüllülük Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>hangel A.Ş. ile platform üzerinden gönüllülük faaliyetine başvuran ve kabul edilen gerçek kişi ("Gönüllü") ile faaliyeti yürüten Kuruluş arasında üçlü ilişkiyi düzenler.</p>
      <h4>2. Gönüllülüğün Niteliği</h4>
      <p>Faaliyet 4857 sayılı İş Kanunu md.8 anlamında iş ilişkisi <strong>doğurmaz</strong>; ivazsız, gönüllülük esaslıdır. Bununla birlikte, yapılan iş için Gönüllüye sağlanan masraf karşılığı (yol, yemek) ücret niteliği taşımaz.</p>
      <h4>3. Gönüllü Yükümlülükleri</h4>
      <ul>
        <li>Faaliyet alanında 6331 sayılı İSG Kanunu kapsamında alınmış güvenlik tedbirlerine uyma</li>
        <li>Kuruluş tarafından sağlanan oryantasyon ve eğitime katılma</li>
        <li>Faaliyet sırasında öğrendiği kişisel/gizli bilgileri 6698 KVKK ve TCK md.135-138 kapsamında gizli tutma</li>
        <li>18 yaş altı gönüllüler için veli/vasi açık rızası (5395 sayılı ÇKK md.4)</li>
      </ul>
      <h4>4. Kuruluş Yükümlülükleri</h4>
      <p>Güvenli çalışma ortamı, oryantasyon, gerekli ekipman/sigorta kapsamı (özellikle saha faaliyetlerinde ferdi kaza sigortası önerilir), gönüllü emeğinin onurlu biçimde tanınması ve sertifika/teşekkür belgesi sağlanması.</p>
      <h4>5. Fesih</h4>
      <p>Gönüllü, herhangi bir tazminat doğurmaksızın faaliyetten çekilebilir. Kuruluş, kural ihlali hâlinde gönüllü görevini sonlandırabilir.</p>
      <h4>6. Sorumluluk</h4>
      <p>Gönüllünün kasıt veya ağır kusuruyla üçüncü kişilere verdiği zararlardan 6098 TBK md.49 vd. çerçevesinde Gönüllü sorumludur; hafif kusurda Kuruluşun sorumluluğu öncelikli değerlendirilir.</p>${legalBlock(['tbk', 'iskanun', 'isig', 'kvkk'])}`,
  },
  // 14
  {
    slug: 'surdurulebi-li-r-sosyal-fayda-i-s-bi-rli-gi-sozlesmesi',
    title: 'Sürdürülebilir Sosyal Fayda İş Birliği Sözleşmesi',
    group: 'Kurumsal İş Birlikleri',
    kind: 'contract',
    approvalType: 'onay',
    riskLevel: 'yuksek',
    targetGroups: ['ngo', 'brand'],
    legislationRefs: ['tbk', 'ttk', 'kvkk', 'kvk'],
    body: `
      <h3>Sürdürülebilir Sosyal Fayda İş Birliği Sözleşmesi</h3>
      <h4>1. Taraflar</h4>
      <p>hangel A.Ş., bir veya birden çok STK ve sürdürülebilirlik/ESG taahhüdü taşıyan kurumsal Marka arasında akdedilmiş üçlü iş birliği çerçeve sözleşmesidir.</p>
      <h4>2. Konu</h4>
      <p>BM Sürdürülebilir Kalkınma Amaçları (SDG) ve AB Kurumsal Sürdürülebilirlik Raporlama Direktifi (CSRD) ile uyumlu, ölçülebilir sosyal fayda projelerinin tasarımı, yürütülmesi ve raporlanması.</p>
      <h4>3. Yükümlülükler</h4>
      <ul>
        <li>Marka: 5520 KVK md.10/1-c kapsamında kamu yararına çalışan dernek/vakfa bağış indirimi; ESG raporlarında projenin şeffaf açıklanması (greenwashing yasağı — 6502 TKHK md.61).</li>
        <li>STK: bağışın amaca uygun kullanımı (2860 md.22), SROI bazlı etki raporu</li>
        <li>hangel: ölçümleme altyapısı, üçüncü taraf doğrulaması, taraflar arası güvene dayalı veri akışının KVKK md.8-9 uyumlu yönetimi</li>
      </ul>
      <h4>4. Mali Akış</h4>
      <p>Bağış aktarımı ek protokolde tanımlanan periyot, komisyon ve şeffaflık raporu eşliğinde yapılır.</p>
      <h4>5. Süre ve Fesih</h4>
      <p>Proje süresi taraflarca belirlenir; haklı sebep (TBK md.435) hâlinde derhal fesih. Fesih sonrası toplanan bağışın aktarımı tamamlanır.</p>
      <h4>6. Uyuşmazlık</h4>
      <p>Tahkim opsiyonel — ICC veya ISTAC kuralları çerçevesinde, aksi takdirde İstanbul Mahkemeleri yetkilidir.</p>${legalBlock(['tbk', 'ttk', 'kvkk', 'kvk'])}`,
  },
  // 15
  {
    slug: 'iso-27001-uyum-beyani',
    title: 'ISO/IEC 27001 Uyum Beyanı',
    group: 'Sertifikasyon ve Standartlar',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'yuksek',
    targetGroups: ['ngo', 'brand', 'club', 'individual'],
    legislationRefs: ['iso27001', 'kvkk', 'cyber5651'],
    body: `
      <h3>ISO/IEC 27001 Uyum Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in bilgi varlıklarının gizliliğini, bütünlüğünü ve erişilebilirliğini ISO/IEC 27001:2022 ve ISO/IEC 27701:2019 standartları çerçevesinde korumayı taahhüt etmek.</p>
      <h4>2. Kapsam</h4>
      <p>Tüm dijital altyapı (web, mobil, API, veri tabanı), tedarikçi yönetimi, personel operasyonu ve fiziki güvenlik kontrolleri.</p>
      <h4>3. KVKK ile Bağlantı</h4>
      <p>KVKK Kurulu'nun 2018/10 sayılı "Yeterli Önlemler" kararında talep edilen idari ve teknik tedbirler ISO 27001 Annex A kontrolleri ile birebir eşleştirilir; uyumsuzluk gap analizine konu edilir.</p>
      <h4>4. Temel Kontroller</h4>
      <ul>
        <li>A.5 Bilgi güvenliği politikaları — yıllık gözden geçirme</li>
        <li>A.8 Varlık yönetimi — sınıflandırma + sahiplik</li>
        <li>A.9 Erişim kontrolü — en az yetki + MFA</li>
        <li>A.12 Operasyon güvenliği — change management, log yönetimi (5651 md.5 ile uyumlu)</li>
        <li>A.16 Olay yönetimi — KVKK md.12/5 (72 saat içinde Kurul'a ihlal bildirimi)</li>
        <li>A.17 İş sürekliliği — ISO 22301 entegrasyonu</li>
      </ul>
      <h4>5. Denetim</h4>
      <p>Yılda bir iç denetim, iki yılda bir akredite kuruluş tarafından dış denetim. Bulgular CAPA sürecine alınır.</p>${legalBlock(['iso27001', 'kvkk', 'cyber5651'])}`,
  },
  // 16
  {
    slug: 'whistleblower-politikasi',
    title: 'İhbar (Whistleblower) Politikası',
    group: 'Etik ve Uyum',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'yuksek',
    targetGroups: ['individual', 'ngo', 'brand', 'club'],
    legislationRefs: ['whistle', 'tck', 'kvkk', 'iskanun'],
    body: `
      <h3>İhbar (Whistleblower) Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel ekosisteminde yolsuzluk, kötüye kullanım, ayrımcılık, mevzuata aykırılık veya etik kural ihlali şüphesinin güvenli ve gizli kanaldan bildirilmesini sağlamak; ISO 37002:2021 İhbar Yönetim Sistemi standardına uyumu deklare etmek.</p>
      <h4>2. Kapsam</h4>
      <p>hangel çalışanları, gönüllüleri, üye STK/marka/kulüpleri, bağışçıları ve üçüncü taraf tedarikçileri.</p>
      <h4>3. Bildirim Kanalları</h4>
      <ul>
        <li>E-posta: <strong>ihbar@hangel.org</strong> (sadece Etik Komite erişebilir)</li>
        <li>Web formu (anonim seçenekli) — uçtan uca şifreli</li>
        <li>Posta — kapalı zarf, "Etik Komite Başkanı" kişisel</li>
      </ul>
      <h4>4. İhbarcı Koruması</h4>
      <p>4857 İş Kanunu md.5 (eşit davranma ilkesi) ve 6098 TBK md.49 vd. çerçevesinde; iyi niyetli ihbarcının iş ilişkisi, sözleşmesi veya üyeliği <strong>misilleme amacıyla feshedilemez/askıya alınamaz</strong>; aksi davranış hangel iç disiplin süreci ve hukuki yaptırıma tabidir.</p>
      <h4>5. Gizlilik</h4>
      <p>İhbarcı kimliği yasal zorunluluk dışında üçüncü kişilerle paylaşılmaz. TCK md.135-140 kapsamında ihbarcı verisinin yetkisiz paylaşımı suçtur.</p>
      <h4>6. Süreç</h4>
      <p>Bildirim alındığında 5 iş günü içinde alındı teyidi; 30 iş günü içinde ön inceleme; ciddi bulgularda Yönetim Kurulu'na ve gerekirse Cumhuriyet Başsavcılığı'na bildirim. Kötü niyetli/iftira nitelikli ihbarlar TCK md.267 (iftira) kapsamında değerlendirilir.</p>${legalBlock(['whistle', 'tck', 'kvkk', 'iskanun'])}`,
  },
  // 17
  {
    slug: 'kar-dagitim-politikasi',
    title: 'Kâr Dağıtım Politikası',
    group: 'Finansal Yönetişim',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'yuksek',
    targetGroups: ['ngo', 'brand', 'club', 'individual'],
    legislationRefs: ['ttk', 'kvk', 'gvk'],
    body: `
      <h3>Kâr Dağıtım Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel A.Ş.'nin gelir fazlasının dağıtım esaslarını ve misyona aktarım taahhüdünü düzenlemektir. 6102 sayılı TTK md.519, 522 hükümleri ve şirket esas sözleşmesi çerçevesinde uygulanır.</p>
      <h4>2. Kâr Kilidi (Asset Lock) Prensibi</h4>
      <p>hangel; gelirinin asgari <strong>yüzde 51</strong>'ini sosyal fayda projelerine ve operasyonel sürdürülebilirliğe yeniden yatırmayı taahhüt eder. Hissedarlara yapılacak nakit kâr dağıtımı, dağıtılabilir kârın belirlenen oranı aşamaz (kesin oran şirket esas sözleşmesinde tanımlanır).</p>
      <h4>3. Hukuki Çerçeve</h4>
      <ul>
        <li>TTK md.519 — yedek akçe ayırma yükümlülüğü</li>
        <li>TTK md.522 — yedek akçenin kullanım amacı</li>
        <li>193 GVK ve 5520 KVK — kâr dağıtımının vergisel etkileri</li>
        <li>6098 TBK md.49 — hissedarlara karşı dürüstlük kuralı</li>
      </ul>
      <h4>4. Karar Süreci</h4>
      <p>Yıllık olağan Genel Kurul'da, bağımsız denetim raporu ve Yönetim Kurulu tavsiyesi temelinde karar alınır. Karar şeffaflık raporunda kamuoyu ile paylaşılır.</p>
      <h4>5. Sosyal Etki Önceliği</h4>
      <p>Dağıtılmayan kâr; ürün geliştirme, ücretsiz hizmet katmanlarının genişletilmesi, gönüllü/STK destek programları ve burs/hibe fonlarına yönlendirilir.</p>${legalBlock(['ttk', 'kvk', 'gvk'])}`,
  },
  // 18
  {
    slug: 'ucret-politikasi',
    title: 'Ücret Politikası',
    group: 'İnsan Kaynakları',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'orta',
    targetGroups: ['individual'],
    legislationRefs: ['iskanun', 'isig', 'tbk', 'kvkk'],
    body: `
      <h3>Ücret Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel çalışanlarının ücretlerinin adil, şeffaf, performansa dayalı ve cinsiyet/yaş/etnik köken/inanç bazında ayrımcılık yapmayan bir yapıda belirlenmesi.</p>
      <h4>2. Hukuki Dayanak</h4>
      <ul>
        <li>4857 sayılı İş Kanunu md.5 (eşit davranma ilkesi), md.32 (ücretin ödenmesi)</li>
        <li>4857 md.39 (asgari ücret) ve Asgari Ücret Tespit Komisyonu kararları</li>
        <li>6098 TBK md.401 vd. (hizmet sözleşmesi ücret hükümleri)</li>
        <li>AB Pay Transparency Directive 2023/970 (gönüllü uyum)</li>
      </ul>
      <h4>3. Ücret Bandı</h4>
      <p>Her pozisyon için piyasa benchmark (Mercer/Korn Ferry) verisi ışığında <strong>min-mid-max</strong> bantları belirlenir; bantlar yıllık gözden geçirilir.</p>
      <h4>4. Eşit İşe Eşit Ücret</h4>
      <p>İş Kanunu md.5/4 — biyolojik veya işin niteliğine ilişkin sebepler zorunlu kılmadıkça aynı işe aynı ücret ödenir. Yıllık ücret eşitliği denetimi (gender pay gap analizi) iç denetim raporunda kamuoyuyla paylaşılır.</p>
      <h4>5. Performans ve Prim</h4>
      <p>Performans değerlendirmesi OKR/KPI tabanlıdır; objektif kriterlere bağlı prim, ek ödeme veya tahvil/opsiyon programı sunulabilir.</p>
      <h4>6. Veri Gizliliği</h4>
      <p>Ücret bilgisi KVKK md.6 kapsamında özel nitelikli olmasa da hassas kişisel veridir; yalnızca yetkili İK ve mali müşavir erişimine açıktır.</p>${legalBlock(['iskanun', 'isig', 'tbk', 'kvkk'])}`,
  },
  // 19
  {
    slug: 'kurumsal-risk-ve-uyum-komitesi-beyani',
    title: 'Kurumsal Risk ve Uyum Komitesi Beyanı',
    group: 'Kurumsal Yönetişim',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'kritik',
    targetGroups: ['ngo', 'brand', 'club', 'individual'],
    legislationRefs: ['ttk', 'risk', 'whistle', 'kvkk'],
    body: `
      <h3>Kurumsal Risk ve Uyum Komitesi Beyanı</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in tabi olduğu yasal regülasyonlara uyumunu ve operasyonel/finansal/regülatif/siber risklerini bütüncül yönetecek üst düzey yapıyı tanımlamak.</p>
      <h4>2. Hukuki Çerçeve</h4>
      <ul>
        <li>6102 TTK md.378 (riskin erken saptanması komitesi — halka açık şirket analojisi)</li>
        <li>COSO ERM 2017 + ISO 31000:2018 risk yönetimi çerçevesi</li>
        <li>KVKK md.12 (veri güvenliği yükümlülüğü), md.16 (VERBİS)</li>
        <li>5549 sayılı Kanun (suç gelirleri aklama) + MASAK rehberleri</li>
      </ul>
      <h4>3. Komite Yapısı</h4>
      <p>Komite; CEO, CFO, CTO/CISO, DPO, Hukuk Müşaviri ve <strong>en az bir bağımsız üye</strong>den oluşur; Yönetim Kurulu'na doğrudan raporlar. Toplantı sıklığı en az 3 ayda bir.</p>
      <h4>4. Yetki</h4>
      <p>Komite; mevzuata aykırılık tespit ettiği iş süreçlerine <strong>veto</strong> uygulayabilir, ihbar (whistleblower) süreçlerinin idari denetimini yürütür, yıllık risk haritasını günceller ve KVKK Kurul'a 72 saatlik veri ihlali bildirimlerini koordine eder.</p>
      <h4>5. Şeffaflık</h4>
      <p>Komite kararlarının özet anonim bültenleri yıllık Şeffaflık Raporu'nun bir bölümü olarak yayımlanır.</p>${legalBlock(['ttk', 'risk', 'whistle', 'kvkk'])}`,
  },
  // 20
  {
    slug: 'risk-yonetimi-ve-kriz-mudahale-politikasi',
    title: 'Risk Yönetimi ve Kriz Müdahale Politikası',
    group: 'Kurumsal Yönetişim',
    kind: 'policy',
    approvalType: 'bilgilendirme',
    riskLevel: 'kritik',
    targetGroups: ['ngo', 'brand', 'club', 'individual'],
    legislationRefs: ['risk', 'isig', 'kvkk', 'cyber5651'],
    body: `
      <h3>Risk Yönetimi ve Kriz Müdahale Politikası</h3>
      <h4>1. Amaç</h4>
      <p>hangel'in operasyonel sürekliliğini etkileyebilecek tüm risk kategorilerini (siber, finansal, operasyonel, itibar, regülatif, doğal afet) önceden tanımlamak, izlemek ve kriz hâlinde koordineli müdahaleyi sağlamak.</p>
      <h4>2. Risk Çerçevesi</h4>
      <p>ISO 31000:2018 ve COSO ERM 2017 çerçevesinde; risk iştahı, risk tolerans eşiği ve "üç savunma hattı" modeli (iş birimleri / risk-uyum / iç denetim) tanımlanmıştır.</p>
      <h4>3. Kategoriler</h4>
      <ul>
        <li><strong>Siber:</strong> KVKK md.12, ISO 27001:2022, 5651, BTK siber olay bildirimleri</li>
        <li><strong>Finansal:</strong> kur, likidite, kredi — TTK md.378 erken risk saptama</li>
        <li><strong>Regülatif:</strong> KVKK Kurul kararları, MASAK, BTK, Sağlık Bakanlığı, Mülki İdare</li>
        <li><strong>Operasyonel/İSG:</strong> 6331 İSG Kanunu, saha gönüllülük etkinlikleri</li>
        <li><strong>Doğal Afet:</strong> AFAD TAMP, deprem/sel/yangın senaryoları, DRP/BCP</li>
      </ul>
      <h4>4. Kriz Müdahale Ekibi</h4>
      <p>CEO başkanlığında, CTO/CISO, Hukuk, İletişim, İK ve DPO'dan oluşan Kriz Yönetim Ekibi 7/24 dönüşümlü hazırdır. Olay tespitinden itibaren <strong>1 saat</strong> içinde durum değerlendirme toplantısı yapılır.</p>
      <h4>5. İletişim</h4>
      <p>İç iletişim: çalışan + STK + gönüllü kanalları; dış iletişim: kamuoyu duyurusu, ilgili düzenleyici otoriteye bildirim (KVKK md.12/5 — 72 saat içinde Kurul'a; ciddi siber olaylarda BTK USOM bildirimi).</p>
      <h4>6. Test ve Tatbikat</h4>
      <p>Yılda en az 2 kez tatbikat (tabletop + canlı). Bulgular Kurumsal Risk ve Uyum Komitesi'ne raporlanır; CAPA süreciyle iyileştirme yapılır.</p>${legalBlock(['risk', 'isig', 'kvkk', 'cyber5651'])}`,
  },
];

// ---------- Firestore üzerinde çalış ----------

interface ChangeReport {
  slug: string;
  status: 'will-create' | 'will-update';
  existsInFirestore: boolean;
  contentBefore: number;
  contentAfter: number;
  versionBefore: string | null;
  versionAfter: string;
}

function buildContent(b: ContractBuilder): string {
  // Tüm body + DRAFT banner + closing — sonra "Hangel" → "hangel"
  const raw = `${DRAFT_BANNER}\n${b.body}\n${closingBlock()}`;
  return lowerHangel(raw);
}

async function run(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const isApply = process.argv.includes('--apply');
  if (!isDryRun && !isApply) {
    console.error('[batch1] Kullanım: --dry-run | --apply');
    process.exit(1);
  }

  initAdmin();
  const db = getFirestore();
  const col = db.collection('contracts');

  console.log(`[batch1] mod: ${isDryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`[batch1] hedef slug sayısı: ${BUILDERS.length}`);

  // Tüm dokümanları paralel oku
  const snaps = await Promise.all(BUILDERS.map(b => col.doc(b.slug).get()));
  const reports: ChangeReport[] = [];
  const writes: Array<{ slug: string; payload: Record<string, unknown>; merge: boolean }> = [];

  for (let i = 0; i < BUILDERS.length; i++) {
    const b = BUILDERS[i];
    const snap = snaps[i];
    const exists = snap.exists;
    const data = (snap.data() || {}) as Record<string, unknown>;
    const prevContent = typeof data.content === 'string' ? data.content : '';
    const prevVersion = typeof data.version === 'string' ? data.version : null;

    const newContent = buildContent(b);

    const payload: Record<string, unknown> = {
      slug: b.slug,
      title: lowerHangel(b.title),
      group: b.group || (typeof data.group === 'string' ? data.group : ''),
      kind: b.kind,
      content: newContent,
      version: NEW_VERSION,
      effectiveDate: EFFECTIVE_DATE,
      lastUpdated: EFFECTIVE_DATE,
      jurisdictions: ['TR'],
      country: 'TR',
      language: 'tr',
      status: 'taslak', // DRAFT kalır — yayın akışı ayrı endpoint'ten
      approvalType: b.approvalType,
      riskLevel: b.riskLevel,
      targetGroups: b.targetGroups,
      legislationRefs: b.legislationRefs.map(k => TR_LEGISLATION_REFS[k] ?? k),
      complianceBatch: 'tr-batch1-2026-06-03',
      updatedAt: new Date().toISOString(),
      updatedAtServer: FieldValue.serverTimestamp(),
    };

    writes.push({ slug: b.slug, payload, merge: true });
    reports.push({
      slug: b.slug,
      status: exists ? 'will-update' : 'will-create',
      existsInFirestore: exists,
      contentBefore: prevContent.length,
      contentAfter: newContent.length,
      versionBefore: prevVersion,
      versionAfter: NEW_VERSION,
    });
  }

  // Özet
  console.log('\n[batch1] === Plan ===');
  for (const r of reports) {
    console.log(
      `  ${r.status === 'will-create' ? '+' : '~'} ${r.slug.padEnd(60)} ` +
        `content: ${r.contentBefore} → ${r.contentAfter}  ` +
        `version: ${r.versionBefore ?? '(none)'} → ${r.versionAfter}`,
    );
  }

  if (isDryRun) {
    // İlk 3 doc için içerik diff preview (ilk 600 char)
    console.log('\n[batch1] === DRY-RUN içerik önizleme (ilk 3 doc) ===');
    for (let i = 0; i < Math.min(3, writes.length); i++) {
      const w = writes[i];
      const preview = String(w.payload.content).slice(0, 600).replace(/\s+/g, ' ');
      console.log(`\n--- ${w.slug} ---`);
      console.log(preview + '…');
    }
    console.log('\n[batch1] DRY-RUN tamamlandı. Uygulamak için: --apply');
    process.exit(0);
  }

  // APPLY: Firestore batch (20 doc, tek commit)
  const batch = db.batch();
  for (const w of writes) {
    batch.set(col.doc(w.slug), w.payload, { merge: w.merge });
  }
  await batch.commit();
  console.log(`\n[batch1] APPLY OK — ${writes.length} doc tek batch'te yazıldı.`);
  process.exit(0);
}

run().catch(err => {
  console.error('[batch1] Beklenmeyen hata:', err);
  process.exit(1);
});
