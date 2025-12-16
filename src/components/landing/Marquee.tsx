import { cn } from "@/lib/utils";
import Image from "next/image";

// Array of local images we downloaded
// Array of local images with mock view counts and titles
const thumbnails = [
    { src: "/images/marquee/thumb-1.webp", views: "1.2M views", title: "I Spent 100 Hours in Minecraft Hardcore" },
    { src: "/images/marquee/thumb-2.webp", views: "850K views", title: "The Truth About AI Generated Art" },
    { src: "/images/marquee/thumb-3.webp", views: "2.1M views", title: "Building the Ultimate Gaming Setup" },
    { src: "/images/marquee/thumb-4.webp", views: "450K views", title: "Why This Camera Changed Everything" },
    { src: "/images/marquee/thumb-5.webp", views: "1.8M views", title: "Surviving 24 Hours in the Desert" },
    { src: "/images/marquee/thumb-6.webp", views: "920K views", title: "Top 10 Hidden Features in iOS 18" },
    { src: "/images/marquee/thumb-7.webp", views: "3.4M views", title: "I Ate at the Worst Review Restaurant" },
    { src: "/images/marquee/thumb-8.webp", views: "125K views", title: "Coding a SaaS in 1 Week" },
    { src: "/images/marquee/thumb-9.webp", views: "670K views", title: "The End of an Era: Final Update" },
    { src: "/images/marquee/thumb-10.webp", views: "1.5M views", title: "Unboxing the $10,000 Apple Vision Pro" },
    { src: "/images/marquee/thumb-11.webp", views: "2.9M views", title: "How to Grow Your Channel Fast" },
    { src: "/images/marquee/thumb-12.webp", views: "580K views", title: "Reviewing Your Terrible Setups" },
    { src: "/images/marquee/thumb-13.webp", views: "1.1M views", title: "MrBeast's Secret Strategy Exposed" },
    { src: "/images/marquee/thumb-14.webp", views: "340K views", title: "Solving the Hardest Riddle" },
    { src: "/images/marquee/thumb-15.webp", views: "2.3M views", title: "Camped in a Haunted Forest" },
    { src: "/images/marquee/thumb-16.webp", views: "980K views", title: "Custom Keyboard Build ASMR" },
    { src: "/images/marquee/thumb-17.webp", views: "1.7M views", title: "The Fastest Car in the World" },
    { src: "/images/marquee/thumb-18.webp", views: "4.2M views", title: "100 Mystery Buttons: Only 1 Escapes" },
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

            {/* Marquee Container with increased scaling/spacing if needed */}
            <div className="flex flex-col gap-10 scale-100">
                <MarqueeRow images={row1} duration={60} />
                <MarqueeRow images={row2} reverse duration={60} />
            </div>
        </div>
    );
}
