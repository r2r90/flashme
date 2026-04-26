export const DEPOSIT_RATE = 0.3; // 30% deposit

export function calculateDeposit(flashPriceInCents: number): number {
  return Math.round(flashPriceInCents * DEPOSIT_RATE);
}
