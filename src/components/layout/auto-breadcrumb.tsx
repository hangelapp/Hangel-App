'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Known route segments → Turkish labels. Unknown segments fall back to a
// title-cased version of the slug; dynamic id-like segments collapse to "Detay".
const LABEL_MAP: Record<string, string> = {
  // Primary app sections
  home: 'Ana Sayfa',
  timeline: 'Akış',
  market: 'Market',
  ngos: "STK'lar",
  clubs: 'Kulüpler',
  events: 'Etkinlikler',
  library: 'Kütüphane',
  leaderboard: 'Liderlik Tablosu',
  invite: 'Arkadaş Davet Et',
  notifications: 'Bildirimler',
  messages: 'Mesajlarım',
  profile: 'Profil',
  emergency: 'Acil Durum',
  volunteering: 'Gönüllülük',
  stories: 'Hikâyeler',
  posts: 'Gönderiler',
  'qr-payment': 'QR Ödeme',
  payment: 'Ödeme',

  // "My" sections
  'my-donations': 'Bağışlarım',
  'my-applications': 'Başvurularım',
  'my-badges': 'Rozetler ve Sertifikalar',

  // Admin areas
  admin: 'Yönetim Paneli',
  'ngo-admin': 'Yönetim Paneli',
  'club-admin': 'Yönetim Paneli',
  'brand-admin': 'Yönetim Paneli',
  'super-admin': 'Süper Admin',

  // Settings + sub-pages
  settings: 'Ayarlar',
  privacy: 'Gizlilik',
  security: 'Güvenlik',
  appearance: 'Görünüm',
  theme: 'Tema',
  language: 'Dil',
  accessibility: 'Erişilebilirlik',
  'marketing-consent': 'Pazarlama İzni',
  wallet: 'Cüzdan',
  contracts: 'Sözleşmeler',
  'ngo-selection': 'STK Seçimi',
  'volunteer-ngo-selection': 'Gönüllü STK Seçimi',
  volunteer: 'Gönüllülük',
  brands: 'Markalar',

  // Super-admin sub-pages
  users: 'Kullanıcı Yönetimi',
  activity: 'Aktivite',
  ads: 'Reklamlar',
  'ai-management': 'Yapay Zekâ Yönetimi',
  analytics: 'Analitik',
  applications: 'Başvurular',
  'association-content': 'Dernek İçeriği',
  communications: 'İletişim',
  demographics: 'Demografi',
  donations: 'Bağışlar',
  funds: 'Fonlar',
  help: 'Yardım',
  inbox: 'Gelen Kutusu',
  maintenance: 'Bakım',
  messaging: 'Mesajlaşma',
  pages: 'Sayfalar',
  'public-relations': 'Halkla İlişkiler',
  surveys: 'Anketler',
  transparency: 'Şeffaflık',
  'web-content': 'Web İçeriği',
  setup: 'Kurulum',
  support: 'Destek',
};

/**
 * Returns true when a path segment looks like a dynamic id rather than a known
 * static route (Firestore doc ids, long random/opaque strings). These are
 * rendered as "Detay" so we never print a raw id in the breadcrumb.
 */
function isDynamicId(segment: string): boolean {
  if (LABEL_MAP[segment]) return false;
  // Firestore-style ids are 20 chars; uuids/hashes are long. Treat long opaque
  // tokens, or any segment containing a digit alongside no readable hyphenated
  // words, as dynamic.
  if (segment.length >= 18) return true;
  if (/^[0-9]+$/.test(segment)) return true;
  // Mixed-case alphanumeric without hyphen separators (e.g. "aB3xQ9z") → id-like.
  if (segment.length >= 12 && /[0-9]/.test(segment) && !segment.includes('-')) {
    return true;
  }
  return false;
}

function titleCase(segment: string): string {
  return segment
    .split('-')
    .map((word) => (word ? word.charAt(0).toLocaleUpperCase('tr-TR') + word.slice(1) : word))
    .join(' ');
}

function labelFor(segment: string): string {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment];
  if (isDynamicId(segment)) return 'Detay';
  return titleCase(decodeURIComponent(segment));
}

interface Crumb {
  href: string;
  label: string;
}

export function AutoBreadcrumb() {
  const pathname = usePathname();

  // No breadcrumb on the public landing page or the app home — a lone crumb
  // adds noise without navigational value.
  if (!pathname || pathname === '/' || pathname === '/home') {
    return null;
  }

  // Trendyol-vari tam-ekran pazar vitrinlerinde breadcrumb gürültü yapar ve üstte
  // gereksiz boşluk bırakır → bu immersive sayfalarda gizle.
  if (
    pathname === '/market' ||
    pathname === '/market/discover' ||
    pathname.startsWith('/market/discover/') ||
    pathname === '/market/products' ||
    pathname.startsWith('/market/products/')
  ) {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const crumbs: Crumb[] = [{ href: '/home', label: 'Ana Sayfa' }];

  let cumulativeHref = '';
  segments.forEach((segment) => {
    cumulativeHref += `/${segment}`;
    crumbs.push({ href: cumulativeHref, label: labelFor(segment) });
  });

  return (
    <Breadcrumb className="px-4 py-2 overflow-x-auto">
      <BreadcrumbList className="text-xs sm:text-sm flex-nowrap whitespace-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
