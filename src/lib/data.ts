import {
    Leaf,
    GraduationCap,
    Palette,
    Handshake,
    Briefcase,
    BookOpen,
    Droplets,
    PawPrint,
    Siren,
    Stethoscope,
    HandHeart,
    Accessibility,
    Baby,
    Scale,
    Plane,
    ShieldX,
    UserRoundCog,
    Sprout,
    Dumbbell,
} from 'lucide-react';
import type { NGO, Brand, Volunteering, Badge, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, Post } from './types';

// Full list of unique country phone codes
export const countryPhoneCodes = [
  "93", "355", "213", "376", "244", "1", "54", "374", "61", "43", "994", "973", "880", "375", "32", "501", "229", "975", "591", "387", "267", "55", "673", "359", "226", "257", "855", "237", "1", "238", "236", "235", "56", "86", "57", "269", "242", "243", "682", "506", "385", "53", "357", "420", "45", "253", "1", "1", "593", "20", "503", "240", "291", "372", "251", "500", "298", "679", "358", "33", "594", "689", "241", "220", "995", "49", "233", "350", "30", "299", "1", "590", "1", "502", "224", "245", "592", "5", "504", "852", "36", "354", "91", "62", "98", "964", "353", "972", "39", "225", "1", "81", "962", "7", "254", "686", "850", "82", "965", "996", "856", "371", "961", "266", "231", "218", "423", "370", "352", "853", "389", "261", "265", "60", "960", "223", "356", "692", "596", "222", "230", "262", "52", "691", "373", "377", "976", "382", "1", "212", "258", "95", "264", "674", "977", "31", "599", "687", "64", "505", "227", "234", "683", "672", "670", "47", "968", "92", "680", "970", "507", "675", "595", "51", "63", "48", "351", "1", "974", "262", "40", "7", "250", "290", "1", "1", "1", "508", "1", "685", "378", "239", "966", "221", "381", "248", "232", "65", "421", "386", "677", "252", "27", "34", "94", "249", "597", "268", "46", "41", "963", "886", "992", "255", "66", "228", "690", "676", "1", "216", "90", "993", "1", "688", "256", "380", "971", "44", "1", "598", "998", "678", "379", "58", "84", "681", "967", "260", "263"
];

