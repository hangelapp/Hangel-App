'use client';

import { schoolRepresentatives } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Linkedin, Mail } from 'lucide-react';
import React from 'react';

const RepresentativeProfilePage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const representative = schoolRepresentatives.find((rep) => rep.id === params.id);

  if (!representative) {
    notFound();
  }
  
  // Fake faculty representatives
  const facultyReps = schoolRepresentatives.slice(5, 9).map((rep, index) => ({
      ...rep,
      faculty: ['Mühendislik Fakültesi', 'İİBF', 'Fen-Edebiyat Fakültesi', 'Hukuk Fakültesi'][index]
  }));

  return (
    <div className="p-4 space-y-4">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-4">
            <ArrowLeft />
        </Button>
      <Card>
        <CardHeader className="text-center">
          <Avatar className="w-24 h-24 mx-auto mb-4">
            <AvatarImage src={representative.avatarUrl} />
            <AvatarFallback>{representative.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{representative.name}</CardTitle>
          <p className="text-muted-foreground">{representative.role}</p>
          <p className="text-sm text-muted-foreground">{representative.school}</p>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <a href={representative.linkedinUrl} target="_blank" rel="noopener noreferrer">
              <Linkedin className="mr-2 h-4 w-4" /> LinkedIn Profili
            </a>
          </Button>
          <Button>
            <Mail className="mr-2 h-4 w-4" /> Mesaj Gönder
          </Button>
        </CardContent>
      </Card>

        <Card>
            <CardHeader>
                <CardTitle>Fakülte Temsilcileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {facultyReps.map(rep => (
                     <div key={rep.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={rep.avatarUrl} alt={rep.name} />
                            <AvatarFallback>{rep.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{rep.name}</p>
                            <p className="text-sm text-muted-foreground">{rep.faculty} Temsilcisi</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>

      <Card>
        <CardHeader>
          <CardTitle>İletişim Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>E-posta:</strong> {representative.name.toLowerCase().replace(' ', '.')}@hangel.com</p>
          <p><strong>Telefon:</strong> +90 554 700 7007 (Gizli)</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RepresentativeProfilePage;
