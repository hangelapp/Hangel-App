/**
 * /privacy — Public privacy policy page (Chrome Web Store + app stores için).
 *
 * Hangel ana KVKK politikası /gizlilik-politikasi'nda (Türkçe tam metin);
 * bu sayfa Chrome Web Store + Apple/Google review için sade iki dilli özet
 * ve Chrome Extension'a özel data handling açıklaması içerir.
 */
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası / Privacy Policy — hangel',
  description: 'hangel ve hangel Chrome Extension için veri işleme uygulamaları.',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-slate-800">
      <header className="mb-8 border-b pb-6">
        <h1 className="text-2xl font-bold text-slate-900">Gizlilik Politikası / Privacy Policy</h1>
        <p className="mt-2 text-slate-600">
          hangel — Uluslararası Sosyal Fayda Derneği<br />
          Son güncelleme: 2026-06-14
        </p>
      </header>

      {/* ─── Türkçe ──────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Türkçe</h2>

        <h3 className="mt-6 mb-2 font-semibold">1. Veri Sorumlusu</h3>
        <p>
          hangel Uluslararası Sosyal Fayda Derneği (&quot;hangel&quot;), 6698 sayılı KVKK kapsamında
          veri sorumlusudur. İletişim: <a className="text-orange-600 hover:underline" href="mailto:info@hangel.org">info@hangel.org</a>.
        </p>

        <h3 className="mt-6 mb-2 font-semibold">2. İşlenen Veriler</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Hesap:</strong> ad, e-posta, telefon (doğrulama amacıyla).</li>
          <li><strong>Bağış:</strong> tutar, tarih, alıcı STK, ödeme provider referansı.</li>
          <li><strong>Etkileşim:</strong> uygulama içi tıklama/sayfa görüntüleme metrikleri (anonimleştirilir).</li>
          <li><strong>Chrome Extension:</strong> aşağıdaki ayrı bölüme bakın.</li>
        </ul>

        <h3 className="mt-6 mb-2 font-semibold">3. Amaçlar</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Bağış işlemini gerçekleştirmek ve makbuz oluşturmak.</li>
          <li>STK&apos;lar ile kullanıcıyı eşleştirmek (kullanıcının seçimi doğrultusunda).</li>
          <li>Yasal yükümlülükler (KVKK, dernek mevzuatı, vergi kayıtları).</li>
          <li>Hizmet kalitesini ölçmek (anonim metrikler).</li>
        </ul>

        <h3 className="mt-6 mb-2 font-semibold">4. Kullanıcı Hakları</h3>
        <p>
          KVKK md.11 kapsamında bilgi alma, düzeltme, silme, itiraz haklarınızı{' '}
          <a className="text-orange-600 hover:underline" href="mailto:info@hangel.org">info@hangel.org</a>{' '}
          adresine yazarak kullanabilirsiniz.
        </p>

        <p className="mt-6">
          Tam metin: <Link className="text-orange-600 hover:underline" href="/gizlilik-politikasi">/gizlilik-politikasi</Link>
        </p>
      </section>

      {/* ─── Chrome Extension özel ──────────────────────────── */}
      <section className="mb-12 rounded-lg border-2 border-orange-200 bg-orange-50/40 p-6">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">hangel Chrome Extension — Veri Uygulamaları</h2>

        <h3 className="mt-4 mb-2 font-semibold">Ne toplanır?</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Tarama geçmişi ASLA hangel sunucusuna gönderilmez.</strong> Marka eşleştirmesi
            tamamen Chrome&apos;un içinde, yerel <code>chrome.storage.local</code>&apos;a kaydedilmiş
            marka listesi üzerinden yapılır.
          </li>
          <li>
            Sadece kullanıcı &quot;Yapsın&quot; butonuna tıkladığında o anki marka kimliği
            (<code>brandId</code>) hangel sunucusuna gönderilir. Bu istek tarama geçmişi,
            URL, ya da kişisel bilgi içermez.
          </li>
          <li>
            &quot;Bir daha sorma&quot; tercihleri (30 gün) yalnızca Chrome&apos;un yerel deposunda saklanır.
          </li>
        </ul>

        <h3 className="mt-6 mb-2 font-semibold">İzinler ve gerekçeleri</h3>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">İzin</th>
              <th className="py-2 text-left">Neden</th>
            </tr>
          </thead>
          <tbody className="[&_td]:py-2 [&_td]:pr-3 [&_tr]:border-b [&_tr]:border-slate-200">
            <tr><td><code>storage</code></td><td>Marka listesi cache + tercihler</td></tr>
            <tr><td><code>activeTab</code></td><td>Mevcut sekme URL&apos;sini yerelde karşılaştırmak</td></tr>
            <tr><td><code>tabs</code></td><td>&quot;Yapsın&quot; tıklamasında affiliate URL&apos;e yönlendirmek</td></tr>
            <tr><td><code>alarms</code></td><td>Saatte bir marka listesi güncelleme</td></tr>
            <tr><td><code>host_permissions: hangel.org.tr/*</code></td><td>Marka listesi + affiliate link API&apos;leri</td></tr>
          </tbody>
        </table>

        <h3 className="mt-6 mb-2 font-semibold">Üçüncü taraf</h3>
        <p>
          &quot;Yapsın&quot; tıklandığında kullanıcı, ilgili markanın affiliate ortağı sayfasına
          (HasOffers tracking link) yönlendirilir. Bu noktadan sonra ilgili affiliate ağı
          ve marka kendi gizlilik politikalarını uygular.
        </p>
      </section>

      {/* ─── English ────────────────────────────────────────── */}
      <section className="mb-12 border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">English</h2>

        <h3 className="mt-6 mb-2 font-semibold">1. Data Controller</h3>
        <p>
          hangel International Social Benefit Association (&quot;hangel&quot;) is the data
          controller. Contact: <a className="text-orange-600 hover:underline" href="mailto:info@hangel.org">info@hangel.org</a>.
        </p>

        <h3 className="mt-6 mb-2 font-semibold">2. Data we collect</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account:</strong> name, email, phone (for verification).</li>
          <li><strong>Donations:</strong> amount, date, recipient NGO, payment reference.</li>
          <li><strong>Engagement:</strong> in-app click / page-view metrics (anonymized).</li>
          <li><strong>Chrome Extension:</strong> see the dedicated section below.</li>
        </ul>

        <h3 className="mt-6 mb-2 font-semibold">3. Purposes</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Process donations and issue receipts.</li>
          <li>Match users with NGOs they have selected.</li>
          <li>Legal obligations (KVKK, association law, tax records).</li>
          <li>Service quality measurement (anonymous metrics).</li>
        </ul>

        <h3 className="mt-6 mb-2 font-semibold">4. User rights</h3>
        <p>
          Under KVKK art. 11 you may request access, rectification, erasure, or
          objection by writing to{' '}
          <a className="text-orange-600 hover:underline" href="mailto:info@hangel.org">info@hangel.org</a>.
        </p>

        <h3 className="mt-6 mb-2 font-semibold">Chrome Extension data handling (summary)</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Browsing history is NEVER sent to hangel servers.</strong> Brand matching
            happens entirely inside Chrome via the locally cached brand list in{' '}
            <code>chrome.storage.local</code>.
          </li>
          <li>
            Only when the user clicks the &quot;Yapsın&quot; (Do it) button is the brand
            identifier (<code>brandId</code>) sent to hangel. This request contains no URL,
            history, or PII.
          </li>
          <li>&quot;Don&apos;t ask again&quot; preferences (30 days) live only in Chrome&apos;s local storage.</li>
        </ul>
      </section>

      <footer className="border-t pt-6 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} hangel Uluslararası Sosyal Fayda Derneği. Tüm hakları saklıdır.</p>
        <p className="mt-2">
          Sorularınız için: <a className="text-orange-600 hover:underline" href="mailto:info@hangel.org">info@hangel.org</a>
        </p>
      </footer>
    </main>
  );
}
