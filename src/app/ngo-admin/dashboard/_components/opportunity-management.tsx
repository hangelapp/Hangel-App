'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React from 'react';

const OpportunityManagement = () => {
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.organization === 'Ahbap Derneği');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gönüllülük İlanları</CardTitle>
        <CardDescription>Yeni ilanlar oluşturun ve mevcut ilanlarınızı yönetin.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İlan Başlığı</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">Başvurular</TableHead>
              <TableHead className="text-right">Eylemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ngoOpportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">{opp.title}</TableCell>
                <TableCell>
                  <Badge>Aktif</Badge>
                </TableCell>
                <TableCell className="text-right">{opp.volunteerCount.applications}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Görüntüle</Button>
                  <Button variant="ghost" size="sm" className="text-destructive">Pasife Al</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OpportunityManagement;
