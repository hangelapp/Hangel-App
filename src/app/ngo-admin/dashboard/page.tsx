'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Heart } from 'lucide-react';
import { user } from '@/lib/data';
import VolunteerApplications from './_components/volunteer-applications';
import OpportunityManagement from './_components/opportunity-management';
import SupportForm from './_components/support-form';

export default function NgoDashboardPage() {
    const userName = user.name;
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Genel Bakış</h1>
        <p className="text-muted-foreground">Hoş geldin, {userName}. İşte kuruluşunun bugünkü özeti.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.245,78 ₺</div>
            <p className="text-xs text-muted-foreground">+%20.1 geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gönüllü</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.350</div>
            <p className="text-xs text-muted-foreground">Bu ay +180 yeni gönüllü</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Başvurular</CardTitle>
             <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen başvurular</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <VolunteerApplications />
            <OpportunityManagement />
        </div>
        <div className="space-y-6">
            <SupportForm />
        </div>
      </div>
      
    </div>
  );
}
