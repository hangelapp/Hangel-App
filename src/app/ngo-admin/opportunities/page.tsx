'use client';

import React from 'react';
import { useTranslation } from '@/components/providers/language-provider';

export default function OpportunitiesPage() {
  const { t } = useTranslation();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{t('ngo_admin_opportunities.title')}</h1>
      <p className="text-muted-foreground">
        {t('ngo_admin_opportunities.description')}
      </p>
    </div>
  );
}
