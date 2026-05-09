'use client';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Mail, ChevronRight, UserCog, QrCode, Bell, Newspaper, Sparkles, ShieldCheck,
  HeartHandshake, BarChart3, DollarSign, HandCoins, Globe, MessageSquare, Megaphone,
  Calendar, Video, Palette, CreditCard, Target, Calculator, Database, PhoneCall,
  Building2, GraduationCap, MapPin, MessageCircle, ShoppingCart, Briefcase, Network,
  LineChart, Users as UsersIcon, Settings, HelpCircle, Send, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type Topic = {
  id: string;
  href?: string;
  icon: any;
  label: string;
  description: string;
  hint: string;
};

type Section = {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
};

const sections: Section[] = [
  {
    id: 'profile',
    title: 'Profil & Tanıtım',
    description: 'Kuruluşunuzun kimliği ve görünürlüğü.',
    topics: [
      { id: 'manage-profile', href: '/ngo-admin/manage-profile', icon: UserCog, label: 'Profili Güncelle', description: 'Logo, kapak, açıklama, iletişim bilgileri ve faaliyet alanlarını düzenleyin.', hint: 'Logo ve kapak görselinin doğru oranda olması (4:1 önerilir) profil kalitesini artırır.' },
      { id: 'qr', href: '/ngo-admin/qr', icon: QrCode, label: 'STK Profil QR Kodu', description: 'Kurumsal profilinize hızlı erişim için QR kodu üretin ve indirin.', hint: 'Etkinliklerinizde basılı materyalde kullanmak için QR kodu indirebilirsiniz.' },
      { id: 'website', href: '/ngo-admin/website', icon: Globe, label: 'Web Sitesi Yönetimi', description: 'Sayfa içerikleri, projeler, etkinlikler ve gönüllü çağrılarını mini sitenizden yönetin.', hint: 'Önizleme modu yayına almadan tüm değişiklikleri görmenizi sağlar.' },
    ],
  },
  {
    id: 'community',
    title: 'Topluluk & İletişim',
    description: 'Destekçileriniz ve takipçilerinizle bağlantı.',
    topics: [
      { id: 'notifications', href: '/ngo-admin/notifications', icon: Bell, label: 'Gelen Kutusu', description: 'Sistem bildirimleri, başvuru bildirimleri ve takipçi mesajlarını takip edin.', hint: 'Bildirimleri okundu işaretlediğinizde geçmişte aratılabilir kalır.' },
      { id: 'posts', href: '/ngo-admin/posts', icon: Newspaper, label: 'Gönderiler', description: 'Zaman tüneline gönderi paylaşın, mevcut paylaşımlarınızı düzenleyin/silin.', hint: 'Görsel önerisi yakında eklenecek; şu an metin paylaşımları desteklenir.' },
      { id: 'impact-story', href: '/ngo-admin/impact-story', icon: Sparkles, label: 'Etki Hikayem', description: 'Kuruluşunuzun verilerinden otomatik üretilen instagram-tarzı etki hikayeleri.', hint: 'Hikayeler, bağış / gönüllü / ilan / paylaşım sayılarınız üzerinden otomatik üretilir.' },
    ],
  },
  {
    id: 'volunteering',
    title: 'Gönüllülük',
    description: 'İlanlar ve gönüllü topluluk yönetimi.',
    topics: [
      { id: 'volunteer', href: '/ngo-admin/volunteer', icon: HeartHandshake, label: 'Gönüllülük Yönetimi', description: 'Gönüllülük ilanlarınızı yayınlayın, başvuruları yönetin.', hint: 'Yeni ilan oluştururken il/ilçe/mahalle çoktan seçmelidir; birden fazla bölge eklenebilir.' },
      { id: 'demographics', href: '/ngo-admin/demographics', icon: BarChart3, label: 'Demografi Analizi', description: 'Gönüllü ve bağışçı topluluğunuzun yaş, cinsiyet, şehir ve ilgi alanlarına göre kırılımı.', hint: 'Veriler yalnızca yönettiğiniz varlık üzerinden filtrelenir.' },
    ],
  },
  {
    id: 'finance',
    title: 'Mali Yönetim',
    description: 'Bağış, hibe ve şeffaflık.',
    topics: [
      { id: 'donations', href: '/ngo-admin/donations', icon: DollarSign, label: 'Bağış Takibi', description: 'Affiliate market üzerinden gelen bağışları, hakediş aşamalarını ve geçmişi inceleyin.', hint: 'Bağışlar 72 günlük periyodun ardından "Yatırıldı" olarak işaretlenir.' },
      { id: 'funds', href: '/ngo-admin/funds', icon: HandCoins, label: 'Hibeler ve Fonlar', description: 'Açık çağrıları ve başvurabileceğiniz hibe / fon programlarını takip edin.', hint: 'Süper admin tarafından yayımlanan hibe listesi otomatik güncellenir.' },
      { id: 'transparency', href: '/ngo-admin/transparency', icon: ShieldCheck, label: 'Şeffaflık Endeksi', description: 'Hesap verme / şeffaflık endeksi göstergelerinizi yönetin.', hint: 'Eklediğiniz her şeffaflık girişi profil kalitenizi yükseltir.' },
    ],
  },
  {
    id: 'admin',
    title: 'Hesap & Yetki',
    description: 'Panel yönetimi ve erişim kontrolü.',
    topics: [
      { id: 'users', href: '/ngo-admin/users', icon: UsersIcon, label: 'Yetkili Yönetimi', description: 'Kuruluşunuza ek yetkili davet edin, rolleri tanımlayın ve yetkileri yönetin.', hint: 'Roller: Genel Yönetici, Finans Yöneticisi, Gönüllü Yöneticisi, Mini Blog Yöneticisi.' },
      { id: 'settings', href: '/ngo-admin/settings', icon: Settings, label: 'Panel Ayarları', description: 'Bildirim tercihleri, dil, gizlilik ve panel görünümü ayarları.', hint: '' },
    ],
  },
  {
    id: 'coming-soon',
    title: 'Yakında',
    description: 'Geliştirme aşamasındaki modüller — entegrasyon planlarını şimdiden kurgulayabilirsiniz.',
    topics: [
      { id: 'sms', icon: MessageSquare, label: 'SMS Gönderimi', description: 'Toplu SMS bildirim altyapısı.', hint: 'Tedarikçi entegrasyonu yakında.' },
      { id: 'mail', icon: Mail, label: 'Mail Gönderimi', description: 'Bülten ve toplu mail gönderim altyapısı.', hint: '' },
      { id: 'ads', icon: Megaphone, label: 'Reklam Yönetimi', description: 'Hangel içi sponsorlu içerik ve kampanya yönetimi.', hint: '' },
      { id: 'events', icon: Calendar, label: 'Etkinlik Yönetimi', description: 'Yüz yüze ve online etkinliklerinizi yönetin.', hint: '' },
      { id: 'online-meeting', icon: Video, label: 'Online Eğitim/Toplantı Araçları', description: 'Zoom benzeri toplantı araçları entegrasyonu.', hint: '' },
      { id: 'design-tools', icon: Palette, label: 'Tasarım Programları', description: 'Canva, Figma vb. entegrasyonları.', hint: '' },
      { id: 'payment-systems', icon: CreditCard, label: 'POS & Ödeme Sistemleri', description: 'Kuruluş için ödeme/POS sistemi entegrasyonu.', hint: '' },
      { id: 'marketing', icon: Target, label: 'Pazarlama İletişimi', description: 'Kampanya planlama ve dağıtım.', hint: '' },
      { id: 'accounting', icon: Calculator, label: 'Ön Muhasebe', description: 'Fatura, giderler ve mali durum.', hint: '' },
      { id: 'crm', icon: Database, label: 'CRM Yönetimi', description: 'Destekçi ve gönüllü CRM altyapısı.', hint: '' },
      { id: 'virtual-pbx', icon: PhoneCall, label: 'Sanal Santral Yönetimi', description: 'Bulut santral entegrasyonu.', hint: '' },
      { id: 'virtual-office', icon: Building2, label: 'Sanal ve Fiziki Ofis', description: 'Ofis araçları & abonelik yönetimi.', hint: '' },
      { id: 'university-volunteering', icon: GraduationCap, label: 'Üniversite Gönüllülük Dersi', description: 'Üniversite işbirlikleri ile gönüllülük dersi.', hint: '' },
      { id: 'field-team', icon: MapPin, label: 'Saha Ekip Yönetimi', description: 'Saha çalışanı planlama ve takip.', hint: '' },
      { id: 'dm', icon: MessageCircle, label: 'DM Mesajlaşma', description: 'Bireysel mesajlaşma yönetimi.', hint: '' },
      { id: 'ecommerce', icon: ShoppingCart, label: 'İktisadi İşletme Yönetimi', description: 'STK iktisadi işletmeleri için e-ticaret altyapısı.', hint: '' },
      { id: 'hr-integration', icon: Briefcase, label: 'İK Şirketleri Entegrasyonu', description: 'İnsan kaynakları portalları ile entegrasyon.', hint: '' },
      { id: 'volunteer-portal', icon: Network, label: 'Gönüllülük Portalı Entegrasyonu', description: 'Diğer gönüllülük portalları ile veri paylaşımı.', hint: '' },
      { id: 'analytics-tools', icon: LineChart, label: 'Web Analiz Araçları', description: 'GA, Mixpanel vb. analiz entegrasyonları.', hint: '' },
    ],
  },
];

