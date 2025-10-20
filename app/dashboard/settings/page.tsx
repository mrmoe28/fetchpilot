"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, Lock, Database, Trash2, AlertTriangle, Loader } from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    notifyOnJobCompletion: true,
    notifyOnJobFailure: false,
    notifyOnScheduledJobs: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handlePreferenceChange = async (key: string, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)

    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPreferences),
      })
    } catch (error) {
      console.error('Failed to save preferences:', error)
    }
  }

  const handleExportData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/export-data')
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fetchpilot-data-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export data:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteData = async () => {
    const confirmed = window.confirm("Are you sure you want to delete all your scraping data? This action cannot be undone. Your account will be preserved.");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/delete-data", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      alert("All scraping data has been deleted successfully.");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to delete data:", error);
      alert("Failed to delete data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed1 = window.confirm("Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.");
    if (!confirmed1) {
      return;
    }

    const confirmed2 = window.confirm("This is your final warning. Delete your account and all data permanently?");
    if (!confirmed2) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Delete failed");

      alert("Your account has been deleted.");
      router.push("/auth/signin");
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen grid place-content-center">
        <Loader className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-fetchpilot-text">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Notifications Settings */}
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 grid place-content-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
              <p className="text-sm text-slate-600 mt-1 mb-4">
                Configure how you receive notifications about your scraping jobs
              </p>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={preferences.notifyOnJobCompletion}
                    onChange={(e) => handlePreferenceChange('notifyOnJobCompletion', e.target.checked)}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Job Completion</div>
                    <div className="text-xs text-slate-500">Get notified when scraping jobs complete</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={preferences.notifyOnJobFailure}
                    onChange={(e) => handlePreferenceChange('notifyOnJobFailure', e.target.checked)}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Job Failures</div>
                    <div className="text-xs text-slate-500">Get notified when jobs fail</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 rounded"
                    checked={preferences.notifyOnScheduledJobs}
                    onChange={(e) => handlePreferenceChange('notifyOnScheduledJobs', e.target.checked)}
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-900">Scheduled Jobs</div>
                    <div className="text-xs text-slate-500">Get reminders about scheduled scraping jobs</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 grid place-content-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Security</h3>
              <p className="text-sm text-slate-600 mt-1 mb-4">
                Manage your account security and authentication settings
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">Connected Accounts</div>
                      <div className="text-xs text-slate-500 mt-1">
                        You're signed in with OAuth. Manage your account through your provider.
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                      Active
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="text-sm font-medium text-slate-900 mb-2">Active Sessions</div>
                  <div className="text-xs text-slate-600">
                    You're currently signed in. Sign out from the user menu to end your session.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card className="shadow-soft border-0 rounded-2xl">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 grid place-content-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">Data & Privacy</h3>
              <p className="text-sm text-slate-600 mt-1 mb-4">
                Control your data and privacy settings
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">Export Your Data</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Download all your scraping data and job history
                    </div>
                  </div>
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <span className="text-blue-600 text-sm font-medium">Export</span>
                  )}
                </button>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-1">Data Retention</div>
                  <div className="text-xs text-blue-700">
                    Your scraping results are stored indefinitely. You can delete individual jobs from the dashboard.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="shadow-soft border-0 rounded-2xl border-red-200">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 grid place-content-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-600 mt-1 mb-4">
                Irreversible actions that affect your account
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleDeleteData}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="text-sm font-medium text-red-900">Delete All Data</div>
                    <div className="text-xs text-red-600 mt-1">
                      Permanently delete all your scraping jobs and results
                    </div>
                  </div>
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  )}
                </button>

                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="text-sm font-medium text-red-900">Delete Account</div>
                    <div className="text-xs text-red-600 mt-1">
                      Permanently delete your account and all associated data
                    </div>
                  </div>
                  {loading ? (
                    <Loader className="w-5 h-5 animate-spin text-red-600" />
                  ) : (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Footer */}
      <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-600">
        Need help? Contact support at{' '}
        <a href="mailto:support@fetchpilot.com" className="text-blue-600 hover:underline">
          support@fetchpilot.com
        </a>
      </div>
    </div>
  )
}