export const districtsData: { [key: string]: string[] } = {
  "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
  "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
  "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
  "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
  "Aksaray": ["Ağaçören", "Eskil", "Gülağaç", "Güzelyurt", "Merkez", "Ortaköy", "Sarıyahşi", "Sultanhanı"],
  "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
  "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kahramankazan", "Kalecik", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
  "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
  "Ardahan": ["Çıldır", "Damal", "Göle", "Hanak", "Merkez", "Posof"],
  "Artvin": ["Ardanuç", "Arhavi", "Borçka", "Hopa", "Kemalpaşa", "Merkez", "Murgul", "Şavşat", "Yusufeli"],
  "Aydın": ["Bozdoğan", "Buharkent", "Çine", "Didim", "Efeler", "Germencik", "İncirliova", "Karacasu", "Karpuzlu", "Koçarlı", "Köşk", "Kuşadası", "Kuyucak", "Nazilli", "Söke", "Sultanhisar", "Yenipazar"],
  "Balıkesir": ["Altıeylül", "Ayvalık", "Balya", "Bandırma", "Bigadiç", "Burhaniye", "Dursunbey", "Edremit", "Erdek", "Gömeç", "Gönen", "Havran", "İvrindi", "Karesi", "Kepsut", "Manyas", "Marmara", "Savaştepe", "Sındırgı", "Susurluk"],
  "Bartın": ["Amasra", "Kurucaşile", "Merkez", "Ulus"],
  "Batman": ["Beşiri", "Gercüş", "Hasankeyf", "Kozluk", "Merkez", "Sason"],
  "Bayburt": ["Aydıntepe", "Demirözü", "Merkez"],
  "Bilecik": ["Bozöyük", "Gölpazarı", "İnhisar", "Merkez", "Osmaneli", "Pazaryeri", "Söğüt", "Yenipazar"],
  "Bingöl": ["Adaklı", "Genç", "Karlıova", "Kiğı", "Merkez", "Solhan", "Yayladere", "Yedisu"],
  "Bitlis": ["Adilcevaz", "Ahlat", "Güroymak", "Hizan", "Merkez", "Mutki", "Tatvan"],
  "Bolu": ["Dörtdivan", "Gerede", "Göynük", "Kıbrıscık", "Mengen", "Merkez", "Mudurnu", "Seben", "Yeniçağa"],
  "Burdur": ["Altınyayla", "Bucak", "Çavdır", "Çeltikçi", "Gölhisar", "Karamanlı", "Kemer", "Merkez", "Tefenni", "Yeşilova"],
  "Bursa": ["Büyükorhan", "Gemlik", "Gürsu", "Harmancık", "İnegöl", "İznik", "Karacabey", "Keles", "Kestel", "Mudanya", "Mustafakemalpaşa", "Nilüfer", "Orhaneli", "Orhangazi", "Osmangazi", "Yenişehir", "Yıldırım"],
  "Çanakkale": ["Ayvacık", "Bayramiç", "Biga", "Bozcaada", "Çan", "Eceabat", "Ezine", "Gelibolu", "Gökçeada", "Lapseki", "Merkez", "Yenice"],
  "Çankırı": ["Atkaracalar", "Bayramören", "Çerkeş", "Eldivan", "Ilgaz", "Kızılırmak", "Korgun", "Kurşunlu", "Merkez", "Orta", "Şabanözü", "Yapraklı"],
  "Çorum": ["Alaca", "Bayat", "Boğazkale", "Dodurga", "İskilip", "Kargı", "Laçin", "Mecitözü", "Merkez", "Oğuzlar", "Ortaköy", "Osmancık", "Sungurlu", "Uğurludağ"],
  "Denizli": ["Acıpayam", "Babadağ", "Baklan", "Bekilli", "Beyağaç", "Bozkurt", "Buldan", "Çal", "Çameli", "Çardak", "Çivril", "Güney", "Honaz", "Kale", "Merkez", "Pamukkale", "Sarayköy", "Serinhisar", "Tavas"],
  "Diyarbakır": ["Bağlar", "Bismil", "Çermik", "Çınar", "Çüngüş", "Dicle", "Eğil", "Ergani", "Hani", "Hazro", "Kayapınar", "Kocaköy", "Kulp", "Lice", "Silvan", "Sur", "Yenişehir"],
  "Düzce": ["Akçakoca", "Çilimli", "Cumayeri", "Gölyaka", "Gümüşova", "Kaynaşlı", "Merkez", "Yığılca"],
  "Edirne": ["Enez", "Havsa", "İpsala", "Keşan", "Lalapaşa", "Meriç", "Merkez", "Süloğlu", "Uzunköprü"],
  "Elazığ": ["Ağın", "Alacakaya", "Arıcak", "Baskil", "Karakoçan", "Keban", "Kovancılar", "Maden", "Merkez", "Palu", "Sivrice"],
  "Erzincan": ["Çayırlı", "İliç", "Kemah", "Kemaliye", "Merkez", "Otlukbeli", "Refahiye", "Tercan", "Üzümlü"],
  "Erzurum": ["Aşkale", "Aziziye", "Çat", "Hınıs", "Horasan", "İspir", "Karaçoban", "Karayazı", "Köprüköy", "Narman", "Oltu", "Olur", "Palandöken", "Pasinler", "Pazaryolu", "Şenkaya", "Tekman", "Tortum", "Uzundere", "Yakutiye"],
  "Eskişehir": ["Alpu", "Beylikova", "Çifteler", "Günyüzü", "Han", "İnönü", "Mahmudiye", "Mihalgazi", "Mihalıççık", "Odunpazarı", "Sarıcakaya", "Seyitgazi", "Sivrihisar", "Tepebaşı"],
  "Gaziantep": ["Araban", "İslahiye", "Karkamış", "Nizip", "Nurdağı", "Oğuzeli", "Şahinbey", "Şehitkamil", "Yavuzeli"],
  "Giresun": ["Alucra", "Bulancak", "Çamoluk", "Çanakçı", "Dereli", "Doğankent", "Espiye", "Eynesil", "Görele", "Güce", "Keşap", "Merkez", "Piraziz", "Şebinkarahisar", "Tirebolu", "Yağlıdere"],
  "Gümüşhane": ["Kelkit", "Köse", "Kürtün", "Merkez", "Şiran", "Torul"],
  "Hakkâri": ["Çukurca", "Derecik", "Merkez", "Şemdinli", "Yüksekova"],
  "Hatay": ["Altınözü", "Antakya", "Arsuz", "Belen", "Defne", "Dörtyol", "Erzin", "Hassa", "İskenderun", "Kırıkhan", "Kumlu", "Payas", "Reyhanlı", "Samandağ", "Yayladağı"],
  "Iğdır": ["Aralık", "Karakoyunlu", "Merkez", "Tuzluca"],
  "Isparta": ["Aksu", "Atabey", "Eğirdir", "Gelendost", "Gönen", "Keçiborlu", "Merkez", "Senirkent", "Sütçüler", "Şarkikaraağaç", "Uluborlu", "Yalvaç", "Yenişarbademli"],
  "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kâğıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
  "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"],
  "Kahramanmaraş": ["Afşin", "Andırın", "Çağlayancerit", "Dulkadiroğlu", "Ekinözü", "Elbistan", "Göksun", "Nurhak", "Onikişubat", "Pazarcık", "Türkoğlu"],
  "Karabük": ["Eflani", "Eskipazar", "Merkez", "Ovacık", "Safranbolu", "Yenice"],
  "Karaman": ["Ayrancı", "Başyayla", "Ermenek", "Kazımkarabekir", "Merkez", "Sarıveliler"],
  "Kars": ["Akyaka", "Arpaçay", "Digor", "Kağızman", "Merkez", "Sarıkamış", "Selim", "Susuz"],
  "Kastamonu": ["Abana", "Ağlı", "Araç", "Azdavay", "Bozkurt", "Çatalzeytin", "Cide", "Daday", "Devrekani", "Doğanyurt", "Hanönü", "İhsangazi", "İnebolu", "Küre", "Merkez", "Pınarbaşı", "Seydiler", "Şenpazar", "Taşköprü", "Tosya"],
  "Kayseri": ["Akkışla", "Bünyan", "Develi", "Felahiye", "Hacılar", "İncesu", "Kocasinan", "Melikgazi", "Özvatan", "Pınarbaşı", "Sarıoğlan", "Sarız", "Talas", "Tomarza", "Yahyalı", "Yeşilhisar"],
  "Kırıkkale": ["Bahşili", "Balışeyh", "Çelebi", "Delice", "Karakeçili", "Keskin", "Merkez", "Sulakyurt", "Yahşihan"],
  "Kırklareli": ["Babaeski", "Demirköy", "Kofçaz", "Lüleburgaz", "Merkez", "Pehlivanköy", "Pınarhisar", "Vize"],
  "Kırşehir": ["Akçakent", "Akpınar", "Boztepe", "Çiçekdağı", "Kaman", "Merkez", "Mucur"],
  "Kilis": ["Elbeyli", "Merkez", "Musabeyli", "Polateli"],
  "Kocaeli": ["Başiskele", "Çayırova", "Darıca", "Derince", "Dilovası", "Gebze", "Gölcük", "İzmit", "Kandıra", "Karamürsel", "Kartepe", "Körfez"],
  "Konya": ["Ahırlı", "Akören", "Akşehir", "Altınekin", "Beyşehir", "Bozkır", "Cihanbeyli", "Çeltik", "Çumra", "Derbent", "Derebucak", "Doğanhisar", "Emirgazi", "Ereğli", "Güneysinir", "Hadim", "Halkapınar", "Hüyük", "Ilgın", "Kadınhanı", "Karapınar", "Karatay", "Kulu", "Meram", "Sarayönü", "Selçuklu", "Seydişehir", "Taşkent", "Tuzlukçu", "Yalıhüyük", "Yunak"],
  "Kütahya": ["Altıntaş", "Aslanapa", "Çavdarhisar", "Domaniç", "Dumlupınar", "Emet", "Gediz", "Hisarcık", "Merkez", "Pazarlar", "Simav", "Şaphane", "Tavşanlı"],
  "Malatya": ["Akçadağ", "Arapgir", "Arguvan", "Battalgazi", "Darende", "Doğanşehir", "Doğanyol", "Hekimhan", "Kale", "Kuluncak", "Pütürge", "Yazıhan", "Yeşilyurt"],
  "Manisa": ["Ahmetli", "Akhisar", "Alaşehir", "Demirci", "Gölmarmara", "Gördes", "Kırkağaç", "Köprübaşı", "Kula", "Merkez", "Salihli", "Sarıgöl", "Saruhanlı", "Selendi", "Soma", "Şehzadeler", "Turgutlu", "Yunusemre"],
  "Mardin": ["Artuklu", "Dargeçit", "Derik", "Kızıltepe", "Mazıdağı", "Midyat", "Nusaybin", "Ömerli", "Savur", "Yeşilli"],
  "Mersin": ["Akdeniz", "Anamur", "Aydıncık", "Bozyazı", "Çamlıyayla", "Erdemli", "Gülnar", "Mezitli", "Mut", "Silifke", "Tarsus", "Toroslar", "Yenişehir"],
  "Muğla": ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz", "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula", "Yatağan"],
  "Muş": ["Bulanık", "Hasköy", "Korkut", "Malazgirt", "Merkez", "Varto"],
  "Nevşehir": ["Acıgöl", "Avanos", "Derinkuyu", "Gülşehir", "Hacıbektaş", "Kozaklı", "Merkez", "Ürgüp"],
  "Niğde": ["Altunhisar", "Bor", "Çamardı", "Çiftlik", "Merkez", "Ulukışla"],
  "Ordu": ["Akkuş", "Altınordu", "Aybastı", "Çamaş", "Çatalpınar", "Çaybaşı", "Fatsa", "Gölköy", "Gülyalı", "Gürgentepe", "İkizce", "Kabadüz", "Kabataş", "Korgan", "Kumru", "Mesudiye", "Perşembe", "Ulubey", "Ünye"],
  "Osmaniye": ["Bahçe", "Düziçi", "Hasanbeyli", "Kadirli", "Merkez", "Sumbas", "Toprakkale"],
  "Rize": ["Ardeşen", "Çamlıhemşin", "Çayeli", "Derepazarı", "Fındıklı", "Güneysu", "Hemşin", "İkizdere", "İyidere", "Kalkandere", "Merkez", "Pazar"],
  "Sakarya": ["Adapazarı", "Akyazı", "Arifiye", "Erenler", "Ferizli", "Geyve", "Hendek", "Karapürçek", "Karasu", "Kaynarca", "Kocaali", "Pamukova", "Sapanca", "Serdivan", "Söğütlü", "Taraklı"],
  "Samsun": ["Alaçam", "Asarcık", "Atakum", "Ayvacık", "Bafra", "Canik", "Çarşamba", "İlkadım", "Kavak", "Ladik", "Ondokuzmayıs", "Salıpazarı", "Tekkeköy", "Terme", "Vezirköprü", "Yakakent"],
  "Siirt": ["Baykan", "Eruh", "Kurtalan", "Merkez", "Pervari", "Şirvan", "Tillo"],
  "Sinop": ["Ayancık", "Boyabat", "Dikmen", "Durağan", "Erfelek", "Gerze", "Merkez", "Saraydüzü", "Türkeli"],
  "Sivas": ["Akıncılar", "Altınyayla", "Divriği", "Doğanşar", "Gemerek", "Gölova", "Hafik", "İmranlı", "Kangal", "Koyulhisar", "Merkez", "Suşehri", "Şarkışla", "Ulaş", "Yıldızeli", "Zara"],
  "Şanlıurfa": ["Akçakale", "Birecik", "Bozova", "Ceylanpınar", "Eyyübiye", "Halfeti", "Harran", "Hilvan", "Karaköprü", "Siverek", "Suruç", "Viranşehir"],
  "Şırnak": ["Beytüşşebap", "Cizre", "Güçlükonak", "İdil", "Merkez", "Silopi", "Uludere"],
  "Tekirdağ": ["Çerkezköy", "Çorlu", "Ergene", "Hayrabolu", "Kapaklı", "Malkara", "Marmara Ereğlisi", "Muratlı", "Saray", "Süleymanpaşa", "Şarköy"],
  "Tokat": ["Almus", "Artova", "Başçiftlik", "Erbaa", "Merkez", "Niksar", "Pazar", "Reşadiye", "Sulusaray", "Turhal", "Yıldızeli", "Zile"],
  "Trabzon": ["Akçaabat", "Araklı", "Arsin", "Beşikdüzü", "Çarşıbaşı", "Çaykara", "Dernekpazarı", "Düzköy", "Hayrat", "Köprübaşı", "Maçka", "Of", "Ortahisar", "Şalpazarı", "Sürmene", "Tonya", "Vakfıkebir", "Yomra"],
  "Tunceli": ["Çemişgezek", "Hozat", "Mazgirt", "Merkez", "Nazimiye", "Ovacık", "Pertek", "Pülümür"],
  "Uşak": ["Banaz", "Eşme", "Karahallı", "Merkez", "Sivaslı", "Ulubey"],
  "Van": ["Başkale", "Çaldıran", "Çatak", "Edremit", "Erciş", "Gevaş", "Gürpınar", "İpekyolu", "Muradiye", "Özalp", "Saray", "Tuşba"],
  "Yalova": ["Altınova", "Armutlu", "Çiftlikköy", "Çınarcık", "Merkez", "Termal"],
  "Yozgat": ["Akdağmadeni", "Aydıncık", "Boğazlıyan", "Çandır", "Çayıralan", "Çekerek", "Kadışehri", "Merkez", "Saraykent", "Sarıkaya", "Sorgun", "Şefaatli", "Yenifakılı", "Yerköy"],
  "Zonguldak": ["Alaplı", "Çaycuma", "Devrek", "Ereğli", "Gökçebey", "Kilimli", "Kozlu", "Merkez"],
};

