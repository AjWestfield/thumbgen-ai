"use client";

import { useState, useRef, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CreditCard,
  ImageIcon,
  Zap,
  Crown,
  Sparkles,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

// Tier display configuration
const TIER_CONFIG = {
  essential: {
    name: "Essential",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    icon: Zap,
  },
  premium: {
    name: "Premium",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    icon: Crown,
  },
  ultimate: {
    name: "Ultimate",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    icon: Sparkles,
  },
} as const;

export function UserMenuButton() {
  const { user: clerkUser, isSignedIn } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Skip queries if not signed in to avoid auth errors
  const user = useQuery(api.users.getCurrentUser, isSignedIn ? undefined : "skip");
  const thumbnailCount = useQuery(api.thumbnails.getThumbnailCount, isSignedIn ? undefined : "skip");

  const tierKey = user?.tier as keyof typeof TIER_CONFIG | undefined;
  const tierConfig = tierKey ? TIER_CONFIG[tierKey] : null;
  const TierIcon = tierConfig?.icon || Zap;

  // Credits calculations
  const creditsRemaining = user?.credits ?? 0;
  const creditsTotal = user?.creditsPerMonth ?? 0;
  const creditsUsed = creditsTotal > 0 ? creditsTotal - creditsRemaining : 0;
  const usagePercentage = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!clerkUser) return null;

  const initials = clerkUser.firstName && clerkUser.lastName
    ? `${clerkUser.firstName[0]}${clerkUser.lastName[0]}`
    : clerkUser.firstName?.[0] || clerkUser.emailAddresses[0]?.emailAddress[0]?.toUpperCase() || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-red-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-black"
      >
        {clerkUser.imageUrl ? (
          <img
            src={clerkUser.imageUrl}
            alt={clerkUser.fullName || "User"}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-600 text-white text-sm font-semibold flex-shrink-0">
                {clerkUser.imageUrl ? (
                  <img
                    src={clerkUser.imageUrl}
                    alt={clerkUser.fullName || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">
                  {clerkUser.fullName || "User"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {clerkUser.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription & Usage Section */}
          <div className="px-4 py-3 border-b border-zinc-800/50 space-y-3">
            {/* Subscription Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Plan
              </span>
              {user?.subscriptionStatus === "active" && tierConfig ? (
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tierConfig.bgColor} ${tierConfig.color} border ${tierConfig.borderColor}`}
                >
                  <TierIcon className="w-3 h-3" />
                  {tierConfig.name}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
                  Free Plan
                </span>
              )}
            </div>

            {/* Credits */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-sm">Credits</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {creditsRemaining.toLocaleString()}
                  {creditsTotal > 0 && (
                    <span className="text-zinc-500 font-normal">
                      {" "}/ {creditsTotal.toLocaleString()}
                    </span>
                  )}
                </span>
              </div>

              {/* Progress Bar */}
              {creditsTotal > 0 && (
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      usagePercentage > 20
                        ? "bg-gradient-to-r from-primary to-red-500"
                        : usagePercentage > 5
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${Math.max(2, usagePercentage)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Thumbnails Generated */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/30">
              <div className="flex items-center gap-2 text-zinc-400">
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">Generated</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {(thumbnailCount ?? 0).toLocaleString()} thumbnails
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                openUserProfile();
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-zinc-500" />
                <span>Manage account</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                signOut({ redirectUrl: "/" });
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <LogOut className="w-4 h-4 text-zinc-500" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
