'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, MessageSquare } from 'lucide-react';

const notificationGroups = [
  {
    title: 'Gönüllülük ve Başvurular',
    description: 'Gönüllülük ilanları ve başvurularınızla ilgili tüm bildirimler.',
    items: [
      { id: 'new-volunteer-app', label: 'Yeni gönüllü başvurusu geldiğinde' },
      { id: 'opportunity-expiring', label: 'İlanınızın süresi dolmak üzereyken' },
      { id: 'volunteer-feedback', label: 'Tamamlanan bir gönüllülük için geri bildirim alındığında' },
    ],
  },
  {
    title: 'Bağış ve Finansal',
    description: 'Kuruluşunuza yapılan bağışlar, hak edişler ve finansal işlemlerle ilgili bildirimler.',
    items: [
      { id: 'new-donation', label: 'Yeni bir bağış yapıldığında' },
      { id: 'monthly-payout', label: 'Aylık hak ediş tamamlandığında' },
      { id: 'payment-failed', label: 'Hak ediş ödemesi başarısız olduğunda' },
    ],
  },
   {
    title: 'Etkileşim ve Topluluk',
    description: 'Profiliniz ve gönderilerinizle ilgili sosyal etkileşimler.',
    items: [
      { id: 'new-follower', label: 'Yeni bir takipçi kazandığınızda' },
      { id: 'post-comment', label: 'Gönderinize yeni bir yorum yapıldığında' },
      { id: 'post-like', label: 'Gönderiniz beğenildiğinde' },
    ],
  },
  {
    title: 'Hesap ve Yönetim',
    description: 'Hesap güvenliği, panel yönetimi ve platform güncellemeleri.',
    items: [
      { id: 'new-panel-user', label: 'Panele yeni bir yetkili eklendiğinde' },
      { id: 'support-reply', label: 'Destek talebinize yanıt geldiğinde' },
      { id: 'transparency-alert', label: 'Şeffaflık puanınız kritik seviyeye düştüğünde' },
      { id: 'announcements', label: 'Hangel platform duyuruları ve güncellemeleri' },
    ],
  },
];

export default function NgoNotificationSettingsPage() {

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
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
