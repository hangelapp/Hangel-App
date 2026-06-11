'use client';

import { useParams } from 'next/navigation';
import { SiteResolver } from '../../_components/SiteResolver';

// STK custom domain sitesi: bağlanan özel alan adı → `/ngo-sites/d/{domain}`.
// domain = ngos/{id}.siteSettings.domain. Alt alan rotasıyla aynı SiteRenderer'ı
// kullanır. PUBLIC, tam ekran, app chrome'suz.
export default function NgoSiteByDomainPage() {
  const params = useParams();
  const domain = decodeURIComponent((params.domain as string) ?? '');
  return <SiteResolver field="siteSettings.domain" value={domain} />;
}
