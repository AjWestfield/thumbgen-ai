import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2 } from "lucide-react";

export function Testimonials() {
    const reviews = [
        {
            name: "Youssef Ayman",
            role: "YouTuber (U.A.E.)",
            text: "Truly shocked of the quality. The first ever AI to be able to make images that are worthy for a YouTube thumbnail in this day and age, truly incredible.",
            avatar: "/images/avatar-youssef.png",
            initials: "YA"
        },
        {
            name: "Rex Freiberger",
            role: "Creator (US)",
            text: "I've tested several AI image generators from Midjourney to DallE and ThumbZap is one of the most accurate thumbnail creators on the web.",
            avatar: "/images/avatar-rex.png",
            initials: "RF"
        },
        {
            name: "Rico Griek",
            role: "Channel Manager",
            text: "ThumbZap made us $60K in 1 month! It was always difficult to make thumbnails that aligned with our vision. I was skeptical but it delivered.",
            avatar: "/images/avatar-rico.png",
            initials: "RG"
        },
        {
            name: "Sidharth Das",
            role: "Small YouTuber",
            text: "ThumbZap is a god send. I have been using it for a month now and honestly the results are super impressive. It saves me the headache.",
            avatar: "/images/avatar-sidharth.png",
            initials: "SD"
        },
    ];

    return (
        <section className="relative overflow-hidden bg-black py-24">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />

            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <Badge variant="outline" className="mb-4 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10">Community Love</Badge>
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">
                        Don&apos;t Just Take <span className="text-primary">Our Word</span> For It
                    </h2>
                    <p className="text-zinc-400">
                        Join thousands of creators skyrocketing their CTR.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {reviews.map((review, i) => (
                        <Card key={i} className="border-zinc-800 bg-black/40 backdrop-blur-sm">
                            <CardContent className="p-6">
                                <div className="mb-4 flex gap-1 text-yellow-500">
                                    <Star className="h-4 w-4 fill-current" />
                                    <Star className="h-4 w-4 fill-current" />
                                    <Star className="h-4 w-4 fill-current" />
                                    <Star className="h-4 w-4 fill-current" />
                                    <Star className="h-4 w-4 fill-current" />
                                </div>
                                <p className="mb-6 text-lg text-zinc-300 leading-relaxed">
                                    &quot;{review.text}&quot;
                                </p>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={review.avatar} alt={review.name} />
                                        <AvatarFallback className="bg-zinc-800 text-zinc-400">{review.initials}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-white">{review.name}</h4>
                                            <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                        </div>
                                        <p className="text-sm text-zinc-500">{review.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
