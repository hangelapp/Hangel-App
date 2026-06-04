'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Shared UI primitives extracted from login/selection/page.tsx (P2-6c) ---
// IMPORTANT: behavior preserved verbatim — do not modify component contracts.

export const FileUpload = ({
    label,
    accept,
    hint,
    required,
}: {
    label: string;
    accept?: string;
    hint?: string;
    required?: boolean;
}) => {
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const inputId = `${label.replace(/\s+/g, '-')}-upload`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (accept) {
            const allowedExts = accept.split(',').map(a => a.trim().toLowerCase());
            const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!allowedExts.includes(fileExt)) {
                setUploadError(`Desteklenmeyen dosya türü. İzin verilenler: ${accept}`);
                setFileName(null);
                e.target.value = '';
                return;
            }
        }
        setUploadError(null);
        setFileName(file.name);
    };

    const status = uploadError ? 'error' : fileName ? 'success' : 'idle';

    return (
        <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
            <div className={cn("flex items-center gap-4 p-4 border rounded-2xl border-dashed transition-all",
                status === 'success' && "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600",
                status === 'error'   && "bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600",
                status === 'idle'    && "bg-muted/20 border-primary/20 hover:bg-muted/30",
            )}>
                <input id={inputId} type="file" className="hidden" accept={accept} required={required} onChange={handleChange} />
                <Button asChild variant="outline" size="sm" className={cn("rounded-xl hover:bg-primary/5 bg-background h-10 px-4",
                    status === 'success' && "border-green-500 text-green-700",
                    status === 'error'   && "border-red-500 text-red-700",
                    status === 'idle'    && "border-primary/20",
                )}>
                    <label htmlFor={inputId} className="cursor-pointer font-bold flex items-center">
                        {status === 'success' ? <><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Değiştir</> :
                         status === 'error'   ? <><X className="mr-2 h-4 w-4 text-red-600" />Tekrar Seç</> :
                         <><Upload className="mr-2 h-4 w-4" />Belge Seç</>}
                    </label>
                </Button>
                <div className="flex-1">
                    {status === 'success' && <p className="text-[11px] font-bold text-green-700 dark:text-green-400 truncate">✓ {fileName}</p>}
                    {status === 'error'   && <p className="text-[11px] font-bold text-red-600 leading-tight">{uploadError}</p>}
                    {status === 'idle'    && <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>}
                </div>
            </div>
        </div>
    );
};

export const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) => (
    <div className="flex items-start gap-2 mb-4 pt-4 first:pt-0 border-t border-dashed first:border-t-0">
        {Icon && <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-primary text-left">{children}</h3>
    </div>
);

export const FormLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block text-left">
        {children} {required && <span className="text-primary">*</span>}
    </Label>
);

export const FormInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className={cn("h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30", props.className)} />
);

export const IconInput = ({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: React.ComponentType<{ className?: string }> }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input {...props} className={cn("h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 pl-10", props.className)} />
    </div>
);

// --- Dataset constants (verbatim from page.tsx) ---

// TODO: Full Turkish address dataset (İl/İlçe/Mahalle) will be loaded from /lib/data.ts later.
// For now, a minimal placeholder list lives inline for the registration forms.
export const placeholderCities = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
    "Adana", "Konya", "Gaziantep", "Mersin", "Diyarbakır", "Diğer",
];

// Hardcoded university list, mirrored from /settings/volunteer flow.
export const clubUniversityOptions = [
    "Boğaziçi Üniversitesi", "İstanbul Teknik Üniversitesi", "Orta Doğu Teknik Üniversitesi",
    "Bilkent Üniversitesi", "Koç Üniversitesi", "Sabancı Üniversitesi",
    "Hacettepe Üniversitesi", "Ankara Üniversitesi", "İstanbul Üniversitesi",
    "Marmara Üniversitesi", "Ege Üniversitesi", "Dokuz Eylül Üniversitesi",
    "Yıldız Teknik Üniversitesi", "Gazi Üniversitesi", "Anadolu Üniversitesi", "Diğer",
];

