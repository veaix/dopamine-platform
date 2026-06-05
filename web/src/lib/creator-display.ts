export function formatEconomyDisplay(value: number, creatorUnlimited: boolean): string {
  return creatorUnlimited ? "∞" : String(value);
}
