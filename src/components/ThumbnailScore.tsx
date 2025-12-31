"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import {
  Flame,
  Eye,
  Sparkles,
  Heart,
  Layout,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  X,
  Loader2,
} from "lucide-react";

interface PillarScore {
  name: string;
  score: number;
  description: string;
  icon: string;
}

interface ThumbnailScoreProps {
  imageUrl: string;
  title?: string;
  onClose?: () => void;
  onRegenerate?: (improvements: string[]) => void;
  isRegenerating?: boolean;
}

interface ScoreData {
  overallScore: number;
  pillars: PillarScore[];
  summary: string;
  improvements: string[];
}

const iconMap: Record<string, React.ReactNode> = {
  flame: <Flame className="w-5 h-5" />,
  eye: <Eye className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  layout: <Layout className="w-5 h-5" />,
};

function getBarColor(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  if (score >= 50) return "text-orange-500";
  return "text-red-500";
}

function CircularScore({ score }: { score: number }) {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative rounded-full bg-black shadow-xl border-2 border-white/20"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
      </div>
    </div>
  );
}

function PillarRow({ pillar }: { pillar: PillarScore }) {
  const [expanded, setExpanded] = useState(false);
  const bars = 6;
  const filledBars = Math.round((pillar.score / 100) * bars);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-red-500">{iconMap[pillar.icon]}</span>
          <span className="text-white font-medium">{pillar.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: bars }).map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-4 rounded-sm ${
                  i < filledBars ? getBarColor(pillar.score) : "bg-white/20"
                }`}
              />
            ))}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-1 pb-3">
          <p className="text-sm text-white/60 leading-relaxed pl-8">{pillar.description}</p>
        </div>
      )}
    </div>
  );
}

export function ThumbnailScore({ imageUrl, title, onClose, onRegenerate, isRegenerating }: ThumbnailScoreProps) {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPremiumError, setIsPremiumError] = useState(false);
  const [showImprovements, setShowImprovements] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { isSignedIn } = useAuth();

  const handleUpgradeToPremium = async () => {
    if (!isSignedIn) {
      window.location.href = '/sign-in?redirect_url=' + encodeURIComponent('/my-thumbnails');
      return;
    }
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'premium', billingCycle: 'monthly' }),
      });
      const data = await response.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        alert(data.error || 'Failed to create checkout session.');
      }
    } catch {
      alert('An error occurred. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const analyzeThumbail = async () => {
    setLoading(true);
    setError(null);
    setIsPremiumError(false);
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, title }),
      });
      const data = await response.json();
      if (!data.success) {
        if (response.status === 403) setIsPremiumError(true);
        throw new Error(data.error || "Failed to analyze thumbnail");
      }
      setScoreData({
        overallScore: data.overallScore,
        pillars: data.pillars,
        summary: data.summary,
        improvements: data.improvements,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />

      {/* Modal Container - absolutely positioned with fixed dimensions */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 flex items-center justify-center">
        <div className="w-full max-w-2xl h-full max-h-[800px] bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl flex flex-col overflow-hidden">

          {/* HEADER - Fixed at top */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-zinc-900">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-red-500" />
              ThumbZap Score
            </h2>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-6 h-6 text-white/70 hover:text-white" />
              </button>
            )}
          </div>

          {/* CONTENT - Scrollable middle */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Thumbnail with score overlay */}
            <div className="relative mb-6">
              <img src={imageUrl} alt="Thumbnail" className="w-full aspect-video object-cover rounded-xl" />
              {scoreData && (
                <div className="absolute -bottom-4 right-4">
                  <CircularScore score={scoreData.overallScore} />
                </div>
              )}
            </div>

            {/* Initial state - not analyzed */}
            {!scoreData && !loading && !error && (
              <div className="text-center py-8">
                <p className="text-white/60 text-lg mb-6">Get AI-powered insights on your thumbnail&apos;s viral potential</p>
                <button
                  onClick={analyzeThumbail}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-lg font-semibold rounded-full"
                >
                  Analyze Thumbnail
                </button>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin mb-4" />
                <p className="text-white/60 text-lg">Analyzing your thumbnail...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-8">
                <p className="text-red-400 text-lg mb-6">{error}</p>
                {isPremiumError ? (
                  <button
                    onClick={handleUpgradeToPremium}
                    disabled={isUpgrading}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white text-lg font-semibold rounded-full disabled:opacity-50"
                  >
                    {isUpgrading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isUpgrading ? 'Redirecting...' : 'Upgrade to Premium'}
                  </button>
                ) : (
                  <button onClick={analyzeThumbail} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-lg rounded-xl">
                    Try Again
                  </button>
                )}
              </div>
            )}

            {/* Results */}
            {scoreData && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-6">
                {/* Summary */}
                <p className="text-white/80 leading-relaxed">{scoreData.summary}</p>

                {/* Pillars */}
                <div className="bg-white/5 rounded-xl overflow-hidden">
                  {scoreData.pillars.map((pillar) => (
                    <PillarRow key={pillar.name} pillar={pillar} />
                  ))}
                </div>

                {/* Improvements */}
                <div className="bg-white/5 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowImprovements(!showImprovements)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <span className="text-white font-medium">How to improve</span>
                    </div>
                    {showImprovements ? <ChevronUp className="w-5 h-5 text-white/50" /> : <ChevronDown className="w-5 h-5 text-white/50" />}
                  </button>
                  {showImprovements && (
                    <ul className="px-4 pb-4 space-y-3">
                      {scoreData.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-3 text-white/70">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span className="leading-relaxed">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* FOOTER - Fixed at bottom, always visible when there's score data */}
          {scoreData && (
            <div className="px-6 py-4 border-t border-zinc-700 bg-zinc-900">
              {onRegenerate ? (
                <button
                  onClick={() => onRegenerate(scoreData.improvements || [])}
                  disabled={isRegenerating}
                  className="w-full py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 text-white text-lg font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Regenerate with Improvements
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={analyzeThumbail}
                  className="w-full py-4 text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-lg"
                >
                  Re-analyze
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Badge component for inline display
export function ThumbnailScoreBadge({ score, onClick }: { score: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur rounded-full border border-white/10 hover:border-white/20"
    >
      <div className="relative w-6 h-6">
        <svg className="transform -rotate-90" width={24} height={24}>
          <circle cx={12} cy={12} r={10} stroke="rgba(255,255,255,0.1)" strokeWidth={2} fill="none" />
          <circle
            cx={12} cy={12} r={10} stroke="#ef4444" strokeWidth={2} fill="none" strokeLinecap="round"
            style={{ strokeDasharray: 62.83, strokeDashoffset: 62.83 - (score / 100) * 62.83 }}
          />
        </svg>
      </div>
      <span className={`text-xs font-semibold ${getScoreColor(score)}`}>{score}</span>
    </button>
  );
}
