'use client'

import { Download } from 'lucide-react'
import Button from './ui/button'

export default function ExportButtons({ jobId }: { jobId: string }) {
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/export/${jobId}?format=${format}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fetchpilot-${jobId}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data')
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport('json')}
        className="bg-slate-600 hover:bg-slate-700 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Export JSON
      </Button>
      <Button
        onClick={() => handleExport('csv')}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  )
}
