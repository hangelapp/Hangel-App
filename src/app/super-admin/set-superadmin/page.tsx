'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, Loader2, Search, ShieldCheck, UserPlus, XCircle } from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';

const SUPER_ADMIN_PAGES: { slug: string; label: string }[] = [
  { slug: 'web-content', label: 'WEB İçerik Yönetimi' },
  { slug: 'association-content', label: 'Dernek Web Sitesi Yönetimi' },
  { slug: 'contracts', label: 'Sözleşmeler ve Politikalar' },
  { slug: 'pages', label: 'İçerik Sayfaları (Basın/Etkinlik vb.)' },
  { slug: 'applications', label: 'Başvuru Yönetimi' },
  { slug: 'users', label: 'Kullanıcı Yönetimi' },
  { slug: 'ngos', label: 'STK Yönetimi' },
  { slug: 'brands', label: 'Marka Yönetimi' },
  { slug: 'clubs', label: 'Kulüp Yönetimi' },
  { slug: 'volunteer', label: 'Gönüllülük Yönetimi' },
  { slug: 'donations', label: 'Bağış Yönetimi' },
  { slug: 'funds', label: 'Fon & Hibe Programları' },
  { slug: 'emergency', label: 'Acil Durum Yönetimi' },
  { slug: 'posts', label: 'Gönderi Yönetimi' },
  { slug: 'surveys', label: 'Anket & Değerlendirmeler' },
  { slug: 'analytics', label: 'İstatistik, Analizler & Demografi' },
  { slug: 'activity', label: 'Aktiviteler & İşlem Logu' },
  { slug: 'transparency', label: 'Şeffaflık Yönetimi' },
  { slug: 'communications', label: 'DM & Bildirim' },
  { slug: 'messaging', label: 'Toplu SMS & E-Posta' },
  { slug: 'ads', label: 'Reklam Yönetimi' },
  { slug: 'public-relations', label: 'Kamu İlişkileri' },
  { slug: 'settings', label: 'Panel Ayarları' },
  { slug: 'support', label: 'Destek Talepleri' },
];

interface AdminCandidateUser {
  id: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  superAdminPermissions?: string[];
  personalInfo?: { phone?: string; email?: string };
  phoneNumber?: string;
  email?: string;
}

const normalize = (s: string) => s.replace(/[^0-9a-zA-Z@._-]/g, '').toLowerCase();

