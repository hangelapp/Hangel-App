'use client';

/**
 * CorporateApplyDialog — "Kurumsal katılımcı olmak ister misiniz?" başvuru formu.
 *
 * Herkese açık (auth gerekmez). Başvuru
 * volunteering/{oppId}/corporateApplications/{id} altına status:'pending' ile
 * yazılır. STK yöneticisi onaylayınca corporateParticipants'a kopyalanır
 * (başka bir akış). Logo için basit URL girişi VEYA Storage'a dosya yükleme
 * (event-participants/apply/{oppId}/{id}.{ext}) desteklenir.
 */

import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import type { CorporateParticipantType } from '@/lib/types';

interface CorporateApplyDialogProps {
  oppId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_OPTIONS: { value: CorporateParticipantType; label: string }[] = [
  { value: 'stk', label: 'STK' },
  { value: 'belediye', label: 'Belediye' },
  { value: 'valilik', label: 'Valilik' },
  { value: 'marka', label: 'Marka' },
  { value: 'universite', label: 'Üniversite' },
];

function extOf(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromType = file.type.split('/').pop();
  return (fromType || 'png').toLowerCase();
}

export function CorporateApplyDialog({
  oppId,
  open,
  onOpenChange,
}: CorporateApplyDialogProps) {
  const db = useFirestore();
  const { toast } = useToast();

  const [type, setType] = useState<CorporateParticipantType>('stk');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setType('stk');
    setName('');
    setWebsite('');
    setLogoUrl('');
    setLogoFile(null);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setNote('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = contactEmail.trim();
    if (!trimmedName || !trimmedEmail) {
      toast({
        variant: 'destructive',
        title: 'Eksik bilgi',
        description: 'Kurum adı ve iletişim e-postası zorunludur.',
      });
      return;
    }
    if (!db) {
      toast({ variant: 'destructive', title: 'Bağlantı hatası', description: 'Lütfen tekrar deneyin.' });
      return;
    }

    setSubmitting(true);
    try {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Logo: dosya yüklendiyse Storage'a koy, yoksa URL girişini kullan.
      let resolvedLogoUrl = logoUrl.trim();
      if (logoFile) {
        const ext = extOf(logoFile);
        const path = `event-participants/apply/${oppId}/${id}.${ext}`;
        const r = storageRef(getStorage(), path);
        await uploadBytes(r, logoFile);
        resolvedLogoUrl = await getDownloadURL(r);
      }

      const payload: Record<string, unknown> = {
        id,
        type,
        name: trimmedName,
        status: 'pending',
        createdAt: serverTimestamp(),
      };
      if (resolvedLogoUrl) payload.logoUrl = resolvedLogoUrl;
      if (website.trim()) payload.website = website.trim();
      if (contactName.trim()) payload.contactName = contactName.trim();
      payload.contactEmail = trimmedEmail;
      if (contactPhone.trim()) payload.contactPhone = contactPhone.trim();
      if (note.trim()) payload.note = note.trim();

      await setDoc(
        doc(db, COLLECTIONS.volunteering, oppId, COLLECTIONS.corporateApplications, id),
        payload,
      );

      toast({
        title: 'Başvurunuz alındı 🧡',
        description: 'İncelenip onaylanınca yayınlanacak.',
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Başvuru gönderilemedi',
        description: err instanceof Error ? err.message : 'Lütfen tekrar deneyin.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kurumsal katılımcı olun</DialogTitle>
          <DialogDescription>
            Kurumunuzla bu gönüllülük fırsatına katılmak için başvurun. Onaylanınca
            logonuz ve adınız etkinlik sayfasında yayınlanır.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="corp-type">Tür</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as CorporateParticipantType)}
            >
              <SelectTrigger id="corp-type">
                <SelectValue placeholder="Tür seçin" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-name">
              Kurum adı <span className="text-primary">*</span>
            </Label>
            <Input
              id="corp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Uluslararası Sosyal Fayda Derneği"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-website">Web sitesi</Label>
            <Input
              id="corp-website"
              type="url"
              inputMode="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://ornek.org"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-logo">Logo</Label>
            <Input
              id="corp-logo"
              type="url"
              inputMode="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Logo URL'si (https://…)"
              disabled={!!logoFile}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                onClick={() =>
                  document.getElementById('corp-logo-file')?.click()
                }
              >
                <Upload className="h-4 w-4" />
                {logoFile ? 'Dosyayı değiştir' : 'Dosya yükle'}
              </Button>
              {logoFile && (
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {logoFile.name}
                </span>
              )}
              {logoFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setLogoFile(null)}
                >
                  Kaldır
                </Button>
              )}
            </div>
            <input
              id="corp-logo-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Bir logo URL'si girin ya da bir görsel yükleyin.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-contact-name">İletişim adı</Label>
            <Input
              id="corp-contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ad Soyad"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-contact-email">
              İletişim e-posta <span className="text-primary">*</span>
            </Label>
            <Input
              id="corp-contact-email"
              type="email"
              inputMode="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="ornek@kurum.org"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-contact-phone">İletişim telefon</Label>
            <Input
              id="corp-contact-phone"
              type="tel"
              inputMode="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+90 5xx xxx xx xx"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corp-note">Not</Label>
            <Textarea
              id="corp-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Katılımınıza dair eklemek istedikleriniz…"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={submitting}
            className="w-full h-12 rounded-full font-semibold"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gönderiliyor…
              </>
            ) : (
              'Başvuruyu Gönder'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
