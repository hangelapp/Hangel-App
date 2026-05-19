'use client';

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import type { StatusFilter } from './types';

interface BrandStatsCardsProps {
    stats: { total: number; approved: number; pending: number; passive: number; rejected: number };
    onStatusFilterChange: (filter: StatusFilter) => void;
}

export const BrandStatsCards = ({ stats, onStatusFilterChange }: BrandStatsCardsProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="rounded-2xl border-black/5 cursor-pointer hover:shadow-md transition" onClick={() => onStatusFilterChange('all')}>
                <CardContent className="p-4">
                    <p className="text-2xl font-black">{stats.total}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Tümü</p>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-green-500/30 cursor-pointer hover:shadow-md transition" onClick={() => onStatusFilterChange('approved')}>
                <CardContent className="p-4">
                    <p className="text-2xl font-black text-green-600">{stats.approved}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Yayında</p>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-amber-500/30 cursor-pointer hover:shadow-md transition" onClick={() => onStatusFilterChange('pending')}>
                <CardContent className="p-4">
                    <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Onay Bekliyor</p>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-black/5 cursor-pointer hover:shadow-md transition" onClick={() => onStatusFilterChange('passive')}>
                <CardContent className="p-4">
                    <p className="text-2xl font-black text-muted-foreground">{stats.passive}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Pasif</p>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-destructive/30 cursor-pointer hover:shadow-md transition" onClick={() => onStatusFilterChange('rejected')}>
                <CardContent className="p-4">
                    <p className="text-2xl font-black text-destructive">{stats.rejected}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Reddedildi</p>
                </CardContent>
            </Card>
        </div>
    );
};
