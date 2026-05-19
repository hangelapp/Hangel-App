'use client';

// PDF audit #2 (Wave 1D flag): marka yöneticisi için ayrı `/brand-admin/posts`
// rotası. Mevcut `/ngo-admin/posts` sayfası entity-aware (NGO + marka + kulüp
// `users/{uid}.managedBrandId` üzerinden çözer) — burada o sayfayı yeniden
// kullanıyoruz ki tek bir mantık deposu kalsın ve "her kurum kendi paylaşımını
// silme/düzenle yetkisine sahip" gereksinimi mevcut çözümle karşılansın.

import PostsPage from '@/app/ngo-admin/posts/page';

export default function BrandAdminPostsPage() {
  return <PostsPage />;
}
