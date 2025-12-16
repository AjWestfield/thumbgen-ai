import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Youtube className="h-5 w-5 fill-current" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            ThumbGen AI
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            Features
          </Link>
          <Link
            href="#"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            Pricing
          </Link>
          <Button variant="secondary" className="h-9 rounded-full px-6">
            Sign In
          </Button>
        </div>
      </div>
    </nav>
  );
}
