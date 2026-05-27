/**
 * /settings/security → /settings/privacy redirect.
 * Güvenlik içeriği (2FA + açık oturumlar) Gizlilik sayfasına taşındı.
 */
import { redirect } from 'next/navigation';

export default function SecurityRedirect() {
    redirect('/settings/privacy');
}
