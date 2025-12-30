"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";

const plans = [
    {
        name: "Essential",
        monthlyPrice: 20,
        annualPrice: 14,
        credits: 400,
        thumbnails: 40,
        popular: false,
        topFeatures: [
            { name: "400 credits/month", included: true },
            { name: "Thumbnail Generator", included: true },
            { name: "Edit Thumbnail", included: true },
            { name: "ThumbZap Score™", included: false },
            { name: "FaceSwap", included: false },
        ],
    },
    {
        name: "Premium",
        monthlyPrice: 40,
        annualPrice: 28,
        credits: 1500,
        thumbnails: 150,
        popular: true,
        topFeatures: [
            { name: "1,500 credits/month", included: true },
            { name: "Thumbnail Generator", included: true },
            { name: "ThumbZap Score™", included: true },
            { name: "FaceSwap", included: true },
            { name: "One-Click Fix™", included: true },
        ],
    },
    {
        name: "Ultimate",
        monthlyPrice: 80,
        annualPrice: 56,
        credits: 4500,
        thumbnails: 450,
        popular: false,
        topFeatures: [
            { name: "4,500 credits/month", included: true },
            { name: "All Premium Features", included: true },
            { name: "Private Generations", included: true },
            { name: "Early Access", included: true },
            { name: "Priority Support", included: true },
        ],
    },
];

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const { isSignedIn } = useAuth();

    if (!isOpen) return null;

    const handleSubscribe = async (planName: string) => {
        if (!isSignedIn) {
            window.location.href = '/sign-in?redirect_url=' + encodeURIComponent('/#pricing');
            return;
        }

        setLoadingTier(planName);

        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tier: planName.toLowerCase(),
                    billingCycle: isAnnual ? 'annual' : 'monthly',
                }),
            });

            const data = await response.json();

            if (data.sessionUrl) {
                window.location.href = data.sessionUrl;
            } else {
                console.error('Checkout error:', data.error);
                alert(data.error || 'Failed to create checkout session. Please try again.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            setLoadingTier(null);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="relative w-full max-w-5xl mx-4 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                    <X className="w-5 h-5 text-zinc-400" />
                </button>

                {/* Header */}
                <div className="text-center pt-8 pb-6 px-6">
                    <div className="inline-flex items-center gap-2 bg-[#FF0000]/10 text-[#FF0000] px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Subscribe to Generate
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Choose Your Plan
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Get credits to generate unlimited AI thumbnails
                    </p>

                    {/* Monthly/Annual Toggle */}
                    <div className="flex flex-col items-center gap-2 mt-6">
                        <div className="inline-flex items-center rounded-full border border-zinc-800 bg-black p-1">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={cn(
                                    "rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-200",
                                    !isAnnual
                                        ? "bg-[#FF0000] text-white"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={cn(
                                    "rounded-full px-5 py-1.5 text-sm font-semibold transition-all duration-200",
                                    isAnnual
                                        ? "bg-[#FF0000] text-white"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                Annually
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Save <span className="text-[#FF0000] font-bold">30%</span> with annual
                        </p>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid gap-4 md:grid-cols-3 px-6 pb-8">
                    {plans.map((plan) => {
                        const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;

                        return (
                            <div
                                key={plan.name}
                                className={cn(
                                    "relative flex flex-col rounded-xl p-5 transition-all duration-200",
                                    plan.popular
                                        ? "border-2 border-[#FF0000] bg-zinc-900/50"
                                        : "border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                                )}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 right-0 left-0 mx-auto w-max bg-[#FF0000] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white rounded-full flex items-center gap-1.5">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                        </span>
                                        Most Popular
                                    </div>
                                )}

                                {/* Plan Name */}
                                <h3 className="text-base font-bold text-[#FF0000] mb-3">{plan.name}</h3>

                                {/* Price */}
                                <div className="flex items-baseline mb-2">
                                    <span className="text-3xl font-bold text-white">${price}</span>
                                    <span className="ml-1 text-sm text-zinc-400">/mo</span>
                                </div>

                                {/* Thumbnails */}
                                <p className="mb-4 text-xs text-zinc-400">
                                    Up to <span className="text-[#FF0000] font-semibold">{plan.thumbnails}</span> thumbnails/month
                                </p>

                                {/* Features */}
                                <div className="flex flex-col gap-2 text-sm flex-1 mb-4">
                                    {plan.topFeatures.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            {feature.included ? (
                                                <Check className="h-3.5 w-3.5 text-[#FF0000] shrink-0" strokeWidth={3} />
                                            ) : (
                                                <X className="h-3.5 w-3.5 text-zinc-600 shrink-0" strokeWidth={3} />
                                            )}
                                            <span className={cn(
                                                "text-xs",
                                                feature.included ? "text-zinc-300" : "text-zinc-500"
                                            )}>
                                                {feature.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Subscribe Button */}
                                <Button
                                    onClick={() => handleSubscribe(plan.name)}
                                    disabled={loadingTier === plan.name}
                                    className={cn(
                                        "w-full rounded-full h-9 text-sm font-bold transition-all duration-200",
                                        plan.popular
                                            ? "bg-[#FF0000] hover:bg-[#FF0000]/90 text-white"
                                            : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                    )}
                                >
                                    {loadingTier === plan.name ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Subscribe'
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
