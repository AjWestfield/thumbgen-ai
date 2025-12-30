"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChatInput, type ReferenceImage } from "./ChatInput";
import { Marquee } from "./Marquee";
import { Sparkles } from "lucide-react";
import { YouTubePreview } from "@/components/YouTubePreview";
import { PreviewModal } from "@/components/PreviewModal";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { searchYouTube, type YouTubeVideo, type GeneratedMetadata } from "@/lib/youtube";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

// Pre-upload state for instant UX
interface PreUploadState {
    status: 'idle' | 'uploading' | 'done' | 'error';
    url: string | null;
    error: string | null;
}

// Model options
type ModelType = 'nano-banana' | 'gpt-image-1.5';
type GenerationMode = 'edit' | 'generate';

// Helper to upload file to Convex storage and get the public URL
async function uploadToConvex(
    file: File | Blob,
    generateUploadUrl: () => Promise<string>,
    getUrl: (args: { storageId: Id<"_storage"> }) => Promise<string | null>
): Promise<string> {
    // Get upload URL from Convex
    const uploadUrl = await generateUploadUrl();

    // Upload the file
    const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
    });

    if (!result.ok) {
        throw new Error("Failed to upload file to Convex");
    }

    const { storageId } = await result.json();

    // Get the public URL from Convex
    const publicUrl = await getUrl({ storageId: storageId as Id<"_storage"> });

    if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
    }

    return publicUrl;
}

