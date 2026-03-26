'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function SetSuperAdminPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);

    const handleSetSuperAdmin = async () => {
        if (!db) {
            toast({ variant: 'destructive', title: "Hata", description: "Veritabanı bağlantısı hazır değil." });
            return;
        }

        setIsLoading(true);
        setStatus('');

        try {
            const phoneNumber = '5384009090';
            const newUserId = 'superadmin-5384009090';

            setStatus('SUPERADMIN kullanıcısı oluşturuluyor...');

            const superAdminUser = {
                id: newUserId,
                name: 'Super Admin',
                username: '@superadmin',
                personalInfo: {
                    phone: phoneNumber,
                    email: 'superadmin@hangel.com'
                },
                role: 'super-admin',
                createdAt: new Date().toISOString()
            };

            setDocumentNonBlocking(doc(db, 'users', newUserId), superAdminUser, { merge: true });

            setStatus(`✓ SUPERADMIN başarıyla ayarlandı!\nTelefon: ${phoneNumber}\nKullanıcı ID: ${newUserId}`);
            toast({ title: "Başarılı", description: "SUPERADMIN ayarı tamamlandı." });
            setIsComplete(true);

            // Delay before finishing
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error: any) {
            setStatus(`Hata: ${error.message}`);
            toast({ variant: 'destructive', title: "Hata", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4">
            <h1 className="text-3xl font-black tracking-tighter">SUPERADMIN Ayarı</h1>

            <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                    <CardTitle className="text-orange-800 flex items-center gap-2">
                        <AlertTriangle /> Dikkat
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                        Telefon: 5384009090 numaralı kullanıcı SUPERADMIN yapılacaktır.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleSetSuperAdmin}
                        disabled={isLoading || isComplete}
                        className="w-full bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl text-white font-bold"
                    >
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        {isComplete ? '✓ Tamamlandı' : 'SUPERADMIN Yap'}
                    </Button>
                </CardContent>
            </Card>

            {status && (
                <Card className={isComplete ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            {isComplete && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />}
                            <p className={isComplete ? "text-green-800 font-medium" : "text-blue-800"}>
                                {status}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
