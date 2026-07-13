

"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, ArrowDownUp, Filter, Eye, Trash2, CheckCircle, Hourglass, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Application } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { EmptyState } from '@/components/shared/empty-state';
import { FileSearch, Inbox } from 'lucide-react';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';


export default function MyApplicationsPage() {
  const { t } = useTranslation();
  const { user: authUser } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('Gönüllülük');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('Tümü');
  // Veri modeli sabit (TR enum); UI'da görünüm i18n key ile çevrilir.
  const allStatuses = ['Tümü', 'Onaylandı', 'Beklemede', 'Reddedildi'] as const;
  const { toast } = useToast();

  const applicationsQuery = useMemoFirebase(
    () => authUser ? query(collection(db, COLLECTIONS.applications), where('userId', '==', authUser.uid)) : null,
    [db, authUser?.uid]
  );
  const { data: firestoreApps, isLoading } = useCollection<Application>(applicationsQuery);
  const [withdrawnIds, setWithdrawnIds] = useState<string[]>([]);

  const applications = useMemo(() =>
    (firestoreApps || []).filter(app => !withdrawnIds.includes(app.id)),
    [firestoreApps, withdrawnIds]
  );

  const handleWithdrawApplication = (appId: string, appTitle: string) => {
    setWithdrawnIds(prev => [...prev, appId]);
    toast({
      title: t('dashboard.applications.toastWithdrawnTitle'),
      description: `${t('dashboard.applications.toastWithdrawnDescPrefix')}${appTitle}${t('dashboard.applications.toastWithdrawnDescSuffix')}`,
    });
  };

  const filteredApps = useMemo(() => {
    let apps = activeTab === 'Tümü'
      ? applications
      : applications.filter(app => app.type === activeTab);

    if (searchTerm) {
      apps = apps.filter(app => app.title.toLowerCase().includes(searchTerm.toLowerCase()) || app.org.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (statusFilter !== 'Tümü') {
      apps = apps.filter(app => app.status === statusFilter);
    }

    apps.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return apps;
  }, [activeTab, searchTerm, sortOrder, statusFilter, applications]);

  const ApplicationCard = ({ app, onWithdraw }: { app: Application, onWithdraw: (id: string, title: string) => void }) => {
    const router = useRouter();
    const getEntityLink = () => {
      if (!app.entityId) return '#';
      switch (app.type) {
        case 'Gönüllülük': return `/volunteering/${app.entityId}`;
        case 'Kulüpler': return `/admin/clubs/profile/${app.entityId}`;
        default: return '#';
      }
    };

    // Kartın tamamı yalnızca gerçek bir hedef varsa tıklanabilir ('#' değil).
    // Anchor yerine router.push kullanılır → iç içe <a> hatası oluşmaz
    // (butondaki mevcut <Link> tek anchor olarak kalır).
    const entityLink = getEntityLink();
    const isClickable = entityLink !== '#';

    const StatusIcon = {
      'Onaylandı': <CheckCircle className="h-5 w-5 text-green-600" />,
      'Beklemede': <Hourglass className="h-5 w-5 text-yellow-500" />,
      'Reddedildi': <XCircle className="h-5 w-5 text-destructive" />,
    }[app.status];

    return (
      <Card
        className={cn(
          'transition-colors',
          isClickable && 'cursor-pointer hover:bg-accent/50 hover:border-primary/30',
        )}
        {...(isClickable
          ? {
              role: 'link',
              tabIndex: 0,
              onClick: () => router.push(entityLink),
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(entityLink);
                }
              },
            }
          : {})}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base break-words">{app.title}</CardTitle>
            <CardDescription className="break-words">{app.org} - {app.location}</CardDescription>
          </div>
          <div className='shrink-0 space-y-1 text-right'>
            <div className="flex items-center justify-end gap-1.5">
              <span className="shrink-0">{StatusIcon}</span>
              <p className="text-sm font-semibold">{t(`dashboard.applications.statuses.${app.status}`)}</p>
            </div>
            <p className='text-xs text-muted-foreground'>{app.date}</p>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-sm space-y-4">
          {app.status === 'Reddedildi' && app.rejectionReason && (
            <Alert variant="destructive">
              <AlertTitle>{t('dashboard.applications.rejectionTitle')}</AlertTitle>
              <AlertDescription>{app.rejectionReason}</AlertDescription>
            </Alert>
          )}
          {/* Kart tıklanabilir olduğunda buton kendi navigasyonunu yapar;
              çift tetiklenmeyi ve dialog açılırken kart yönlendirmesini
              önlemek için buton satırında propagation durdurulur. */}
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            <Button asChild variant="secondary" className="min-w-0 flex-1 basis-40">
              <Link href={getEntityLink()}>
                <Eye className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">{t('dashboard.applications.viewListing')}</span>
              </Link>
            </Button>
            {app.status === 'Beklemede' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="min-w-0 flex-1 basis-40">
                    <Trash2 className="mr-2 h-4 w-4 shrink-0" /> <span className="truncate">{t('dashboard.applications.withdrawCta')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('dashboard.applications.withdrawTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('dashboard.applications.withdrawDescPrefix')}&quot;{app.title}&quot;{t('dashboard.applications.withdrawDescSuffix')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('dashboard.applications.withdrawCancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onWithdraw(app.id, app.title)} className={cn(buttonVariants({ variant: "destructive" }))}>
                      {t('dashboard.applications.withdrawConfirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const NoMatchState = () => (
    <EmptyState
      icon={FileSearch}
      title={t('dashboard.applications.noMatchTitle')}
      description={t('dashboard.applications.noMatchDesc')}
    />
  );

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">{t('dashboard.applications.heading')}</h1>
          <p className="text-muted-foreground text-sm">{t('dashboard.applications.subheading')}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/my-applications/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('dashboard.applications.newApplication')}
          </Link>
        </Button>
      </div>

      <div className="p-0 flex gap-2 items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('dashboard.applications.searchPlaceholder')}
            className="pl-10 h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.filter')}><Filter className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('dashboard.applications.filterByStatus')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allStatuses.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={statusFilter === status}
                onCheckedChange={() => setStatusFilter(status)}
              >
                {t(`dashboard.applications.statuses.${status}`)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.sort')}><ArrowDownUp className="h-5 w-5" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSortOrder('desc')}>{t('dashboard.applications.sortNewest')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortOrder('asc')}>{t('dashboard.applications.sortOldest')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !authUser ? (
        <div className="text-center text-muted-foreground p-16">{t('dashboard.applications.loginPrompt')}</div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t('dashboard.applications.emptyTitle')}
          description={t('dashboard.applications.emptyDesc')}
          action={{ label: t('dashboard.applications.emptyAction'), href: '/events' }}
        />
      ) : (
        <Tabs defaultValue="Gönüllülük" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="Gönüllülük" className="min-w-0 truncate px-1.5 text-xs sm:px-3 sm:text-sm">{t('dashboard.applications.tabVolunteer')}</TabsTrigger>
            <TabsTrigger value="Kulüpler" className="min-w-0 truncate px-1.5 text-xs sm:px-3 sm:text-sm">{t('dashboard.applications.tabClubs')}</TabsTrigger>
            <TabsTrigger value="STK" className="min-w-0 truncate px-1.5 text-xs sm:px-3 sm:text-sm">{t('dashboard.applications.tabNgo')}</TabsTrigger>
            <TabsTrigger value="Marka" className="min-w-0 truncate px-1.5 text-xs sm:px-3 sm:text-sm">{t('dashboard.applications.tabBrand')}</TabsTrigger>
          </TabsList>
          {['Gönüllülük', 'Kulüpler', 'STK', 'Marka'].map(tab => (
            <TabsContent key={tab} value={tab} className='mt-4'>
              {filteredApps.length > 0 ? (
                <div className="space-y-4">
                  {filteredApps.map(app => <ApplicationCard key={app.id} app={app} onWithdraw={handleWithdrawApplication} />)}
                </div>
              ) : <NoMatchState />}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