export const allProvinces = Object.keys(districtsData);

export const allCountries = [
  "Türkiye", "Filistin", "ABD", "Almanya", "İngiltere", "Fransa", "Hollanda", "İsviçre",
  "Avusturya", "Belçika", "İsveç", "Norveç", "Danimarka", "Kanada",
  "Avustralya", "İtalya", "İspanya", "Japonya", "Güney Kore", "Azerbaycan", "Afganistan",
  "Arnavutluk", "Cezayir", "Andorra", "Angola", "Arjantin", "Ermenistan", "Bahamalar", "Bahreyn",
  "Bangladeş", "Barbados", "Beyaz Rusya", "Belize", "Benin", "Bhutan", "Bolivya", "Bosna Hersek",
  "Botsvana", "Brezilya", "Brunei", "Bulgaristan", "Burkina Faso", "Burundi", "Kamboçya",
  "Kamerun", "Yeşil Burun", "Orta Afrika Cumhuriyeti", "Çad", "Şili", "Çin", "Kolombiya",
  "Komorlar", "Kongo", "Kosta Rika", "Hırvatistan", "Küba", "Kıbrıs", "Çek Cumhuriyeti",
  "Kongo Demokratik Cumhuriyeti", "Cibuti", "Dominika", "Dominik Cumhuriyeti", "Ekvador",
  "Mısır", "El Salvador", "Ekvator Ginesi", "Eritre", "Estonya", "Etiyopya", "Fiji", "Finlandiya",
  "Gabon", "Gambiya", "Gürcistan", "Gana", "Yunanistan", "Grenada", "Guatemala", "Gine",
  "Gine-Bissau", "Guyana", "Haiti", "Honduras", "Macaristan", "İzlanda", "Hindistan",
  "Endonezya", "İran", "Irak", "İrlanda", "İsrail", "Fildişi Sahili", "Jamaika", "Ürdün",
  "Kazakistan", "Kenya", "Kiribati", "Kuzey Kore", "Kuveyt", "Kırgızistan", "Laos", "Letonya",
  "Lübnan", "Lesotho", "Liberya", "Libya", "Liechtenstein", "Litvanya", "Lüksemburg",
  "Makedonya", "Madagaskar", "Malavi", "Malezya", "Maldivler", "Mali", "Malta", "Marshall Adaları",
  "Moritanya", "Mauritius", "Meksika", "Mikronezya", "Moldova", "Monako", "Moğolistan",
  "Karadağ", "Fas", "Mozambik", "Myanmar", "Namibya", "Nauru", "Nepal", "Yeni Zelanda",
  "Nikaragua", "Nijer", "Nijerya", "Umman", "Pakistan", "Palau", "Panama", "Papua Yeni Gine",
  "Paraguay", "Peru", "Filipinler", "Polonya", "Portekiz", "Katar", "Romanya", "Rusya", "Ruanda",
  "Saint Kitts ve Nevis", "Saint Lucia", "Saint Vincent ve Grenadinler", "Samoa", "San Marino",
  "Sao Tome ve Principe", "Suudi Arabistan", "Senegal", "Sırbistan", "Seyşeller", "Sierra Leone",
  "Singapur", "Slovakya", "Slovenya", "Solomon Adaları", "Somali", "Güney Afrika", "Güney Sudan",
  "Sri Lanka", "Sudan", "Surinam", "Svaziland", "Suriye", "Tacikistan", "Tanzanya", "Tayland",
  "Doğu Timor", "Togo", "Tonga", "Trinidad ve Tobago", "Tunus", "Türkmenistan", "Tuvalu",
  "Uganda", "Ukrayna", "Birleşik Arap Emirlikleri", "Uruguay", "Özbekistan", "Vanuatu",
  "Vatikan", "Venezuela", "Vietnam", "Yemen", "Zambiya", "Zimbabve", "Diğer"
];