export const brandSectorOptions = [
    "Gıda", "Tekstil", "Teknoloji", "Sağlık", "Eğitim", "Finans", "Lojistik",
    "Turizm", "İnşaat", "Otomotiv", "Enerji", "Tarım", "Hizmet", "Perakende",
    "Üretim", "Medya", "Kozmetik", "Mobilya", "Diğer",
];

export const ngoPlatformOptions = [
    "Afet Platformu", "Açık Açık", "Tüsev", "Adım Adım", "Ability Pool",
    "HelpSteps", "Candid", "Global Compact",
    "Idealist", "gonulluyuzbiz.gov.tr", "TGSP", "Diğer",
];

export const ngoBeneficiaryOptions = [
    // Yaş grupları
    "Çocuklar", "Gençler", "Yaşlılar", "Bebek ve Aileler",
    // Toplumsal cinsiyet
    "Kadınlar", "LGBTİ+", "Erkekler",
    // Eğitim
    "Öğrenciler", "Üniversite öğrencileri", "Okul öncesi çocuklar",
    // Engellilik
    "Engelliler", "Görme engelliler", "İşitme engelliler", "Zihinsel engelliler",
    "Otizm Spektrumu", "Kronik hastalar", "Nadir hastalıklar",
    // Sosyal dezavantaj
    "Yoksullar", "Evsizler", "İşsizler", "Tek ebeveynli aileler",
    "Şiddet mağdurları", "Sokak çocukları", "Cezaevi sonrası bireyler",
    // Göç ve afet
    "Mülteciler", "Sığınmacılar", "Göçmenler", "Afetzedeler", "Savaş mağdurları",
    "İç göç mağdurları",
    // Etnik / dini gruplar
    "Etnik azınlıklar", "Roman vatandaşlar", "Dini azınlıklar", "Yerli halklar",
    // Hak temelli
    "Hak mücadelesi verenler", "İnsan hakları savunucuları", "Gazeteciler",
    // Çevre & doğa
    "Hayvanlar", "Sokak hayvanları", "Yaban hayvanları", "Çevre", "Su kaynakları",
    "Ormanlar", "Tarım toprakları",
    // Sağlık
    "Kanser hastaları", "HIV/AIDS hastaları", "Madde bağımlıları", "Akıl sağlığı",
    "Organ nakli bekleyenler", "Kan ihtiyacı olanlar",
    // Bölgesel
    "Bölgesel", "Kırsal nüfus", "Kentsel yoksullar", "Deprem bölgesi",
    // Diğer
    "Sanatçılar", "Sporcular", "Girişimciler", "Gönüllüler", "STK çalışanları",
    "Diğer",
];

export const clubCategoryGroups: { group: string; items: string[] }[] = [
    { group: "Teknoloji & Bilim", items: ["Yapay Zeka", "Siber Güvenlik", "Veri Bilimi", "Yazılım Geliştirme", "Oyun Geliştirme", "Donanım/Robotik", "Bilim ve Araştırma"] },
    { group: "Sanat & Kültür", items: ["Müzik", "Tiyatro", "Sinema", "Fotoğrafçılık", "Resim ve Görsel Sanatlar", "Edebiyat", "Dans"] },
    { group: "Sosyal Etki & Toplum", items: ["Gönüllülük", "Sosyal Sorumluluk", "Sosyal Girişimcilik", "Hak Temelli Çalışmalar", "İnsan Hakları", "Mülteci ve Uyum", "Hayvan Hakları", "Sürdürülebilirlik", "Afet ve Arama Kurtarma"] },
    { group: "Kariyer & Gelişim", items: ["Girişimcilik", "Kariyer ve Gelişim", "İnovasyon", "Mesleki Gelişim", "Kişisel Gelişim"] },
    { group: "Akademik & Düşünsel", items: ["Felsefe", "Ekonomi", "Hukuk", "Politika ve Kamu Yönetimi", "Münazara", "Fikir ve Tartışma", "Erasmus/Uluslararası Programlar", "Yabancı Dil"] },
    { group: "Spor & Outdoor", items: ["Futbol", "Basketbol", "Satranç", "Voleybol", "Dağcılık & Trekking", "Su Sporları", "Kampçılık", "Diğer Sporlar"] },
];

const currentYear = new Date().getFullYear();
export const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));
