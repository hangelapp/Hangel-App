'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Existing data
const ageGroupData = [
  { age: '18-24', Gönüllü: 400, Bağışçı: 240 },
  { age: '25-34', Gönüllü: 300, Bağışçı: 480 },
  { age: '35-44', Gönüllü: 200, Bağışçı: 320 },
  { age: '45-54', Gönüllü: 278, Bağışçı: 280 },
  { age: '55+', Gönüllü: 189, Bağışçı: 150 },
];

const cityData = [
    { name: 'İstanbul', Gönüllü: 450, Bağışçı: 540 },
    { name: 'Ankara', Gönüllü: 280, Bağışçı: 220 },
    { name: 'İzmir', Gönüllü: 220, Bağışçı: 180 },
    { name: 'Bursa', Gönüllü: 150, Bağışçı: 110 },
    { name: 'Antalya', Gönüllü: 120, Bağışçı: 90 },
];

// New data
const volunteerInterestData = [
  { name: 'Çevre', Gönüllü: 120 },
  { name: 'Eğitim', Gönüllü: 110 },
  { name: 'Hayvan Hakları', Gönüllü: 95 },
  { name: 'Afet', Gönüllü: 80 },
  { name: 'Sağlık', Gönüllü: 70 },
  { name: 'Çocuk', Gönüllü: 85 },
];

const genderAgeData = [
    { age: '18-24', Kadın: 250, Erkek: 150, Diğer: 10 },
    { age: '25-34', Kadın: 200, Erkek: 280, Diğer: 20 },
    { age: '35-44', Kadın: 150, Erkek: 170, Diğer: 15 },
    { age: '45-54', Kadın: 180, Erkek: 100, Diğer: 5 },
    { age: '55+', Kadın: 100, Erkek: 50, Diğer: 2 },
];

const schoolData = [
    { name: 'Boğaziçi Üni.', Destekçi: 320 },
    { name: 'İTÜ', Destekçi: 280 },
    { name: 'ODTÜ', Destekçi: 250 },
    { name: 'Koç Üni.', Destekçi: 210 },
    { name: 'Sabancı Üni.', Destekçi: 180 },
    { name: 'Diğer', Destekçi: 450 },
];

const spendingHabitsData = [
    { name: 'Sürdürülebilir Markalar', value: 400 },
    { name: 'Yerel Üreticiler', value: 300 },
    { name: 'İkinci El', value: 150 },
    { name: 'Diğer', value: 150 },
];

const competencyData = [
    { name: 'Proje Yönetimi', value: 85 },
    { name: 'Sosyal Medya', value: 110 },
    { name: 'Grafik Tasarım', value: 75 },
    { name: 'Tercümanlık', value: 60 },
    { name: 'Organizasyon', value: 130 },
];


const COLORS = ['#f34723', '#042654', '#1f1f1f', '#8884d8'];

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
                   <BarChart layout="vertical" data={volunteerInterestData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gönüllü" fill="#f34723" />
                    </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cinsiyete Göre Yaş Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin yaş ve cinsiyet kırılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderAgeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Kadın" stackId="a" fill="#f34723" />
                    <Bar dataKey="Erkek" stackId="a" fill="#042654" />
                    <Bar dataKey="Diğer" stackId="a" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Gönüllü Yetkinlikleri</CardTitle>
                    <CardDescription>Gönüllü havuzunuzdaki en yaygın yetkinlikler.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                       <BarChart layout="vertical" data={competencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Kişi Sayısı" fill="#042654" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bağışçı Tüketim Alışkanlıkları</CardTitle>
                <CardDescription>Bağışçılarınızın Hangel üzerindeki marka tercihleri.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={spendingHabitsData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {spendingHabitsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
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
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Destekçilerin Okullara Göre Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin en yoğun olduğu ilk 5 üniversite.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={schoolData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Destekçi" fill="#1f1f1f" />
                    </BarChart>
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
                <CardHeader><CardTitle>Cinsiyete Göre Yaş Dağılımı (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Yaş Grubu</TableHead><TableHead className='text-right'>Kadın</TableHead><TableHead className='text-right'>Erkek</TableHead><TableHead className='text-right'>Diğer</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {genderAgeData.map(d => (<TableRow key={d.age}><TableCell>{d.age}</TableCell><TableCell className='text-right'>{d.Kadın}</TableCell><TableCell className='text-right'>{d.Erkek}</TableCell><TableCell className='text-right'>{d.Diğer}</TableCell></TableRow>))}
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
                <CardHeader><CardTitle>Okullara Göre Dağılım (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Okul</TableHead><TableHead className='text-right'>Destekçi Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {schoolData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className='text-right'>{d.Destekçi}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Detaylı Kırılımlar</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü İlgi Alanları</h4>
                        {volunteerInterestData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.Gönüllü} kişi</span></div>))}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü Yetkinlikleri</h4>
                        {competencyData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Bağışçı Tüketim Alışkanlıkları</h4>
                        {spendingHabitsData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}