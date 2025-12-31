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

// Capitalize first letter of tier name
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function UserMenuButton() {
  const { isSignedIn } = useUser();

  // Skip queries if not signed in to avoid auth errors
  const user = useQuery(api.users.getCurrentUser, isSignedIn ? undefined : "skip");

  // Format plan and credits for display in menu
  // Distinguish between: loading (undefined), no auth/user (null), has data (object)
  const getDisplayText = () => {
    if (user === undefined) return "Loading...";
    if (!user) return "View subscription";

    const planName = user.tier ? capitalize(user.tier) : null;
    const credits = typeof user.credits === "number" ? user.credits : 0;

    if (planName) {
      return `${planName} • ${credits.toLocaleString()} credits`;
    }
    return `${credits.toLocaleString()} credits`;
  };

  const displayText = getDisplayText();

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
      {/* Custom Menu Items - Shows plan and credits */}
      <UserButton.MenuItems>
        <UserButton.Action
          label={displayText}
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
