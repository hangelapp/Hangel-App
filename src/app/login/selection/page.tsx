'use client';

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Plus, X, Instagram, Facebook, Linkedin, Twitter, Youtube, Link as LinkIcon, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories } from '@/lib/data';

// --- Shared Constants & Data ---
const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const districts: { [key: string]: string[] } = {
    'Adana': ['Aladağ', 'Ceyhan', 'Çukurova', 'Feke', 'İmamoğlu', 'Karaisalı', 'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 'Seyhan', 'Tufanbeyli', 'Yumurtalık', 'Yüreğir'],
    'Adıyaman': ['Merkez', 'Besni', 'Çelikhan', 'Gerger', 'Gölbaşı', 'Kahta', 'Samsat', 'Sincik', 'Tut'],
    'Afyonkarahisar': ['Merkez', 'Başmakçı', 'Bayat', 'Bolvadin', 'Çay', 'Çobanlar', 'Dazkırı', 'Dinar', 'Emirdağ', 'Evciler', 'Hocalar', 'İhsaniye', 'İscehisar', 'Kızılören', 'Sandıklı', 'Sinanpaşa', 'Sultandağı', 'Şuhut'],
    'Ağrı': ['Merkez', 'Diyadin', 'Doğubayazıt', 'Eleşkirt', 'Hamur', 'Patnos', 'Taşlıçay', 'Tutak'],
    'Aksaray': ['Merkez', 'Ağaçören', 'Eskil', 'Gülağaç', 'Güzelyurt', 'Ortaköy', 'Sarıyahşi', 'Sultanhanı'],
    'Amasya': ['Merkez', 'Göynücek', 'Gümüşhacıköy', 'Hamamözü', 'Merzifon', 'Suluova', 'Taşova'],
    'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Bala', 'Beypazarı', 'Çamlidere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'],
    'Antalya': ['Akseki', 'Aksu', 'Alanya', 'Demre', 'Döşemealtı', 'Elmalı', 'Finike', 'Gazipaşa', 'Gündoğmuş', 'İbradı', 'Kaş', 'Kemer', 'Kepez', 'Konyaaltı', 'Korkuteli', 'Kumluca', 'Manavgat', 'Muratpaşa', 'Serik'],
    'Artvin': ['Merkez', 'Ardanuç', 'Arhavi', 'Borçka', 'Hopa', 'Kemalpaşa', 'Murgul', 'Şavşat', 'Yusufeli'],
    'Aydın': ['Bozdoğan', 'Buharkent', 'Çine', 'Didim', 'Efeler', 'Germencik', 'İncirliova', 'Karacasu', 'Karpuzlu', 'Koçarlı', 'Köşk', 'Kuşadası', 'Kuyucak', 'Nazilli', 'Söke', 'Sultanhisar', 'Yenipazar'],
    'Balıkesir': ['Altiyeylül', 'Ayvalık', 'Balya', 'Bandırma', 'Bigadiç', 'Burhaniye', 'Dursunbey', 'Edremit', 'Erdek', 'Gömeç', 'Gönen', 'Havran', 'İvrindi', 'Karesi', 'Kepsut', 'Manyas', 'Marmara', 'Savaştepe', 'Sındırgı', 'Susurluk'],
    'Bilecik': ['Merkez', 'Bozüyük', 'Gölpazarı', 'İnhisar', 'Osmaneli', 'Pazaryeri', 'Söğüt', 'Yenipazar'],
    'Bingöl': ['Merkez', 'Adaklı', 'Genç', 'Karlıova', 'Kiğı', 'Solhan', 'Yayladere', 'Yedisu'],
    'Bitlis': ['Merkez', 'Adilcevaz', 'Ahlat', 'Güroymak', 'Hizan', 'Mutki', 'Tatvan'],
    'Bolu': ['Merkez', 'Dörtdivan', 'Gerede', 'Göynük', 'Kıbrıscık', 'Mengen', 'Mudurnu', 'Seben', 'Yeniçağa'],
    'Burdur': ['Merkez', 'Ağlasun', 'Altınyayla', 'Bucak', 'Çavdır', 'Çeltikçi', 'Gölhisar', 'Karamanlı', 'Kemer', 'Tefenni', 'Yeşilova'],
    'Bursa': ['Büyükorhan', 'Gemlik', 'Gürsu', 'Harmancık', 'İnegöl', 'İznik', 'Karacabey', 'Keles', 'Kestel', 'Mudanya', 'Mustafakemalpaşa', 'Nilüfer', 'Orhaneli', 'Orhangazi', 'Osmangazi', 'Yenişehir', 'Yıldırım'],
    'Çanakkale': ['Merkez', 'Ayvacık', 'Bayramiç', 'Biga', 'Bozcaada', 'Çan', 'Eceabat', 'Ezine', 'Gelibolu', 'Gökçeada', 'Lapseki', 'Yenice'],
    'ÇANKIRI': ['Merkez', 'Atkaracalar', 'Bayramören', 'Çerkeş', 'Eldivan', 'Ilgaz', 'Kızılırmak', 'Korgun', 'Kurşunlu', 'Orta', 'Şabanözü', 'Yapraklı'],
    'Çorum': ['Merkez', 'Alaca', 'Bayat', 'Boğazkale', 'Dodurga', 'İskilip', 'Kargı', 'Laçin', 'Mecitözü', 'Oğuzlar', 'Ortaköy', 'Osmancık', 'Sungurlu', 'Uğurludağ'],
    'Denizli': ['Merkezefendi', 'Acıpayam', 'Babadağ', 'Baklan', 'Bekilli', 'Beyağaç', 'Bozkurt', 'Buldan', 'Çal', 'Çameli', 'Çardak', 'Çivril', 'Güney', 'Honaz', 'Kale', 'Pamukkale', 'Sarayköy', 'Serinhisar', 'Tavas'],
    'Diyarbakır': ['Bağlar', 'Bismil', 'Çermik', 'Çınar', 'Çüngüş', 'Dicle', 'Eğil', 'Ergani', 'Hani', 'Hazro', 'Kayapınar', 'Kocaköy', 'Kulp', 'Lice', 'Silvan', 'Sur', 'Yenişehir'],
    'Edirne': ['Merkez', 'Enez', 'Havsa', 'İpsala', 'Keşan', 'Lalapaşa', 'Meriç', 'Süloğlu', 'Uzunköprü'],
    'Elazığ': ['Merkez', 'Ağın', 'Alacakaya', 'Arıcak', 'Baskil', 'Karakoçan', 'Keban', 'Kovancılar', 'Maden', 'Palu', 'Sivrice'],
    'Erzincan': ['Merkez', 'Çayırlı', 'İliç', 'Kemah', 'Kemaliye', 'Otlukbeli', 'Refahiye', 'Tercan', 'Üzümlü'],
    'Erzurum': ['Aşkale', 'Aziziye', 'Çat', 'Hınıs', 'Horasan', 'İspir', 'Karaçoban', 'Karayazı', 'Köprüköy', 'Narman', 'Oltu', 'Olur', 'Palandöken', 'Pasinler', 'Pazaryolu', 'Şenkaya', 'Tekman', 'Tortum', 'Uzundere', 'Yakutiye'],
    'Eskişehir': ['Alpu', 'Beylikova', 'Çifteler', 'Günyüzü', 'Han', 'İnönü', 'Mahmudiye', 'Mihalgazi', 'Mihalıççık', 'Odunpazarı', 'Sarıcakaya', 'Seyitgazi', 'Sivrihisar', 'Tepebaşı'],
    'Gaziantep': ['Araban', 'İslahiye', 'Karkamış', 'Nizip', 'Nurdağı', 'Oğuzeli', 'Şahinbey', 'Şehitkamil', 'Yavuzeli'],
    'Giresun': ['Merkez', 'Alucra', 'Bulancak', 'Çamoluk', 'Çanakçı', 'Dereli', 'Doğankent', 'Espiye', 'Eynesil', 'Görele', 'Güce', 'Keşap', 'Piraziz', 'Şebinkarahisar', 'Tirebolu', 'Yağlıdere'],
    'Gümüşhane': ['Merkez', 'Kelkit', 'Köse', 'Kürtün', 'Şiran', 'Torul'],
    'Hakkari': ['Merkez', 'Çukurca', 'Derecik', 'Şemdinli', 'Yüksekova'],
    'Hatay': ['Altınözü', 'Antakya', 'Arsuz', 'Belen', 'Defne', 'Dörtyol', 'Erzin', 'Hassa', 'İskenderun', 'Kırıkhan', 'Kumlu', 'Payas', 'Reyhanlı', 'Samandağ', 'Yayladağı'],
    'Isparta': ['Merkez', 'Aksu', 'Atabey', 'Eğirdir', 'Gelendost', 'Gönen', 'Keçiborlu', 'Senirkent', 'Sütçüler', 'Şarkikaraağaç', 'Uluborlu', 'Yalvaç', 'Yenişarbademli'],
    'Mersin': ['Akdeniz', 'Anamur', 'Aydıncık', 'Bozyazı', 'Çamlıyayla', 'Erdemli', 'Gülnar', 'Mezitli', 'Mut', 'Silifke', 'Tarsus', 'Toroslar', 'Yenişehir'],
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
    'Kars': ['Merkez', 'Akyaka', 'Arpaçay', 'Digor', 'Kağızman', 'Sarıkamış', 'Selim', 'Susuz'],
    'Kastamonu': ['Merkez', 'Abana', 'Ağlı', 'Araç', 'Azdavay', 'Bozkurt', 'Cide', 'Çatalzeytin', 'Daday', 'Devrekani', 'Doğanyurt', 'Hanönü', 'İhsangazi', 'İnebolu', 'Küre', 'Pınarbaşı', 'Seydiler', 'Şenpazar', 'Taşköprü', 'Tosya'],
    'Kayseri': ['Akkışla', 'Bünyan', 'Develi', 'Felahiye', 'Hacılar', 'İncesu', 'Kocasinan', 'Melikgazi', 'Özvatan', 'Pınarbaşı', 'Sarıoğlan', 'Sarız', 'Talas', 'Tomarza', 'Yahyalı', 'Yeşilhisar'],
    'Kırklareli': ['Merkez', 'Babaeski', 'Demirköy', 'Kofçaz', 'Lüleburgaz', 'Pehlivanköy', 'Pınarhisar', 'Vize'],
    'Kırşehir': ['Merkez', 'Akçakent', 'Akpınar', 'Boztepe', 'Çiçekdağı', 'Kaman', 'Mucur'],
    'Kocaeli': ['Başiskele', 'Çayırova', 'Darıca', 'Derince', 'Dilovası', 'Gebze', 'Gölcük', 'İzmit', 'Kandıra', 'Karamürsel', 'Kartepe', 'Körfez'],
    'Konya': ['Ahırlı', 'Akören', 'Akşehir', 'Altınekin', 'Beyşehir', 'Bozkır', 'Cihanbeyli', 'Çeltik', 'Çumra', 'Derbent', 'Derebucak', 'Doğanhisar', 'Emirgazi', 'Ereğli', 'Güneysınır', 'Hadim', 'Halkapınar', 'Hüyük', 'Kadınhanı', 'Karapınar', 'Karatay', 'Kulu', 'Meram', 'Sarayönü', 'Selçuklu', 'Seydişehir', 'Taşkent', 'Tuzlukçu', 'Yalıhüyük', 'Yunak'],
    'Kütahya': ['Merkez', 'Altıntaş', 'Aslanapa', 'Çavdarhisar', 'Domaniç', 'Dumlupınar', 'Emet', 'Gediz', 'Hisarcık', 'Pazarlar', 'Simav', 'Şaphane', 'Tavşanlı'],
    'Malatya': ['Akçadağ', 'Arapgir', 'Arguvan', 'Battalgazi', 'Darende', 'Doğanşehir', 'Doğanyol', 'Hekimhan', 'Kale', 'Kuluncak', 'Pütürge', 'Yazıhan', 'Yeşilyurt'],
    'Manisa': ['Ahmetli', 'Akhisar', 'Alaşehir', 'Demirci', 'Gölmarmara', 'Gördes', 'Salihli', 'Soma', 'Şehzadeler', 'Turgutlu', 'Yunusemre'],
    'Kahramanmaraş': ['Afşin', 'Andırın', 'Çağlayancerit', 'Dulkadiroğlu', 'Ekinözü', 'Elbistan', 'Göksun', 'Nurhak', 'Onikişubat', 'Pazarcık', 'Türkoğlu'],
    'Mardin': ['Artuklu', 'Dargeçit', 'Derik', 'Kızıltepe', 'Mazıdağı', 'Midyat', 'Nusaybin', 'Ömerli', 'Savur', 'Yeşilli'],
    'Muğla': ['Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz', 'Marmaris', 'Menteşe', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatağan'],
    'Muş': ['Merkez', 'Bulanık', 'Hasköy', 'Korkut', 'Malazgirt', 'Varto'],
    'Nevşehir': ['Merkez', 'Acıgöl', 'Avanos', 'Derinkuyu', 'Gülşehir', 'Hacıbektaş', 'Kozaklı', 'Ürgüp'],
    'Niğde': ['Merkez', 'Altunhisar', 'Bor', 'Çamardı', 'Çiftlik', 'Ulukışla'],
    'Ordu': ['Akkuş', 'Altınordu', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaybaşı', 'Fatsa', 'Gölköy', 'Gülyalı', 'Gürgentepe', 'İkizce', 'Kabadüz', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye', 'Perşembe', 'Ulubey', 'Ünye'],
    'Osmaniye': ['Merkez', 'Bahçe', 'Düziçi', 'Hasanbeyli', 'Kadirli', 'Sumbas', 'Toprakkale'],
    'Rize': ['Merkez', 'Ardeşen', 'Çamlıhemşin', 'Çayeli', 'Derepazarı', 'Fındıklı', 'Güneysu', 'Hemşin', 'İkizdere', 'İyidere', 'Kalkandere', 'Pazar'],
    'Sakarya': ['Adapazarı', 'Akyazı', 'Arifiye', 'Erenler', 'Ferizli', 'Geyve', 'Hendek', 'Karapürçek', 'Karasu', 'Kaynarca', 'Kocaali', 'Pamukova', 'Sapanca', 'Serdivan', 'Söğütlü', 'Taraklı'],
    'Samsun': ['19 Mayıs', 'Alaçam', 'Asarcık', 'Atakum', 'Ayvacık', 'Bafra', 'Canik', 'Çarşamba', 'Havza', 'İlkadım', 'Kavak', 'Ladik', 'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent'],
    'Şanlıurfa': ['Akçakale', 'Birecik', 'Bozova', 'Ceylanpınar', 'Eyyübiye', 'Halfeti', 'Haliliye', 'Harran', 'Hilvan', 'Karaköprü', 'Siverek', 'Suruç', 'Viranşehir'],
    'Siirt': ['Merkez', 'Baykan', 'Eruh', 'Kurtalan', 'Pervari', 'Şirvan', 'Tillo'],
    'Sinop': ['Merkez', 'Ayancık', 'Boyabat', 'Dikmen', 'Durağan', 'Erfelek', 'Gerze', 'Saraydüzü', 'Türkeli'],
    'Sivas': ['Merkez', 'Akıncılar', 'Altınyayla', 'Divriği', 'Doğanşar', 'Gemerek', 'Gölova', 'Gürün', 'Hafik', 'İmranlı', 'Kangal', 'Koyulhisar', 'Şarkışla', 'Suşehri', 'Ulaş', 'Yıldızeli', 'Zara'],
    'Şırnak': ['Merkez', 'Beytüşşebap', 'Cizre', 'Güçlükonak', 'İdil', 'Silopi', 'Uludere'],
    'Tekirdağ': ['Çerkezköy', 'Çorlu', 'Ergene', 'Hayrabolu', 'Kapaklı', 'Malkara', 'Marmaraereğlisi', 'Muratlı', 'Saray', 'Şarköy', 'Süleymanpaşa'],
    'Tokat': ['Merkez', 'Almus', 'Artova', 'Başçiftlik', 'Erbaa', 'Niksar', 'Pazar', 'Reşadiye', 'Sulusaray', 'Turhal', 'Yeşilyurt', 'Zile'],
    'Trabzon': ['Akçaabat', 'Araklı', 'Arsin', 'Beşikdüzü', 'Çarşıbaşı', 'Çaykara', 'Dernekpazarı', 'Düzköy', 'Hayrat', 'Köprübaşı', 'Maçka', 'Of', 'Ortahisar', 'Sürmene', 'Şalpazarı', 'Tonya', 'Vakfıkebir', 'Yomra'],
    'Tunceli': ['Merkez', 'Çemişgezek', 'Hozat', 'Mazgirt', 'Nazımiye', 'Ovacık', 'Pertek', 'Pülümür'],
    'Uşak': ['Merkez', 'Banaz', 'Eşme', 'Karahallı', 'Sivaslı', 'Ulubey'],
    'Van': ['Bahçesaray', 'Başkale', 'Çaldıran', 'Çatak', 'Edremit', 'Erciş', 'Gevaş', 'Gürpınar', 'İpekyolu', 'Muradiye', 'Özalp', 'Saray', 'Tuşba'],
    'Yalova': ['Merkez', 'Altınova', 'Armutlu', 'Çınarcık', 'Çiftlikköy', 'Termal'],
    'Yozgat': ['Merkez', 'Akdağmadeni', 'Aydıncık', 'Boğazlıyan', 'Çandır', 'Çayıralan', 'Çekerek', 'Kadışehri', 'Saraykent', 'Sarıkaya', 'Sorgun', 'Şefaatli', 'Yenifakılı', 'Yerköy'],
    'Zonguldak': ['Merkez', 'Alaplı', 'Çaycuma', 'Devrek', 'Ereğli', 'Gökçebey', 'Kilimli', 'Kozlu'],
    'Bayburt': ['Merkez', 'Aydıntepe', 'Demirözü'],
    'Karaman': ['Merkez', 'Ayrancı', 'Başyayla', 'Ermenek', 'Kazımkarabekir', 'Sarıveliler'],
    'Kırıkkale': ['Merkez', 'Bahşılı', 'Balışeyh', 'Çelebi', 'Delice', 'Karakeçili', 'Keskin', 'Sulakyurt', 'Yahşihan'],
    'Batman': ['Merkez', 'Beşiri', 'Gercüş', 'Hasankeyf', 'Kozluk', 'Sason'],
    'Ardahan': ['Merkez', 'Çıldır', 'Damal', 'Göle', 'Hanak', 'Posof'],
    'Iğdır': ['Merkez', 'Aralık', 'Karakoyunlu', 'Tuzluca'],
    'Karabük': ['Merkez', 'Eflani', 'Eskipazar', 'Ovacık', 'Safranbolu', 'Yenice'],
    'Kilis': ['Merkez', 'Elbeyli', 'Musabeyli', 'Polateli'],
};

const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe', 'Eğitim', 'Göztepe', 'Merdivenköy', 'Bostancı', 'Caddebostan'],
    'Beşiktaş': ['Levent', 'Etiler', 'Bebek', 'Arnavutköy', 'Ortaköy', 'Gayrettepe', 'Dikilitaş', 'Muradiye', 'Abbasağa', 'Vişnezade'],
    'Fatih': ['Aksaray', 'Balat', 'Eminönü', 'Sultanahmet', 'Sirkeci', 'Beyazıt', 'Çapa', 'Kocamustafapaşa', 'Yedikule', 'Karagümrük'],
};

