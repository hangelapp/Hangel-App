'use client';

/**
 * /ngo-admin/call-center/lists
 *
 * STK çağrı merkezi arama listeleri — UI artık CallLists bileşeninde
 * (src/app/ngo-admin/call-center/_components/CallLists.tsx). Bu route deep-link
 * + kuyruğun call linkleri kırılmasın diye korundu; içerik aynı zamanda Çağrı
 * Merkezi sayfasında "Arama Listeleri" sekmesi olarak da render edilir.
 *
 * KVKK: yalnızca caller'ın tenant'ı (managedNgoId) görünür/yönetilir.
 */

import React from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, ListChecks } from 'lucide-react';
import { CallLists } from '../_components/CallLists';

export default function CallCenterListsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin">Yönetim Paneli</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin/call-center">Çağrı Merkezi</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Arama Listelerim</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/ngo-admin/call-center"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Çağrı Merkezi
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-emerald-600" /> Arama Listelerim
          </h1>
        </div>
      </div>

      <CallLists />
    </div>
  );
}
