'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Landmark, School, DollarSign, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const corporateItems = [
    {
        href: '/contact/companies',
        icon: Briefcase,
        title: 'Şirketler için',
        description: 'Kurumsal sosyal sorumluluk hedeflerinize ulaşın, marka değerinizi ve çalışan bağlılığını güçlendirin.'
    },
    {
        href: '/contact/municipalities',
        icon: Landmark,
        title: 'Belediyeler için',
        description: 'Şehrinizdeki sosyal faydayı artırın, vatandaş katılımını güçlendirin ve dijital hizmetlerinizi entegre edin.'
    },
    {
        href: '/contact/universities',
        icon: School,
        title: 'Üniversiteler için',
        description: 'Öğrenci kulüplerinizi güçlendirin, sosyal sorumluluk projelerinizi yönetin ve kampüsünüzde bir etki ağı oluşturun.'
    },
    {
        href: '/contact/funds',
        icon: DollarSign,
        title: 'Uluslararası Fonlar için',
        description: 'Türkiye\'deki sosyal etki ekosistemine yatırım yapın, şeffaf ve ölçülebilir projelere ortak olun.'
    }
];

export default function CorporatePage() {
    const router = useRouter();

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold font-headline">Kamu ve Kurumsal İlişkiler</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Hangel olarak, sürdürülebilir bir etki yaratmanın yolunun güçlü işbirliklerinden geçtiğine inanıyoruz.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {corporateItems.map((item) => (
                    <Link href={item.href} key={item.title} className="block">
                        <Card className="h-full hover:border-primary transition-all hover:scale-[1.02]">
                            <CardHeader className="flex-row items-center gap-4">
                                <item.icon className="h-8 w-8 text-primary" />
                                <CardTitle>{item.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{item.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