export { neighborhoodsData } from './neighborhoods-data';

export const globalCitiesData: { [country: string]: string[] } = {
  "Almanya": ["Berlin", "Münih", "Frankfurt", "Hamburg", "Köln"],
  "ABD": ["New York", "California", "Texas", "Florida", "Illinois"],
  "Azerbaycan": ["Bakı", "Gence", "Sumqayıt"],
  "İngiltere": ["Londra", "Manchester", "Birmingham"]
};

export const globalDistrictsData: { [city: string]: string[] } = {
  "Berlin": ["Mitte", "Pankow", "Spandau"],
  "New York": ["Manhattan", "Brooklyn", "Queens"],
  "Bakı": ["Binəqədi", "Nəsimi", "Səbail"],
  "Londra": ["Westminster", "Camden"]
};

export const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele'];
export const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu'];
export const allDailySkills = ['Yemek Yapma', 'Temizlik', 'El Becerileri', 'Organizasyon', 'İletişim'];
export const allLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İspanyolca', 'Rusça', 'İşaret Dili'];
export const allPrograms = ['MS Office', 'Google Workspace', 'Figma', 'Adobe Photoshop', 'Adobe Premiere', 'VS Code', 'Docker', 'Google Analytics'];
export const allLicenses = ['B Sınıfı Ehliyet', 'A Sınıfı Ehliyet', 'D Sınıfı Ehliyet'];
export const allDocuments = ['İlk Yardım Sertifikası', 'Hijyen Belgesi', 'Scrum Master Sertifikası', 'Pedagojik Formasyon', 'Afet Bilinci Eğitimi Sertifikası', 'SRC Belgesi'];
export const allVisas = ['Schengen', 'ABD (B1/B2)', 'İngiltere', 'Kanada'];
export const allSectors = ['Teknoloji', 'Eğitim', 'Sağlık', 'Finans', 'Üretim', 'Hizmet', 'Sivil Toplum', 'Diğer'];
export const allPositions = ['Yazılım Geliştirici', 'Proje Müdürü', 'Tasarımcı', 'Pazarlama Uzmanı', 'Satış Temsilcisi', 'İnsan Kaynakları', 'Öğrenci', 'Stajyer', 'Emekli', 'Diğer'];
export const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Kadınlar', 'Yoksullar', 'Bölgesel', 'Diğer...'];
export const allSdgs = [
    '1. Yoksulluğa Son', 
    '2. Açlığa Son', 
    '3. Sağlıklı ve Kaliteli Yaşam', 
    '4. Nitelikli Eğitim', 
    '5. Toplumsal Cinsiyet Eşitliği', 
    '6. Temiz Su ve Sanitasyon', 
    '7. Erişilebilir ve Temiz Enerji', 
    '8. İnsana Yakışır İş ve Ekonomik Büyüme',
    '9. Sanayi, Yenilikçilik ve Altyapı', 
    '10. Eşitsizliklerin Azaltılması', 
    '11. Sürdürülebilir Şehirler ve Topluluklar',
    '12. Sorumlu Üretim ve Tüketim', 
    '13. İklim Eylemi', 
    '14. Sudaki Yaşam', 
    '15. Karasal Yaşam',
    '16. Barış, Adalet ve Güçlü Kurumlar',
    '17. Amaçlar için Ortaklıklar'
];
export const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool', 'HelpSteps', 'Candid', 'Goodstack', 'GlobalGiving', 'Fonzip', 'Global Compact', 'Idealist', 'www.gonulluyuzbiz.gov.tr', 'TGSP', 'Diğer...'];
export const years = Array.from({ length: 2025 - 1850 }, (_, i) => (2024 - i).toString());

