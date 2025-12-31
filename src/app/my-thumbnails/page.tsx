"use client";

import { useState, useEffect, Suspense } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import { Trash2, Download, Calendar, Sparkles, Eye, Pencil, CheckCircle, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Id } from "../../../convex/_generated/dataModel";
import dynamic from "next/dynamic";
import { searchYouTube, type YouTubeVideo, type GeneratedMetadata } from "@/lib/youtube";

// Dynamic imports for heavy components - improves initial page load
const PreviewModal = dynamic(
  () => import("@/components/PreviewModal").then((mod) => mod.PreviewModal),
  { ssr: false }
);

const YouTubePreview = dynamic(
  () => import("@/components/YouTubePreview").then((mod) => mod.YouTubePreview),
  { ssr: false }
);

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ThumbnailData {
  _id: Id<"thumbnails">;
  imageUrl: string;
  prompt: string;
  createdAt: number;
  model: string;
  aspectRatio: string;
  resolution: string;
}

function ThumbnailCard({
  thumbnail,
  onDelete,
  onPreview,
  onEdit,
}: {
  thumbnail: ThumbnailData;
  onDelete: () => void;
  onPreview: () => void;
  onEdit: () => void;
}) {
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(thumbnail.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${thumbnail._id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download:", error);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div
      onClick={onPreview}
      className="group relative rounded-2xl border border-[#272727] bg-[#1a1a1a] overflow-hidden transition-all hover:border-[#444] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)] cursor-pointer"
    >
      {/* Thumbnail Image */}
      <div className="relative bg-[#0f0f0f]">
        <Image
          src={thumbnail.imageUrl}
          alt={thumbnail.prompt}
          width={0}
          height={0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="w-full h-auto"
        />
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-5 w-5 text-white" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-primary/20 hover:bg-primary/40"
            onClick={handleEdit}
          >
            <Pencil className="h-5 w-5 text-primary" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20"
            onClick={handleDownload}
          >
            <Download className="h-5 w-5 text-white" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-red-500/20 hover:bg-red-500/40"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <p className="text-sm text-white font-medium line-clamp-2 mb-2">
          {thumbnail.prompt}
        </p>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(thumbnail.createdAt)}</span>
          </div>
          <span>{thumbnail.resolution}</span>
        </div>
      </div>
    </div>
  );
}

function MyThumbnailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoaded: isUserLoaded } = useUser();

  // Use auth-aware query - automatically filters by user via JWT
  const thumbnails = useQuery(api.thumbnails.getUserThumbnails);
  const deleteThumbnail = useMutation(api.thumbnails.deleteThumbnail);
  const saveThumbnail = useMutation(api.thumbnails.saveThumbnail);

  // Subscription success/error state
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<{
    tier: string;
    credits: number;
  } | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  // Verify checkout session on page load (grants credits after Stripe checkout)
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId && !isVerifyingSession) {
      setIsVerifyingSession(true);
      setSubscriptionError(null);

      console.log('[My Thumbnails] Verifying checkout session:', sessionId);

      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(async (res) => {
          const data = await res.json();
          console.log('[My Thumbnails] Verify session response:', data);

          if (data.success) {
            setSubscriptionSuccess({
              tier: data.tier,
              credits: data.credits,
            });
            // Clear URL params after successful verification
            router.replace('/my-thumbnails');
          } else {
            // Show error to user
            console.error('[My Thumbnails] Verify session failed:', data.error);
            setSubscriptionError(data.error || 'Failed to activate subscription. Please contact support.');
          }
        })
        .catch((err) => {
          console.error('[My Thumbnails] Failed to verify session:', err);
          setSubscriptionError('Failed to verify subscription. Please refresh the page or contact support.');
        })
        .finally(() => {
          setIsVerifyingSession(false);
        });
    }
  }, [searchParams, router, isVerifyingSession]);

  // Preview state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showYouTubePreview, setShowYouTubePreview] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<ThumbnailData | null>(null);
  const [previewMode, setPreviewMode] = useState<'home' | 'watch'>('home');
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);
  const [generatedMetadata, setGeneratedMetadata] = useState<GeneratedMetadata | undefined>(undefined);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Delete handler - ownership verified server-side
  const handleDelete = async (id: Id<"thumbnails">) => {
    await deleteThumbnail({ id });
  };

  const handlePreview = async (thumbnail: ThumbnailData) => {
    setSelectedThumbnail(thumbnail);
    setShowPreviewModal(true);

    // Show instant metadata based on stored prompt (no loading delay)
    setGeneratedMetadata({
      title: thumbnail.prompt.slice(0, 60) + (thumbnail.prompt.length > 60 ? "..." : ""),
      channel: "Your Channel",
      views: "2.3M views",
      published: "1 week ago",
    });
    setIsLoadingPreview(false);

    // Fetch YouTube search results in background for the YouTube preview
    try {
      const searchResult = await searchYouTube(thumbnail.prompt);
      setSearchResults(searchResult.videos);
      // Update metadata with AI-generated title if available
      if (searchResult.generatedMetadata) {
        setGeneratedMetadata(searchResult.generatedMetadata);
      }
    } catch (error) {
      console.error("Failed to fetch search results:", error);
      setSearchResults([]);
    }
  };

  const handleSelectLayout = (layout: 'home' | 'watch') => {
    setPreviewMode(layout);
    setShowPreviewModal(false);
    setTimeout(() => setShowYouTubePreview(true), 100);
  };

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedThumbnail(null);
  };

  const handleCloseYouTubePreview = () => {
    setShowYouTubePreview(false);
    setSelectedThumbnail(null);
  };

  const handleEdit = (thumbnail: ThumbnailData) => {
    // Navigate to home page with the image URL as a query parameter
    const params = new URLSearchParams({
      editImage: thumbnail.imageUrl,
      prompt: thumbnail.prompt,
    });
    router.push(`/?${params.toString()}`);
  };

  // Regenerate thumbnail with AI improvements
  const handleRegenerateWithImprovements = async (improvements: string[]) => {
    if (!selectedThumbnail || isRegenerating) return;
    setIsRegenerating(true);

    try {
      const improvementPrompt = `Improve this YouTube thumbnail by: ${improvements.join('. ')}. Make the improvements while maintaining the core subject and composition.`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'edit',
          prompt: improvementPrompt,
          images: [selectedThumbnail.imageUrl],
          hasReferenceImage: false,
          aspectRatio: '16:9',
          resolution: '2k',
          outputFormat: 'png',
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        // Save the regenerated thumbnail
        await saveThumbnail({
          imageUrl: data.imageUrl,
          prompt: `[Improved] ${selectedThumbnail.prompt}`,
          model: 'Nano Banana Pro',
          aspectRatio: '16:9',
          resolution: '2k',
        });

        // Update the selected thumbnail to show the new image
        setSelectedThumbnail({
          ...selectedThumbnail,
          imageUrl: data.imageUrl,
          prompt: `[Improved] ${selectedThumbnail.prompt}`,
        });
      }
    } catch (error) {
      console.error('Regeneration failed:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Show loading state while checking authentication
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Subscription Success Banner */}
      {subscriptionSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-green-500/10 border border-green-500/20 shadow-lg shadow-green-500/5">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-white">
                {subscriptionSuccess.tier.charAt(0).toUpperCase() + subscriptionSuccess.tier.slice(1)} Plan Activated!
              </p>
              <p className="text-xs text-zinc-400">
                {subscriptionSuccess.credits.toLocaleString()} credits added to your account
              </p>
            </div>
            <button
              onClick={() => setSubscriptionSuccess(null)}
              className="ml-4 text-zinc-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Subscription Error Banner */}
      {subscriptionError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5 max-w-md">
            <div className="text-red-500 text-xl">!</div>
            <div>
              <p className="text-sm font-medium text-white">Subscription Activation Failed</p>
              <p className="text-xs text-zinc-400">{subscriptionError}</p>
            </div>
            <button
              onClick={() => setSubscriptionError(null)}
              className="ml-4 text-zinc-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Verifying Session Loading */}
      {isVerifyingSession && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-blue-500/10 border border-blue-500/20 shadow-lg">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-white">Activating your subscription...</p>
              <p className="text-xs text-zinc-400">Please wait while we verify your payment</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedThumbnail && (
        <PreviewModal
          thumbnailUrl={selectedThumbnail.imageUrl}
          onClose={handleClosePreviewModal}
          onSelectLayout={handleSelectLayout}
          generatedMetadata={generatedMetadata}
          isLoading={isLoadingPreview}
          isViewOnly={true}
          onRegenerateWithImprovements={handleRegenerateWithImprovements}
          isRegenerating={isRegenerating}
        />
      )}

      {/* YouTube Preview */}
      {showYouTubePreview && selectedThumbnail && (
        <YouTubePreview
          searchQuery={selectedThumbnail.prompt}
          userThumbnailUrl={selectedThumbnail.imageUrl}
          similarVideos={searchResults}
          onClose={handleCloseYouTubePreview}
          initialViewMode={previewMode}
          generatedMetadata={generatedMetadata}
        />
      )}

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Thumbnails</h1>
            <p className="text-zinc-400 mt-1">
              {user?.firstName ? `${user.firstName}'s` : "Your"} generated thumbnails
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Sparkles className="h-4 w-4" />
            <span>{thumbnails?.length || 0} thumbnails</span>
          </div>
        </div>

        {/* Loading state */}
        {thumbnails === undefined && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {thumbnails?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <Sparkles className="h-10 w-10 text-zinc-600" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No thumbnails yet
            </h2>
            <p className="text-zinc-400 max-w-md">
              Generate your first thumbnail and it will appear here. Your
              creations are saved automatically.
            </p>
          </div>
        )}

        {/* Grid of thumbnails */}
        {thumbnails && thumbnails.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {thumbnails.map((thumbnail) => (
              <ThumbnailCard
                key={thumbnail._id}
                thumbnail={thumbnail}
                onDelete={() => handleDelete(thumbnail._id)}
                onPreview={() => handlePreview(thumbnail)}
                onEdit={() => handleEdit(thumbnail)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
    </div>
  );
}

// Wrapper with Suspense for useSearchParams
export default function MyThumbnailsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MyThumbnailsContent />
    </Suspense>
  );
}
