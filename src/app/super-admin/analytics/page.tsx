'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Users, Building, Store, HandCoins, Bot, TrendingUp } from "lucide-react";

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
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Platform Analizleri</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">14,234</p>
                        <p className="text-sm text-muted-foreground">+%20.1 geçen aydan</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif STK</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">128</p>
                        <p className="text-sm text-muted-foreground">+12 geçen aydan</p>
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Marka</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">542</p>
                        <p className="text-sm text-muted-foreground">+45 geçen aydan</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">1.2M ₺</p>
                        <p className="text-sm text-muted-foreground">+%15 geçen aydan</p>
                    </CardContent>
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
                                    <CardHeader><CardTitle className="text-base">Kullanıcı Büyümesi (Son 6 Ay)</CardTitle></CardHeader>
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
                                    <CardHeader><CardTitle className="text-base">Bağış ve Gönüllülük Değeri</CardTitle></CardHeader>
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
                                    <CardHeader><CardTitle className="text-base">Kullanıcı Yaş Dağılımı</CardTitle></CardHeader>
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
                                    <CardHeader><CardTitle className="text-base">Platform Etkileşimi</CardTitle></CardHeader>
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
                                    <CardHeader><CardTitle className="text-base">Kullanıcı Büyümesi (Sayısal)</CardTitle></CardHeader>
                                    <CardContent><Table><TableHeader><TableRow><TableHead>Ay</TableHead><TableHead className="text-right">Yeni Kullanıcı</TableHead></TableRow></TableHeader><TableBody>{userGrowthData.map(d => (<TableRow key={d.month}><TableCell>{d.month}</TableCell><TableCell className="text-right">{d.users.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></CardContent>
                                </Card>
                                <Card>
                                    <CardHeader><CardTitle className="text-base">Bağış ve Gönüllülük (Sayısal)</CardTitle></CardHeader>
                                    <CardContent><Table><TableHeader><TableRow><TableHead>Ay</TableHead><TableHead className="text-right">Bağış (₺)</TableHead><TableHead className="text-right">Gönüllülük (Saat)</TableHead></TableRow></TableHeader><TableBody>{donationVolunteerData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className="text-right">{d.Bagis.toLocaleString()}</TableCell><TableCell className="text-right">{d.Gonulluluk.toLocaleString()}</TableCell></TableRow>))}</TableBody></Table></CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/> Yapay Zeka Tahminleri</CardTitle>
                    <CardDescription>Mevcut verilere dayalı gelecek projeksiyonları.</CardDescription>
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
            </Card>
        </div>
    )
}
    