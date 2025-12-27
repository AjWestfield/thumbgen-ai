"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Animated Dot Grid Background Component (inspired by storyshort.ai)
function AnimatedDotGrid() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Main dot grid pattern */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Horizontal grid lines */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `linear-gradient(to bottom, transparent 23px, rgba(255, 255, 255, 0.03) 23px, rgba(255, 255, 255, 0.03) 24px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Vertical grid lines */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `linear-gradient(to right, transparent 23px, rgba(255, 255, 255, 0.03) 23px, rgba(255, 255, 255, 0.03) 24px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Animated glowing dots at random intersections */}
            <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }} />
            <div className="absolute top-[35%] left-[75%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
            <div className="absolute top-[60%] left-[25%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
            <div className="absolute top-[75%] left-[85%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3s' }} />
            <div className="absolute top-[45%] left-[45%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '2s', animationDuration: '3s' }} />
            <div className="absolute top-[85%] left-[35%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '0.75s', animationDuration: '3s' }} />
            <div className="absolute top-[15%] left-[55%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '3s' }} />
            <div className="absolute top-[50%] left-[90%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '1.25s', animationDuration: '3s' }} />

            {/* Radial fade from center - expanded transparent area to not clip text */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_50%,rgba(0,0,0,0.3)_85%,rgba(0,0,0,0.6)_100%)]" />
        </div>
    );
}

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

    const [showSwapped, setShowSwapped] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowSwapped(prev => !prev);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section id="features" className="bg-black py-24 text-white">
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
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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

                {/* Second Section - AI-Powered Features */}
                <div className="relative mt-32 py-24 -mx-4 px-4 md:-mx-8 md:px-8">
                    {/* Animated Dot Grid Background */}
                    <AnimatedDotGrid />

                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            AI-Powered Features
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
                            Powered by <span className="text-primary">Advanced AI</span>
                        </h2>
                        <p className="mx-auto max-w-xl text-zinc-400">
                            Our cutting-edge technology makes creating viral thumbnails effortless.
                        </p>
                    </motion.div>

                    {/* Connection Line & Surge Effect */}
                    <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 hidden md:block overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                x: ["-100%", "100%"],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                                repeatDelay: 1
                            }}
                            className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm"
                        />
                    </div>

                    {/* Feature Cards */}
                    <div className="grid gap-6 md:grid-cols-3">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="group relative border border-zinc-800 rounded-2xl bg-zinc-900/80 backdrop-blur-sm overflow-hidden hover:border-zinc-700 transition-all duration-300"
                        >
                            {/* Image Container */}
                            <div className="relative w-full aspect-[4/3] bg-zinc-800/30 overflow-hidden">
                                <Image
                                    src="/images/feature-instant-ui.png"
                                    alt="Instant Generation UI"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Text Content */}
                            <div className="p-5 text-center">
                                <h3 className="text-lg font-bold text-white mb-1">Instant Generation</h3>
                                <p className="text-sm text-zinc-400">Create professional thumbnails in seconds, not hours.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="group relative border border-zinc-800 rounded-2xl bg-zinc-900/80 backdrop-blur-sm overflow-hidden hover:border-zinc-700 transition-all duration-300"
                        >
                            {/* Image Container */}
                            <div className="relative w-full aspect-[4/3] bg-zinc-800/30 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={showSwapped ? "swapped" : "source"}
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="absolute inset-0"
                                    >
                                        <Image
                                            src={showSwapped ? "/images/feature-face-result-consistent.png" : "/images/feature-face-split.png"}
                                            alt={showSwapped ? "Face Swapped Result" : "Original vs Target"}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                            priority
                                            className="object-contain"
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Transition Indicator */}
                                <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 text-xs font-mono text-white/90 border border-white/10">
                                    {showSwapped ? "RESULT" : "INPUT"}
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="p-5 text-center">
                                <h3 className="text-lg font-bold text-white mb-1">Face Swap Technology</h3>
                                <p className="text-sm text-zinc-400">Seamlessly integrate your face into any viral concept.</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="group relative border border-zinc-800 rounded-2xl bg-zinc-900/80 backdrop-blur-sm overflow-hidden hover:border-zinc-700 transition-all duration-300"
                        >
                            {/* Image Container */}
                            <div className="relative w-full aspect-[4/3] bg-zinc-800/30 overflow-hidden">
                                <Image
                                    src="/images/feature-youtube-feed.png"
                                    alt="YouTube Optimized Feed"
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Text Content */}
                            <div className="p-5 text-center">
                                <h3 className="text-lg font-bold text-white mb-1">YouTube Optimized</h3>
                                <p className="text-sm text-zinc-400">Trained on millions of viral videos to drive high CTR.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
