'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Send, MessagesSquare, Scale, Shield, Search, Lock, Pencil, Check, X, Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, doc, updateDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

interface ContractLite { slug: string; title: string; kind?: string; group?: string }
interface ChatMessage {
  id: string;
  room: string;            // 'genel' veya sözleşme/politika slug'ı
  text: string;
  authorId?: string;
  authorName?: string;
  createdAt?: Timestamp;
  edited?: boolean;
  editedAt?: Timestamp;
}

const isPolicy = (c: ContractLite) =>
  c.kind === 'policy' || (!c.kind && /politika|gizlilik|kvkk|çerez|cerez|topluluk|moderasyon/i.test(`${c.title} ${c.group || ''}`));

function fmtTime(ts?: Timestamp): string {
  if (!ts) return '';
  try { return ts.toDate().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
}

function RoomButton({ id, label, icon: Icon, active, count, onSelect }: {
  id: string; label: string; icon?: React.ElementType; active: boolean; count: number; onSelect: (id: string) => void;
}) {
  return (
    <button onClick={() => onSelect(id)}
      className={cn('flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors w-full', active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent')}>
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span className="text-xs font-medium truncate flex-1">{label}</span>
      {count > 0 && <Badge variant={active ? 'secondary' : 'outline'} className="text-[9px] h-4 px-1 shrink-0">{count}</Badge>}
    </button>
  );
}

export function LegalChatTab({ contracts }: { contracts: ContractLite[] }) {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const chatQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.legalChat), orderBy('createdAt', 'asc')), [db]);
  const { data: allMessages, isLoading } = useCollection<ChatMessage>(chatQuery);

  const [room, setRoom] = useState('genel');
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const sozlesmeler = useMemo(() => contracts.filter(c => !isPolicy(c)), [contracts]);
  const politikalar = useMemo(() => contracts.filter(isPolicy), [contracts]);

  // Oda başına okunmamış/son mesaj sayısı için mesajları say
  const countByRoom = useMemo(() => {
    const m = new Map<string, number>();
    (allMessages || []).forEach(msg => { const r = msg.room || 'genel'; m.set(r, (m.get(r) || 0) + 1); });
    return m;
  }, [allMessages]);

  const messages = useMemo(() => (allMessages || []).filter(m => (m.room || 'genel') === room), [allMessages, room]);

  const filterContracts = (list: ContractLite[]) =>
    search.trim() ? list.filter(c => c.title.toLowerCase().includes(search.toLowerCase())) : list;

  const activeTitle = room === 'genel'
    ? 'Genel Hukuk'
    : (contracts.find(c => c.slug === room)?.title || room);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, room]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    setSending(true);
    try {
      await addDoc(collection(db, COLLECTIONS.legalChat), {
        room,
        text: trimmed,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Hukuk Görevlisi',
        createdAt: serverTimestamp(),
        edited: false,
      });
      setText('');
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
    } finally {
      setSending(false);
    }
  };

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

  const renderRoom = (id: string, label: string, Icon?: React.ElementType) => (
    <RoomButton key={id} id={id} label={label} icon={Icon} active={id === room} count={countByRoom.get(id) || 0} onSelect={setRoom} />
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row h-[70vh] min-h-[500px]">
        {/* Sol: sözleşme & politika listesi */}
        <div className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r bg-muted/20 flex flex-col">
          <div className="p-2.5 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sözleşme/politika ara..." className="pl-8 h-9 text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {renderRoom('genel', 'Genel Hukuk', MessagesSquare)}

            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground px-2.5 mb-1 flex items-center gap-1"><Scale className="h-3 w-3" /> Sözleşmeler</p>
              <div className="space-y-0.5">
                {filterContracts(sozlesmeler).map(c => renderRoom(c.slug, c.title))}
                {filterContracts(sozlesmeler).length === 0 && <p className="text-[10px] text-muted-foreground italic px-2.5">—</p>}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground px-2.5 mb-1 flex items-center gap-1"><Shield className="h-3 w-3" /> Politikalar</p>
              <div className="space-y-0.5">
                {filterContracts(politikalar).map(c => renderRoom(c.slug, c.title))}
                {filterContracts(politikalar).length === 0 && <p className="text-[10px] text-muted-foreground italic px-2.5">—</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ: mesajlar */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2.5 border-b flex items-center gap-2 bg-card">
            <Scale className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold text-sm truncate">{activeTitle}</span>
            {room !== 'genel' && (
              <Link href={`/settings/contracts/${room}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 shrink-0">
                <Eye className="h-3 w-3" /> Önizle
              </Link>
            )}
            <Badge variant="secondary" className="text-[9px] ml-auto gap-1 shrink-0"><Lock className="h-2.5 w-2.5" /> Silinemez · loglu</Badge>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessagesSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{room === 'genel' ? 'Genel hukuk odasında' : `"${activeTitle}" üzerine`} henüz mesaj yok.</p>
                <p className="text-xs mt-1">Bu sözleşme/politika hakkında ekip içi hukuki tartışma başlat.</p>
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
                      <button onClick={() => { setEditingId(m.id); setEditText(m.text); }} className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 px-1">
                        <Pencil className="h-2.5 w-2.5" /> düzenle
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t p-3 bg-card">
            <div className="flex items-end gap-2">
              <Textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend(); } }}
                placeholder={`${activeTitle} hakkında yaz… (⌘/Ctrl+Enter gönderir)`}
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
