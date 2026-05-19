'use client';

import React from 'react';
import { Search } from 'lucide-react';

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { StatusFilter } from './types';

interface BrandFiltersCardProps {
    searchTerm: string;
    onSearchTermChange: (v: string) => void;
    statusFilter: StatusFilter;
    onStatusFilterChange: (v: StatusFilter) => void;
    resultCount: number;
}

export const BrandFiltersCard = ({ searchTerm, onSearchTermChange, statusFilter, onStatusFilterChange, resultCount }: BrandFiltersCardProps) => {
    return (
        <Card className="rounded-2xl border-black/5">
            <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="search" className="text-sm font-semibold">Ara</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Marka adı, kategori..."
                                className="pl-10 h-10 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => onSearchTermChange(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-semibold">Durum</Label>
                        <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
                            <SelectTrigger id="status" className="h-10 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü</SelectItem>
                                <SelectItem value="approved">Yayında (Aktif)</SelectItem>
                                <SelectItem value="pending">Onay Bekleyen</SelectItem>
                                <SelectItem value="passive">Pasif</SelectItem>
                                <SelectItem value="rejected">Reddedildi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <p className="text-sm text-muted-foreground">
                            <strong>{resultCount}</strong> marka gösteriliyor
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
