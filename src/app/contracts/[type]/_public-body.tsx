'use client';

/**
 * PublicContractBody — sanitize edilmiş HTML'i glass container içine sarar,
 * sticky TOC sidebar'ı ile birlikte sunar. RSC olan parent (`page.tsx`)
 * `ContractTOC` (client) için gereken `articleRef`'i yönetemediğinden bu
 * ince sarmalayıcı çıkarıldı.
 */

import { useRef } from 'react';
import { ContractTOC } from '@/app/settings/contracts/[slug]/_components/contract-toc';

interface Props {
  html: string;
}

export function PublicContractBody({ html }: Props) {
  const articleRef = useRef<HTMLElement | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <ContractTOC html={html} articleRef={articleRef} />
      <div className="glass rounded-3xl p-5 sm:p-8 shadow-glass-soft min-w-0 print:shadow-none print:rounded-none print:p-0 print:bg-white">
        <article
          ref={articleRef}
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-headline prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-pre:rounded-xl prose-table:text-sm prose-th:bg-muted/50"
          // renderMarkdownToSafeHtml emits an allow-listed tag set; sanitizeHtml
          // re-vets before render — same pattern as the previous viewer.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }
          html, body { background: #ffffff !important; }
          .contract-page { max-width: 100% !important; padding: 0 !important; }
          .prose { color: #111 !important; }
          .prose a { color: #111 !important; text-decoration: underline; }
          .prose pre, .prose code { background: #f4f4f5 !important; color: #111 !important; }
          .prose h1, .prose h2, .prose h3 { break-after: avoid; page-break-after: avoid; }
          .prose img, .prose table, .prose pre { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
