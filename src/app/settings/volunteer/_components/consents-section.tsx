'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck } from 'lucide-react';
import type { ConsentsState } from './types';

const CONSENT_ITEMS: { key: keyof ConsentsState; label: string }[] = [
  { key: 'contract', label: 'Gönüllülük Sözleşmesi\'ni okudum ve kabul ediyorum.' },
  { key: 'rights', label: 'Gönüllü Hakları ve Sorumluluklarını kabul ediyorum.' },
  { key: 'ethics', label: 'Etik İlkeler ve İnsan Hakları Politikası\'na uyacağımı beyan ederim.' },
  { key: 'socialImpact', label: 'Sosyal Etki yaklaşımını ve katkı modelini anladım.' },
  { key: 'privacy', label: 'Gizlilik ve KVKK kapsamında verilerimin işlenmesini kabul ediyorum.' },
];

export const ConsentsSection = ({
  value,
  onChange,
}: {
  value: ConsentsState;
  onChange: (next: ConsentsState) => void;
}) => {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> hangel Gönüllülük Katılım ve Onay Beyanı</CardTitle>
        <p className="text-xs text-muted-foreground leading-relaxed mt-2">
          hangel topluluğunun bir parçası olarak, kolektif bilinç ile hareket etmeyi, hangel etik değerlerine bağlı kalmayı, tüm canlılara saygıyla yaklaşmayı ve sosyal fayda üretirken sorumluluk almayı kabul ediyorum.
        </p>
        <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-1">Tüm maddeler zorunludur</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {CONSENT_ITEMS.map(({ key, label }) => (
          <label key={key} className="flex items-start gap-3 p-3 border bg-background rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
            <Checkbox
              checked={value[key]}
              onCheckedChange={c => onChange({ ...value, [key]: !!c })}
              className="shrink-0 mt-0.5"
            />
            <span className="text-sm leading-snug min-w-0 break-words">{label}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
};
