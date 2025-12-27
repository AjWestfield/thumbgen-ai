"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, ArrowUp, Image as ImageIcon, X, Youtube, Upload, Link2, Plus } from "lucide-react";
import { GlowingShadow } from "@/components/ui/glowing-shadow";

// Custom Face Swap icon component - face detection style
const FaceSwapIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Corner brackets - scan frame */}
        <path d="M4 7V4h3" />
        <path d="M20 7V4h-3" />
        <path d="M4 17v3h3" />
        <path d="M20 17v3h-3" />

        {/* Simple face */}
        <circle cx="12" cy="11" r="5" />
        <circle cx="10" cy="10" r="0.5" fill="currentColor" />
        <circle cx="14" cy="10" r="0.5" fill="currentColor" />
        <path d="M10 13c.5.5 1.5 1 2 1s1.5-.5 2-1" />
    </svg>
);
import { cn } from "@/lib/utils";

// Reference image can be either a file upload or a YouTube URL
export interface ReferenceImage {
    type: 'file' | 'youtube';
    file?: File;
    previewUrl: string;
    youtubeVideoId?: string;
}

interface ChatInputProps {
    onGenerate?: (prompt: string, imageFiles?: File[], referenceImage?: ReferenceImage, faceSwapMode?: boolean) => void;
    isGenerating?: boolean;
    initialImageUrl?: string | null;
    initialPrompt?: string | null;
    selectedModel?: 'nano-banana' | 'gpt-image-1.5';
    // Callbacks for background pre-upload (instant UX)
    onImageSelected?: (file: File, id: string) => void;
    onReferenceSelected?: (reference: ReferenceImage) => void;
    onImageRemoved?: (id: string) => void;
    onReferenceRemoved?: () => void;
}

