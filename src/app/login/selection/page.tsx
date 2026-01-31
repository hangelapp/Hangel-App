
'use client';

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Twitter, Instagram, Facebook, Linkedin, FileText, CheckCircle, Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// --- Shared Constants ---
const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const districts: { [key: string]: string[] } = {
    'Adana': ['Aladağ', 'İmamoğlu', 'Pozantı', 'Tufanbeyli', 'Ceyhan', 'Karaisalı', 'Saimbeyli', 'Yumurtalık', 'Çukurova', 'Karataş', 'Sarıçam', 'Yüreğir', 'Feke', 'Kozan', 'Seyhan'],
    'Adıyaman': ['Besni', 'Kahta', 'Çelikhan', 'Samsat', 'Gerger', 'Sincik', 'Gölbaşı', 'Tut'],
    'Afyonkarahisar': ['Başmakçı', 'Çobanlar', 'Evciler', 'Kızılören', 'Şuhut', 'Bayat', 'Dazkırı', 'Hocalar', 'Sandıklı', 'Bolvadin', 'Dinar', 'İhsaniye', 'Sinanpaşa', 'Çay', 'Emirdağ', 'İscehisar', 'Sultandağı'],
    'Ağrı': ['Diyadin', 'Patnos', 'Doğubayazıt', 'Taşlıçay', 'Eleşkirt', 'Tutak', 'Hamur'],
    'Aksaray': ['Ağaçören', 'Ortaköy', 'Eskil', 'Sarıyahşi', 'Gülağaç', 'Sultanhanı', 'Güzelyurt'],
    'Amasya': ['Göynücek', 'Suluova', 'Gümüşhacıköy', 'Taşova', 'Hamamözü', 'Merzifon'],
    'Ankara': ['Akyurt', 'Beypazarı', 'Elmadağ', 'Güdül', 'Keçiören', 'Polatlı', 'YenimahalLE', 'Altındağ', 'Çamlidere', 'ETimesgut', 'Haymana', 'Kızılcahamam', 'Pursaklar', 'Ayaş', 'Çankaya', 'Evren', 'Kahramankazan', 'Mamak', 'Sincan', 'Bala', 'Çubuk', 'Gölbaşı', 'Kalecik', 'Nallıhan', 'Şereflikoçhisar'],
    'Antalya': ['Akseki', 'Döşemealtı', 'Gündoğmuş', 'Kepez', 'Manavgat', 'Aksu', 'Elmalı', 'İbradı', 'Konyaaltı', 'Muratpaşa', 'Alanya', 'Finike', 'Kaş', 'Korkuteli', 'SerİK', 'Demre', 'Gazipaşa', 'Kemer', 'KUmluca'],
    'Ardahan': ['Çıldır', 'Posof', 'Damal', 'Göle', 'Hanak'],
    'Artvin': ['Ardanuç', 'Kemalpaşa', 'Arhavi', 'Murgul', 'Borçka', 'Şavşat', 'Hopa', 'Yusufeli'],
    'Aydın': ['Bozdoğan', 'Efeler', 'KarpuZlu', 'Kuyucak', 'Yenipazar', 'Buharkent', 'Germencik', 'Koçarlı', 'Nazilli', 'Çine', 'İncirliova', 'Köşk', 'Söke', 'Didim', 'Karacasu', 'Kuşadası', 'Sultanhisar'],
    'Balıkesir': ['Altıeylül', 'Bigadiç', 'Erdek', 'İvrindi', 'Marmara', 'Ayvalık', 'Burhaniye', 'Gömeç', 'Karesi', 'Savaştepe', 'Balya', 'Dursunbey', 'Gönen', 'Kepsut', 'Sındırgı', 'Bandırma', 'Edremit', 'Havran', 'Manyas', 'Susurluk'],
    'Bartın': ['Amasra', 'Kurucaşile', 'Ulus'],
    'Batman': ['Beşiri', 'Sason', 'Gercüş', 'Hasankeyf', 'Kozluk'],
    'Bayburt': ['Merkez', 'Aydıntepe', 'Demirözü'],
    'Bilecik': ['Bozüyük', 'Pazaryeri', 'Gölpazarı', 'Söğüt', 'İnhisar', 'Yenipazar', 'Osmaneli'],
    'Bingöl': ['Adaklı', 'Solhan', 'Genç', 'Yayladere', 'Karlıova', 'Yedisu', 'Kiğı'],
    'Bitlis': ['Adilcevaz', 'Mutki', 'Ahlat', 'Tatvan', 'Güroymak', 'Hizan'],
    'Bolu': ['Dörtdivan', 'Mengen', 'Gerede', 'Mudurnu', 'Göynük', 'Seben', 'Kıbrıscık', 'Yeniçağa'],
    'Burdur': ['Ağlasun', 'Çeltikçi', 'Tefenni', 'Altınyayla', 'Gölhisar', 'Yeşilova', 'Bucak', 'Karamanlı', 'Çavdır', 'Kemer'],
    'Bursa': ['Büyükorhan', 'İnegöl', 'Kestel', 'Orhaneli', 'Yıldırım', 'Gemlik', 'İznik', 'Mudanya', 'Orhangazi', 'Gürsu', 'Karacabey', 'Mustafakemalpaşa', 'Osmangazi', 'Harmancık', 'Keles', 'Nilüfer', 'Yenişehir'],
    'Çanakkale': ['Ayvacık', 'Çan', 'Gökçeada', 'Bayramiç', 'ECEabat', 'Lapseki', 'Biga', 'Ezine', 'Yenice', 'Bozcaada', 'Gelibolu'],
    'Çankırı': ['Atkaracalar', 'Ilgaz', 'Orta', 'Bayramören', 'Kızılırmak', 'Şabanözü', 'Çerkeş', 'Korgun', 'Yapraklı', 'Eldivan', 'Kurşunlu'],
    'Çorum': ['Alaca', 'İskilip', 'Oğuzlar', 'Uğurludağ', 'Bayat', 'Karagı', 'Ortaköy', 'Boğazkale', 'Laçin', 'Osmancık', 'Dodurga', 'Mecitözü', 'Sungurlu'],
    'Denizli': ['Acıpayam', 'Beyağaç', 'Çameli', 'Honaz', 'Sarayköy', 'Babadağ', 'Bozkurt', 'Çardak', 'Kale', 'Serİnhisar', 'Baklan', 'Buldan', 'Çivril', 'Merkezefendi', 'Tavas', 'BEkilli', 'Çal', 'Güney', 'Pamukkale'],
    'Diyarbakır': ['Bağlar', 'Çüngüş', 'Hani', 'Kulp', 'Yenişehir', 'Bismil', 'Dicle', 'Hazro', 'Lice', 'Çermik', 'Eğil', 'Kayapınar', 'Silvan', 'Çınar', 'Ergani', 'Kocaköy', 'Sur'],
    'Düzce': ['Akçakoca', 'Gümüşova', 'Cumayeri', 'Kaynaşlı', 'Çilimli', 'Yığılca', 'Gölyaka'],
    'Edirne': ['Enez', 'Lalapaşa', 'Havsa', 'Meriç', 'İpsala', 'Süloğlu', 'Keşan', 'Uzunköprü'],
    'Elazığ': ['Ağın', 'Karakoçan', 'Palu', 'Alacakaya', 'Keban', 'Sivrice', 'Aricak', 'Kovancılar', 'Baskil', 'Maden'],
    'Erzincan': ['Çayırlı', 'Otlukbeli', 'İliç', 'Refahiye', 'Kemah', 'Tercan', 'Kemaliye', 'Üzümlü'],
    'Erzurum': ['Aşkale', 'Horasan', 'Köprüköy', 'Palandöken', 'Tekman', 'Aziziye', 'İspir', 'Narman', 'Pasinler', 'Tortum', 'Çat', 'Karaçoban', 'Oltu', 'Pazaryolu', 'Uzundere', 'HINIS', 'Karayazı', 'Olur', 'Şenkaya', 'Yakutiye'],
    'Eskişehir': ['Alpu', 'Han', 'Mihalıççık', 'Sivrihisar', 'Beylikova', 'İnönü', 'Odunpazarı', 'Tepebaşı', 'Çifteler', 'Mahmudiye', 'Sarıcakaya', 'Günyüzü', 'Mihalgazi', 'Seyitgazi'],
    'Gaziantep': ['Araban', 'Nurdağı', 'Yavuzeli', 'İslahiye', 'Oğuzeli', 'Karkamış', 'Şahinbey', 'Nizip', 'Şehitkamil'],
    'Giresun': ['Alucra', 'Dereli', 'Görele', 'Şebinkarahisar', 'Bulancak', 'Doğankent', 'Güce', 'Tirebolu', 'Çamoluk', 'Espiye', 'Keşap', 'Yağlıdere', 'Çanakçı', 'Eynesil', 'Piraziz'],
    'Gümüşhane': ['Kelkit', 'Torul', 'Köse', 'Kürtün', 'Şiran'],
    'Hakkari': ['Çukurca', 'Derecik', 'Şemdinli', 'Yüksekova'],
    'Hatay': ['Altınözü', 'Defne', 'İskenderun', 'Reyhanlı', 'Antakya', 'Dörtyol', 'Kırıkhan', 'Samandağ', 'Arsuz', 'Erzin', 'Kumlu', 'Yayladağı', 'Belen', 'Hassa', 'Payas'],
    'Iğdır': ['Merkez', 'Aralık', 'Karakoyunlu', 'Tuzluca'],
    'Isparta': ['Aksu', 'Gönen', 'Şarkikaraağaç', 'Atabey', 'Keçiborlu', 'Uluborlu', 'Eğirdir', 'Senirkent', 'Yalvaç', 'Gelendost', 'Sütçüler', 'YenİŞarbademli'],
    'İstanbul': ['Adalar', 'Bağcılar', 'Bayrampaşa', 'Beyoğlu', 'Esenler', 'Gaziosmanpaşa', 'Kartal', 'Sancaktepe', 'Sultangazi', 'Ümraniye', 'Arnavutköy', 'Bahçelievler', 'Beşiktaş', 'Büyükçekmece', 'Esenyurt', 'Güngören', 'Küçükçekmece', 'Sarıyer', 'Şile', 'Üsküdar', 'Ataşehir', 'Bakırköy', 'Beykoz', 'Çatalca', 'Eyüpsultan', 'Kadıköy', 'Kağıthane', 'Pendik', 'Sultanbeyli', 'Tuzla', 'Avcılar', 'Başakşehir', 'Beylikdüzü', 'Çekmeköy', 'Fatih', 'Zeytinburnu', 'Silivri', 'Şişli', 'Maltepe'],
    'İzmir': ['Aliağa', 'Bergama', 'Çeşme', 'Gaziemir', 'Karşiyaka', 'Konak', 'Ödemiş', 'Torbalı', 'Balçova', 'Beydağ', 'Çiğli', 'Güzelbahçe', 'Kemalpaşa', 'Menderes', 'Seferihisar', 'Urla', 'Bayındır', 'Bornova', 'Dikili', 'Karabağlar', 'Kınık', 'Menemen', 'Selçuk', 'Bayraklı', 'Buca', 'Foça', 'Karaburun', 'Kiraz', 'Narlıdere', 'Tire'],
    'Kahramanmaraş': ['Afşin', 'Ekinözü', 'Onikişubat', 'Andırın', 'Elbistan', 'Pazarcık', 'Çağlayancerit', 'Göksun', 'Türkoğlu', 'Dulkadiroğlu', 'Nurhak'],
    'Karabük': ['Eflani', 'Yenice', 'Eskipazar', 'Ovacık', 'Safranbolu'],
    'Karaman': ['Ayrancı', 'Sarıveliler', 'Başyayla', 'Ermenek', 'Kazımkarabekir'],
    'Kars': ['Akyaka', 'Sarıkamış', 'Arpaçay', 'Selim', 'Digor', 'Susuz', 'Kağızman'],
    'Kastamonu': ['Abana', 'Bozkurt', 'Devrekani', 'İnebolu', 'Şenpazar', 'Ağlı', 'Cide', 'Doğanyurt', 'Küre', 'Taşköprü', 'Araç', 'Çatalzeytin', 'Hanönü', 'Pınarbaşı', 'Tosya', 'Azdavay', 'Daday', 'İhsangazi', 'Seydiler'],
    'Kayseri': ['Akkışla', 'Hacılar', 'Özvatan', 'Talas', 'Bünyan', 'İncesu', 'Pınarbaşı', 'Tomarza', 'Develi', 'Kocasinan', 'Sarıoğlan', 'Yahyalı', 'Felahiye', 'Melikgazi', 'Sarız', 'Yeşilhisar'],
    'Kilis': ['Elbeyli', 'Musabeyli', 'Polateli'],
    'Kırıkkale': ['Bahşılı', 'Karakeçili', 'Balışeyh', 'Keskin', 'Çelebi', 'Sulakyurt', 'Delice', 'Yahşihan'],
    'Kırklareli': ['Babaeski', 'Pehlivanköy', 'Demirköy', 'Pınarhisar', 'Kofçaz', 'Vize', 'Lüleburgaz'],
    'Kırşehir': ['Akçakent', 'Kaman', 'Akpınar', 'Mucur', 'Boztepe', 'Çiçekdağı'],
    'Kocaeli': ['Başiskele', 'Dilovası', 'Kandıra', 'Çayırova', 'Gebze', 'Karamürsel', 'Darıca', 'Gölcük', 'Kartepe', 'Derince', 'İzmit', 'Körfez'],
    'Konya': ['Ahırlı', 'Beyşehir', 'Çumra', 'Emirgazi', 'Halkapınar', 'Karapınar', 'Sarayönü', 'Tuzlukçu', 'Akören', 'Bozkır', 'Derbent', 'Ereğli', 'Hüyük', 'Karatay', 'Selçuklu', 'Yalıhüyük', 'Akşehir', 'Cihanbeyli', 'Derebucak', 'Güneysınır', 'Ilgın', 'Kulu', 'Seydişehir', 'Yunak', 'Altınekin', 'Çeltik', 'Doğanhisar', 'Hadim', 'Kadınhanı', 'Meram', 'Taşkent'],
    'Kütahya': ['Altıntaş', 'Dumlupınar', 'PAzarlar', 'Aslanapa', 'Emet', 'Simav', 'Çavdarhisar', 'Gediz', 'Şaphane', 'Domaniç', 'Hisarcık', 'Tavşanlı'],
    'Malatya': ['Akçadağ', 'Darende', 'Kale', 'Yeşilyurt', 'Arapgir', 'Doğanşehir', 'Kuluncak', 'Arguvan', 'Doğanyol', 'Pütürge', 'Battalgazi', 'Hekimhan', 'Yazıhan'],
    'Manisa': ['Ahmetli', 'Gölmarmara', 'Kula', 'Selendi', 'Yunusemre', 'Akhisar', 'Gördes', 'Salihli', 'Soma', 'Alaşehir', 'Kırkağaç', 'Sarıgöl', 'Şehzadeler', 'Demirci', 'Köprübaşı', 'Saruhanlı', 'Turgutlu'],
    'Mardin': ['Artuklu', 'Mazıdağı', 'Savur', 'Dargeçit', 'Midyat', 'Yeşilli', 'Derik', 'Nusaybin', 'Kızıltepe', 'Ömerli'],
    'Mersin': ['Akdeniz', 'Çamlıyayla', 'Mut', 'Yenişehir', 'Anamur', 'Erdemli', 'Silifke', 'Aydıncık', 'Gülnar', 'Tarsus', 'Bozyazı', 'Mezitli', 'Toroslar'],
    'Muğla': ['Bodrum', 'Kavaklıdere', 'Milas', 'Yatağan', 'Dalaman', 'Köyceğiz', 'Ortaca', 'Datça', 'Marmaris', 'Seydikemer', 'Fethiye', 'Menteşe', 'Ula'],
    'Muş': ['Bulanık', 'Varto', 'Hasköy', 'Korkut', 'Malazgirt'],
    'Nevşehir': ['Acıgöl', 'Hacıbektaş', 'Avanos', 'Kozaklı', 'Derinkuyu', 'Ürgüp', 'Gülşehir'],
    'Niğde': ['Altunhisar', 'Ulukişla', 'Bor', 'Çamardı', 'Çiftlik'],
    'Ordu': ['Akkuş', 'Çatalpınar', 'Gülyalı', 'Kabataş', 'Perşembe', 'Altınordu', 'Çaybaşı', 'Gürgentepe', 'Korgan', 'Ulubey', 'Aybastı', 'Fatsa', 'İKizce', 'Kumru', 'Ünye', 'Çamaş', 'Gölköy', 'Kabadüz', 'Mesudiye'],
    'Osmaniye': ['Bahçe', 'Sumbas', 'Düziçi', 'Toprakkale', 'Hasanbeyli', 'Kadirli'],
    'Rize': ['Ardeşen', 'Fındıklı', 'İyidere', 'Çamlıhemşin', 'Güneysu', 'Kalkandere', 'Çayeli', 'Hemşin', 'Pazar', 'Derepazarı', 'İKizdere'],
    'Sakarya': ['Adapazarı', 'Ferizli', 'Karasu', 'Sapanca', 'Akyazı', 'Geyve', 'Kaynarca', 'Serdivan', 'Arifiye', 'Hendek', 'Kocaali', 'Söğütlü', 'Erenler', 'Karapürçek', 'Pamukova', 'Taraklı'],
    'Samsun': ['19 Mayıs', 'Alaçam', 'Asarcık', 'Atakum', 'Ayvacık', 'Bafra', 'Canik', 'Çarşamba', 'Havza', 'İlkadım', 'Kavak', 'Ladik', 'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent'],
    'Şanlıurfa': ['Akçakale', 'Eyyübiye', 'Hilvan', 'Viranşehir', 'Birecik', 'Halfeti', 'Karaköprü', 'Bozova', 'Haliliye', 'Siverek', 'Ceylanpınar', 'Harran', 'Suruç'],
    'Siirt': ['Baykan', 'Şirvan', 'Eruh', 'Tillo', 'Kurtalan', 'Pervari'],
    'Sinop': ['Ayancık', 'Erfelek', 'Boyabat', 'Gerze', 'Dikmen', 'Saraydüzü', 'Durağan', 'Türkeli'],
    'Şırnak': ['Beytüşşebap', 'Silopi', 'Cizre', 'Uludere', 'Güçlükonak', 'İdil'],
    'Sivas': ['Akıncılar', 'Gemerek', 'İmranlı', 'Şarkışla', 'Altınyayla', 'Gölova', 'Kangal', 'Ulaş', 'Divriği', 'Gürün', 'Koyulhisar', 'Yıldızeli', 'Doğanşar', 'Hafik', 'Suşehri', 'Zara'],
    'Tekirdağ': ['Çerkezköy', 'Kapaklı', 'Saray', 'Çorlu', 'Malkara', 'Süleymanpaşa', 'Ergene', 'Marmaraereğlisi', 'Şarköy', 'Hayrabolu', 'Muratlı'],
    'Tokat': ['Almus', 'Niksar', 'Turhal', 'Artova', 'Pazar', 'Yeşilyurt', 'Başçiftlik', 'Reşadiye', 'Zile', 'Erbaa', 'Sulusaray'],
    'Trabzon': ['Akçaabat', 'Çarşıbaşı', 'Hayrat', 'Ortahisar', 'Vakfıkebir', 'Araklı', 'Çaykara', 'Köprübaşı', 'Sürmene', 'Yomra', 'Arsin', 'Dernekpazarı', 'Maçka', 'Şalpazarı', 'Beşİkdüzü', 'Düzköy', 'Of', 'Tonya'],
    'Tunceli': ['Çemişgezek', 'Ovacık', 'Hozat', 'Pertek', 'Mazgirt', 'Pülümür', 'Nazımiye'],
    'Uşak': ['Banaz', 'Ulubey', 'Eşme', 'Karahallı', 'Sivaslı'],
    'Van': ['Bahçesaray', 'Edremit', 'İpekyolu', 'Tuşba', 'Başkale', 'Erciş', 'Muradiye', 'Çaldıran', 'Gevaş', 'Özalp', 'Çatak', 'Gürpınar', 'Saray'],
    'Yalova': ['Altınova', 'Termal', 'Armutlu', 'Çınarcık', 'Çiftlikköy'],
    'Yozgat': ['Akdağmadeni', 'Çayıralan', 'Sarıkaya', 'Yerköy', 'Aydıncık', 'Çekerek', 'Sorgun', 'Boğazlıyan', 'Kadışehri', 'ŞeFaatli', 'Çandır', 'Saraykent', 'Yenifakılı'],
    'Zonguldak': ['Alaplı', 'Gökçebey', 'Çaycuma', 'Kilimli', 'Devrek', 'Kozlu', 'Ereğli'],
};

