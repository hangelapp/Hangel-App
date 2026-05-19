'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Plus, FileText, MessageSquare, Mail, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface TemplateRow {
  id: string;
  name?: string;
  channel?: 'sms' | 'email' | 'both';
  useCase?: string;
  language?: string;
  active?: boolean;
  body?: string;
  subject?: string;
  variables?: string[];
}

const useCaseBadge: Record<string, string> = {
  transactional: 'bg-sky-100 text-sky-800',
  marketing: 'bg-amber-100 text-amber-800',
  emergency: 'bg-rose-100 text-rose-800',
};

export default function TemplatesListPage() {
  const db = useFirestore();
  const tplQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.messageTemplates), orderBy('updatedAt', 'desc')),
    [db]
  );
  const { data, isLoading } = useCollection<TemplateRow>(tplQuery);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (t) =>
        (t.name ?? '').toLowerCase().includes(s) ||
        (t.body ?? '').toLowerCase().includes(s) ||
        (t.subject ?? '').toLowerCase().includes(s)
    );
  }, [data, search]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Şablonlar</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tekrar kullanılabilir SMS / e-posta şablonları. Değişken: <code className="text-xs">{'{ad}'}</code>, <code className="text-xs">{'{stk_adi}'}</code>
          </p>
        </div>
        <Link href="/super-admin/messaging/templates/new/edit" className="self-start md:self-auto">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Yeni Şablon
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Şablon ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz şablon yok. "Yeni Şablon" ile başla.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/super-admin/messaging/templates/${t.id}/edit`}
                    className="flex items-start gap-3 py-3 px-2 -mx-2 rounded hover:bg-muted/40"
                  >
                    {t.channel === 'email' ? (
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{t.name ?? t.id}</span>
                        {t.useCase && (
                          <Badge className={cn('text-xs', useCaseBadge[t.useCase])}>
                            {t.useCase}
                          </Badge>
                        )}
                        {t.active === false && <Badge variant="outline" className="text-xs">pasif</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {t.subject ? `${t.subject} — ` : ''}
                        {(t.body ?? '').slice(0, 100)}
                      </p>
                      {t.variables && t.variables.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Değişkenler: {t.variables.map((v) => `{${v}}`).join(', ')}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
