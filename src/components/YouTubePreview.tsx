"use client";

import { useState, useEffect } from "react";
import { X, Search, Menu, Bell, Mic, Video, User, Home, Compass, Radio, Library, ArrowLeft, LayoutGrid, MonitorPlay, ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal } from "lucide-react";
import { YouTubeVideo, GeneratedMetadata } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavbar } from "@/components/NavbarContext";

interface YouTubePreviewProps {
    searchQuery: string;
    userThumbnailUrl: string | null;
    similarVideos: YouTubeVideo[];
    onClose: () => void;
    initialViewMode?: "home" | "watch";
    generatedMetadata?: GeneratedMetadata;
}

type ViewMode = "home" | "watch";

export function YouTubePreview({ searchQuery, userThumbnailUrl, similarVideos, onClose, initialViewMode = "home", generatedMetadata }: YouTubePreviewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
    const { setNavbarVisible } = useNavbar();

    // Hide navbar when YouTube preview is open
    useEffect(() => {
        setNavbarVisible(false);
        return () => setNavbarVisible(true);
    }, [setNavbarVisible]);

    // Track videos that fail to load (last line of defense for rare thumbnail errors)
    const [failedVideoIds, setFailedVideoIds] = useState<Set<string>>(new Set());

    // Helper to parse view count string to number (e.g. "1.2M views" -> 1200000)
    const parseViewCount = (viewString?: string): number => {
        if (!viewString) return 0;
        const clean = viewString.toLowerCase().replace(' views', '').replace(/,/g, '');
        if (clean.includes('m')) return parseFloat(clean) * 1000000;
        if (clean.includes('k')) return parseFloat(clean) * 1000;
        return parseInt(clean) || 0;
    };

    // Insert the user's "generated" video at a prominent position (e.g., index 1 or 2)
    const userVideo: YouTubeVideo = {
        title: generatedMetadata?.title || searchQuery || "Your Generated Thumbnail Title",
        author: generatedMetadata?.channel || "Your Channel",
        videoId: "generated-preview",
        viewCount: generatedMetadata ? parseViewCount(generatedMetadata.views) : 0,
        publishedText: generatedMetadata?.published || "Just now",
        lengthSeconds: 600,
        // Use YouTube CDN for reliable fallback thumbnail
        thumbnailUrl: userThumbnailUrl || "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg"
    };

    // Filter out duplicates and failed videos - display immediately without validation
    const uniqueVideos = similarVideos
        .filter((video, index, self) =>
            index === self.findIndex((t) => t.videoId === video.videoId)
        )
        .filter(video => !failedVideoIds.has(video.videoId));

    const finalDisplayVideos = [...uniqueVideos];

    if (userThumbnailUrl || true) { // Always inject for now
        // For Home view, we inject at index 1
        // For Watch view, we'll handle injection differently (top of sidebar)
        if (viewMode === "home") {
            if (finalDisplayVideos.length > 0) {
                finalDisplayVideos.splice(1, 0, userVideo);
            } else {
                finalDisplayVideos.push(userVideo);
            }
        }
    }

    // Handler to mark videos as failed
    const handleImageError = (videoId: string) => {
        setFailedVideoIds(prev => new Set([...prev, videoId]));
    };

    function formatViewCount(count: number): string {
        // Use the generated metadata string if this is the user video
        // But since we parsed it effectively, we can format it back or rely on this.
        // Actually, if we have generatedMetadata passed down, we might want to preserve the exact string "1.2M views" 
        // instead of recalculating. 
        // For now, standard formatting is fine, it should match closely.
        if (count === 0) return "No views";
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M views`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K views`;
        return `${count} views`;
    }

    function formatDuration(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full h-full bg-[#0f0f0f] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-4 h-14 bg-[#0f0f0f] shrink-0 sticky top-0 z-20 border-b border-[#272727]">
                    <div className="flex items-center gap-4">
                        {/* Replaced Menu with explicit Back Button for preview context */}
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-[#272727] rounded-full group" title="Go Back">
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                        <div className="flex items-center gap-1 cursor-pointer" title="YouTube Home">
                            <div className="w-8 h-5 bg-red-600 rounded-lg flex items-center justify-center relative">
                                <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-white border-b-[3px] border-b-transparent ml-0.5"></div>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tighter">Premium</span>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center flex-1 max-w-[720px] ml-10">
                        <div className="flex items-center w-full">
                            <div className="flex items-center w-full bg-[#121212] border border-[#303030] rounded-l-full px-4 py-0 pl-4 h-10 focus-within:border-[#1c62b9] ml-8">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    readOnly
                                    className="w-full bg-transparent text-white outline-none placeholder-[#888] text-base font-normal"
                                    placeholder="Search"
                                />
                            </div>
                            <button className="h-10 px-6 bg-[#222] border border-l-0 border-[#303030] rounded-r-full hover:bg-[#303030]">
                                <Search className="w-5 h-5 text-white" />
                            </button>
                        </div>
                        <div className="ml-4 w-10 h-10 bg-[#181818] hover:bg-[#303030] rounded-full flex items-center justify-center cursor-pointer">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* View Mode Toggles - Made Prominent */}
                        <div className="flex items-center bg-[#272727] rounded-full p-1 mr-4 border border-[#3f3f3f]">
                            <button
                                onClick={() => setViewMode("home")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                                    viewMode === "home"
                                        ? "bg-[#f1f1f1] text-black shadow-sm"
                                        : "text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f]"
                                )}
                                title="Home View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span>Home</span>
                            </button>
                            <button
                                onClick={() => setViewMode("watch")}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium",
                                    viewMode === "watch"
                                        ? "bg-[#f1f1f1] text-black shadow-sm"
                                        : "text-[#aaaaaa] hover:text-white hover:bg-[#3f3f3f]"
                                )}
                                title="Watch Page View"
                            >
                                <MonitorPlay className="w-4 h-4" />
                                <span>Watch Page</span>
                            </button>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-[#272727] rounded-full">
                                <Video className="w-6 h-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-[#272727] rounded-full">
                                <Bell className="w-6 h-6" />
                            </Button>
                        </div>
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm cursor-pointer">
                            A
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Navigation - Only visible in Home Mode */}
                    {viewMode === "home" && (
                        <>
                            {/* Full Sidebar - Only on very large screens (1536px+) */}
                            <div className="hidden 2xl:flex w-[240px] flex-col p-3 hover:overflow-y-auto shrink-0 sticky top-0 h-[calc(100vh-56px)] bg-[#0f0f0f]">
                                <SidebarItem icon={<Home className="w-6 h-6" />} label="Home" active />
                                <SidebarItem icon={<Compass className="w-6 h-6" />} label="Shorts" />
                                <SidebarItem icon={<Radio className="w-6 h-6" />} label="Subscriptions" />
                                <hr className="border-[#3f3f3f] my-3 mx-2" />
                                <h3 className="text-white px-3 py-2 font-bold text-base">You</h3>
                                <SidebarItem icon={<User className="w-6 h-6" />} label="Your channel" />
                                <SidebarItem icon={<Library className="w-6 h-6" />} label="History" />
                            </div>
                            {/* Mini Sidebar - Medium to large screens (640px to 1535px) */}
                            <div className="hidden sm:flex 2xl:hidden w-[72px] flex-col items-center pt-1 shrink-0 sticky top-0 h-[calc(100vh-56px)] bg-[#0f0f0f]">
                                <MiniSidebarItem icon={<Home className="w-6 h-6" />} label="Home" active />
                                <MiniSidebarItem icon={<Compass className="w-6 h-6" />} label="Shorts" />
                                <MiniSidebarItem icon={<Radio className="w-6 h-6" />} label="Subscriptions" />
                                <MiniSidebarItem icon={<Library className="w-6 h-6" />} label="You" />
                            </div>
                        </>
                    )}

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto bg-[#0f0f0f] scrollbar-hide">

                        {viewMode === "home" ? (
                            // ==================== HOME GRID LAYOUT ====================
                            <div className="flex flex-col">
                                {/* Filters */}
                                <div className="flex gap-3 px-6 py-3 overflow-x-auto shrink-0 sticky top-0 bg-[#0f0f0f] z-10 w-full no-scrollbar">
                                    {["All", "Gaming", "Mixes", "Live", "Music", "Thoughts", "Computers", "Programming", "Recently uploaded", "New to you"].map((filter, i) => (
                                        <div key={i} className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors",
                                            i === 0 ? "bg-white text-black" : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                                        )}>
                                            {filter}
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 pb-20">
                                    {finalDisplayVideos.map((video, index) => {
                                        const isUserVideo = video.videoId === "generated-preview";
                                        return (
                                            <VideoCard
                                                key={`${video.videoId}-${index}`}
                                                video={video}
                                                isUserVideo={isUserVideo}
                                                handleImageError={handleImageError}
                                                formatDuration={formatDuration}
                                                formatViewCount={formatViewCount}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            // ==================== WATCH PAGE LAYOUT ====================
                            <div className="flex flex-col lg:flex-row max-w-[1750px] mx-auto p-6 gap-6 justify-center">
                                {/* Left Column: Video Player & Info */}
                                <div className="flex-1 max-w-[1280px] min-w-0">
                                    <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
                                        {/* Fake Player UI */}
                                        <img
                                            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop"
                                            className="w-full h-full object-cover opacity-50"
                                            alt="Video Player Background"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center border-2 border-white/20 backdrop-blur-sm cursor-pointer hover:bg-black/70 hover:scale-110 transition-all">
                                                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
                                            </div>
                                        </div>
                                        {/* Player controls bar (fake) */}
                                        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent px-4 flex items-center gap-4">
                                            <div className="text-white text-xs">0:00 / 10:00</div>
                                            <div className="h-1 flex-1 bg-white/30 rounded-full relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-red-600 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h1 className="text-xl font-bold text-white line-clamp-2">Funniest Among Us Animations! YOU LAUGH YOU LOSE!</h1>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                                                    G
                                                </div>
                                                <div>
                                                    <div className="text-white font-bold text-base">GarryBlox</div>
                                                    <div className="text-[#aaa] text-xs">1.27M subscribers</div>
                                                </div>
                                                <Button className="bg-white text-black hover:bg-[#d9d9d9] rounded-full px-4 h-9 font-medium ml-2">
                                                    Subscribe
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-[#272727] rounded-full h-9">
                                                    <Button variant="ghost" className="h-full rounded-l-full px-4 text-white hover:bg-[#3f3f3f] border-r border-[#3f3f3f] flex items-center gap-2">
                                                        <ThumbsUp className="w-4 h-4" /> 876
                                                    </Button>
                                                    <Button variant="ghost" className="h-full rounded-r-full px-4 text-white hover:bg-[#3f3f3f]">
                                                        <ThumbsDown className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" className="bg-[#272727] text-white hover:bg-[#3f3f3f] rounded-full h-9 px-4 flex items-center gap-2">
                                                    <Share2 className="w-4 h-4" /> Share
                                                </Button>
                                                <Button variant="ghost" className="bg-[#272727] text-white hover:bg-[#3f3f3f] rounded-full h-9 px-4 flex items-center gap-2">
                                                    <Download className="w-4 h-4" /> Download
                                                </Button>
                                                <Button variant="ghost" size="icon" className="bg-[#272727] text-white hover:bg-[#3f3f3f] rounded-full h-9 w-9">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-4 bg-[#272727] rounded-xl p-3 text-sm text-white">
                                            <div className="flex gap-2 font-bold mb-1">
                                                <span>93K views</span>
                                                <span>•</span>
                                                <span>1 month ago</span>
                                            </div>
                                            <p className="whitespace-pre-wrap">Funniest Among Us Animations! YOU LAUGH YOU LOSE!{"\n\n"}Check out the full animations here! ...more</p>
                                        </div>

                                        <div className="mt-6 text-white text-xl font-bold">Comments</div>
                                    </div>
                                </div>

                                {/* Right Column: Sidebar (Up Next) */}
                                <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-2">
                                    <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-2">
                                        {["All", "From GarryBlox", "Among Us", "Related"].map((filter, i) => (
                                            <div key={i} className={cn(
                                                "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors",
                                                i === 0 ? "bg-white text-black" : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
                                            )}>
                                                {filter}
                                            </div>
                                        ))}
                                    </div>

                                    {/* User Video Injection (Index 0) */}
                                    <VideoRow
                                        video={userVideo}
                                        isUserVideo={true}
                                        handleImageError={handleImageError}
                                        formatDuration={formatDuration}
                                        formatViewCount={formatViewCount}
                                    />

                                    {/* Rest of the videos */}
                                    {uniqueVideos.slice(0, 15).map((video, index) => (
                                        <VideoRow
                                            key={`sidebar-${video.videoId}-${index}`}
                                            video={video}
                                            isUserVideo={false}
                                            handleImageError={handleImageError}
                                            formatDuration={formatDuration}
                                            formatViewCount={formatViewCount}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Extracted for Home Grid
function VideoCard({ video, isUserVideo, handleImageError, formatDuration, formatViewCount }: any) {
    return (
        <div className="flex flex-col gap-3 group cursor-pointer">
            {/* Thumbnail */}
            <div className={cn(
                "relative w-full aspect-video rounded-xl overflow-hidden bg-black",
                isUserVideo && "ring-2 ring-primary ring-offset-2 ring-offset-[#0f0f0f]"
            )}>
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-200"
                    onError={() => handleImageError(video.videoId)}
                />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                    {formatDuration(video.lengthSeconds)}
                </div>
            </div>

            {/* Info */}
            <div className="flex gap-3 items-start pr-6">
                {/* Avatar */}
                {isUserVideo ? (
                    <div className="w-9 h-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold mt-0.5">
                        Y
                    </div>
                ) : video.channelAvatarUrl ? (
                    <img
                        src={video.channelAvatarUrl}
                        alt={video.author}
                        className="w-9 h-9 shrink-0 rounded-full object-cover mt-0.5 bg-[#333]"
                        onError={(e) => {
                            // Fallback to letter avatar on error
                            const target = e.currentTarget;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                        }}
                    />
                ) : null}
                {/* Fallback letter avatar (hidden when image loads successfully) */}
                {!isUserVideo && (
                    <div
                        className="w-9 h-9 shrink-0 rounded-full bg-[#333] items-center justify-center text-white text-xs mt-0.5"
                        style={{ display: video.channelAvatarUrl ? 'none' : 'flex' }}
                    >
                        {video.author[0]}
                    </div>
                )}

                <div className="flex flex-col">
                    <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2" title={video.title}>
                        {video.title}
                    </h3>
                    <div className="text-[#aaa] text-xs mt-1">
                        <div className="hover:text-white transition-colors">{video.author}</div>
                        <div className="flex items-center">
                            <span>{formatViewCount(video.viewCount)}</span>
                            <span className="mx-1">•</span>
                            <span>{video.publishedText}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Extracted for Watch Sidebar
function VideoRow({ video, isUserVideo, handleImageError, formatDuration, formatViewCount }: any) {
    return (
        <div className={cn(
            "flex gap-2 group cursor-pointer p-2 rounded-xl hover:bg-[#272727] transition-colors",
            isUserVideo ? "bg-[#2a2a2a]/50 ring-1 ring-primary/30" : ""
        )}>
            {/* Thumbnail - Smaller & Fixed Width */}
            <div className="relative w-[168px] min-w-[168px] aspect-video rounded-lg overflow-hidden bg-black">
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(video.videoId)}
                />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 py-0.5 rounded">
                    {formatDuration(video.lengthSeconds)}
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 min-w-0 pr-1">
                <h3 className={cn(
                    "text-sm font-semibold leading-snug line-clamp-2 mb-1",
                    isUserVideo ? "text-primary" : "text-white"
                )} title={video.title}>
                    {video.title}
                </h3>
                <div className="text-[#aaa] text-xs">
                    <div className="hover:text-white transition-colors truncate">{video.author}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                        <span>{formatViewCount(video.viewCount)}</span>
                        <span>•</span>
                        <span>{video.publishedText}</span>
                    </div>
                </div>
                {isUserVideo && (
                    <span className="text-[10px] text-primary/80 mt-1 font-medium bg-primary/10 w-fit px-1.5 rounded">
                        Up Next
                    </span>
                )}
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className={cn(
            "flex items-center gap-5 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#272727] transition-colors",
            active ? "bg-[#272727]" : ""
        )}>
            {/* Clone icon to enforce sizing if needed, or rely on parent */}
            <div className={active ? "text-white" : "text-white"}>{icon}</div>
            <span className={cn("text-sm font-medium truncate", active ? "text-white" : "text-white")}>{label}</span>
        </div>
    )
}

function MiniSidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1 py-4 w-full cursor-pointer hover:bg-[#272727] rounded-lg">
            <div className="text-white mb-0.5">{icon}</div>
            <span className="text-[10px] text-white">{label}</span>
        </div>
    )
}
