'use client';

/**
 * /ngo-admin/call-center/call/[contactId]
 *
 * Aktif arama paneli (Faz 2 mock). Üç kolon:
 *  - SOL  : kişi bilgi kartı + geçmiş arama özeti + custom fields
 *  - ORTA : dial / sonlandır / saniye sayacı
 *  - SAĞ  : not, disposition (sonuç), callback planlama
 *
 * KVKK: yalnızca metadata; recording byte burada tutulmaz. Faz 3'te
 * gerçek session id originate API'sinden gelecek.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Phone,
  PhoneOff,
  Loader2,
  Mail,
  User2,
  Clock,
  CalendarIcon,
  StickyNote,
  CheckCircle2,
  Mic,
  MicOff,
  PhoneIncoming,
  MessageCircle,
  Send,
  Rocket,
  SkipForward,
  Sparkles,
  TrendingUp,
  History,
  UserCheck,
  UserPlus,
  Star,
} from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';
import { DEFAULT_STAGES as PIPELINE_STAGES, STAGE_TONE_CLASS } from '@/lib/santral/pipeline';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSipPhone } from '@/lib/santral/use-sip-phone';
import { useSantralCredentials } from '@/lib/santral/use-credentials';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useUser } from '@/firebase';

interface ContactDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastDisposition: string | null;
  lastAttemptAt: string | null;
  stage: string | null;
  pledgeAmount: number | null;
  assignedToUid: string | null;
  assignedToName: string | null;
  customFields: Record<string, unknown>;
}

interface SessionRow {
  id: string;
  direction: string;
  status: string | null;
  outcome: string | null;
  duration: number;
  startedAt: string | null;
  endedAt: string | null;
}

interface ContactResponse {
  contact: ContactDetail;
  sessions: SessionRow[];
}

interface NoteRow {
  id: string;
  agentName: string | null;
  text: string;
  timestamp: number | null;
}

interface WhatsAppMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  body: string | null;
  templateName: string | null;
  mediaUrl: string | null;
  status: string | null;
  failureReason: string | null;
  timestamp: string | null;
}

interface WhatsAppHistoryResponse {
  conversation: {
    id: string;
    lastMessageAt: string | null;
    conversationWindowExpiresAt: string | null;
  } | null;
  messages: WhatsAppMessage[];
}

interface WhatsAppTemplateRow {
  id: string;
  name: string;
  language: string;
  bodyText: string;
  variables: string[];
  status: string;
}

interface TimelineItem {
  type: 'call' | 'note' | 'whatsapp' | 'stage';
  at: string | null;
  title: string;
  detail: string | null;
}

type CallState = 'idle' | 'ringing' | 'in-progress' | 'ended';

const DISPOSITIONS: { value: string; label: string }[] = [
  { value: 'answered', label: 'Görüşüldü' },
  { value: 'no-answer', label: 'Cevapsız' },
  { value: 'busy', label: 'Meşgul' },
  { value: 'rejected', label: 'Reddetti' },
  { value: 'voicemail', label: 'Sesli mesaj' },
  { value: 'wrong-number', label: 'Yanlış numara' },
  { value: 'callback-requested', label: 'Geri ara' },
];

const DISPOSITION_LABEL: Record<string, string> = DISPOSITIONS.reduce(
  (acc, d) => ({ ...acc, [d.value]: d.label }),
  {},
);

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatNoteTime(ms: number | null): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatWhatsAppTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function extractTemplateVariableNames(body: string): string[] {
  const matches = body.match(/\{\{([^}]+)\}\}/g) ?? [];
  return matches.map((m) => m.replace(/[{}]/g, '').trim()).filter(Boolean);
}

export default function ActiveCallPage() {
  const params = useParams<{ contactId: string }>();
  const contactId = params?.contactId ?? '';
  const { toast } = useToast();
  const router = useRouter();
  // Kampanya (peş peşe arama) modu: ?campaign=<listId> ile açılır.
  // Not: useSearchParams yerine window.location.search kullanılıyor — Next 15'te
  // Suspense'siz useSearchParams prod'da sayfayı bozabiliyor (bkz. b22bfe42).
  const [campaignListId, setCampaignListId] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCampaignListId(new URLSearchParams(window.location.search).get('campaign') || '');
    }
  }, []);
  const [campaignRemaining, setCampaignRemaining] = useState<number | null>(null);
  const [loadingNext, setLoadingNext] = useState(false);
  // AI çağrı özeti
  const [aiSummary, setAiSummary] = useState<{ summary: string; nextStep: string; sentiment: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Bağış hunisi aşaması + söz verilen tutar
  const [stage, setStage] = useState<string>('');
  const [pledgeAmount, setPledgeAmount] = useState<string>('');
  const [savingStage, setSavingStage] = useState(false);
  // Zaman tüneli
  const [timeline, setTimeline] = useState<TimelineItem[] | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  // Görev atama (ekip)
  const [team, setTeam] = useState<{ userId: string; name: string }[]>([]);
  const [assignedName, setAssignedName] = useState<string | null>(null);
  // Konuşma anında AI asistanı
  const [assist, setAssist] = useState<{ opener: string; tips: string[]; objections: { objection: string; response: string }[] } | null>(null);
  const [assistLoading, setAssistLoading] = useState(false);

  // Aktif kurum — STK ise originate'e hedef ngoId olarak gönderilir
  // (super-admin başka STK'ya bakıyorsa doğru tenant'ta session açılsın).
  const activeEntity = useActiveEntity();
  const { withEntityHeaders } = activeEntity;
  const activeNgoId = activeEntity.kind === 'ngo' ? activeEntity.id : null;

  // Gelen-arama gate'i için current uid.
  const { user } = useUser();
  const selfUid = user?.uid ?? null;

  // --- WebRTC santral entegrasyonu ---------------------------------------
  // SIP/TURN credential'ları auth korumalı endpoint'ten gelir; tenant-özel
  // sipUsername fallback'i sunucuda çözülür (bundle'da YOK). Credential eksik/
  // yüklenirken useSipPhone pasif kalır ve panel mock akışına düşer.
  const { creds } = useSantralCredentials();

  // Gelen arama callSessions id'sini sessionId state'ine yazmak için köprü ref —
  // setSessionId aşağıda (hook'tan sonra) tanımlandığı için ref üzerinden bağlanır.
  const applyInboundSessionRef = useRef<((id: string) => void) | null>(null);

  const sip = useSipPhone({
    wssUrl: creds?.wssUrl || null,
    username: creds?.sipUsername || null,
    password: creds?.sipPassword || null,
    domain: creds?.sipDomain || null,
    iceServers: creds?.iceServers,
    // Bu sayfa ngoCallCenter doc'unu okumadığı için atanmış-kişi gate'i pasif
    // (null) → "herkes çalar" varsayılanı korunur.
    inboundAgentUid: null,
    selfUid,
    // Gelen arama çalınca callSessions doc'u oluştur; not/disposition bu
    // gerçek session id'sine bağlansın (geçmiş/KPI dolsun).
    onInbound: (callerNumber) => {
      void messagingFetch<{ ok: boolean; callSessionId: string }>(
        '/api/ngo-admin/calls/originate',
        {
          method: 'POST',
          body: JSON.stringify({
            contactPhone: callerNumber,
            ngoId: activeNgoId ?? undefined,
            direction: 'inbound',
          }),
        },
      )
        .then((res) => applyInboundSessionRef.current?.(res.callSessionId))
        .catch(() => undefined);
    },
  });
  // Gerçek arama yalnızca credential tam olduğunda aktif.
  const sipEnabled = sip.ready;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  // Çağrı durumu (mock — Faz 3'te API'den gelir)
  const [callState, setCallState] = useState<CallState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // onInbound (yukarıda, hook config'inde) gelen arama session id'sini buradan yazar.
  applyInboundSessionRef.current = (id: string) => setSessionId(id);

  // Notlar
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [noteTemplates, setNoteTemplates] = useState<string[]>([]);
  const [savingNote, setSavingNote] = useState(false);

  // Disposition
  const [disposition, setDisposition] = useState<string>('');
  const [savingDisposition, setSavingDisposition] = useState(false);

  // Callback
  const [callbackDate, setCallbackDate] = useState<Date | undefined>(undefined);
  const [callbackTime, setCallbackTime] = useState('14:00');
  const [callbackReason, setCallbackReason] = useState('');
  const [savingCallback, setSavingCallback] = useState(false);

  // WhatsApp entegrasyonu
  const [waLoading, setWaLoading] = useState(false);
  const [waMessages, setWaMessages] = useState<WhatsAppMessage[]>([]);
  const [waError, setWaError] = useState<string | null>(null);
  const [waTemplates, setWaTemplates] = useState<WhatsAppTemplateRow[]>([]);
  const [waTemplatesLoading, setWaTemplatesLoading] = useState(false);
  const [waSelectedTemplateId, setWaSelectedTemplateId] = useState<string>('');
  const [waVariableValues, setWaVariableValues] = useState<Record<string, string>>({});
  const [waSending, setWaSending] = useState(false);
  const [waTab, setWaTab] = useState<'history' | 'send'>('history');

  const loadContact = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await messagingFetch<ContactResponse>(
        `/api/ngo-admin/call-center/contacts/${contactId}`,
        { method: 'GET' },
      );
      setContact(res.contact);
      setSessions(res.sessions ?? []);
      setStage(res.contact.stage ?? '');
      setPledgeAmount(res.contact.pledgeAmount ? String(res.contact.pledgeAmount) : '');
      setAssignedName(res.contact.assignedToName ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void loadContact();
  }, [loadContact]);


  // Hazır not şablonlarını bir kez çek (operatör çağrı sırasında seçer).
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/ngo-admin/call-center/note-templates', withEntityHeaders({ headers: { authorization: `Bearer ${token}` } }));
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.templates)) setNoteTemplates(data.templates);
      } catch { /* şablon yoksa çipler görünmez */ }
    })();
    return () => { active = false; };
  }, [user]);

  const loadWhatsAppHistory = useCallback(async () => {
    if (!contactId) return;
    setWaLoading(true);
    setWaError(null);
    try {
      const res = await messagingFetch<WhatsAppHistoryResponse>(
        `/api/ngo-admin/call-center/contacts/${contactId}/whatsapp-history`,
        { method: 'GET' },
      );
      // En eski üstte gösterilsin diye ters çevir (API desc döner).
      setWaMessages([...(res.messages ?? [])].reverse());
    } catch (err) {
      setWaError(err instanceof Error ? err.message : 'Geçmiş alınamadı.');
      setWaMessages([]);
    } finally {
      setWaLoading(false);
    }
  }, [contactId]);

  const loadWhatsAppTemplates = useCallback(async () => {
    setWaTemplatesLoading(true);
    try {
      const res = await messagingFetch<{ templates: WhatsAppTemplateRow[] }>(
        `/api/ngo-admin/whatsapp-business/templates?status=approved`,
        { method: 'GET' },
      );
      setWaTemplates(res.templates ?? []);
    } catch {
      setWaTemplates([]);
    } finally {
      setWaTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWhatsAppHistory();
    void loadWhatsAppTemplates();
  }, [loadWhatsAppHistory, loadWhatsAppTemplates]);

  // Şablon değişince kişi adını otomatik doldur (varsa).
  const selectedWaTemplate = useMemo(
    () => waTemplates.find((t) => t.id === waSelectedTemplateId) ?? null,
    [waTemplates, waSelectedTemplateId],
  );

  useEffect(() => {
    if (!selectedWaTemplate) {
      setWaVariableValues({});
      return;
    }
    // Şablon tanımındaki variables boşsa body içinden {{...}} çek.
    const declared = selectedWaTemplate.variables.length
      ? selectedWaTemplate.variables
      : extractTemplateVariableNames(selectedWaTemplate.bodyText);
    const next: Record<string, string> = {};
    for (const name of declared) {
      const lower = name.toLowerCase();
      if (
        (lower.includes('ad') || lower.includes('isim') || lower === 'name') &&
        contact?.name
      ) {
        next[name] = contact.name;
      } else {
        next[name] = '';
      }
    }
    setWaVariableValues(next);
  }, [selectedWaTemplate, contact?.name]);

  async function handleSendWhatsApp() {
    if (!waSelectedTemplateId) {
      toast({ variant: 'destructive', title: 'Şablon seçin' });
      return;
    }
    setWaSending(true);
    try {
      await messagingFetch(
        `/api/ngo-admin/call-center/contacts/${contactId}/whatsapp-send`,
        {
          method: 'POST',
          body: JSON.stringify({
            templateId: waSelectedTemplateId,
            variables: waVariableValues,
          }),
        },
      );
      toast({ title: 'WhatsApp mesajı gönderildi' });
      setWaTab('history');
      await loadWhatsAppHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gönderim başarısız.';
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: msg });
    } finally {
      setWaSending(false);
    }
  }

  // Saniye sayacı — mock modda in-progress boyunca işler. SIP modda süre
  // gerçek session'dan (sip.durationSeconds) gelir, bu sayaç çalışmaz.
  useEffect(() => {
    if (!sipEnabled && callState === 'in-progress') {
      tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
    return undefined;
  }, [callState, sipEnabled]);

  // SIP session state → panel callState + süre. Yalnızca gerçek arama aktifken.
  useEffect(() => {
    if (!sipEnabled) return;
    switch (sip.state) {
      case 'calling':
        setCallState('ringing');
        break;
      case 'incoming':
        // Gelen arama: oturum id ata (yoksa) ve ringing göster.
        setSessionId((cur) => cur ?? `call-${contactId}-${Date.now()}`);
        setCallState('ringing');
        break;
      case 'in-call':
        setCallState('in-progress');
        setSeconds(sip.durationSeconds);
        break;
      case 'ended':
      case 'failed':
        setCallState((cur) => (cur === 'idle' ? 'idle' : 'ended'));
        break;
      default:
        break;
    }
  }, [sipEnabled, sip.state, sip.durationSeconds, contactId]);

  // Notları yükle (mock session id de olsa boş array gelir; gerçek session'da API döner)
  const loadNotes = useCallback(async (sid: string) => {
    try {
      const res = await messagingFetch<{ notes: NoteRow[] }>(
        `/api/ngo-admin/call-center/sessions/${sid}/notes`,
        { method: 'GET' },
      );
      setNotes(res.notes ?? []);
    } catch {
      // Mock session için API 404 döner — sessizce yut.
      setNotes([]);
    }
  }, []);

  async function handleStartCall() {
    if (!contact) return;
    setSeconds(0);
    setNotes([]);
    setDisposition('');

    // GERÇEK arama: env + credential tam → SIP.js ile geçide bağlan.
    if (sipEnabled) {
      setCallState('ringing');
      // Önce callSessions doc'unu originate API'sinden oluştur ki not/disposition
      // gerçek session id'sine yazılsın (dashboard geçmiş/KPI dolsun).
      try {
        const res = await messagingFetch<{ ok: boolean; callSessionId: string }>(
          '/api/ngo-admin/calls/originate',
          {
            method: 'POST',
            body: JSON.stringify({
              contactPhone: contact.phone,
              contactId,
              ...(activeNgoId ? { ngoId: activeNgoId } : {}),
            }),
          },
        );
        setSessionId(res.callSessionId);
      } catch {
        // Originate başarısızsa not/disposition pasif kalır; arama yine başlasın.
        setSessionId(null);
      }
      void sip.call(contact.phone).catch(() => undefined);
      return;
    }

    // GATE kapalı (env/credential yok) → mevcut mock akışı korunur.
    setSessionId(`mock-${contactId}-${Date.now()}`);
    setCallState('ringing');
    setTimeout(() => {
      setCallState((cur) => (cur === 'ringing' ? 'in-progress' : cur));
    }, 1500);
    toast({
      title: 'Mock arama başlatıldı',
      description: 'Santral altyapısı henüz hazır değil; gerçek arama pasif.',
    });
  }

  function handleEndCall() {
    if (sipEnabled) {
      void sip.hangup().catch(() => undefined);
      // SIP 'Terminated' state'i callState'i 'ended'e çekecek; yine de UI'yı
      // anında güncelle.
    }
    setCallState('ended');
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function handleAnswer() {
    await sip.answer().catch(() => undefined);
  }

  async function handleAddNote() {
    if (!noteDraft.trim() || !sessionId) return;
    setSavingNote(true);
    try {
      await messagingFetch(
        `/api/ngo-admin/call-center/sessions/${sessionId}/notes`,
        {
          method: 'POST',
          body: JSON.stringify({ text: noteDraft.trim() }),
        },
      );
      toast({ title: 'Not eklendi' });
      setNoteDraft('');
      await loadNotes(sessionId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Mock session için API 404 verir → local'e ekle
      setNotes((prev) => [
        {
          id: `local-${Date.now()}`,
          agentName: 'Siz',
          text: noteDraft.trim(),
          timestamp: Date.now(),
        },
        ...prev,
      ]);
      setNoteDraft('');
      toast({
        title: 'Not yerel olarak eklendi',
        description: 'Mock oturum; gerçek aramada Firestore\'a yazılır.',
      });
      // İhtimal: hata gerçek bir API hatasıydı
      if (!sessionId.startsWith('mock-')) {
        toast({ variant: 'destructive', title: 'Not kaydedilemedi', description: msg });
      }
    } finally {
      setSavingNote(false);
    }
  }

  async function handleSaveDisposition() {
    if (!disposition || !sessionId) {
      toast({ variant: 'destructive', title: 'Önce sonuç seçin' });
      return;
    }
    setSavingDisposition(true);
    try {
      await messagingFetch(
        `/api/ngo-admin/call-center/sessions/${sessionId}/disposition`,
        {
          method: 'POST',
          body: JSON.stringify({ disposition }),
        },
      );
      toast({ title: 'Sonuç kaydedildi' });
      await loadContact();
      // Kampanya modunda sonuç girilir girilmez kalan kişi sayısını tazele.
      if (campaignListId) void refreshCampaignRemaining();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (sessionId.startsWith('mock-')) {
        toast({
          title: 'Mock sonuç kaydedildi',
          description: 'Gerçek aramada Firestore\'a yazılır.',
        });
      } else {
        toast({ variant: 'destructive', title: 'Sonuç kaydedilemedi', description: msg });
      }
    } finally {
      setSavingDisposition(false);
    }
  }

  // Kampanya modu: listedeki sıradaki aranacak kişiye geç (bu kişi hariç).
  const refreshCampaignRemaining = useCallback(async () => {
    if (!campaignListId) return;
    try {
      const res = await messagingFetch<{ contact: { id: string } | null; remaining: number }>(
        `/api/ngo-admin/call-center/campaign/next?listId=${encodeURIComponent(campaignListId)}&exclude=${encodeURIComponent(contactId)}`,
      );
      setCampaignRemaining(res.remaining);
    } catch {
      setCampaignRemaining(null);
    }
  }, [campaignListId, contactId]);

  // Kampanya modu açıldıysa kalan kişi sayısını başlangıçta çek (tanımdan SONRA — TDZ yok).
  useEffect(() => {
    if (campaignListId) void refreshCampaignRemaining();
  }, [campaignListId, refreshCampaignRemaining]);

  // Ekip listesini (görev atama için) yükle.
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/ngo-admin/users/managers', withEntityHeaders({ headers: { authorization: `Bearer ${token}` } }));
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.managers)) {
          setTeam(data.managers.map((m: { userId: string; name: string }) => ({ userId: m.userId, name: m.name })));
        }
      } catch { /* ekip yoksa atama menüsü sadece 'kaldır' gösterir */ }
    })();
    return () => { active = false; };
  }, [user]);

  async function handleAssign(member: { userId: string; name: string } | null) {
    if (!contactId) return;
    setAssignedName(member?.name ?? null);
    try {
      await messagingFetch(`/api/ngo-admin/call-center/contacts/${contactId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assignedToUid: member?.userId ?? null, assignedToName: member?.name }),
      });
      toast({ title: member ? `Sorumlu: ${member.name}` : 'Sorumlu kaldırıldı' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Atanamadı', description: msg });
    }
  }

  async function handleSaveStage(nextStage: string) {
    if (!contactId || !nextStage) return;
    setStage(nextStage);
    setSavingStage(true);
    try {
      const amount = pledgeAmount.trim() ? Number(pledgeAmount.replace(/[^\d]/g, '')) : undefined;
      await messagingFetch(`/api/ngo-admin/call-center/contacts/${contactId}/stage`, {
        method: 'POST',
        body: JSON.stringify({ stage: nextStage, pledgeAmount: amount }),
      });
      toast({ title: 'Aşama güncellendi' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Aşama kaydedilemedi', description: msg });
    } finally {
      setSavingStage(false);
    }
  }

  async function handleAssist() {
    if (!contactId) return;
    setAssistLoading(true);
    try {
      const res = await messagingFetch<{ opener: string; tips: string[]; objections: { objection: string; response: string }[] }>(
        `/api/ngo-admin/call-center/contacts/${contactId}/assist`,
        { method: 'POST', body: JSON.stringify({ goal: 'bağış' }) },
      );
      setAssist({ opener: res.opener, tips: res.tips || [], objections: res.objections || [] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'İpuçları alınamadı', description: msg });
    } finally {
      setAssistLoading(false);
    }
  }

  function copySurveyLink() {
    if (!sessionId || typeof window === 'undefined') return;
    const url = `${window.location.origin}/anket/${sessionId}`;
    navigator.clipboard?.writeText(url).then(
      () => toast({ title: 'Anket linki kopyalandı', description: 'WhatsApp/SMS ile arayana gönderebilirsiniz.' }),
      () => toast({ variant: 'destructive', title: 'Kopyalanamadı', description: url }),
    );
  }

  async function handleLoadTimeline() {
    if (!contactId) return;
    setTimelineLoading(true);
    try {
      const res = await messagingFetch<{ items: TimelineItem[] }>(
        `/api/ngo-admin/call-center/contacts/${contactId}/timeline`,
      );
      setTimeline(res.items || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Zaman tüneli yüklenemedi', description: msg });
    } finally {
      setTimelineLoading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!contactId) return;
    setAiLoading(true);
    setAiSummary(null);
    try {
      const res = await messagingFetch<{ ok: boolean; summary: string; nextStep: string; sentiment: string }>(
        `/api/ngo-admin/call-center/contacts/${contactId}/summary`,
        { method: 'POST', body: JSON.stringify({}) },
      );
      setAiSummary({ summary: res.summary, nextStep: res.nextStep, sentiment: res.sentiment });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Özet üretilemedi', description: msg });
    } finally {
      setAiLoading(false);
    }
  }

  async function goToNextInCampaign() {
    if (!campaignListId) return;
    setLoadingNext(true);
    try {
      const res = await messagingFetch<{ contact: { id: string } | null; remaining: number }>(
        `/api/ngo-admin/call-center/campaign/next?listId=${encodeURIComponent(campaignListId)}&exclude=${encodeURIComponent(contactId)}`,
      );
      if (res.contact) {
        router.push(`/ngo-admin/call-center/call/${res.contact.id}?campaign=${encodeURIComponent(campaignListId)}`);
      } else {
        toast({ title: 'Kampanya tamamlandı 🎉', description: 'Listede aranacak kişi kalmadı.' });
        setCampaignRemaining(0);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Sıradaki kişi alınamadı', description: msg });
    } finally {
      setLoadingNext(false);
    }
  }

  function applyPresetCallback(preset: 'one-hour' | 'tomorrow') {
    const d = new Date();
    if (preset === 'one-hour') {
      d.setHours(d.getHours() + 1);
      setCallbackDate(d);
      setCallbackTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
    } else {
      d.setDate(d.getDate() + 1);
      setCallbackDate(d);
      setCallbackTime('14:00');
    }
  }

  async function handleSaveCallback() {
    if (!callbackDate) {
      toast({ variant: 'destructive', title: 'Tarih seçin' });
      return;
    }
    const [hh, mm] = callbackTime.split(':').map((v) => parseInt(v, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) {
      toast({ variant: 'destructive', title: 'Saat geçersiz' });
      return;
    }
    const scheduled = new Date(callbackDate);
    scheduled.setHours(hh, mm, 0, 0);
    if (scheduled.getTime() < Date.now()) {
      toast({ variant: 'destructive', title: 'Geçmiş tarih seçilemez' });
      return;
    }
    setSavingCallback(true);
    try {
      await messagingFetch('/api/ngo-admin/call-center/callbacks', {
        method: 'POST',
        body: JSON.stringify({
          contactId,
          scheduledAt: scheduled.toISOString(),
          reason: callbackReason.trim() || undefined,
        }),
      });
      toast({ title: 'Geri arama planlandı' });
      setCallbackReason('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Planlanamadı', description: msg });
    } finally {
      setSavingCallback(false);
    }
  }

  const callActive = callState === 'ringing' || callState === 'in-progress';
  // SIP modunda süre gerçek session'dan; mock modda local sayaçtan.
  const displaySeconds = sipEnabled ? sip.durationSeconds : seconds;
  const customFieldEntries = useMemo(() => {
    if (!contact?.customFields) return [];
    return Object.entries(contact.customFields).filter(([, v]) => v !== undefined && v !== null && v !== '');
  }, [contact]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError || !contact) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-4">
        <Link
          href="/ngo-admin/call-center"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Çağrı Merkezi
        </Link>
        <Card className="border-rose-300 bg-rose-50/40">
          <CardHeader>
            <CardTitle className="text-base">Kişi yüklenemedi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{loadError ?? 'Kayıt bulunamadı.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-4">
      <Link
        href="/ngo-admin/call-center"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Çağrı Merkezi
      </Link>

      <div className="grid gap-4 md:grid-cols-3">
        {/* SOL — Kişi bilgi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User2 className="h-4 w-4 text-emerald-600" /> Kişi Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold leading-tight">{contact.name}</div>
              <div className="font-mono text-lg mt-1">{contact.phone}</div>
              {contact.email && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="h-3 w-3" /> {contact.email}
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Geçmiş arama:</span>
                <span className="font-medium">{contact.attempts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Son durum:</span>
                <span className="font-medium">
                  {contact.lastDisposition
                    ? DISPOSITION_LABEL[contact.lastDisposition] ?? contact.lastDisposition
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Son arama:</span>
                <span className="font-medium">{formatDateTime(contact.lastAttemptAt)}</span>
              </div>
            </div>

            {customFieldEntries.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Özel Alanlar
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {customFieldEntries.map(([k, v]) => (
                        <tr key={k} className="border-b last:border-0">
                          <td className="py-1 text-muted-foreground pr-2">{k}</td>
                          <td className="py-1 font-medium break-all">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {sessions.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Son Aramalar
                </div>
                <ul className="space-y-1 text-xs">
                  {sessions.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span>{formatDateTime(s.startedAt)}</span>
                      <span className="text-muted-foreground">
                        {s.outcome ? DISPOSITION_LABEL[s.outcome] ?? s.outcome : s.status ?? '—'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* AI çağrı özeti — notlar + sonuçlardan Gemini ile kısa özet */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Özeti
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 rounded-lg text-xs px-2"
                  onClick={handleGenerateSummary}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  {aiSummary ? 'Yenile' : 'Özetle'}
                </Button>
              </div>
              {aiSummary ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2 text-sm">
                  <p className="leading-snug">{aiSummary.summary}</p>
                  <p className="text-xs"><span className="font-semibold">Sonraki adım:</span> {aiSummary.nextStep}</p>
                  <span className={cn(
                    'inline-block text-[11px] font-medium px-2 py-0.5 rounded-full',
                    aiSummary.sentiment === 'olumlu' ? 'bg-emerald-500/15 text-emerald-700'
                      : aiSummary.sentiment === 'olumsuz' ? 'bg-rose-500/15 text-rose-700'
                      : 'bg-muted text-muted-foreground',
                  )}>
                    {aiSummary.sentiment}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Notlar ve çağrı sonuçlarından kısa bir özet ve sonraki adım önerisi üretir.</p>
              )}
            </div>

            {/* Zaman tüneli — aramalar + WhatsApp + notlar + aşama değişimleri */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-primary" /> Zaman Tüneli
                </div>
                <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs px-2" onClick={handleLoadTimeline} disabled={timelineLoading}>
                  {timelineLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <History className="h-3.5 w-3.5 mr-1" />}
                  {timeline ? 'Yenile' : 'Göster'}
                </Button>
              </div>
              {timeline === null ? (
                <p className="text-xs text-muted-foreground">Kişinin tüm geçmişi (arama, WhatsApp, not, aşama) tek akışta.</p>
              ) : timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">Henüz kayıt yok.</p>
              ) : (
                <ol className="space-y-2.5 relative border-l border-border/60 pl-3 ml-1">
                  {timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span className={cn(
                        'absolute -left-[17px] top-1 h-2.5 w-2.5 rounded-full ring-2 ring-background',
                        t.type === 'call' ? 'bg-emerald-500'
                          : t.type === 'whatsapp' ? 'bg-green-600'
                          : t.type === 'stage' ? 'bg-primary'
                          : 'bg-sky-500',
                      )} />
                      <p className="text-xs font-medium leading-tight">{t.title}</p>
                      {t.detail && <p className="text-[11px] text-muted-foreground line-clamp-2">{t.detail}</p>}
                      {t.at && <p className="text-[10px] text-muted-foreground/70">{formatDateTime(t.at)}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ORTA — Arama kontrol */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" /> Arama Kontrol
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Remote ses — SIP modunda karşı tarafın sesi buradan çalar. */}
            <audio ref={sip.remoteAudioRef} autoPlay className="hidden" />

            {/* Gelen arama bandı — yalnızca SIP modunda. */}
            {sipEnabled && sip.state === 'incoming' && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-800">
                  <PhoneIncoming className="h-4 w-4 animate-pulse" />
                  Gelen arama: {sip.remoteIdentity ?? 'Bilinmeyen'}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => void handleAnswer()}
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Phone className="h-4 w-4 mr-1" /> Cevapla
                  </Button>
                  <Button onClick={handleEndCall} size="sm" variant="destructive" className="flex-1">
                    <PhoneOff className="h-4 w-4 mr-1" /> Reddet
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center py-6 space-y-4">
              {callState === 'idle' && (
                <>
                  <Button
                    onClick={() => void handleStartCall()}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-24 w-24 rounded-full text-base flex flex-col items-center justify-center gap-1"
                  >
                    <Phone className="h-8 w-8" />
                    <span>ARA</span>
                  </Button>
                  {sipEnabled ? (
                    <p className="text-xs text-muted-foreground text-center">
                      Tarayıcıdan gerçek arama — santral geçidine bağlı.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center">
                      Santral altyapısı henüz hazır değil; arama demo (mock) modunda.
                    </p>
                  )}
                </>
              )}

              {callState === 'ringing' && (
                <>
                  <div className="h-24 w-24 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                    <Phone className="h-10 w-10 text-amber-600" />
                  </div>
                  <div className="text-sm font-medium text-amber-700">Çağrı yapılıyor...</div>
                </>
              )}

              {callState === 'in-progress' && (
                <>
                  <div className="h-24 w-24 rounded-full bg-violet-100 flex items-center justify-center">
                    <Phone className="h-10 w-10 text-violet-600" />
                  </div>
                  <div className="text-sm font-medium text-violet-700">Görüşülüyor</div>
                  <div className="font-mono text-3xl tabular-nums">{formatDuration(displaySeconds)}</div>
                </>
              )}

              {callState === 'ended' && (
                <>
                  <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-slate-500" />
                  </div>
                  <div className="text-sm font-medium text-slate-600">Görüşme sonlandı</div>
                  <div className="font-mono text-xl tabular-nums text-muted-foreground">
                    {formatDuration(displaySeconds)}
                  </div>
                </>
              )}
            </div>

            {callActive && (
              <div className="space-y-2">
                {sipEnabled && callState === 'in-progress' && (
                  <Button
                    onClick={sip.mute}
                    variant={sip.muted ? 'secondary' : 'outline'}
                    className="w-full"
                  >
                    {sip.muted ? (
                      <><MicOff className="h-4 w-4 mr-2" /> Mikrofon kapalı</>
                    ) : (
                      <><Mic className="h-4 w-4 mr-2" /> Mikrofonu kapat</>
                    )}
                  </Button>
                )}
                <Button onClick={handleEndCall} variant="destructive" className="w-full">
                  <PhoneOff className="h-4 w-4 mr-2" /> Sonlandır
                </Button>
              </div>
            )}

            {callState === 'ended' && (
              <Button onClick={() => void handleStartCall()} variant="outline" className="w-full">
                <Phone className="h-4 w-4 mr-2" /> Tekrar Ara
              </Button>
            )}

            {sipEnabled && sip.state === 'failed' && sip.error && (
              <div className="text-xs text-rose-600 border-t pt-3">
                Santral hatası: {sip.error}
              </div>
            )}

            {/* Konuşma anında AI asistanı */}
            <div className="border-t pt-3 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> AI Asistan
                </span>
                <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs px-2" onClick={handleAssist} disabled={assistLoading}>
                  {assistLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                  {assist ? 'Yenile' : 'İpucu al'}
                </Button>
              </div>
              {assist ? (
                <div className="space-y-2.5 text-left">
                  {assist.opener && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                      <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">Açılış</p>
                      <p className="text-sm">{assist.opener}</p>
                    </div>
                  )}
                  {assist.tips.length > 0 && (
                    <ul className="space-y-1">
                      {assist.tips.map((t, i) => (
                        <li key={i} className="text-xs flex gap-1.5"><span className="text-primary">•</span><span>{t}</span></li>
                      ))}
                    </ul>
                  )}
                  {assist.objections.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-muted-foreground">Olası itirazlar</p>
                      {assist.objections.map((o, i) => (
                        <div key={i} className="rounded-lg border border-border/50 bg-muted/20 p-2">
                          <p className="text-xs font-medium">“{o.objection}”</p>
                          <p className="text-xs text-muted-foreground mt-0.5">→ {o.response}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Aramadan önce kişiye özel açılış cümlesi + ikna ipuçları + itiraz yanıtları alın.</p>
              )}
            </div>

            {sessionId && (
              <div className="text-xs text-muted-foreground border-t pt-3 break-all">
                <span className="font-semibold">Oturum:</span> {sessionId}
              </div>
            )}
          </CardContent>
        </Card>

        {/* SAĞ — Not / Disposition / Callback */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-emerald-600" /> Notlar & Sonuç
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Notlar */}
            <div className="space-y-2">
              <Label htmlFor="note-text" className="text-sm font-semibold">
                Not Ekle
              </Label>
              {/* Hazır not şablonları — tıklayınca not alanına eklenir (zaman kazandırır). */}
              {noteTemplates.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {noteTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNoteDraft((prev) => (prev ? prev + ' ' + tpl : tpl))}
                      className="text-xs rounded-full border border-border bg-muted/40 px-2.5 py-1 hover:bg-accent transition-colors"
                    >
                      {tpl.length > 28 ? tpl.slice(0, 27) + '…' : tpl}
                    </button>
                  ))}
                </div>
              )}
              <Textarea
                id="note-text"
                rows={3}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Görüşme sırasında alınan not..."
                disabled={!sessionId || savingNote}
              />
              <Button
                onClick={handleAddNote}
                disabled={!sessionId || savingNote || !noteDraft.trim()}
                size="sm"
                className="w-full"
              >
                {savingNote && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Not Ekle
              </Button>
              {notes.length > 0 && (
                <ul className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 mt-2">
                  {notes.map((n) => (
                    <li key={n.id} className="text-xs border-b last:border-0 pb-1 last:pb-0">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{n.agentName ?? 'Agent'}</span>
                        <span>{formatNoteTime(n.timestamp)}</span>
                      </div>
                      <div className="mt-0.5">{n.text}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Görev atama — bu kişiden sorumlu temsilci */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-primary" /> Sorumlu
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between rounded-lg">
                    {assignedName || 'Sorumlu ata'}
                    <UserPlus className="h-4 w-4 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {team.length === 0 ? (
                    <DropdownMenuItem disabled>Ekip üyesi yok</DropdownMenuItem>
                  ) : team.map((m) => (
                    <DropdownMenuItem key={m.userId} onClick={() => handleAssign(m)}>
                      <UserPlus className="mr-2 h-4 w-4" /> {m.name}
                    </DropdownMenuItem>
                  ))}
                  {assignedName && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleAssign(null)}>Sorumluyu kaldır</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bağış hunisi aşaması + söz verilen tutar */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" /> Aşama
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE_STAGES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={savingStage}
                    onClick={() => handleSaveStage(s.key)}
                    className={cn(
                      'text-xs font-medium px-2.5 py-1 rounded-full transition-all border',
                      stage === s.key
                        ? `${STAGE_TONE_CLASS[s.tone]} border-current`
                        : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {/* Söz verilen tutar — 'söz verdi' veya 'bağış yaptı' aşamasında anlamlı */}
              {(stage === 'promised' || stage === 'donated') && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={pledgeAmount}
                      onChange={(e) => setPledgeAmount(e.target.value.replace(/[^\d]/g, ''))}
                      placeholder="Söz verilen tutar (TL)"
                      className="rounded-lg h-9"
                    />
                    <Button size="sm" variant="secondary" className="rounded-lg shrink-0" disabled={savingStage} onClick={() => handleSaveStage(stage)}>
                      Kaydet
                    </Button>
                  </div>
                  {/* Görüşme sonrası WhatsApp takibi — mevcut şablon gönderme akışına götürür */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-lg border-emerald-200 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-100"
                    onClick={() => { setWaTab('send'); document.getElementById('wa-followup-anchor')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp'tan takip mesajı gönder
                  </Button>
                </div>
              )}
            </div>

            {/* Disposition */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold">Görüşme Sonucu</Label>
              <RadioGroup value={disposition} onValueChange={setDisposition}>
                {DISPOSITIONS.map((d) => (
                  <div key={d.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={d.value} id={`disp-${d.value}`} />
                    <Label
                      htmlFor={`disp-${d.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {d.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <Button
                onClick={handleSaveDisposition}
                disabled={!sessionId || savingDisposition || !disposition}
                size="sm"
                className="w-full"
              >
                {savingDisposition && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sonucu Kaydet
              </Button>

              {/* Kampanya modu: sonuç girildikten sonra sıradaki kişiye geç */}
              {campaignListId && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Rocket className="h-3.5 w-3.5 text-primary" />
                    Kampanya modu
                    {campaignRemaining !== null && (
                      <span className="ml-auto font-medium tabular-nums">{campaignRemaining} kişi bekliyor</span>
                    )}
                  </p>
                  <Button
                    onClick={goToNextInCampaign}
                    disabled={loadingNext}
                    size="sm"
                    variant="secondary"
                    className="w-full rounded-lg"
                  >
                    {loadingNext ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <SkipForward className="h-4 w-4 mr-2" />}
                    Sıradaki kişiyi ara
                  </Button>
                </div>
              )}

              {/* Memnuniyet anketi linki — sonuç kaydedildikten sonra arayana gönderilir */}
              {sessionId && !sessionId.startsWith('mock-') && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={copySurveyLink}
                >
                  <Star className="h-4 w-4 mr-1.5" /> Memnuniyet anketi linkini kopyala
                </Button>
              )}
            </div>

            {/* Callback */}
            <div className="space-y-2 border-t pt-4">
              <Label className="text-sm font-semibold flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" /> Geri Arama Planla
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetCallback('one-hour')}
                >
                  1 saat sonra
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPresetCallback('tomorrow')}
                >
                  Yarın 14:00
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <CalendarIcon className="h-3.5 w-3.5 mr-1" /> Özel tarih
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={callbackDate}
                      onSelect={setCallbackDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor="cb-date" className="text-xs text-muted-foreground">
                    Tarih
                  </Label>
                  <div
                    id="cb-date"
                    className={cn(
                      'h-9 px-3 py-2 rounded-md border text-sm flex items-center',
                      !callbackDate && 'text-muted-foreground',
                    )}
                  >
                    {callbackDate
                      ? callbackDate.toLocaleDateString('tr-TR')
                      : 'Seçilmedi'}
                  </div>
                </div>
                <div className="w-24">
                  <Label htmlFor="cb-time" className="text-xs text-muted-foreground">
                    Saat
                  </Label>
                  <Input
                    id="cb-time"
                    type="time"
                    value={callbackTime}
                    onChange={(e) => setCallbackTime(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cb-reason" className="text-xs text-muted-foreground">
                  Sebep (opsiyonel)
                </Label>
                <Textarea
                  id="cb-reason"
                  rows={2}
                  value={callbackReason}
                  onChange={(e) => setCallbackReason(e.target.value)}
                  placeholder="Örn: Akşam saatlerinde tekrar denenecek"
                />
              </div>
              <Button
                onClick={handleSaveCallback}
                disabled={!callbackDate || savingCallback}
                size="sm"
                className="w-full"
              >
                {savingCallback && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Clock className="h-4 w-4 mr-1" /> Planla
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp İletişim — accordion altta, tüm genişlik */}
      <div id="wa-followup-anchor" />
      <Accordion type="single" collapsible defaultValue="whatsapp">
        <AccordionItem value="whatsapp" className="border rounded-lg bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <span className="flex items-center gap-2 text-base font-semibold">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
              WhatsApp İletişim
              {waMessages.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  ({waMessages.length} mesaj)
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <Tabs value={waTab} onValueChange={(v) => setWaTab(v as 'history' | 'send')}>
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="history">Geçmiş Mesajlar</TabsTrigger>
                <TabsTrigger value="send">Şablon Gönder</TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4">
                {waLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : waError ? (
                  <div className="text-sm text-rose-600 py-4">{waError}</div>
                ) : waMessages.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Bu kişiyle henüz WhatsApp yazışması yok.
                  </div>
                ) : (
                  <div className="bg-[#e5ddd5] rounded-md p-4 max-h-96 overflow-y-auto space-y-2">
                    {waMessages.map((msg) => {
                      const isOutbound = msg.direction === 'outbound';
                      const bodyText =
                        msg.body ??
                        (msg.templateName ? `[Şablon: ${msg.templateName}]` : '—');
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex',
                            isOutbound ? 'justify-end' : 'justify-start',
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm',
                              isOutbound
                                ? 'bg-emerald-100 text-emerald-950 rounded-tr-none'
                                : 'bg-white text-slate-900 rounded-tl-none',
                            )}
                          >
                            <div className="whitespace-pre-wrap break-words">
                              {bodyText}
                            </div>
                            <div
                              className={cn(
                                'text-[10px] mt-1 flex items-center gap-1.5 justify-end',
                                isOutbound ? 'text-emerald-700/80' : 'text-slate-500',
                              )}
                            >
                              <span>{formatWhatsAppTime(msg.timestamp)}</span>
                              {isOutbound && msg.status && (
                                <span className="opacity-80">
                                  · {msg.status === 'read'
                                    ? 'okundu'
                                    : msg.status === 'delivered'
                                    ? 'iletildi'
                                    : msg.status === 'failed'
                                    ? 'başarısız'
                                    : 'gönderildi'}
                                </span>
                              )}
                            </div>
                            {msg.status === 'failed' && msg.failureReason && (
                              <div className="text-[10px] text-rose-600 mt-1">
                                {msg.failureReason}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="send" className="mt-4 space-y-4">
                {waTemplatesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : waTemplates.length === 0 ? (
                  <div className="text-sm text-muted-foreground border rounded p-4">
                    Henüz Meta onayından geçmiş şablon yok.{' '}
                    <Link
                      href="/ngo-admin/whatsapp-business/templates"
                      className="text-emerald-700 underline"
                    >
                      Şablon oluştur
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-template" className="text-sm font-semibold">
                        Şablon
                      </Label>
                      <select
                        id="wa-template"
                        value={waSelectedTemplateId}
                        onChange={(e) => setWaSelectedTemplateId(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                      >
                        <option value="">Şablon seçin…</option>
                        {waTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.language})
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedWaTemplate && (
                      <>
                        <div className="rounded-md border bg-slate-50 p-3 text-xs whitespace-pre-wrap">
                          {selectedWaTemplate.bodyText}
                        </div>

                        {Object.keys(waVariableValues).length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold">Değişkenler</Label>
                            {Object.keys(waVariableValues).map((varName) => (
                              <div key={varName} className="space-y-1">
                                <Label
                                  htmlFor={`wa-var-${varName}`}
                                  className="text-xs text-muted-foreground"
                                >
                                  {varName}
                                </Label>
                                <Input
                                  id={`wa-var-${varName}`}
                                  value={waVariableValues[varName] ?? ''}
                                  onChange={(e) =>
                                    setWaVariableValues((prev) => ({
                                      ...prev,
                                      [varName]: e.target.value,
                                    }))
                                  }
                                  placeholder={`{{${varName}}}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <Button
                          onClick={handleSendWhatsApp}
                          disabled={waSending || !waSelectedTemplateId}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {waSending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Gönder
                        </Button>
                      </>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
