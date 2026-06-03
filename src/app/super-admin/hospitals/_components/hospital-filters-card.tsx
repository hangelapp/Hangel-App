'use client';

import React from 'react';
import { Search } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { HospitalFilter, HospitalSort } from './types';

interface Props {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  filter: HospitalFilter;
  onFilterChange: (v: HospitalFilter) => void;
  sortBy: HospitalSort;
  onSortByChange: (v: HospitalSort) => void;
  resultCount: number;
  labels: {
    search: string;
    searchPlaceholder: string;
    filter: string;
    filterAll: string;
    filterMissingAddress: string;
    filterMissingCity: string;
    filterMissingDistrict: string;
    sort: string;
    sortMissingFirst: string;
    sortNameAsc: string;
    sortNameDesc: string;
    resultSuffix: string;
  };
}

// Liste başlığı: arama + 4'lü filtre + 3'lü sıralama. resultCount client
// tarafında filtrelenen liste uzunluğudur (sayfaya yüklenmiş chunk içinde).
export const HospitalFiltersCard = ({
  searchTerm,
  onSearchTermChange,
  filter,
  onFilterChange,
  sortBy,
  onSortByChange,
  resultCount,
  labels,
}: Props) => {
  return (
    <Card className="rounded-2xl border-black/5">
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hospital-search" className="text-sm font-semibold">{labels.search}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hospital-search"
                placeholder={labels.searchPlaceholder}
                className="pl-10 h-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospital-filter" className="text-sm font-semibold">{labels.filter}</Label>
            <Select value={filter} onValueChange={(v) => onFilterChange(v as HospitalFilter)}>
              <SelectTrigger id="hospital-filter" className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.filterAll}</SelectItem>
                <SelectItem value="missingAddress">{labels.filterMissingAddress}</SelectItem>
                <SelectItem value="missingCity">{labels.filterMissingCity}</SelectItem>
                <SelectItem value="missingDistrict">{labels.filterMissingDistrict}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hospital-sort" className="text-sm font-semibold">{labels.sort}</Label>
            <Select value={sortBy} onValueChange={(v) => onSortByChange(v as HospitalSort)}>
              <SelectTrigger id="hospital-sort" className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missingFirst">{labels.sortMissingFirst}</SelectItem>
                <SelectItem value="nameAsc">{labels.sortNameAsc}</SelectItem>
                <SelectItem value="nameDesc">{labels.sortNameDesc}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-muted-foreground">
              <strong>{resultCount.toLocaleString('tr-TR')}</strong> {labels.resultSuffix}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