export function Hero() {
    const searchParams = useSearchParams();
    const { isSignedIn } = useAuth();
    const [showPreview, setShowPreview] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
    const [currentPrompt, setCurrentPrompt] = useState("");
    const [previewMode, setPreviewMode] = useState<'home' | 'watch'>('home');
    const [generatedMetadata, setGeneratedMetadata] = useState<GeneratedMetadata | undefined>(undefined);
    const [generatedThumbnailUrl, setGeneratedThumbnailUrl] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Credit system - only query if signed in (skip query when not authenticated)
    const creditInfo = useQuery(api.users.hasCredits, isSignedIn ? undefined : "skip");

    // Model selection state
    const [selectedModel, setSelectedModel] = useState<ModelType>('gpt-image-1.5');
    const didWarmGptImageRoute = useRef(false);

    // Pre-upload state for instant UX - uploads happen in background as soon as user selects image
    // Using refs to track latest state for use in closures
    const imagePreUploadRef = useRef<PreUploadState>({ status: 'idle', url: null, error: null });
    const referencePreUploadRef = useRef<PreUploadState>({ status: 'idle', url: null, error: null });

    const setImagePreUpload = (state: PreUploadState) => {
        imagePreUploadRef.current = state;
    };
    const setReferencePreUpload = (state: PreUploadState) => {
        referencePreUploadRef.current = state;
    };

    // Dev-only: warm the GPT image route so the first generation isn't blocked on Next's on-demand compilation.
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;
        if (selectedModel !== 'gpt-image-1.5') return;
        if (didWarmGptImageRoute.current) return;
        didWarmGptImageRoute.current = true;
        fetch('/api/generate-openai').catch(() => {});
    }, [selectedModel]);

    // Get edit parameters from URL (for editing existing thumbnails from My Thumbnails)
    const editImageUrl = searchParams.get('editImage');
    const editPrompt = searchParams.get('prompt');

    // Clear URL params after reading them (to prevent re-loading on refresh)
    useEffect(() => {
        if (editImageUrl || editPrompt) {
            // Clean up the URL without triggering a page reload
            const url = new URL(window.location.href);
            url.searchParams.delete('editImage');
            url.searchParams.delete('prompt');
            window.history.replaceState({}, '', url.pathname);
        }
    }, [editImageUrl, editPrompt]);

    // Convex mutations
    const saveThumbnail = useMutation(api.thumbnails.saveThumbnail);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const getStorageUrl = useMutation(api.files.getUrl);

    // Track generation context for saving
    const generationContext = useRef<{
        userImageUrl: string;
        referenceUrl: string | null;
        referenceType: string | undefined;
        youtubeVideoId: string | undefined;
    } | null>(null);

    // Background pre-upload handlers for instant UX
    const handleImageSelected = useCallback(async (file: File) => {
        console.log('[Pre-upload] Starting background upload for user image...');
        setImagePreUpload({ status: 'uploading', url: null, error: null });

        try {
            const url = await uploadToConvex(file, generateUploadUrl, getStorageUrl);
            console.log('[Pre-upload] User image uploaded:', url);
            setImagePreUpload({ status: 'done', url, error: null });
        } catch (error) {
            console.error('[Pre-upload] Failed to upload user image:', error);
            setImagePreUpload({ status: 'error', url: null, error: error instanceof Error ? error.message : 'Upload failed' });
        }
    }, [generateUploadUrl, getStorageUrl]);

    const handleReferenceSelected = useCallback(async (reference: ReferenceImage) => {
        console.log('[Pre-upload] Starting background upload for reference image...');
        setReferencePreUpload({ status: 'uploading', url: null, error: null });

        try {
            let referenceUrl: string;

            if (reference.type === 'youtube' && reference.youtubeVideoId) {
                // Fetch YouTube thumbnail first
                const thumbnailUrls = [
                    `https://i.ytimg.com/vi/${reference.youtubeVideoId}/maxresdefault.jpg`,
                    `https://i.ytimg.com/vi/${reference.youtubeVideoId}/hqdefault.jpg`
                ];

                let thumbnailBlob: Blob | null = null;
                for (const url of thumbnailUrls) {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            thumbnailBlob = await response.blob();
                            break;
                        }
                    } catch {
                        // Try next URL
                    }
                }

                if (!thumbnailBlob) {
                    throw new Error('Failed to fetch YouTube thumbnail');
                }

                referenceUrl = await uploadToConvex(thumbnailBlob, generateUploadUrl, getStorageUrl);
            } else if (reference.type === 'file' && reference.file) {
                referenceUrl = await uploadToConvex(reference.file, generateUploadUrl, getStorageUrl);
            } else {
                throw new Error('Invalid reference image');
            }

            console.log('[Pre-upload] Reference image uploaded:', referenceUrl);
            setReferencePreUpload({ status: 'done', url: referenceUrl, error: null });
        } catch (error) {
            console.error('[Pre-upload] Failed to upload reference image:', error);
            setReferencePreUpload({ status: 'error', url: null, error: error instanceof Error ? error.message : 'Upload failed' });
        }
    }, [generateUploadUrl, getStorageUrl]);

    const handleImageRemoved = useCallback(() => {
        console.log('[Pre-upload] User image removed, clearing pre-upload state');
        setImagePreUpload({ status: 'idle', url: null, error: null });
    }, []);

    const handleReferenceRemoved = useCallback(() => {
        console.log('[Pre-upload] Reference image removed, clearing pre-upload state');
        setReferencePreUpload({ status: 'idle', url: null, error: null });
    }, []);

    // TrustPilot Widget implementation
    const renderStars = () => (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-[#00b67a] p-[2px] rounded-sm">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="white"
                        className="w-3 h-3"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
            ))}
        </div>
    );

    const handleGenerate = async (prompt: string, imageFiles?: File[], referenceImage?: ReferenceImage, faceSwapMode?: boolean) => {
        // Get the first file from the array (main image)
        const imageFile = imageFiles?.[0];

        // Auto-detect generation mode based on whether an image is uploaded
        const generationMode: GenerationMode = imageFile ? 'edit' : 'generate';

        // Validation
        if (generationMode === 'generate' && !prompt.trim()) {
            setGenerationError("Please enter a prompt to generate an image");
            return;
        }

        if (faceSwapMode && !referenceImage) {
            setGenerationError("Face swap requires a target image");
            return;
        }

        // Check if user is signed in and has credits
        if (!isSignedIn) {
            // Redirect to sign-in
            window.location.href = '/sign-in?redirect_url=' + encodeURIComponent('/');
            return;
        }

        // Check credits - show subscription modal if insufficient
        if (creditInfo && !creditInfo.hasCredits) {
            setShowSubscriptionModal(true);
            return;
        }

        setIsGenerating(true);
        setGenerationError(null);
        setCurrentPrompt(prompt);

        // Show modal immediately with loading state
        setShowResultModal(true);

        try {
            let userImageUrl: string | null = null;
            let referenceUrl: string | null = null;

            // Step 1: Use pre-uploaded user image URL if available, otherwise upload now
            if (imageFile) {
                const preUpload = imagePreUploadRef.current;
                if (preUpload.status === 'done' && preUpload.url) {
                    // Use pre-uploaded URL (instant!)
                    userImageUrl = preUpload.url;
                    console.log('[Generate] Using pre-uploaded user image:', userImageUrl);
                } else if (preUpload.status === 'uploading') {
                    // Wait for pre-upload to complete
                    console.log('[Generate] Waiting for pre-upload to complete...');
                    await new Promise<void>((resolve) => {
                        const checkInterval = setInterval(() => {
                            // Access current state via ref
                            if (imagePreUploadRef.current.status !== 'uploading') {
                                clearInterval(checkInterval);
                                resolve();
                            }
                        }, 100);
                        // Timeout after 30s
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            resolve();
                        }, 30000);
                    });
                    userImageUrl = imagePreUploadRef.current.url;
                    if (!userImageUrl) {
                        // Fallback: upload now
                        userImageUrl = await uploadToConvex(imageFile, generateUploadUrl, getStorageUrl);
                    }
                } else {
                    // Fallback: upload now (shouldn't happen normally)
                    userImageUrl = await uploadToConvex(imageFile, generateUploadUrl, getStorageUrl);
                    console.log('[Generate] Fallback upload for user image:', userImageUrl);
                }
            }

            // Step 2: Use pre-uploaded reference URL if available, otherwise upload now
            if (referenceImage) {
                const refPreUpload = referencePreUploadRef.current;
                if (refPreUpload.status === 'done' && refPreUpload.url) {
                    // Use pre-uploaded URL (instant!)
                    referenceUrl = refPreUpload.url;
                    console.log('[Generate] Using pre-uploaded reference:', referenceUrl);
                } else if (refPreUpload.status === 'uploading') {
                    // Wait for pre-upload to complete
                    console.log('[Generate] Waiting for reference pre-upload to complete...');
                    await new Promise<void>((resolve) => {
                        const checkInterval = setInterval(() => {
                            if (referencePreUploadRef.current.status !== 'uploading') {
                                clearInterval(checkInterval);
                                resolve();
                            }
                        }, 100);
                        setTimeout(() => {
                            clearInterval(checkInterval);
                            resolve();
                        }, 30000);
                    });
                    referenceUrl = referencePreUploadRef.current.url;
                    if (!referenceUrl) {
                        // Fallback: upload now
                        if (referenceImage.type === 'youtube' && referenceImage.youtubeVideoId) {
                            const thumbnailUrls = [
                                `https://i.ytimg.com/vi/${referenceImage.youtubeVideoId}/maxresdefault.jpg`,
                                `https://i.ytimg.com/vi/${referenceImage.youtubeVideoId}/hqdefault.jpg`
                            ];
                            let thumbnailBlob: Blob | null = null;
                            for (const url of thumbnailUrls) {
                                try {
                                    const response = await fetch(url);
                                    if (response.ok) {
                                        thumbnailBlob = await response.blob();
                                        break;
                                    }
                                } catch { /* try next */ }
                            }
                            if (thumbnailBlob) {
                                referenceUrl = await uploadToConvex(thumbnailBlob, generateUploadUrl, getStorageUrl);
                            }
                        } else if (referenceImage.type === 'file' && referenceImage.file) {
                            referenceUrl = await uploadToConvex(referenceImage.file, generateUploadUrl, getStorageUrl);
                        }
                    }
                } else {
                    // Fallback: upload now (shouldn't happen normally)
                    console.log('[Generate] Fallback upload for reference...');
                    if (referenceImage.type === 'youtube' && referenceImage.youtubeVideoId) {
                        const thumbnailUrls = [
                            `https://i.ytimg.com/vi/${referenceImage.youtubeVideoId}/maxresdefault.jpg`,
                            `https://i.ytimg.com/vi/${referenceImage.youtubeVideoId}/hqdefault.jpg`
                        ];
                        let thumbnailBlob: Blob | null = null;
                        for (const url of thumbnailUrls) {
                            try {
                                const response = await fetch(url);
                                if (response.ok) {
                                    thumbnailBlob = await response.blob();
                                    break;
                                }
                            } catch { /* try next */ }
                        }
                        if (thumbnailBlob) {
                            referenceUrl = await uploadToConvex(thumbnailBlob, generateUploadUrl, getStorageUrl);
                        }
                    } else if (referenceImage.type === 'file' && referenceImage.file) {
                        referenceUrl = await uploadToConvex(referenceImage.file, generateUploadUrl, getStorageUrl);
                    }
                }
            }

            // Store context for saving to Convex after generation
            generationContext.current = {
                userImageUrl: userImageUrl || '',
                referenceUrl,
                referenceType: referenceImage?.type,
                youtubeVideoId: referenceImage?.youtubeVideoId,
            };

            let generateResult;
            let modelUsed = selectedModel === 'gpt-image-1.5' ? 'GPT Image 1.5' : 'Nano Banana Pro';

            if (faceSwapMode && referenceUrl && userImageUrl) {
                // Face Swap Mode: Call the face swap API
                console.log(`Face Swap: Swapping face from user image onto target`);

                const faceSwapResponse = await fetch('/api/faceswap', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        faceImageUrl: userImageUrl,
                        targetImageUrl: referenceUrl,
                    }),
                });

                generateResult = await faceSwapResponse.json();
                modelUsed = "WaveSpeed Face Swap Pro";

                if (!generateResult.success) {
                    throw new Error(generateResult.error || 'Failed to swap face');
                }
            } else if (selectedModel === 'gpt-image-1.5') {
                // GPT Image 1.5 API
                // Build images array (API expects array, not single image)
                const gptImages = userImageUrl ? [userImageUrl] : undefined;
                console.log(`[GPT Image 1.5] Mode: ${generationMode}, Prompt: "${prompt.substring(0, 50)}...", images: ${gptImages?.length || 0}, hasReference: ${!!referenceUrl}`);

                const generateResponse = await fetch('/api/generate-openai', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mode: generationMode,
                        prompt,
                        images: gptImages, // User's face/subject image(s) - must be array
                        referenceImage: referenceUrl, // Reference style image (e.g., MrBeast thumbnail)
                        size: '1536x1024', // 16:9 landscape for thumbnails
                    }),
                });

                generateResult = await generateResponse.json();

                if (!generateResult.success) {
                    throw new Error(generateResult.error || 'Failed to generate with GPT Image 1.5');
                }
            } else {
                // Nano Banana Pro (Kie AI) - Text-to-Image or Edit Mode
                const images = userImageUrl
                    ? (referenceUrl ? [userImageUrl, referenceUrl] : [userImageUrl])
                    : undefined;
                const hasReferenceImage = !!referenceUrl;

                console.log(`[Nano Banana Pro] Mode: ${generationMode}, images: ${images?.length || 0}, hasReference: ${hasReferenceImage}`);

                const generateResponse = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mode: generationMode,
                        prompt,
                        images,
                        hasReferenceImage,
                        aspectRatio: '16:9',
                        resolution: '2k',
                        outputFormat: 'png',
                    }),
                });

                generateResult = await generateResponse.json();

                if (!generateResult.success) {
                    throw new Error(generateResult.error || 'Failed to generate thumbnail');
                }
            }

            setGeneratedThumbnailUrl(generateResult.imageUrl);

            // Try to save to Convex (optional - only works when authenticated)
            try {
                await saveThumbnail({
                    imageUrl: generateResult.imageUrl,
                    prompt: faceSwapMode ? `[Face Swap] ${prompt || 'No prompt'}` : prompt,
                    sourceImageUrl: generationContext.current?.userImageUrl || undefined,
                    referenceImageUrl: generationContext.current?.referenceUrl || undefined,
                    referenceType: generationContext.current?.referenceType,
                    youtubeVideoId: generationContext.current?.youtubeVideoId,
                    model: modelUsed,
                    aspectRatio: "16:9",
                    resolution: "2k",
                });
                console.log('Thumbnail saved to Convex');
            } catch (saveError) {
                // Not signed in - that's OK, still show the generated image
                console.log('Thumbnail not saved (user not authenticated):', saveError);
            }

            // Also search for similar videos for the preview
            let searchQuery = prompt.trim();

            // If prompt is empty (e.g., face swap mode), analyze the reference image to get keywords
            if (!searchQuery && referenceUrl) {
                try {
                    console.log('Analyzing reference image to generate search keywords...');
                    const analyzeResponse = await fetch('/api/ai/analyze-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            imageUrl: referenceUrl,
                            youtubeVideoId: referenceImage?.youtubeVideoId,
                        }),
                    });

                    if (analyzeResponse.ok) {
                        const analyzeResult = await analyzeResponse.json();
                        searchQuery = analyzeResult.keywords || 'viral thumbnail';
                        console.log(`Image analysis keywords: "${searchQuery}"`);
                    }
                } catch (analyzeError) {
                    console.error('Image analysis failed:', analyzeError);
                }
            }

            // Final fallback if still no query
            if (!searchQuery) {
                searchQuery = 'viral thumbnail';
            }

            const searchResult = await searchYouTube(searchQuery);
            setSearchResults(searchResult.videos);
            setGeneratedMetadata(searchResult.generatedMetadata);
        } catch (error) {
            console.error("Failed to generate thumbnail:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to generate thumbnail";

            // Check if it's an insufficient credits error (402)
            if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.includes('402')) {
                setShowSubscriptionModal(true);
                setShowResultModal(false);
            } else {
                setGenerationError(errorMessage);
                // Close modal on error so user can see the error message
                setShowResultModal(false);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectLayout = (layout: 'home' | 'watch') => {
        setPreviewMode(layout);
        setShowResultModal(false);
        // Small delay to allow modal to close smoothly before opening preview
        setTimeout(() => setShowPreview(true), 100);
    };

    // Regenerate thumbnail with AI-suggested improvements
    const handleRegenerateWithImprovements = useCallback(async (improvements: string[]) => {
        if (!generatedThumbnailUrl || isRegenerating) return;

        setIsRegenerating(true);
        setGenerationError(null);

        try {
            // Build an improved prompt from the AI suggestions
            const improvementPrompt = `Improve this YouTube thumbnail by: ${improvements.join('. ')}. Make the improvements while maintaining the core subject and composition.`;

            // Use GPT Image 1.5 for regeneration (edit mode)
            const generateResponse = await fetch('/api/generate-openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: 'edit',
                    prompt: improvementPrompt,
                    images: [generatedThumbnailUrl],
                    size: '1536x1024',
                }),
            });

            const result = await generateResponse.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to regenerate thumbnail');
            }

            // Update the thumbnail URL with the improved version
            setGeneratedThumbnailUrl(result.imageUrl);

            // Save the regenerated thumbnail to Convex
            try {
                await saveThumbnail({
                    imageUrl: result.imageUrl,
                    prompt: `[Regenerated] ${improvementPrompt}`,
                    sourceImageUrl: generatedThumbnailUrl,
                    model: 'GPT Image 1.5',
                    aspectRatio: '16:9',
                    resolution: '2k',
                });
            } catch (saveError) {
                console.log('Regenerated thumbnail not saved (user not authenticated):', saveError);
            }
        } catch (error) {
            console.error('Failed to regenerate thumbnail:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to regenerate thumbnail';

            // Check if it's an insufficient credits error
            if (errorMessage.toLowerCase().includes('insufficient credits') || errorMessage.includes('402')) {
                setShowSubscriptionModal(true);
            } else {
                setGenerationError(errorMessage);
            }
        } finally {
            setIsRegenerating(false);
        }
    }, [generatedThumbnailUrl, isRegenerating, saveThumbnail]);

    return (
        <section className="relative flex min-h-[90vh] flex-col justify-between overflow-hidden bg-black pt-32 md:pt-40">

            {/* Subscription Modal */}
            <SubscriptionModal
                isOpen={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />

            {/* Intermediary Result Modal */}
            {showResultModal && (
                <PreviewModal
                    thumbnailUrl={generatedThumbnailUrl}
                    onClose={() => setShowResultModal(false)}
                    onSelectLayout={handleSelectLayout}
                    generatedMetadata={generatedMetadata}
                    isLoading={isGenerating}
                    onRegenerateWithImprovements={handleRegenerateWithImprovements}
                    isRegenerating={isRegenerating}
                />
            )}

            {/* YouTube Preview Overlay */}
            {showPreview && generatedThumbnailUrl && (
                <YouTubePreview
                    searchQuery={currentPrompt}
                    userThumbnailUrl={generatedThumbnailUrl}
                    similarVideos={searchResults}
                    onClose={() => setShowPreview(false)}
                    initialViewMode={previewMode}
                    generatedMetadata={generatedMetadata}
                />
            )}

            {/* Background Effects */}
            <div className="absolute inset-0 bg-transparent z-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
            </div>

            <div className="bg-primary/20 absolute -top-24 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full blur-[120px] pointer-events-none" />

            {/* Main Content */}
            <div className="relative z-20 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 text-center">

                {/* Trustpilot Social Proof */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    {/* Trustpilot Rating Row */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#00b67a]">Excellent</span>
                        {renderStars()}
                        <div className="flex items-center gap-1.5 text-sm text-white/80">
                            <span className="text-[#00b67a] text-base">★</span>
                            <span className="font-medium">Trustpilot</span>
                        </div>
                    </div>
                    {/* Trusted Users Pill */}
                    <div className="inline-flex items-center rounded-full border border-white/10 bg-zinc-900/80 px-5 py-2 text-sm font-medium text-zinc-300 backdrop-blur-sm">
                        Trusted by <span className="text-primary font-bold mx-1">1 Million</span> Users
                    </div>
                </div>

                <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
                    Viral <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(220,38,38,0.5)]">Thumbnails.</span> <br />
                    In Seconds.
                </h1>

                <p className="mb-8 max-w-2xl text-lg text-zinc-400">
                    Stop spending hours in Photoshop. Our AI generates high-CTR thumbnails tailored to your niche, style, and face.
                </p>

                <div className="w-full">
                    {/* Model Selector */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="flex items-center gap-1 p-1 bg-zinc-900/80 rounded-full border border-zinc-800">
                            <button
                                onClick={() => setSelectedModel('nano-banana')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    selectedModel === 'nano-banana'
                                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                <Image src="/logo.jpg" alt="Nano Banana" width={16} height={16} className="h-4 w-4 rounded-sm" />
                                <span>Nano Banana Pro</span>
                            </button>
                            <button
                                onClick={() => setSelectedModel('gpt-image-1.5')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                    selectedModel === 'gpt-image-1.5'
                                        ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                <Image src="/openai.png" alt="OpenAI" width={16} height={16} className="h-4 w-4" />
                                <span>GPT Image 1.5</span>
                                <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/30 text-emerald-400 rounded-full">NEW</span>
                            </button>
                        </div>
                    </div>

                    <ChatInput
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        initialImageUrl={editImageUrl}
                        initialPrompt={editPrompt}
                        selectedModel={selectedModel}
                        onImageSelected={handleImageSelected}
                        onReferenceSelected={handleReferenceSelected}
                        onImageRemoved={handleImageRemoved}
                        onReferenceRemoved={handleReferenceRemoved}
                    />

                    {/* Generation Status */}
                    {isGenerating && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-primary animate-pulse">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-sm">Generating your thumbnail...</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {generationError && !isGenerating && (
                        <div className="mt-4 text-sm text-red-400 text-center">
                            {generationError}
                        </div>
                    )}
                </div>

                <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
                </div>
            </div>

            {/* Bottom Marquee Area */}
            <div className="relative h-[600px] w-full overflow-hidden z-0 -mt-32 md:-mt-40">
                {/* Subtle top fade for depth */}
                <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black to-transparent z-10 pointer-events-none" />
                {/* Subtle bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />
                {/* Gallery with 50% opacity like Pikzels */}
                <div className="opacity-50">
                    <Marquee />
                </div>
            </div>
        </section>
    );
}
