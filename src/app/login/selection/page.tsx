
'use client';

import React, { useState, Suspense, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Plus, X, Instagram, Facebook, Linkedin, Twitter, Youtube, Link as LinkIcon, Search, Sparkles, Building, HandCoins, HeartHandshake } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, allUniversities, provincialDirectorates } from '@/lib/data';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';


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
    'Çankırı': ['Merkez', 'Atkaracalar', 'Bayramören', 'Çerkeş', 'Eldivan', 'Ilgaz', 'Kızılırmak', 'Korgun', 'Kurşunlu', 'Orta', 'Şabanözü', 'Yapraklı'],
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
    'Manisa': ['Ahmetli', 'Akhisar', 'Alaşehir', 'Demirci', 'Gölmarmara', 'Gördes', 'Kırkağaç', 'Köprübaşı', 'Kula', 'Salihli', 'Sarıgöl', 'Saruhanlı', 'Selendi', 'Soma', 'Şehzadeler', 'Turgutlu', 'Yunusemre'],
    'Kahramanmaraş': ['Afşin', 'Andırın', 'Çağlayancerit', 'Dulkadiroğlu', 'Ekinözü', 'Elbistan', 'Göksun', 'Nurhak', 'Onikişubat', 'Pazarcık', 'Türkoğlu'],
    'Mardin': ['Artuklu', 'Dargeçit', 'Derik', 'Kızıltepe', 'Mazıdağı', 'Midyat', 'Nusaybin', 'Ömerli', 'Savur', 'Yeşilli'],
    'Muğla': ['Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz', 'Marmaris', 'Menteşe', 'Milas', 'Ortaca', 'Seydikemer', 'Ula', 'Yatağan'],
    'Muş': ['Merkez', 'Bulanık', 'Hasköy', 'Korkut', 'Malazgirt', 'Varto'],
    'Nevşehir': ['Merkez', 'Acıgöl', 'Avanos', 'Derinkuyu', 'Gülşehir', 'Hacıbektaş', 'Kozaklı', 'Ürgüp'],
    'Niğde': ['Merkez', 'Altunhisar', 'Bor', 'Çamardı', 'Çiftlik', 'Ulukışla'],
    'Ordu': ['Akkuş', 'Altınordu', 'Aybastı', 'Çamaş', 'Çatalpınar', 'Çaybaşı', 'Fatsa', 'Gölköy', 'Gülyalı', 'Gürgentepe', 'İkizce', 'Kabadüz', 'Kabataş', 'Korgan', 'Kumru', 'Mesudiye', 'Perşembe', 'Ulubey', 'Ünye'],
    'Osmaniye': ['Merkez', 'Bahçe', 'Düziçi', 'Hasanbeyli', 'Kadirli', 'Sumbas', 'Toprakkale'],
    'Rize': ['Merkez', 'Ardeşen', 'Fındıklı', 'İyidere', 'Çamlıhemşin', 'Güneysu', 'Kalkandere', 'Çayeli', 'Hemşin', 'Pazar', 'Derepazarı', 'İkizdere'],
    'Sakarya': ['Adapazarı', 'Ferizli', 'Karasu', 'Sapanca', 'Akyazı', 'Geyve', 'Kaynarca', 'Serdivan', 'Arifiye', 'Hendek', 'Kocaali', 'Söğütlü', 'Erenler', 'Karapürçek', 'Pamukova', 'Taraklı'],
    'Samsun': ['19 Mayıs', 'Alaçam', 'Asarcık', 'Atakum', 'Ayvacık', 'Bafra', 'Canik', 'Çarşamba', 'Havza', 'İlkadım', 'Kavak', 'Ladik', 'Salıpazarı', 'Tekkeköy', 'Terme', 'Vezirköprü', 'Yakakent'],
    'Şanlıurfa': ['Akçakale', 'Birecik', 'Bozova', 'Ceylanpınar', 'Eyyübiye', 'Halfeti', 'Haliliye', 'Harran', 'Hilvan', 'Karaköprü', 'Siverek', 'Suruç', 'Viranşehir'],
    'Siirt': ['Merkez', 'Baykan', 'Eruh', 'Kurtalan', 'Pervari', 'Şirvan', 'Tillo'],
    'Sinop': ['Merkez', 'Ayancık', 'Boyabat', 'Dikmen', 'Durağan', 'Erfelek', 'Gerze', 'Saraydüzü', 'Türkeli'],
    'Sivas': ['Merkez', 'Akıncılar', 'Altınyayla', 'Divriği', 'Doğanşar', 'Gemerek', 'Gölova', 'Gürün', 'Hafik', 'İmranlı', 'Kangal', 'Koyulhisar', 'Suşehri', 'Şarkışla', 'Ulaş', 'Yıldızeli', 'Zara'],
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
    'Aksaray': ['Merkez', 'Ağaçören', 'Eskil', 'Gülağaç', 'Güzelyurt', 'Ortaköy', 'Sarıyahşi', 'Sultanhanı'],
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

