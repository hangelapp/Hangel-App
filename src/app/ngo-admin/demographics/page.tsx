'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ageGroupData = [
  { age: '18-24', Gönüllü: 400, Bağışçı: 240 },
  { age: '25-34', Gönüllü: 300, Bağışçı: 480 },
  { age: '35-44', Gönüllü: 200, Bağışçı: 320 },
  { age: '45-54', Gönüllü: 278, Bağışçı: 280 },
  { age: '55+', Gönüllü: 189, Bağışçı: 150 },
];

const volunteerInterestData = [
  { subject: 'Çevre', value: 120 },
  { subject: 'Eğitim', value: 110 },
  { subject: 'Hayvan Hakları', value: 95 },
  { subject: 'Afet', value: 80 },
  { subject: 'Sağlık', value: 70 },
  { subject: 'Çocuk', value: 85 },
];

const donorGenderData = [
  { name: 'Kadın', value: 550 },
  { name: 'Erkek', value: 420 },
  { name: 'Belirtilmemiş', value: 80 },
];

const cityData = [
    { name: 'İstanbul', Gönüllü: 450, Bağışçı: 540 },
    { name: 'Ankara', Gönüllü: 280, Bağışçı: 220 },
    { name: 'İzmir', Gönüllü: 220, Bağışçı: 180 },
    { name: 'Bursa', Gönüllü: 150, Bağışçı: 110 },
    { name: 'Antalya', Gönüllü: 120, Bağışçı: 90 },
];

const newSupporterData = [
    { month: 'Ocak', Gönüllü: 24, Bağışçı: 35 },
    { month: 'Şubat', month_tr: 'Şub', Gönüllü: 18, Bağışçı: 28 },
    { month: 'Mart', Gönüllü: 32, Bağışçı: 45 },
    { month: 'Nisan', Gönüllü: 25, Bağışçı: 40 },
    { month: 'Mayıs', Gönüllü: 41, Bağışçı: 55 },
    { month: 'Haziran', Gönüllü: 38, Bağışçı: 62 },
]

const donationMethodData = [
    { name: 'Market Alışverişi', value: 650 },
    { name: 'Direkt Bağış', value: 250 },
    { name: 'QR Kod ile Bağış', value: 100 },
];


const COLORS = ['#f34723', '#042654', '#1f1f1f'];

export default function DemographicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demografi Analizi</h1>
        <p className="text-muted-foreground">Gönüllü ve bağışçı topluluğunuzu daha yakından tanıyarak stratejilerinizi geliştirin.</p>
      </div>

      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
          <TabsTrigger value="numbers">Sayılar</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Gönüllü & Bağışçı Yaş Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin yaş gruplarına göre karşılaştırmalı dağılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ageGroupData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="Gönüllü" stackId="1" stroke="#f34723" fill="#f34723" />
                        <Area type="monotone" dataKey="Bağışçı" stackId="1" stroke="#042654" fill="#042654" />
                    </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gönüllü İlgi Alanları</CardTitle>
                <CardDescription>Gönüllülerinizin en çok ilgi gösterdiği sosyal alanlar.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={volunteerInterestData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis />
                    <Radar name="Gönüllü Sayısı" dataKey="value" stroke="#f34723" fill="#f34723" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bağışçı Cinsiyet Dağılımı</CardTitle>
                <CardDescription>Bağışçılarınızın cinsiyetlere göre dağılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={donorGenderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {donorGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Destekçilerin Şehirlere Göre Dağılımı</CardTitle>
                <CardDescription>Gönüllü ve bağışçılarınızın yoğunlaştığı ilk 5 şehir.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gönüllü" fill="#f34723" />
                        <Bar dataKey="Bağışçı" fill="#042654" />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Aylık Yeni Destekçi Kazanımı</CardTitle>
                    <CardDescription>Son 6 ayda platforma katılan yeni gönüllü ve bağışçılar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={newSupporterData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="Gönüllü" stroke="#f34723" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="Bağışçı" stroke="#042654" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bağış Yöntemi Dağılımı</CardTitle>
                <CardDescription>Bağışların hangi kanallardan geldiğinin dağılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={donationMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} label>
                      {donationMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="numbers" className="mt-6 space-y-6">
            <Card>
                <CardHeader><CardTitle>Yaş Dağılımı (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Yaş Grubu</TableHead><TableHead className='text-right'>Gönüllü Sayısı</TableHead><TableHead className='text-right'>Bağışçı Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {ageGroupData.map(d => (<TableRow key={d.age}><TableCell>{d.age}</TableCell><TableCell className='text-right'>{d.Gönüllü}</TableCell><TableCell className='text-right'>{d.Bağışçı}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Şehirlere Göre Dağılım (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Şehir</TableHead><TableHead className='text-right'>Gönüllü Sayısı</TableHead><TableHead className='text-right'>Bağışçı Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {cityData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className='text-right'>{d.Gönüllü}</TableCell><TableCell className='text-right'>{d.Bağışçı}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Detaylı Kırılımlar</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü İlgi Alanları</h4>
                        {volunteerInterestData.map(d => (<div key={d.subject} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.subject}</span><span>{d.value} kişi</span></div>))}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Bağışçı Cinsiyet</h4>
                        {donorGenderData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Aylık Yeni Destekçiler</h4>
                        {newSupporterData.map(d => (<div key={d.month} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.month}</span><span>{d.Gönüllü} Gön. / {d.Bağışçı} Bağış.</span></div>))}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Bağış Yöntemleri</h4>
                        {donationMethodData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} işlem</span></div>))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