export const allUniversities: string[] = [
    'hangel Üniversitesi',
    'Boğaziçi Üniversitesi',
    'Orta Doğu Teknik Üniversitesi',
    'İstanbul Teknik Üniversitesi',
    'İstanbul Üniversitesi',
    'Ankara Üniversitesi',
    'Hacettepe Üniversitesi',
    'Bilkent Üniversitesi',
    'Koç Üniversitesi',
    'Sabancı Üniversitesi',
    'Marmara Üniversitesi',
    'Yıldız Teknik Üniversitesi',
    'Ege Üniversitesi',
    'Dokuz Eylül Üniversitesi',
    'Gazi Üniversitesi',
    'Galatasaray Üniversitesi',
    'Yeditepe Üniversitesi',
    'Bahçeşehir Üniversitesi',
    'Özyeğin Üniversitesi',
    'TOBB Ekonomi ve Teknoloji Üniversitesi',
    'Atatürk Üniversitesi',
    'Çukurova Üniversitesi',
    'Selçuk Üniversitesi',
    'Uludağ Üniversitesi',
    'Erciyes Üniversitesi',
    'Karadeniz Teknik Üniversitesi',
    'Akdeniz Üniversitesi',
    'Anadolu Üniversitesi',
    'Pamukkale Üniversitesi',
    'Süleyman Demirel Üniversitesi',
    'Eskişehir Osmangazi Üniversitesi',
    'Diğer'
];