export default function SetSuperAdminPage() {
  const db = useFirestore();
  const { toast } = useToast();

  // Eski 5384009090 hızlı atama
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);

  // Yeni kullanıcı yetkilendirme
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  const usersQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.users) : null), [db]);
  const { data: usersData } = useCollection<AdminCandidateUser>(usersQuery);

  const matchedUsers = useMemo(() => {
    const q = normalize(searchTerm);
    if (q.length < 3) return [];
    return (usersData || []).filter(u => {
      const hay = [
        normalize(u.personalInfo?.phone || ''),
        normalize(u.phoneNumber || ''),
        normalize(u.personalInfo?.email || ''),
        normalize(u.email || ''),
        normalize(u.name || ''),
        normalize(u.displayName || ''),
      ].join(' ');
      return hay.includes(q);
    }).slice(0, 5);
  }, [usersData, searchTerm]);

  const selectedUser = useMemo(
    () => (usersData || []).find(u => u.id === selectedUserId) || null,
    [usersData, selectedUserId],
  );

  React.useEffect(() => {
    if (selectedUser) {
      setPermissions(selectedUser.superAdminPermissions || SUPER_ADMIN_PAGES.map(p => p.slug));
    }
  }, [selectedUser]);

  const togglePermission = (slug: string) =>
    setPermissions(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));

  const handleAssignSuperAdmin = async () => {
    if (!db || !selectedUser) return;
    setAssigning(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.users, selectedUser.id), {
        role: 'super-admin',
        superAdminPermissions: permissions,
      });
      toast({
        title: 'Süper Admin Atandı',
        description: `${selectedUser.name || selectedUser.displayName || selectedUser.id} ${permissions.length} sayfa yetkisiyle süper admin olarak ayarlandı.`,
      });
      setSelectedUserId(null);
      setSearchTerm('');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Atama başarısız',
        description: code === 'permission-denied' ? 'Bu işlem için süper admin yetkisi gerekli.' : message,
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleSetSuperAdmin = async () => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Veritabanı bağlantısı hazır değil.' });
      return;
    }
    setIsLoading(true);
    setStatus('');
    try {
      const phoneNumber = '5384009090';
      const newUserId = 'superadmin-5384009090';
      setStatus('SUPERADMIN kullanıcısı oluşturuluyor...');
      const superAdminUser = {
        id: newUserId,
        name: 'Super Admin',
        username: '@superadmin',
        personalInfo: { phone: phoneNumber, email: 'superadmin@hangel.com' },
        role: 'super-admin',
        superAdminPermissions: SUPER_ADMIN_PAGES.map(p => p.slug),
        createdAt: new Date().toISOString(),
      };
      setDocumentNonBlocking(doc(db, COLLECTIONS.users, newUserId), superAdminUser, { merge: true });
      setStatus(`✓ SUPERADMIN ayarlandı!\nTelefon: ${phoneNumber}\nKullanıcı ID: ${newUserId}`);
      toast({ title: 'Başarılı', description: 'SUPERADMIN ayarı tamamlandı.' });
      setIsComplete(true);
      await new Promise(r => setTimeout(r, 800));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setStatus(`Hata: ${message}`);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto p-4 animate-in fade-in-0">
      <div>
        <h1 className="text-3xl font-black tracking-tighter">Süper Admin Yetkilendirme</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Yeni bir süper admin ata veya mevcut süper adminlerin sayfa bazlı yetkilerini düzenle.
        </p>
      </div>

      {/* Yeni süper admin ataması */}
      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Yeni Süper Admin Ataması
          </CardTitle>
          <CardDescription>
            Telefon, e-posta veya isimle bir kullanıcı bul, sayfa bazlı yetkilerini seç ve süper admin yap.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Telefon, e-posta veya isim ara (en az 3 karakter)"
              className="pl-10 h-11 rounded-xl"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setSelectedUserId(null);
              }}
            />
          </div>

          {searchTerm.length >= 3 && !selectedUser && (
            <div className="border rounded-xl divide-y">
              {matchedUsers.length === 0 ? (
                <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground italic">
                  <XCircle className="h-4 w-4" />
                  Eşleşen kullanıcı bulunamadı
                </div>
              ) : (
                matchedUsers.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUserId(u.id)}
                    className="w-full p-3 flex items-center gap-3 hover:bg-muted/40 text-left"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={u.avatarUrl} alt={u.name || ''} />
                      <AvatarFallback>{(u.name || u.displayName || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{u.name || u.displayName || 'İsimsiz'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {u.personalInfo?.phone || u.phoneNumber || u.personalInfo?.email || u.email || u.id}
                      </p>
                    </div>
                    {u.role === 'super-admin' && (
                      <Badge variant="outline" className="text-[10px] font-black uppercase">Mevcut Süper Admin</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {selectedUser && (
            <div className="border-2 border-primary/30 rounded-2xl p-4 bg-primary/5 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatarUrl} alt={selectedUser.name || ''} />
                  <AvatarFallback className="font-black">{(selectedUser.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm">{selectedUser.name || selectedUser.displayName || 'İsimsiz'}</p>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUser.personalInfo?.phone || selectedUser.phoneNumber} · {selectedUser.personalInfo?.email || selectedUser.email}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedUserId(null)}>Değiştir</Button>
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-wider">Sayfa Yetkileri ({permissions.length}/{SUPER_ADMIN_PAGES.length})</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {SUPER_ADMIN_PAGES.map(p => (
                    <label key={p.slug} className="flex items-center gap-2 px-2 py-1.5 hover:bg-background rounded-lg cursor-pointer">
                      <Checkbox
                        checked={permissions.includes(p.slug)}
                        onCheckedChange={() => togglePermission(p.slug)}
                      />
                      <span className="text-xs font-medium">{p.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={() => setPermissions(SUPER_ADMIN_PAGES.map(p => p.slug))}>
                    Tümünü seç
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPermissions([])}>
                    Tümünü temizle
                  </Button>
                </div>
              </div>

              <Button
                disabled={assigning || permissions.length === 0}
                onClick={handleAssignSuperAdmin}
                className="w-full h-12 rounded-xl font-bold"
              >
                {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ShieldCheck className="mr-2 h-4 w-4" />
                Süper Admin Olarak Ata
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Eski hızlı atama */}
      <Card className="rounded-2xl border-orange-200 bg-orange-50/40">
        <CardHeader>
          <CardTitle className="text-orange-800 flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" /> Hızlı Ayar: 5384009090
          </CardTitle>
          <CardDescription className="text-orange-700">
            Telefon 5384009090 numaralı varsayılan SUPERADMIN kullanıcısını oluşturur (tüm sayfa yetkileri açık).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSetSuperAdmin}
            disabled={isLoading || isComplete}
            className="w-full bg-orange-600 hover:bg-orange-700 h-12 rounded-xl text-white font-bold"
          >
            {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            {isComplete ? '✓ Tamamlandı' : 'Varsayılan SUPERADMIN\'i Oluştur'}
          </Button>
          {status && (
            <div className={`mt-3 rounded-xl p-3 text-xs whitespace-pre-line ${isComplete ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
              {status}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
