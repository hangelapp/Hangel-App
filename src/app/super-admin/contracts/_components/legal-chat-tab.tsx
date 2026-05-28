'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Send, MessagesSquare, Scale, ShieldAlert, Building2, BookText,
  Link2, Pencil, Check, X, Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

interface ContractLite { slug: string; title: string; }
interface LegislationLite { id: string; name: string; number?: string; }

interface ChatRef { type: 'mevzuat' | 'sozlesme'; id: string; title: string; }
interface ChatMessage {
  id: string;
  room: string;
  text: string;
  ref?: ChatRef;
  authorId?: string;
  authorName?: string;
  createdAt?: Timestamp;
  edited?: boolean;
  editedAt?: Timestamp;
}

const ROOMS: { id: string; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'genel', label: 'Genel Hukuk', icon: MessagesSquare, desc: 'Genel hukuki tartışma' },
  { id: 'mevzuat', label: 'Mevzuat', icon: BookText, desc: 'Kanun/madde bazlı tartışma' },
  { id: 'acil-risk', label: 'Acil Risk', icon: ShieldAlert, desc: 'Acil hukuki risk' },
  { id: 'stk-inceleme', label: 'STK İnceleme', icon: Building2, desc: 'Kurum/sözleşme inceleme' },
];

function fmtTime(ts?: Timestamp): string {
  if (!ts) return '';
  try { return ts.toDate().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

export function LegalChatTab({ contracts }: { contracts: ContractLite[] }) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const legQuery = useMemoFirebase(() => collection(db, COLLECTIONS.legislations), [db]);
  const { data: legislations } = useCollection<LegislationLite>(legQuery);

  const chatQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.legalChat), orderBy('createdAt', 'asc')), [db]);
  const { data: allMessages, isLoading } = useCollection<ChatMessage>(chatQuery);

  const [room, setRoom] = useState('genel');
  const [text, setText] = useState('');
  const [refValue, setRefValue] = useState('none');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => (allMessages || []).filter(m => (m.room || 'genel') === room), [allMessages, room]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, room]);

  const resolveRef = (): ChatRef | undefined => {
    if (refValue === 'none') return undefined;
    const [type, id] = refValue.split(':');
    if (type === 'mevzuat') {
      const l = (legislations || []).find(x => x.id === id);
      if (l) return { type: 'mevzuat', id, title: l.name };
    } else if (type === 'sozlesme') {
      const c = contracts.find(x => x.slug === id);
      if (c) return { type: 'sozlesme', id, title: c.title };
    }
    return undefined;
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    try {
      const ref = resolveRef();
      await addDoc(collection(db, COLLECTIONS.legalChat), {
        room,
        text: trimmed,
        ...(ref ? { ref } : {}),
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Hukuk Görevlisi',
        createdAt: serverTimestamp(),
        edited: false,
      });
      setText('');
      setRefValue('none');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
    } finally {
      setSending(false);
    }
  };

  const startEdit = (m: ChatMessage) => { setEditingId(m.id); setEditText(m.text); };
  const saveEdit = async (m: ChatMessage) => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === m.text) { setEditingId(null); return; }
    try {
      await updateDoc(doc(db, COLLECTIONS.legalChat, m.id), { text: trimmed, edited: true, editedAt: serverTimestamp() });
      setEditingId(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Düzenlenemedi', description: e instanceof Error ? e.message : 'Hata' });
    }
  };

  const activeRoom = ROOMS.find(r => r.id === room) || ROOMS[0];

  const refOptions = useMemo(() => ({
    mevzuat: (legislations || []).map(l => ({ value: `mevzuat:${l.id}`, label: `${l.name}${l.number ? ` (${l.number})` : ''}` })),
    sozlesme: contracts.map(c => ({ value: `sozlesme:${c.slug}`, label: c.title })),
  }), [legislations, contracts]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row h-[68vh] min-h-[480px]">
        {/* Odalar */}
        <div className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r bg-muted/20">
          <div className="p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
            {ROOMS.map(r => {
              const Icon = r.icon;
              const active = r.id === room;
              return (
                <button key={r.id} onClick={() => setRoom(r.id)}
                  className={cn('flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors shrink-0 md:w-full',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-tight whitespace-nowrap md:whitespace-normal">{r.label}</p>
                    <p className={cn('text-[10px] leading-tight hidden md:block', active ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{r.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mesajlar */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2.5 border-b flex items-center gap-2 bg-card">
            <activeRoom.icon className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">{activeRoom.label}</span>
            <Badge variant="secondary" className="text-[9px] ml-auto gap-1"><Lock className="h-2.5 w-2.5" /> Silinemez · loglu</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessagesSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Bu odada henüz mesaj yok.</p>
                <p className="text-xs mt-1">Genel konuş ya da bir mevzuat/sözleşme maddesine referans vererek tartış.</p>
              </div>
            ) : (
              messages.map(m => {
                const mine = m.authorId === user?.uid;
                const editing = editingId === m.id;
                return (
                  <div key={m.id} className={cn('flex flex-col max-w-[85%] gap-1', mine ? 'ml-auto items-end' : 'items-start')}>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                      <span className="font-semibold">{m.authorName || 'Görevli'}</span>
                      <span>·</span>
                      <span>{fmtTime(m.createdAt)}</span>
                      {m.edited && <span className="italic">· düzenlendi</span>}
                    </div>
                    <div className={cn('rounded-2xl px-3.5 py-2 text-sm', mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm')}>
                      {m.ref && (
                        <div className={cn('flex items-center gap-1.5 mb-1.5 pb-1.5 border-b text-[11px] font-medium', mine ? 'border-primary-foreground/20' : 'border-border')}>
                          {m.ref.type === 'mevzuat' ? <Scale className="h-3 w-3 shrink-0" /> : <Link2 className="h-3 w-3 shrink-0" />}
                          <span className="truncate">{m.ref.type === 'mevzuat' ? 'Mevzuat' : 'Sözleşme'}: {m.ref.title}</span>
                        </div>
                      )}
                      {editing ? (
                        <div className="space-y-1.5">
                          <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="min-h-[60px] text-sm text-foreground" />
                          <div className="flex gap-1.5 justify-end">
                            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" className="h-7 px-2" onClick={() => saveEdit(m)}><Check className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      )}
                    </div>
                    {mine && !editing && (
                      <button onClick={() => startEdit(m)} className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 px-1">
                        <Pencil className="h-2.5 w-2.5" /> düzenle
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Kompozisyon */}
          <div className="border-t p-3 space-y-2 bg-card">
            <Select value={refValue} onValueChange={setRefValue}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Madde/sözleşme referansı ekle (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Referans yok</SelectItem>
                {refOptions.mevzuat.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Mevzuat</SelectLabel>
                    {refOptions.mevzuat.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectGroup>
                )}
                {refOptions.sozlesme.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Sözleşme / Politika</SelectLabel>
                    {refOptions.sozlesme.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            <div className="flex items-end gap-2">
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); } }}
                placeholder={`${activeRoom.label} odasına yaz… (⌘/Ctrl+Enter gönderir)`}
                className="min-h-[44px] max-h-32 resize-none"
              />
              <Button onClick={handleSend} disabled={sending || !text.trim()} className="h-11 w-11 p-0 shrink-0">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
