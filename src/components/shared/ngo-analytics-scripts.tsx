'use client';

import Script from 'next/script';
import React from 'react';

export type NgoAnalyticsScriptsProps = {
    gaId?: string | null;
    gtmId?: string | null;
    metaPixelId?: string | null;
};

/**
 * NGO başına analitik script enjeksiyonu.
 *
 * NGO admin'in `analytics-tools` sayfasından kaydettiği GA4 / GTM / Meta Pixel
 * kimliklerini alır ve `next/script` ile (`afterInteractive`) yükler.
 *
 * Boş/null kimlikler için ilgili blok render edilmez — yan etkisiz.
 * Yeni paket bağımlılığı eklenmez; sadece Next.js'in built-in `<Script />`
 * bileşeni kullanılır.
 */
export function NgoAnalyticsScripts({ gaId, gtmId, metaPixelId }: NgoAnalyticsScriptsProps) {
    const ga = (gaId || '').trim();
    const gtm = (gtmId || '').trim();
    const pixel = (metaPixelId || '').trim();

    if (!ga && !gtm && !pixel) return null;

    return (
        <>
            {ga && (
                <>
                    <Script
                        id={`ngo-ga4-loader-${ga}`}
                        src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
                        strategy="afterInteractive"
                    />
                    <Script id={`ngo-ga4-init-${ga}`} strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${ga}');
                        `}
                    </Script>
                </>
            )}

            {gtm && (
                <>
                    <Script id={`ngo-gtm-init-${gtm}`} strategy="afterInteractive">
                        {`
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer','${gtm}');
                        `}
                    </Script>
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                            title="GTM"
                        />
                    </noscript>
                </>
            )}

            {pixel && (
                <>
                    <Script id={`ngo-fbq-init-${pixel}`} strategy="afterInteractive">
                        {`
                            !function(f,b,e,v,n,t,s)
                            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                            n.queue=[];t=b.createElement(e);t.async=!0;
                            t.src=v;s=b.getElementsByTagName(e)[0];
                            s.parentNode.insertBefore(t,s)}(window, document,'script',
                            'https://connect.facebook.net/en_US/fbevents.js');
                            fbq('init', '${pixel}');
                            fbq('track', 'PageView');
                        `}
                    </Script>
                    <noscript>
                        <img
                            height="1"
                            width="1"
                            style={{ display: 'none' }}
                            alt=""
                            src={`https://www.facebook.com/tr?id=${pixel}&ev=PageView&noscript=1`}
                        />
                    </noscript>
                </>
            )}
        </>
    );
}

export default NgoAnalyticsScripts;
