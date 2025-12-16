import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

export function Pricing() {
    return (
        <section className="bg-black py-24 text-white">
            <div className="container mx-auto px-4">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                        Simple, Transparent <span className="text-primary">Pricing</span>
                    </h2>
                    <p className="text-zinc-400">
                        Start for free, upgrade when you go viral.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
                    {/* Essential Plan */}
                    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-transform hover:scale-105">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-primary">Essential</h3>
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">-30%</span>
                        </div>
                        <div className="mt-4 mb-2 flex items-baseline">
                            <span className="text-4xl font-extrabold">$20</span>
                            <span className="ml-1 text-zinc-400">/mo</span>
                        </div>
                        <p className="mb-6 text-sm text-zinc-400">Generate up to <span className="text-primary">40 thumbnails</span> per month.</p>

                        <div className="flex flex-col gap-3 text-sm text-zinc-400 flex-1">
                            {/* Included */}
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 400 credits</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Works in Any Language</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Thumbnail Generator</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Edit Thumbnail</div>
                            {/* Excluded */}
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Pikzels Score™</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> One-Click Fix™</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Personas</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Styles</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Thumbnail Recreation</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> FaceSwap</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Title Generator</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> All Generations Remain Private</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Early Access to New Features</div>
                        </div>
                        <Button variant="outline" className="w-full mt-8 border-zinc-700 hover:bg-zinc-800 hover:text-white">Get Essential</Button>
                    </div>

                    {/* Premium Plan */}
                    <div className="relative flex flex-col rounded-2xl border border-primary bg-zinc-900 p-8 shadow-2xl shadow-primary/20 transform scale-105 z-10">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 rotate-0 bg-primary px-3 py-1 text-xs font-bold uppercase text-white shadow-md rounded-full">
                            Most Popular
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-primary">Premium</h3>
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">-30%</span>
                        </div>
                        <div className="mt-4 mb-2 flex items-baseline">
                            <span className="text-4xl font-extrabold">$40</span>
                            <span className="ml-1 text-zinc-400">/mo</span>
                        </div>
                        <p className="mb-6 text-sm text-zinc-400">Generate up to <span className="text-primary">150 thumbnails</span> per month.</p>

                        <div className="flex flex-col gap-3 text-sm text-zinc-300 flex-1">
                            {/* Included */}
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 2000 credits</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Works in Any Language</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Thumbnail Generator</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Edit Thumbnail</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Pikzels Score™</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> One-Click Fix™</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Personas</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Styles</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Thumbnail Recreation</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> FaceSwap</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Title Generator</div>
                            {/* Excluded */}
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> All Generations Remain Private</div>
                            <div className="flex items-center gap-2 opacity-50"><X className="h-4 w-4 text-red-500 shrink-0" /> Early Access to New Features</div>
                        </div>
                        <Button className="w-full mt-8 bg-primary hover:bg-red-700 text-white font-bold h-12">Get Premium</Button>
                    </div>

                    {/* Ultimate Plan */}
                    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 transition-transform hover:scale-105">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-primary">Ultimate</h3>
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">-30%</span>
                        </div>
                        <div className="mt-4 mb-2 flex items-baseline">
                            <span className="text-4xl font-extrabold">$80</span>
                            <span className="ml-1 text-zinc-400">/mo</span>
                        </div>
                        <p className="mb-6 text-sm text-zinc-400">Generate up to <span className="text-primary">450 thumbnails</span> per month.</p>

                        <div className="flex flex-col gap-3 text-sm text-zinc-400 flex-1">
                            {/* Included */}
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> 6000 credits</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Works in Any Language</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Thumbnail Generator</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Edit Thumbnail</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Pikzels Score™</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> One-Click Fix™</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Personas</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Styles</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Thumbnail Recreation</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> FaceSwap</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Title Generator</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> All Generations Remain Private</div>
                            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary shrink-0" /> Early Access to New Features</div>
                        </div>
                        <Button variant="outline" className="w-full mt-8 border-zinc-700 hover:bg-zinc-800 hover:text-white">Get Ultimate</Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
