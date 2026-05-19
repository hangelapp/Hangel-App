'use client';

// PDF audit #3 (Wave 2D flag): `/posts/{id}` permalink view.
// Wave 2D'nin geçici `/timeline?post={id}` paylaşım URL'i timeline sayfası
// içinden çalışmaya devam eder; bu sayfa ise sosyal medya paylaşımları için
// direkt linklerin (ör. WhatsApp önizleme, X paylaşımı) 404 dönmemesini sağlar.
// SSR + OG meta tag rev'i ayrı bir görev (follow-up).

import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Loader2, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { sanitizeHtml } from '@/lib/sanitize-html';
import type { Post } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type PostDoc = Post & {
  createdAt?: { toDate?: () => Date } | string | number;
  authorId?: string;
};

function formatTimestamp(post: PostDoc): string {
  const c = post.createdAt;
  try {
    if (c && typeof c === 'object' && typeof c.toDate === 'function') {
      return c.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    if (typeof c === 'number') return new Date(c).toLocaleDateString('tr-TR');
    if (typeof c === 'string') {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) return new Date(t).toLocaleDateString('tr-TR');
    }
  } catch {
    // fall through to legacy
  }
  return post.timestamp ?? '';
}

export default function PostPermalinkPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id;
  const db = useFirestore();

  const postRef = useMemoFirebase(
    () => (db && postId ? doc(db, COLLECTIONS.posts, postId) : null),
    [db, postId],
  );
  const { data: post, isLoading } = useDoc<PostDoc>(postRef);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Yükleniyor…</span>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  const ts = formatTimestamp(post);
  const authorName = post.author?.name || 'Hangel';
  const authorAvatar = post.author?.avatarUrl;
  const safeHtml = sanitizeHtml(post.content ?? '');

  return (
    <main className="container max-w-2xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/timeline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zaman Tüneline Dön
          </Link>
        </Button>
      </div>
      <Card className="p-6">
        <article>
          <header className="flex items-center gap-3 mb-4">
            {authorAvatar ? (
              // Avatar boyutu sabit ve küçük; arbitrary URL olabileceği için
              // unoptimized prop'u ile next/image kullanıyoruz.
              <Image
                src={authorAvatar}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div
                className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold"
                aria-hidden="true"
              >
                {authorName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold truncate">{authorName}</p>
              {ts && <time className="text-sm text-muted-foreground">{ts}</time>}
            </div>
          </header>

          {post.imageUrl && (
            <div className="relative aspect-video mb-4 rounded-md overflow-hidden bg-muted">
              <Image
                src={post.imageUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}

          {safeHtml ? (
            <div
              className="prose dark:prose-invert max-w-none text-sm"
              // sanitizeHtml DOMPurify ile geçirir; bkz. src/lib/sanitize-html.ts
              dangerouslySetInnerHTML={{ __html: safeHtml }}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{post.content ?? ''}</p>
          )}

          <footer className="mt-6 flex items-center gap-4 text-sm text-muted-foreground border-t pt-4">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-rose-500" /> {post.likes ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> {post.comments ?? 0}
            </span>
          </footer>
        </article>
      </Card>
    </main>
  );
}

