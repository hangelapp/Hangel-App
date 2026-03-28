
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
    Target
} from 'lucide-react';
import type { User, NGO, Brand, Volunteering, Badge, Certificate, ManagedItem, AdBanner, HelpTopic, MarketCategory, StudentClub, Event, SchoolRepresentative, Application, DonationTransaction, Post } from './types';

// --- BM Kayıtlı Tüm Ülkeler Listesi ---
export const allCountries = [
  "Türkiye", "Almanya", "Amerika Birleşik Devletleri", "Fransa", "İngiltere", "İtalya", "İspanya", "Hollanda", "Belçika", "İsviçre", 
  "Avusturya", "İsveç", "Norveç", "Danimarka", "Finlandiya", "Rusya", "Çin", "Japonya", "Güney Kore", "Hindistan", 
  "Brezilya", "Meksika", "Arjantin", "Kanada", "Avustralya", "Yeni Zelanda", "Güney Afrika", "Mısır", "Nijerya", "Fas", 
  "Azerbaycan", "Özbekistan", "Kazakistan", "Türkmenistan", "Kırgızistan", "Filistin", "Irak", "İran", "Suriye", "Lübnan",
  "Ürdün", "Suudi Arabistan", "Kuveyt", "Katar", "Bae", "Umman", "Bahreyn", "Pakistan", "Afganistan", "Yunanistan"
];

// --- Tüm Dünya Telefon Kodları ---
export const countryPhoneCodes = [
  "93", "355", "213", "376", "244", "1", "54", "374", "61", "43", "994", "973", "880", "375", "32", "501", "229", "975", "591", "387", "267", "55", "673", "359", "226", "257", "855", "237", "1", "238", "236", "235", "56", "86", "57", "269", "242", "243", "682", "506", "385", "53", "357", "420", "45", "253", "1", "1", "593", "20", "503", "240", "291", "372", "251", "500", "298", "679", "358", "33", "594", "689", "241", "220", "995", "49", "233", "350", "30", "299", "1", "590", "1", "502", "224", "245", "592", "5 Haiti", "504", "852", "36", "354", "91", "62", "98", "964", "353", "972", "39", "225", "1", "81", "962", "7", "254", "686", "850", "82", "965", "996", "856", "371", "961", "266", "231", "218", "423", "370", "352", "853", "389", "261", "265", "60", "960", "223", "356", "692", "596", "222", "230", "262", "52", "691", "373", "377", "976", "382", "1", "212", "258", "95", "264", "674", "977", "31", "599", "687", "64", "505", "227", "234", "683", "672", "670", "47", "968", "92", "680", "970", "507", "675", "595", "51", "63", "48", "351", "1", "974", "262", "40", "7", "250", "290", "1", "1", "1", "508", "1", "685", "378", "239", "966", "221", "381", "248", "232", "65", "421", "386", "677", "252", "27", "34", "94", "249", "597", "268", "46", "41", "963", "886", "992", "255", "66", "228", "690", "676", "1", "216", "90", "993", "1", "688", "256", "380", "971", "44", "1", "598", "998", "678", "379", "58", "84", "681", "967", "260", "263"
].sort((a, b) => parseInt(a) - parseInt(b));

// --- Türkiye İl ve İlçe Verileri ---
export const allProvinces = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"
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

export const user: User = {
    id: '1',
    name: 'İsmail Hilmi ADIGÜZEL',
    username: '@ismailhilmicom',
    avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1080',
    coverPhotoUrl: 'https://images.unsplash.com/photo-1693902939226-449195d2698b?q=80&w=1080',
    impactScore: 15750,
    personalInfo: {
        email: 'ihadiguzel@gmail.com',
        phone: '5547007007',
        birthDate: '1993-05-21',
        gender: 'Erkek',
        nationality: 'Türkiye Cumhuriyeti',
        bloodType: '0 Rh+',
        address: { country: 'Türkiye', city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Caferağa', fullAddress: 'Caferağa Mah. Moda Cad. No: 123 D:4' },
        website: 'https://ismailhilmi.com',
        social: { linkedin: 'ismailhilmi', github: 'ismailhilmi', instagram: 'ismailhilmi', twitter: 'ismailhilmi' }
    },
    volunteerInfo: {
        skills: ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Yazılım Geliştirme'],
        dailySkills: ['Organizasyon', 'İletişim'],
        interests: ['Çevre', 'Eğitim', 'Sosyal Girişimcilik'],
        education: [{ level: 'Lisans', school: 'Boğaziçi Üniversitesi' }],
        profession: 'Yazılım Geliştirici',
        languages: ['Türkçe', 'İngilizce'],
        programs: ['VS Code', 'Figma'],
        licenses: ['B Sınıfı Ehliyet'],
        documents: ['İlk Yardım Sertifikası'],
        travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: ['Schengen'] },
        emergency: { available: true, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [{ name: "Ayşe Yılmaz", phone: "+90 555 987 65 43" }] }
    },
    stats: {
        totalDonation: 1250, donationCount: 42, highestSingleDonation: 150, supportedNgosCount: 7, mostSupportedNgo: 'TEMA Vakfı', avgDonation: 29.76, volunteerHours: 48, completedProjects: 5, volunteerRank: { country: 'İlk %5', city: 'İlk %2', school: 'İlk %1', interest: 'İlk %10' }, mostActiveVolunteerArea: 'Hayvan Hakları', avgVolunteerDuration: '3 Hafta', totalImpactValue: 25000
    },
    progress: { 'Çevre': 80 }
};

