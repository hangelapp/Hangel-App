
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Bot } from "lucide-react";

const userGrowthData = [
  { month: 'Ocak', users: 4000 },
  { month: 'Şubat', users: 3000 },
  { month: 'Mart', users: 2000 },
  { month: 'Nisan', users: 2780 },
  { month: 'Mayıs', users: 1890 },
  { month: 'Haziran', users: 2390 },
  { month: 'Temmuz', users: 3490 },
];

const ageGroupData = [
  { name: '18-24', value: 400 },
  { name: '25-34', value: 300 },
  { name: '35-44', value: 300 },
  { name: '45+', value: 200 },
];

const donationVolunteerData = [
  { name: 'Ocak', donation: 4000, volunteer: 2400 },
  { name: 'Şubat', donation: 3000, volunteer: 1398 },
  { name: 'Mart', donation: 2000, volunteer: 9800 },
  { name: 'Nisan', donation: 2780, volunteer: 3908 },
  { name: 'Mayıs', donation: 1890, volunteer: 4800 },
  { name: 'Haziran', donation: 2390, volunteer: 3800 },
  { name: 'Temmuz', donation: 3490, volunteer: 4300 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Platform Analizleri</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Toplam Kullanıcı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">14,234</p>
                        <p className="text-sm text-muted-foreground">+%20.1 geçen aydan</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Aktif STK</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">128</p>
                        <p className="text-sm text-muted-foreground">+12 geçen aydan</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Aktif Marka</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">542</p>
                        <p className="text-sm text-muted-foreground">+45 geçen aydan</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Toplam Bağış</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">1.2M ₺</p>
                        <p className="text-sm text-muted-foreground">+%15 geçen aydan</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Kullanıcı Büyümesi (Son 6 Ay)</CardTitle>
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
                    <CardHeader>
                        <CardTitle>Bağış ve Gönüllülük Değeri</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={donationVolunteerData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="donation" name="Bağış (₺)" fill="#f34723" />
                                <Bar dataKey="volunteer" name="Gönüllülük (Saat)" fill="#042654" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Platform Etkileşimi</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={userGrowthData.map(d => ({ ...d, posts: d.users * 2, comments: d.users * 1.5 }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Area type="monotone" dataKey="posts" name="Gönderi" stackId="1" stroke="#8884d8" fill="#8884d8" />
                                <Area type="monotone" dataKey="comments" name="Yorum" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                  <Card>
                    <CardHeader>
                        <CardTitle>Kullanıcı Yaş Dağılımı</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={ageGroupData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {ageGroupData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Yapay Zeka Tahminleri</CardTitle>
                        <CardDescription>Mevcut verilere dayalı gelecek tahminleri.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <Bot className="h-16 w-16 text-primary" />
                        <div className="space-y-3">
                            <p><strong>6 Ay Sonra Kullanıcı:</strong> ~18,000</p>
                            <p><strong>1 Yıl Sonra Toplam Bağış:</strong> ~2.5 Milyon ₺</p>
                            <p><strong>5 Yıl Sonra Sosyal Etki Değeri:</strong> ~50 Milyon ₺</p>
                        </div>
                        <p className="text-xs text-muted-foreground pt-4">Bu tahminler, mevcut büyüme oranlarına dayalı olarak yapay zeka tarafından oluşturulmuştur ve yalnızca bilgilendirme amaçlıdır.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