const IndividualForm = ({ isRegister = false, onComplete }: { isRegister?: boolean; onComplete: () => void }) => {
    const { toast } = useToast();
    const auth = useAuth();
    const router = useRouter();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!phoneNumber || phoneNumber.trim() === "") {
            toast({
                variant: "destructive",
                title: "Eksik Bilgi",
                description: "Telefon numarası alanı boş bırakılamaz.",
            });
            return;
        }

        const email = `${phoneNumber}@hangel.org`; // Create a fake email from phone number
        
        try {
            if (isRegister) {
                if (!name || name.trim() === "") {
                    toast({
                        variant: "destructive",
                        title: "Eksik Bilgi",
                        description: "Ad Soyad alanı boş bırakılamaz.",
                    });
                    return;
                }
                await createUserWithEmailAndPassword(auth, email, password);
                toast({ title: "Kayıt Başarılı!", description: "hangel'e hoş geldin!" });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                toast({ title: "Giriş Başarılı!" });
            }
            onComplete();
        } catch (error: any) {
            console.error("Authentication error:", error);
            let description = "Bir hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.";
            const title = isRegister ? "Kayıt Hatası" : "Giriş Hatası";
            switch(error.code) {
                case 'auth/invalid-email':
                    description = 'Girdiğiniz telefon numarası geçersiz. Lütfen kontrol ediniz.';
                    break;
                case 'auth/user-not-found':
                    description = 'Bu telefon numarası ile kayıtlı bir kullanıcı bulunamadı.';
                    break;
                case 'auth/wrong-password':
                    description = 'Yanlış şifre. Lütfen tekrar deneyin.';
                    break;
                case 'auth/email-already-in-use':
                    description = 'Bu telefon numarası zaten kayıtlı. Lütfen giriş yapmayı deneyin.';
                    break;
                case 'auth/weak-password':
                    description = 'Şifre en az 6 karakter olmalıdır.';
                    break;
            }
            toast({
                variant: "destructive",
                title: title,
                description: description,
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in-0">
            {isRegister && (
                <div className="space-y-2"><Label>Ad Soyad</Label><Input required value={name} onChange={e => setName(e.target.value)} /></div>
            )}
            <div className="space-y-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input id="phone" type="tel" placeholder="5XXXXXXXXX" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <div className="space-y-3">
                <div className="flex items-start space-x-2">
                   <Checkbox id="terms-user" required />
                    <Label htmlFor="terms-user" className="text-xs font-normal text-muted-foreground">
                        <span><Link href="/settings/contracts/kullanici-sozlesmesi" className="underline hover:text-primary">Kullanıcı Sözleşmesini</Link> okudum ve onaylıyorum.</span>
                    </Label>
                </div>
                 <div className="flex items-start space-x-2">
                    <Checkbox id="terms-privacy" required />
                    <Label htmlFor="terms-privacy" className="text-xs font-normal text-muted-foreground">
                       <span><Link href="/settings/contracts/gizlilik-politikasi" className="underline hover:text-primary">Gizlilik Politikası</Link> ve <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="underline hover:text-primary">KVKK Aydınlatma Metnini</Link> okudum ve onaylıyorum.</span>
                    </Label>
                </div>
                {isRegister && (
                    <>
                         <div className="flex items-start space-x-2">
                            <Checkbox id="terms-consent" required />
                            <Label htmlFor="terms-consent" className="text-xs font-normal text-muted-foreground">
                               <span><Link href="/settings/contracts/acik-riza-metni" className="underline hover:text-primary">Açık Rıza Metnini</Link> okudum, onaylıyorum.</span>
                            </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Checkbox id="terms-donation" required />
                             <Label htmlFor="terms-donation" className="text-xs font-normal text-muted-foreground">
                                <span><Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="underline hover:text-primary">Bağış ve Yardım Politikasını</Link> okudum ve onaylıyorum.</span>
                            </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                            <Checkbox id="terms-volunteer" required />
                             <Label htmlFor="terms-volunteer" className="text-xs font-normal text-muted-foreground">
                               <span><Link href="/settings/contracts/gonulluluk-sozlesmesi" className="underline hover:text-primary">Gönüllülük Sözleşmesini</Link> okudum ve onaylıyorum.</span>
                            </Label>
                        </div>
                    </>
                )}
            </div>
            <Button type="submit" className="w-full">{isRegister ? 'Kayıt Ol' : 'Giriş Yap'}</Button>
        </form>
    );
};

const CorporateForm = ({ onComplete }: { onComplete: () => void }) => {
    const [corporateType, setCorporateType] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete();
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="org-type">Kuruluş Türü</Label>
                <Select required onValueChange={setCorporateType}>
                    <SelectTrigger id="org-type"><SelectValue placeholder="Kuruluş türünü seçin..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NGO">Sivil Toplum Kuruluşu (STK)</SelectItem>
                        <SelectItem value="BRAND">Marka / Sosyal İşletme</SelectItem>
                        <SelectItem value="CLUB">Öğrenci Kulübü</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {corporateType && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in-0">
                    {corporateType === 'NGO' && <NgoForm />}
                    {corporateType === 'BRAND' && <BrandForm />}
                    {corporateType === 'CLUB' && <ClubForm />}
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Sözleşme Onayları</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <Checkbox id="terms-corp-1" required />
                                <Label htmlFor="terms-corp-1" className="text-xs font-normal text-muted-foreground">
                                    <span><Link href="/settings/contracts/kurulus-sozlesmesi" className="font-medium text-primary hover:underline">Kuruluş Sözleşmesini</Link> okudum, anladım ve onaylıyorum.</span>
                                </Label>
                            </div>
                            <div className="flex items-start space-x-3">
                                <Checkbox id="terms-corp-2" required />
                                <Label htmlFor="terms-corp-2" className="text-xs font-normal text-muted-foreground">
                                    <span><Link href="/settings/contracts/sosyal-etki-politikasi" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link> ve <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="font-medium text-primary hover:underline">Bağış ve Yardım Politikasını</Link> okudum, anladım ve onaylıyorum.</span>
                                </Label>
                            </div>
                             <div className="flex items-start space-x-3">
                                <Checkbox id="terms-corp-3" required />
                                <Label htmlFor="terms-corp-3" className="text-xs font-normal text-muted-foreground">
                                    <span><Link href="/settings/contracts/gizlilik-politikasi" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link> ve ilgili veri koruma beyanlarını okudum, anladım ve onaylıyorum.</span>
                                </Label>
                            </div>
                        </CardContent>
                    </Card>
                    <Button type="submit" className="w-full">Başvuruyu Gönder</Button>
                </form>
            )}
        </div>
    )
};

