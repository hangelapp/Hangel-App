'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Siren, Droplet, Users, Send, MapPin, Loader2, Clock, CheckCircle, AlertCircle, Info, MessageCircle, ThumbsUp, ThumbsDown, Phone, Mail, Inbox, XCircle, User as UserIcon, Pencil, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, query, orderBy, limit, where, updateDoc, getDocs, documentId } from 'firebase/firestore';
import { allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COLLECTIONS } from '@/firebase/collections';

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

type ScopeLevel = 'all' | 'city' | 'district' | 'neighborhood';

interface EmergencyDoc {
  id: string;
  type?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  bloodType?: string;
  scope?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  message?: string;
  contactPhone?: string;
  contactName?: string;
  unitsNeeded?: number | string;
  targetCount?: number;
  status?: string;
  requestId?: string;
  requestedByName?: string;
  requestedByEmail?: string;
  userName?: string;
  userEmail?: string;
  createdAt?: unknown;
  respondedAt?: unknown;
}

interface UserDoc {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  personalInfo?: {
    bloodType?: string;
    gender?: string;
    firstName?: string;
    lastName?: string;
    address?: { country?: string; city?: string; district?: string; neighborhood?: string };
  };
}

// Trailing whitespace + büyük/küçük harf farklarını yutar — `'İstanbul '` ile
// `'İstanbul'` veya `'erkek'` ile `'Erkek'` aynı sayılır.
function norm(s: string | undefined | null): string {
  return (s || '').trim().toLocaleLowerCase('tr');
}

// Kan grubunu olası tüm yazımlardan ('A Rh+', 'A+', 'A pozitif', ...) tek bir
// kanonik forma çevirir — Firestore'da inkonsistent veri yazımlarını birleştirir.
function canonBlood(s: string | undefined | null): string {
  if (!s) return '';
  let t = s.toLocaleLowerCase('tr').replace(/\s+/g, '').replace(/rh/g, '');
  t = t.replace('pozitif', '+').replace('positive', '+').replace('negatif', '-').replace('negative', '-');
  return t; // örn: 'a+', '0-', 'ab+'
}

// Bir kullanıcı verilen filtre kriterlerini karşılıyor mu? Hem sayım hem
// fan-out aynı bu predicate'i kullanır → ekrandaki sayı her zaman gerçek
// bildirim alacak kitle sayısına eşit.
function matchesScope(u: UserDoc, sel: ScopeSelection): boolean {
  const pi = u.personalInfo;
  if (!pi) return false;
  if (sel.bloodType) {
    if (canonBlood(pi.bloodType) !== canonBlood(sel.bloodType)) return false;
  }
  if (sel.gender && sel.gender !== 'all') {
    if (norm(pi.gender) !== norm(sel.gender)) return false;
  }
  if (sel.scope === 'all') {
    // 'Tüm Türkiye' = country yok ya da Türkiye/TR (defansif).
    const c = norm(pi.address?.country);
    if (c && c !== 'türkiye' && c !== 'turkiye' && c !== 'tr' && c !== 'türkiye cumhuriyeti') {
      return false;
    }
  } else {
    const userCity = norm(pi.address?.city);
    if (!userCity || userCity !== norm(sel.city)) return false;
    if (sel.scope === 'district' || sel.scope === 'neighborhood') {
      const userDistrict = norm(pi.address?.district);
      if (!userDistrict || userDistrict !== norm(sel.district)) return false;
    }
    if (sel.scope === 'neighborhood') {
      const userNbh = norm(pi.address?.neighborhood);
      if (!userNbh || userNbh !== norm(sel.neighborhood)) return false;
    }
  }
  return true;
}

const scopeLabel: Record<ScopeLevel, string> = {
  all: 'Tüm Türkiye',
  city: 'İl Geneli',
  district: 'İlçe Geneli',
  neighborhood: 'Mahalle',
};

interface ScopeSelection {
  scope: ScopeLevel;
  city: string;
  district: string;
  neighborhood: string;
  bloodType: string;
  // 'all' = filtre uygulanmaz; 'Erkek' / 'Kadın' = profilinde bu cinsiyeti
  // seçmiş kullanıcıları kapsar.
  gender: 'all' | 'Erkek' | 'Kadın';
}

