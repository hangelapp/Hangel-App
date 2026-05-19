'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { Landmark, Smartphone } from 'lucide-react';

export function DonationsSection() {
    return (
        <>
            <div className="space-y-4">
                <div className="p-4 border rounded-2xl bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">hangel ile Bağış</span>
                        <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>
                <div className="p-4 border rounded-2xl bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">HelpSteps ile Bağış</span>
                        <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>
                <div className="p-4 border rounded-2xl bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold">SMS ile Bağış</span>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Kısa Kod</Label>
                            <Input placeholder="3406" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Anahtar Kelime</Label>
                            <Input placeholder="AHBAP" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Operatör Seçimi</Label>
                            <div className="flex flex-wrap gap-4 pt-1">
                                <div className="flex items-center space-x-2"><Checkbox id="op-tr" defaultChecked /><Label htmlFor="op-tr" className="text-xs">Turkcell</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="op-vd" defaultChecked /><Label htmlFor="op-vd" className="text-xs">Vodafone</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="op-tt" defaultChecked /><Label htmlFor="op-tt" className="text-xs">T.Telekom</Label></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border rounded-2xl bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Banka EFT/Havale</span>
                        <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>
            </div>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/manage-profile">
                    <Landmark className="mr-2 h-4 w-4" /> Banka Bilgilerini Düzenle
                </Link>
            </Button>
        </>
    );
}
