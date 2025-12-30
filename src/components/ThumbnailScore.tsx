"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  className?: string;
}

interface ScoreData {
  overallScore: number;
  pillars: PillarScore[];
  summary: string;
  improvements: string[];
}

const iconMap: Record<string, React.ReactNode> = {
  flame: <Flame className="w-4 h-4" />,
  eye: <Eye className="w-4 h-4" />,
  sparkles: <Sparkles className="w-4 h-4" />,
  heart: <Heart className="w-4 h-4" />,
  layout: <Layout className="w-4 h-4" />,
};

function getScoreColor(score: number): string {
  if (score >= 85) return "text-green-500";
  if (score >= 70) return "text-yellow-500";
  if (score >= 50) return "text-orange-500";
  return "text-red-500";
}

function getScoreGradient(score: number): string {
  if (score >= 85) return "from-green-500 to-emerald-400";
  if (score >= 70) return "from-yellow-500 to-amber-400";
  if (score >= 50) return "from-orange-500 to-amber-500";
  return "from-red-500 to-rose-400";
}

function getBarColor(score: number): string {
  if (score >= 85) return "bg-green-500";
  if (score >= 70) return "bg-yellow-500";
  if (score >= 50) return "bg-orange-500";
  return "bg-red-500";
}

function CircularScore({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative rounded-full bg-black/90 backdrop-blur-sm shadow-2xl border-2 border-white/20"
      style={{ width: size, height: size }}
    >
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-black text-white drop-shadow-lg"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
}

function PillarBar({ pillar, index }: { pillar: PillarScore; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const bars = 6;
  const filledBars = Math.round((pillar.score / 100) * bars);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.1 }}
      className="space-y-1"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-500">{iconMap[pillar.icon]}</span>
          <span className="text-sm text-white/90">{pillar.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: bars }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-4 rounded-sm transition-colors ${
                  i < filledBars ? getBarColor(pillar.score) : "bg-white/10"
                }`}
              />
            ))}
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-white/80" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-white/60 pl-6 py-2">{pillar.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ThumbnailScore({ imageUrl, title, onClose, onRegenerate, isRegenerating, className = "" }: ThumbnailScoreProps) {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImprovements, setShowImprovements] = useState(false);

  const analyzeThumbail = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, title }),
      });

      const data = await response.json();

      if (!data.success) {
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
    <div className={`bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-red-500">
            <Sparkles className="w-4 h-4" />
          </span>
          ThumbZap Score
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        )}
      </div>

      <div className="p-4 pt-6">
        {/* Thumbnail Preview with Score Overlay */}
        <div className="relative mb-4 overflow-visible mt-2">
          <img
            src={imageUrl}
            alt="Thumbnail"
            className="w-full aspect-video object-cover rounded-lg"
          />
          {scoreData && (
            <div className="absolute bottom-2 right-2 z-10">
              <CircularScore score={scoreData.overallScore} size={70} />
            </div>
          )}
        </div>

        {/* Not Analyzed State */}
        {!scoreData && !loading && !error && (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm mb-4">
              Get AI-powered insights on your thumbnail&apos;s viral potential
            </p>
            <button
              onClick={analyzeThumbail}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-sm font-medium rounded-full transition-all"
            >
              Analyze Thumbnail
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
            <p className="text-white/60 text-sm">Analyzing your thumbnail...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-4">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={analyzeThumbail}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Score Results */}
        {scoreData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Summary */}
            <p className="text-sm text-white/70">{scoreData.summary}</p>

            {/* Pillars */}
            <div className="space-y-3 py-2">
              {scoreData.pillars.map((pillar, index) => (
                <PillarBar key={pillar.name} pillar={pillar} index={index} />
              ))}
            </div>

            {/* Improvements Section */}
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowImprovements(!showImprovements)}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <span>How to improve</span>
                {showImprovements ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <AnimatePresence>
                {showImprovements && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 space-y-2 overflow-hidden"
                  >
                    {scoreData.improvements.map((improvement, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-white/60"
                      >
                        <span className="text-red-500 mt-0.5">•</span>
                        {improvement}
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Regenerate Button - Uses all improvements from "How to improve" section */}
            {onRegenerate ? (
              <button
                onClick={() => onRegenerate(scoreData?.improvements || [])}
                disabled={isRegenerating}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={analyzeThumbail}
                className="w-full py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Re-analyze
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Compact version for inline display
export function ThumbnailScoreBadge({
  score,
  onClick,
}: {
  score: number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 backdrop-blur rounded-full border border-white/10 hover:border-white/20 transition-colors"
    >
      <div className="relative w-6 h-6">
        <svg className="transform -rotate-90" width={24} height={24}>
          <circle
            cx={12}
            cy={12}
            r={10}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2}
            fill="none"
          />
          <circle
            cx={12}
            cy={12}
            r={10}
            stroke="#ef4444"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            style={{
              strokeDasharray: 62.83,
              strokeDashoffset: 62.83 - (score / 100) * 62.83,
            }}
          />
        </svg>
      </div>
      <span className={`text-xs font-semibold ${getScoreColor(score)}`}>{score}</span>
    </button>
  );
}
