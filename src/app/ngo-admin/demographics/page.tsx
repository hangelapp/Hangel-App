'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ageData = [
  { name: '18-24', Gönüllü: 400, Bağışçı: 240 },
  { name: '25-34', Gönüllü: 300, Bağışçı: 139 },
  { name: '35-44', Gönüllü: 200, Bağışçı: 980 },
  { name: '45+', Gönüllü: 278, Bağışçı: 390 },
];

const genderData = [
  { name: 'Kadın', value: 400 },
  { name: 'Erkek', value: 300 },
  { name: 'Diğer', value: 50 },
];

const cityData = [
    { name: 'İstanbul', value: 540 },
    { name: 'Ankara', value: 220 },
    { name: 'İzmir', value: 180 },
    { name: 'Bursa', value: 110 },
    { name: 'Antalya', value: 90 },
    { name: 'Diğer', value: 150 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19AF'];

export default function DemographicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demografi</h1>
        <p className="text-muted-foreground">Gönüllü ve bağışçılarınızın demografik yapısını inceleyerek topluluğunuzu daha iyi tanıyın.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Yaş Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Gönüllü" fill="#8884d8" />
                <Bar dataKey="Bağışçı" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gönüllü Cinsiyet Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {genderData.map((entry, index) => (
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
            <CardTitle>Bağışçıların Şehirlere Göre Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Bağışçı Sayısı" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
