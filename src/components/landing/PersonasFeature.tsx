"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, User, Wand2, Link as LinkIcon, Image as ImageIcon, Play, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

type Tab = "persona" | "style" | "prompt" | "link";

// Sample thumbnail images - using public folder paths
const SAMPLE_THUMBNAILS = {
    persona: {
        avatars: [
            "/thumbnails/persona_avatar_new_1.jpg",
            "/thumbnails/persona_avatar_new_2.jpg",
            "/thumbnails/persona_avatar_new_3.jpg",
            "/thumbnails/persona_avatar_new_4.jpg",
            "/thumbnails/persona_avatar_new_5.jpg",
        ],
        results: [
            "/thumbnails/persona_result_new_1.jpg",
            "/thumbnails/persona_result_new_2.jpg",
        ]
    },
    style: {
        reference: "/thumbnails/style_reference_new_1.jpg",
        results: [
            "/thumbnails/style_result_new_1.jpg",
            "/thumbnails/style_result_new_2.jpg",
        ]
    },
    prompt: {
        result: "/thumbnails/prompt_result_new_1.jpg",
        variations: ["/thumbnails/prompt_result_new_2.jpg", "/thumbnails/prompt_result_new_3.jpg"],
    },
    link: {
        videoThumb: "/thumbnails/link_preview_new_1.png",
        result: "/thumbnails/link_result_new_1.jpg",
        variations: ["/thumbnails/link_result_new_2.jpg", "/thumbnails/link_result_new_3.jpg"],
    },
    carousel: {
        persona: ["/thumbnails/persona_result_new_1.jpg", "/thumbnails/persona_result_new_2.jpg", "/thumbnails/persona_result_new_3.jpg", "/thumbnails/persona_result_new_4.jpg", "/thumbnails/persona_result_new_5.jpg", "/thumbnails/persona_result_new_6.jpg"],
        style: ["/thumbnails/style_result_new_1.jpg", "/thumbnails/carousel_thumb_1.jpg", "/thumbnails/carousel_thumb_2.jpg", "/thumbnails/style_result_new_4.jpg", "/thumbnails/style_result_new_2.jpg", "/thumbnails/style_result_new_3.jpg"],
        prompt: ["/thumbnails/prompt_result_new_1.jpg", "/thumbnails/prompt_result_new_2.jpg", "/thumbnails/prompt_result_new_3.jpg", "/thumbnails/carousel_thumb_3.jpg", "/thumbnails/carousel_thumb_4.jpg", "/thumbnails/carousel_thumb_5.jpg"],
        link: ["/thumbnails/link_result_new_1.jpg", "/thumbnails/link_result_new_2.jpg", "/thumbnails/link_result_new_3.jpg", "/thumbnails/carousel_thumb_1.jpg", "/thumbnails/carousel_thumb_4.jpg", "/thumbnails/carousel_thumb_6.jpg"],
    }
};

