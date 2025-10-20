"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, Loader, Trash2 } from 'lucide-react'
import Link from 'next/link'

const SCHEDULE_PRESETS = [
  { label: 'Every Hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
  { label: 'Every 6 Hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
  { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Runs every day at 9:00 AM' },
  { label: 'Daily at Midnight', value: '0 0 * * *', description: 'Runs every day at midnight' },
  { label: 'Weekly (Monday 9 AM)', value: '0 9 * * 1', description: 'Runs every Monday at 9:00 AM' },
  { label: 'Monthly (1st at 9 AM)', value: '0 9 1 * *', description: 'Runs on the 1st of every month at 9:00 AM' },
]

export default function EditScheduledScrapePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    goal: '',
    schedule: '',
    enabled: true,
    maxTotalPages: 10,
    browserEnabled: false,
    notifyOnComplete: false,
  })

  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id)
      fetchScheduledScrape(resolvedParams.id)
    })
  }, [params])

  const fetchScheduledScrape = async (scheduleId: string) => {
    try {
      setFetchingData(true)
      const response = await fetch(`/api/scheduled-scrapes/${scheduleId}`)

      if (!response.ok) {
        throw new Error('Failed to load scheduled scrape')
      }

      const data = await response.json()
      setFormData({
        name: data.name || '',
        url: data.url || '',
        goal: data.goal || '',
        schedule: data.schedule || '0 9 * * *',
        enabled: data.enabled ?? true,
        maxTotalPages: data.config?.maxTotalPages || 10,
        browserEnabled: data.config?.browserEnabled || false,
        notifyOnComplete: data.config?.notifyOnComplete || false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/scheduled-scrapes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update scheduled scrape')
      }

      router.push('/dashboard/scheduled?updated=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this scheduled scrape? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/scheduled-scrapes/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete scheduled scrape')
      }

      router.push('/dashboard/scheduled?deleted=true')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeleting(false)
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (fetchingData) {
    return (
      <div className="min-h-screen grid place-content-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 grid place-content-center animate-pulse mx-auto mb-4">
            <Calendar className="w-8 h-8 text-sky-600" />
          </div>
          <p className="text-slate-600">Loading scheduled scrape...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/scheduled"
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-fetchpilot-text">Edit Scheduled Scrape</h1>
            <p className="text-sm text-slate-600">Update your recurring scraping job</p>
          </div>
        </div>
      </div>

      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Schedule Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Daily Product Scrape"
                required
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                A descriptive name to identify this scheduled scrape
              </p>
            </div>

            {/* URL */}
            <div>
              <Label htmlFor="url">Target URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => updateField('url', e.target.value)}
                placeholder="https://example.com/products"
                required
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                The webpage to scrape on each run
              </p>
            </div>

            {/* Goal */}
            <div>
              <Label htmlFor="goal">Extraction Goal</Label>
              <Input
                id="goal"
                type="text"
                value={formData.goal}
                onChange={(e) => updateField('goal', e.target.value)}
                placeholder="Extract product cards and canonical links"
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                What data should be extracted from the page
              </p>
            </div>

            {/* Schedule */}
            <div>
              <Label>Schedule *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {SCHEDULE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateField('schedule', preset.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.schedule === preset.value
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-sky-600" />
                      <span className="font-semibold text-sm">{preset.label}</span>
                    </div>
                    <p className="text-xs text-slate-500">{preset.description}</p>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="custom-schedule">Custom Cron Expression</Label>
                <Input
                  id="custom-schedule"
                  type="text"
                  value={formData.schedule}
                  onChange={(e) => updateField('schedule', e.target.value)}
                  placeholder="0 9 * * *"
                  className="mt-2 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Cron format: minute hour day month weekday
                </p>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <Label>Configuration</Label>
              <div className="space-y-3 mt-2">
                <div>
                  <Label htmlFor="maxTotalPages">Max Pages to Process</Label>
                  <Input
                    id="maxTotalPages"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.maxTotalPages}
                    onChange={(e) => updateField('maxTotalPages', parseInt(e.target.value))}
                    className="mt-2"
                  />
                </div>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.browserEnabled}
                    onChange={(e) => updateField('browserEnabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Enable Browser Mode</div>
                    <div className="text-xs text-slate-500">Use headless browser for JavaScript-heavy sites</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.notifyOnComplete}
                    onChange={(e) => updateField('notifyOnComplete', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Notify on Completion</div>
                    <div className="text-xs text-slate-500">Receive notifications when scrape completes</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => updateField('enabled', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">Schedule Enabled</div>
                    <div className="text-xs text-slate-500">Whether this schedule is actively running</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={loading || deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deleting ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/scheduled')}
                disabled={loading || deleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || deleting}
                className="bg-fetchpilot-primary hover:bg-fetchpilot-accent"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
