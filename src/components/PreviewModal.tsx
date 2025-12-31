import { useState } from "react";
import { CheckCircle2, X, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "./ui/button";
import type { GeneratedMetadata } from "@/lib/youtube";
import { ThumbnailScore } from "./ThumbnailScore";

interface PreviewModalProps {
    thumbnailUrl?: string | null;
    onClose: () => void;
    onSelectLayout: (layout: 'home' | 'watch') => void;
    generatedMetadata?: GeneratedMetadata;
    isLoading?: boolean;
    isViewOnly?: boolean; // When true, skip generation animation (for viewing existing thumbnails)
    onRegenerateWithImprovements?: (improvements: string[]) => void;
    isRegenerating?: boolean;
}

export function PreviewModal({ thumbnailUrl, onClose, onSelectLayout, generatedMetadata, isLoading = false, isViewOnly = false, onRegenerateWithImprovements, isRegenerating = false }: PreviewModalProps) {
    // In view-only mode, never show loading animation for the thumbnail itself
    const showThumbnailLoading = isLoading && !isViewOnly;
    const [showScorePanel, setShowScorePanel] = useState(false);
    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="relative w-full max-w-6xl h-[80vh] bg-[#0f0f0f] border border-[#272727] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 transition-colors"
                >
                    <X className="w-6 h-6" />
                </Button>

                {/* Left Side: Immersive Image Preview */}
                <div className="w-full md:w-3/5 bg-[#050505] relative flex flex-col items-center justify-center p-12 border-b md:border-b-0 md:border-r border-[#272727]">
                    {/* Status Banner */}
                    <div className="absolute top-0 left-0 right-0 p-8 flex justify-center">
                        {showThumbnailLoading ? (
                            <div className="flex items-center gap-2 font-medium bg-primary/10 px-6 py-2.5 rounded-full border border-primary/20 shadow-[0_0_15px_-3px_rgba(var(--primary),0.2)]">
                                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                                <span className="animate-shimmer-text bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent font-semibold">
                                    Generating Your Thumbnail...
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-green-400 font-medium bg-green-500/10 px-6 py-2.5 rounded-full border border-green-500/20 shadow-[0_0_15px_-3px_rgba(74,222,128,0.2)] animate-in fade-in slide-in-from-top-2 duration-500">
                                <CheckCircle2 className="w-5 h-5" />
                                <span>{isViewOnly ? "Preview Your Thumbnail" : "Thumbnail Generated Successfully"}</span>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full max-w-2xl group">
                        {/* Thumbnail Container */}
                        <div className={`rounded-2xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/10 bg-[#1a1a1a] relative z-10 ${showThumbnailLoading ? 'aspect-video' : ''}`}>
                            {showThumbnailLoading ? (
                                /* Loading Skeleton Animation - Agentic Style */
                                <div className="w-full h-full relative overflow-hidden bg-[#0a0a0a]">
                                    {/* Grid pattern background */}
                                    <div className="absolute inset-0 opacity-20" style={{
                                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                                        backgroundSize: '20px 20px'
                                    }} />

                                    {/* Horizontal scanning line */}
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan-line_2s_ease-in-out_infinite]" />
                                    </div>

                                    {/* Multiple shimmer waves */}
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]">
                                        <div className="w-full h-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
                                    </div>
                                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}>
                                        <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                                    </div>

                                    {/* Pulsing center icon with multiple rings */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            {/* Outer pulse rings */}
                                            <div className="absolute inset-0 w-32 h-32 -m-8 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                                            <div className="absolute inset-0 w-28 h-28 -m-6 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                                            <div className="absolute inset-0 w-24 h-24 -m-4 rounded-full bg-primary/10 animate-pulse" />
                                            {/* Inner content */}
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-primary/30 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(var(--primary),0.3)]">
                                                <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Corner scanning brackets */}
                                    <div className="absolute top-4 left-4">
                                        <div className="w-8 h-8 border-l-2 border-t-2 border-primary/50 animate-pulse" />
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <div className="w-8 h-8 border-r-2 border-t-2 border-primary/50 animate-pulse" style={{ animationDelay: '0.25s' }} />
                                    </div>
                                    <div className="absolute bottom-4 left-4">
                                        <div className="w-8 h-8 border-l-2 border-b-2 border-primary/50 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                    </div>
                                    <div className="absolute bottom-4 right-4">
                                        <div className="w-8 h-8 border-r-2 border-b-2 border-primary/50 animate-pulse" style={{ animationDelay: '0.75s' }} />
                                    </div>

                                    {/* Processing text indicators */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-zinc-500 font-mono">PROCESSING</span>
                                    </div>
                                </div>
                            ) : (
                                /* Generated Image */
                                <>
                                    <img
                                        src={thumbnailUrl || ""}
                                        alt="Generated Thumbnail"
                                        className="w-full h-auto transition-transform duration-700 ease-out group-hover:scale-105 animate-in fade-in zoom-in-95 duration-500"
                                    />
                                    {/* Subtle shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                </>
                            )}
                        </div>

                        {/* Metadata Preview (Only if available and not loading) */}
                        {!showThumbnailLoading && generatedMetadata && (
                            <div className="mt-6 flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                {/* Fake Avatar */}
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                                    {generatedMetadata.channel.charAt(0)}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-white text-lg font-semibold leading-snug line-clamp-2">
                                        {generatedMetadata.title}
                                    </h3>
                                    <div className="text-[#aaa] text-sm flex items-center gap-1.5">
                                        <span className="hover:text-white transition-colors cursor-pointer">
                                            {generatedMetadata.channel}
                                        </span>
                                        <span className="w-0.5 h-0.5 bg-[#aaa] rounded-full" />
                                        <span>{generatedMetadata.views}</span>
                                        <span className="w-0.5 h-0.5 bg-[#aaa] rounded-full" />
                                        <span>{generatedMetadata.published}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading metadata skeleton */}
                        {showThumbnailLoading && (
                            <div className="mt-6 flex gap-3 animate-in fade-in duration-300">
                                <div className="w-10 h-10 rounded-full bg-[#333] animate-pulse" />
                                <div className="flex flex-col gap-2">
                                    <div className="w-64 h-5 bg-[#333] rounded animate-pulse" />
                                    <div className="w-40 h-4 bg-[#2a2a2a] rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Enhanced Options */}
                <div className="w-full md:w-2/5 p-10 flex flex-col justify-center bg-[#121212] relative overflow-hidden">
                    {/* Background glow decoration */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Preview in Context</h2>
                        <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
                            {showThumbnailLoading
                                ? "Your thumbnail is being generated. Choose a preview mode while you wait."
                                : "See how your thumbnail stands out against competitors in a simulated YouTube environment."
                            }
                        </p>

                        <div className="grid gap-6">
                            {/* HOME GRID CARD */}
                            <button
                                onClick={() => !showThumbnailLoading && onSelectLayout('home')}
                                disabled={showThumbnailLoading}
                                className={`group relative flex items-center gap-6 p-5 rounded-2xl border border-[#272727] bg-[#1a1a1a] transition-all text-left overflow-hidden ${
                                    showThumbnailLoading
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-[#222] hover:border-[#444] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]'
                                }`}
                            >
                                {/* Visual Representation of Home Grid */}
                                <div className="w-24 h-20 shrink-0 bg-[#272727] rounded-lg border border-[#333] p-2 flex flex-wrap gap-1 content-start overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-[45%] h-8 bg-[#3f3f3f] rounded-sm animate-pulse" style={{ animationDelay: '0ms' }} />
                                    <div className="w-[45%] h-8 bg-[#333] rounded-sm" />
                                    <div className="w-[45%] h-8 bg-[#333] rounded-sm" />
                                    <div className="w-[45%] h-8 bg-[#3f3f3f] rounded-sm animate-pulse" style={{ animationDelay: '150ms' }} />
                                </div>

                                <div>
                                    <h3 className={`text-white text-lg font-semibold transition-colors ${!showThumbnailLoading && 'group-hover:text-primary'}`}>
                                        Home Feed
                                    </h3>
                                    <p className={`text-zinc-500 text-sm mt-1 transition-colors ${!showThumbnailLoading && 'group-hover:text-zinc-400'}`}>
                                        The main browsing grid where discovery happens. Checks click-through potential.
                                    </p>
                                </div>
                            </button>

                            {/* WATCH PAGE CARD */}
                            <button
                                onClick={() => !showThumbnailLoading && onSelectLayout('watch')}
                                disabled={showThumbnailLoading}
                                className={`group relative flex items-center gap-6 p-5 rounded-2xl border border-[#272727] bg-[#1a1a1a] transition-all text-left overflow-hidden ${
                                    showThumbnailLoading
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-[#222] hover:border-[#444] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)]'
                                }`}
                            >
                                {/* Visual Representation of Watch Sidebar */}
                                <div className="w-24 h-20 shrink-0 bg-[#272727] rounded-lg border border-[#333] p-2 flex gap-1.5 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                    {/* Fake Player */}
                                    <div className="flex-1 h-full bg-[#111] rounded-sm border border-[#333] flex items-center justify-center">
                                        <div className="w-3 h-3 rounded-full border border-white/20" />
                                    </div>
                                    {/* Fake Sidebar */}
                                    <div className="w-1/3 h-full flex flex-col gap-1">
                                        <div className="w-full h-1/3 bg-[#3f3f3f] rounded-sm animate-pulse" />
                                        <div className="w-full h-1/3 bg-[#333] rounded-sm" />
                                        <div className="w-full h-1/3 bg-[#333] rounded-sm" />
                                    </div>
                                </div>

                                <div>
                                    <h3 className={`text-white text-lg font-semibold transition-colors ${!showThumbnailLoading && 'group-hover:text-primary'}`}>
                                        Watch Page
                                    </h3>
                                    <p className={`text-zinc-500 text-sm mt-1 transition-colors ${!showThumbnailLoading && 'group-hover:text-zinc-400'}`}>
                                        The &quot;Up Next&quot; sidebar position. Checks relevancy and suggestion performance.
                                    </p>
                                </div>
                            </button>

                            {/* AI SCORE CARD */}
                            <button
                                onClick={() => !showThumbnailLoading && setShowScorePanel(true)}
                                disabled={showThumbnailLoading}
                                className={`group relative flex items-center gap-6 p-5 rounded-2xl border border-[#272727] bg-[#1a1a1a] transition-all text-left overflow-hidden ${
                                    showThumbnailLoading
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-[#222] hover:border-primary/30 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.15)]'
                                }`}
                            >
                                {/* Visual Representation of Score */}
                                <div className="w-24 h-20 shrink-0 bg-[#272727] rounded-lg border border-[#333] p-2 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                                    <div className="relative">
                                        <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15" fill="none" stroke="#333" strokeWidth="3" />
                                            <circle
                                                cx="18" cy="18" r="15" fill="none"
                                                stroke="url(#scoreGradientPreview)"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeDasharray="75"
                                                strokeDashoffset="18"
                                                className="group-hover:animate-pulse"
                                            />
                                            <defs>
                                                <linearGradient id="scoreGradientPreview" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#ef4444" />
                                                    <stop offset="100%" stopColor="#f97316" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                                            <BarChart3 className="w-5 h-5 text-primary" />
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className={`text-white text-lg font-semibold transition-colors flex items-center gap-2 ${!showThumbnailLoading && 'group-hover:text-primary'}`}>
                                        AI Score
                                        <span className="px-1.5 py-0.5 text-[10px] bg-primary/20 text-primary rounded-full font-medium">NEW</span>
                                    </h3>
                                    <p className={`text-zinc-500 text-sm mt-1 transition-colors ${!showThumbnailLoading && 'group-hover:text-zinc-400'}`}>
                                        Get AI-powered analysis across 5 pillars: Virality, Clarity, Curiosity, Emotion & Composition.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Loading progress indicator */}
                        {showThumbnailLoading && (
                            <div className="mt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 text-zinc-400 text-sm">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>This usually takes 30-60 seconds...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Score Panel Overlay */}
                {showScorePanel && thumbnailUrl && (
                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                        <div className="w-full max-w-md mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                            <ThumbnailScore
                                imageUrl={thumbnailUrl}
                                title={generatedMetadata?.title}
                                onClose={() => setShowScorePanel(false)}
                                onRegenerate={onRegenerateWithImprovements}
                                isRegenerating={isRegenerating}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
