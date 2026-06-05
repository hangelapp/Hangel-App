/**
 * JSON-LD schema markup helpers for SEO. Google rich results.
 * Tüm script'ler RAW JSON-LD basacak şekilde Next.js Script bileşeni yerine
 * <script type="application/ld+json"> kullanır (server render edilebilir).
 */
import React from 'react';

interface BaseSchemaProps {
    data: Record<string, unknown>;
}

export function JsonLd({ data }: BaseSchemaProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

/**
 * NGO/Nonprofit organization schema
 * @see https://developers.google.com/search/docs/appearance/structured-data/organization
 */
export function NgoSchema({
    name, description, logoUrl, url, foundedYear, address, sameAs, mission,
}: {
    name: string;
    description?: string;
    logoUrl?: string;
    url?: string;
    foundedYear?: string | number;
    address?: { country?: string; city?: string };
    sameAs?: string[];
    mission?: string;
}) {
    const data: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'NGO',
        name,
        ...(description && { description }),
        ...(logoUrl && { logo: logoUrl, image: logoUrl }),
        ...(url && { url }),
        ...(foundedYear && { foundingDate: String(foundedYear) }),
        ...(mission && { slogan: mission }),
        ...(address && {
            address: {
                '@type': 'PostalAddress',
                ...(address.country && { addressCountry: address.country }),
                ...(address.city && { addressLocality: address.city }),
            },
        }),
        ...(sameAs && sameAs.length > 0 && { sameAs }),
    };
    return <JsonLd data={data} />;
}

/**
 * Local business / brand schema
 */
export function BrandSchema({
    name, description, logoUrl, url, address, sameAs,
}: {
    name: string;
    description?: string;
    logoUrl?: string;
    url?: string;
    address?: { country?: string; city?: string };
    sameAs?: string[];
}) {
    const data: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name,
        ...(description && { description }),
        ...(logoUrl && { logo: logoUrl, image: logoUrl }),
        ...(url && { url }),
        ...(address && {
            address: {
                '@type': 'PostalAddress',
                ...(address.country && { addressCountry: address.country }),
                ...(address.city && { addressLocality: address.city }),
            },
        }),
        ...(sameAs && sameAs.length > 0 && { sameAs }),
    };
    return <JsonLd data={data} />;
}

/**
 * Event schema — etkinlik için
 * @see https://developers.google.com/search/docs/appearance/structured-data/event
 */
export function EventSchema({
    name, description, startDate, endDate, location, image, organizer, url,
}: {
    name: string;
    description?: string;
    startDate?: string; // ISO 8601
    endDate?: string;
    location?: { name?: string; address?: string };
    image?: string;
    organizer?: { name: string; url?: string };
    url?: string;
}) {
    const data: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name,
        ...(description && { description }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(image && { image }),
        ...(url && { url }),
        ...(location && {
            location: {
                '@type': 'Place',
                ...(location.name && { name: location.name }),
                ...(location.address && {
                    address: { '@type': 'PostalAddress', streetAddress: location.address },
                }),
            },
        }),
        ...(organizer && {
            organizer: {
                '@type': 'Organization',
                name: organizer.name,
                ...(organizer.url && { url: organizer.url }),
            },
        }),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    };
    return <JsonLd data={data} />;
}

/**
 * Article schema — kütüphane içeriği için
 */
export function ArticleSchema({
    headline, description, image, datePublished, author, url,
}: {
    headline: string;
    description?: string;
    image?: string;
    datePublished?: string;
    author?: { name: string };
    url?: string;
}) {
    const data: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        ...(description && { description }),
        ...(image && { image }),
        ...(datePublished && { datePublished }),
        ...(url && { mainEntityOfPage: url }),
        ...(author && {
            author: { '@type': 'Person', name: author.name },
        }),
    };
    return <JsonLd data={data} />;
}

/**
 * Breadcrumb schema — navigation hiyerarşisi
 */
export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
    const data = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: item.url,
        })),
    };
    return <JsonLd data={data} />;
}

/**
 * Organization schema — root level (anasayfada hangel için)
 */
export function HangelOrgSchema() {
    return (
        <JsonLd
            data={{
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'hangel',
                url: 'https://hangel.org.tr',
                logo: 'https://hangel.org.tr/logo.png',
                description: 'Türkiye\'nin sosyal etki platformu — STK, marka, kulüp ekosistemi',
                sameAs: [
                    'https://hangel.org.tr',
                    'https://apps.apple.com/in/app/hangel-app/id6664058822',
                    'https://play.google.com/store/apps/details?id=com.hangel.app',
                    'https://instagram.com/hangelorg',
                    'https://x.com/hangelorg',
                    'https://linkedin.com/company/hangelorg',
                    'https://youtube.com/@hangelorg',
                    'https://facebook.com/hangelorg',
                    'https://tiktok.com/@hangelorg',
                    'https://threads.net/@hangelorg',
                    'https://t.me/hangelorg',
                    'https://nextsosyal.com/@hangelorg',
                ],
            }}
        />
    );
}
