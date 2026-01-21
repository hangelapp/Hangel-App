'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Bell, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

const notificationGroups = [
  {
    title: 'Gönüllülük ve Başvurular',
    description: 'Gönüllülük ilanları ve başvurularınızla ilgili bildirimler.',
    items: [
      { id: 'app-status', label: 'Başvuru durumu değiştiğinde' },
      { id: 'new-opportunity', label: 'İlgi alanlarıma uygun yeni ilanlar' },
      { id: 'event-reminder', label: 'Katılacağım etkinlikler için hatırlatma' },
    ],
  },
  {
    title: 'Bağış ve Etki',
    description: 'Yaptığınız bağışlar ve kazandığınız puanlarla ilgili bildirimler.',
    items: [
      { id: 'donation-success', label: 'Bağış STK\'ya ulaştığında' },
      { id: 'new-badge', label: 'Yeni rozet kazanıldığında' },
      { id: 'impact-report', label: 'Aylık etki raporu hazır olduğunda' },
    ],
  },
  {
    title: 'Platform ve Topluluk',
    description: 'Duyurular, bültenler ve sosyal bildirimler.',
    items: [
      { id: 'announcements', label: 'Platform duyuruları ve güncellemeler' },
      { id: 'newsletter', label: 'Haftalık hangel bülteni' },
      { id: 'social', label: 'Sosyal etkileşimler (beğeni, yorum vb.)' },
    ],
  },
];

export default function NotificationSettingsPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">Bildirim Ayarları</h1>
        <p className="text-muted-foreground text-sm">Hangi konularda ve hangi kanallardan bildirim almak istediğinizi seçin.</p>
      </div>

      <div className="space-y-8">
        {notificationGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-end gap-4 pr-4">
                    <Bell className="h-5 w-5 text-muted-foreground" title="Anlık Bildirim" />
                    <Mail className="h-5 w-5 text-muted-foreground" title="E-posta" />
                    <MessageSquare className="h-5 w-5 text-muted-foreground" title="SMS" />
                </div>
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <label htmlFor={`${item.id}-push`} className="font-medium text-sm flex-1">{item.label}</label>
                    <div className="flex items-center gap-4">
                        <Switch id={`${item.id}-push`} defaultChecked />
                        <Switch id={`${item.id}-email`} />
                        <Switch id={`${item.id}-sms`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        <div className="flex justify-end">
            <Button>Değişiklikleri Kaydet</Button>
        </div>
    </div>
  );
}
