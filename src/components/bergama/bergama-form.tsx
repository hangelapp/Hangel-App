'use client';

/**
 * Bergama başvuru/iletişim formu. /bergama, /bergama/yerleske ve /bergama/forum
 * sayfalarında kullanılır. POST /api/bergama/basvuru → ismailhilmi@hangel.org.
 * `kaynak` prop'u başvurunun geldiği bölümü işaretler; honeypot ile anti-spam.
 */

import { useState } from 'react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Kaynak = 'yerleske' | 'forum' | 'genel';

export function BergamaForm({
  kaynak = 'genel',
  title = 'Başvuruda bulun',
  description = 'Bilgilerini bırak, seninle iletişime geçelim.',
  ilgiSecenekleri,
  theme = 'light',
}: {
  kaynak?: Kaynak;
  title?: string;
  description?: string;
  /** Verilirse "İlgi alanı" bir seçim (radyo/pill) olarak gösterilir. */
  ilgiSecenekleri?: string[];
  theme?: 'light' | 'dark';
}) {
  const dark = theme === 'dark';
  const [ad, setAd] = useState('');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [kurum, setKurum] = useState('');
  const [ilgi, setIlgi] = useState(ilgiSecenekleri?.[0] ?? '');
  const [mesaj, setMesaj] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!ad.trim()) { setError('Ad Soyad gerekli.'); return; }
    if (!email.trim()) { setError('E-posta gerekli.'); return; }
    if (!mesaj.trim() && !ilgi.trim()) { setError('Lütfen bir mesaj yaz.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/bergama/basvuru', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ad, email, telefon, kurum, ilgi, mesaj, kaynak, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Gönderilemedi, tekrar dene.'); return; }
      setDone(true);
    } catch {
      setError('Bağlantı hatası, tekrar dene.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className={`mx-auto max-w-lg rounded-3xl border p-8 text-center ${dark ? 'border-white/10 bg-white/[0.04] text-white' : 'border-black/5 bg-white shadow-sm'}`}>
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
        <h3 className="text-xl font-bold tracking-tight">Başvurun alındı 🧡</h3>
        <p className={`mt-2 text-sm ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>
          En kısa sürede seninle iletişime geçeceğiz. İlgin için teşekkürler.
        </p>
      </div>
    );
  }

  const fieldBase = dark
    ? 'rounded-xl bg-white/[0.06] border-white/15 text-white placeholder:text-white/40'
    : 'rounded-xl';

  return (
    <form
      onSubmit={submit}
      className={`mx-auto max-w-lg rounded-3xl border p-6 text-left md:p-8 ${dark ? 'border-white/10 bg-white/[0.04]' : 'border-black/5 bg-white shadow-sm'}`}
    >
      <h3 className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : ''}`}>{title}</h3>
      <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-muted-foreground'}`}>{description}</p>

      <div className="mt-5 space-y-3">
        <Input className={fieldBase} placeholder="Ad Soyad *" value={ad} onChange={(e) => setAd(e.target.value)} maxLength={120} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input className={fieldBase} type="email" placeholder="E-posta *" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={160} />
          <Input className={fieldBase} placeholder="Telefon (opsiyonel)" value={telefon} onChange={(e) => setTelefon(e.target.value)} maxLength={40} />
        </div>
        <Input className={fieldBase} placeholder="Kurum / STK (opsiyonel)" value={kurum} onChange={(e) => setKurum(e.target.value)} maxLength={160} />

        {ilgiSecenekleri && ilgiSecenekleri.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {ilgiSecenekleri.map((s) => {
              const active = ilgi === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setIlgi(s)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : dark
                        ? 'border-white/15 text-white/70 hover:border-white/30'
                        : 'border-black/10 text-muted-foreground hover:border-black/20'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        <Textarea
          className={`${fieldBase} min-h-[110px]`}
          placeholder="Nasıl katkı sunmak istersin? Kısaca anlat…"
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
          maxLength={3000}
        />

        {/* Honeypot — kullanıcıya görünmez, botlar doldurur */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        {error && <p className="text-sm font-medium text-red-500">{error}</p>}

        <Button type="submit" size="lg" disabled={sending} className="h-12 w-full rounded-2xl font-bold">
          {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
          {sending ? 'Gönderiliyor…' : 'Başvuruyu gönder'}
        </Button>
        <p className={`text-center text-[11px] ${dark ? 'text-white/40' : 'text-muted-foreground'}`}>
          Bilgilerin yalnızca seninle iletişim kurmak için kullanılır.
        </p>
      </div>
    </form>
  );
}
