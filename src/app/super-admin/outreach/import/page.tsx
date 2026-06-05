'use client';

/**
 * /super-admin/outreach/import — CSV içe aktarma (placeholder MVP)
 *
 * Şu an iskelet UI. Bir sonraki adımda:
 *   1) CSV upload + parse (header satırı + kolon eşleştirme)
 *   2) Dry-run preview (kaç kayıt, kaç duplicate)
 *   3) Commit → outreachContacts collection'una batch write (admin SDK)
 *   4) Audit log: kim ne zaman kaç kayıt import etti
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

export default function OutreachImportPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/super-admin/outreach"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">CSV İçe Aktar</h1>
          <p className="text-muted-foreground text-sm">Outreach kontak veritabanına toplu kayıt ekle.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /> CSV Şablonu</CardTitle>
          <CardDescription>
            Aşağıdaki başlıklarla CSV hazırla. Sıralama önemli değil, başlık isimleri eşleşmeli.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`name,type,city,district,phone,email,website,address,tags,notes
Kadıköy İl Sivil Toplum Müdürlüğü,SivilToplumMüdürlüğü,İstanbul,Kadıköy,02165550000,info@example.gov.tr,,Bağdat Cad. No:1,,
Yurtiçi Kargo,Kargo,İstanbul,,02124440080,kurumsal@yurticikargo.com,https://yurticikargo.com,,kurumsal,`}
          </pre>
          <p className="text-[11px] text-muted-foreground mt-2">
            Geçerli `type` değerleri: <code>Vakıf</code>, <code>Dernek</code>, <code>SivilToplumMüdürlüğü</code>,
            <code>Kargo</code>, <code>MailHizmet</code>, <code>Diğer</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-3">
          <Upload className="h-12 w-12 text-muted-foreground/40 mx-auto" />
          <p className="font-medium">CSV dosyasını buraya bırak</p>
          <p className="text-xs text-muted-foreground">veya tıkla, dosyayı seç</p>
          <Button disabled>Dosya Seç (yakında)</Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-start gap-2 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">MVP — geliştirme planı</p>
            <p>1) CSV parse (Papa Parse) + kolon eşleştirme UI</p>
            <p>2) Dry-run önizleme (kaç yeni / kaç duplicate / kaç hatalı)</p>
            <p>3) Batch write → outreachContacts (chunked 500'lük, admin SDK)</p>
            <p>4) Import audit log (kim, ne zaman, hangi kategori, kaç kayıt)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
