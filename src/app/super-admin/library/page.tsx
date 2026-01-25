
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { librarySections } from "@/lib/library";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle } from "lucide-react";

export default function LibraryPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Kütüphane Yönetimi</h1>
                <Button><PlusCircle className="mr-2 h-4 w-4"/>Yeni İçerik Ekle</Button>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Kütüphane İçerikleri</CardTitle>
                    <CardDescription>
                        Kütüphaneye yeni içerikler ekleyin, mevcutları düzenleyin veya silin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {librarySections.map(section => (
                            <AccordionItem key={section.slug} value={section.slug} className="border rounded-lg px-4 bg-background">
                                <AccordionTrigger className="hover:no-underline text-left font-bold">{section.title} ({section.items.length})</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <div className="space-y-2 border-t pt-4">
                                        {section.items.map(item => ( 
                                            <div key={item.slug} className="p-2 border-b flex justify-between items-center">
                                                <p className="text-sm">{item.title}</p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm">Düzenle</Button>
                                                    <Button variant="destructive" size="sm">Sil</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    )
}
