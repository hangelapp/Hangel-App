/**
 * /market/apple — STANDARDİZASYON (2026-07-08): eski elle-yazılmış Apple özel
 * sayfası (siyah hero + sabit %5) kaldırıldı. Artık tüm marka profilleri TEK
 * şablonu (/market/brand/<key>) kullanır → tutarlı bilgi + tasarım. Eski link
 * (discover Apple banner'ı) çalışsın diye kalıcı yönlendirme.
 */
import { redirect } from 'next/navigation';

export default function ApplePage() {
  redirect('/market/brand/apple');
}
