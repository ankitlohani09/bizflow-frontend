export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    style: "currency",
    maximumFractionDigits: 0,
  }).format(amount);
}
