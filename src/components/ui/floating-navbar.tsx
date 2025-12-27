"use client";
import React, { useState, useEffect, type JSX } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useNavbar } from "@/components/NavbarContext";

export const FloatingNav = ({
  navItems,
  className,
  logo,
  ctaButton,
}: {
  navItems: {
    name: string;
    link: string;
    icon?: JSX.Element;
  }[];
  className?: string;
  logo?: React.ReactNode;
  ctaButton?: React.ReactNode;
}) => {
  const { isNavbarVisible } = useNavbar();
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down & past 100px - hide navbar
        setHidden(true);
      } else {
        // Scrolling up - show navbar
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Hide navbar completely when context says it should be hidden (e.g., YouTube preview)
  if (!isNavbarVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex fixed top-6 inset-x-0 mx-auto border border-white/10 rounded-full bg-black/80 backdrop-blur-lg shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] px-4 py-2.5 items-center justify-between max-w-3xl transition-transform duration-300",
        hidden ? "-translate-y-24" : "translate-y-0",
        className
      )}
      >
        {/* Logo */}
        {logo && <div className="flex items-center">{logo}</div>}

        {/* Nav Items */}
        <div className="flex items-center space-x-1">
          {navItems.map((navItem, idx: number) => (
            <Link
              key={`link-${idx}`}
              href={navItem.link}
              className={cn(
                "relative items-center flex space-x-1 text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5 text-sm font-medium"
              )}
            >
              <span className="block sm:hidden">{navItem.icon}</span>
              <span className="hidden sm:block">{navItem.name}</span>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        {ctaButton ? (
          ctaButton
        ) : (
          <button className="border text-sm font-medium relative border-white/20 text-white px-4 py-1.5 rounded-full hover:bg-white/5 transition-colors">
            <span>Sign In</span>
            <span className="absolute inset-x-0 w-1/2 mx-auto -bottom-px bg-gradient-to-r from-transparent via-primary to-transparent h-px" />
          </button>
        )}
      </div>
  );
};
