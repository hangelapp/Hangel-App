'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import React from 'react';

const applications = [
  { id: 1, applicant: 'Ayşe Yılmaz', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-21' },
  { id: 2, applicant: 'Mehmet Kaya', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-20' },
];

const VolunteerApplications = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gönüllü Başvuruları</CardTitle>
        <CardDescription>Gönüllülük ilanlarınıza gelen başvuruları buradan yönetebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Başvuran</TableHead>
              <TableHead>İlan</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="text-right">Eylemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${app.applicant}`} />
                      <AvatarFallback>{app.applicant.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{app.applicant}</span>
                  </div>
                </TableCell>
                <TableCell>{app.opportunity}</TableCell>
                <TableCell>{app.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Detay</Button>
                  <Button variant="ghost" size="sm" className="text-green-600">Onayla</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Reddet</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VolunteerApplications;
