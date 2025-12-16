import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Zap, Play } from "lucide-react";
import Image from "next/image";

export function Features() {
    const examples = [
        {
            title: "The Race That Changed Formula 1 FOREVER..",
            views: "4.5M views",
            image: "/images/thumbnail-f1.png",
            time: "2 days ago",
            duration: "18:42"
        },
        {
            title: "SECRET Tattoos Footballers Don't Talk About",
            views: "800K views",
            image: "/images/thumbnail-football.png",
            time: "5 days ago",
            duration: "12:15"
        },
        {
            title: "THE GREATEST FC 25 PACK OPENING SO FAR!",
            views: "3.7M views",
            image: "/images/thumbnail-fc25.png",
            time: "14 hours ago",
            duration: "24:39"
        },
        {
            title: "How One Person Destroyed 239 Lives",
            views: "2.2M views",
            image: "/images/thumbnail-documentary.png",
            time: "1 month ago",
            duration: "45:10"
        },
    ];

    return (
        <section className="bg-black py-24 text-white">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                        The Shortcut to <span className="text-primary">Millions</span> of Views
                    </h2>
                    <p className="mx-auto max-w-2xl text-zinc-400">
                        Stop guessing what works. Our AI generates thumbnails scientifically proven to stop the scroll and get the click.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {examples.map((item, i) => (
                        <Card key={i} className="group overflow-hidden border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-primary/5">
                            <div className={`relative aspect-video w-full overflow-hidden bg-zinc-800`}>
                                <Image
                                    src={item.image}
                                    alt={item.title}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">{item.duration}</div>
                            </div>
                            <CardContent className="p-4">
                                <h3 className="mb-2 line-clamp-2 text-sm font-bold text-white leading-tight">
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <div className="flex items-center gap-1 text-zinc-400">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>{item.views}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{item.time}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-16 grid gap-8 md:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-6 border border-zinc-900 rounded-2xl bg-zinc-950/50">
                        <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                            <Zap className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Instant Generation</h3>
                        <p className="text-sm text-zinc-400">Create professional thumbnails in seconds, not hours. 100% automated workflow.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-zinc-900 rounded-2xl bg-zinc-950/50">
                        <div className="mb-4 rounded-full bg-blue-500/10 p-4 text-blue-500">
                            <Users className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Face Swap Technology</h3>
                        <p className="text-sm text-zinc-400">Seamlessly integrate your face into any viral concept with advanced AI blending.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border border-zinc-900 rounded-2xl bg-zinc-950/50">
                        <div className="mb-4 rounded-full bg-green-500/10 p-4 text-green-500">
                            <Play className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">YouTube Optimized</h3>
                        <p className="text-sm text-zinc-400">Trained on millions of viral videos to understand exactly what drives high CTR.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
