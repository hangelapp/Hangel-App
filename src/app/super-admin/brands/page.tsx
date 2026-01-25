import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { allEntityLists } from "@/lib/data";

export default function BrandsPage() {
    const brands = allEntityLists.filter(e => e.type === 'brand');
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Marka Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Markalar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm markaları görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {brands.map(brand => (
                       <div key={brand.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <Avatar>
                                   <AvatarImage src={brand.logoUrl} alt={brand.name} />
                                   <AvatarFallback>{brand.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{brand.name}</p>
                                   <p className="text-sm text-muted-foreground">{brand.category}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-primary">%{brand.donationRate}</span>
                               <Button variant="outline" size="sm">Profili Düzenle</Button>
                               <Button variant="outline" size="sm">Pasife Al</Button>
                               <Button variant="destructive" size="sm">Kaldır</Button>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
