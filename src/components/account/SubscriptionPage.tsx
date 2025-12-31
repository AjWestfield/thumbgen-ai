"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import {
  CreditCard,
  Zap,
  Crown,
  Sparkles,
  Calendar,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react";

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

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SubscriptionPage() {
  const user = useQuery(api.users.getCurrentUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Query states: undefined = loading, null = no auth/user found, object = has data
  const isLoading = user === undefined;
  const hasUserData = user !== undefined && user !== null;

  const tierKey = hasUserData ? (user.tier as keyof typeof TIER_CONFIG | undefined) : undefined;
  const tierConfig = tierKey ? TIER_CONFIG[tierKey] : null;
  const TierIcon = tierConfig?.icon || Zap;

  const creditsRemaining = hasUserData ? (user.credits ?? 0) : 0;
  const creditsTotal = hasUserData ? (user.creditsPerMonth ?? 0) : 0;
  const usagePercentage = creditsTotal > 0 ? (creditsRemaining / creditsTotal) * 100 : 0;

  const handleManageSubscription = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    window.location.href = "/#pricing";
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Subscription</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your plan and billing
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Subscription</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your plan and billing
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-400">Current Plan</span>
          {hasUserData && user.subscriptionStatus === "active" && tierConfig ? (
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${tierConfig.bgColor} ${tierConfig.color} border ${tierConfig.borderColor}`}
            >
              <TierIcon className="w-4 h-4" />
              {tierConfig.name}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-zinc-800/50 text-zinc-400 border border-zinc-700/50">
              Free Plan
            </span>
          )}
        </div>

        {/* Billing Cycle */}
        {hasUserData && user.billingCycle && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Billing Cycle</span>
            <span className="text-sm text-white">
              {user.billingCycle === "annual" ? "Annual" : "Monthly"}
            </span>
          </div>
        )}

        {/* Next Billing Date */}
        {hasUserData && user.currentPeriodEnd && user.subscriptionStatus === "active" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {user.cancelAtPeriodEnd ? "Cancels on" : "Next billing"}
              </span>
            </div>
            <span className="text-sm text-white">
              {formatDate(user.currentPeriodEnd)}
            </span>
          </div>
        )}

        {/* Cancellation Warning */}
        {hasUserData && user.cancelAtPeriodEnd && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-400">
              Your subscription will be canceled at the end of the billing period.
              You can resubscribe anytime.
            </p>
          </div>
        )}
      </div>

      {/* Credits Card */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-400">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm font-medium">Credits</span>
          </div>
          <span className="text-lg font-semibold text-white">
            {creditsRemaining.toLocaleString()}
            {creditsTotal > 0 && (
              <span className="text-zinc-500 font-normal text-sm">
                {" "}/ {creditsTotal.toLocaleString()}
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar */}
        {creditsTotal > 0 && (
          <div className="space-y-2">
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercentage > 20
                    ? "bg-gradient-to-r from-red-500 to-red-600"
                    : usagePercentage > 5
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.max(2, usagePercentage)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {Math.round(usagePercentage)}% remaining this billing period
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {hasUserData && user.stripeCustomerId ? (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                       bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50
                       text-white rounded-lg transition-colors"
          >
            {loading ? (
              "Loading..."
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Manage Billing
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                       bg-[#FF0000] hover:bg-[#FF0000]/90
                       text-white font-medium rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Upgrade Plan
          </button>
        )}

        {hasUserData && user.stripeCustomerId && !user.cancelAtPeriodEnd && (
          <button
            onClick={handleUpgrade}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                       border border-zinc-700 hover:bg-zinc-800
                       text-zinc-300 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Change Plan
          </button>
        )}
      </div>

      {/* Info Footer */}
      <p className="text-xs text-zinc-500 text-center">
        Credits reset at the start of each billing period.
        <br />
        Unused credits do not roll over.
      </p>
    </div>
  );
}
