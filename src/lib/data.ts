import {
    Leaf,
    GraduationCap,
    Heart,
    Code,
    Palette,
    Globe,
    ShieldCheck,
    Handshake,
    Star,
    Laptop,
    Briefcase,
    Zap,
    Users,
    Building2,
    Store,
    Library as LibraryIcon,
    Dog,
    TreePine,
    BookOpen,
    Flame,
    Droplets,
    Anchor,
    Search,
    CircleHelp,
    BarChart,
    Building,
    Landmark,
    Target,
    Activity,
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
} from 'lucide-react';
import type { User, NGO, Brand, Volunteering, Badge, Certificate, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, SchoolRepresentative, Application, DonationTransaction, Post } from './types';

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
  "Türkiye", "ABD", "Almanya", "İngiltere", "Fransa", "Hollanda", "İsviçre",
  "Avusturya", "Belçika", "İsveç", "Norveç", "Danimarka", "Kanada",
  "Avustralya", "İtalya", "İspanya", "Japonya", "Güney Kore", "Azerbaycan", "Diğer"
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
export const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool', 'HelpSteps', 'Candid', 'Global Compact', 'Idealist', 'www.gonulluyuzbiz.gov.tr', 'TGSP', 'Diğer...'];
export const years = Array.from({ length: 2025 - 1850 }, (_, i) => (2024 - i).toString());


