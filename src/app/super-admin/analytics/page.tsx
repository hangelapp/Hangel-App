import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AnalyticsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Platform Analizleri</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Genel Bakış</CardTitle>
                    <CardDescription>
                        Platformun genel kullanım, büyüme ve etki metrikleri.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>Detaylı grafikler ve analizler burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
