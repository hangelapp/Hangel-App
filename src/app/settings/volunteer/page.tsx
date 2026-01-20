'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { user } from '@/lib/data';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function VolunteerSettingsPage() {
    const router = useRouter();
    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Gönüllülük Bilgilerini Düzenle</h1>
                <p className="text-muted-foreground text-sm">Size en uygun fırsatları önerebilmemiz için bilgilerinizi güncel tutun.</p>
            </div>
            
            <form className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Yetkinlik ve İlgi Alanları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="interests">İlgi Alanları</Label>
                            <Textarea id="interests" placeholder="Hayvan Hakları, Çevre, Eğitim..." defaultValue={user.volunteerInfo.interests.join(', ')} />
                            <p className="text-xs text-muted-foreground">İlgilendiğiniz sosyal alanları virgülle ayırarak yazın.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="skills">Profesyonel Yetkinlikler</Label>
                            <Textarea id="skills" placeholder="Proje Yönetimi, Grafik Tasarım..." defaultValue={user.volunteerInfo.skills.join(', ')} />
                             <p className="text-xs text-muted-foreground">Mesleki uzmanlıklarınızı veya yeteneklerinizi virgülle ayırarak yazın.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dailySkills">Sosyal Yetkinlikler</Label>
                            <Textarea id="dailySkills" placeholder="Yemek Yapma, El Becerileri..." defaultValue={user.volunteerInfo.dailySkills.join(', ')} />
                             <p className="text-xs text-muted-foreground">Günlük hayatta veya sosyal projelerde kullanılabilecek becerilerinizi yazın.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Eğitim ve Kariyer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="education">Eğitim</Label>
                            <Textarea id="education" placeholder="Okul Adı - Bölüm..." defaultValue={user.volunteerInfo.education.map(e => `${e.school} - ${e.level}`).join('\n')} />
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="sector">Sektör</Label>
                                <Input id="sector" placeholder="Teknoloji, Sağlık..." defaultValue={user.volunteerInfo.sector ?? ''} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profession">Pozisyon</Label>
                                <Input id="profession" placeholder="Yazılım Geliştirici, Doktor..." defaultValue={user.volunteerInfo.profession ?? ''} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Dil ve Program Bilgisi</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="languages">Yabancı Diller</Label>
                            <Textarea id="languages" placeholder="İngilizce (İleri), Almanca (Başlangıç)..." defaultValue={user.volunteerInfo.languages.join(', ')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="programs">Bildiği Programlar</Label>
                            <Textarea id="programs" placeholder="Figma, VS Code, Microsoft Excel..." defaultValue={user.volunteerInfo.programs.join(', ')} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Belgeler ve Lisanslar</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="licenses">Lisanslar</Label>
                            <Textarea id="licenses" placeholder="B Sınıfı Ehliyet, İş Güvenliği Uzmanlığı..." defaultValue={user.volunteerInfo.licenses.join(', ')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="documents">Belgeler</Label>
                            <Textarea id="documents" placeholder="İlk Yardım Sertifikası, Hijyen Belgesi..." defaultValue={user.volunteerInfo.documents.join(', ')} />
                        </div>
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Acil Durum ve Seyahat</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="emergency-available" className="font-medium">Acil durumlarda gönüllülüğe uygunum</Label>
                           <Switch id="emergency-available" defaultChecked={user.volunteerInfo.emergency.available} />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="domestic-travel" className="font-medium">Yurtiçi seyahat engelim yok</Label>
                           <Switch id="domestic-travel" defaultChecked={!user.volunteerInfo.travelInfo.domesticObstacle} />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="international-travel" className="font-medium">Yurtdışı seyahat engelim yok</Label>
                           <Switch id="international-travel" defaultChecked={!user.volunteerInfo.travelInfo.internationalObstacle} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="visas">Sahip Olunan Vizeler</Label>
                            <Input id="visas" placeholder="Schengen, ABD (B1/B2)..." defaultValue={user.volunteerInfo.travelInfo.visas.join(', ')} />
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="chronic-illness" defaultChecked={user.volunteerInfo.emergency.hasChronicIllness} />
                                <Label htmlFor="chronic-illness">Kronik bir rahatsızlığım var.</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="regular-medication" defaultChecked={user.volunteerInfo.emergency.usesRegularMedication} />
                                <Label htmlFor="regular-medication">Düzenli olarak kullandığım bir ilaç var.</Label>
                            </div>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="physical-limitation" defaultChecked={user.volunteerInfo.emergency.hasPhysicalLimitation} />
                                <Label htmlFor="physical-limitation">Fiziksel bir kısıtlılığım var.</Label>
                            </div>
                        </div>
                     </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">Değişiklikleri Kaydet</Button>
                </div>
            </form>
        </div>
    );
}