export const ngos: NGO[] = [
    {
        id: '1',
        name: 'Ahbap Derneği',
        type: 'Dernek',
        category: 'Yardımlaşma',
        avatarUrl: 'https://logo.clearbit.com/ahbap.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1200',
        about: 'Dayanışma ve yardımlaşma kuruluşu.',
        transparencyScore: 98,
        stats: { followers: 1500000, volunteers: 45000, projects: 120 },
        contact: { email: 'info@ahbap.org', phone: '0212 123 45 67', website: 'https://ahbap.org', address: { city: 'İstanbul', district: 'Şişli', country: 'Türkiye' } }
    },
    {
        id: '2',
        name: 'TEMA Vakfı',
        type: 'Vakıf',
        category: 'Çevre',
        avatarUrl: 'https://logo.clearbit.com/tema.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200',
        about: 'Türkiye Erozyonla Mücadele, Ağaçlandırma ve Doğal Varlıkları Koruma Vakfı.',
        transparencyScore: 95,
        stats: { followers: 850000, volunteers: 95000, projects: 450 },
        contact: { email: 'info@tema.org.tr', phone: '0212 456 78 90', website: 'https://tema.org.tr', address: { city: 'İstanbul', district: 'Beşiktaş', country: 'Türkiye' } }
    },
    {
        id: '3',
        name: 'LÖSEV',
        type: 'Vakıf',
        category: 'Sağlık',
        avatarUrl: 'https://logo.clearbit.com/losev.org.tr',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?q=80&w=1200',
        about: 'Lösemili Çocuklar Sağlık ve Eğitim Vakfı.',
        transparencyScore: 92,
        stats: { followers: 1200000, volunteers: 35000, projects: 85 },
        contact: { email: 'bilgi@losev.org.tr', phone: '0312 123 45 67', website: 'https://losev.org.tr', address: { city: 'Ankara', district: 'Çankaya', country: 'Türkiye' } }
    },
    {
        id: '4',
        name: 'Darüşşafaka Cemiyeti',
        type: 'Dernek',
        category: 'Eğitim',
        avatarUrl: 'https://logo.clearbit.com/darussafaka.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1523050335392-93851179ae22?q=80&w=1200',
        about: 'Eğitimde fırsat eşitliği.',
        transparencyScore: 97,
        stats: { followers: 450000, volunteers: 5000, projects: 45 },
        contact: { email: 'info@darussafaka.org', phone: '0212 987 65 43', website: 'https://darussafaka.org', address: { city: 'İstanbul', district: 'Sarıyer', country: 'Türkiye' } }
    },
    {
        id: '5',
        name: 'HAYTAP',
        type: 'Dernek',
        category: 'Hayvan Hakları',
        avatarUrl: 'https://logo.clearbit.com/haytap.org',
        coverPhotoUrl: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?q=80&w=1200',
        about: 'Hayvan Hakları Federasyonu.',
        transparencyScore: 88,
        stats: { followers: 950000, volunteers: 8000, projects: 65 },
        contact: { email: 'bilgi@haytap.org', phone: '0212 345 67 89', website: 'https://haytap.org', address: { city: 'İstanbul', district: 'Kadıköy', country: 'Türkiye' } }
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
    { id: 'brand-1', slug: 'tripcom', name: 'Trip.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trip.com', type: 'brand', category: 'Seyahat', about: 'Global seyahat platformu.' }
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Seyahat', subCategories: [{ name: 'Bilet', imageUrl: '' }] }
];

// 20 sosyal alan × 5 seviye = 100 rozet
// Eşikler: Bakır 100 → Bronz 250 → Gümüş 500 → Altın 1000 → Platin 2500
const BADGE_LEVELS: Array<{ level: 'Bakır' | 'Bronz' | 'Gümüş' | 'Altın' | 'Platin'; points: number }> = [
    { level: 'Bakır', points: 100 },
    { level: 'Bronz', points: 250 },
    { level: 'Gümüş', points: 500 },
    { level: 'Altın', points: 1000 },
    { level: 'Platin', points: 2500 },
];

const BADGE_CATEGORIES: Array<{ name: string; socialArea: string; iconName: any }> = [
    { name: 'Çevre Koruyucusu',           socialArea: 'Çevre',                iconName: Leaf },
    { name: 'Eğitim Destekçisi',          socialArea: 'Eğitim',               iconName: GraduationCap },
    { name: 'Hayvan Dostu',               socialArea: 'Hayvanlar',            iconName: PawPrint },
    { name: 'Afet Kahramanı',             socialArea: 'Afet',                 iconName: Siren },
    { name: 'Topluluk Lideri',            socialArea: 'Topluluk',             iconName: Users },
    { name: 'Gönüllülük Elçisi',          socialArea: 'Gönüllülük',           iconName: Handshake },
    { name: 'Kan Bağışı Destekçisi',      socialArea: 'Sağlık',               iconName: Droplets },
    { name: 'Hayvan Koruyucusu',          socialArea: 'Hayvanlar',            iconName: ShieldCheck },
    { name: 'Gençlik Mentoru',            socialArea: 'Gençlik',              iconName: Sprout },
    { name: 'Kültür ve Sanat Destekçisi', socialArea: 'Kültür ve Sanat',      iconName: Palette },
    { name: 'Sağlık Gönüllüsü',           socialArea: 'Sağlık',               iconName: Stethoscope },
    { name: 'Eğitim Gönüllüsü',           socialArea: 'Eğitim',               iconName: BookOpen },
    { name: 'Sosyal Yardım Destekçisi',   socialArea: 'Sosyal Yardım',        iconName: HandHeart },
    { name: 'Engelsiz Yaşam Destekçisi',  socialArea: 'Engelsiz Yaşam',       iconName: Accessibility },
    { name: 'Çocuk Destekçisi',           socialArea: 'Çocuklar',             iconName: Baby },
    { name: 'Hak Temelli Çalışmalar',     socialArea: 'Hak Temelli',          iconName: Scale },
    { name: 'Göç ve Mülteci Destekçisi',  socialArea: 'Göç ve Mülteciler',    iconName: Plane },
    { name: 'İstihdam Destekçisi',        socialArea: 'İstihdam',             iconName: Briefcase },
    { name: 'Bağımlılıkla Mücadele',      socialArea: 'Bağımlılıkla Mücadele', iconName: ShieldX },
    { name: 'Yaşlı Destekçisi',           socialArea: 'Yaşlılar',             iconName: UserRoundCog },
];

const slugifyTr = (s: string) => s.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const badges: Badge[] = BADGE_CATEGORIES.flatMap(cat =>
    BADGE_LEVELS.map(({ level, points }) => ({
        id: `${slugifyTr(cat.name)}-${slugifyTr(level)}`,
        name: `${cat.name} — ${level}`,
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
    { id: '1', author: { name: 'Ahbap Derneği', avatarUrl: 'https://logo.clearbit.com/ahbap.org' }, content: 'Birlikte daha güçlüyüz!', timestamp: '2 saat önce', likes: 1250, comments: 45 }
];

export const sportsFederations = ["TFF", "TBF", "TVF"];
export const certificates = [];
export const pastVolunteering = [];
export const schoolRepresentatives = [];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles: { title: string; content: string }[] = [];
export const allUniversities = [
  "Abant İzzet Baysal Üniversitesi",
  "Abdullah Gül Üniversitesi",
  "Acıbadem Mehmet Ali Aydınlar Üniversitesi",
  "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi",
  "Adıyaman Üniversitesi",
  "Afyon Kocatepe Üniversitesi",
  "Ağrı İbrahim Çeçen Üniversitesi",
  "Akdeniz Üniversitesi",
  "Aksaray Üniversitesi",
  "Alanya Alaaddin Keykubat Üniversitesi",
  "Altınbaş Üniversitesi",
  "Amasya Üniversitesi",
  "Anadolu Üniversitesi",
  "Ankara Bilim Üniversitesi",
  "Ankara Hacı Bayram Veli Üniversitesi",
  "Ankara Medipol Üniversitesi",
  "Ankara Müzik ve Güzel Sanatlar Üniversitesi",
  "Ankara Sosyal Bilimler Üniversitesi",
  "Ankara Üniversitesi",
  "Ankara Yıldırım Beyazıt Üniversitesi",
  "Antalya Bilim Üniversitesi",
  "Ardahan Üniversitesi",
  "Artvin Çoruh Üniversitesi",
  "Atatürk Üniversitesi",
  "Atılım Üniversitesi",
  "Avrasya Üniversitesi",
  "Bahçeşehir Üniversitesi",
  "Balıkesir Üniversitesi",
  "Bandırma Onyedi Eylül Üniversitesi",
  "Bartın Üniversitesi",
  "Başkent Üniversitesi",
  "Batman Üniversitesi",
  "Bayburt Üniversitesi",
  "Beykent Üniversitesi",
  "Beykoz Üniversitesi",
  "Bezm-i Âlem Vakıf Üniversitesi",
  "Bilecik Şeyh Edebali Üniversitesi",
  "Bingöl Üniversitesi",
  "Biruni Üniversitesi",
  "Bitlis Eren Üniversitesi",
  "Boğaziçi Üniversitesi",
  "Burdur Mehmet Akif Ersoy Üniversitesi",
  "Bursa Teknik Üniversitesi",
  "Bursa Uludağ Üniversitesi",
  "Çağ Üniversitesi",
  "Çanakkale Onsekiz Mart Üniversitesi",
  "Çankaya Üniversitesi",
  "Çankırı Karatekin Üniversitesi",
  "Çukurova Üniversitesi",
  "Demiroğlu Bilim Üniversitesi",
  "Dicle Üniversitesi",
  "Doğuş Üniversitesi",
  "Dokuz Eylül Üniversitesi",
  "Düzce Üniversitesi",
  "Ege Üniversitesi",
  "Erciyes Üniversitesi",
  "Erzincan Binali Yıldırım Üniversitesi",
  "Erzurum Teknik Üniversitesi",
  "Eskişehir Osmangazi Üniversitesi",
  "Eskişehir Teknik Üniversitesi",
  "Fatih Sultan Mehmet Vakıf Üniversitesi",
  "Fenerbahçe Üniversitesi",
  "Fırat Üniversitesi",
  "Galatasaray Üniversitesi",
  "Gazi Üniversitesi",
  "Gaziantep Üniversitesi",
  "Gaziantep İslam Bilim ve Teknoloji Üniversitesi",
  "Gebze Teknik Üniversitesi",
  "Giresun Üniversitesi",
  "Gümüşhane Üniversitesi",
  "Hacettepe Üniversitesi",
  "Hakkari Üniversitesi",
  "Haliç Üniversitesi",
  "Harran Üniversitesi",
  "Hasan Kalyoncu Üniversitesi",
  "Hatay Mustafa Kemal Üniversitesi",
  "Hitit Üniversitesi",
  "Iğdır Üniversitesi",
  "Isparta Uygulamalı Bilimler Üniversitesi",
  "İbn Haldun Üniversitesi",
  "İhsan Doğramacı Bilkent Üniversitesi",
  "İnönü Üniversitesi",
  "İskenderun Teknik Üniversitesi",
  "İstanbul Arel Üniversitesi",
  "İstanbul Atlas Üniversitesi",
  "İstanbul Aydın Üniversitesi",
  "İstanbul Bilgi Üniversitesi",
  "İstanbul Esenyurt Üniversitesi",
  "İstanbul Galata Üniversitesi",
  "İstanbul Gedik Üniversitesi",
  "İstanbul Gelişim Üniversitesi",
  "İstanbul Kent Üniversitesi",
  "İstanbul Kültür Üniversitesi",
  "İstanbul Medeniyet Üniversitesi",
  "İstanbul Medipol Üniversitesi",
  "İstanbul Okan Üniversitesi",
  "İstanbul Rumeli Üniversitesi",
  "İstanbul Sabahattin Zaim Üniversitesi",
  "İstanbul Sağlık ve Teknoloji Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "İstanbul Ticaret Üniversitesi",
  "İstanbul Topkapı Üniversitesi",
  "İstanbul Üniversitesi",
  "İstanbul Üniversitesi-Cerrahpaşa",
  "İstanbul Yeni Yüzyıl Üniversitesi",
  "İstinye Üniversitesi",
  "İzmir Bakırçay Üniversitesi",
  "İzmir Demokrasi Üniversitesi",
  "İzmir Ekonomi Üniversitesi",
  "İzmir Kâtip Çelebi Üniversitesi",
  "İzmir Yüksek Teknoloji Enstitüsü",
  "Kafkas Üniversitesi",
  "Kahramanmaraş İstiklal Üniversitesi",
  "Kahramanmaraş Sütçü İmam Üniversitesi",
  "Kapadokya Üniversitesi",
  "Karabük Üniversitesi",
  "Karadeniz Teknik Üniversitesi",
  "Karamanoğlu Mehmetbey Üniversitesi",
  "Kastamonu Üniversitesi",
  "Kayseri Üniversitesi",
  "Kırıkkale Üniversitesi",
  "Kırklareli Üniversitesi",
  "Kırşehir Ahi Evran Üniversitesi",
  "Kilis 7 Aralık Üniversitesi",
  "Koç Üniversitesi",
  "Kocaeli Üniversitesi",
  "Konya Gıda ve Tarım Üniversitesi",
  "Konya Teknik Üniversitesi",
  "KTO Karatay Üniversitesi",
  "Kütahya Dumlupınar Üniversitesi",
  "Kütahya Sağlık Bilimleri Üniversitesi",
  "Lokman Hekim Üniversitesi",
  "Malatya Turgut Özal Üniversitesi",
  "Maltepe Üniversitesi",
  "Manisa Celâl Bayar Üniversitesi",
  "Mardin Artuklu Üniversitesi",
  "Marmara Üniversitesi",
  "Mef Üniversitesi",
  "Mersin Üniversitesi",
  "Mimar Sinan Güzel Sanatlar Üniversitesi",
  "Muğla Sıtkı Koçman Üniversitesi",
  "Munzur Üniversitesi",
  "Muş Alparslan Üniversitesi",
  "Necmettin Erbakan Üniversitesi",
  "Nevşehir Hacı Bektaş Veli Üniversitesi",
  "Niğde Ömer Halisdemir Üniversitesi",
  "Nişantaşı Üniversitesi",
  "Nuh Naci Yazgan Üniversitesi",
  "Ondokuz Mayıs Üniversitesi",
  "Ordu Üniversitesi",
  "Orta Doğu Teknik Üniversitesi",
  "Osmaniye Korkut Ata Üniversitesi",
  "Ostim Teknik Üniversitesi",
  "Özyeğin Üniversitesi",
  "Pamukkale Üniversitesi",
  "Pîrî Reis Üniversitesi",
  "Recep Tayyip Erdoğan Üniversitesi",
  "Sabancı Üniversitesi",
  "Sağlık Bilimleri Üniversitesi",
  "Sakarya Uygulamalı Bilimler Üniversitesi",
  "Sakarya Üniversitesi",
  "Samsun Üniversitesi",
  "Sanko Üniversitesi",
  "Selçuk Üniversitesi",
  "Siirt Üniversitesi",
  "Sinop Üniversitesi",
  "Sivas Bilim ve Teknoloji Üniversitesi",
  "Sivas Cumhuriyet Üniversitesi",
  "Süleyman Demirel Üniversitesi",
  "Şırnak Üniversitesi",
  "Tarsus Üniversitesi",
  "Ted Üniversitesi",
  "Tekirdağ Namık Kemal Üniversitesi",
  "TOBB Ekonomi ve Teknoloji Üniversitesi",
  "Tokat Gaziosmanpaşa Üniversitesi",
  "Trabzon Üniversitesi",
  "Trakya Üniversitesi",
  "Türk-Alman Üniversitesi",
  "Türk Hava Kurumu Üniversitesi",
  "Ufuk Üniversitesi",
  "Uşak Üniversitesi",
  "Üsküdar Üniversitesi",
  "Van Yüzüncü Yıl Üniversitesi",
  "Yalova Üniversitesi",
  "Yaşar Üniversitesi",
  "Yeditepe Üniversitesi",
  "Yıldız Teknik Üniversitesi",
  "Yozgat Bozok Üniversitesi",
  "Yüksek İhtisas Üniversitesi",
  "Zonguldak Bülent Ecevit Üniversitesi",
];
