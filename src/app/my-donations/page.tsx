import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, ShoppingBag } from 'lucide-react';
import { donationTransactions } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, isToday, isYesterday, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

type GroupedDonations = {
  [key: string]: typeof donationTransactions;
};

export default function MyDonationsPage() {
  const totalDonations = donationTransactions.reduce((acc, curr) => acc + parseFloat(curr.donationAmount.replace(' ₺', '')), 0);

  const groupedDonations = donationTransactions.reduce((acc: GroupedDonations, donation) => {
    const date = parse(donation.date, 'dd MMMM yyyy', new Date(), { locale: tr });
    let key = '';
    if (isToday(date)) {
      key = 'Bugün';
    } else if (isYesterday(date)) {
      key = 'Dün';
    } else {
      key = format(date, 'dd MMMM yyyy, EEEE', { locale: tr });
    }
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(donation);
    return acc;
  }, {});

  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Bağışlarım</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CircleDollarSign className="text-primary" />
            Toplam Bağış
          </CardTitle>
          <CardDescription>Alışverişlerinizle yarattığınız toplam etki.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-3xl font-bold">{totalDonations.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {Object.entries(groupedDonations).map(([date, donationsOnDate]) => (
          <div key={date}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">{date}</h2>
            <Card>
                <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                     {donationsOnDate.map(donation => (
                        <AccordionItem key={donation.id} value={`item-${donation.id}`} className="border-b last:border-b-0">
                             <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-2 bg-muted rounded-full">
                                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold">{donation.brand}</p>
                                        <p className="text-xs text-muted-foreground">{donation.ngo}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{donation.purchaseAmount}</p>
                                        <p className="text-xs text-primary font-semibold">Bağış: {donation.donationAmount}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 bg-muted/50">
                                <div className="space-y-2 text-sm mt-2 pt-4 border-t">
                                    <div className='flex justify-between'>
                                        <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                                        <span>{donation.purchaseAmount}</span>
                                    </div>
                                    <div className='flex justify-between font-semibold'>
                                        <span className='text-primary'>Bağış Tutarı</span>
                                        <span className='text-primary'>{donation.donationAmount}</span>
                                    </div>
                                    <div className='flex justify-between text-xs'>
                                        <span className='text-muted-foreground'>Desteklenen STK</span>
                                        <span>{donation.ngo}</span>
                                    </div>
                                     <div className='flex justify-between text-xs'>
                                        <span className='text-muted-foreground'>İşlem Tarihi</span>
                                        <span>{donation.date}</span>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                     ))}
                    </Accordion>
                </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
