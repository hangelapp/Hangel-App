'use client';

/**
 * Application review card — gönüllü başvurusunu özetler ve Onayla/Reddet
 * butonlarını taşır.
 *
 * Skill match score üst component'te (page) hesaplanır ve prop olarak gelir;
 * burada tutulan tek state UI loading spinner'dır. Onayla/Reddet click'leri
 * upstream `onDecision` callback'ini çağırır.
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/components/providers/language-provider';

export type ApplicationReviewItem = {
  id: string;
  userId?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  listingTitle: string;
  matchScore: number; // 0-100
  status?: 'Onaylandı' | 'Beklemede' | 'Reddedildi';
};

type Props = {
  application: ApplicationReviewItem;
  onDecision: (decision: 'approved' | 'rejected') => void | Promise<void>;
  pending?: boolean;
};

function scoreBadgeClass(score: number) {
  if (score >= 75) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (score >= 40) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
}

export function ApplicationReviewCard({ application, onDecision, pending }: Props) {
  const { t } = useTranslation();
  const initial = (application.userName?.charAt(0) || 'G').toUpperCase();
  const isResolved = application.status === 'Onaylandı' || application.status === 'Reddedildi';

  return (
    <div className="p-3 border rounded-lg flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar>
          {application.userAvatarUrl ? (
            <AvatarImage src={application.userAvatarUrl} alt={application.userName || ''} />
          ) : null}
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm break-words">
            {application.userName || t('ngo_admin_volunteering.review.volunteerFallback')}
          </p>
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            <Badge
              variant="outline"
              className={`text-[10px] font-medium ${scoreBadgeClass(application.matchScore)}`}
            >
              {t('ngo_admin_volunteering.review.matchScore')}: {application.matchScore}%
            </Badge>
            {application.status && (
              <Badge variant="secondary" className="text-[10px] font-medium">
                {application.status}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 basis-full sm:basis-auto justify-end">
        {application.userId && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/profile/${application.userId}`}>
              {t('ngo_admin_volunteering.review.viewProfileBtn')}
            </Link>
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="text-emerald-700 border border-emerald-200 hover:bg-emerald-50"
          disabled={pending || isResolved}
          onClick={() => onDecision('approved')}
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            t('ngo_admin_volunteering.review.approveBtn')
          )}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={pending || isResolved}
          onClick={() => onDecision('rejected')}
        >
          {t('ngo_admin_volunteering.review.rejectBtn')}
        </Button>
      </div>
    </div>
  );
}
