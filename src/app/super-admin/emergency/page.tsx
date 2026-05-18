'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Siren, Droplet, Users, Send, MapPin, Loader2, Clock, CheckCircle, AlertCircle, Info, MessageCircle, ThumbsUp, ThumbsDown, Phone, Mail, Inbox, XCircle, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, query, orderBy, limit, where, updateDoc } from 'firebase/firestore';
import { allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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
  personalInfo?: {
    bloodType?: string;
    address?: { city?: string; district?: string; neighborhood?: string };
  };
}

const scopeLabel: Record<ScopeLevel, string> = {
  all: 'Tüm Türkiye',
  city: 'İl Geneli',
  district: 'İlçe Geneli',
  neighborhood: 'Mahalle',
};

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
  const [message, setMessage] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [unitsNeeded, setUnitsNeeded] = useState('');
  const [isSending, setIsSending] = useState(false);
  const pendingApprovalIdRef = useRef<string | null>(null);

  // Tüm kullanıcılar (filtre için)
  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: allUsers, isLoading: usersLoading } = useCollection<UserDoc>(usersQuery);

  // Geçmiş talepler
  const requestsQuery = useMemoFirebase(() => {
    return query(collection(db, 'emergencyRequests'), orderBy('createdAt', 'desc'), limit(50));
  }, [db]);
  const { data: requests, isLoading: requestsLoading } = useCollection<EmergencyDoc>(requestsQuery);

  // Yanıtlar (kullanıcıların kan taleplerine verdikleri cevaplar)
  const responsesQuery = useMemoFirebase(() => {
    return query(collection(db, 'emergencyResponses'), orderBy('respondedAt', 'desc'), limit(200));
  }, [db]);
  const { data: responses, isLoading: responsesLoading } = useCollection<EmergencyDoc>(responsesQuery);

  // Kullanıcı tarafından gönderilmiş, super-admin onayı bekleyen talepler
  const pendingRequestsQuery = useMemoFirebase(() => {
    return query(collection(db, 'emergencyRequests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: pendingRequests } = useCollection<EmergencyDoc>(pendingRequestsQuery);

  // City / district options
  const districtOptions = city ? (districtsData[city] ?? []) : [];
  const neighborhoodOptions = (city && district) ? ((neighborhoodsData as Record<string, Record<string, string[]>>)[city]?.[district] ?? []) : [];

  // Eşleşen kullanıcı sayısı (anlık önizleme)
  const matchingUsers = useMemo(() => {
    if (!allUsers || !bloodType) return [];
    return allUsers.filter(u => {
      const ub = u.personalInfo?.bloodType;
      if (ub !== bloodType) return false;
      if (scope === 'all') return true;
      const ua = u.personalInfo?.address || {};
      if (scope === 'city') return ua.city === city;
      if (scope === 'district') return ua.city === city && ua.district === district;
      if (scope === 'neighborhood') return ua.city === city && ua.district === district && ua.neighborhood === neighborhood;
      return false;
    });
  }, [allUsers, bloodType, scope, city, district, neighborhood]);

  // Kullanıcı talebini forma yükle (preview & onayla)
  const loadIntoForm = (req: EmergencyDoc) => {
    setHospitalName(req.hospitalName || '');
    setHospitalAddress(req.hospitalAddress || '');
    setBloodType(req.bloodType || '');
    setMessage(req.message || '');
    setContactPhone(req.contactPhone || '');
    setUnitsNeeded(req.unitsNeeded ? String(req.unitsNeeded) : '');
    setScope((req.scope as ScopeLevel) || 'city');
    setCity(req.city || '');
    setDistrict(req.district || '');
    setNeighborhood(req.neighborhood || '');
    // Forma gönderilen kullanıcı talebinin id'sini sakla — onay sonrası güncellenecek
    pendingApprovalIdRef.current = req.id;
    setActiveTab('blood');
    toast({ title: 'Talep yüklendi', description: 'İl/ilçe/mahalle seçip "Acil Talep Gönder"e basarak yayınlayabilirsiniz.' });
    // Form bölümüne kaydır
    setTimeout(() => document.getElementById('emergency-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
  };

  // Kullanıcı talebini reddet
  const handleRejectRequest = async (reqId: string) => {
    if (!confirm('Bu talep reddedilsin mi?')) return;
    try {
      await updateDoc(doc(db, 'emergencyRequests', reqId), {
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
      // 1. Talep dokümanı oluştur
      const requestRef = await addDoc(collection(db, 'emergencyRequests'), {
        type: 'blood',
        hospitalName: hospitalName.trim(),
        hospitalAddress: hospitalAddress.trim(),
        bloodType,
        scope,
        city: city || null,
        district: district || null,
        neighborhood: neighborhood || null,
        message: message.trim(),
        contactPhone: contactPhone.trim(),
        unitsNeeded: Number(unitsNeeded) || null,
        targetCount: matchingUsers.length,
        sentBy: authUser?.uid || null,
        status: 'sent',
        createdAt: serverTimestamp(),
      });

      // 2. Eşleşen kullanıcılara bildirim yaz (batched)
      if (matchingUsers.length > 0) {
        // 500 limit per batch (Firestore limit)
        const batches: ReturnType<typeof writeBatch>[] = [];
        let current = writeBatch(db);
        let count = 0;
        for (const u of matchingUsers) {
          const notifRef = doc(collection(db, 'notifications'));
          current.set(notifRef, {
            userId: u.id,
            type: 'emergency-blood',
            title: `🩸 Acil Kan Talebi — ${bloodType}`,
            body: `${hospitalName} hastanesi için ${bloodType} kan grubuna acil ihtiyaç var.${message ? ` ${message.slice(0, 100)}` : ''}`,
            data: {
              requestId: requestRef.id,
              hospitalName,
              hospitalAddress,
              bloodType,
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

      // Eğer kullanıcı talebinden geliyorsa, orijinal kaydı 'sent' olarak işaretle
      const pendingId = pendingApprovalIdRef.current;
      if (pendingId) {
        try {
          await updateDoc(doc(db, 'emergencyRequests', pendingId), {
            status: 'sent',
            approvedAt: serverTimestamp(),
            approvedBy: authUser?.uid || null,
            broadcastRequestId: requestRef.id,
            scope,
            city: city || null,
            district: district || null,
            neighborhood: neighborhood || null,
          });
        } catch (e) {
          console.warn('Pending request update failed:', e);
        }
        pendingApprovalIdRef.current = null;
      }

      toast({
        title: '✅ Acil Talep Gönderildi',
        description: `${matchingUsers.length} kullanıcıya bildirim ulaştırıldı.`,
      });

      // Formu temizle
      setHospitalName('');
      setHospitalAddress('');
      setBloodType('');
      setCity('');
      setDistrict('');
      setNeighborhood('');
      setMessage('');
      setContactPhone('');
      setUnitsNeeded('');
      setScope('city');
    } catch (err) {
      console.error('Emergency request failed:', err);
      const code = (err as { code?: string } | null)?.code;
      const errMessage = err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Gönderilemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
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
                    <div key={req.id} className="border rounded-xl p-4 bg-background space-y-3">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label>İhtiyaç Birimi (kan torbası)</Label>
                  <Input type="number" value={unitsNeeded} onChange={e => setUnitsNeeded(e.target.value)} placeholder="Ör: 5" />
                </div>
                <div className="space-y-2">
                  <Label>İletişim Telefonu</Label>
                  <Input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="0212 xxx xx xx" />
                </div>
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
              <Alert className="border-amber-300 bg-amber-50">
                <Users className="h-4 w-4 text-amber-700" />
                <AlertTitle className="text-amber-900">Hedef Kitle Önizlemesi</AlertTitle>
                <AlertDescription className="text-amber-800">
                  {usersLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Kullanıcılar yükleniyor...</span>
                  ) : !bloodType ? (
                    <span>Kan grubu seçin — eşleşen kullanıcı sayısı burada görünecek.</span>
                  ) : (
                    <span>
                      <strong className="text-2xl text-amber-900">{matchingUsers.length}</strong> kullanıcıya bildirim gönderilecek
                      <span className="text-xs block mt-1">
                        Filtre: {bloodType} kan grubu • {scopeLabel[scope]}
                        {city && ` • ${city}`}{district && ` / ${district}`}{neighborhood && ` / ${neighborhood}`}
                      </span>
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
                {isSending ? 'Gönderiliyor...' : `${matchingUsers.length > 0 ? `${matchingUsers.length} ` : ''}Kullanıcıya Acil Bildirim Gönder`}
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
                  {requests.filter(r => r.type === 'blood').map(req => (
                    <div key={req.id} className="border rounded-xl p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-red-600 hover:bg-red-700 text-[10px]">{req.bloodType}</Badge>
                            <p className="font-bold">{req.hospitalName}</p>
                            <Badge variant="outline" className="text-[10px]">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {req.targetCount || 0} kişiye gönderildi
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <MapPin className="h-3 w-3" />
                            {scopeLabel[req.scope as ScopeLevel] || req.scope}
                            {req.city && ` • ${req.city}`}{req.district && `/${req.district}`}{req.neighborhood && `/${req.neighborhood}`}
                          </p>
                          {req.message && <p className="text-xs text-muted-foreground mt-2 italic">"{req.message}"</p>}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(req.createdAt)}</span>
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
                          {reqResponses.map(r => (
                            <div key={r.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/20">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {r.status === 'positive' ? (
                                  <div className="p-2 rounded-full bg-green-100 shrink-0">
                                    <ThumbsUp className="h-4 w-4 text-green-700" />
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-full bg-gray-100 shrink-0">
                                    <ThumbsDown className="h-4 w-4 text-gray-500" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-sm truncate">{r.userName || 'Kullanıcı'}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                                    {r.userEmail && (
                                      <a href={`mailto:${r.userEmail}`} className="flex items-center gap-1 hover:text-primary">
                                        <Mail className="h-3 w-3" /> {r.userEmail}
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
                          ))}
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
