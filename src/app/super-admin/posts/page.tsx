
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"

const posts = [
    { id: 1, author: 'TEMA Vakfı', avatar: 'https://logo.clearbit.com/tema.org.tr', content: 'Fidan dikme etkinliğimize katılan herkese teşekkürler!', imageUrl: 'https://picsum.photos/seed/post1/600/300', status: 'Aktif' },
    { id: 2, author: 'Ahbap Derneği', avatar: 'https://logo.clearbit.com/ahbap.org', content: 'Yardım kolilerimiz yola çıktı, destekleriniz için minnettarız.', imageUrl: null, status: 'Onay Bekliyor' },
];

export default function PostsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Gönderi Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Gönderiler</CardTitle>
                    <CardDescription>
                        Platformdaki gönderileri yönetin, onaylayın, pasife alın veya silin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {posts.map(post => (
                       <Card key={post.id}>
                           <CardHeader className="flex-row items-center gap-4">
                               <Avatar>
                                   <AvatarImage src={post.avatar} />
                                   <AvatarFallback>{post.author.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{post.author}</p>
                                   <p className="text-sm text-muted-foreground">{post.status}</p>
                               </div>
                           </CardHeader>
                           <CardContent>
                               <p>{post.content}</p>
                               {post.imageUrl && (
                                   <div className="relative mt-4 aspect-video rounded-md overflow-hidden">
                                       <Image src={post.imageUrl} alt="Post Image" fill className="object-cover" />
                                   </div>
                               )}
                           </CardContent>
                           <CardFooter className="flex gap-2">
                               {post.status === 'Onay Bekliyor' && <Button size="sm" className="bg-green-600 hover:bg-green-700">Onayla</Button>}
                               {post.status === 'Aktif' && <Button variant="outline" size="sm">Pasife Al</Button>}
                               <Button variant="destructive" size="sm">Sil</Button>
                           </CardFooter>
                       </Card>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
