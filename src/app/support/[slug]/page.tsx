'use client';

import { helpTopics } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function SupportTopicPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const topic = helpTopics.find(t => t.slug === params.slug);

  if (!topic) {
    notFound();
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">{topic.title}</h1>
        <p className="text-muted-foreground">{topic.description}</p>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-2">
        {topic.subtopics.map((subtopic, index) => (
          <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline text-left">{subtopic.title}</AccordionTrigger>
            <AccordionContent>
              <div
                className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t"
                dangerouslySetInnerHTML={{ __html: subtopic.content }}
              />
              <div className="mt-6 pt-4 text-center border-t">
                  <p className="text-sm font-medium mb-2">Bu size yardımcı oldu mu?</p>
                  <div className="flex justify-center gap-2">
                      <Button variant="outline" size="sm">Evet</Button>
                      <Button variant="outline" size="sm">Hayır</Button>
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>® hangel.org v.12</p>
      </footer>
    </div>
  );
}
