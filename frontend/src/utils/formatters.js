export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(value) {
  const date = new Date(value)
  return date.toLocaleDateString('en-US')
}
