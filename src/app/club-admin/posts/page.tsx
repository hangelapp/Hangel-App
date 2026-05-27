'use client';

// PDF audit #2 (Wave 1D flag): kulüp yöneticisi için ayrı `/club-admin/posts`
// rotası. /ngo-admin/posts sayfası artık ActiveEntityProvider context'i
// gerektirdiği için burada provider'ı manuel sarıyoruz — context'siz import
// useActiveEntity throw eder. Next.js 15: ActiveEntityProvider içinde
// useSearchParams() kullanıldığı için Suspense ile sarmalanmalı (aksi halde
// prerender hatası → App Hosting build fail).

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PostsPage from '@/app/ngo-admin/posts/page';
import { ActiveEntityProvider } from '@/app/ngo-admin/active-entity-context';

export default function ClubAdminPostsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-dvh"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <ActiveEntityProvider>
        <PostsPage />
      </ActiveEntityProvider>
    </Suspense>
  );
}
