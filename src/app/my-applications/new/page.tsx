'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { volunteeringOpportunities, studentClubs } from '@/lib/data';

type ApplicationType = 'Gönüllülük' | 'Kulüp Üyeliği' | 'STK Temsilciliği' | 'Marka İşbirliği' | '';

export default function NewApplicationPage() {
  const [applicationType, setApplicationType] = useState<ApplicationType>('');

  const renderFormFields = () => {
    switch (applicationType) {
      case 'Gönüllülük':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="opportunity">Gönüllülük İlanı</Label>
              <Select name="opportunity">
                <SelectTrigger id="opportunity">
                  <SelectValue placeholder="Bir ilan seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {volunteeringOpportunities.map(opp => (
                    <SelectItem key={opp.id} value={opp.id}>{opp.title} - {opp.organization}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation">Motivasyon Mektubu (İsteğe Bağlı)</Label>
              <Textarea id="motivation" placeholder="Bu gönüllülük faaliyeti için neden uygun olduğunuzu kısaca açıklayın..." />
            </div>
          </>
        );
      case 'Kulüp Üyeliği':
        return (
          <div className="space-y-2">
            <Label htmlFor="club">Öğrenci Kulübü</Label>
            <Select name="club">
              <SelectTrigger id="club">
                <SelectValue placeholder="Bir kulüp seçin..." />
              </SelectTrigger>
              <SelectContent>
                {studentClubs.map(club => (
                  <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'STK Temsilciliği':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="ngo-name">STK Adı</Label>
              <Input id="ngo-name" placeholder="Temsilcisi olmak istediğiniz STK'nın adı" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation-ngo">Açıklama</Label>
              <Textarea id="motivation-ngo" placeholder="Neden bu STK'yı temsil etmek istediğinizi ve hedeflerinizi açıklayın..." />
            </div>
          </>
        );
        case 'Marka İşbirliği':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="brand-name">Marka Adı</Label>
              <Input id="brand-name" placeholder="hangel'a katılmasını istediğiniz marka" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation-brand">Açıklama</Label>
              <Textarea id="motivation-brand" placeholder="Bu markanın hangel platformuna neden katılması gerektiğini düşündüğünüzü açıklayın..." />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div>
        <h1 className="text-2xl font-bold font-headline">Yeni Başvuru Oluştur</h1>
        <p className="text-muted-foreground text-sm">Aşağıdaki formu doldurarak başvurunuzu yapın.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Başvuru Formu</CardTitle>
          <CardDescription>Lütfen başvuru türünü seçin ve gerekli alanları doldurun.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="application-type">Başvuru Türü</Label>
            <Select onValueChange={(value: ApplicationType) => setApplicationType(value)}>
              <SelectTrigger id="application-type">
                <SelectValue placeholder="Başvuru türünü seçin..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gönüllülük">Gönüllülük Başvurusu</SelectItem>
                <SelectItem value="Kulüp Üyeliği">Kulüp Üyeliği Başvurusu</SelectItem>
                <SelectItem value="STK Temsilciliği">STK Temsilciliği Başvurusu</SelectItem>
                <SelectItem value="Marka İşbirliği">Marka İşbirliği Önerisi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {applicationType && (
            <form className="space-y-4 border-t pt-6">
              {renderFormFields()}
              <Button type="submit" className="w-full">Başvuruyu Gönder</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
