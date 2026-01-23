import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building2, Users, FileText, Eye, UserCheck, Briefcase, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function InformationSocietyServicesPage() {
  const boardMembers = [
    { name: 'İsmail Hilmi Adıgüzel', role: 'Yönetim Kurulu Başkanı' },
    { name: 'Ayşe Yılmaz', role: 'Yönetim Kurulu Başkan Yrd.' },
    { name: 'Mehmet Öztürk', role: 'Yönetim Kurulu Üyesi' },
  ];

  const legalDocuments = [
    { name: 'Ticaret Sicil Gazetesi', url: '#' },
    { name: 'Vergi Levhası', url: '#' },
    { name: 'Faaliyet Belgesi', url: '#' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Bilgi Toplumu Hizmetleri</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          5651 sayılı kanun kapsamında ve ilgili mevzuat uyarınca yasal yükümlülüklerimize istinaden hazırlanan bilgilendirme sayfasıdır.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5 text-primary" />
            Ticari Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Ticari Unvan:</strong> Hangel Teknoloji ve Sosyal Etki Anonim Şirketi</p>
          <p><strong>MERSİS Numarası:</strong> 0123456789101112</p>
          <p><strong>Merkez Adresi:</strong> Caferağa Mah. Moda Cad. No: 123 D:4, Kadıköy, İstanbul</p>
          <p><strong>Sorumlu Kişi:</strong> İsmail Hilmi Adıgüzel</p>
          <p><strong>Kayıtlı Elektronik Posta (KEP) Adresi:</strong> hangel@hs01.kep.tr</p>
          <p><strong>Yer Sağlayıcı:</strong> Google Cloud</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-primary" />
            Yönetim Kurulu
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {boardMembers.map((member) => (
            <div key={member.name} className="flex items-center gap-3 p-3 rounded-lg border bg-accent/50">
              <UserCheck className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Yasal Belgeler ve Politikalar
          </CardTitle>
          <CardDescription>
            Kurumsal şeffaflığımız kapsamında ilgili belgelere aşağıdan ulaşabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {legalDocuments.map((doc) => (
            <a key={doc.name} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
              <span className="font-medium">{doc.name}</span>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </a>
          ))}
            <Link href="/settings/contracts" className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors text-primary font-bold">
              <span>Tüm Sözleşme ve Politikaları Görüntüle</span>
              <ChevronRight className="h-5 w-5" />
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}
