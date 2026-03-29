const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatCurrency(amount = 0) {
  const numericAmount = Number(amount || 0);
  return inrFormatter.format(Number.isFinite(numericAmount) ? numericAmount : 0);
}