// Generic mock neighborhoods for demonstration
const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe', 'Eğitim', 'Göztepe', 'Merdivenköy', 'Bostancı', 'Caddebostan'],
    'Beşiktaş': ['Levent', 'Etiler', 'Bebek', 'Arnavutköy', 'Ortaköy', 'Gayrettepe', 'Dikilitaş', 'Muradiye', 'Abbasağa', 'Vişnezade'],
    'Fatih': ['Aksaray', 'Balat', 'Eminönü', 'Sultanahmet', 'Sirkeci', 'Beyazıt', 'Çapa', 'Kocamustafapaşa', 'Yedikule', 'Karagümrük'],
    'Sarıyer': ['Tarabya', 'İstinye', 'Yeniköy', 'Maslak', 'Zekeriyaköy', 'Reşitpaşa', 'Ayazağa', 'Bahçeköy', 'Kireçburnu', 'Emirgan'],
    'Çankaya': ['Kızılay', 'Kavaklıdere', 'Maltepe', 'Bahçelievler', 'Ayrancı', 'Dikmen', 'Oran', 'Yıldız', 'Ümitköy', 'Çayyolu'],
    'Konak': ['Alsancak', 'Göztepe', 'Hatay', 'Basmane', 'Kahramanlar', 'Küçükyalı', 'Güzelyalı', 'Pasaport', 'Kemeraltı', 'Kadifekale'],
};