const allTopics: Array<Topic & { sectionTitle: string }> = sections.flatMap(s =>
  s.topics.map(t => ({ ...t, sectionTitle: s.title })),
);

export default function NgoSupportPage() {
  const [search, setSearch] = useState('');
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map(section => ({
        ...section,
        topics: section.topics.filter(t =>
          t.label.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.hint.toLowerCase().includes(q),
        ),
      }))
      .filter(s => s.topics.length > 0);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      toast({ variant: 'destructive', title: 'Konu seçin', description: 'Lütfen destek talebinizin konusunu seçin.' });
      return;
    }
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'Mesaj boş olamaz' });
      return;
    }
    if (!db) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supportTickets'), {
        subject,
        message: message.trim(),
        userId: authUser?.uid || null,
        userEmail: authUser?.email || null,
        userName: authUser?.displayName || null,
        source: 'ngo-admin',
        status: 'open',
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Destek talebiniz alındı', description: 'Ekibimiz en kısa sürede dönüş yapacaktır.' });
      setSubject('');
      setMessage('');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: err?.message || 'Beklenmeyen bir hata oluştu.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
          <HelpCircle className="h-3.5 w-3.5" /> Destek Merkezi
        </div>
        <h1 className="text-3xl font-bold font-headline">Yönetim Paneli Destek</h1>
        <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
          Yönetim panelinin tüm bölümlerine hızlı kılavuz. Aradığınızı bulamadıysanız aşağıdaki form ile bize ulaşın.
        </p>
      </div>

      <div className="relative mx-auto max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Konu, modül adı veya kısa anahtar kelime arayın..."
          className="pl-12 h-12 text-base"
        />
      </div>

      {filteredSections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto opacity-30 mb-3" />
            Aradığınız konu bulunamadı.
          </CardContent>
        </Card>
      ) : (
        filteredSections.map(section => (
          <div key={section.id} className="space-y-3">
            <div>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <Card>
              <CardContent className="p-0">
                <Accordion type="multiple" className="w-full">
                  {section.topics.map(topic => {
                    const Icon = topic.icon;
                    return (
                      <AccordionItem value={topic.id} key={topic.id} className="border-b last:border-b-0">
                        <AccordionTrigger className="p-4 text-base hover:no-underline">
                          <div className="flex items-center gap-4 text-left">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{topic.label}</p>
                              <p className="text-xs text-muted-foreground font-normal mt-0.5">{topic.description}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="border-t pt-4 space-y-4 text-sm text-muted-foreground">
                            <p>{topic.description}</p>
                            {topic.hint && (
                              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs">
                                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <span>{topic.hint}</span>
                              </div>
                            )}
                            {topic.href ? (
                              <Button asChild size="sm" variant="outline" className="rounded-full">
                                <Link href={topic.href}>{topic.label} sayfasına git <ChevronRight className="ml-1 h-4 w-4" /></Link>
                              </Button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">Yakında</span>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        ))
      )}

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-xl font-bold text-center">Aradığınızı Bulamadınız mı?</h3>
        <Card>
          <CardHeader>
            <CardTitle>Destek Talebi Oluştur</CardTitle>
            <CardDescription>
              Aklınıza takılanları, önerilerinizi veya yaşadığınız sorunları bize iletin. Ekibimiz en kısa sürede size geri dönüş yapacaktır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="support-subject">Konu</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="support-subject">
                    <SelectValue placeholder="Bir konu seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allTopics.map(t => (
                      <SelectItem key={t.id} value={`${t.sectionTitle}: ${t.label}`}>
                        {t.sectionTitle} — {t.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="Teknik Sorun">Teknik Sorun</SelectItem>
                    <SelectItem value="Öneri ve Geri Bildirim">Öneri ve Geri Bildirim</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-message">Mesajınız</Label>
                <Textarea
                  id="support-message"
                  placeholder="Lütfen mesajınızı buraya yazın..."
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Gönder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
