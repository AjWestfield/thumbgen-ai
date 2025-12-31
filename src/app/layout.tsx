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
              // Override red primary buttons in modal to dark zinc style
              profileSectionPrimaryButton: "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-900 border-zinc-700 text-white",
              formButtonPrimary: "bg-zinc-800 hover:bg-zinc-700 text-white",
              formButtonReset: "bg-zinc-800 hover:bg-zinc-700 text-white",
              // Style action buttons and links to be dark, not red
              button: "bg-zinc-800 hover:bg-zinc-700 text-white",
              buttonPrimary: "bg-zinc-800 hover:bg-zinc-700 text-white",
              buttonArrowIcon: "text-zinc-400",
              badge: "bg-zinc-800 text-zinc-300",
              // Alert/danger button styling
              alertButtonPrimary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700",
              headerTitle: "text-white",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800",
              socialButtonsBlockButtonText: "text-white",
              dividerLine: "bg-zinc-700",
              dividerText: "text-zinc-400",
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
              // Hide Clerk branding footer
              footer: "hidden",
              footerAction: "hidden",
              footerActionText: "hidden",
              footerActionLink: "hidden",
              footerPages: "hidden",
              footerPagesLink: "hidden",
              // Additional selectors to hide "Secured by Clerk" branding
              internal: "hidden",
              poweredBy: "hidden",
              "cl-internal-b3fm6y": "hidden",
            },
            variables: {
              // Use zinc as primary instead of red for Clerk's UI elements
              colorPrimary: "#3f3f46",
              colorBackground: "#09090b",
              colorInputBackground: "#18181b",
              colorInputText: "#ffffff",
              colorText: "#ffffff",
              colorTextSecondary: "#a1a1aa",
              colorDanger: "#52525b",
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
