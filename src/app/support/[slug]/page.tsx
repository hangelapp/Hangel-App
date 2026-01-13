
import { notFound } from 'next/navigation';
import { helpTopics } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SupportTopicPage({ params }: { params: { slug: string } }) {
  const topic = helpTopics.find(t => t.slug === params.slug);

  if (!topic) {
    notFound();
  }

  const Icon = topic.icon;

  return (
    <div className="p-4 sm:p-6 space-y-6 animate-in fade-in-0">
        <Button asChild variant="ghost" className="pl-0">
            <Link href="/support">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Destek Merkezine Dön
            </Link>
        </Button>
      
        <div className="flex items-center gap-4">
            <Icon className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline">{topic.title}</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Genel Bakış</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                <p>{topic.content}</p>
                <p>Yakında bu sayfada ilgili konuyla ilgili daha fazla makale, sıkça sorulan sorular ve video rehberler bulabileceksiniz.</p>
            </CardContent>
        </Card>
    </div>
  );
}

// Optional: Generate static paths for better performance
export async function generateStaticParams() {
  return helpTopics.map(topic => ({
    slug: topic.slug,
  }));
}
