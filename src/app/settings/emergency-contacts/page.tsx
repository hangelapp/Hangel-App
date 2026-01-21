'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { user } from '@/lib/data';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmergencyContactsPage() {
    const router = useRouter();

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Acil Durum Kişileri</h1>
                <p className="text-muted-foreground text-sm">
                    Acil bir durumda ulaşılacak kişilerin bilgilerini girin. Bu bilgiler sadece acil durum prosedürleri için kullanılacaktır.
                </p>
            </div>

            <form>
                <Card>
                    <CardHeader>
                        <CardTitle>Acil Durum Kişisi 1</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="emergency-contact-name-1">Ad Soyad</Label>
                            <Input id="emergency-contact-name-1" defaultValue={user.volunteerInfo.emergency.emergencyContacts[0]?.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emergency-contact-phone-1">Telefon</Label>
                            <Input id="emergency-contact-phone-1" type="tel" defaultValue={user.volunteerInfo.emergency.emergencyContacts[0]?.phone} />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Acil Durum Kişisi 2</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="emergency-contact-name-2">Ad Soyad</Label>
                            <Input id="emergency-contact-name-2" defaultValue={user.volunteerInfo.emergency.emergencyContacts[1]?.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emergency-contact-phone-2">Telefon</Label>
                            <Input id="emergency-contact-phone-2" type="tel" defaultValue={user.volunteerInfo.emergency.emergencyContacts[1]?.phone} />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-end mt-6">
                    <Button type="submit">Değişiklikleri Kaydet</Button>
                </div>
            </form>
        </div>
    );
}
