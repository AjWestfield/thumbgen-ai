import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Tier configuration
export const TIERS = {
  essential: {
    name: 'Essential',
    credits: 400,
    monthlyPriceId: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY!,
    annualPriceId: process.env.STRIPE_PRICE_ESSENTIAL_ANNUAL!,
  },
  premium: {
    name: 'Premium',
    credits: 1500,
    monthlyPriceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY!,
    annualPriceId: process.env.STRIPE_PRICE_PREMIUM_ANNUAL!,
  },
  ultimate: {
    name: 'Ultimate',
    credits: 4500,
    monthlyPriceId: process.env.STRIPE_PRICE_ULTIMATE_MONTHLY!,
    annualPriceId: process.env.STRIPE_PRICE_ULTIMATE_ANNUAL!,
  },
} as const;

export type TierName = keyof typeof TIERS;

export function getPriceId(tier: TierName, billingCycle: 'monthly' | 'annual'): string {
  return billingCycle === 'monthly'
    ? TIERS[tier].monthlyPriceId
    : TIERS[tier].annualPriceId;
}

export function getTierFromPriceId(priceId: string): { tier: TierName; billingCycle: 'monthly' | 'annual' } | null {
  for (const [tierName, config] of Object.entries(TIERS)) {
    if (config.monthlyPriceId === priceId) {
      return { tier: tierName as TierName, billingCycle: 'monthly' };
    }
    if (config.annualPriceId === priceId) {
      return { tier: tierName as TierName, billingCycle: 'annual' };
    }
  }
  return null;
}

export function getCreditsForTier(tier: TierName): number {
  return TIERS[tier].credits;
}
