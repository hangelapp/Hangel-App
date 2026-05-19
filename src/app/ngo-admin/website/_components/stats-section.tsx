'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import type { StatsState } from './types';

interface StatsSectionProps {
    stats: StatsState;
    onStatsChange: (updater: (s: StatsState) => StatsState) => void;
    onSave: () => void;
}

export function StatsSection({ stats, onStatsChange, onSave }: StatsSectionProps) {
    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Gönüllü Sayısı</Label>
                    <Input type="number" value={stats.volunteers} onChange={e => onStatsChange(s => ({ ...s, volunteers: e.target.value }))} placeholder="0" />
                </div>
                <div className="space-y-2">
                    <Label>Bağışçı Sayısı</Label>
                    <Input type="number" value={stats.donors} onChange={e => onStatsChange(s => ({ ...s, donors: e.target.value }))} placeholder="0" />
                </div>
                <div className="space-y-2">
                    <Label>Kuruluş Yılı</Label>
                    <Input type="number" value={stats.foundedYear} onChange={e => onStatsChange(s => ({ ...s, foundedYear: e.target.value }))} placeholder="2020" />
                </div>
                <div className="space-y-2">
                    <Label>Aktif Kampanya</Label>
                    <Input type="number" value={stats.activeCampaigns} onChange={e => onStatsChange(s => ({ ...s, activeCampaigns: e.target.value }))} placeholder="0" />
                </div>
            </div>
            <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                    <Link href="/ngo-admin/dashboard"><BarChart3 className="mr-2 h-4 w-4" /> Veri Paneli</Link>
                </Button>
                <Button className="flex-1" onClick={onSave}>Verileri Güncelle</Button>
            </div>
        </>
    );
}
