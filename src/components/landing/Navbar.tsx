"use client";

import Link from "next/link";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Sparkles, DollarSign, Image } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

// ThumbZap logo - Red with lightning bolt zap icon
function ThumbZapLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="white"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Lightning bolt / Zap icon */}
          <path d="M13 2L4.5 12.5H11L10 22L18.5 11H12L13 2Z" />
        </svg>
      </div>
      <span className="text-sm font-bold tracking-tight text-white hidden sm:block">
        ThumbZap
      </span>
    </Link>
  );
}

export function Navbar() {
  const navItems = [
    {
      name: "Features",
      link: "/#features",
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      name: "Pricing",
      link: "/#pricing",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      name: "My Thumbnails",
      link: "/my-thumbnails",
      icon: <Image className="h-4 w-4" />,
    },
  ];

  return (
    <FloatingNav
      navItems={navItems}
      logo={<ThumbZapLogo />}
      ctaButton={
        <>
          {/* Show Sign In button when not authenticated */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium relative bg-white text-black px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          {/* Show UserButton when authenticated */}
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopoverCard: {
                    backgroundColor: "#0f0f0f",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  },
                  userButtonPopoverActionButton: {
                    "&:hover": {
                      backgroundColor: "#1a1a1a",
                    },
                  },
                },
              }}
              afterSignOutUrl="/"
            />
          </SignedIn>
        </>
      }
    />
  );
}
