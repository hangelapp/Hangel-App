
'use client';
import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Users, Building, Store, HandCoins, Bot, Filter, ArrowDownUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";


// Data for charts and tables
const userGrowthData = [
  { month: 'Ocak', users: 4000 },
  { month: 'Şubat', users: 3000 },
  { month: 'Mart', users: 2000 },
  { month: 'Nisan', users: 2780 },
  { month: 'Mayıs', users: 1890 },
  { month: 'Haziran', users: 2390 },
  { month: 'Temmuz', users: 3490 },
];

const engagementData = userGrowthData.map(d => ({ month: d.month, Gonderi: d.users * 2.1, Yorum: d.users * 1.6, Begeni: d.users * 5.3 }));

const ageGroupData = [
  { name: '18-24', value: 400 },
  { name: '25-34', value: 300 },
  { name: '35-44', value: 300 },
  { name: '45+', value: 200 },
];
const COLORS = ['#f34723', '#042654', '#1f1f1f', '#8884d8'];


const donationVolunteerData = [
  { name: 'Ocak', Bagis: 4000, Gonulluluk: 2400 },
  { name: 'Şubat', Bagis: 3000, Gonulluluk: 1398 },
  { name: 'Mart', Bagis: 2000, Gonulluluk: 9800 },
  { name: 'Nisan', Bagis: 2780, Gonulluluk: 3908 },
  { name: 'Mayıs', Bagis: 1890, Gonulluluk: 4800 },
  { name: 'Haziran', Bagis: 2390, Gonulluluk: 3800 },
  { name: 'Temmuz', Bagis: 3490, Gonulluluk: 4300 },
];

const aiProjectionData = [
    { period: 'Mevcut', users: 14234, donation: 1.2 },
    { period: '6 Ay', users: 18000, donation: 1.8 },
    { period: '1 Yıl', users: 25000, donation: 2.5 },
    { period: '3 Yıl', users: 60000, donation: 8 },
    { period: '5 Yıl', users: 110000, donation: 22 },
];