export default function EmergencyManagementPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const [activeTab, setActiveTab] = useState<string>('pending');

  // Form state
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [scope, setScope] = useState<ScopeLevel>('city');
  const [gender, setGender] = useState<'all' | 'Erkek' | 'Kadın'>('all');
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [isSending, setIsSending] = useState(false);
  const pendingApprovalIdRef = useRef<string | null>(null);

  // Hedef kitle önizlemesi — tüm kullanıcılar tek seferde yüklenir; sayım ve
  // fan-out (handleSendRequest) aynı client-side predicate'i kullanır. Bu
  // sayede üretim verisindeki trailing whitespace, eksik country, kan grubu
  // yazım farkları gibi tutarsızlıklar tek normalize katmanından geçer ve
  // ekrandaki sayı = gerçekten bildirim alacak kullanıcı sayısı olur.
  const allUsersRef = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
  const { data: allUsersData, isLoading: usersLoading } = useCollection<UserDoc>(allUsersRef);
  const countError: string | null = null;
  const countLoading = usersLoading;

  // Geçmiş talepler
  const requestsQuery = useMemoFirebase(() => {
    return query(collection(db, COLLECTIONS.emergencyRequests), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: requests, isLoading: requestsLoading } = useCollection<EmergencyDoc>(requestsQuery);

  // Yanıtlar (kullanıcıların kan taleplerine verdikleri cevaplar)
  const responsesQuery = useMemoFirebase(() => {
    return query(collection(db, COLLECTIONS.emergencyResponses), orderBy('respondedAt', 'desc'), limit(200));
  }, [db]);
  const { data: responses, isLoading: responsesLoading } = useCollection<EmergencyDoc>(responsesQuery);

  // Kullanıcı tarafından gönderilmiş, super-admin onayı bekleyen talepler
  const pendingRequestsQuery = useMemoFirebase(() => {
    return query(collection(db, COLLECTIONS.emergencyRequests), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: pendingRequestsPrimary } = useCollection<EmergencyDoc>(pendingRequestsQuery);

  // Geriye dönük uyumluluk: bloodRequests / userRequests koleksiyonları varsa onlardan da oku
  const bloodRequestsQuery = useMemoFirebase(() => {
    try {
      return query(collection(db, COLLECTIONS.bloodRequests), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    } catch { return null; }
  }, [db]);
  const { data: bloodRequestsFallback } = useCollection<EmergencyDoc>(bloodRequestsQuery);

  const userRequestsQuery = useMemoFirebase(() => {
    try {
      return query(collection(db, COLLECTIONS.userRequests), where('type', '==', 'blood'), orderBy('createdAt', 'desc'));
    } catch { return null; }
  }, [db]);
  const { data: userRequestsFallback } = useCollection<EmergencyDoc>(userRequestsQuery);

  // Birleştirilmiş "onay bekleyen" liste (id bazlı tekilleştirme)
  const pendingRequests = useMemo(() => {
    const all: EmergencyDoc[] = [
      ...(pendingRequestsPrimary ?? []),
      ...(bloodRequestsFallback ?? []),
      ...((userRequestsFallback ?? []).filter(r => !r.status || r.status === 'pending')),
    ];
    const seen = new Set<string>();
    return all.filter(r => {
      if (!r.id || seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [pendingRequestsPrimary, bloodRequestsFallback, userRequestsFallback]);

  // Yanıt veren kullanıcıların id listesi (Yanıtlar sekmesi avatar/ad araması için).
  // Tüm kullanıcı koleksiyonu yerine yalnız yanıtlayanları çekeriz.
  const responderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of responses ?? []) {
      const uid = (r as EmergencyDoc & { userId?: string }).userId;
      if (uid) ids.add(uid);
    }
    return Array.from(ids);
  }, [responses]);

  const [respondersById, setRespondersById] = useState<Map<string, UserDoc>>(new Map());

  // Yanıt veren kullanıcıları documentId() in (10'luk parçalar) ile hedefli çek.
  useEffect(() => {
    if (!db || responderIds.length === 0) {
      setRespondersById(new Map());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const chunks: string[][] = [];
        for (let i = 0; i < responderIds.length; i += 10) {
          chunks.push(responderIds.slice(i, i + 10));
        }
        const map = new Map<string, UserDoc>();
        await Promise.all(chunks.map(async (chunk) => {
          const snap = await getDocs(query(collection(db, COLLECTIONS.users), where(documentId(), 'in', chunk)));
          for (const d of snap.docs) {
            map.set(d.id, { id: d.id, ...(d.data() as Omit<UserDoc, 'id'>) });
          }
        }));
        if (!cancelled) setRespondersById(map);
      } catch (e) {
        // Avatar araması başarısız olursa yanıtlar yine de kayıtlı ad/email ile gösterilir.
        if (!cancelled) {
          setRespondersById(new Map());
          const message = e instanceof Error ? e.message : 'Bilinmeyen bir hata oluştu.';
          toast({ variant: 'destructive', title: 'Yanıt detayları yüklenemedi', description: message });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [db, responderIds, toast]);

  const usersById = respondersById;

  // City / district options
  const districtOptions = city ? (districtsData[city] ?? []) : [];
  const neighborhoodOptions = (city && district) ? ((neighborhoodsData as Record<string, Record<string, string[]>>)[city]?.[district] ?? []) : [];

  // Kapsam seçimi eksikse sayım gösterme (kullanıcı önce il/ilçe/mahalle seçmeli).
  const scopeIncomplete =
    (scope === 'city' && !city) ||
    (scope === 'district' && (!city || !district)) ||
    (scope === 'neighborhood' && (!city || !district || !neighborhood));

  // Hedef kullanıcıları client-side filtre ile hesapla — sayım ve fan-out tek
  // kaynaktan beslenir, üretim verisindeki yazım tutarsızlıkları normalize ile
  // yutulur (trim, case fix, kan grubu kanonikalleştirme, country opsiyonel).
  const matchedUserIds = useMemo<string[] | null>(() => {
    if (!allUsersData || scopeIncomplete) return null;
    const sel: ScopeSelection = { scope, city, district, neighborhood, bloodType, gender };
    return allUsersData.filter((u) => matchesScope(u, sel)).map((u) => u.id);
  }, [allUsersData, scopeIncomplete, scope, city, district, neighborhood, bloodType, gender]);
  const matchCount = matchedUserIds?.length ?? null;
  const totalUsers = allUsersData?.length ?? null;

  // Kullanıcı talebini forma yükle (preview & onayla)
  const loadIntoForm = (req: EmergencyDoc) => {
    setHospitalName(req.hospitalName || '');
    setHospitalAddress(req.hospitalAddress || '');
    setBloodType(req.bloodType || '');
    setMessage(req.message || '');
    setContactPhone(req.contactPhone || '');
    // Yanıtlayan kullanıcının ulaşacağı isim — kullanıcı talebinden contactName,
    // yoksa requestedByName ile pre-fill.
    setContactName((req as EmergencyDoc & { contactName?: string }).contactName || req.requestedByName || '');
    setUnitsNeeded(req.unitsNeeded ? String(req.unitsNeeded) : '');
    setScope((req.scope as ScopeLevel) || 'city');
    setCity(req.city || '');
    setDistrict(req.district || '');
    setNeighborhood(req.neighborhood || '');
    setGender(((req as EmergencyDoc & { gender?: 'all' | 'Erkek' | 'Kadın' }).gender) || 'all');
    // Forma gönderilen kullanıcı talebinin id'sini sakla — onay sonrası güncellenecek
    pendingApprovalIdRef.current = req.id;
    setActiveTab('blood');
    toast({ title: 'Talep yüklendi', description: 'İl/ilçe/mahalle seçip "Acil Talep Gönder"e basarak yayınlayabilirsiniz.' });
    // Form bölümüne kaydır
    setTimeout(() => document.getElementById('emergency-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  // BUG-25: Mevcut onaylanmış talebi forma yükle (düzenleme akışı)
  // loadIntoForm ile aynı ama 'edit' flag set ediliyor — handleSendRequest
  // status'u 'sent' bırakıp updateDoc yapacak, bildirim re-fan-out edecek.
  const loadIntoFormForEdit = (req: EmergencyDoc) => {
    setHospitalName(req.hospitalName || '');
    setHospitalAddress(req.hospitalAddress || '');
    setBloodType(req.bloodType || '');
    setMessage(req.message || '');
    setContactPhone(req.contactPhone || '');
    setContactName((req as EmergencyDoc & { contactName?: string }).contactName || req.requestedByName || '');
    setUnitsNeeded(req.unitsNeeded ? String(req.unitsNeeded) : '');
    setScope((req.scope as ScopeLevel) || 'city');
    setCity(req.city || '');
    setDistrict(req.district || '');
    setNeighborhood(req.neighborhood || '');
    setGender(((req as EmergencyDoc & { gender?: 'all' | 'Erkek' | 'Kadın' }).gender) || 'all');
    pendingApprovalIdRef.current = req.id;
    setActiveTab('blood');
    toast({ title: 'Düzenleme modu', description: 'Bilgileri güncelleyip "Gönder"e basın; talep güncellenir ve eşleşen kullanıcılara tekrar bildirim gider.' });
    setTimeout(() => document.getElementById('emergency-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  // BUG-25: Onaylanmış talep için tekrar bildirim (form/doc değişikliği yok)
  const handleResendNotifications = async (req: EmergencyDoc) => {
    if (!confirm(`"${req.hospitalName}" için kapsamdaki kullanıcılara tekrar bildirim gönderilsin mi?`)) return;
    try {
      const sel: ScopeSelection = {
        scope: (req.scope as ScopeLevel) || 'city',
        city: req.city || '',
        district: req.district || '',
        neighborhood: req.neighborhood || '',
        bloodType: req.bloodType || '',
        gender: ((req as EmergencyDoc & { gender?: 'all' | 'Erkek' | 'Kadın' }).gender) || 'all',
      };
      // Aynı normalize'lı predicate'i kullan — Hedef Kitle Önizlemesindeki sayı
      // ile bildirim alacak kullanıcılar her zaman birebir aynı.
      const targetSnap = await getDocs(collection(db, COLLECTIONS.users));
      const targetUserIds = targetSnap.docs
        .map((d) => ({ id: d.id, data: d.data() as UserDoc }))
        .filter((row) => matchesScope({ ...row.data, id: row.id }, sel))
        .map((row) => row.id);

      if (targetUserIds.length === 0) {
        toast({ variant: 'destructive', title: 'Hedef yok', description: 'Kapsama uyan kullanıcı bulunamadı.' });
        return;
      }

      const batches: ReturnType<typeof writeBatch>[] = [];
      let current = writeBatch(db);
      let count = 0;
      for (const uid of targetUserIds) {
        const notifRef = doc(collection(db, COLLECTIONS.notifications));
        current.set(notifRef, {
          userId: uid,
          type: 'emergency-blood',
          title: `🩸 Acil Kan Talebi (Tekrar) — ${req.bloodType}`,
          body: `${req.hospitalName} hastanesi için ${req.bloodType} kan grubuna acil ihtiyaç devam ediyor.${req.message ? ` ${String(req.message).slice(0, 100)}` : ''}`,
          data: {
            requestId: req.id,
            hospitalName: req.hospitalName,
            hospitalAddress: req.hospitalAddress,
            bloodType: req.bloodType,
            contactName: (req as EmergencyDoc & { contactName?: string }).contactName || req.requestedByName || null,
            contactPhone: req.contactPhone || null,
          },
          read: false,
          createdAt: serverTimestamp(),
        });
        count += 1;
        if (count >= 450) { batches.push(current); current = writeBatch(db); count = 0; }
      }
      if (count > 0) batches.push(current);
      await Promise.all(batches.map(b => b.commit()));

      const prevResent = (req as unknown as { resentCount?: number }).resentCount;
      await updateDoc(doc(db, COLLECTIONS.emergencyRequests, req.id), {
        lastResentAt: serverTimestamp(),
        resentCount: (typeof prevResent === 'number' ? prevResent : 0) + 1,
      });

      toast({ title: '✅ Tekrar bildirim gönderildi', description: `${targetUserIds.length} kullanıcıya yeniden iletildi.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const msg = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Gönderilemedi',
        description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : msg,
      });
    }
  };

  // Kullanıcı talebini reddet
  const handleRejectRequest = async (reqId: string) => {
    if (!confirm('Bu talep reddedilsin mi?')) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.emergencyRequests, reqId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: authUser?.uid || null,
      });
      toast({ title: 'Talep reddedildi' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen bir hata oluştu.';
      toast({ variant: 'destructive', title: 'Hata', description: message });
    }
  };

  const handleSendRequest = async () => {
    if (!hospitalName.trim() || !bloodType) {
      toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Hastane adı ve kan grubu zorunludur.' });
      return;
    }
    if (scope === 'city' && !city) {
      toast({ variant: 'destructive', title: 'İl seçimi gerekli', description: 'İl genelinde göndermek için il seçin.' });
      return;
    }
    if (scope === 'district' && !district) {
      toast({ variant: 'destructive', title: 'İlçe seçimi gerekli' });
      return;
    }
    if (scope === 'neighborhood' && !neighborhood) {
      toast({ variant: 'destructive', title: 'Mahalle seçimi gerekli' });
      return;
    }

    setIsSending(true);
    try {
      // 1. Hedef kullanıcılar — useMemo'da hesaplanmış matchedUserIds aynen kullanılır.
      // Bu sayede Hedef Kitle Önizlemesindeki sayı = gönderilen kullanıcı sayısı.
      const targetUserIds = matchedUserIds ?? [];

      // 2. Tek mantıksal talep = tek doküman. Kullanıcı talebinden onaylanıyorsa
      //    orijinal pending dokümanı güncellenir; değilse yeni doküman açılır.
      //    requestId her zaman bu dokümanın id'sidir (bildirim → yanıt eşleşmesi).
      const pendingId = pendingApprovalIdRef.current;
      const requestData = {
        type: 'blood',
        hospitalName: hospitalName.trim(),
        hospitalAddress: hospitalAddress.trim(),
        bloodType,
        scope,
        city: city || null,
        district: district || null,
        neighborhood: neighborhood || null,
        gender,
        message: message.trim(),
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        unitsNeeded: Number(unitsNeeded) || null,
        targetCount: targetUserIds.length,
      };

      let requestId: string;
      if (pendingId) {
        await updateDoc(doc(db, COLLECTIONS.emergencyRequests, pendingId), {
          ...requestData,
          status: 'sent',
          approvedAt: serverTimestamp(),
          approvedBy: authUser?.uid || null,
        });
        requestId = pendingId;
      } else {
        const requestRef = await addDoc(collection(db, COLLECTIONS.emergencyRequests), {
          ...requestData,
          sentBy: authUser?.uid || null,
          status: 'sent',
          createdAt: serverTimestamp(),
        });
        requestId = requestRef.id;
      }

      // 3. Eşleşen kullanıcılara bildirim yaz (batched — 500/batch Firestore limiti, 450 kullanıyoruz)
      if (targetUserIds.length > 0) {
        const batches: ReturnType<typeof writeBatch>[] = [];
        let current = writeBatch(db);
        let count = 0;
        for (const uid of targetUserIds) {
          const notifRef = doc(collection(db, COLLECTIONS.notifications));
          current.set(notifRef, {
            userId: uid,
            type: 'emergency-blood',
            title: `🩸 Acil Kan Talebi — ${bloodType}`,
            body: `${hospitalName} hastanesi için ${bloodType} kan grubuna acil ihtiyaç var.${message ? ` ${message.slice(0, 100)}` : ''}`,
            data: {
              requestId,
              hospitalName,
              hospitalAddress,
              bloodType,
              contactName: contactName || null,
              contactPhone: contactPhone || null,
            },
            read: false,
            createdAt: serverTimestamp(),
          });
          count += 1;
          if (count >= 450) {
            batches.push(current);
            current = writeBatch(db);
            count = 0;
          }
        }
        if (count > 0) batches.push(current);
        await Promise.all(batches.map(b => b.commit()));
      }

      pendingApprovalIdRef.current = null;

      toast({
        title: '✅ Acil Talep Gönderildi',
        description: `${targetUserIds.length} kullanıcıya bildirim ulaştırıldı.`,
      });

      // Formu temizle
      setHospitalName('');
      setHospitalAddress('');
      setBloodType('');
      setCity('');
      setDistrict('');
      setNeighborhood('');
      setMessage('');
      setContactName('');
      setContactPhone('');
      setUnitsNeeded('');
      setScope('city');
      setGender('all');
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      const errMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Gönderilemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : code === 'failed-precondition'
            ? 'Bu filtre için Firestore dizini gerekli. Hata bağlantısından dizini oluşturun.'
            : errMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (createdAt: unknown) => {
    try {
      const maybeDate = createdAt as { toDate?: () => Date } | null;
      const d = maybeDate?.toDate?.() || (createdAt ? new Date(createdAt as string | number | Date) : null);
      if (!d) return '—';
      return format(d, 'dd MMM yyyy HH:mm', { locale: tr });
    } catch { return '—'; }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-red-100 rounded-2xl">
          <Siren className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Acil Durum Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Acil kan talepleri ve afet bildirimleri.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
          <TabsTrigger value="pending" className="gap-2">
            <Inbox className="h-4 w-4" /> Kullanıcı Talepleri
            {pendingRequests && pendingRequests.length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-[10px] h-4 px-1.5">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="blood" className="gap-2">
            <Droplet className="h-4 w-4" /> Kan İlanları
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-2">
            <MessageCircle className="h-4 w-4" /> Yanıtlar
            {responses && responses.length > 0 && (
              <Badge className="ml-1 bg-green-600 text-[10px] h-4 px-1.5">{responses.filter(r => r.status === 'positive').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="disaster" className="gap-2">
            <AlertCircle className="h-4 w-4" /> Afet
          </TabsTrigger>
        </TabsList>

        {/* KULLANICI TALEPLERİ — onay bekleyen talepler */}
        <TabsContent value="pending" className="mt-6 space-y-3">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <Inbox className="h-5 w-5" /> Onay Bekleyen Kullanıcı Talepleri
              </CardTitle>
              <CardDescription>
                Kullanıcılar /emergency sayfasından kan talebi gönderdiğinde burada listelenir.
                "Form'a Yükle" → il/ilçe/mahalle seçip yayınla, ya da reddet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!pendingRequests || pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Inbox className="h-10 w-10 mx-auto opacity-30 mb-2" />
                  <p>Onay bekleyen kullanıcı talebi yok.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="border rounded-2xl p-4 bg-background space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-red-600 text-[11px]">{req.bloodType || '?'}</Badge>
                          <p className="font-bold text-sm">{req.hospitalName || 'Hastane'}</p>
                          <Badge variant="outline" className="text-[10px]">Onay Bekliyor</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{formatDate(req.createdAt)}</div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <UserIcon className="h-3 w-3" />
                          <span>{req.requestedByName || req.contactName || 'Kullanıcı'}</span>
                        </div>
                        {req.contactPhone && (
                          <a href={`tel:${req.contactPhone}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                            <Phone className="h-3 w-3" /> {req.contactPhone}
                          </a>
                        )}
                        {req.requestedByEmail && (
                          <a href={`mailto:${req.requestedByEmail}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                            <Mail className="h-3 w-3" /> {req.requestedByEmail}
                          </a>
                        )}
                      </div>

                      {req.message && (
                        <p className="text-sm bg-muted/40 p-3 rounded-lg border whitespace-pre-wrap">{req.message}</p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 rounded-xl"
                          onClick={() => loadIntoForm(req)}
                        >
                          <Send className="mr-2 h-3.5 w-3.5" /> Form'a Yükle &amp; Yayınla
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl text-destructive hover:bg-destructive/10 border-destructive/30"
                          onClick={() => handleRejectRequest(req.id)}
                        >
                          <XCircle className="mr-2 h-3.5 w-3.5" /> Reddet
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KAN İLANLARI */}
        <TabsContent value="blood" className="mt-6 space-y-6">
          <Card id="emergency-form-card" className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Droplet className="h-5 w-5" /> Yeni Acil Kan Talebi
              </CardTitle>
              <CardDescription>
                Eşleşen kan grubu ve seçili konumdaki kullanıcılara anında bildirim gönderilir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hastane Adı *</Label>
                  <Input value={hospitalName} onChange={e => setHospitalName(e.target.value)} placeholder="Ör: İstanbul Tıp Fakültesi" />
                </div>
                <div className="space-y-2">
                  <Label>Kan Grubu *</Label>
                  <Select value={bloodType} onValueChange={setBloodType}>
                    <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hastane Adresi</Label>
                <Input value={hospitalAddress} onChange={e => setHospitalAddress(e.target.value)} placeholder="Tam adres bilgisi" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Kapsam *</Label>
                  <Select value={scope} onValueChange={(v: ScopeLevel) => setScope(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Türkiye</SelectItem>
                      <SelectItem value="city">İl Geneli</SelectItem>
                      <SelectItem value="district">İlçe Geneli</SelectItem>
                      <SelectItem value="neighborhood">Mahalle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cinsiyet</Label>
                  <Select value={gender} onValueChange={(v: 'all' | 'Erkek' | 'Kadın') => setGender(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      <SelectItem value="Erkek">Erkek</SelectItem>
                      <SelectItem value="Kadın">Kadın</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>İhtiyaç Birimi (kan torbası)</Label>
                  <Input type="number" value={unitsNeeded} onChange={e => setUnitsNeeded(e.target.value)} placeholder="Ör: 5" />
                </div>
                <div className="space-y-2">
                  <Label>İletişim Telefonu</Label>
                  <Input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="0212 xxx xx xx" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>İletişim Kişisi (Ad Soyad)</Label>
                <Input
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Yanıtlayan kullanıcıya iletilecek isim"
                />
                <p className="text-[10px] text-muted-foreground">
                  Bu isim ve telefon, "Yardım edebilirim" diyen kullanıcıya otomatik bildirim olarak gönderilir.
                </p>
              </div>

              {scope !== 'all' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>İl</Label>
                    <Select value={city} onValueChange={(v) => { setCity(v); setDistrict(''); setNeighborhood(''); }}>
                      <SelectTrigger><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {(allProvinces || []).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {(scope === 'district' || scope === 'neighborhood') && (
                    <div className="space-y-2">
                      <Label>İlçe</Label>
                      <Select value={district} onValueChange={(v) => { setDistrict(v); setNeighborhood(''); }} disabled={!city}>
                        <SelectTrigger><SelectValue placeholder="İlçe seçin..." /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {districtOptions.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {scope === 'neighborhood' && (
                    <div className="space-y-2">
                      <Label>Mahalle</Label>
                      <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!district}>
                        <SelectTrigger><SelectValue placeholder="Mahalle seçin..." /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {neighborhoodOptions.map((n: string) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Açıklama / Notlar</Label>
                <Textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Acil ihtiyaç, hasta bilgisi, ulaşım detayı vb."
                  rows={3}
                />
              </div>

              {/* Eşleşme önizlemesi */}
              <Alert className="border-amber-300 bg-amber-50 rounded-2xl">
                <Users className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-900">Hedef Kitle Önizlemesi</AlertTitle>
                <AlertDescription className="text-amber-800">
                  {countLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Hedef kitle hesaplanıyor...</span>
                  ) : countError ? (
                    <span className="text-sm text-red-700">{countError}</span>
                  ) : matchCount === null ? (
                    <span className="text-sm">Kapsam (il/ilçe/mahalle) seçtikçe hedef kitle sayısı burada görünür.</span>
                  ) : (
                    <span>
                      <strong className="text-2xl text-amber-900">{matchCount.toLocaleString('tr-TR')}</strong>
                      {' '}/{' '}
                      <span className="text-sm">{(totalUsers ?? 0).toLocaleString('tr-TR')} kullanıcıya bildirim gönderilecek</span>
                      <span className="text-xs block mt-1">
                        Filtre: {bloodType ? `${bloodType} kan grubu` : 'tüm kan grupları'} • {scopeLabel[scope]}
                        {city && ` • ${city}`}{district && ` / ${district}`}{neighborhood && ` / ${neighborhood}`}
                      </span>
                      {!bloodType && (
                        <span className="text-[11px] block mt-1 italic text-amber-700">
                          İpucu: kan grubu seçerek hedef kitleyi daraltabilirsiniz.
                        </span>
                      )}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <Button
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 gap-2"
                onClick={handleSendRequest}
                disabled={isSending || !bloodType || !hospitalName.trim()}
              >
                {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {isSending ? 'Gönderiliyor...' : `${matchCount && matchCount > 0 ? `${matchCount} ` : ''}Kullanıcıya Acil Bildirim Gönder`}
              </Button>
            </CardContent>
          </Card>

          {/* Geçmiş talepler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Geçmiş Kan Talepleri</CardTitle>
              <CardDescription>Son 50 acil kan talebi.</CardDescription>
            </CardHeader>
            <CardContent>
              {requestsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !requests || requests.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Henüz acil talep gönderilmemiş.</p>
              ) : (
                <div className="space-y-3">
                  {requests.filter(r => r.type === 'blood' && r.status === 'sent').map(req => (
                    <div key={req.id} className="border rounded-xl p-4 hover:bg-muted/30 transition-colors space-y-2">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-red-600 hover:bg-red-700 text-[10px]">{req.bloodType}</Badge>
                            <p className="font-bold">{req.hospitalName}</p>
                            <Badge variant="outline" className="text-[10px]">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {req.targetCount || 0} kişiye gönderildi
                            </Badge>
                            {(() => {
                              const rc = (req as unknown as { resentCount?: number }).resentCount;
                              return typeof rc === 'number' && rc > 0 ? (
                                <Badge variant="outline" className="text-[10px] bg-amber-50 border-amber-300 text-amber-700">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  {rc}x tekrar
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {scopeLabel[req.scope as ScopeLevel] || req.scope}
                            {req.city && ` • ${req.city}`}{req.district && `/${req.district}`}{req.neighborhood && `/${req.neighborhood}`}
                          </p>
                          {req.message && <p className="text-xs text-muted-foreground mt-2 italic">&quot;{req.message}&quot;</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(req.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap pt-1 border-t mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8"
                          onClick={() => loadIntoFormForEdit(req)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Düzenle
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-8 bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                          onClick={() => handleResendNotifications(req)}
                        >
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Tekrar Bildirim Gönder
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* YANITLAR — Kullanıcı geri dönüşleri */}
        <TabsContent value="responses" className="mt-6 space-y-6">
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <MessageCircle className="h-5 w-5" /> Talebe Cevap Veren Kullanıcılar
              </CardTitle>
              <CardDescription>
                Acil kan taleplerine bildirim üzerinden yanıt veren kullanıcıları takip edin. Olumlu yanıt verenlerle iletişime geçebilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responsesLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !responses || responses.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Henüz yanıt yok</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Kullanıcılar kan talebi bildirimlerine yanıt verdiğinde burada görünecek.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Talep bazında grupla */}
                  {Array.from(new Set(responses.map(r => r.requestId))).map(reqId => {
                    const reqResponses = responses.filter(r => r.requestId === reqId);
                    const positives = reqResponses.filter(r => r.status === 'positive');
                    const negatives = reqResponses.filter(r => r.status === 'negative');
                    const sample = reqResponses[0];
                    return (
                      <div key={reqId} className="border rounded-xl overflow-hidden">
                        <div className="p-3 bg-muted/30 border-b flex items-center gap-2 flex-wrap">
                          <Badge className="bg-red-600 text-[10px]">{sample.bloodType || '?'}</Badge>
                          <p className="font-bold text-sm">{sample.hospitalName || 'Hastane'}</p>
                          <Badge variant="outline" className="text-[10px]">
                            <ThumbsUp className="h-3 w-3 mr-1 text-green-600" /> {positives.length} olumlu
                          </Badge>
                          {negatives.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              <ThumbsDown className="h-3 w-3 mr-1 text-muted-foreground" /> {negatives.length} olumsuz
                            </Badge>
                          )}
                        </div>
                        <div className="divide-y">
                          {reqResponses.map(r => {
                            const respUserId = (r as EmergencyDoc & { userId?: string }).userId;
                            const userDoc = respUserId ? usersById.get(respUserId) : undefined;
                            const pi = userDoc?.personalInfo;
                            const lookedUpName =
                              userDoc?.name ||
                              userDoc?.displayName ||
                              [pi?.firstName, pi?.lastName].filter(Boolean).join(' ').trim() ||
                              r.userName ||
                              'Kullanıcı';
                            const lookedUpEmail = userDoc?.email || r.userEmail;
                            return (
                              <div key={r.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/20">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={userDoc?.avatarUrl} alt={lookedUpName} />
                                    <AvatarFallback className="text-xs font-bold">
                                      {lookedUpName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {r.status === 'positive' ? (
                                    <div className="p-1.5 rounded-full bg-green-100 shrink-0">
                                      <ThumbsUp className="h-3.5 w-3.5 text-green-700" />
                                    </div>
                                  ) : (
                                    <div className="p-1.5 rounded-full bg-gray-100 shrink-0">
                                      <ThumbsDown className="h-3.5 w-3.5 text-gray-500" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-bold text-sm truncate">{lookedUpName}</p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                      {lookedUpEmail && (
                                        <a href={`mailto:${lookedUpEmail}`} className="flex items-center gap-1 hover:text-primary">
                                          <Mail className="h-3 w-3" /> {lookedUpEmail}
                                        </a>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(r.respondedAt)}</p>
                                  </div>
                                </div>
                                <Badge variant={r.status === 'positive' ? 'default' : 'secondary'} className={r.status === 'positive' ? 'bg-green-600 text-[10px]' : 'text-[10px]'}>
                                  {r.status === 'positive' ? 'Yardım Edebilirim' : 'Edemiyorum'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AFET BİLDİRİMLERİ */}
        <TabsContent value="disaster" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5" /> Afet Bildirimleri</CardTitle>
              <CardDescription>Deprem, sel, yangın gibi afetler için toplu bildirim sistemi.</CardDescription>
            </CardHeader>
            <CardContent className="py-12">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Yakında</AlertTitle>
                <AlertDescription>
                  Afet bildirim modülü yakında devreye alınacaktır. Kan ilanı modülünü şu an kan grubu ve konum bazlı acil bildirim için kullanabilirsiniz.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
