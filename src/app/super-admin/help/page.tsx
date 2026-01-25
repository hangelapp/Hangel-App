'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  FileText,
  UserCog,
  Building,
  Store,
  School,
  HeartHandshake,
  Newspaper,
  BarChart3,
  Shield,
  BookCopy,
  Bell,
  Settings,
  HelpCircle,
  LifeBuoy
} from 'lucide-react';

const helpSections = [
  {
    title: "Başvuru Yönetimi",
    icon: FileText,
    content: "Bu bölümde, platforma katılmak için başvuran STK, marka ve öğrenci kulüplerinin başvurularını yönetebilirsiniz. 'Bekleyen Başvurular' sekmesinde yeni başvuruları inceleyebilir, 'Onayla' veya 'Reddet' butonlarını kullanarak kararınızı verebilirsiniz. 'Onaylananlar' sekmesinde ise geçmişte onayladığınız başvuruları görebilirsiniz."
  },
  {
    title: "Kullanıcı Yönetimi",
    icon: UserCog,
    content: "Platformdaki tüm bireysel kullanıcıları buradan görüntüleyebilir, arama yapabilir ve yönetebilirsiniz. Bir kullanıcının profilini düzenleme, hesabını geçici olarak askıya alma veya kalıcı olarak silme gibi işlemler bu bölümden yapılır."
  },
  {
    title: "STK, Marka ve Kulüp Yönetimi",
    icon: Building,
    content: "Platformda aktif olan tüm STK, marka ve öğrenci kulüplerinin listelerine bu menülerden ulaşabilirsiniz. Her bir kuruluş için profilini düzenleme, geçici olarak pasife alma veya platformdan tamamen kaldırma gibi işlemleri gerçekleştirebilirsiniz."
  },
  {
    title: "Gönüllülük ve Gönderi Yönetimi",
    icon: HeartHandshake,
    content: "STK'lar tarafından oluşturulan gönüllülük ilanlarını ve platformda paylaşılan gönderileri bu bölümlerden denetleyebilirsiniz. 'Onay Bekleyenler' sekmesindeki içerikleri inceleyerek yayına alabilir veya reddedebilirsiniz. Yayındaki bir içeriği pasife almak veya silmek de mümkündür."
  },
  {
    title: "İstatistik ve Analizler",
    icon: BarChart3,
    content: "Platformun genel sağlık durumunu ve büyüme metriklerini bu sayfadan takip edebilirsiniz. Kullanıcı sayısı, bağış hacmi, gönüllülük saatleri gibi kritik verileri gösteren grafikler bulunur. Ayrıca, yapay zeka destekli gelecek tahminleri stratejik planlamanıza yardımcı olur."
  },
  {
    title: "Şeffaflık Yönetimi",
    icon: Shield,
    content: "STK ve kulüplerin şeffaflık puanlarını artırmak için yükledikleri yasal belgeler (faaliyet raporu, tüzük vb.) burada onayınıza sunulur. Belgeleri inceleyerek onaylayabilir veya ek bilgi talep ederek reddedebilirsiniz."
  },
  {
    title: "Kütüphane Yönetimi",
    icon: BookCopy,
    content: "Platformun 'Kütüphane' bölümünde yer alan tüm makale, rehber ve sözlük içeriklerini buradan yönetebilirsiniz. Yeni içerik ekleyebilir, mevcutları düzenleyebilir veya yayından kaldırabilirsiniz."
  },
  {
    title: "Bildirimler ve Bülten",
    icon: Bell,
    content: "Tüm kullanıcılara veya belirli segmentlere anlık bildirim (push notification) göndermek için bu bölümü kullanın. Ayrıca, haftalık veya aylık e-posta bültenlerinizi hazırlayıp gönderebilir, geçmiş gönderimlerin istatistiklerini (görüntülenme, tıklanma) inceleyebilirsiniz."
  },
  {
    title: "Panel Ayarları",
    icon: Settings,
    content: "Platformun genel işleyişini etkileyen temel ayarları buradan yapılandırabilirsiniz. Puanlama katsayıları (örn: 1 saat gönüllülük kaç puan eder?) veya yapay zeka özelliklerinin aktif olup olmaması gibi kritik ayarlar bu panelde yer alır."
  },
  {
    title: "Destek Talepleri",
    icon: HelpCircle,
    content: "Kullanıcılardan ve kuruluşlardan gelen destek taleplerini bu ekrandan yönetebilirsiniz. 'Açık Talepler' sekmesindekilere yanıt verebilir, çözülen talepleri 'Cevaplananlar' bölümünde arşivleyebilirsiniz."
  }
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
          <LifeBuoy className="h-7 w-7" />
          Admin Paneli Yardım Merkezi
        </h1>
        <p className="text-muted-foreground">
          Admin panelinin kullanımıyla ilgili sıkça sorulan sorular ve kılavuzlar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Yönetim Modülleri</CardTitle>
          <CardDescription>
            Her bir yönetim modülünün ne işe yaradığını ve nasıl kullanılacağını öğrenmek için başlıklara tıklayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full space-y-2">
            {helpSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 bg-background/50">
                  <AccordionTrigger className="hover:no-underline text-left">
                    <div className="flex items-center gap-3 font-semibold">
                      <Icon className="h-5 w-5 text-primary" />
                      {section.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="prose prose-sm max-w-none text-muted-foreground border-t pt-4">
                      <p>{section.content}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
