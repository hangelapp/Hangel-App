
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { volunteeringOpportunities } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import React from 'react';

const OpportunityManagement = () => {
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.organization === 'Uluslararası Sosyal Fayda Derneği');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gönüllülük İlanları</CardTitle>
        <CardDescription>Yeni ilanlar oluşturun ve mevcut ilanlarınızı yönetin.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ngoOpportunities.map((opp) => (
          <Card key={opp.id}>
            <CardHeader className='pb-4'>
              <CardTitle className="text-base">{opp.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-center text-sm">
                <div>
                    <p><strong>Durum:</strong> <Badge>Aktif</Badge></p>
                    <p><strong>Başvurular:</strong> {opp.volunteerCount.applications}</p>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button variant="secondary" size="sm" className='flex-1'>Görüntüle</Button>
                <Button variant="destructive" size="sm" className='flex-1'>Pasife Al</Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default OpportunityManagement;
