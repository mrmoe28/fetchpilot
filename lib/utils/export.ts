import { ScrapedProduct } from '@/lib/db/schema'

export function exportToJSON(products: ScrapedProduct[]): string {
  return JSON.stringify(products, null, 2)
}

export function exportToCSV(products: ScrapedProduct[]): string {
  if (products.length === 0) return ''

  // Define CSV headers
  const headers = ['URL', 'Title', 'Price', 'Currency', 'In Stock', 'SKU', 'Image', 'Breadcrumbs']

  // Create CSV rows
  const rows = products.map(product => [
    escapeCSV(product.url),
    escapeCSV(product.title),
    escapeCSV(product.price || ''),
    escapeCSV(product.currency || ''),
    product.inStock === true ? 'Yes' : product.inStock === false ? 'No' : '',
    escapeCSV(product.sku || ''),
    escapeCSV(product.image || ''),
    escapeCSV(product.breadcrumbs?.join(' > ') || ''),
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

function escapeCSV(value: string): string {
  if (!value) return ''

  // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
