
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const COLORS = ['#f34723', '#042654', '#1f1f1f', '#8884d8'];

const EmptyChartState = ({ message }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
    <p className="text-muted-foreground font-medium">{message || 'Henüz yeterli veri yok'}</p>
    <p className="text-sm text-muted-foreground/70 mt-1">Veriler toplandıkça grafikler burada görünecektir.</p>
  </div>
);

interface DemographicsData {
  ageGroupData?: { age: string; 'Gonullu': number; 'Bagisci': number }[];
  cityData?: { name: string; 'Gonullu': number; 'Bagisci': number }[];
  volunteerInterestData?: { name: string; 'Gonullu': number }[];
  genderAgeData?: { age: string; Kadin: number; Erkek: number; Diger: number }[];
  schoolData?: { name: string; Destekci: number }[];
  spendingHabitsData?: { name: string; value: number }[];
  competencyData?: { name: string; value: number }[];
}

export default function DemographicsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load demographics data from Firestore
  const demographicsDocRef = useMemoFirebase(() => {
    if (!authUser?.uid) return null;
    return doc(firestore, 'demographics', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: demographicsData, isLoading } = useDoc<DemographicsData>(demographicsDocRef);

  if (!isMounted) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ageGroupData = demographicsData?.ageGroupData || [];
  const cityData = demographicsData?.cityData || [];
  const volunteerInterestData = demographicsData?.volunteerInterestData || [];
  const genderAgeData = demographicsData?.genderAgeData || [];
  const schoolData = demographicsData?.schoolData || [];
  const spendingHabitsData = demographicsData?.spendingHabitsData || [];
  const competencyData = demographicsData?.competencyData || [];

  const hasAnyData = ageGroupData.length > 0 || cityData.length > 0 || volunteerInterestData.length > 0 ||
    genderAgeData.length > 0 || schoolData.length > 0 || spendingHabitsData.length > 0 || competencyData.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demografi Analizi</h1>
        <p className="text-muted-foreground">Gönüllü ve bağışçı topluluğunuzu daha yakından tanıyarak stratejilerinizi geliştirin.</p>
      </div>

      {!hasAnyData ? (
        <Card>
          <CardContent className="py-16">
            <EmptyChartState message="Henüz yeterli veri yok" />
          </CardContent>
        </Card>
      ) : (
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts">Grafikler</TabsTrigger>
          <TabsTrigger value="numbers">Sayilar</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Gönüllü & Bağışçı Yaş Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin yaş gruplarına göre karşılaştırmalı dağılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                {ageGroupData.length === 0 ? (
                  <EmptyChartState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={ageGroupData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="Gonullu" stackId="1" stroke="#f34723" fill="#f34723" />
                        <Area type="monotone" dataKey="Bagisci" stackId="1" stroke="#042654" fill="#042654" />
                    </AreaChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gönüllü İlgi Alanları</CardTitle>
                <CardDescription>Gönüllülerinizin en çok ilgi gösterdiği sosyal alanlar.</CardDescription>
              </CardHeader>
              <CardContent>
                {volunteerInterestData.length === 0 ? (
                  <EmptyChartState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                   <BarChart layout="vertical" data={volunteerInterestData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gonullu" fill="#f34723" />
                    </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cinsiyete Göre Yaş Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin yaş ve cinsiyet kırılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                {genderAgeData.length === 0 ? (
                  <EmptyChartState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={genderAgeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="age" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Kadin" stackId="a" fill="#f34723" />
                    <Bar dataKey="Erkek" stackId="a" fill="#042654" />
                    <Bar dataKey="Diger" stackId="a" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gönüllü Yetkinlikleri</CardTitle>
                    <CardDescription>Gönüllü havuzunuzdaki en yaygın yetkinlikler.</CardDescription>
                </CardHeader>
                <CardContent>
                    {competencyData.length === 0 ? (
                      <EmptyChartState />
                    ) : (
                    <ResponsiveContainer width="100%" height={300}>
                       <BarChart layout="vertical" data={competencyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Kisi Sayisi" fill="#042654" />
                        </BarChart>
                    </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bağışçı Tüketim Alışkanlıkları</CardTitle>
                <CardDescription>Bağışçılarınızın Hangel üzerindeki marka tercihleri.</CardDescription>
              </CardHeader>
              <CardContent>
                {spendingHabitsData.length === 0 ? (
                  <EmptyChartState />
                ) : (
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
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Destekçilerin Şehirlere Göre Dağılımı</CardTitle>
                <CardDescription>Gönüllü ve bağışçılarınızın yoğunlaştığı ilk 5 şehir.</CardDescription>
              </CardHeader>
              <CardContent>
                {cityData.length === 0 ? (
                  <EmptyChartState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={cityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Gonullu" fill="#f34723" />
                        <Bar dataKey="Bagisci" fill="#042654" />
                    </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Destekçilerin Okullara Göre Dağılımı</CardTitle>
                <CardDescription>Destekçilerinizin en yoğun olduğu ilk 5 üniversite.</CardDescription>
              </CardHeader>
              <CardContent>
                {schoolData.length === 0 ? (
                  <EmptyChartState />
                ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={schoolData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Destekci" fill="#f34723" />
                    </BarChart>
                </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>
        <TabsContent value="numbers" className="mt-6 space-y-6">
            <Card>
                <CardHeader><CardTitle>Yaş Dağılımı (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {ageGroupData.length === 0 ? (
                      <EmptyChartState />
                    ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Yaş Grubu</TableHead><TableHead className='text-right'>Gönüllü Sayısı</TableHead><TableHead className='text-right'>Bağışçı Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {ageGroupData.map(d => (<TableRow key={d.age}><TableCell>{d.age}</TableCell><TableCell className='text-right'>{d['Gonullu']}</TableCell><TableCell className='text-right'>{d['Bagisci']}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Cinsiyete Göre Yaş Dağılımı (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {genderAgeData.length === 0 ? (
                      <EmptyChartState />
                    ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Yaş Grubu</TableHead><TableHead className='text-right'>Kadın</TableHead><TableHead className='text-right'>Erkek</TableHead><TableHead className='text-right'>Diğer</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {genderAgeData.map(d => (<TableRow key={d.age}><TableCell>{d.age}</TableCell><TableCell className='text-right'>{d.Kadin}</TableCell><TableCell className='text-right'>{d.Erkek}</TableCell><TableCell className='text-right'>{d.Diger}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Şehirlere Göre Dağılım (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {cityData.length === 0 ? (
                      <EmptyChartState />
                    ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Şehir</TableHead><TableHead className='text-right'>Gönüllü Sayısı</TableHead><TableHead className='text-right'>Bağışçı Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {cityData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className='text-right'>{d['Gonullu']}</TableCell><TableCell className='text-right'>{d['Bagisci']}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Okullara Göre Dağılım (Sayısal)</CardTitle></CardHeader>
                <CardContent>
                    {schoolData.length === 0 ? (
                      <EmptyChartState />
                    ) : (
                    <Table>
                        <TableHeader><TableRow><TableHead>Okul</TableHead><TableHead className='text-right'>Destekçi Sayısı</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {schoolData.map(d => (<TableRow key={d.name}><TableCell>{d.name}</TableCell><TableCell className='text-right'>{d.Destekci}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Detaylı Kırılımlar</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü İlgi Alanları</h4>
                        {volunteerInterestData.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p>
                        ) : (
                          volunteerInterestData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d['Gonullu']} kişi</span></div>))
                        )}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Gönüllü Yetkinlikleri</h4>
                        {competencyData.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p>
                        ) : (
                          competencyData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))
                        )}
                    </div>
                     <div className='space-y-2'>
                        <h4 className='font-semibold'>Bağışçı Tüketim Alışkanlıkları</h4>
                        {spendingHabitsData.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Henüz yeterli veri yok</p>
                        ) : (
                          spendingHabitsData.map(d => (<div key={d.name} className='flex justify-between text-sm'><span className='text-muted-foreground'>{d.name}</span><span>{d.value} kişi</span></div>))
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}
