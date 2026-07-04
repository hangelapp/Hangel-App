'use client';

// BAĞIŞ ETKİSİ — ürün detay satın alma kutusunda, bu alışverişin ne kadarının
// (alıcı ekstra ödemeden) bağışa döneceğini ve KULLANICININ seçtiği STK(ları)
// isimleriyle gösteren sıcak coral kart. Kaynak: users/{uid}.supportedNgos +
// ngos/{id}.name. Oturum durumu / STK seçimi durumlarına göre metin değişir.

import Link from 'next/link';
import { HeartHandshake } from 'lucide-react';
import {
  useFirestore,
  useDoc,
  useCollection,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { doc, collection, query, where, documentId } from 'firebase/firestore';
import { donationAmountTRY } from '@/lib/market/donation-value';
import type { CanonicalProduct } from '@/lib/feed/types';

type UserDoc = { supportedNgos?: string[] };
type NgoDoc = { id: string; name?: string };

export function DonationImpact({
  product,
  donationRate,
}: {
  product: CanonicalProduct;
  donationRate: number;
}) {
  const db = useFirestore();
  const { user } = useUser();

  // Kullanıcı dokümanı → desteklenen STK id'leri (50/50, en fazla 2).
  const userRef = useMemoFirebase(
    () => (user ? doc(db, COLLECTIONS.users, user.uid) : null),
    [db, user?.uid]
  );
  const { data: userData } = useDoc<UserDoc>(userRef);
  const ngoIds = (userData?.supportedNgos || []).filter(Boolean).slice(0, 2);

  // Seçili STK dokümanları (isim için). `in` sorgusu en fazla 10 id alır.
  const ngoQuery = useMemoFirebase(
    () =>
      ngoIds.length > 0
        ? query(
            collection(db, COLLECTIONS.ngos),
            where(documentId(), 'in', ngoIds.slice(0, 10))
          )
        : null,
    [db, ngoIds.join(',')]
  );
  const { data: ngoDocs } = useCollection<NgoDoc>(ngoQuery);

  if (!donationRate || donationRate <= 0) return null;

  const amount = Math.round(donationAmountTRY(product, donationRate));

  // STK adlarını seçim sırasına göre diz (sorgu sırası garantisiz).
  const ngoNames = ngoIds
    .map((id) => ngoDocs?.find((n) => n.id === id)?.name)
    .filter((n): n is string => !!n && n.trim().length > 0);

  const signedIn = !!user;
  const hasNgos = signedIn && ngoNames.length > 0;

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HeartHandshake className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 text-sm leading-relaxed text-foreground/90">
          {hasNgos ? (
            <>
              <p className="font-black text-foreground">
                🧡 Alışverişin iyiliğe dönüşür — sen ekstra ödemezsin.
              </p>
              <p className="mt-0.5 text-muted-foreground">
                Bu ürünü alırsan, tutarın{' '}
                <strong className="text-primary">
                  %{donationRate}&apos;i ≈ {amount} TL
                </strong>{' '}
                desteklediğin{' '}
                <strong className="text-foreground">{ngoNames[0]}</strong>
                {ngoNames[1] ? (
                  <>
                    {' '}ve{' '}
                    <strong className="text-foreground">{ngoNames[1]}</strong>
                  </>
                ) : null}{' '}
                için bağışa dönüşür.
              </p>
            </>
          ) : signedIn ? (
            <p className="text-muted-foreground">
              🧡 Alışverişin{' '}
              <strong className="text-primary">≈ {amount} TL</strong> bağışa
              dönüşür.{' '}
              <Link
                href="/settings/ngo-selection"
                className="font-black text-primary hover:underline"
              >
                Bir STK seç
              </Link>
              , desteğin doğrudan ona gitsin.
            </p>
          ) : (
            <p className="text-muted-foreground">
              🧡 Alışverişin{' '}
              <strong className="text-primary">≈ {amount} TL</strong> iyiliğe
              dönüşür — sen ekstra ödemezsin.{' '}
              <Link
                href="/login"
                className="font-black text-primary hover:underline"
              >
                Giriş yap
              </Link>{' '}
              ve desteklediğin STK&apos;yı seç.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DonationImpact;
