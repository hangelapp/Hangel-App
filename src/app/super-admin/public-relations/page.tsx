
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PublicRelationsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Kamu İlişkileri Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>İletişim Talepleri</CardTitle>
                    <CardDescription>
                        Şirketler, belediyeler ve diğer kurumlardan gelen işbirliği taleplerini buradan yönetin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground p-8">Yönetilecek bir talep bulunmuyor.</p>
                </CardContent>
            </Card>
        </div>
    );
}
