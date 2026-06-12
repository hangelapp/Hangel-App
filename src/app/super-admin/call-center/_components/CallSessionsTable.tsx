'use client';

/**
 * CallSessionsTable
 *
 * Super-admin call center sayfasında çağrı oturumu listesini tablo olarak
 * gösterir. Recording URL'ine ERİŞİM YOKTUR — sadece recordingExists ikonu.
 */

import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneIncoming, PhoneOutgoing, Disc, Loader2 } from 'lucide-react';

export interface CallSessionRow {
  id: string;
  agentUid?: string;
  ngoId?: string;
  contactId?: string;
  calledNumber?: string;
  callerNumber?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  outcome?: string;
  status?: string;
  direction?: string;
  notes?: string;
  recordingExists: boolean;
}

interface CallSessionsTableProps {
  rows: CallSessionRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: CallSessionRow) => void;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return '—'; }
}

function formatDuration(seconds?: number): string {
  if (typeof seconds !== 'number' || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function statusBadgeVariant(status?: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'in-progress':
    case 'ringing':
      return 'default';
    case 'completed':
      return 'secondary';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'ringing': return 'Çalıyor';
    case 'in-progress': return 'Görüşmede';
    case 'completed': return 'Tamamlandı';
    case 'failed': return 'Başarısız';
    case 'cancelled': return 'İptal';
    default: return status || '—';
  }
}

function outcomeLabel(outcome?: string): string {
  if (!outcome) return '—';
  const map: Record<string, string> = {
    answered: 'Yanıtlandı',
    voicemail: 'Sesli mesaj',
    no_answer: 'Yanıtsız',
    busy: 'Meşgul',
    rejected: 'Reddedildi',
    success: 'Başarılı',
  };
  return map[outcome] || outcome;
}

export function CallSessionsTable({ rows, isLoading, emptyMessage, onRowClick }: CallSessionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        Yükleniyor…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        {emptyMessage || 'Kayıt bulunamadı.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Tarih</TableHead>
            <TableHead className="whitespace-nowrap">Yön</TableHead>
            <TableHead>Agent</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>STK</TableHead>
            <TableHead className="whitespace-nowrap">Numara (maskeli)</TableHead>
            <TableHead className="whitespace-nowrap">Süre</TableHead>
            <TableHead>Sonuç</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead className="text-center whitespace-nowrap">Kayıt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const directionIcon = row.direction === 'inbound'
              ? <PhoneIncoming className="h-4 w-4 text-blue-600" />
              : row.direction === 'outbound'
                ? <PhoneOutgoing className="h-4 w-4 text-emerald-600" />
                : <Phone className="h-4 w-4 text-muted-foreground" />;
            const displayNumber = row.direction === 'inbound' ? row.callerNumber : row.calledNumber;
            return (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : undefined}
              >
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDateTime(row.startedAt)}
                </TableCell>
                <TableCell>{directionIcon}</TableCell>
                <TableCell className="font-mono text-xs">
                  {row.agentUid ? row.agentUid.slice(0, 8) : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.contactId ? row.contactId.slice(0, 8) : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {row.ngoId ? row.ngoId.slice(0, 8) : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs whitespace-nowrap">
                  {displayNumber || '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {formatDuration(row.duration)}
                </TableCell>
                <TableCell className="text-sm">{outcomeLabel(row.outcome)}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(row.status)}>{statusLabel(row.status)}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {row.recordingExists ? (
                    <Disc
                      className="h-4 w-4 text-red-600 inline-block"
                      // KVKK: bu sadece "kayıt var" göstergesi. URL'e erişim YOK.
                      aria-label="Ses kaydı mevcut (erişim kısıtlı)"
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