export const ngos: NGO[] = [
    {
        id: '1',
        name: 'Ahbap Derneği',
        type: 'Dernek',
        category: 'Yardımlaşma',
        avatarUrl: 'https://www.google.com/s2/favicons?domain=ahbap.org&sz=128',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200',
        about: 'Dayanışma ve yardımlaşma kuruluşu.',
        transparencyScore: 98,
        stats: { followers: 1500000, volunteers: 45000, projects: 120, donors: 25000, totalDonation: 5000000, donationCount: 1500, avgDonation: 150, highestSingleDonation: 5000, peopleReached: 1000000, volunteerHours: 50000 },
        contact: { email: 'info@ahbap.org', phone: '0212 123 45 67', website: 'https://ahbap.org', address: { city: 'İstanbul', district: 'Şişli', country: 'Türkiye', fullAddress: 'Mecidiyeköy' }, social: { twitter: '@ahbap', instagram: '@ahbap', facebook: 'ahbap', linkedin: 'ahbap' } },
        joinDate: '2023-01-01',
        supportedSDGs: ['1. Yoksulluğa Son'],
        beneficiaryGroups: ['İhtiyaç Sahipleri'],
        memberOf: ['Afet Platformu'],
        posts: [],
        opportunities: []
    }
];

export const volunteeringOpportunities: Volunteering[] = [
    { id: '1', title: 'Afet Bölgesi Lojistik Destek', organization: 'Ahbap Derneği', ngoId: 'ngo-1', location: { city: 'Hatay', district: 'Antakya', type: 'Saha' }, commitment: 'Tek Günlük', volunteerCount: { needed: 50, applications: 12 }, dates: { applicationStart: '2024-01-01', applicationEnd: '2024-12-31', eventStart: '2024-08-01', eventEnd: '2024-08-01' }, hours: { start: '09:00', end: '17:00', total: 8 }, socialArea: 'Dayanışma', points: 500, ngoTransparencyScore: 98, taskType: 'Tek Gün', providesCertificate: true, earnedBadges: [], hasPreTraining: true, description: 'Lojistik merkezimizde paketleme desteği.', amenities: { transport: true, food: true, accommodation: false } }
];

