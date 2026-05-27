/**
 * /settings/marketing-consent → /settings/notifications redirect.
 * Pazarlama izinleri Bildirim Ayarları altında birleştirildi.
 */
import { redirect } from 'next/navigation';

export default function MarketingConsentRedirect() {
    redirect('/settings/notifications');
}