export default function AnalyticsPage() {
    const { toast } = useToast();
    const [userGrowthSort, setUserGrowthSort] = useState({ key: 'users', direction: 'desc' });
    const [donationSort, setDonationSort] = useState({ key: 'Bagis', direction: 'desc' });

    const showComingSoon = () => toast({ title: 'Bu özellik yakında gelecek!' });

    const sortedUserGrowthData = useMemo(() => {
        return [...userGrowthData].sort((a, b) => {
            const valA = a[userGrowthSort.key as keyof typeof a];
            const valB = b[userGrowthSort.key as keyof typeof b];
            if (userGrowthSort.direction === 'asc') return valA - valB;
            return valB - valA;
        });
    }, [userGrowthSort]);

    const sortedDonationVolunteerData = useMemo(() => {
        return [...donationVolunteerData].sort((a, b) => {
            const valA = a[donationSort.key as keyof typeof a];
            const valB = b[donationSort.key as keyof typeof b];
            if (donationSort.direction === 'asc') return valA - valB;
            return valB - valA;
        });
    }, [donationSort]);

    const ChartToolbar = () => (
        <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={showComingSoon}><Filter className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={showComingSoon}><ArrowDownUp className="h-4 w-4" /></Button>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Platform Analizleri</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">14,234</p>
                    <CardTitle className="text-sm font-medium mt-1">Toplam Kullanıcı</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">+%20.1 geçen aydan</p>
                </Card>
                 <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <Building className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">128</p>
                    <CardTitle className="text-sm font-medium mt-1">Aktif STK</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">+12 geçen aydan</p>
                </Card>
                 <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <Store className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">542</p>
                    <CardTitle className="text-sm font-medium mt-1">Aktif Marka</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">+45 geçen aydan</p>
                </Card>
                 <Card className="aspect-square flex flex-col justify-center items-center p-4">
                    <HandCoins className="h-8 w-8 text-muted-foreground" />
                    <p className="text-3xl font-bold mt-2">1.2M ₺</p>
                    <CardTitle className="text-sm font-medium mt-1">Toplam Bağış</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">+%15 geçen aydan</p>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Platform İstatistikleri</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="graphs">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="graphs">Grafikler</TabsTrigger>
                            <TabsTrigger value="numbers">Sayılar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="graphs" className="mt-4">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Kullanıcı Büyümesi (Son 6 Ay)</CardTitle>
                                        <ChartToolbar />
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={userGrowthData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="users" name="Yeni Kullanıcı" stroke="#f34723" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                 <Card>
                                     <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Bağış ve Gönüllülük Değeri</CardTitle>
                                        <ChartToolbar />
                                    </CardHeader>
                                    <CardContent>
                                         <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={donationVolunteerData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="Bagis" name="Bağış (₺)" fill="#f34723" />
                                                <Bar dataKey="Gonulluluk" name="Gönüllülük (Saat)" fill="#042654" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                 <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Kullanıcı Yaş Dağılımı</CardTitle>
                                        <ChartToolbar />
                                    </CardHeader>
                                    <CardContent>
                                         <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie data={ageGroupData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                    {ageGroupData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Platform Etkileşimi</CardTitle>
                                        <ChartToolbar />
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={engagementData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Area type="monotone" dataKey="Gonderi" stackId="1" stroke="#8884d8" fill="#8884d8" />
                                                <Area type="monotone" dataKey="Yorum" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                                                <Area type="monotone" dataKey="Begeni" stackId="1" stroke="#ffc658" fill="#ffc658" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        <TabsContent value="numbers" className="mt-4">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Kullanıcı Büyümesi (Sayısal)</CardTitle>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowDownUp className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setUserGrowthSort({ key: 'users', direction: 'desc' })}>Yeni Kullanıcı (En Yüksek)</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setUserGrowthSort({ key: 'users', direction: 'asc' })}>Yeni Kullanıcı (En Düşük)</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent><Table><TableHeader><TableRow><TableHead>Ay</TableHead><TableHead className="text-right">Yeni Kullanıcı</TableHead></TableRow></TableHeader><TableBody>{sortedUserGrowthData.map(d => (<TableRow key={d.month}><TableCell>{d.month}</TableCell><TableCell className="text-right">{d.users.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex-row items-center justify-between">
                                        <CardTitle className="text-base">Bağış ve Gönüllülük (Sayısal)</CardTitle>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><ArrowDownUp className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setDonationSort({ key: 'Bagis', direction: 'desc' })}>Bağış (En Yüksek)</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDonationSort({ key: 'Bagis', direction: 'asc' })}>Bağış (En Düşük)</DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => setDonationSort({ key: 'Gonulluluk', direction: 'desc' })}>Gönüllülük (En Yüksek)</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setDonationSort({ key: 'Gonulluluk', direction: 'asc' })}>Gönüllülük (En Düşük)</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </CardHeader>
                                    <CardContent><Table><TableHeader><TableRow><TableHead>Ay</TableHead><TableHead className="text-right">Bağış (₺)</TableHead><TableHead className="text-right">Gönüllülük (Saat)</TableHead></TableRow></TableHeader><TableBody>{sortedDonationVolunteerData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className="text-right">{d.Bagis.toLocaleString()}</TableCell><TableCell className="text-right">{d.Gonulluluk.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/> Yapay Zeka Tahminleri</CardTitle>
                    <CardDescription>Mevcut verilere dayalı gelecek projeksiyonlarını görüntüleyin veya yeni bir tahmin talebinde bulunun.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="graph">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="graph">Tahmin Grafiği</TabsTrigger>
                            <TabsTrigger value="numbers">Tahmin Rakamları</TabsTrigger>
                        </TabsList>
                        <TabsContent value="graph" className="mt-4">
                             <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={aiProjectionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis yAxisId="left" label={{ value: 'Kullanıcı Sayısı', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Bağış (Milyon ₺)', angle: -90, position: 'insideRight' }} />
                                    <Tooltip formatter={(value, name) => `${(value as number).toLocaleString()} ${name === 'Kullanıcı' ? '' : 'M ₺'}`} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="users" name="Kullanıcı" stroke="#f34723" strokeWidth={2} />
                                    <Line yAxisId="right" type="monotone" dataKey="donation" name="Bağış" stroke="#042654" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </TabsContent>
                        <TabsContent value="numbers" className="mt-4">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Dönem</TableHead>
                                        <TableHead className="text-right">Tahmini Kullanıcı Sayısı</TableHead>
                                        <TableHead className="text-right">Tahmini Toplam Bağış</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {aiProjectionData.map(d => (
                                    <TableRow key={d.period}>
                                        <TableCell>{d.period}</TableCell>
                                        <TableCell className="text-right">{d.users.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">{d.donation.toLocaleString()} Milyon ₺</TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="border-t pt-6">
                    <div className="w-full space-y-4">
                        <h4 className="font-semibold text-base">Yeni Tahmin Talebi Oluştur</h4>
                        <div className="space-y-2">
                            <Label htmlFor="prediction-request">Tahmin İsteğiniz</Label>
                            <Textarea 
                                id="prediction-request" 
                                placeholder="Örn: Gelecek 2 yıl içinde gönüllü sayısındaki artışın, bağış miktarına etkisini tahmin et." 
                            />
                        </div>
                        <Button className="w-full" onClick={() => {
                            toast({
                                title: "Tahmin İsteği Gönderildi",
                                description: "Yapay zeka, istediğiniz tahmini oluşturmak için çalışıyor. Sonuçlar bu ekranda görüntülenecektir.",
                            });
                        }}>
                            <Bot className="mr-2 h-4 w-4" />
                            Tahmin Oluştur
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )

    