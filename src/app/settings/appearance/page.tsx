import { redirect } from 'next/navigation';

// /settings/appearance kaldırıldı — erişilebilirlik ayarları artık tek yerde:
// /settings/accessibility. Bu sayfa hiçbir şeyi kaydetmiyordu (orphan) →
// kullanıcıyı doğrudan yeni sayfaya yönlendir.
export default function AppearanceSettingsPage() {
    redirect('/settings/accessibility');
}
