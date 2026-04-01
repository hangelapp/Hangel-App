import type { MetadataRoute } from 'next'

const BASE_URL = 'https://hangel.org.tr'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '/',
    '/about',
    '/accessibility',
    '/bilgi-toplumu-hizmetleri',
    '/campus-advantages',
    '/careers',
    '/contact/funds',
    '/contact/municipalities',
    '/contact/universities',
    '/corporate',
    '/emergency',
    '/feedback',
    '/hangelassociation',
    '/hangelassociation/about',
    '/hangelassociation/contact',
    '/hangelassociation/events',
    '/hangelassociation/feedback',
    '/hangelassociation/legislation',
    '/hangelassociation/workshop',
    '/impact-story',
    '/library',
    '/logo',
    '/logo-usage',
    '/merchant',
    '/ngos',
    '/press',
    '/social-entrepreneurship',
    '/social-impact',
    '/standards',
    '/association/about',
    '/association/events',
    '/association/legislation',
    '/association/workshop',
  ]

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1 : 0.8,
  }))
}
