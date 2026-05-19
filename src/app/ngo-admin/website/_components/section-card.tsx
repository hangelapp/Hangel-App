'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SectionCardProps {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export function SectionCard({ icon, iconBg, title, description, enabled, onToggle, children }: SectionCardProps) {
    return (
        <Card className={cn(!enabled && "opacity-60")}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", iconBg)}>
                        {icon}
                    </div>
                    <div className="space-y-0.5">
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="text-xs">{description}</CardDescription>
                    </div>
                </div>
                <Switch
                    checked={enabled}
                    onCheckedChange={onToggle}
                    className="data-[state=checked]:bg-green-600"
                />
            </CardHeader>
            {enabled && (
                <CardContent className="space-y-6 pt-0">
                    {children}
                </CardContent>
            )}
        </Card>
    );
}
