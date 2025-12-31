"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { SubscriptionPage } from "./account/SubscriptionPage";
import { DangerZonePage } from "./account/DangerZonePage";

export function UserMenuButton() {
  const { isSignedIn } = useUser();

  // Skip queries if not signed in to avoid auth errors
  const user = useQuery(api.users.getCurrentUser, isSignedIn ? undefined : "skip");

  // Format credits for display in menu
  // Distinguish between: loading (undefined), no auth/user (null), has data (object)
  const creditsText = user === undefined
    ? "Loading..."
    : typeof user?.credits === "number"
      ? `${user.credits.toLocaleString()} credits`
      : "View subscription";

  return (
    <UserButton
      appearance={{
        elements: {
          avatarBox: "w-8 h-8",
          userButtonPopoverCard: "bg-zinc-950 border border-zinc-800 shadow-2xl",
          userButtonPopoverActionButton: "text-zinc-300 hover:bg-zinc-800/50",
          userButtonPopoverActionButtonText: "text-zinc-300",
          userButtonPopoverActionButtonIcon: "text-zinc-400",
          userButtonPopoverFooter: "hidden",
          userPreviewMainIdentifier: "text-white",
          userPreviewSecondaryIdentifier: "text-zinc-400",
        },
      }}
    >
      {/* Custom Menu Items - Shows credits at top */}
      <UserButton.MenuItems>
        <UserButton.Action
          label={creditsText}
          labelIcon={<CreditCard className="w-4 h-4" />}
          open="subscription"
        />
      </UserButton.MenuItems>

      {/* Custom Subscription Page */}
      <UserButton.UserProfilePage
        label="Subscription"
        labelIcon={<CreditCard className="w-4 h-4" />}
        url="subscription"
      >
        <SubscriptionPage />
      </UserButton.UserProfilePage>

      {/* Custom Danger Zone Page */}
      <UserButton.UserProfilePage
        label="Danger Zone"
        labelIcon={<AlertTriangle className="w-4 h-4" />}
        url="danger-zone"
      >
        <DangerZonePage />
      </UserButton.UserProfilePage>
    </UserButton>
  );
}
