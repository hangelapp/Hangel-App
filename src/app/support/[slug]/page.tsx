'use client';

import { helpTopics } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PublicFooter } from '@/components/layout/public-footer';
import { sanitizeHtml } from '@/lib/sanitize-html';

export default function SupportTopicPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const topic = helpTopics.find(t => t.slug === slug);

  if (!topic) {
    notFound();
  }

  return (
    <>
      <main className="p-4 space-y-6 animate-in fade-in-0">
        <Button onClick={() => router.push('/support')} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
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
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(subtopic.content) }}
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
      </main>
      <PublicFooter currentPageLabel={topic.title} />
    </>
  );
}
