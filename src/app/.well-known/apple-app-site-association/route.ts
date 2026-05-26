/**
 * Apple App Site Association (AASA) for Universal Links.
 *
 * Served at: https://hangel.org.tr/.well-known/apple-app-site-association
 * Content-Type MUST be application/json (no charset), no extension, no redirect.
 *
 * appID format: <TEAM_ID>.<BUNDLE_ID>
 * Team: NKZNY8NU8S, Bundle: com.hangel.ios.app
 *
 * Paths: any hangel.org.tr URL clicked from another app (WhatsApp, Mail, etc.)
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
            ],
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