export const ngos: NGO[] = [
    { id: 'ngo-1', name: 'Ahbap Derneği', category: 'Dayanışma', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/ahbap.org', coverPhotoUrl: 'https://picsum.photos/seed/ahbap/1200/400', stats: { followers: 500000, donors: 200000, volunteers: 100000, volunteerHours: 1000000, projects: 1200, totalDonation: 50000000, donationCount: 1000000, avgDonation: 50, highestSingleDonation: 5000, peopleReached: 2000000 }, transparencyScore: 98, about: "Yardımlaşma ve dayanışma hareketi.", joinDate: "2023-01-01", supportedSDGs: ['1. Yoksulluğa Son'], beneficiaryGroups: ['İhtiyaç Sahipleri'], memberOf: ['Afet Platformu'], contact: { email: 'iletisim@ahbap.org', phone: '0850 123 45 67', website: 'https://ahbap.org', social: { twitter: 'ahbap', instagram: 'ahbap', facebook: 'ahbap', linkedin: 'ahbap' }, address: { fullAddress: 'Caferağa Mah. Moda Cad. No: 123 D:4', city: 'İstanbul', district: 'Kadıköy' } }, posts: [], opportunities: [] },
    { id: 'ngo-2', name: 'ÇYDD', category: 'Eğitim', type: 'Dernek', avatarUrl: 'https://logo.clearbit.com/cydd.org.tr', coverPhotoUrl: 'https://picsum.photos/seed/cydd/1200/400', stats: { followers: 150000, donors: 80000, volunteers: 40000, volunteerHours: 200000, projects: 500, totalDonation: 15000000, donationCount: 200000, avgDonation: 75, highestSingleDonation: 10000, peopleReached: 500000 }, transparencyScore: 95, about: "Çağdaş yaşamı destekleme derneği.", joinDate: "2023-01-01", supportedSDGs: ['4. Nitelikli Eğitim'], beneficiaryGroups: ['Öğrenciler'], memberOf: [], contact: { email: 'iletisim@cydd.org.tr', phone: '0212 123 45 67', website: 'https://cydd.org.tr', social: { twitter: 'cydd', instagram: 'cydd', facebook: 'cydd', linkedin: 'cydd' }, address: { fullAddress: 'Şişli', city: 'İstanbul', district: 'Şişli' } }, posts: [], opportunities: [] }
];

export const volunteeringOpportunities: Volunteering[] = Array.from({ length: 21 }, (_, i) => ({
    id: `opp-${i + 1}`,
    title: ["Afet Bölgesi Lojistik Destek", "Sokak Hayvanları Besleme", "Öğrencilere Matematik Kursu", "Huzurevi Müzik Dinletisi", "Deniz Kıyısı Temizliği", "Tercüme Desteği", "Ağaç Dikme Şenliği", "Afet Bilinci Eğitmenliği", "Dijital Kütüphane Kataloglama", "Gıda Kolisi Paketleme", "Kampüs Elçisi Programı", "Grafik Tasarım Desteği", "Hukuki Danışmanlık", "Yazılım Mentörlüğü", "İşaret Dili Atölyesi", "Sesli Kitap Okuma", "Kan Bağışı Organizasyonu", "İlk Yardım Yardımcılığı", "Müze Rehberliği", "Sürdürülebilirlik Analizi", "Veri Giriş Desteği"][i % 21],
    organization: ngos[i % ngos.length].name,
    ngoId: ngos[i % ngos.length].id,
    location: { city: ["İstanbul", "Ankara", "İzmir", "Hatay", "Online"][i % 5], district: "Genel", type: (i % 3 === 0 ? 'Online' : i % 3 === 1 ? 'Saha' : 'Hibrit') as any },
    commitment: ["Tek Günlük", "Dönemsel", "Sürekli"][i % 3],
    volunteerCount: { needed: 10 + i, applications: 2 + i },
    dates: { applicationStart: "2024-01-01", applicationEnd: "2025-12-31", eventStart: "2025-01-01", eventEnd: "2025-12-31" },
    hours: { start: "09:00", end: "17:00", total: 8 },
    socialArea: ngos[i % ngos.length].category,
    points: 100 + (i * 50),
    ngoTransparencyScore: ngos[i % ngos.length].transparencyScore,
    taskType: ["Tek Gün", "Dönemsel", "Sürekli"][i % 3] as any,
    providesCertificate: i % 2 === 0,
    earnedBadges: ["Rozet"],
    hasPreTraining: i % 4 === 0,
    description: "Topluma fayda sağlayacak bu projede yer alarak etki oluşturun.",
    amenities: { transport: i % 2 === 0, food: true, accommodation: i % 10 === 0 }
}));

export const allUniversities = [
    // İstanbul
    'Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'İstanbul Üniversitesi',
    'İstanbul Üniversitesi-Cerrahpaşa', 'Galatasaray Üniversitesi', 'Marmara Üniversitesi',
    'Yıldız Teknik Üniversitesi', 'Mimar Sinan Güzel Sanatlar Üniversitesi',
    'Koç Üniversitesi', 'Sabancı Üniversitesi', 'Bahçeşehir Üniversitesi',
    'İstanbul Bilgi Üniversitesi', 'Kadir Has Üniversitesi', 'Özyeğin Üniversitesi',
    'Beykent Üniversitesi', 'Beykoz Üniversitesi', 'Fatih Sultan Mehmet Vakıf Üniversitesi',
    'Haliç Üniversitesi', 'İstanbul 29 Mayıs Üniversitesi', 'İstanbul Aydın Üniversitesi',
    'İstanbul Esenyurt Üniversitesi', 'İstanbul Gelişim Üniversitesi', 'İstanbul Kültür Üniversitesi',
    'İstanbul Medeniyet Üniversitesi', 'İstanbul Okan Üniversitesi', 'İstanbul Rumeli Üniversitesi',
    'İstanbul Sabahattin Zaim Üniversitesi', 'İstanbul Şehir Üniversitesi', 'İstanbul Ticaret Üniversitesi',
    'Maltepe Üniversitesi', 'Nişantaşı Üniversitesi', 'Piri Reis Üniversitesi',
    'Türk-Alman Üniversitesi', 'Uskudar Üniversitesi', 'Yeni Yüzyıl Üniversitesi',
    // Ankara
    'Orta Doğu Teknik Üniversitesi', 'Hacettepe Üniversitesi', 'Ankara Üniversitesi',
    'Bilkent Üniversitesi', 'Gazi Üniversitesi', 'Atılım Üniversitesi',
    'Başkent Üniversitesi', 'Çankaya Üniversitesi', 'TOBB Ekonomi ve Teknoloji Üniversitesi',
    'TED Üniversitesi', 'Ankara Yıldırım Beyazıt Üniversitesi', 'Ankara Sosyal Bilimler Üniversitesi',
    'Ankara Medipol Üniversitesi', 'Ankara Hacı Bayram Veli Üniversitesi',
    // İzmir
    'Ege Üniversitesi', 'Dokuz Eylül Üniversitesi', 'İzmir Yüksek Teknoloji Enstitüsü',
    'Yaşar Üniversitesi', 'İzmir Ekonomi Üniversitesi', 'İzmir Kâtip Çelebi Üniversitesi',
    'İzmir Demokrasi Üniversitesi', 'Izmir Tınaztepe Üniversitesi',
    // Bursa
    'Uludağ Üniversitesi', 'Bursa Teknik Üniversitesi', 'Bursa Uludağ Üniversitesi',
    'Işık Üniversitesi',
    // Diğer Büyükşehirler
    'Selçuk Üniversitesi', 'Necmettin Erbakan Üniversitesi', 'KTO Karatay Üniversitesi', // Konya
    'Çukurova Üniversitesi', 'Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi', // Adana
    'Gaziantep Üniversitesi', 'Hasan Kalyoncu Üniversitesi', // Gaziantep
    'Ondokuz Mayıs Üniversitesi', 'Samsun Üniversitesi', // Samsun
    'Karadeniz Teknik Üniversitesi', // Trabzon
    'Atatürk Üniversitesi', 'Erzurum Teknik Üniversitesi', // Erzurum
    'Fırat Üniversitesi', // Elazığ
    'İnönü Üniversitesi', // Malatya
    'Mersin Üniversitesi', // Mersin
    'Akdeniz Üniversitesi', // Antalya
    'Pamukkale Üniversitesi', // Denizli
    'Muğla Sıtkı Koçman Üniversitesi', // Muğla
    'Kocaeli Üniversitesi', 'Gebze Teknik Üniversitesi', // Kocaeli
    'Sakarya Üniversitesi', // Sakarya
    'Trakya Üniversitesi', // Edirne
    'Namık Kemal Üniversitesi', // Tekirdağ
    'Balıkesir Üniversitesi', // Balıkesir
    'Celal Bayar Üniversitesi', 'Manisa Celal Bayar Üniversitesi', // Manisa
    'Afyon Kocatepe Üniversitesi', // Afyon
    'Eskişehir Osmangazi Üniversitesi', 'Anadolu Üniversitesi', // Eskişehir
    'Kayseri Üniversitesi', 'Erciyes Üniversitesi', // Kayseri
    'Cumhuriyet Üniversitesi', // Sivas
    'Sütçü İmam Üniversitesi', // Kahramanmaraş
    'Dicle Üniversitesi', // Diyarbakır
    'Harran Üniversitesi', // Şanlıurfa
    'Mustafa Kemal Üniversitesi', 'İskenderun Teknik Üniversitesi', // Hatay
    'Bülent Ecevit Üniversitesi', 'Zonguldak Bülent Ecevit Üniversitesi', // Zonguldak
    'Kastamonu Üniversitesi', 'Sinop Üniversitesi', 'Çorum Hitit Üniversitesi',
    'Düzce Üniversitesi', 'Bolu Abant İzzet Baysal Üniversitesi', 'Bartın Üniversitesi',
    'Yalova Üniversitesi', 'Çanakkale Onsekiz Mart Üniversitesi',
].sort((a, b) => a.localeCompare(b, 'tr'));

export const studentClubs: StudentClub[] = Array.from({ length: 10 }, (_, i) => ({
    id: `club-${i + 1}`,
    name: i < 5 ? `${['İTÜ', 'Boğaziçi', 'ODTÜ', 'Marmara', 'YTÜ'][i]} Girişimcilik Kulübü` : `${['Kabataş', 'IEL', 'GSL', 'CAL', 'KAL'][i-5]} Sosyal Yardımlaşma`,
    university: i < 5 ? ['İstanbul Teknik Üniversitesi', 'Boğaziçi Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Marmara Üniversitesi', 'Yıldız Teknik Üniversitesi'][i] : ['Kabataş Erkek Lisesi', 'İstanbul Erkek Lisesi', 'Galatasaray Lisesi', 'Cağaloğlu Anadolu Lisesi', 'Kadıköy Anadolu Lisesi'][i-5],
    type: i < 5 ? 'university' : 'high-school',
    avatarUrl: `https://picsum.photos/seed/club${i}/200/200`,
    coverPhotoUrl: `https://picsum.photos/seed/clubcover${i}/1200/400`,
    members: 150 + (i * 100),
    points: 5000 + (i * 2000),
    description: 'Etki odaklı bir student topluluğu.',
    vision: 'Değişimin kampüsteki adı olmak.',
    joinDate: '2023-01-01',
    contact: { email: `iletisim@club${i}.edu.tr`, phone: '0212 123 45 67', website: `https://club${i}.edu.tr` }
}));

export const events: Event[] = [];

export const allEntityLists: Brand[] = [
    { id: 'brand-1', slug: 'tripcom', name: 'Trip.com', donationRate: 2, logoUrl: 'https://logo.clearbit.com/trip.com', type: 'brand', category: 'Seyahat', about: 'Global seyahat platformu.' },
    { id: 'brand-2', slug: 'pazarama', name: 'Pazarama', donationRate: 2, logoUrl: 'https://logo.clearbit.com/pazarama.com', type: 'brand', category: 'Pazar Yeri', about: 'Türkiye\'nin güvenilir pazar yeri.' },
    { id: 'brand-3', slug: 'karaca', name: 'Karaca', donationRate: 3, logoUrl: 'https://logo.clearbit.com/karaca.com', type: 'brand', category: 'Ev & Yaşam', about: 'Mutfak ve ev tekstili ürünleri.' }
];

export const marketCategories: MarketCategory[] = [
    { mainCategory: 'Tümü', subCategories: [] },
    { mainCategory: 'Pazar Yeri', subCategories: [{ name: 'Genel', imageUrl: '' }] },
    { mainCategory: 'Giyim', subCategories: [{ name: 'Spor', imageUrl: '' }] },
    { mainCategory: 'Seyahat', subCategories: [{ name: 'Bilet', imageUrl: '' }] },
    { mainCategory: 'Ev & Yaşam', subCategories: [{ name: 'Mutfak', imageUrl: '' }] }
];

export const badges: Badge[] = [
    { id: "1", name: "Çevre Koruyucusu", level: "Bronz", iconName: Leaf, socialArea: "Çevre", pointsRequired: 500, currentPoints: 800 }
];

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

export const sportsFederations = ["TFF", "TBF", "TVF", "THF", "THK"];
export const certificates = [];
export const pastVolunteering = [];
export const schoolRepresentatives = [];
export const ngoHelpTopics = helpTopics;
export const ngoFaqArticles = [];
