'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, FileText, HelpCircle, PlusCircle } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VolunteerApplications from "./_components/volunteer-applications";
import OpportunityManagement from "./_components/opportunity-management";
import DonationsPage from '../donations/page';
import PostsPage from '../posts/page';
import ManageProfilePage from '../manage-profile/page';
import QrPage from '../qr/page';
import SupportForm from './_components/support-form';

const monthlyStatsData = [
  { month: 'Ocak', donation: 4000, volunteers: 24 },
  { month: 'Şubat', donation: 3000, volunteers: 13 },
  { month: 'Mart', donation: 5000, volunteers: 32 },
  { month: 'Nisan', donation: 4500, volunteers: 28 },
  { month: 'Mayıs', donation: 6000, volunteers: 45 },
  { month: 'Haziran', donation: 5800, volunteers: 41 },
];

const donationSourceData = [
  { name: 'Trendyol', value: 400 },
  { name: 'Hepsiburada', value: 300 },
  { name: 'Getir', value: 300 },
  { name: 'Diğer', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DashboardTabContent = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Toplam Bağış</CardTitle>
            <CardDescription>Bu ayki toplam bağış tutarı</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12,450 ₺</p>
            <p className="text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +20.1% geçen aydan
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Toplam Gönüllü</CardTitle>
            <CardDescription>Platform üzerinden katılanlar</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,250</p>
            <p className="text-sm text-muted-foreground">Bu ay +42 yeni gönüllü</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Yeni Başvurular</CardTitle>
            <CardDescription>Onay bekleyen gönüllü başvuruları</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">18</p>
            <Button variant="link" className="p-0">Başvuruları İncele</Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Aylık Bağış ve Gönüllü İstatistiği</CardTitle>
            <CardDescription>Son 6 ayın verileri</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStatsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="donation" fill="#8884d8" name="Bağış (₺)" />
                <Bar yAxisId="right" dataKey="volunteers" fill="#82ca9d" name="Gönüllü" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bağış Kaynağı Dağılımı</CardTitle>
             <CardDescription>Bu ay en çok bağış gelen markalar</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={donationSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {donationSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
);

const VolunteerTabContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gönüllülük</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni İlan Oluştur
        </Button>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Başvurular</TabsTrigger>
          <TabsTrigger value="opportunities">İlan Yönetimi</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4">
            <VolunteerApplications />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-4">
            <OpportunityManagement />
        </TabsContent>
      </Tabs>
    </div>
);


export default function NgoDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
          <p className="text-muted-foreground">Hoş geldin, Ahbap Derneği!</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Rapor İndir
        </Button>
      </div>

       <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-7">
          <TabsTrigger value="dashboard">Genel Bakış</TabsTrigger>
          <TabsTrigger value="volunteer">Gönüllülük</TabsTrigger>
          <TabsTrigger value="donations">Bağışlar</TabsTrigger>
          <TabsTrigger value="posts">Gönderiler</TabsTrigger>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="qr">QR Kod</TabsTrigger>
          <TabsTrigger value="support">Destek</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6">
          <DashboardTabContent />
        </TabsContent>
        <TabsContent value="volunteer" className="mt-6">
            <VolunteerTabContent />
        </TabsContent>
        <TabsContent value="donations" className="mt-6">
            <DonationsPage />
        </TabsContent>
        <TabsContent value="posts" className="mt-6">
            <PostsPage />
        </TabsContent>
         <TabsContent value="profile" className="mt-6">
            <ManageProfilePage />
        </TabsContent>
         <TabsContent value="qr" className="mt-6">
            <QrPage />
        </TabsContent>
         <TabsContent value="support" className="mt-6">
            <SupportForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
