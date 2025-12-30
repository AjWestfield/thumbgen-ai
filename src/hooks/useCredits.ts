"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCredits() {
  const user = useQuery(api.users.getCurrentUser);
  const creditInfo = useQuery(api.users.hasCredits);
  const deductCreditsMutation = useMutation(api.users.deductCredits);
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  return {
    // User info
    user,
    isLoading: user === undefined,

    // Credit info
    credits: user?.credits ?? 0,
    tier: user?.tier ?? null,
    subscriptionStatus: user?.subscriptionStatus ?? null,
    billingCycle: user?.billingCycle ?? null,
    creditsPerMonth: user?.creditsPerMonth ?? 0,
    currentPeriodEnd: user?.currentPeriodEnd ?? null,

    // Computed values
    hasActiveSubscription: user?.subscriptionStatus === 'active',
    hasCredits: creditInfo?.hasCredits ?? false,
    creditCost: creditInfo?.required ?? 10,

    // Actions
    deductCredits: async () => {
      return await deductCreditsMutation();
    },

    // Ensure user exists
    ensureUser: async () => {
      return await getOrCreateUser();
    },
  };
}
