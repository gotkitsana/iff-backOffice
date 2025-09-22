const formatCurrency = (value: number) => {
  if (!value) return 0
  return value.toLocaleString('th-TH', { minimumFractionDigits: 0, currency: 'THB' })
}

export default formatCurrency
