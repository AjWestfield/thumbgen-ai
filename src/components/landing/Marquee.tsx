import { cn } from "@/lib/utils";
import Image from "next/image";

// Array of local images with titles matching pikzels.com
const thumbnails = [
    // Top row (1-9)
    { src: "/images/marquee/thumb-1.webp", views: "4.5M views", title: "The Race That Changed Formula 1 FOREVER.." },
    { src: "/images/marquee/thumb-2.webp", views: "800K views", title: "SECRET Tattoos Footballers Don't Talk About" },
    { src: "/images/marquee/thumb-3.webp", views: "3.7M views", title: "THE GREATEST FC 25 PACK OPENING SO FAR!" },
    { src: "/images/marquee/thumb-4.webp", views: "2.2M views", title: "How One Person Destroyed 239 Lives" },
    { src: "/images/marquee/thumb-5.webp", views: "1.1M views", title: "Millionaires VS Billionaires - What Are The Differences?" },
    { src: "/images/marquee/thumb-6.webp", views: "400K views", title: "How Samuel Onuha Sniffed His Way to Prison" },
    { src: "/images/marquee/thumb-7.webp", views: "1.3M views", title: "Trump's Tariff Plan Explained" },
    { src: "/images/marquee/thumb-8.webp", views: "1M views", title: "They Just Ripped Off – A Simple Mistake with Dire.." },
    { src: "/images/marquee/thumb-9.webp", views: "700K views", title: "The Unluckiest Racer of ALL TIME" },
    // Bottom row (10-18)
    { src: "/images/marquee/thumb-10.webp", views: "100K views", title: "This AI Image Generator Blew my Mind!" },
    { src: "/images/marquee/thumb-11.webp", views: "1.5M views", title: "Level 1 to 100 Mind F*ck Paradox to Fall Asleep to" },
    { src: "/images/marquee/thumb-12.webp", views: "400K views", title: "Iman Gadzhi Has Completely Lost His Mind.." },
    { src: "/images/marquee/thumb-13.webp", views: "3.6M views", title: "Extreme Stories of Revenge That Went Too Far - Part 5" },
    { src: "/images/marquee/thumb-14.webp", views: "900K views", title: "The Unfathomable Wealth of Pablo Escobar" },
    { src: "/images/marquee/thumb-15.webp", views: "1.4M views", title: "Dubai's Insane $100B Branded Megaprojects" },
    { src: "/images/marquee/thumb-16.webp", views: "1.5M views", title: "How History's Biggest Idiot Accidentally Became a.." },
    { src: "/images/marquee/thumb-17.webp", views: "3.4M views", title: "The Satisfying Downfall of Ashton Hall" },
    { src: "/images/marquee/thumb-18.webp", views: "500K views", title: "JE TRANSFÈRE MBAPPÉ À L'AS BONDY !" },
];

// Split into 2 rows
const row1 = thumbnails.slice(0, 9);
const row2 = thumbnails.slice(9, 18);

interface MarqueeItem {
    src: string;
    views: string;
    title: string;
}

function MarqueeRow({ images, reverse = false, duration = 40 }: { images: MarqueeItem[], reverse?: boolean, duration?: number }) {
    return (
        <div className="flex overflow-hidden w-full select-none pointer-events-none opacity-100">
            <div
                className={cn(
                    "flex flex-shrink-0 gap-6 min-w-full", // Increased gap
                    reverse ? "animate-marquee-horizontal-reverse" : "animate-marquee-horizontal"
                )}
                style={
                    {
                        "--duration": `${duration}s`
                    } as React.CSSProperties
                }
            >
                {images.concat(images).concat(images).map((item, i) => ( // Triple concat for safety
                    <div key={i} className="flex flex-col gap-3 w-80 flex-shrink-0 group">
                        {/* Thumbnail Image */}
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-md">
                            <Image
                                src={item.src}
                                alt={item.title}
                                fill
                                sizes="320px"
                                className="object-cover"
                            />
                        </div>

                        {/* Text Content Below */}
                        <div className="flex flex-col gap-1 pr-2">
                            <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                                {item.title}
                            </h3>
                            <span className="text-xs text-zinc-400 font-medium">
                                {item.views}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function Marquee() {
    return (
        <div
            className="relative flex w-full h-full flex-col justify-center gap-10 overflow-hidden py-4"
            style={{
                maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
            }}
        >

            {/* Marquee Container */}
            <div className="flex flex-col gap-10 scale-100">
                <MarqueeRow images={row1} duration={100} />
                <MarqueeRow images={row2} reverse duration={100} />
            </div>
        </div>
    );
}
