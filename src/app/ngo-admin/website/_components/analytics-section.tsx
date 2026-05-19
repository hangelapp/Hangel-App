'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { analyticsProviders } from './constants';

interface AnalyticsSectionProps {
    onConnectClick: (providerName: string) => void;
    onSave: () => void;
}

export function AnalyticsSection({ onConnectClick, onSave }: AnalyticsSectionProps) {
    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {analyticsProviders.map((ap) => (
                    <div key={ap.id} className="p-3 border rounded-xl flex flex-col items-center gap-2 bg-muted/10">
                        <span className="text-[10px] font-bold">{ap.name}</span>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] w-full" onClick={() => onConnectClick(ap.name)}>Bağla</Button>
                    </div>
                ))}
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Özel Script (Head/Body)</Label>
                <Textarea
                    className="font-mono text-[10px]"
                    rows={5}
                    placeholder="<!-- Google Tag Manager, FB Pixel vb. -->"
                />
            </div>
            <Button className="w-full" onClick={onSave}><Save className="mr-2 h-4 w-4"/> Kodları Kaydet</Button>
        </>
    );
}