const universities = ['Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Galatasaray Üniversitesi'];
const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];

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
          <Link href="/login/selection?action=register" className="font-medium text-primary hover:underline">Kayıt Ol</Link>
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
        <Link href="/login/selection?action=login" className="font-medium text-primary hover:underline">Giriş Yap</Link>
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
            <Link href="/login/selection?action=register" className="font-medium text-primary hover:underline">Başvur</Link>
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

    // Brand category-based donation rates state
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
                        <Card>
                            <CardHeader><CardTitle className="text-lg">İletişim & Adres</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>E-posta</Label><Input type="email" placeholder="iletisim@ornek.org" required /></div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>İl</Label>
                                        <Select value={officeCity} onValueChange={(val) => { setOfficeCity(val); setOfficeDistrict(''); setOfficeNeighborhood(''); }}>
                                            <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                            <SelectContent>{allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>İlçe</Label>
                                        <Select value={officeDistrict} onValueChange={(val) => { setOfficeDistrict(val); setOfficeNeighborhood(''); }} disabled={!officeCity}>
                                            <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                            <SelectContent>{officeCity && districts[officeCity]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mahalle</Label>
                                        <Select value={officeNeighborhood} onValueChange={setOfficeNeighborhood} disabled={!officeDistrict}>
                                            <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                                            <SelectContent>{officeDistrict && (neighborhoods[officeDistrict] || ['Merkez', 'Cumhuriyet', 'Hürriyet']).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2"><Label>Açık Adres</Label><Input placeholder="Sokak, kapı no..." /></div>
                            </CardContent>
                        </Card>
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
                                                    <Input 
                                                        placeholder="Giyim, Gıda vb." 
                                                        value={item.category} 
                                                        onChange={(e) => updateDonationRate(index, 'category', e.target.value)}
                                                    />
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
                <Link href="/login/selection?action=login" className="font-medium text-primary hover:underline">Giriş Yap</Link>
            </div>
        </div>
    );
}

function SelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action') || 'login';

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

        <Tabs defaultValue="individual" className="w-full">
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
