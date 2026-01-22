'use client';

import { librarySections } from '@/lib/library';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft, ThumbsUp, ThumbsDown, Book, Film, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useState } from 'react';

export default function LibraryItemPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  
  const itemWithSection = librarySections.flatMap(section => 
    section.items.map(item => ({ ...item, sectionSlug: section.slug }))
  ).find(i => i.slug === params.slug);

  const item = itemWithSection;

  if (!item) {
    notFound();
  }

  const [isCompleted, setIsCompleted] = useState(false);
  const [recommendation, setRecommendation] = useState<'up' | 'down' | null>(null);

  const isViewable = item.sectionSlug === 'filmler' || item.sectionSlug === 'belgeseller';
  const completionText = isViewable ? 'İzledim' : 'Okudum';
  const CompletionIcon = isViewable ? Film : Book;

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
              onClick={() => setIsCompleted(!isCompleted)}
              className="w-28"
            >
              {isCompleted && <Check className="mr-2 h-4 w-4" />}
              {completionText}
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
             <p className="font-medium">Bu içeriği tavsiye eder misin?</p>
             <div className="flex gap-2">
                <Button 
                  variant={recommendation === 'up' ? 'default' : 'outline'} 
                  size="icon"
                  onClick={() => setRecommendation(recommendation === 'up' ? null : 'up')}
                >
                  <ThumbsUp />
                </Button>
                <Button 
                  variant={recommendation === 'down' ? 'destructive' : 'outline'} 
                  size="icon"
                  onClick={() => setRecommendation(recommendation === 'down' ? null : 'down')}
                >
                  <ThumbsDown />
                </Button>
             </div>
          </div>
          <div className="text-center pt-4">
            <p className="font-bold text-lg text-primary">%87</p>
            <p className="text-sm text-muted-foreground">oranında tavsiye ediliyor.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
