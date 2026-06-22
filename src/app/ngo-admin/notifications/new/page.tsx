'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default function NewMessagePage() {
    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-2xl mx-auto p-4 sm:p-6">
            <Card className="shadow-sm">
                <CardHeader className="items-center text-center">
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Construction className="h-7 w-7" />
                    </div>
                    <CardTitle>Toplu Mesaj Gönderimi Henüz Hazır Değil</CardTitle>
                    <CardDescription>
                        Topluluğunuza veya diğer kurumlara toplu duyuru/mesaj gönderme özelliği üzerinde
                        çalışıyoruz. Hazır olduğunda hangel panelinden kullanabileceksiniz.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Button asChild className="px-8">
                        <Link href="/ngo-admin/notifications">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Bildirim Merkezi&apos;ne Dön
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
