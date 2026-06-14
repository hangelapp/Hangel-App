/**
 * Public (girişsiz) sözleşme/politika görüntüleyici.
 *
 * /settings/contracts/[slug] auth shell'i altında; Google OAuth doğrulaması ve
 * dış bağlantılar (consent screen privacy/terms) GİRİŞSİZ erişilebilir bir URL
 * ister. Bu component statik `contractsData` içeriğini server-render eder.
 *
 * sanitizeHtml ile temizlenmiş içerik (CLAUDE.md: yeni dangerouslySetInnerHTML
 * yalnız sanitize edilmiş üretim).
 */
import { contractsData } from '@/lib/contracts';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { looksLikeHtml, renderMarkdownToSafeHtml } from '@/lib/contracts/markdown';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export function PublicContract({ slug }: { slug: string }) {
  const contract = contractsData.find((c) => c.slug === slug);
  if (!contract) notFound();
  const raw = contract.content || '';
  const html = looksLikeHtml(raw) ? sanitizeHtml(raw) : sanitizeHtml(renderMarkdownToSafeHtml(raw));
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-primary hover:underline">← hangel</Link>
      <h1 className="mt-4 text-2xl sm:text-3xl font-bold font-headline">{contract.title}</h1>
      <article
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mt-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <hr className="my-10 border-border/60" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        hangel — Sosyal etki platformu ·{' '}
        <a href="https://hangel.org.tr" className="hover:underline">hangel.org.tr</a> ·{' '}
        <a href="mailto:privacy@hangel.org" className="hover:underline">privacy@hangel.org</a> ·{' '}
        <a href="mailto:kvkk@hangel.org" className="hover:underline">kvkk@hangel.org</a>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        Diğer belgeler:{' '}
        <Link href="/gizlilik-politikasi" className="hover:underline">Gizlilik Politikası</Link> ·{' '}
        <Link href="/kullanici-sozlesmesi" className="hover:underline">Kullanıcı Sözleşmesi</Link>
      </p>
    </main>
  );
}
