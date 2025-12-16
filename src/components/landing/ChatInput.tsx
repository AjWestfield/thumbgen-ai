"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea"; // Check if textarea exists or use standard
import { Paperclip, ArrowUp, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChatInput({ onGenerate }: { onGenerate?: (prompt: string) => void }) {
    const [input, setInput] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleGenerate = () => {
        if (input.trim() && onGenerate) {
            onGenerate(input);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    return (
        <div
            className={cn(
                "relative mx-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 shadow-2xl transition-all duration-300",
                isFocused ? "border-primary/50 ring-1 ring-primary/20 bg-zinc-900" : "hover:border-white/20"
            )}
        >
            <div className="relative flex flex-col p-4">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Describe your thumbnail... e.g. 'Surprised face pointing at a red glowing specialized AI robot'"
                    className="min-h-[60px] w-full resize-none border-0 bg-transparent text-lg text-white placeholder:text-zinc-500 focus-visible:ring-0 shadow-none"
                    rows={1}
                />

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-full border-dashed border-zinc-700 bg-transparent text-zinc-400 hover:border-zinc-500 hover:text-white hover:bg-zinc-800"
                        >
                            <ImageIcon className="h-4 w-4" />
                            <span className="sr-only">Upload Image</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            <Paperclip className="mr-2 h-4 w-4" />
                            <span>Add Reference</span>
                        </Button>
                    </div>

                    <Button
                        size="icon"
                        onClick={handleGenerate}
                        className={cn(
                            "h-9 w-9 rounded-full transition-all duration-300",
                            input.length > 0 ? "bg-primary text-white" : "bg-zinc-800 text-zinc-500"
                        )}
                        disabled={input.length === 0}
                    >
                        <ArrowUp className="h-4 w-4" />
                        <span className="sr-only">Generate</span>
                    </Button>
                </div>
            </div>

            {/* Background Glow Effect */}
            {isFocused && (
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />
            )}
        </div>
    );
}
