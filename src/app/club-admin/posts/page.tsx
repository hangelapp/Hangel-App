'use client';

// PDF audit #2 (Wave 1D flag): kulüp yöneticisi için ayrı `/club-admin/posts`
// rotası. /ngo-admin/posts sayfası artık ActiveEntityProvider context'i
// gerektirdiği için burada provider'ı manuel sarıyoruz — context'siz import
// useActiveEntity throw eder.

import PostsPage from '@/app/ngo-admin/posts/page';
import { ActiveEntityProvider } from '@/app/ngo-admin/active-entity-context';

export default function ClubAdminPostsPage() {
  return (
    <ActiveEntityProvider>
      <PostsPage />
    </ActiveEntityProvider>
  );
}
