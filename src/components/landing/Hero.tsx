"use client";

import { useState } from "react";
import { ChatInput } from "./ChatInput";
import { Marquee } from "./Marquee";
import { Sparkles } from "lucide-react";
import { YouTubePreview } from "@/components/YouTubePreview";
import { searchYouTube, YouTubeVideo } from "@/lib/youtube";

export function Hero() {
    const [showPreview, setShowPreview] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState("");

    const handleGenerate = async (prompt: string) => {
        setIsSearching(true);
        setCurrentPrompt(prompt);
        // Simulate "generating" a thumbnail by using a placeholder or just revealing the UI
        // In a real app, this would call the generation API.

        try {
            const results = await searchYouTube(prompt);
            setSearchResults(results);
            setShowPreview(true);
        } catch (error) {
            console.error("Failed to search YouTube:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <section className="relative flex min-h-[90vh] flex-col justify-between overflow-hidden bg-black pt-20">

            {/* YouTube Preview Overlay */}
            {showPreview && (
                <YouTubePreview
                    searchQuery={currentPrompt}
                    // Use a placeholder image that looks like a "generated" result. 
                    // ideally this would be the result from the generation API.
                    // For now, we use a generic placeholder or the first result's image as a "mock" 
                    // if we wanted to be tricky, but a static placeholder is safer to clearly show it's the "user's" slot.
                    userThumbnailUrl="https://images.unsplash.com/photo-1626544827763-d516dce335ca?w=800&q=80"
                    similarVideos={searchResults}
                    onClose={() => setShowPreview(false)}
                />
            )}

            {/* Background Effects */}
            <div className="absolute inset-0 bg-transparent z-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            </div>

            <div className="bg-primary/20 absolute -top-24 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full blur-[120px] pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 text-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>New: AI Reference Image Support</span>
                </div>

                <h1 className="mb-6 bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
                    Viral Thumbnails. <br />
                    <span className="text-white">In Seconds.</span>
                </h1>

                <p className="mb-8 max-w-2xl text-lg text-zinc-400">
                    Stop spending hours in Photoshop. Our AI generates high-CTR thumbnails tailored to your niche, style, and face.
                </p>

                <div className="w-full">
                    <ChatInput onGenerate={handleGenerate} />
                    {isSearching && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-primary animate-pulse">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm">Analyzing niche trends...</span>
                        </div>
                    )}
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
                </div>
            </div>

            {/* Bottom Marquee Area - Static Position */}
            <div className="relative h-[600px] w-full overflow-hidden z-0 -mt-12">
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
                {/* Radial Vignette Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,black_100%)] z-10 pointer-events-none opacity-80" />
                <Marquee />
            </div>
        </section>
    );
}
