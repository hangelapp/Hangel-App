'use client';

// PDF audit #2 (Wave 1D flag): marka yöneticisi için ayrı `/brand-admin/posts`
// rotası. /ngo-admin/posts sayfası artık ActiveEntityProvider context'i
// gerektirdiği için burada provider'ı manuel sarıyoruz — context'siz import
// useActiveEntity throw eder.

import PostsPage from '@/app/ngo-admin/posts/page';
import { ActiveEntityProvider } from '@/app/ngo-admin/active-entity-context';

export default function BrandAdminPostsPage() {
  return (
    <ActiveEntityProvider>
      <PostsPage />
    </ActiveEntityProvider>
  );
}
