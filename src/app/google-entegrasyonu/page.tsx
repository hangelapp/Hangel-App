import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'hangel — Uygulama ve Google Entegrasyonu',
  description:
    'hangel, sivil toplum kuruluşlarını destekçileriyle buluşturan; bağış, gönüllülük ve ücretsiz dijital reklam (Google Ads / Ad Grants) yönetimi sunan bir platformdur. Google hesabı erişiminin amacı ve kapsamı bu sayfada açıklanır.',
};

// Bu sayfa OAuth onay ekranının "uygulama ana sayfası" olarak kullanılabilir:
// uygulamanın amacını + istenen Google izinlerinin (adwords) nedenini açıkça anlatır.
// Kimlik doğrulaması GEREKTİRMEZ — herkese açık, statik (Google doğrulama incelemesi erişebilsin).
export default function GoogleEntegrasyonuPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-800">
      <div className="mx-auto max-w-3xl px-6 py-14 md:py-20">
        {/* Marka */}
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F15A29] text-white font-bold text-lg">
            h
          </span>
          <span className="text-2xl font-bold tracking-tight text-zinc-900">hangel</span>
        </div>

        <h1 className="mt-8 text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
          hangel nedir ve Google entegrasyonu ne işe yarar?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          hangel; dernek, vakıf ve sivil toplum kuruluşlarını (STK) destekçileriyle buluşturan bir
          dijital platformdur. STK&apos;lara <strong>bağış toplama, gönüllülük, etkinlik yönetimi</strong> ve
          <strong> ücretsiz dijital reklam (Google Ads / Google Ad Grants)</strong> imkânlarını tek bir
          panelde sunarız. Amacımız, sivil toplumun etkisini sürdürülebilir kılmaktır.
        </p>

        {/* Ne sunuyoruz */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900">hangel ne sunar?</h2>
          <ul className="mt-4 space-y-2.5 text-zinc-700">
            <li>• <strong>Bağış &amp; destek:</strong> STK&apos;ların destekçileriyle güvenli şekilde buluşması.</li>
            <li>• <strong>Gönüllülük:</strong> Gönüllü ilanları ve katılım yönetimi.</li>
            <li>• <strong>Etkinlik:</strong> Etkinlik oluşturma, katılım ve sertifika.</li>
            <li>• <strong>Ücretsiz reklam:</strong> STK&apos;ların Google Ad Grants ile ayda 10.000 USD&apos;ye varan
              ücretsiz Google reklamını panelden yönetmesi.</li>
          </ul>
        </section>

        {/* Google entegrasyonu */}
        <section className="mt-12 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Google Ads entegrasyonu</h2>
          <p className="mt-3 leading-relaxed text-zinc-700">
            Bir STK, hangel paneli üzerinden <strong>kendi Google Ads / Google Ad Grants hesabını</strong>
            {' '}bağlayabilir. Bağlama işlemi Google&apos;ın güvenli izin (OAuth) ekranı üzerinden, yalnızca
            STK&apos;nın <strong>açık onayıyla</strong> yapılır. Bağlandıktan sonra hangel, STK adına arama
            reklamı kampanyaları oluşturabilir, bütçesini ve hedeflemesini düzenleyebilir ve kampanya
            performansını (gösterim, tıklama, dönüşüm) STK&apos;ya gösterebilir.
          </p>
        </section>

        {/* İzinler */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">Hangi Google iznini, neden istiyoruz?</h2>
          <div className="mt-4 rounded-xl border border-zinc-200 p-5">
            <p className="font-mono text-sm text-[#F15A29]">https://www.googleapis.com/auth/adwords</p>
            <p className="mt-3 leading-relaxed text-zinc-700">
              Bu izin <strong>yalnızca</strong> STK&apos;nın <strong>kendi</strong> Google Ads hesabında
              kampanya oluşturmak/yönetmek ve performans metriklerini göstermek için kullanılır. hangel:
            </p>
            <ul className="mt-3 space-y-1.5 text-zinc-700">
              <li>• Reklam verilerini hiçbir üçüncü tarafla paylaşmaz, satmaz.</li>
              <li>• Yetkilendirme jetonunu (refresh token) yalnızca sunucu tarafında saklar; istemciye göndermez.</li>
              <li>• Yalnızca STK&apos;nın işlemi başlattığı eylemleri (kampanya oluştur/düzenle, metrik oku) yapar.</li>
              <li>• STK bağlantıyı dilediği an kaldırabilir; kaldırınca erişim sona erer.</li>
            </ul>
          </div>
        </section>

        {/* Veri & gizlilik */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-zinc-900">Veri ve gizlilik</h2>
          <p className="mt-3 leading-relaxed text-zinc-700">
            hangel, Google kullanıcı verilerini yalnızca yukarıda açıklanan işlevleri sağlamak için işler;
            Google API Hizmetleri Kullanıcı Verisi Politikası&apos;na (Sınırlı Kullanım gereksinimleri dâhil)
            uygun davranır. Ayrıntılar için:
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/gizlilik-politikasi" className="rounded-lg bg-[#F15A29] px-4 py-2 text-sm font-semibold text-white">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanici-sozlesmesi" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-800">
              Kullanıcı Sözleşmesi
            </Link>
          </div>
        </section>

        {/* İletişim */}
        <section className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-500">
          <p>
            İletişim: <a href="mailto:ismailhilmi@hangel.org" className="font-medium text-zinc-700">ismailhilmi@hangel.org</a>
            {' '}· <a href="https://hangel.org" className="font-medium text-zinc-700">hangel.org</a>
          </p>
          <p className="mt-2">© {new Date().getFullYear()} hangel · Sivil toplum için dijital platform.</p>
        </section>
      </div>
    </main>
  );
}
