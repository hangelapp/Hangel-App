import {
  Activity,
  ArrowUpRight,
  Building,
  Store,
  CreditCard,
  DollarSign,
  Users,
  FileText,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from 'next/link'

export default function SuperAdminDashboard() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Genel Bakış</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14,234</div>
              <p className="text-xs text-muted-foreground">
                +20.1% geçen aydan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Onay Bekleyen Başvurular
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">
                32 STK, 120 Marka, 421 Kulüp
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif STK</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground">
                +19% geçen aydan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Marka</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">542</div>
              <p className="text-xs text-muted-foreground">
                +201 geçen aydan
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Onay Bekleyen Başvurular</CardTitle>
                <CardDescription>
                  Onay bekleyen son STK ve Marka başvuruları.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/super-admin/applications">
                  Tümünü Gör
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kuruluş</TableHead>
                    <TableHead className="hidden xl:table-column">
                      Tip
                    </TableHead>
                    <TableHead className="hidden xl:table-column">
                      Durum
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Başvuru Tarihi
                    </TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Toplum Gönüllüleri Vakfı</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        iletisim@tog.org.tr
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      STK
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      <Badge className="text-xs" variant="outline">
                        Beklemede
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell lg:table-column">
                      2023-06-23
                    </TableCell>
                    <TableCell className="text-right">
                        <Button size="sm">İncele</Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">Sürdürülebilir Adımlar Atölyesi</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        info@surdurulebiliradimlar.com
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                      Marka
                    </TableCell>
                    <TableCell className="hidden xl:table-column">
                       <Badge className="text-xs" variant="outline">
                        Beklemede
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell lg:table-column">
                      2023-06-24
                    </TableCell>
                     <TableCell className="text-right">
                        <Button size="sm">İncele</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Son Kullanıcılar</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8">
              <div className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src="https://i.pravatar.cc/150?u=olivia" alt="Avatar" />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Olivia Martin</p>
                  <p className="text-sm text-muted-foreground">
                    olivia.martin@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+1,999.00 Puan</div>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="hidden h-9 w-9 sm:flex">
                  <AvatarImage src="https://i.pravatar.cc/150?u=jackson" alt="Avatar" />
                  <AvatarFallback>JL</AvatarFallback>
                </Avatar>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">Jackson Lee</p>
                  <p className="text-sm text-muted-foreground">
                    jackson.lee@email.com
                  </p>
                </div>
                <div className="ml-auto font-medium">+39.00 Puan</div>
              </div>
            </CardContent>
          </Card>
        </div>
    </>
  )
}