const universities = ['Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Galatasaray Üniversitesi'];
const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];

const marketCategoryLabels = marketCategories
    .filter(c => c.mainCategory !== 'Öne çıkanlar' && c.mainCategory !== 'Tümü')
    .map(c => c.mainCategory);

// --- Shared Components ---

const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => (
    <div className="space-y-2">
        <Label>{title}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
            {options.map(option => (
                <div key={option} className="flex items-center gap-2">
                    <Checkbox id={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} />
                    <Label htmlFor={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} className="text-sm font-normal">{option}</Label>
                </div>
            ))}
        </div>
    </div>
);

const FileUpload = ({label, accept, hint}: {label: string, accept?: string, hint?: string}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
            <Input id={`${label}-upload`} type="file" className="hidden" accept={accept} />
            <Button asChild variant="outline" size="sm">
                <label htmlFor={`${label}-upload`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
    </div>
);

const SocialMediaFields = () => (
    <Card>
        <CardHeader>
            <CardTitle className="text-lg">Sosyal Medya Hesapları</CardTitle>
            <CardDescription>Kuruluşunuzun sosyal medya linklerini ekleyin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="instagram.com/kullaniciadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>X (Twitter)</Label>
                <div className="flex items-center gap-2">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="x.com/kullaniciadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="flex items-center gap-2">
                    <Facebook className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="facebook.com/sayfaadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>LinkedIn</Label>
                <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="linkedin.com/company/kurumadi" />
                </div>
            </div>
            <div className="space-y-2">
                <Label>YouTube</Label>
                <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-muted-foreground" />
                    <Input placeholder="youtube.com/@kanaladi" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const AddressFields = ({ city, setCity, district, setDistrict, neighborhood, setNeighborhood }: any) => (
    <Card>
        <CardHeader><CardTitle className="text-lg">İletişim & Adres</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2"><Label>E-posta</Label><Input type="email" placeholder="iletisim@ornek.com" required /></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>İl</Label>
                    <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }}>
                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>İlçe</Label>
                    <Select value={district} onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }} disabled={!city}>
                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {city && (districts[city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Mahalle</Label>
                    <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!district}>
                        <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {district && (neighborhoods[district] || ['Merkez', 'Cumhuriyet', 'Hürriyet']).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2"><Label>Açık Adres</Label><Input placeholder="Sokak, kapı no..." /></div>
        </CardContent>
    </Card>
);

// --- Components ---

function IndividualLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
  const [loginStep, setLoginStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStep(2);
  };

  if (loginStep === 1) {
    return (
      <div className="space-y-6">
        <form className="space-y-6" onSubmit={handleSendCode}>
          <div className="space-y-2">
            <Label htmlFor="phone-login">Telefon Numarası</Label>
            <Input id="phone-login" type="tel" required placeholder="5XX XXX XX XX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">Doğrulama Kodu Gönder</Button>
        </form>
        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">Hesabınız yok mu? </span>
          <Link href="/login/selection?action=register&type=individual" className="font-medium text-primary hover:underline">Kayıt Ol</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={onLogin}>
      <p className="text-sm text-center text-muted-foreground">{`+90 ${phoneNumber} numarasına gönderilen kodu girin.`}</p>
      <div>
        <Label htmlFor="otp">Doğrulama Kodu</Label>
        <Input id="otp" type="text" required className="text-center tracking-[0.5em]" placeholder="------" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <Button variant="link" onClick={() => setLoginStep(1)} className="p-0 text-primary">Numarayı Değiştir</Button>
        <Button variant="link" className="p-0 text-primary">Kodu Tekrar Gönder</Button>
      </div>
      <Button type="submit" className="w-full">Giriş Yap</Button>
    </form>
  );
}

function IndividualRegister({ onRegister }: { onRegister: (e: React.FormEvent) => void }) {
  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={onRegister}>
        <div className="space-y-2">
          <Label htmlFor="name-register">Ad Soyad</Label>
          <Input id="name-register" type="text" required placeholder="Adınız Soyadınız" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone-register">Telefon Numarası</Label>
          <Input id="phone-register" type="tel" required placeholder="5XX XXX XX XX" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-register">E-posta Adresi (İsteğe Bağlı)</Label>
          <Input id="email-register" type="email" placeholder="ornek@eposta.com" />
        </div>
        <div className="flex items-start space-x-3">
          <Checkbox id="terms-register" required />
          <Label htmlFor="terms-register" className="text-xs font-normal text-muted-foreground">
            <Link href="/settings/contracts/kullanici-sozlesmesi" className="font-medium text-primary hover:underline">Kullanıcı Sözleşmesi</Link>, <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link> ve <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link>'nı okudum, anladım.
          </Label>
        </div>
        <Button type="submit" className="w-full">Kayıt Ol ve Devam Et</Button>
      </form>
      <div className="text-center text-sm pt-2">
        <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
        <Link href="/login/selection?action=login&type=individual" className="font-medium text-primary hover:underline">Giriş Yap</Link>
      </div>
    </div>
  );
}

function CorporateLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
    return (
        <div className="space-y-6">
          <form className="space-y-6" onSubmit={onLogin}>
              <div className="space-y-2">
                  <Label htmlFor="email-login">E-posta Adresi</Label>
                  <Input id="email-login" type="email" required placeholder="kurumsal@eposta.com" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password-login">Şifre</Label>
                  <Input id="password-login" type="password" required />
              </div>
              <div className="flex items-center justify-end text-sm">
                  <Button variant="link" className="p-0 text-primary">Şifremi Unuttum</Button>
              </div>
              <Button type="submit" className="w-full">Giriş Yap</Button>
          </form>
          <div className="text-center text-sm pt-2">
            <span className="text-muted-foreground">Kuruluşunuz kayıtlı değil mi? </span>
            <Link href="/login/selection?action=register&type=corporate" className="font-medium text-primary hover:underline">Başvur</Link>
          </div>
        </div>
    );
}