export const studentClubs: StudentClub[] = [
    { id: 'club-1', name: 'İTÜ Girişimcilik Kulübü', university: 'İstanbul Teknik Üniversitesi', type: 'university', avatarUrl: 'https://picsum.photos/seed/itu/200/200', coverPhotoUrl: 'https://picsum.photos/seed/itucover/1200/400', members: 1500, points: 25000, description: 'Geleceğin girişimcilerini yetiştiriyoruz.', vision: 'Ekosistemi büyütmek.', joinDate: '2023-01-01', contact: { email: 'info@itugirisim.org', phone: '0212 123 45 67', website: 'https://itugirisim.org' } }
];

export const events: Event[] = [];

export const allEntityLists: Brand[] = [
    { id: 'brand-1', slug: 'tripcom', name: 'Trip.com', donationRate: 2, logoUrl: 'https://www.google.com/s2/favicons?domain=trip.com&sz=128', type: 'brand', category: 'Seyahat', about: 'Global seyahat platformu.' }
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Seyahat', subCategories: [{ name: 'Bilet', imageUrl: '' }] }
];

// 19 sosyal alan × 5 seviye = 95 rozet
// Eşikler (PRD): Bakır 10s/1p → Bronz 25s/2p → Gümüş 50s/4p → Altın 100s/8p → Platin 250s/16p
// Puan eşlemesi: Bakır 100 → Bronz 250 → Gümüş 500 → Altın 1000 → Platin 2500
const BADGE_LEVELS: Array<{ level: 'Bakır' | 'Bronz' | 'Gümüş' | 'Altın' | 'Platin'; points: number }> = [
    { level: 'Bakır', points: 100 },
    { level: 'Bronz', points: 250 },
    { level: 'Gümüş', points: 500 },
    { level: 'Altın', points: 1000 },
    { level: 'Platin', points: 2500 },
];