interface UploadedImage {
    id: string;
    file: File;
    previewUrl: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_UPLOADED_IMAGES = 3; // Maximum images for compositing
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
        /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/  // Direct video ID
    ];

    const trimmedUrl = url.trim();
    for (const pattern of patterns) {
        const match = trimmedUrl.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Get high-res YouTube thumbnail URL
function getYouTubeThumbnailUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

// Placeholder suggestions for the input field
const PLACEHOLDER_SUGGESTIONS = [
    "Turn this selfie into a viral MrBeast-style thumbnail...",
    "Add a shocked expression and a red arrow pointing to the car...",
    "Make the background dramatic with high contrast 'VS' text...",
    "Style this like a tech review with a futuristic glow...",
    "Create a clickbaity split-screen comparison..."
];

export function ChatInput({
    onGenerate,
    isGenerating = false,
    initialImageUrl,
    initialPrompt,
    selectedModel = 'gpt-image-1.5',
    onImageSelected,
    onReferenceSelected,
    onImageRemoved,
    onReferenceRemoved,
}: ChatInputProps) {
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
    const [referenceError, setReferenceError] = useState<string | null>(null);
    const [showReferenceDropdown, setShowReferenceDropdown] = useState(false);
    const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [initialImageLoaded, setInitialImageLoaded] = useState(false);
    const [faceSwapMode, setFaceSwapMode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const referenceInputRef = useRef<HTMLInputElement>(null);

    // Load initial image from URL (for editing existing thumbnails)
    useEffect(() => {
        if (initialImageUrl && !initialImageLoaded) {
            setInitialImageLoaded(true);

            // Fetch the image and convert to File
            fetch(initialImageUrl)
                .then(response => response.blob())
                .then(blob => {
                    const file = new File([blob], 'edit-image.png', { type: blob.type || 'image/png' });
                    const previewUrl = URL.createObjectURL(blob);
                    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    setUploadedImages([{ id, file, previewUrl }]);
                })
                .catch(error => {
                    console.error('Failed to load initial image:', error);
                    setUploadError('Failed to load image for editing');
                });
        }
    }, [initialImageUrl, initialImageLoaded]);

    // Set initial prompt if provided
    useEffect(() => {
        if (initialPrompt && input === "") {
            setInput(initialPrompt);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPrompt]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log('[Upload] File selected:', file.name, file.type, file.size);
        setUploadError(null);

        // Check if we've reached the limit
        if (uploadedImages.length >= MAX_UPLOADED_IMAGES) {
            setUploadError(`Maximum ${MAX_UPLOADED_IMAGES} images allowed`);
            return;
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            setUploadError("Please upload a JPG, PNG, or WebP image");
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setUploadError("Image must be less than 10MB");
            return;
        }

        // Generate unique ID for this image
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create preview URL instantly (no base64 conversion yet)
        const previewUrl = URL.createObjectURL(file);
        console.log('[Upload] Created blob URL:', previewUrl);

        // Add to array
        setUploadedImages(prev => [...prev, { id, file, previewUrl }]);

        // Trigger background pre-upload immediately
        onImageSelected?.(file, id);

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleReferenceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setReferenceError(null);
        setShowReferenceDropdown(false);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setReferenceError("Please upload a JPG, PNG, or WebP image");
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setReferenceError("Reference image must be less than 10MB");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        const reference: ReferenceImage = { type: 'file', file, previewUrl };
        setReferenceImage(reference);

        // Trigger background pre-upload immediately
        onReferenceSelected?.(reference);

        if (referenceInputRef.current) {
            referenceInputRef.current.value = '';
        }
    };

    const handleYoutubeUrl = () => {
        setReferenceError(null);
        const videoId = extractYouTubeVideoId(youtubeUrlInput);

        if (!videoId) {
            setReferenceError("Invalid YouTube URL. Please enter a valid YouTube video link.");
            return;
        }

        const thumbnailUrl = getYouTubeThumbnailUrl(videoId);
        const reference: ReferenceImage = {
            type: 'youtube',
            previewUrl: thumbnailUrl,
            youtubeVideoId: videoId
        };
        setReferenceImage(reference);

        // Trigger background pre-upload immediately (will fetch and upload YouTube thumbnail)
        onReferenceSelected?.(reference);

        setYoutubeUrlInput("");
        setShowYoutubeInput(false);
        setShowReferenceDropdown(false);
    };

    const removeImage = (id: string) => {
        setUploadedImages(prev => {
            const imageToRemove = prev.find(img => img.id === id);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            return prev.filter(img => img.id !== id);
        });
        setUploadError(null);
        // Notify parent to cancel/clear specific pre-upload
        onImageRemoved?.(id);
    };

    const removeReference = () => {
        if (referenceImage?.type === 'file' && referenceImage.previewUrl) {
            URL.revokeObjectURL(referenceImage.previewUrl);
        }
        setReferenceImage(null);
        setReferenceError(null);
        // Notify parent to cancel/clear pre-upload
        onReferenceRemoved?.();
    };

    const [canSubmit, setCanSubmit] = useState(false);

    // Placeholder cycling logic
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholderText, setPlaceholderText] = useState("");

    useEffect(() => {
        if (uploadedImages.length > 0) return;

        const currentText = PLACEHOLDER_SUGGESTIONS[placeholderIndex];
        let charIndex = 0;
        let typingInterval: NodeJS.Timeout;
        let pauseTimeout: NodeJS.Timeout;

        const type = () => {
            if (charIndex <= currentText.length) {
                setPlaceholderText(currentText.slice(0, charIndex));
                charIndex++;
                typingInterval = setTimeout(type, 30);
            } else {
                pauseTimeout = setTimeout(() => {
                    setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
                }, 3000);
            }
        };

        type();

        return () => {
            clearTimeout(typingInterval);
            clearTimeout(pauseTimeout);
        };
    }, [placeholderIndex, uploadedImages.length]);

    // Text-only mode: No images uploaded (both models now support text-to-image)
    const isTextOnlyMode = uploadedImages.length === 0;

    useEffect(() => {
        const hasInput = input.trim().length > 0;
        const hasUploadedImages = uploadedImages.length > 0;
        const hasReferenceImage = referenceImage !== null;

        if (faceSwapMode) {
            // Face swap mode: need at least one image and reference (prompt optional)
            setCanSubmit(hasUploadedImages && hasReferenceImage);
        } else if (!hasUploadedImages) {
            // Text-only mode (both Nano Banana Pro and GPT Image 1.5 support text-to-image)
            setCanSubmit(hasInput);
        } else {
            // Edit mode: need images + (prompt or reference)
            setCanSubmit(hasUploadedImages && (hasInput || hasReferenceImage));
        }
    }, [input, uploadedImages, referenceImage, faceSwapMode, selectedModel]);

    const handleGenerate = () => {
        if (canSubmit && onGenerate && !isGenerating) {
            const files = uploadedImages.map(img => img.file);
            onGenerate(input, files.length > 0 ? files : undefined, referenceImage || undefined, faceSwapMode);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    return (
        <GlowingShadow className="w-full max-w-3xl mx-auto" isFocused={isFocused}>
            <div
                className={cn(
                    "relative w-full flex flex-col rounded-2xl border border-white/20 bg-zinc-900 transition-all duration-300",
                    isFocused
                        ? "border-primary ring-1 ring-primary/50 bg-zinc-900 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                        : ""
                )}
            >
            <div className="relative flex flex-col p-4">
                {/* Image Previews - Grid Gallery */}
                {(uploadedImages.length > 0 || referenceImage) && (
                    <div className="flex gap-4 mb-4">
                        {/* Uploaded Images Grid */}
                        <div className="flex gap-2">
                            {uploadedImages.map((image, index) => (
                                <div key={image.id} className="relative">
                                    <div className="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wide">
                                        {faceSwapMode ? `Face ${index + 1}` : `Image ${index + 1}`}
                                    </div>
                                    <div className="relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image.previewUrl}
                                            alt={`Uploaded image ${index + 1}`}
                                            className="h-24 w-auto min-w-[60px] max-w-[120px] rounded-lg object-cover border border-white/10 bg-zinc-800"
                                            onLoad={() => console.log('[Upload] Image preview loaded successfully:', image.id)}
                                            onError={(e) => {
                                                console.error('[Upload] Image preview failed to load:', image.previewUrl);
                                                // Show placeholder instead of hiding
                                                const target = e.target as HTMLImageElement;
                                                target.style.backgroundColor = '#374151';
                                                target.alt = 'Failed to load';
                                            }}
                                        />
                                        <button
                                            onClick={() => removeImage(image.id)}
                                            className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                                            type="button"
                                            aria-label={`Remove image ${index + 1}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add More Button (show only if has images and under limit) */}
                            {uploadedImages.length > 0 && uploadedImages.length < MAX_UPLOADED_IMAGES && (
                                <div className="relative">
                                    <div className="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wide opacity-0">
                                        Add
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="h-24 w-20 rounded-lg border-2 border-dashed border-zinc-600 hover:border-zinc-500 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-400 transition-colors"
                                        type="button"
                                        aria-label="Add another image"
                                    >
                                        <Plus className="h-5 w-5" />
                                        <span className="text-[10px]">Add</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Reference Thumbnail */}
                        {referenceImage && (
                            <div className="relative">
                                <div className="text-[10px] text-zinc-500 mb-1 font-medium uppercase tracking-wide flex items-center gap-1">
                                    {faceSwapMode ? "Swap Onto" : "Reference Style"}
                                    {referenceImage.type === 'youtube' && (
                                        <Youtube className="h-3 w-3 text-red-500" />
                                    )}
                                </div>
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={referenceImage.previewUrl}
                                        alt="Reference thumbnail"
                                        className="h-24 w-auto rounded-lg object-cover border border-primary/30"
                                        onError={(e) => {
                                            // Fallback to hqdefault if maxresdefault doesn't exist
                                            if (referenceImage.youtubeVideoId) {
                                                (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${referenceImage.youtubeVideoId}/hqdefault.jpg`;
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={removeReference}
                                        className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-all shadow-lg"
                                        type="button"
                                        aria-label="Remove reference image"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Upload/Reference Errors */}
                {(uploadError || referenceError) && (
                    <div className="mb-3 text-sm text-red-400">
                        {uploadError || referenceError}
                    </div>
                )}

                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                        faceSwapMode
                            ? "Optional: Add styling instructions..."
                            : isTextOnlyMode
                                ? "Describe the thumbnail you want to generate..."
                                : uploadedImages.length > 0
                                    ? `Describe how you want to edit ${uploadedImages.length > 1 ? 'these images' : 'this image'}...`
                                    : placeholderText
                    }
                    className="min-h-[60px] w-full resize-none border-0 bg-transparent dark:bg-transparent focus:bg-transparent text-lg text-white placeholder:text-zinc-500 focus-visible:ring-0 shadow-none px-0"
                    rows={1}
                />

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* Hidden file inputs */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileSelect}
                            className="hidden"
                            aria-label="Upload image file"
                        />
                        <input
                            ref={referenceInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleReferenceFileSelect}
                            className="hidden"
                            aria-label="Upload reference image file"
                        />

                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "h-9 rounded-full transition-colors",
                                uploadedImages.length > 0
                                    ? "text-primary hover:text-primary hover:bg-primary/10"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            )}
                            title={uploadedImages.length >= MAX_UPLOADED_IMAGES ? `Max ${MAX_UPLOADED_IMAGES} images` : "Upload Image"}
                            disabled={uploadedImages.length >= MAX_UPLOADED_IMAGES}
                        >
                            <ImageIcon className="h-4 w-4" />
                            <span className="sr-only">Upload Image</span>
                        </Button>

                        {/* Face Swap Toggle */}
                        <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={() => setFaceSwapMode(!faceSwapMode)}
                            className={cn(
                                "h-9 rounded-full transition-colors",
                                faceSwapMode
                                    ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 hover:text-violet-300"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                            )}
                        >
                            <FaceSwapIcon className="mr-2 h-4 w-4" />
                            <span>{faceSwapMode ? "Face Swap" : "Face Swap"}</span>
                        </Button>

                        {/* Add Reference Button with Dropdown */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                onClick={() => setShowReferenceDropdown(!showReferenceDropdown)}
                                className={cn(
                                    "h-9 rounded-full transition-colors",
                                    referenceImage
                                        ? "text-primary hover:text-primary hover:bg-primary/10"
                                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                                )}
                            >
                                <Paperclip className="mr-2 h-4 w-4" />
                                <span>{referenceImage ? "Change Reference" : faceSwapMode ? "Target Image" : "Add Reference"}</span>
                            </Button>

                            {/* Reference Dropdown */}
                            {showReferenceDropdown && (
                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50">
                                    {!showYoutubeInput ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => referenceInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-zinc-800 transition-colors"
                                            >
                                                <Upload className="h-4 w-4 text-zinc-400" />
                                                <div className="text-left">
                                                    <div className="font-medium">Upload Image</div>
                                                    <div className="text-xs text-zinc-500">Use a thumbnail from your device</div>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowYoutubeInput(true)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-zinc-800 transition-colors border-t border-zinc-800"
                                            >
                                                <Youtube className="h-4 w-4 text-red-500" />
                                                <div className="text-left">
                                                    <div className="font-medium">YouTube URL</div>
                                                    <div className="text-xs text-zinc-500">Extract thumbnail from a video</div>
                                                </div>
                                            </button>
                                        </>
                                    ) : (
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Youtube className="h-4 w-4 text-red-500" />
                                                <span className="text-sm font-medium text-white">Paste YouTube URL</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={youtubeUrlInput}
                                                    onChange={(e) => setYoutubeUrlInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleYoutubeUrl()}
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary"
                                                    autoFocus
                                                />
                                                <Button
                                                    size="sm"
                                                    type="button"
                                                    onClick={handleYoutubeUrl}
                                                    className="px-3"
                                                >
                                                    <Link2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowYoutubeInput(false);
                                                    setYoutubeUrlInput("");
                                                }}
                                                className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
                                            >
                                                ← Back to options
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Model Indicator */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
                            <Image
                                src={selectedModel === 'gpt-image-1.5' ? "/openai.png" : "/logo.jpg"}
                                alt={selectedModel === 'gpt-image-1.5' ? "OpenAI" : "Nano Banana"}
                                width={14}
                                height={14}
                                className="h-3.5 w-3.5 rounded-sm"
                            />
                            <span className="text-xs text-zinc-400">
                                {selectedModel === 'gpt-image-1.5' ? "GPT Image 1.5" : "Nano Banana Pro"}
                            </span>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        onClick={handleGenerate}
                        className={cn(
                            "h-9 w-9 rounded-full transition-all duration-300",
                            canSubmit ? "bg-primary text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] hover:scale-105" : "bg-zinc-800 text-zinc-500"
                        )}
                        disabled={!canSubmit}
                    >
                        {isGenerating ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                            <ArrowUp className="h-4 w-4" />
                        )}
                        <span className="sr-only">Generate</span>
                    </Button>
                </div>

                {/* Helper text for face swap mode */}
                {faceSwapMode && (
                    <p className="mt-3 text-xs text-zinc-500 text-center">
                        {uploadedImages.length === 0 && !referenceImage
                            ? "Upload your face(s) and a target image to swap onto"
                            : uploadedImages.length === 0
                                ? "Upload image(s) with your face"
                                : !referenceImage
                                    ? "Add a target image to swap your face(s) onto"
                                    : `Ready to swap ${uploadedImages.length} face${uploadedImages.length > 1 ? 's' : ''}!`}
                    </p>
                )}

                {/* Helper text for generation modes */}
                {!faceSwapMode && (
                    <p className="mt-3 text-xs text-zinc-500 text-center">
                        {uploadedImages.length > 0
                            ? `Edit mode — ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} (max ${MAX_UPLOADED_IMAGES})`
                            : "Text-to-image — upload images to composite"}
                    </p>
                )}
            </div>

            {/* Background Glow Effect */}
            {isFocused && (
                <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 to-transparent opacity-50 rounded-2xl" />
            )}

            </div>
        </GlowingShadow>
    );
}
