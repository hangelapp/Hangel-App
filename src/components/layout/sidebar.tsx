'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarMenuBadge,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  Bell,
  Gift,
  HandHeart,
  Home,
  LayoutGrid,
  Settings,
  ShieldAlert,
  Star,
  Store,
  Users,
  BookUser
} from 'lucide-react'
import { HangelLogo } from '@/components/icons'
import { UserAvatar } from '../shared/user-avatar'
import { Button } from '../ui/button'
import Link from 'next/link'

const sideMenuItems = [
    { href: '/timeline', icon: Home, label: 'Zaman Tüneli' },
    { href: '/market', icon: Store, label: 'Market' },
    { href: '/volunteer', icon: HandHeart, label: 'Gönüllülük' },
    { href: '/my-donations', icon: Gift, label: 'Bağışlarım' },
    { href: '/my-applications', icon: BookUser, label: 'Başvurularım' },
    { href: '/my-badges', icon: Star, label: 'Rozetlerim' },
];

const secondaryMenuItems = [
    { href: '/notifications', icon: Bell, label: 'Bildirimler', badge: '8' },
    { href: '/invite', icon: Users, label: 'Arkadaş Davet Et' },
    { href: '/admin', icon: LayoutGrid, label: 'Yönetim' },
    { href: '/settings', icon: Settings, label: 'Ayarlar' },
];

export default function AppSidebar() {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <HangelLogo className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold">hangel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
            {sideMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                    <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton asChild tooltip={item.label}>
                            <a>
                                <item.icon />
                                <span>{item.label}</span>
                            </a>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
        <SidebarSeparator />
        <SidebarMenu>
             {secondaryMenuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                     <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton asChild tooltip={item.label}>
                            <a>
                                <item.icon />
                                <span>{item.label}</span>
                                {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                            </a>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <Link href="/profile" passHref legacyBehavior>
            <SidebarMenuButton asChild tooltip="Profil">
                <a>
                    <UserAvatar className="h-8 w-8" />
                    <div className="flex flex-col">
                        <span className="font-semibold">Ayşe Yılmaz</span>
                        <span className="text-xs text-muted-foreground">@ayseyilmaz</span>
                    </div>
                </a>
            </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </>
  )
}
