'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import {
    collection, getDocs, doc, updateDoc, setDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { Loader2, CheckCircle2, AlertCircle, Wrench, Database, Film } from 'lucide-react';

export default function MaintenancePage() {
    const db = useFirestore();
    const { toast } = useToast();

    const [running, setRunning] = useState<string | null>(null);
    const [logs, setLogs] = useState<{ type: 'info' | 'ok' | 'err'; text: string }[]>([]);

    const log = (type: 'info' | 'ok' | 'err', text: string) =>
        setLogs(prev => [...prev, { type, text }]);

    // 1) Kullanıcılarda createdAt eksikse backfill et
    //    - createdAt yoksa: joinDate'den (varsa) Timestamp üret, aksi halde şimdiki zaman
    const backfillCreatedAt = async () => {
        if (!db) return;
        setRunning('createdAt');
        setLogs([]);
        log('info', 'Kullanıcı koleksiyonu taranıyor...');
        try {
            const snap = await getDocs(collection(db, 'users'));
            log('info', `${snap.size} kullanıcı bulundu.`);

            let updated = 0;
            let skipped = 0;
            let failed = 0;

            for (const d of snap.docs) {
                const data = d.data();
                if (data.createdAt) { skipped++; continue; }

                let createdAt: ReturnType<typeof serverTimestamp> | Timestamp = serverTimestamp();
                const jd = data.joinDate;
                if (typeof jd === 'string' && /^\d{4}-\d{2}-\d{2}/.test(jd)) {
                    const parsed = new Date(jd);
                    if (!Number.isNaN(parsed.getTime())) {
                        createdAt = Timestamp.fromDate(parsed);
                    }
                }
                try {
                    await updateDoc(doc(db, 'users', d.id), { createdAt });
                    updated++;
                } catch (e) {
                    failed++;
                    console.error(`Backfill failed for ${d.id}:`, e);
                }
            }

            log('ok', `Tamamlandı: ${updated} güncellendi, ${skipped} zaten vardı, ${failed} hata.`);
            toast({ title: 'Backfill tamamlandı', description: `${updated} kullanıcıya createdAt eklendi.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata';
            log('err', message);
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setRunning(null);
        }
    };

    // 2) Library'ye "Filmler" bölümünü tohumla (mevcut item'ları korur)
    const seedFilmler = async () => {
        if (!db) return;
        setRunning('filmler');
        setLogs([]);
        log('info', '"filmler" bölümü oluşturuluyor / güncelleniyor...');
        try {
            const films = [
                {
                    slug: 'film-the-pursuit-of-happyness', title: 'The Pursuit of Happyness (2006)',
                    content: '<p>Bir babanın oğluyla evsiz kalması ve borsa stajından çıkmak için verdiği mücadele.</p><ul><li><strong>Yönetmen:</strong> Gabriele Muccino</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2006</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Yoksulluk & Umut</li><li><strong>Duygu:</strong> Azim, Umut, İnsanlık</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li><li><strong>Hangel Aksiyonu:</strong> Farkındalık</li></ul>',
                },
                {
                    slug: 'film-spotlight', title: 'Spotlight (2015)',
                    content: '<p>Boston Globe gazetesinin kilise istismar haberlerini ortaya çıkaran araştırma süreci.</p><ul><li><strong>Yönetmen:</strong> Tom McCarthy</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2015</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Gazetecilik & Adalet</li><li><strong>Duygu:</strong> Adalet, Gerçeklerin Ortaya Çıkması, Vicdan</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-i-daniel-blake', title: 'I, Daniel Blake (2016)',
                    content: '<p>Sosyal yardım sistemiyle uğraşan yaşlı bir marangozun hikayesi.</p><ul><li><strong>Yönetmen:</strong> Ken Loach</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2016</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Yoksulluk & Umut</li><li><strong>Duygu:</strong> Sistem Eleştirisi, Dayanışma, İnsanlık</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-parasite', title: 'Parasite / Parazit (2019)',
                    content: '<p>Sınıf eşitsizliğini Güney Kore ailesi üzerinden anlatan kara mizah.</p><ul><li><strong>Yönetmen:</strong> Bong Joon-ho</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2019</li><li><strong>Dil:</strong> Korece</li><li><strong>Ülke:</strong> Güney Kore</li><li><strong>Kategori:</strong> Sosyal Eşitsizlik</li><li><strong>Duygu:</strong> Sistem Eleştirisi, Sarsıcı, Toplumsal Farkındalık</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-children-of-heaven', title: 'Children of Heaven / Cennetin Çocukları (1997)',
                    content: '<p>Bir çift ayakkabı paylaşmak zorunda kalan iki kardeşin hikayesi.</p><ul><li><strong>Yönetmen:</strong> Majid Majidi</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 1997</li><li><strong>Dil:</strong> Farsça</li><li><strong>Ülke:</strong> Çok Uluslu</li><li><strong>Kategori:</strong> Çocuk Hakları</li><li><strong>Duygu:</strong> Sevgi, Dayanışma, Kayıp</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-the-intouchables', title: 'The Intouchables / Can Dostum (2011)',
                    content: '<p>Tetraplejik bir aristokrat ile bakıcısı arasındaki sıra dışı dostluk.</p><ul><li><strong>Yönetmen:</strong> Olivier Nakache, Éric Toledano</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2011</li><li><strong>Dil:</strong> Fransızca</li><li><strong>Ülke:</strong> Fransa</li><li><strong>Kategori:</strong> Fiziksel Engellilik</li><li><strong>Duygu:</strong> Dostluk, Kabul, Sevgi</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-the-theory-of-everything', title: 'The Theory of Everything (2014)',
                    content: '<p>Stephen Hawking\'in ALS hastalığıyla yaşam mücadelesi.</p><ul><li><strong>Yönetmen:</strong> James Marsh</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2014</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> ALS & Nörolojik Hastalık</li><li><strong>Duygu:</strong> Azim, Sevgi, İlham</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-rain-man', title: 'Rain Man (1988)',
                    content: '<p>Otizm spektrumundaki ağabey ile kardeşinin yolculuğu.</p><ul><li><strong>Yönetmen:</strong> Barry Levinson</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 1988</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Otizm & Nöroçeşitlilik</li><li><strong>Duygu:</strong> Kabul, Aile, Empati</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-the-miracle-worker', title: 'The Miracle Worker (1962)',
                    content: '<p>Helen Keller\'ın sağır-kör doğumunun ardından öğretmeniyle çıktığı yolculuk.</p><ul><li><strong>Yönetmen:</strong> Arthur Penn</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 1962</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Sağır & İşitme Engeli</li><li><strong>Duygu:</strong> Azim, İlham, Mücadele</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-mary-and-max', title: 'Mary and Max (2009)',
                    content: '<p>Asperger sendromlu Max ile küçük Mary\'nin mektup arkadaşlığı.</p><ul><li><strong>Yönetmen:</strong> Adam Elliot</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2009</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Otizm & Nöroçeşitlilik</li><li><strong>Duygu:</strong> Yalnızlık, Dostluk, Kabul</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-life-is-beautiful', title: 'Life Is Beautiful / Hayat Güzeldir (1997)',
                    content: '<p>İkinci Dünya Savaşı\'nda toplama kampındaki bir babanın oğlunu korumak için yarattığı oyun.</p><ul><li><strong>Yönetmen:</strong> Roberto Benigni</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 1997</li><li><strong>Dil:</strong> İtalyanca</li><li><strong>Ülke:</strong> İtalya</li><li><strong>Kategori:</strong> Hayatta Kalma</li><li><strong>Duygu:</strong> Sevgi, Hayatta Kalma, Umut</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-the-kite-runner', title: 'The Kite Runner / Uçurtma Avcısı (2007)',
                    content: '<p>Afgan göçmen bir adamın çocukluk arkadaşına olan borcunu ödemek için Afganistan\'a dönüşü.</p><ul><li><strong>Yönetmen:</strong> Marc Forster</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2007</li><li><strong>Dil:</strong> Çok Dilli</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Mülteci & Kimlik</li><li><strong>Duygu:</strong> Vicdan, Travma, Cesaret</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-blood-diamond', title: 'Blood Diamond / Kanlı Elmas (2006)',
                    content: '<p>Sierra Leone iç savaşında elmas ticaretinin etik boyutu.</p><ul><li><strong>Yönetmen:</strong> Edward Zwick</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2006</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> İşçi Hakları</li><li><strong>Duygu:</strong> Adalet, Sarsıcı, Mücadele</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-mustang', title: 'Mustang (2015)',
                    content: '<p>Türkiye\'de bir köyde yetişen beş kız kardeşin özgürlük arayışı.</p><ul><li><strong>Yönetmen:</strong> Deniz Gamze Ergüven</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2015</li><li><strong>Dil:</strong> Türkçe</li><li><strong>Ülke:</strong> Türkiye</li><li><strong>Kategori:</strong> Sosyal Eşitsizlik</li><li><strong>Duygu:</strong> Özgürlük, Bağımsızlık, Toplumsal Farkındalık</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-an-inconvenient-truth', title: 'An Inconvenient Truth (2006)',
                    content: '<p>Al Gore\'un iklim krizi üzerine sunumu — modern çevre belgeselciliğinin kilometre taşı.</p><ul><li><strong>Yönetmen:</strong> Davis Guggenheim</li><li><strong>Tür:</strong> Belgesel (Film)</li><li><strong>Yıl:</strong> 2006</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> İklim Krizi</li><li><strong>Duygu:</strong> Toplumsal Farkındalık, Aktivizm</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-seaspiracy', title: 'Seaspiracy (2021)',
                    content: '<p>Endüstriyel balıkçılığın çevresel ve etik boyutunu sorgulayan belgesel.</p><ul><li><strong>Yönetmen:</strong> Ali Tabrizi</li><li><strong>Tür:</strong> Belgesel (Film)</li><li><strong>Yıl:</strong> 2021</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Çevre</li><li><strong>Duygu:</strong> Sarsıcı, Toplumsal Farkındalık, Aktivizm</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-13th', title: '13th (2016)',
                    content: '<p>ABD\'de ırkçılığın ve hapis sisteminin tarihsel analizi.</p><ul><li><strong>Yönetmen:</strong> Ava DuVernay</li><li><strong>Tür:</strong> Belgesel (Film)</li><li><strong>Yıl:</strong> 2016</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Irkçılık & İnsan Hakları</li><li><strong>Duygu:</strong> Adalet, Sistem Eleştirisi, Aktivizm</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-fire-of-love', title: 'Fire of Love (2022)',
                    content: '<p>Volkanolojist çift Katia ve Maurice Krafft\'ın hayatına dair belgesel.</p><ul><li><strong>Yönetmen:</strong> Sara Dosa</li><li><strong>Tür:</strong> Belgesel (Film)</li><li><strong>Yıl:</strong> 2021</li><li><strong>Dil:</strong> Fransızca</li><li><strong>Ülke:</strong> Çok Uluslu</li><li><strong>Kategori:</strong> Kültür & Umut</li><li><strong>Duygu:</strong> Sevgi, İlham</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-our-planet', title: 'Our Planet (2019)',
                    content: '<p>Doğa ve iklim krizi üzerine BBC/Netflix belgesel dizisi.</p><ul><li><strong>Yönetmen:</strong> Alastair Fothergill</li><li><strong>Tür:</strong> Belgesel (Dizi)</li><li><strong>Yıl:</strong> 2019</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Çevre</li><li><strong>Duygu:</strong> Toplumsal Farkındalık, Umut</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-the-square', title: 'The Square / Meydan (2013)',
                    content: '<p>Mısır devriminin Tahrir Meydanı üzerinden anlatımı.</p><ul><li><strong>Yönetmen:</strong> Jehane Noujaim</li><li><strong>Tür:</strong> Belgesel (Film)</li><li><strong>Yıl:</strong> 2013</li><li><strong>Dil:</strong> Arapça</li><li><strong>Ülke:</strong> Çok Uluslu</li><li><strong>Kategori:</strong> Hak Mücadelesi</li><li><strong>Duygu:</strong> Cesaret, Aktivizm, Adalet</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-human-flow', title: 'Human Flow (2017)',
                    content: '<p>Ai Weiwei\'nin küresel mülteci krizine dair sanat-belgesel çalışması.</p><ul><li><strong>Yönetmen:</strong> Ai Weiwei</li><li><strong>Tür:</strong> Belgesel (Film)</li><li><strong>Yıl:</strong> 2017</li><li><strong>Dil:</strong> Çok Dilli</li><li><strong>Ülke:</strong> Çok Uluslu</li><li><strong>Kategori:</strong> Mülteci & Göç</li><li><strong>Duygu:</strong> İnsanlık, Kayıp, Dayanışma</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li></ul>',
                },
                {
                    slug: 'film-pad-man', title: 'Pad Man (2018)',
                    content: '<p>Hindistan\'da uygun fiyatlı hijyenik ped üreten Arunachalam Muruganantham\'ın hikayesi.</p><ul><li><strong>Yönetmen:</strong> R. Balki</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2018</li><li><strong>Dil:</strong> Hintçe</li><li><strong>Ülke:</strong> Hindistan</li><li><strong>Kategori:</strong> Sosyal Tabu & Sosyal Girişim</li><li><strong>Duygu:</strong> İnovasyon, Kabul, Toplumsal Farkındalık</li><li><strong>İçerik Türü:</strong> Gerçek Hikaye</li><li><strong>Hangel Aksiyonu:</strong> Farkındalık</li></ul>',
                },
                {
                    slug: 'film-the-help', title: 'The Help (2011)',
                    content: '<p>1960\'larda Mississippi\'de siyahi ev hizmetlilerinin hikayelerini anlatan kitap.</p><ul><li><strong>Yönetmen:</strong> Tate Taylor</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2011</li><li><strong>Dil:</strong> İngilizce</li><li><strong>Ülke:</strong> ABD / İngilizce Yapımlar</li><li><strong>Kategori:</strong> Irkçılık & İnsan Hakları</li><li><strong>Duygu:</strong> Cesaret, Adalet, Dayanışma</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-koe-no-katachi', title: 'A Silent Voice / Koe no Katachi (2016)',
                    content: '<p>İşitme engelli bir kız ile zorbalık geçmişine sahip bir gencin yeniden bağlanması.</p><ul><li><strong>Yönetmen:</strong> Naoko Yamada</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2016</li><li><strong>Dil:</strong> Japonca</li><li><strong>Ülke:</strong> Japonya</li><li><strong>Kategori:</strong> Sağır & İşitme Engeli</li><li><strong>Duygu:</strong> Travma, Kabul, Empati</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
                {
                    slug: 'film-the-worst-person-in-the-world', title: 'The Worst Person in the World (2021)',
                    content: '<p>Otuzlu yaşlardaki Julie\'nin kimlik arayışı.</p><ul><li><strong>Yönetmen:</strong> Joachim Trier</li><li><strong>Tür:</strong> Film</li><li><strong>Yıl:</strong> 2021</li><li><strong>Dil:</strong> Norveççe</li><li><strong>Ülke:</strong> Norveç</li><li><strong>Kategori:</strong> Kimlik Arayışı</li><li><strong>Duygu:</strong> Kimlik Arayışı, Bağımsızlık, Yalnızlık</li><li><strong>İçerik Türü:</strong> Kurgu</li></ul>',
                },
            ];

            await setDoc(
                doc(db, 'library', 'filmler'),
                {
                    slug: 'filmler',
                    title: 'Filmler',
                    description: 'Sosyal etki, insan hakları ve toplumsal farkındalık temalı film ve belgeseller.',
                    icon: 'Film',
                    items: films,
                },
                { merge: true },
            );

            log('ok', `${films.length} film eklendi/güncellendi.`);
            toast({ title: 'Filmler tohumlandı', description: `${films.length} kayıt yüklendi.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata';
            log('err', message);
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setRunning(null);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="space-y-1">
                <h1 className="text-2xl font-black tracking-tighter">Bakım & Migration</h1>
                <p className="text-sm text-muted-foreground">Tek seferlik veri düzeltmeleri ve seed işlemleri.</p>
            </div>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Wrench className="h-4 w-4" /> Kullanıcı `createdAt` Backfill</CardTitle>
                    <CardDescription>
                        Eski kullanıcı doc'larında `createdAt` yoksa, varsa `joinDate`'den, yoksa şimdiki zaman ile doldurur.
                        Analytics → Aylık Yeni Kullanıcı grafiği bu alanı kullanır.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={backfillCreatedAt}
                        disabled={running !== null}
                        className="rounded-xl"
                    >
                        {running === 'createdAt' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Backfill başlat
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Film className="h-4 w-4" /> Library "Filmler" Seed</CardTitle>
                    <CardDescription>
                        Library koleksiyonuna 25 sosyal etki teması içeren film/belgesel ekler.
                        Her item filtre etiketleriyle (Kategori, Yönetmen, Tür, Yıl, Dil, Ülke, Duygu, İçerik Türü) işaretlenmiştir.
                        Mevcut kayıtların üstüne yazar (merge).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={seedFilmler}
                        disabled={running !== null}
                        className="rounded-xl"
                    >
                        {running === 'filmler' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Filmler bölümünü tohumla
                    </Button>
                </CardContent>
            </Card>

            {logs.length > 0 && (
                <Card className="rounded-2xl bg-muted/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Çıktı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1 font-mono text-xs">
                            {logs.map((l, i) => (
                                <div key={i} className="flex items-start gap-2">
                                    {l.type === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />}
                                    {l.type === 'err' && <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 shrink-0" />}
                                    {l.type === 'info' && <Badge variant="outline" className="text-[9px] h-4">i</Badge>}
                                    <span className={l.type === 'err' ? 'text-red-600' : l.type === 'ok' ? 'text-green-700' : ''}>{l.text}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
