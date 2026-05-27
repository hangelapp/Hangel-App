'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveEntity } from '../active-entity-context';
import { isRouteAllowedForKind } from '../_lib/route-kinds';

const KIND_LABEL: Record<'ngo' | 'brand' | 'club', string> = {
    ngo: 'STK',
    brand: 'Marka',
    club: 'Öğrenci Kulübü',
};

/**
 * Aktif entity bu sayfaya erişim hakkına sahip mi kontrol eder.
 * Mismatch varsa friendly mesaj + dashboard'a dön link gösterir.
 * Uygunsa children'i render eder.
 *
 * Why: User Marka admini olsa bile /ngo-admin/transparency URL'ini elle yazsa
 * görebiliyordu. Bu guard ile yanlış sayfaya girmesi engellenir.
 */
export function EntityRouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { kind, type, isLoading } = useActiveEntity();

    if (isLoading || !pathname) return <>{children}</>;
    if (!kind) return <>{children}</>;

    const { allowed, requiredKinds } = isRouteAllowedForKind(pathname, kind);
    if (allowed) return <>{children}</>;

    const requiredLabels = (requiredKinds || []).map(k => KIND_LABEL[k]).join(' veya ');

    return (
        <Card className="border-amber-300 bg-amber-50/50 max-w-xl mx-auto">
            <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-7 w-7 text-amber-700" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-bold">Bu sayfa {type} paneli için değil</h2>
                    <p className="text-sm text-muted-foreground">
                        Bu özellik yalnızca <strong>{requiredLabels}</strong> yönetim panelinde kullanılabilir.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/ngo-admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard&apos;a Dön
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
