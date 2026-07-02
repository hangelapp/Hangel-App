/**
 * Android Digital Asset Links for App Links + WhatsApp One-Tap OTP.
 *
 * Served at: https://hangel.org/.well-known/assetlinks.json
 * Content-Type: application/json
 *
 * package_name: com.hangel.app (Play Store)
 * sha256_cert_fingerprints: Play App Signing key SHA-256
 *
 * - common.handle_all_urls → App Links (hangel.org links open in Hangel app)
 * - common.get_login_creds  → WhatsApp One-Tap OTP autofill (Authentication template)
 */
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-static';

export function GET() {
    const target = {
        namespace: 'android_app',
        package_name: 'com.hangel.app',
        sha256_cert_fingerprints: [
            '05:5A:CC:46:A0:D1:0D:79:A2:4F:63:6D:CE:57:E7:1E:74:CC:F1:4F:04:A1:10:5D:CB:5C:67:24:00:A6:CF:7E',
        ],
    };
    const body = [
        {
            relation: ['delegate_permission/common.handle_all_urls'],
            target,
        },
        {
            relation: ['delegate_permission/common.get_login_creds'],
            target,
        },
    ];
    return new NextResponse(JSON.stringify(body), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