function CorporateRegister({ onRegister }: { onRegister: (e: React.FormEvent) => void }) {
    const [applicationType, setApplicationType] = useState<string>('');
    const [clubSchoolType, setClubSchoolType] = useState<string>('');
    const [officeCity, setOfficeCity] = useState('');
    const [officeDistrict, setOfficeDistrict] = useState('');
    const [officeNeighborhood, setOfficeNeighborhood] = useState('');
    const [aboutText, setAboutText] = useState("");
    const ABOUT_LIMIT = 1000;

    const [brandDonationRates, setBrandDonationRates] = useState([{ category: '', rate: '' }]);

    const addDonationRate = () => setBrandDonationRates([...brandDonationRates, { category: '', rate: '' }]);
    const removeDonationRate = (index: number) => {
        if (brandDonationRates.length > 1) {
            setBrandDonationRates(brandDonationRates.filter((_, i) => i !== index));
        }
    };
    const updateDonationRate = (index: number, field: 'category' | 'rate', value: string) => {
        const updated = [...brandDonationRates];
        updated[index][field] = value;
        setBrandDonationRates(updated);
    };

    const renderFormFields = () => {
        switch (applicationType) {
            case 'NGO':
                return (
                    <div className='space-y-6'>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Kuruluş Bilgileri</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Kuruluş Adı</Label><Input placeholder="Kuruluşunuzun tam adı" required /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Kuruluş Kısa Adı</Label><Input placeholder="Örn: TEMA" /></div>
                                    <div className="space-y-2"><Label>Kuruluş Yılı</Label><Input type="number" placeholder="Örn: 1992" /></div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Kuruluş Türü</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="dernek">Dernek</SelectItem>
                                            <SelectItem value="vakif">Vakıf</SelectItem>
                                            <SelectItem value="spor">Spor Kulübü</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <Label>Hakkında</Label>
                                        <span className={cn("text-[10px]", aboutText.length > ABOUT_LIMIT ? "text-destructive" : "text-muted-foreground")}>
                                            {aboutText.length} / {ABOUT_LIMIT} (Kalan: {ABOUT_LIMIT - aboutText.length})
                                        </span>
                                    </div>
                                    <Textarea 
                                        value={aboutText} 
                                        onChange={(e) => setAboutText(e.target.value)} 
                                        maxLength={ABOUT_LIMIT} 
                                        placeholder="Kuruluşunuzu anlatan kısa bir metin." 
                                        className="min-h-[120px]"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
                        <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} />
                        
                        <AddressFields 
                            city={officeCity} setCity={setOfficeCity}
                            district={officeDistrict} setDistrict={setOfficeDistrict}
                            neighborhood={officeNeighborhood} setNeighborhood={setOfficeNeighborhood}
                        />

                        <SocialMediaFields />

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Yasal Belgeler</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FileUpload label="Logo" accept=".jpg,.jpeg" hint="Desteklenen format: .jpg" />
                                <FileUpload label="Faaliyet Belgesi" accept=".pdf" hint="Desteklenen format: .pdf" />
                                <FileUpload label="Tüzük" accept=".pdf" hint="Desteklenen format: .pdf" />
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'CLUB':
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Kulüp Bilgileri</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Kulüp Türü</Label>
                                    <Select onValueChange={setClubSchoolType}>
                                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="university">Üniversite</SelectItem>
                                            <SelectItem value="high-school">Lise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {clubSchoolType === 'university' && (
                                    <div className="space-y-2">
                                        <Label>Üniversite</Label>
                                        <Select><SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                            <SelectContent>{universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2"><Label>Kulüp Adı</Label><Input placeholder="Kulübünüzün tam adı" required /></div>
                                <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="kulup@okul.edu.tr" required /></div>
                            </CardContent>
                        </Card>
                        
                        <AddressFields 
                            city={officeCity} setCity={setOfficeCity}
                            district={officeDistrict} setDistrict={setOfficeDistrict}
                            neighborhood={officeNeighborhood} setNeighborhood={setOfficeNeighborhood}
                        />

                        <SocialMediaFields />

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Görseller</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FileUpload label="Kulüp Logosu" accept=".jpg,.jpeg,.png" />
                                <FileUpload label="Kapak Fotoğrafı" accept=".jpg,.jpeg,.png" />
                            </CardContent>
                        </Card>
                    </div>
                );
            case 'BRAND':
                return (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Marka Kimliği</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Marka Adı</Label><Input placeholder="Markanızın adı" required /></div>
                                <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://marka.com" /></div>
                                
                                <div className="space-y-4 border-t pt-4">
                                    <Label className="text-base font-semibold">Kategori Bazlı Bağış Oranları (%)</Label>
                                    <p className="text-xs text-muted-foreground">Markanızın farklı kategorileri için taahhüt ettiği bağış oranlarını girin.</p>
                                    <div className="space-y-3">
                                        {brandDonationRates.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-end">
                                                <div className="flex-1 space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Kategori</Label>
                                                    <Select 
                                                        value={item.category} 
                                                        onValueChange={(val) => updateDonationRate(index, 'category', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seçiniz" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {marketCategoryLabels.map(cat => (
                                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="w-24 space-y-1">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Oran (%)</Label>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="5" 
                                                        value={item.rate} 
                                                        onChange={(e) => updateDonationRate(index, 'rate', e.target.value)}
                                                    />
                                                </div>
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-destructive h-10 w-10 hover:bg-destructive/10"
                                                    onClick={() => removeDonationRate(index)}
                                                    disabled={brandDonationRates.length === 1}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={addDonationRate}>
                                        <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <AddressFields 
                            city={officeCity} setCity={setOfficeCity}
                            district={officeDistrict} setDistrict={setOfficeDistrict}
                            neighborhood={officeNeighborhood} setNeighborhood={setOfficeNeighborhood}
                        />

                        <SocialMediaFields />

                        <Card>
                            <CardHeader><CardTitle className="text-lg">Yasal & Finansal</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Yasal Unvan</Label><Input placeholder="Şirket tam adı" /></div>
                                <div className="space-y-2"><Label>IBAN</Label><Input placeholder="TR..." /></div>
                                <FileUpload label="Vergi Levhası" accept=".pdf" />
                            </CardContent>
                        </Card>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <form className="space-y-6" onSubmit={onRegister}>
                <div className="space-y-2">
                    <Label htmlFor="org-type">Kuruluş Türü</Label>
                    <Select required onValueChange={setApplicationType}>
                        <SelectTrigger id="org-type"><SelectValue placeholder="Kuruluş türünü seçin..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NGO">Sivil Toplum Kuruluşu (STK)</SelectItem>
                            <SelectItem value="BRAND">Marka / Sosyal İşletme</SelectItem>
                            <SelectItem value="CLUB">Öğrenci Kulübü</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {renderFormFields()}

                {applicationType && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Sözleşme Onayları</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start space-x-3">
                                    <Checkbox id="terms-corp" required />
                                    <Label htmlFor="terms-corp" className="text-xs font-normal text-muted-foreground">
                                        <Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesi</Link>, <Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link>'nı okudum, anladım ve onaylıyorum.
                                    </Label>
                                </div>
                                {applicationType === 'BRAND' && (
                                    <div className="flex items-start space-x-3">
                                        <Checkbox id="terms-fee" required />
                                        <Label htmlFor="terms-fee" className="text-xs font-normal text-muted-foreground">
                                            Hangel <Link href="/settings/contracts/ucret-politikasi" className="font-medium text-primary hover:underline">Ücret Politikası</Link>'nı okudum ve kabul ediyorum.
                                        </Label>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Button type="submit" className="w-full">Başvuruyu Tamamla</Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Başvurunuz incelendikten sonra hesabınız aktifleştirilecektir.
                        </p>
                    </div>
                )}
            </form>
            <div className="text-center text-sm pt-2">
                <span className="text-muted-foreground">Zaten hesabınız var mı? </span>
                <Link href="/login/selection?action=login&type=corporate" className="font-medium text-primary hover:underline">Giriş Yap</Link>
            </div>
        </div>
    );
}

function SelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action') || 'login';
  const initialType = searchParams.get('type') || 'individual';

  const title = action === 'register' ? 'Kayıt Ol' : 'Giriş Yap';
  const description = 'Hangel\'e devam etmek için hesap türünü seçin.';

  const handleIndividualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleIndividualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleCorporateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  const handleCorporateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative py-12">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4">
          <ArrowLeft className="h-6 w-6" />
       </Button>
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <Tabs defaultValue={initialType} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Bireysel Hesap</TabsTrigger>
            <TabsTrigger value="corporate">Kurumsal Hesap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="mt-6">
            {action === 'login' ? (
                <IndividualLogin onLogin={handleIndividualLogin} />
            ) : (
                <IndividualRegister onRegister={handleIndividualRegister} />
            )}
          </TabsContent>
          
          <TabsContent value="corporate" className="mt-6">
             {action === 'login' ? (
                <CorporateLogin onLogin={handleCorporateLogin} />
             ) : (
                <CorporateRegister onRegister={handleCorporateRegister} />
             )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SelectionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
            <SelectionContent />
        </Suspense>
    )
}
