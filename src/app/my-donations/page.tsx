import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleDollarSign, ShoppingBag, Search, Filter, ArrowDownUp } from 'lucide-react';
import { donationTransactions } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function MyDonationsPage() {
  const totalDonations = donationTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + parseFloat(curr.donationAmount), 0);

  const sortedDonations = [...donationTransactions].sort((a, b) => 
    parse(b.date, 'yyyy-MM-dd', new Date()).getTime() - parse(a.date, 'yyyy-MM-dd', new Date()).getTime()
  );

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
      
      <div>
        <h2 className="text-xl mb-2">İşlem Geçmişi</h2>
        <div className="flex justify-between items-center mb-2 gap-2">
            <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Ara..." className="pl-8 text-sm h-9 w-full" />
            </div>
            <div className='flex'>
                <Button variant="ghost" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                    <ArrowDownUp className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <Card>
          <CardContent className="p-0">
            <Accordion type="single" collapsible className="w-full">
              {sortedDonations.map(donation => (
                <AccordionItem key={donation.id} value={`item-${donation.id}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2 bg-muted rounded-full">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{donation.brand}</p>
                        <p className="text-xs text-muted-foreground">{donation.ngo || format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: tr })}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${donation.type === 'income' ? 'text-green-600' : ''}`}>{donation.purchaseAmount} ₺</p>
                        {donation.type === 'expense' && <p className="text-xs text-primary font-semibold">Bağış: {donation.donationAmount} ₺</p>}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 bg-muted/50">
                    <div className="space-y-2 text-sm mt-2 pt-4 border-t">
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Alışveriş Tutarı</span>
                        <span>{donation.purchaseAmount} ₺</span>
                      </div>
                      <div className='flex justify-between font-semibold'>
                        <span className='text-primary'>Bağış Tutarı</span>
                        <span className='text-primary'>{donation.donationAmount} ₺</span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>Desteklenen STK</span>
                        <span>{donation.ngo}</span>
                      </div>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>İşlem Tarihi</span>
                        <span>{format(parse(donation.date, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy - HH:mm', { locale: tr })}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
