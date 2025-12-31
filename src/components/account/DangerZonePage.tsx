"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

export function DangerZonePage() {
  const { signOut } = useClerk();
  const user = useQuery(api.users.getCurrentUser);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete account");
      }
      // Sign out and redirect to home
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-red-500 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Irreversible and destructive actions
        </p>
      </div>

      {/* Delete Account Section */}
      <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-500/10">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-white font-medium">Delete Account</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Permanently delete your account and all associated data. This action
              cannot be undone.
            </p>
          </div>
        </div>

        {/* What will be deleted */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <p className="text-sm font-medium text-zinc-300 mb-2">
            This will permanently delete:
          </p>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Your profile and account information
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              All your generated thumbnails
            </li>
            {user?.stripeSubscriptionId && (
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Your active subscription (will be canceled immediately)
              </li>
            )}
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              All remaining credits ({user?.credits ?? 0} credits)
            </li>
          </ul>
        </div>

        {!showConfirmation ? (
          <button
            onClick={() => setShowConfirmation(true)}
            className="w-full py-2.5 px-4 border border-red-500/50 hover:bg-red-500/10
                       text-red-400 hover:text-red-300 rounded-lg transition-colors"
          >
            I want to delete my account
          </button>
        ) : (
          <div className="space-y-4 pt-2 border-t border-red-500/20">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Type <span className="text-red-400 font-mono">DELETE</span> to confirm
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700
                           rounded-lg text-white placeholder:text-zinc-600
                           focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmText("");
                  setError("");
                }}
                disabled={loading}
                className="flex-1 py-2.5 px-4 border border-zinc-700 hover:bg-zinc-800
                           text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE" || loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4
                           bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600
                           text-white font-medium rounded-lg transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Warning Footer */}
      <p className="text-xs text-zinc-500 text-center">
        Account deletion is permanent and cannot be reversed.
        <br />
        Please make sure you want to proceed before confirming.
      </p>
    </div>
  );
}
