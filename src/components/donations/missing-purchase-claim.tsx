"use client";

/**
 * "Alışverişim/bağışım burada görünmüyor" talebi.
 *
 * Bazı alışverişler affiliate ağının conversion postback'i gecikince/gelmeyince
 * bağışlarım listesine düşmeyebilir (ör. ağ dönüşümü geç onaylar ya da hiç
 * göndermez). Kullanıcı burada bir talep açar; talep `purchaseClaims`
 * koleksiyonuna yazılır ve super-admin /super-admin/purchase-claims sayfasından
 * inceleyip toplu iletişim kurar. Bu, manuel "hayalet bağış" oluşturmak yerine
 * denetlenebilir bir kayıt bırakır.
 *
 * Sadece talep KAYDI oluşturur — bağışı otomatik oluşturmaz (onay super-admin'de).
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { HelpCircle, Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export function MissingPurchaseClaim() {
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const db = useFirestore();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [contactEmail, setContactEmail] = useState(authUser?.email ?? '');
  const [note, setNote] = useState('');

  const resetForm = () => {
    setBrandName('');
    setOrderNumber('');
    setPurchaseDate('');
    setAmount('');
    setNote('');
    setContactEmail(authUser?.email ?? '');
  };

  const handleSubmit = async () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Giriş gerekli', description: 'Talep oluşturmak için lütfen oturum aç.' });
      return;
    }
    if (!brandName.trim()) {
      toast({ variant: 'destructive', title: 'Mağaza adı gerekli', description: 'Hangi mağazadan alışveriş yaptığını yaz.' });
      return;
    }
    const email = contactEmail.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Geçerli e-posta gerekli', description: 'Sana ulaşabilmemiz için doğru bir e-posta yaz.' });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, COLLECTIONS.purchaseClaims), {
        userId: authUser.uid,
        userName: authUser.displayName ?? null,
        userEmail: authUser.email ?? null,
        contactEmail: email,
        brandName: brandName.trim(),
        orderNumber: orderNumber.trim() || null,
        purchaseDate: purchaseDate.trim() || null,
        amount: amount.trim() || null,
        note: note.trim() || null,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Talebin alındı 🧡',
        description: 'Alışverişini kontrol edip en kısa sürede sana e-posta ile döneceğiz.',
      });
      resetForm();
      setOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: 'Bir sorun oluştu, lütfen tekrar dene.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setContactEmail((c) => c || authUser?.email || ''); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Alışverişim görünmüyor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="text-left">
          <DialogTitle>Alışverişim burada görünmüyor</DialogTitle>
          <DialogDescription>
            Alışverişini tamamladın ama bağışın listede yok mu? Bilgileri doldur; kontrol edip sana
            e-posta ile dönelim. (Alışveriş onayı e-postanı — ör. bilet/sipariş maili — saklarsan işimiz kolaylaşır.)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="mpc-brand">Mağaza / marka *</Label>
            <Input id="mpc-brand" value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ör. Ucuzabilet, Teknosa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="mpc-order">Sipariş / rezervasyon no</Label>
              <Input id="mpc-order" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="Ör. GWIZ0TD" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="mpc-amount">Tutar (TL)</Label>
              <Input id="mpc-amount" value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Ör. 1000" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mpc-date">Alışveriş tarihi</Label>
            <Input id="mpc-date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mpc-email">İletişim e-postan *</Label>
            <Input id="mpc-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="ornek@eposta.com" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mpc-note">Eklemek istediğin not</Label>
            <Textarea id="mpc-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Alışverişle ilgili detay, ekran görüntüsü linki vb." />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Talebi gönder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