export function PersonasFeature() {
    const [activeTab, setActiveTab] = useState<Tab>("persona");

    const tabs = [
        { id: "persona", label: "Persona" },
        { id: "style", label: "Style" },
        { id: "prompt", label: "Prompt" },
        { id: "link", label: "Link" },
    ];

    const headingText = {
        persona: "With Personas",
        style: "In Any Style",
        prompt: "From Prompts",
        link: "From Links",
    };

    const descriptionText = {
        persona: "Train your own custom models & consistently integrate them into any of your thumbnails.",
        style: "Replicate any visual style instantly. Just upload a reference and let AI do the rest.",
        prompt: "Describe what you envision and watch it come to life with pixel-perfect accuracy.",
        link: "Love a thumbnail you've seen? Paste the video link & ThumbZap will help you create something even better.",
    };

    return (
        <section id="features" className="bg-black overflow-hidden flex justify-center w-full py-16 lg:py-24 px-4">
            <div className="bg-zinc-900/60 overflow-hidden w-full max-w-7xl rounded-[32px] border border-zinc-800/50">
                <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-16 justify-between items-start w-full p-8 lg:p-16">

                    {/* Left Content */}
                    <div className="w-full lg:w-[45%] flex flex-col items-start gap-6 z-10">
                        {/* Pill Menu */}
                        <div className="flex p-1 gap-1 border border-zinc-800 rounded-full bg-black/60 backdrop-blur-sm">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${activeTab === tab.id
                                        ? "bg-red-600 text-white border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                                        : "bg-transparent text-zinc-500 border-transparent hover:text-white hover:bg-zinc-800/50"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Heading */}
                        <div className="flex flex-col gap-5">
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-400 to-red-300">
                                    Create Thumbnails
                                </span>
                                <br />
                                <motion.span
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-zinc-500"
                                >
                                    {headingText[activeTab]}
                                </motion.span>
                            </h2>
                            <motion.p
                                key={activeTab + "-desc"}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-base lg:text-lg text-zinc-400 max-w-md leading-relaxed"
                            >
                                {descriptionText[activeTab]}
                            </motion.p>
                        </div>

                        {/* CTA Button */}
                        <button className="group mt-2 relative p-0.5 rounded-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg shadow-red-900/20">
                            <span className="relative block px-8 py-3 bg-black rounded-full text-white group-hover:bg-transparent transition-all duration-300 text-lg font-medium">
                                Try for Free
                            </span>
                        </button>
                    </div>

                    {/* Right Content / Mockup */}
                    <div className="relative w-full lg:w-[55%] min-h-[450px] lg:min-h-[500px]">
                        {/* Glow Effect */}
                        <div className="absolute -inset-8 bg-red-600/10 blur-3xl rounded-full opacity-60 pointer-events-none" />

                        <div className="relative w-full h-full rounded-3xl border border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl overflow-hidden shadow-2xl">

                            {/* Window Controls */}
                            <div className="absolute top-0 left-0 right-0 h-10 bg-zinc-900/80 border-b border-zinc-800/50 flex items-center px-4 gap-2 z-20">
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                            </div>

                            {/* Content Area */}
                            <div className="relative w-full h-full pt-14 pb-6 px-6 flex items-center justify-center min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {activeTab === "persona" && <PersonaVisual key="persona" />}
                                    {activeTab === "style" && <StyleVisual key="style" />}
                                    {activeTab === "prompt" && <PromptVisual key="prompt" />}
                                    {activeTab === "link" && <LinkVisual key="link" />}
                                </AnimatePresence>
                            </div>

                            {/* Bottom Fade */}
                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />
                        </div>
                    </div>

                </div>

                {/* Results Carousel */}
                <ThumbnailCarousel thumbnails={SAMPLE_THUMBNAILS.carousel[activeTab]} activeTab={activeTab} />
            </div>
        </section>
    );
}

function PersonaVisual() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-between py-4"
        >
            {/* SVG Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 350" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Lines from avatars to AI node */}
                {[80, 140, 200, 260, 320].map((x, i) => (
                    <motion.path
                        key={i}
                        d={`M ${x} 50 Q ${x} 100 200 150`}
                        fill="transparent"
                        stroke="url(#lineGradient)"
                        strokeWidth="1.5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.6 }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                    />
                ))}
                {/* Lines from AI node to results */}
                <motion.path
                    d="M 200 190 Q 200 240 120 290"
                    fill="transparent"
                    stroke="url(#lineGradient)"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 1, delay: 0.8 }}
                />
                <motion.path
                    d="M 200 190 Q 200 240 280 290"
                    fill="transparent"
                    stroke="url(#lineGradient)"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.6 }}
                    transition={{ duration: 1, delay: 0.9 }}
                />
            </svg>

            {/* Top Row: Avatar Images */}
            <div className="flex gap-3 z-10">
                {SAMPLE_THUMBNAILS.persona.avatars.map((src, i) => (
                    <motion.div
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.08, type: "spring" }}
                        className="w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-zinc-700 shadow-lg bg-zinc-800"
                    >
                        <Image
                            src={src}
                            alt={`Avatar ${i + 1}`}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                            unoptimized
                        />
                    </motion.div>
                ))}
            </div>

            {/* Center: AI Processing Node */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.5 }}
                className="relative w-20 h-20 lg:w-24 lg:h-24 z-20"
            >
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.5)] border border-red-400/30">
                    <span className="text-2xl lg:text-3xl font-bold text-white">AI</span>
                </div>
            </motion.div>

            {/* Bottom Row: Generated Results */}
            <div className="flex gap-4 z-10 w-full px-4 justify-center">
                {SAMPLE_THUMBNAILS.persona.results.map((src, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 + i * 0.15 }}
                        className="w-36 lg:w-44 aspect-video rounded-xl overflow-hidden border border-zinc-700 shadow-xl bg-zinc-800 relative group"
                    >
                        <Image
                            src={src}
                            alt={`Result ${i + 1}`}
                            width={176}
                            height={99}
                            className="object-cover w-full h-full"
                            unoptimized
                        />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
                            {i === 0 ? "12:34" : "8:15"}
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function StyleVisual() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-between py-4"
        >
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 350" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="styleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <motion.path
                    d="M 200 80 Q 200 120 200 150"
                    fill="transparent"
                    stroke="url(#styleGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                />
                <motion.path
                    d="M 200 190 Q 200 240 120 290"
                    fill="transparent"
                    stroke="url(#styleGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                />
                <motion.path
                    d="M 200 190 Q 200 240 280 290"
                    fill="transparent"
                    stroke="url(#styleGradient)"
                    strokeWidth="2"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                />
            </svg>

            {/* Style Reference Image */}
            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring" }}
                className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-zinc-800 z-10"
            >
                <Image
                    src={SAMPLE_THUMBNAILS.style.reference}
                    alt="Style Reference"
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                    unoptimized
                />
            </motion.div>

            {/* AI Node */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="relative w-20 h-20 z-20"
            >
                <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-purple-400/30">
                    <Wand2 className="w-8 h-8 text-white" />
                </div>
            </motion.div>

            {/* Styled Results */}
            <div className="flex gap-4 z-10 w-full px-4 justify-center">
                {SAMPLE_THUMBNAILS.style.results.map((src, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                        className="w-36 lg:w-44 aspect-video rounded-xl overflow-hidden border border-purple-500/30 shadow-xl bg-zinc-800 relative"
                    >
                        <Image
                            src={src}
                            alt={`Styled ${i + 1}`}
                            width={176}
                            height={99}
                            className="object-cover w-full h-full"
                            unoptimized
                        />
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

function PromptVisual() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-between py-4 gap-4"
        >
            {/* Prompt Input */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 z-10"
            >
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <motion.p
                            className="text-sm text-zinc-300 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            &quot;A dramatic YouTube thumbnail with a person looking shocked at a giant pile of money&quot;
                        </motion.p>
                    </div>
                </div>
            </motion.div>

            {/* AI Node */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="relative w-16 h-16 z-20"
            >
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <ImageIcon className="w-7 h-7 text-white" />
                </div>
            </motion.div>

            {/* Generated Result */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-800 relative z-10"
            >
                <Image
                    src={SAMPLE_THUMBNAILS.prompt.result}
                    alt="Generated from prompt"
                    width={400}
                    height={225}
                    className="object-cover w-full h-full"
                    unoptimized
                />
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-red-600 rounded text-xs text-white font-bold shadow-lg">
                    HD
                </div>
            </motion.div>
        </motion.div>
    );
}

function LinkVisual() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-between py-4 gap-4"
        >
            {/* YouTube Link Card */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-sm bg-zinc-800/80 rounded-xl p-3 border border-zinc-700 z-10 flex gap-3"
            >
                <div className="w-24 aspect-video rounded-lg overflow-hidden bg-zinc-700 relative shrink-0">
                    <Image
                        src={SAMPLE_THUMBNAILS.link.videoThumb}
                        alt="Video thumbnail"
                        width={160}
                        height={90}
                        className="object-cover w-full h-full"
                        unoptimized
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-1.5">
                    <p className="text-xs text-zinc-300 font-medium line-clamp-2">5 Uncommon Money Principles That Made Me A Millionaire</p>
                    <p className="text-[10px] text-red-500 truncate">https://youtu.be/H7XTE9Yc7XM</p>
                </div>
            </motion.div>

            {/* AI Node */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="relative w-16 h-16 z-20"
            >
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                    <LinkIcon className="w-6 h-6 text-white" />
                </div>
            </motion.div>

            {/* Generated Result */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-red-500/30 shadow-2xl bg-zinc-800 relative z-10"
            >
                <Image
                    src={SAMPLE_THUMBNAILS.link.result}
                    alt="Generated from link"
                    width={320}
                    height={180}
                    className="object-cover w-full h-full"
                    unoptimized
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-red-600 rounded text-[10px] text-white font-bold shadow-lg">
                    ThumbZap
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white">
                    YouTube 101
                </div>
            </motion.div>
        </motion.div>
    );
}

// Thumbnail Carousel Component
const DURATIONS = ["5:42", "8:15", "12:34", "6:27", "14:08", "9:53"];

function ThumbnailCarousel({ thumbnails, activeTab }: { thumbnails: string[]; activeTab: Tab }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = direction === "left" ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    const tabColors = {
        persona: "from-red-500/20 to-red-600/10",
        style: "from-purple-500/20 to-purple-600/10",
        prompt: "from-red-500/20 to-orange-500/10",
        link: "from-red-500/20 to-pink-500/10",
    };

    const borderColors = {
        persona: "border-red-500/30 hover:border-red-500/50",
        style: "border-purple-500/30 hover:border-purple-500/50",
        prompt: "border-orange-500/30 hover:border-orange-500/50",
        link: "border-pink-500/30 hover:border-pink-500/50",
    };

    return (
        <div className="w-full px-4 lg:px-8 pb-8 pt-4">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
                <motion.h3
                    key={activeTab + "-carousel-title"}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-medium text-zinc-500"
                >
                    Generated Results
                </motion.h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <AnimatePresence mode="wait">
                    {thumbnails.map((thumb, i) => (
                        <motion.div
                            key={`${activeTab}-${i}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.05 }}
                            className={`relative flex-shrink-0 w-48 lg:w-56 aspect-video rounded-xl overflow-hidden border ${borderColors[activeTab]} bg-zinc-900 shadow-lg group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl`}
                        >
                            {/* Gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${tabColors[activeTab]} opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none`} />

                            <Image
                                src={thumb}
                                alt={`Generated thumbnail ${i + 1}`}
                                width={224}
                                height={126}
                                className="object-cover w-full h-full"
                                unoptimized
                            />

                            {/* Hover overlay with duration badge */}
                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-black/80 rounded text-[10px] text-white font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                {DURATIONS[i % DURATIONS.length]}
                            </div>

                            {/* Play button on hover */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
                                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