// PRD: 19 sosyal alan gönüllülüğü — her alanın adı "{Alan} Gönüllüsü" formatında.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BADGE_CATEGORIES: Array<{ name: string; socialArea: string; iconName: any }> = [
    { name: 'hangel Gönüllüsü',                    socialArea: 'hangel Gönüllüsü',                    iconName: Handshake },
    { name: 'Kütüphane Gönüllüsü',                 socialArea: 'Kütüphane Gönüllüsü',                 iconName: BookOpen },
    { name: 'Çevre Gönüllüsü',                     socialArea: 'Çevre Gönüllüsü',                     iconName: Leaf },
    { name: 'Eğitim Gönüllüsü',                    socialArea: 'Eğitim Gönüllüsü',                    iconName: GraduationCap },
    { name: 'Afet Gönüllüsü',                      socialArea: 'Afet Gönüllüsü',                      iconName: Siren },
    { name: 'Kan Bağışı Gönüllüsü',                socialArea: 'Kan Bağışı Gönüllüsü',                iconName: Droplets },
    { name: 'Hayvan Gönüllüsü',                    socialArea: 'Hayvan Gönüllüsü',                    iconName: PawPrint },
    { name: 'Gençlik Gönüllüsü',                   socialArea: 'Gençlik Gönüllüsü',                   iconName: Sprout },
    { name: 'Kültür ve Sanat Gönüllüsü',           socialArea: 'Kültür ve Sanat Gönüllüsü',           iconName: Palette },
    { name: 'Sağlık Gönüllüsü',                    socialArea: 'Sağlık Gönüllüsü',                    iconName: Stethoscope },
    { name: 'Sosyal Yardım Gönüllüsü',             socialArea: 'Sosyal Yardım Gönüllüsü',             iconName: HandHeart },
    { name: 'Engelsiz Yaşam Gönüllüsü',            socialArea: 'Engelsiz Yaşam Gönüllüsü',            iconName: Accessibility },
    { name: 'Çocuk Gönüllüsü',                     socialArea: 'Çocuk Gönüllüsü',                     iconName: Baby },
    { name: 'Hak Temelli Çalışmalar Gönüllüsü',    socialArea: 'Hak Temelli Çalışmalar Gönüllüsü',    iconName: Scale },
    { name: 'Göç ve Mülteci Gönüllüsü',            socialArea: 'Göç ve Mülteci Gönüllüsü',            iconName: Plane },
    { name: 'İş Dünyası Gönüllüsü',                socialArea: 'İş Dünyası Gönüllüsü',                iconName: Briefcase },
    { name: 'Bağımlılıkla Mücadele Gönüllüsü',     socialArea: 'Bağımlılıkla Mücadele Gönüllüsü',     iconName: ShieldX },
    { name: 'Yaşlılık Gönüllüsü',                  socialArea: 'Yaşlılık Gönüllüsü',                  iconName: UserRoundCog },
    { name: 'Spor Gönüllüsü',                      socialArea: 'Spor Gönüllüsü',                      iconName: Dumbbell },
];

const slugifyTr = (s: string) => s.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// PRD: rozet adı formatı → "{Alan} Rozeti — {Seviye}"
export const badges: Badge[] = BADGE_CATEGORIES.flatMap(cat =>
    BADGE_LEVELS.map(({ level, points }) => ({
        id: `${slugifyTr(cat.name)}-${slugifyTr(level)}`,
        name: `${cat.name} Rozeti — ${level}`,
        level,
        iconName: cat.iconName,
        socialArea: cat.socialArea,
        pointsRequired: points,
        currentPoints: 0, // Çalışma anında userData.areaPoints'ten doldurulur
    })),
);

export const managedItems: ManagedItem[] = [
    { name: "Ahbap Derneği", type: "STK", icon: "heart", status: "approved", href: "/ngo-admin/dashboard" }
];

export const qrPaymentCardData = [
    { id: '1', type: 'Standart', balance: '1,250.00 ₺', number: '**** **** **** 1234', owner: 'İsmail Hilmi ADIGÜZEL', bgColor: 'bg-gradient-to-br from-primary to-orange-600', status: 'Aktif' }
];

export const helpTopics: HelpTopic[] = [
    { icon: 'user', title: 'Bireysel Kullanıcılar', slug: 'bireysel-kullanicilar', description: 'Uygulama kullanımı.', subtopics: [] }
];

export const adBanners: AdBanner[] = [
    { id: '1', title: 'Okul Alışverişiyle Destek Ol', description: 'Kırtasiye ihtiyaçlarını TEGV\'e bağışla.', imageUrl: 'https://picsum.photos/seed/ad1/800/400', link: '/market' }
];

export const timelinePosts: Post[] = [
    { id: '1', author: { name: 'Ahbap Derneği', avatarUrl: 'https://www.google.com/s2/favicons?domain=ahbap.org&sz=128' }, content: 'Birlikte daha güçlüyüz!', timestamp: '2 saat önce', likes: 1250, comments: 45 }
];

export const sportsFederations = ["TFF", "TBF", "TVF"];
export const schoolRepresentatives = [];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles: { title: string; content: string }[] = [];