const NgoForm = () => {
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [aboutText, setAboutText] = useState("");
    const ABOUT_LIMIT = 1000;
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
            <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
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
    )
};

const BrandForm = () => {
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [donationRates, setDonationRates] = useState([{ category: '', rate: '' }]);
    const [ecommerceInfra, setEcommerceInfra] = useState('');

    const addDonationRate = () => setDonationRates([...donationRates, { category: '', rate: '' }]);
    const removeDonationRate = (index: number) => {
      if (donationRates.length > 1) {
          setDonationRates(donationRates.filter((_, i) => i !== index));
      }
    };
    const updateDonationRate = (index: number, field: 'category' | 'rate', value: string) => {
        const updated = [...donationRates];
        updated[index][field] = value;
        setDonationRates(updated);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Marka Kimliği</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Marka Adı</Label><Input placeholder="Markanızın adı" required /></div>
                    <div className="space-y-2">
                        <Label>Marka Türü</Label>
                        <Select required>
                            <SelectTrigger><SelectValue placeholder="Marka türünü seçin..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brand">Ticari Şirket</SelectItem>
                                <SelectItem value="cooperative">Kooperatif</SelectItem>
                                <SelectItem value="social">Sosyal Şirket</SelectItem>
                                <SelectItem value="economic">İktisadi İşletme</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label>Telefon Numarası</Label><Input type="tel" placeholder="5XX XXX XX XX" /></div>
                    <div className="space-y-2"><Label>Web Sitesi</Label><Input placeholder="https://marka.com" /></div>
                    <FileUpload label="Marka Logosu" accept=".jpg,.jpeg,.png" hint="Desteklenen formatlar: .jpg, .png" />
                    <div className="space-y-4 border-t pt-4">
                        <Label className="text-base font-semibold">Kategori Bazlı Bağış Oranları (%)</Label>
                        <p className="text-xs text-muted-foreground">Markanızın farklı kategorileri için taahhüt ettiği bağış oranlarını girin.</p>
                        <div className="space-y-3">
                            {donationRates.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Kategori</Label>
                                        <Select value={item.category} onValueChange={(val) => updateDonationRate(index, 'category', val)}>
                                            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {marketCategoryLabels.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Oran (%)</Label>
                                        <Input type="number" placeholder="5" value={item.rate} onChange={(e) => updateDonationRate(index, 'rate', e.target.value)} />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10 hover:bg-destructive/10" onClick={() => removeDonationRate(index)} disabled={donationRates.length === 1}>
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
                 <CardHeader>
                    <CardTitle className="text-lg">Affiliate & E-Ticaret</CardTitle>
                    <CardDescription>Pazar yeri entegrasyonu ve gelir ortaklığı bilgileri.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Affiliate Marketing Kodu</Label>
                        <Input placeholder="Affiliate/Gelir Ortaklığı kodu" />
                    </div>
                    <div className="space-y-2">
                        <Label>E-ticaret Altyapısı</Label>
                        <Select value={ecommerceInfra} onValueChange={setEcommerceInfra}>
                            <SelectTrigger><SelectValue placeholder="Altyapı seçin..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shopify">Shopify</SelectItem>
                                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                                <SelectItem value="ticimax">Ticimax</SelectItem>
                                <SelectItem value="ikas">Ikas</SelectItem>
                                <SelectItem value="tsoft">Tsoft</SelectItem>
                                <SelectItem value="ideasoft">ideasoft</SelectItem>
                                <SelectItem value="wix">Wix</SelectItem>
                                <SelectItem value="wordpress">Wordpress</SelectItem>
                                <SelectItem value="custom">Özel Altyapı</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {ecommerceInfra === 'other' && (
                        <div className="space-y-2 animate-in fade-in-0">
                            <Label>Diğer E-ticaret Altyapısı</Label>
                            <Input placeholder="Altyapı adını yazın..." />
                        </div>
                    )}
                </CardContent>
            </Card>
            <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
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
    )
};

const ClubForm = () => {
    const [schoolType, setSchoolType] = useState('');
    const [highSchoolProvince, setHighSchoolProvince] = useState('');
    const [highSchoolDistrict, setHighSchoolDistrict] = useState('');
    const [faculty, setFaculty] = useState('');
    const [department, setDepartment] = useState('');

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Kulüp Türü</Label>
                        <Select onValueChange={setSchoolType}>
                            <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="university">Üniversite</SelectItem>
                                <SelectItem value="high-school">Lise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {schoolType === 'university' && (
                        <div className="space-y-2">
                            <Label>Üniversite</Label>
                            <Select><SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {schoolType === 'high-school' && (
                        <>
                            <div className="space-y-2">
                                <Label>Okulunuzun bağlı olduğu il müdürlüğü</Label>
                                <Select onValueChange={(value) => {
                                    const province = value.replace(' İl Millî Eğitim Müdürlüğü', '');
                                    setHighSchoolProvince(province);
                                    setHighSchoolDistrict('');
                                }}>
                                    <SelectTrigger><SelectValue placeholder="İl müdürlüğü seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {provincialDirectorates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {highSchoolProvince && (
                                <div className="space-y-2">
                                    <Label>Bağlı bulunduğu ilçe müdürlüğü</Label>
                                    <Select value={highSchoolDistrict} onValueChange={setHighSchoolDistrict}>
                                        <SelectTrigger><SelectValue placeholder="İlçe müdürlüğü seçin..." /></SelectTrigger>
                                        <SelectContent>
                                            {(districts[highSchoolProvince] || []).map(d => <SelectItem key={d} value={`${d} İlçe Millî Eğitim Müdürlüğü`}>{`${d} İlçe Millî Eğitim Müdürlüğü`}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </>
                    )}
                    <div className="space-y-2"><Label>Kulüp Adı</Label><Input placeholder="Kulübünüzün tam adı" required /></div>
                    <div className="space-y-2"><Label>Telefon Numarası</Label><Input type="tel" placeholder="5XX XXX XX XX" /></div>
                    <div className="space-y-2"><Label>Yetkili E-posta</Label><Input type="email" placeholder="kulup@okul.edu.tr" required /></div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Kulüp Başkanı Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Ad Soyad</Label><Input placeholder="Başkanın adı soyadı" required /></div>
                    <div className="space-y-2"><Label>E-posta</Label><Input type="email" placeholder="baskan@okul.edu.tr" required /></div>
                    <div className="space-y-2"><Label>Telefon</Label><Input type="tel" placeholder="5XX XXX XX XX" required /></div>
                    {schoolType === 'university' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Fakülte</Label><Input placeholder="Mühendislik Fakültesi" /></div>
                                <div className="space-y-2"><Label>Bölüm</Label><Input placeholder="Bilgisayar Mühendisliği" /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Sınıf</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Sınıf seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1. Sınıf</SelectItem>
                                        <SelectItem value="2">2. Sınıf</SelectItem>
                                        <SelectItem value="3">3. Sınıf</SelectItem>
                                        <SelectItem value="4">4. Sınıf</SelectItem>
                                        <SelectItem value="5">5+ Sınıf</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-lg">Akademik Danışman Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Label>Ad Soyad</Label><Input placeholder="Danışmanın adı soyadı" required /></div>
                    <div className="space-y-2"><Label>E-posta</Label><Input type="email" placeholder="danisman@okul.edu.tr" required /></div>
                    <div className="space-y-2"><Label>Telefon</Label><Input type="tel" placeholder="5XX XXX XX XX" required /></div>
                     {schoolType === 'university' && (
                        <>
                            <div className="space-y-2"><Label>Unvan</Label><Input placeholder="Prof. Dr. / Doç. Dr. / Dr. Öğr. Üyesi" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Fakülte</Label><Input placeholder="Mühendislik Fakültesi" /></div>
                                <div className="space-y-2"><Label>Bölüm</Label><Input placeholder="Bilgisayar Mühendisliği" /></div>
                            </div>
                        </>
                    )}
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
    )
};

const PostRegistrationSurvey = ({ open, onOpenChange, onComplete }: { open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) => {
    const [step, setStep] = useState(1);
    
    const surveyOptions1 = ["Sosyal Medya", "Arkadaş Tavsiyesi", "Haberler / Basın", "Reklam", "Okul / İş yeri", "Diğer"];
    const surveyOptions2 = ["Bağış Modeli", "Gönüllülük Fırsatları", "STK Çeşitliliği", "Topluluk ve Etkileşim", "Teknolojik Altyapı", "Diğer"];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {step === 1 ? "Sizi Tanıyalım" : "Son Bir Adım"}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <Label className="text-center block font-semibold">hangel'i nereden duydunuz?</Label>
                            <RadioGroup defaultValue={surveyOptions1[0]} className="grid grid-cols-2 gap-2">
                                {surveyOptions1.map(option => (
                                    <div key={option} className="flex items-center">
                                        <RadioGroupItem value={option} id={`q1-${option}`} className="peer sr-only" />
                                        <Label htmlFor={`q1-${option}`} className="flex w-full items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <Button onClick={() => setStep(2)} className="w-full mt-4">İleri</Button>
                        </div>
                    ) : (
                         <div className="space-y-4">
                            <Label className="text-center block font-semibold">Kayıt olma kararınızı etkileyen en önemli faktör neydi?</Label>
                            <RadioGroup defaultValue={surveyOptions2[0]} className="grid grid-cols-2 gap-2">
                                {surveyOptions2.map(option => (
                                    <div key={option} className="flex items-center">
                                        <RadioGroupItem value={option} id={`q2-${option}`} className="peer sr-only" />
                                        <Label htmlFor={`q2-${option}`} className="flex w-full h-full items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <Button onClick={onComplete} className="w-full mt-4">Bitir</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type');
    const [showSurvey, setShowSurvey] = useState(false);
  
    const handleActionChange = (value: string) => {
        router.push(`/login/selection?action=${value}${type ? `&type=${type}`: ''}`);
    };

    const handleTypeChange = (value: string) => {
        const currentAction = action || 'register';
        if (value === 'individual') {
            router.push(`/login/selection?action=${currentAction}`);
        } else {
            router.push(`/login/selection?action=${currentAction}&type=${value}`);
        }
    };
    
    const handleRegistrationComplete = () => {
        setShowSurvey(true);
    };

    const handleLoginComplete = () => {
        router.push('/timeline');
    }

    const handleSurveyComplete = () => {
        setShowSurvey(false);
        router.push(type === 'corporate' ? '/admin' : '/timeline');
    }

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4">
                    <ArrowLeft />
                </Button>
                <Card className="rounded-2xl shadow-2xl">
                     <CardHeader className="text-center">
                        <CardTitle className="text-2xl">hangel'a {action === 'register' ? 'Kayıt Ol' : 'Giriş Yap'}</CardTitle>
                        <CardDescription>Toplumsal etki için aramıza katılın.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <Tabs defaultValue={action} onValueChange={handleActionChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                                <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {action === 'login' ? <IndividualForm onComplete={handleLoginComplete} /> : (
                            <div className="space-y-4 pt-4 border-t">
                                <Label>Hesap Tipi</Label>
                                <Select onValueChange={handleTypeChange} defaultValue={type ? 'corporate' : 'individual'}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Hesap tipi seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Bireysel</SelectItem>
                                        <SelectItem value="corporate">Kurumsal (STK, Marka, Kulüp)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {type === 'corporate' ? <CorporateForm onComplete={handleRegistrationComplete} /> : <IndividualForm isRegister={true} onComplete={handleRegistrationComplete} />}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
             <PostRegistrationSurvey open={showSurvey} onOpenChange={setShowSurvey} onComplete={handleSurveyComplete} />
        </div>
    )
}

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <FormRenderer />
    </Suspense>
  );
}
