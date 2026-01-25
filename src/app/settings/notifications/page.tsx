'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Bell, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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

type NotificationSettings = {
    [key: string]: boolean;
};

const initialSettings: NotificationSettings = {
    'app-status-push': true, 'app-status-email': true, 'app-status-sms': false,
    'new-opportunity-push': true, 'new-opportunity-email': false, 'new-opportunity-sms': false,
    'event-reminder-push': true, 'event-reminder-email': true, 'event-reminder-sms': true,
    'donation-success-push': true, 'donation-success-email': true, 'donation-success-sms': false,
    'new-badge-push': true, 'new-badge-email': false, 'new-badge-sms': false,
    'impact-report-push': false, 'impact-report-email': true, 'impact-report-sms': false,
    'announcements-push': true, 'announcements-email': true, 'announcements-sms': false,
    'newsletter-push': false, 'newsletter-email': true, 'newsletter-sms': false,
    'social-push': true, 'social-email': false, 'social-sms': false,
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);

  const handleToggle = (id: string) => {
      setSettings(prev => ({...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    toast({
      title: "Ayarlar Kaydedildi",
      description: "Bildirim tercihleriniz başarıyla güncellendi.",
    });
  };

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
                        <Switch id={`${item.id}-push`} checked={settings[`${item.id}-push`]} onCheckedChange={() => handleToggle(`${item.id}-push`)} />
                        <Switch id={`${item.id}-email`} checked={settings[`${item.id}-email`]} onCheckedChange={() => handleToggle(`${item.id}-email`)} />
                        <Switch id={`${item.id}-sms`} checked={settings[`${item.id}-sms`]} onCheckedChange={() => handleToggle(`${item.id}-sms`)} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        <div className="flex justify-end">
            <Button onClick={handleSave}>Değişiklikleri Kaydet</Button>
        </div>
    </div>
  );
}
