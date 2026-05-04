export function fmt(n: number, decimals = 0): string {
  if (!isFinite(n)) return '∞'
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals)
    === 0 && n !== 0
    ? n.toFixed(decimals)
    : Math.abs(n) < 0.01 && n !== 0
      ? n.toFixed(2)
      : n.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: 0 })
}

export function currency(n: number, decimals = 0): string {
  if (!isFinite(n)) return '∞'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)}Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)}L`
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: decimals })}`
}

export function pct(n: number): string {
  return `${n}%`
}

export function sign(n: number): string {
  return n >= 0 ? '+' : ''
}
