export function formatPrice(price: number | string) {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(numericPrice);

  return `₦${formattedNumber}`;
}
