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
  HeartHandshake,
  BarChart3,
  Shield,
  BookCopy,
  Bell,
  Settings,
  HelpCircle,
  LifeBuoy
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';

function HelpFeedbackButtons({ section, question }: { section: string; question: string }) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [saving, setSaving] = useState<null | 'up' | 'down'>(null);
  const [done, setDone] = useState(false);

  const record = async (helpful: boolean) => {
    if (!db || done || saving) return;
    setSaving(helpful ? 'up' : 'down');
    try {
      await addDoc(collection(db, COLLECTIONS.helpFeedback), {
        section,
        question,
        helpful,
        adminUid: user?.uid ?? null,
        createdAt: serverTimestamp(),
      });
      setDone(true);
      toast({ title: 'Teşekkürler', description: 'Geri bildiriminiz kaydedildi.' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Kaydedilemedi.';
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSaving(null);
    }
  };

  if (done) {
    return <p className="mt-2 text-xs text-muted-foreground">Geri bildiriminiz için teşekkürler.</p>;
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" disabled={saving !== null} onClick={() => record(true)}>
        {saving === 'up' ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ThumbsUp className="mr-1 h-3 w-3" />}
        Beğendim
      </Button>
      <Button variant="outline" size="sm" className="h-7 px-2 py-1 text-xs" disabled={saving !== null} onClick={() => record(false)}>
        {saving === 'down' ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ThumbsDown className="mr-1 h-3 w-3" />}
        Beğenmedim
      </Button>
    </div>
  );
}

const helpSections = [
  {
    title: "Başvuru Yönetimi",
    icon: FileText,
    content: "Bu bölümde, platforma katılmak için başvuran STK, marka ve öğrenci kulüplerinin başvurularını yönetebilirsiniz. 'Bekleyen Başvurular' sekmesinde yeni başvuruları inceleyebilir, 'Onayla' veya 'Reddet' butonlarını kullanarak kararınızı verebilirsiniz. 'Onaylananlar' sekmesinde ise geçmişte onayladığınız başvuruları görebilirsiniz.",
    qna: [
        { q: "Onaylanan bir başvuruyu geri alabilir miyim?", a: "Hayır, bir başvuru onaylandıktan sonra geri alınamaz. Ancak, onaylanan kuruluşu ilgili yönetim sayfasından (STK/Marka Yönetimi) bularak pasife alabilir veya silebilirsiniz." },
        { q: "Reddedilen bir başvuru tekrar değerlendirilebilir mi?", a: "Hayır, reddedilen bir başvuru tekrar değerlendirmeye alınmaz. Kuruluşun yeniden başvuru yapması gerekmektedir." }
    ]
  },
  {
    title: "Kullanıcı Yönetimi",
    icon: UserCog,
    content: "Platformdaki tüm bireysel kullanıcıları buradan görüntüleyebilir, arama yapabilir ve yönetebilirsiniz. Bir kullanıcının profilini düzenleme, hesabını geçici olarak askıya alma veya kalıcı olarak silme gibi işlemler bu bölümden yapılır.",
    qna: [
        { q: "Bir kullanıcının şifresini sıfırlayabilir miyim?", a: "Hayır, güvenlik nedeniyle yöneticiler kullanıcı şifrelerini sıfırlayamaz. Kullanıcının, giriş ekranındaki 'Şifremi Unuttum' bağlantısını kullanması gerekmektedir." }
    ]
  },
  {
    title: "STK, Marka ve Kulüp Yönetimi",
    icon: Building,
    content: "Platformda aktif olan tüm STK, marka ve öğrenci kulüplerinin listelerine bu menülerden ulaşabilirsiniz. Her bir kuruluş için profilini düzenleme, geçici olarak pasife alma veya platformdan tamamen kaldırma gibi işlemleri gerçekleştirebilirsiniz.",
     qna: [
        { q: "Bir kuruluşu 'pasife almak' ne anlama geliyor?", a: "Bir kuruluşu pasife almak, profilinin platformda geçici olarak görünmez hale gelmesi demektir. Bu süre zarfında kuruluş, kullanıcılar tarafından görüntülenemez ve yeni bağış veya gönüllü alamaz. Ancak tüm verileri saklanır ve dilediğiniz zaman tekrar 'aktif' hale getirebilirsiniz." }
    ]
  },
  {
    title: "Gönüllülük ve Gönderi Yönetimi",
    icon: HeartHandshake,
    content: "STK'lar tarafından oluşturulan gönüllülük ilanlarını ve platformda paylaşılan gönderileri bu bölümlerden denetleyebilirsiniz. 'Onay Bekleyenler' sekmesindeki içerikleri inceleyerek yayına alabilir veya reddedebilirsiniz. Yayındaki bir içeriği pasife almak veya silmek de mümkündür.",
     qna: [
        { q: "Bir gönderiyi neden reddetmeliyim?", a: "Platformun etik ilkelerine, yasalara aykırı olan, nefret söylemi, yanlış bilgi veya alakasız ticari reklam içeren gönderileri reddetmelisiniz." }
    ]
  },
  {
    title: "İstatistik ve Analizler",
    icon: BarChart3,
    content: "Platformun genel sağlık durumunu ve büyüme metriklerini bu sayfadan takip edebilirsiniz. Kullanıcı sayısı, bağış hacmi, gönüllülük saatleri gibi kritik verileri gösteren grafikler bulunur. Ayrıca, yapay zeka destekli gelecek tahminleri stratejik planlamanıza yardımcı olur.",
     qna: [
        { q: "Yapay zeka tahminleri ne kadar güvenilir?", a: "Tahminler, mevcut ve geçmiş verilere dayalı bir projeksiyondur ve kesinlik garantisi taşımaz. Stratejik planlama için bir referans noktası olarak kullanılmalıdır, ancak piyasa koşulları ve öngörülemeyen olaylar sonuçları etkileyebilir." }
    ]
  },
  {
    title: "Şeffaflık Yönetimi",
    icon: Shield,
    content: "STK ve kulüplerin şeffaflık puanlarını artırmak için yükledikleri yasal belgeler (faaliyet raporu, tüzük vb.) burada onayınıza sunulur. Belgeleri inceleyerek onaylayabilir veya ek bilgi talep ederek reddedebilirsiniz.",
     qna: [
        { q: "Bir belgeyi onaylamak ne anlama gelir?", a: "Bir belgeyi onaylamak, belgenin format olarak doğru olduğunu ve istenen bilgiyi içerdiğini teyit etmektir. Belgenin içeriğinin hukuki geçerliliğini denetlemek bu onayın kapsamı dışındadır." }
    ]
  },
  {
    title: "Kütüphane Yönetimi",
    icon: BookCopy,
    content: "Platformun 'Kütüphane' bölümünde yer alan tüm makale, rehber ve sözlük içeriklerini buradan yönetebilirsiniz. Yeni içerik ekleyebilir, mevcutları düzenleyebilir veya yayından kaldırabilirsiniz.",
     qna: [
        { q: "Kütüphaneye eklediğim içerik anında yayınlanır mı?", a: "Evet, Admin Paneli'nden eklediğiniz veya düzenlediğiniz kütüphane içerikleri, kaydedildikten sonra anında tüm kullanıcılar için görünür hale gelir." }
    ]
  },
  {
    title: "Bildirimler ve Bülten",
    icon: Bell,
    content: "Tüm kullanıcılara veya belirli segmentlere anlık bildirim (push notification) göndermek için bu bölümü kullanın. Ayrıca, haftalık veya aylık e-posta bültenlerinizi hazırlayıp gönderebilir, geçmiş gönderimlerin istatistiklerini (görüntülenme, tıklanma) inceleyebilirsiniz.",
     qna: [
        { q: "Yanlışlıkla gönderdiğim bir bildirimi geri alabilir miyim?", a: "Hayır, anlık bildirimler gönderildikten sonra geri alınamaz. Bu nedenle göndermeden önce içeriği ve hedef kitleyi dikkatlice kontrol etmeniz çok önemlidir." }
    ]
  },
  {
    title: "Panel Ayarları",
    icon: Settings,
    content: "Platformun genel işleyişini etkileyen temel ayarları buradan yapılandırabilirsiniz. Puanlama katsayıları (örn: 1 saat gönüllülük kaç puan eder?) veya yapay zeka özelliklerinin aktif olup olmaması gibi kritik ayarlar bu panelde yer alır.",
     qna: [
        { q: "Puanlama katsayılarını değiştirmek mevcut puanları etkiler mi?", a: "Hayır, katsayıları değiştirmek, değişiklik yapıldıktan sonra kazanılacak puanları etkiler. Geçmişte kazanılmış olan puanlar değişmez." }
    ]
  },
  {
    title: "Destek Talepleri",
    icon: HelpCircle,
    content: "Kullanıcılardan ve kuruluşlardan gelen destek taleplerini bu ekrandan yönetebilirsiniz. 'Açık Talepler' sekmesindekilere yanıt verebilir, çözülen talepleri 'Cevaplananlar' bölümünde arşivleyebilirsiniz.",
     qna: [
        { q: "Bir destek talebine cevap verdiğimde kullanıcıya bildirim gider mi?", a: "Evet, bir talebe yanıt verdiğinizde ilgili kullanıcıya e-posta ve/veya anlık bildirim yoluyla bilgi verilir." }
    ]
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
                    <div className="prose prose-sm max-w-none text-muted-foreground border-t pt-4 space-y-4">
                      <p>{section.content}</p>
                      {section.qna && section.qna.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                            <h5 className="font-semibold text-foreground mb-2">Sıkça Sorulan Sorular</h5>
                            <div className="space-y-4">
                                {section.qna.map((item, qnaIndex) => (
                                    <div key={qnaIndex}>
                                        <p className="font-semibold text-foreground">S: {item.q}</p>
                                        <div className="pl-4">
                                            <p className="mt-1">C: {item.a}</p>
                                            <HelpFeedbackButtons section={section.title} question={item.q} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
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
  );
}
