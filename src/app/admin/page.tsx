/**
 * /admin → /ngo-admin redirect.
 *
 * Why: Tüm yönetim panelleri /ngo-admin altında toplandı (STK + Marka + Kulüp
 * tek yerden yönetilir). Eski /admin URL'leri eskimedi diye otomatik forward.
 */
import { redirect } from 'next/navigation';

export default function AdminRedirect() {
    redirect('/ngo-admin');
}
