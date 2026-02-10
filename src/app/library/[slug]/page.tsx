'use client';

import { librarySections } from '@/lib/library';
import { notFound, useRouter, useParams } from 'next/navigation';
import { ArrowLeft, ThumbsUp, ThumbsDown, Book, Film, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function LibraryItemPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  
  const itemWithSection = librarySections.flatMap(section => 
    section.items.map(item => ({ ...item, sectionSlug: section.slug }))
  ).find(i => i.slug === slug);

  const item = itemWithSection;

  if (!item) {
    notFound();
  }

  const [isCompleted, setIsCompleted] = useState(false);
  const [recommendation, setRecommendation] = useState<'up' | 'down' | null>(null);

  const isViewable = item.sectionSlug === 'filmler' || item.sectionSlug === 'belgeseller';
  const completionText = isViewable ? 'İzledim' : 'Okudum';
  const CompletionIcon = isViewable ? Film : Book;
  
  const handleToggleComplete = () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    toast({
        title: newStatus ? "İçerik Tamamlandı Olarak İşaretlendi" : "Tamamlandı İşareti Kaldırıldı",
        description: `"${item.title}"`,
    });
  };

  const handleRecommend = (rec: 'up' | 'down') => {
      const newRecommendation = recommendation === rec ? null : rec;
      setRecommendation(newRecommendation);
      toast({
          title: "Değerlendirmeniz Alındı",
          description: "Geri bildiriminiz için teşekkürler!",
      });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">{item.title}</h1>
      </div>
      <article
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4"
        dangerouslySetInnerHTML={{ __html: item.content }}
      />
       <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Bu İçeriği Değerlendir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <p className="font-medium flex items-center gap-2">
                <CompletionIcon className="h-5 w-5 text-muted-foreground"/> 
                Bu içeriği tamamladın mı?
            </p>
            <Button 
              variant={isCompleted ? 'default' : 'outline'}
              onClick={handleToggleComplete}
              className="w-28"
            >
              {isCompleted && <Check className="mr-2 h-4 w-4" />}
              {completionText}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
             <p className="font-medium">Bu içeriği yararlı buldun mu?</p>
             <div className="flex gap-2">
                <Button 
                  variant={recommendation === 'up' ? 'default' : 'outline'} 
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('up')}
                >
                  <ThumbsUp className="h-4 w-4" /> Yararlı
                </Button>
                <Button 
                  variant={recommendation === 'down' ? 'destructive' : 'outline'} 
                  size="sm"
                  className="gap-2"
                  onClick={() => handleRecommend('down')}
                >
                  <ThumbsDown className="h-4 w-4" /> Yararsız
                </Button>
             </div>
          </div>
          <div className="text-center pt-4">
            <p className="font-bold text-lg text-primary">%87</p>
            <p className="text-sm text-muted-foreground">oranında yararlı bulunuyor.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
