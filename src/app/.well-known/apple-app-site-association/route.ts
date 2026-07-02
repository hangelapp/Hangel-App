/**
 * Apple App Site Association (AASA) for Universal Links.
 *
 * Served at: https://hangel.org/.well-known/apple-app-site-association
 * Content-Type MUST be application/json (no charset), no extension, no redirect.
 *
 * appID format: <TEAM_ID>.<BUNDLE_ID>
 * Team: NKZNY8NU8S, Bundle: com.hangel.ios.app
 *
 * Paths: any hangel.org URL clicked from another app (WhatsApp, Mail, etc.)
 * → iOS opens Hangel app if installed; falls back to Safari otherwise.
 */
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-static';

export function GET() {
    const body = {
        applinks: {
            apps: [],
            details: [
                {
                    appID: 'NKZNY8NU8S.com.hangel.ios.app',
                    paths: ['*'],
                },
                {
                    // App Clip universal link kapsamı (check-in/kayıt/clip URL'leri).
                    appID: 'NKZNY8NU8S.com.hangel.ios.app.Clip',
                    paths: ['/clip/*', '/e/*', '/checkin/*', '/event/*'],
                },
            ],
        },
        // Şifre/anahtar otomatik doldurma.
        webcredentials: {
            apps: ['NKZNY8NU8S.com.hangel.ios.app'],
        },
        // App Clip YETKİLENDİRME — bu anahtar olmadan App Clip domain'de çalışmaz.
        // Çağrı URL'leri App Store Connect'teki "App Clip Experience"larda tanımlanır.
        appclips: {
            apps: ['NKZNY8NU8S.com.hangel.ios.app.Clip'],
        },
    };
    return new NextResponse(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
