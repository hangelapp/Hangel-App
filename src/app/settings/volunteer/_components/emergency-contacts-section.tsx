'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Loader2, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import { countryPhoneCodes } from '@/lib/data';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { EmergencyContact } from './types';

/**
 * Acil Durum Kişileri. Telefon girilip "Davet Gönder"e basılınca:
 * - Telefon hangel üyesiyse → o kişiye Kabul/Ret bildirimi gider (KVKK: ad/puan
 *   yalnız kişi KABUL edince gelir). Kayıt 'pending' olur.
 * - Üye değilse → "üye değil" bilgisi döner, ad ELLE girilir (klasik akış).
 * accepted olunca ad + hangel puanı otomatik görünür.
 */
export const EmergencyContactsSection = ({
  contacts,
  onContactChange,
  onContactPatch,
}: {
  contacts: EmergencyContact[];
  onContactChange: (index: number, field: 'name' | 'phone', value: string) => void;
  /** Davet sonrası uid/status/impactScore gibi alanları toptan güncellemek için. */
  onContactPatch?: (index: number, patch: Partial<EmergencyContact>) => void;
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const [invitingIndex, setInvitingIndex] = useState<number | null>(null);

  const sendInvite = async (index: number) => {
    const phone = contacts[index]?.phone?.trim();
    if (!phone || phone.length < 7) {
      toast({ variant: 'destructive', title: 'Telefon eksik', description: 'Önce geçerli bir telefon numarası girin.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Davet göndermek için giriş yapın.' });
      return;
    }
    setInvitingIndex(index);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/emergency-contacts/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Gönderilemedi', description: data?.message || 'Davet gönderilemedi.' });
        return;
      }
      if (data.found && data.invited) {
        // uid kayda yazılır → respond endpoint'i kabul/ret'te bu kaydı bulur.
        onContactPatch?.(index, { status: 'pending', uid: typeof data.uid === 'string' ? data.uid : undefined });
        toast({ title: 'Davet gönderildi 🧡', description: 'Kişi kabul edince adı ve hangel puanı otomatik görünecek.' });
      } else {
        // Üye değil → elle giriş.
        onContactPatch?.(index, { status: undefined });
        toast({ title: 'Bu kişi hangel üyesi değil', description: 'Adını elle yazabilirsin; kişi daha sonra üye olursa davet edebilirsin.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Bağlantı hatası', description: 'Davet gönderilemedi, tekrar deneyin.' });
    } finally {
      setInvitingIndex(null);
    }
  };

  const renderPerson = (index: number, label: string) => {
    const c = contacts[index] || { name: '', phone: '' };
    const status = c.status;
    return (
      <div className={index === 0 ? 'space-y-3' : 'space-y-3 pt-4 border-t border-dashed'}>
        <Label className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>

        {/* Telefon önce — sistem üye mi diye sorgular. */}
        <div className="flex gap-2">
          <div className="w-[80px] shrink-0">
            <Select defaultValue="90">
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>{[...new Set(countryPhoneCodes)].map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Input
            type="tel"
            placeholder="Telefon (5XX...)"
            value={c.phone || ''}
            onChange={e => { onContactChange(index, 'phone', e.target.value); onContactPatch?.(index, { status: undefined, uid: undefined, impactScore: undefined }); }}
            className="flex-1 h-11"
            disabled={status === 'pending' || status === 'accepted'}
          />
        </div>

        {/* Durum + aksiyon */}
        {status === 'accepted' ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold text-foreground break-words">{c.name || 'hangel üyesi'}</span>
            {typeof c.impactScore === 'number' && (
              <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{c.impactScore} puan 🧡</span>
            )}
          </div>
        ) : status === 'pending' ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Davet gönderildi — kişinin onayı bekleniyor.</span>
          </div>
        ) : status === 'rejected' ? (
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>Kişi daveti reddetti. Adını elle girebilirsin.</span>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full h-11 rounded-xl"
            disabled={invitingIndex === index || !(contacts[index]?.phone || '').trim()}
            onClick={() => void sendInvite(index)}
          >
            {invitingIndex === index ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            hangel üyesiyse davet gönder
          </Button>
        )}

        {/* Ad — accepted'da otomatik dolu/kilitli; değilse elle girilebilir. */}
        {status !== 'accepted' && (
          <Input
            placeholder="Ad Soyad (üye değilse elle yaz)"
            value={c.name || ''}
            onChange={e => onContactChange(index, 'name', e.target.value)}
            className="h-11"
          />
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Acil Durum Kişileri (İsteğe Bağlı)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderPerson(0, 'Birinci Kişi')}
        {renderPerson(1, 'İkinci Kişi')}
      </CardContent>
    </Card>
  );
};
