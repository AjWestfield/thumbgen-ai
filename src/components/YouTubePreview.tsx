"use client";

import { X, Search, Menu, Bell, Mic, Video, User, Home, Compass, Radio, Library, ArrowLeft } from "lucide-react";
import { YouTubeVideo } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface YouTubePreviewProps {
    searchQuery: string;
    userThumbnailUrl: string | null;
    similarVideos: YouTubeVideo[];
    onClose: () => void;
}

export function YouTubePreview({ searchQuery, userThumbnailUrl, similarVideos, onClose }: YouTubePreviewProps) {
    // Insert the user's "generated" video at a prominent position (e.g., index 1 or 2)
    const userVideo: YouTubeVideo = {
        title: searchQuery || "Your Generated Thumbnail Title",
        author: "Your Channel",
        videoId: "generated-preview",
        viewCount: 0,
        publishedText: "Just now",
        lengthSeconds: 600,
        thumbnailUrl: userThumbnailUrl || "https://images.unsplash.com/photo-1626544827763-d516dce335ca?w=800&q=80"
    };

    const displayVideos = [...similarVideos];
    // Filter out duplicates just in case API returns them
    const uniqueVideos = displayVideos.filter((video, index, self) =>
        index === self.findIndex((t) => (
            t.videoId === video.videoId
        ))
    );

    const finalDisplayVideos = [...uniqueVideos];

    if (userThumbnailUrl || true) { // Always inject for now
        if (finalDisplayVideos.length > 0) {
            finalDisplayVideos.splice(1, 0, userVideo);
        } else {
            finalDisplayVideos.push(userVideo);
        }
    }

    function formatViewCount(count: number): string {
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
                    {/* Sidebar */}
                    <div className="hidden min-[1300px]:flex w-[240px] flex-col p-3 hover:overflow-y-auto shrink-0">
                        <SidebarItem icon={<Home className="w-6 h-6" />} label="Home" active />
                        <SidebarItem icon={<Compass className="w-6 h-6" />} label="Shorts" />
                        <SidebarItem icon={<Radio className="w-6 h-6" />} label="Subscriptions" />
                        <hr className="border-[#3f3f3f] my-3 mx-2" />
                        <h3 className="text-white px-3 py-2 font-bold text-base">You</h3>
                        <SidebarItem icon={<User className="w-6 h-6" />} label="Your channel" />
                        <SidebarItem icon={<Library className="w-6 h-6" />} label="History" />
                    </div>
                    {/* Mini Sidebar for smaller screens */}
                    <div className="hidden sm:flex min-[1300px]:hidden w-[72px] flex-col items-center pt-1 shrink-0">
                        <MiniSidebarItem icon={<Home className="w-6 h-6" />} label="Home" active />
                        <MiniSidebarItem icon={<Compass className="w-6 h-6" />} label="Shorts" />
                        <MiniSidebarItem icon={<Radio className="w-6 h-6" />} label="Subscriptions" />
                        <MiniSidebarItem icon={<Library className="w-6 h-6" />} label="You" />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto">
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

                        {/* Video Grid */}
                        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-8 pb-20">
                            {finalDisplayVideos.map((video, index) => {
                                const isUserVideo = video.videoId === "generated-preview";

                                return (
                                    <div key={`${video.videoId}-${index}`} className="flex flex-col gap-3 group cursor-pointer">
                                        {/* Thumbnail */}
                                        <div className={cn(
                                            "relative aspect-video w-full rounded-xl overflow-hidden bg-[#1f1f1f]",
                                            isUserVideo && "ring-2 ring-primary ring-offset-2 ring-offset-[#0f0f0f]"
                                        )}>
                                            <img
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                className="w-full h-full object-cover transition-transform duration-200"
                                                onError={(e) => {
                                                    // Fallback to a gray placeholder with play icon on error
                                                    e.currentTarget.onerror = null; // Prevent infinite loop
                                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect fill='%23282828' width='320' height='180'/%3E%3Cpath fill='%23555' d='M140 70 L180 90 L140 110 Z'/%3E%3C/svg%3E";
                                                }}
                                            />
                                            <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                                                {formatDuration(video.lengthSeconds)}
                                            </div>
                                            {isUserVideo && (
                                                <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                                                    PREVIEW
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex gap-3 items-start pr-6">
                                            {/* Avatar */}
                                            {isUserVideo ? (
                                                <div className="w-9 h-9 shrink-0 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                                    Y
                                                </div>
                                            ) : (
                                                <div className="w-9 h-9 shrink-0 rounded-full bg-[#333] flex items-center justify-center text-white text-xs mt-0.5">
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
                            })}
                        </div>
                    </div>
                </div>
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
