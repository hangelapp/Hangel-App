import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-10rem)] text-center p-6">
      <TriangleAlert className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-3xl font-bold font-headline mb-2">Sayfa Bulunamadı</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">Aradığınız sayfayı bulamadık. Ana sayfaya dönerek keşfetmeye devam edebilirsiniz.</p>
      <Button asChild>
        <Link href="/timeline">Ana Sayfaya Dön</Link>
      </Button>
    </div>
  );
}
