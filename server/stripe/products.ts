/**
 * Stripe Products Configuration
 * Centralized product and price definitions for the NudFans platform
 */

// Platform fee percentage (20% goes to platform)
export const PLATFORM_FEE_PERCENTAGE = 20;

// Minimum prices in BRL (cents)
export const MIN_SUBSCRIPTION_PRICE = 499; // R$ 4.99
export const MIN_PPV_PRICE = 199; // R$ 1.99
export const MIN_TIP_AMOUNT = 100; // R$ 1.00

// Default prices
export const DEFAULT_SUBSCRIPTION_PRICE = 999; // R$ 9.99

// Tip preset amounts in BRL
export const TIP_PRESETS = [
  { amount: 500, label: "R$ 5" },
  { amount: 1000, label: "R$ 10" },
  { amount: 2500, label: "R$ 25" },
  { amount: 5000, label: "R$ 50" },
  { amount: 10000, label: "R$ 100" },
];

// Calculate platform fee and creator earnings
export function calculateFees(amountInCents: number) {
  const platformFee = Math.round(amountInCents * (PLATFORM_FEE_PERCENTAGE / 100));
  const creatorEarnings = amountInCents - platformFee;
  
  return {
    total: amountInCents,
    platformFee,
    creatorEarnings,
    platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
  };
}

// Format price for display
export function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountInCents / 100);
}

// Convert BRL to cents
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Convert cents to BRL
export function fromCents(cents: number): number {
  return cents / 100;
}
