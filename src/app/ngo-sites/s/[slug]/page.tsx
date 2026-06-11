'use client';

import { useParams } from 'next/navigation';
import { SiteResolver } from '../../_components/SiteResolver';

// STK alt alan adı sitesi: `{slug}.hangel.org.tr` → middleware bunu
// `/ngo-sites/s/{slug}` rotasına rewrite eder. slug = ngos/{id}.shortLink.
// PUBLIC (giriş gerekmez), tam ekran, app chrome'suz.
export default function NgoSiteBySlugPage() {
  const params = useParams();
  const slug = decodeURIComponent((params.slug as string) ?? '');
  return <SiteResolver field="shortLink" value={slug} />;
}
