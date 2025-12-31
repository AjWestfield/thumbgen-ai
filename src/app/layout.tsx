import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { NavbarProvider } from "@/components/NavbarContext";
import { Navbar } from "@/components/landing/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThumbZap - AI Thumbnail Generator | Viral YouTube Thumbnails in Seconds",
  description: "ThumbZap generates high-CTR YouTube thumbnails with AI. Create viral thumbnails in seconds with face swap, style replication, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-zinc-950 border border-zinc-800",
              navbar: "bg-zinc-950 border-zinc-800",
              navbarButton: "text-zinc-300 hover:text-white hover:bg-zinc-800",
              navbarButtonIcon: "text-zinc-400",
              pageScrollBox: "bg-zinc-950",
              page: "bg-zinc-950",
              profilePage: "bg-zinc-950",
              profileSection: "bg-zinc-950 border-zinc-800",
              profileSectionTitle: "text-white",
              profileSectionTitleText: "text-white",
              profileSectionContent: "text-zinc-300",
              profileSectionPrimaryButton: "bg-[#FF0000] hover:bg-[#FF0000]/90",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-900 border-zinc-700 text-white",
              formButtonPrimary: "bg-[#FF0000] hover:bg-[#FF0000]/90",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800",
              socialButtonsBlockButtonText: "text-white",
              dividerLine: "bg-zinc-700",
              dividerText: "text-zinc-400",
              footerActionLink: "text-[#FF0000] hover:text-[#FF0000]/80",
              avatarBox: "border-zinc-700",
              userButtonPopoverCard: "bg-zinc-950 border-zinc-800",
              userButtonPopoverActionButton: "text-zinc-300 hover:bg-zinc-800",
              userButtonPopoverActionButtonText: "text-zinc-300",
              userButtonPopoverActionButtonIcon: "text-zinc-400",
              userButtonPopoverFooter: "border-zinc-800",
              userPreviewMainIdentifier: "text-white",
              userPreviewSecondaryIdentifier: "text-zinc-400",
              modalContent: "bg-zinc-950 border-zinc-800",
              modalCloseButton: "text-zinc-400 hover:text-white",
            },
            variables: {
              colorPrimary: "#FF0000",
              colorBackground: "#09090b",
              colorInputBackground: "#18181b",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#a1a1aa",
            },
          }}
        >
          <ConvexClientProvider>
            <NavbarProvider>
              <Navbar />
              {children}
            </NavbarProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
