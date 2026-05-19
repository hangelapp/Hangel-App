'use client';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { colorOptions } from './constants';

interface ColorsSectionProps {
    primaryColor: string;
    onColorChange: (value: string) => void;
}

export function ColorsSection({ primaryColor, onColorChange }: ColorsSectionProps) {
    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {colorOptions.map((color) => (
                    <div
                        key={color.value}
                        onClick={() => onColorChange(color.value)}
                        className={cn(
                            "p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2",
                            primaryColor.toLowerCase() === color.value.toLowerCase() ? "border-primary bg-primary/5 shadow-md scale-105" : "hover:border-primary/30"
                        )}
                    >
                        <div className="w-10 h-10 rounded-full shadow-inner border-2 border-white" style={{ backgroundColor: color.value }} />
                        <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase">{color.value}</span>
                        <span className="text-xs font-semibold">{color.name}</span>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t space-y-4">
                <Label className="text-sm font-bold">Özel Renk Girişi</Label>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <span className="text-sm font-mono text-muted-foreground">#</span>
                        <Input
                            value={primaryColor.replace('#', '')}
                            onChange={(e) => onColorChange(`#${e.target.value}`)}
                            placeholder="FFFFFF"
                            className="font-mono uppercase"
                            maxLength={6}
                        />
                    </div>
                    <div className="relative group">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-12 h-12 rounded-full cursor-pointer border-2 border-white shadow-md appearance-none overflow-hidden"
                        />
                        <div className="absolute inset-0 rounded-full border border-black/5 pointer-events-none" />
                    </div>
                    <p className="text-xs text-muted-foreground">Renk paletinden seçmek için tıklayın.</p>
                </div>
            </div>
        </>
    );
}
