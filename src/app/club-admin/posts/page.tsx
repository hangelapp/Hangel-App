'use client';

// PDF audit #2 (Wave 1D flag): kulüp yöneticisi için ayrı `/club-admin/posts`
// rotası. Mevcut `/ngo-admin/posts` sayfası entity-aware (NGO + marka + kulüp
// `users/{uid}.managedClubId` üzerinden çözer) — burada o sayfayı yeniden
// kullanıyoruz ki tek bir mantık deposu kalsın ve "her kurum kendi paylaşımını
// silme/düzenle yetkisine sahip" gereksinimi mevcut çözümle karşılansın.

import PostsPage from '@/app/ngo-admin/posts/page';

export default function ClubAdminPostsPage() {
  return <PostsPage />;
}
