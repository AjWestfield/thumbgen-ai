"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Essential",
        monthlyPrice: 20,
        annualPrice: 14,
        monthlyCredits: 400,
        annualCredits: 4800,
        monthlyThumbnails: 40,
        annualThumbnails: 480,
        popular: false,
        features: [
            { name: "400 credits", included: true },
            { name: "Works in Any Language", included: true },
            { name: "Thumbnail Generator", included: true },
            { name: "Edit Thumbnail", included: true },
            { name: "ThumbZap Score™", included: false },
            { name: "One-Click Fix™", included: false },
            { name: "Personas", included: false },
            { name: "Styles", included: false },
            { name: "Thumbnail Recreation", included: false },
            { name: "FaceSwap", included: false },
            { name: "Title Generator", included: false },
            { name: "All Generations Remain Private", included: false },
            { name: "Early Access to New Features", included: false },
        ],
    },
    {
        name: "Premium",
        monthlyPrice: 40,
        annualPrice: 28,
        monthlyCredits: 1500,
        annualCredits: 18000,
        monthlyThumbnails: 150,
        annualThumbnails: 1800,
        popular: true,
        features: [
            { name: "1,500 credits", included: true },
            { name: "Works in Any Language", included: true },
            { name: "Thumbnail Generator", included: true },
            { name: "Edit Thumbnail", included: true },
            { name: "ThumbZap Score™", included: true },
            { name: "One-Click Fix™", included: true },
            { name: "Personas", included: true },
            { name: "Styles", included: true },
            { name: "Thumbnail Recreation", included: true },
            { name: "FaceSwap", included: true },
            { name: "Title Generator", included: true },
            { name: "All Generations Remain Private", included: false },
            { name: "Early Access to New Features", included: false },
        ],
    },
    {
        name: "Ultimate",
        monthlyPrice: 80,
        annualPrice: 56,
        monthlyCredits: 4500,
        annualCredits: 54000,
        monthlyThumbnails: 450,
        annualThumbnails: 5400,
        popular: false,
        features: [
            { name: "4,500 credits", included: true },
            { name: "Works in Any Language", included: true },
            { name: "Thumbnail Generator", included: true },
            { name: "Edit Thumbnail", included: true },
            { name: "ThumbZap Score™", included: true },
            { name: "One-Click Fix™", included: true },
            { name: "Personas", included: true },
            { name: "Styles", included: true },
            { name: "Thumbnail Recreation", included: true },
            { name: "FaceSwap", included: true },
            { name: "Title Generator", included: true },
            { name: "All Generations Remain Private", included: true },
            { name: "Early Access to New Features", included: true },
        ],
    },
];

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <section id="pricing" className="bg-black py-12 text-white">
            <div className="container mx-auto px-4">
                <div className="mb-10 text-center">
                    <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-5xl">
                        Simple, Transparent <span className="text-[#FF0000]">Pricing</span>
                    </h2>
                    <p className="text-zinc-400 mb-6 text-base">
                        No surprises or hidden fees. Cancel anytime.
                    </p>

                    {/* Monthly/Annual Toggle */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="inline-flex items-center rounded-full border border-zinc-800 bg-black p-1 scale-90">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={cn(
                                    "rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200",
                                    !isAnnual
                                        ? "bg-[#FF0000] text-white shadow-lg shadow-red-900/20"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={cn(
                                    "rounded-full px-6 py-2 text-sm font-semibold transition-all duration-200",
                                    isAnnual
                                        ? "bg-[#FF0000] text-white shadow-lg shadow-red-900/20"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                Annually
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500">
                            Save <span className="text-[#FF0000] font-bold">30%</span> with our annual plans
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3 max-w-7xl mx-auto items-start">
                    {plans.map((plan) => {
                        const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
                        // const originalPrice = plan.monthlyPrice; // Hidden in screenshot Design
                        const thumbnails = isAnnual ? plan.annualThumbnails : plan.monthlyThumbnails;
                        // const period = isAnnual ? "year" : "month";

                        return (
                            <div
                                key={plan.name}
                                className={cn(
                                    "relative flex flex-col rounded-[1.5rem] p-6 transition-all duration-200",
                                    plan.popular
                                        ? "border-2 border-[#FF0000] bg-zinc-950/80 shadow-xl shadow-red-900/10 z-10 scale-[1.02]"
                                        : "border border-zinc-800 bg-black hover:border-zinc-700"
                                )}
                            >
                                {/* Most Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 right-0 left-0 mx-auto w-max bg-[#FF0000] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-full flex items-center gap-1.5 shadow-lg shadow-red-900/40">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                        </span>
                                        Most Popular
                                    </div>
                                )}

                                {/* Plan Name */}
                                <h3 className="text-lg font-bold text-[#FF0000] mb-4">{plan.name}</h3>

                                {/* Price */}
                                <div className="flex items-baseline mb-3">
                                    <span className="text-4xl font-bold tracking-tight text-white">${price}</span>
                                    <span className="ml-1.5 text-lg text-zinc-400">/mo</span>
                                </div>

                                {/* Thumbnails */}
                                <p className="mb-6 text-xs text-zinc-400">
                                    Generate up to <span className="text-[#FF0000] font-bold">{thumbnails.toLocaleString()} thumbnails</span> per month.
                                </p>

                                {/* Features */}
                                <div className="flex flex-col gap-2.5 text-sm flex-1 mb-6">
                                    {plan.features.map((feature, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2.5"
                                        >
                                            {feature.included ? (
                                                <Check className="h-4 w-4 text-[#FF0000] shrink-0" strokeWidth={3} />
                                            ) : (
                                                <X className="h-4 w-4 text-[#FF0000] shrink-0 opacity-50" strokeWidth={3} />
                                            )}
                                            <span className={cn(
                                                "flex items-center gap-2 text-xs",
                                                feature.included ? "text-zinc-200" : "text-zinc-500"
                                            )}>
                                                {feature.name}
                                                {/* Badge removed as per request */}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Subscribe Button */}
                                <Button
                                    className={cn(
                                        "w-full rounded-full h-10 text-sm font-bold transition-all duration-200",
                                        plan.popular
                                            ? "bg-[#FF0000] hover:bg-[#FF0000]/90 text-white shadow-lg shadow-red-900/20"
                                            : "bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white border border-transparent hover:border-zinc-700"
                                    )}
                                >
                                    Subscribe
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
