"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import ScraperForm from "@/components/scraper-form";
import ResultsTable from "@/components/results-table";
import LogView from "@/components/log-view";
import { SmartSearchInput } from "@/components/smart-search/search-input";
import { Sparkles, Brain, BarChart3, History, Loader, CheckCircle } from "lucide-react";
import Link from "next/link";

function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Link href="/dashboard" className="group">
        <Card className="glass shadow-soft border border-white/40 rounded-2xl hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white grid place-content-center shadow-md mx-auto mb-4">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Dashboard</h3>
            <p className="text-sm text-slate-600">View your job history and analytics</p>
          </CardContent>
        </Card>
      </Link>
      
      <Link href="/dashboard/scheduled" className="group">
        <Card className="glass shadow-soft border border-white/40 rounded-2xl hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white grid place-content-center shadow-md mx-auto mb-4">
              <History className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Scheduled Jobs</h3>
            <p className="text-sm text-slate-600">Manage recurring scrapes</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/docs" className="group">
        <Card className="glass shadow-soft border border-white/40 rounded-2xl hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white grid place-content-center shadow-md mx-auto mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">API Docs</h3>
            <p className="text-sm text-slate-600">Integrate with your apps</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

export default function Page() {
  const { data: session, status } = useSession()
  const [rows, setRows] = useState<any[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedJobId, setSavedJobId] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [lastScrapeUrl, setLastScrapeUrl] = useState<string>("")
  const [lastScrapeGoal, setLastScrapeGoal] = useState<string>("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [batchCategoryId, setBatchCategoryId] = useState<string>("")

  // Middleware now handles authentication redirects

  // Fetch categories on mount
  useEffect(() => {
    if (session?.user) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(console.error)
    }
  }, [session])

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-content-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-fetchpilot-primary/20 grid place-content-center animate-pulse mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-fetchpilot-primary" />
          </div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  async function runScrape(input: { url: string; goal?: string }) {
    setLoading(true);
    setSavedJobId(null);
    setLastScrapeUrl(input.url);
    setLastScrapeGoal(input.goal || "");
    setLogs((l) => [...l, "▶ Starting FetchPilot..."]);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.text();
        setLogs((l) => [...l, `✖ Error: ${err}`]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setRows(data.products || []);
      setLogs((l) => l.concat(data.logs || []));
    } catch (e: any) {
      setLogs((l) => [...l, `✖ Exception: ${e?.message}`]);
    } finally {
      setLoading(false);
      setLogs((l) => [...l, "✔ Done"]);
    }
  }

  async function handleSaveJob() {
    if (!rows.length) return false;

    setSaving(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          url: lastScrapeUrl,
          goal: lastScrapeGoal,
          products: rows,
          categoryId: selectedCategory || null,
          productsFound: rows.length,
        }),
      });

      if (!res.ok) throw new Error('Failed to save job');

      const job = await res.json();
      setSavedJobId(job.id);
      setLogs((l) => [...l, `✔ Job saved successfully! ID: ${job.id}`]);
      return job.id;
    } catch (error: any) {
      setLogs((l) => [...l, `✖ Failed to save: ${error.message}`]);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    if (!rows.length) return;

    const headers = ['Title', 'Price', 'URL', 'Brand', 'Rating', 'SKU'];
    const csvData = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.title || ''}"`,
        `"${r.price || ''}"`,
        `"${r.url || ''}"`,
        `"${r.brand || ''}"`,
        `"${r.rating || ''}"`,
        `"${r.sku || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportJSON() {
    if (!rows.length) return;

    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSelectItem(index: string) {
    setSelectedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }

  function handleSelectAll(selected: boolean) {
    if (selected) {
      setSelectedItems(rows.map((_, i) => i.toString()));
    } else {
      setSelectedItems([]);
    }
  }

  function handleBatchExportCSV() {
    if (!selectedItems.length) return;

    const selectedRows = selectedItems.map(index => rows[parseInt(index)]);
    const headers = ['Title', 'Price', 'URL', 'Brand', 'Rating', 'SKU'];
    const csvData = [
      headers.join(','),
      ...selectedRows.map(r => [
        `"${r.title || ''}"`,
        `"${r.price || ''}"`,
        `"${r.url || ''}"`,
        `"${r.brand || ''}"`,
        `"${r.rating || ''}"`,
        `"${r.sku || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_products_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleBatchExportJSON() {
    if (!selectedItems.length) return;

    const selectedRows = selectedItems.map(index => rows[parseInt(index)]);
    const blob = new Blob([JSON.stringify(selectedRows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_products_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBatchCategorize() {
    if (!selectedItems.length || !batchCategoryId) return;

    // Products must be saved to database before categorization
    let currentJobId = savedJobId;
    if (!currentJobId) {
      setLogs(prev => [...prev, `⚠ Please save the job first before categorizing products`]);
      // Optionally auto-save if user attempts to categorize
      if (rows.length > 0 && !saving) {
        setLogs(prev => [...prev, `ℹ Auto-saving job to enable categorization...`]);
        currentJobId = await handleSaveJob();
        if (!currentJobId) {
          setLogs(prev => [...prev, `✖ Could not save job, categorization cancelled`]);
          return;
        }
      } else {
        return;
      }
    }

    try {
      // Get product IDs from saved job
      const response = await fetch(`/api/jobs/${currentJobId}/products`);
      if (!response.ok) throw new Error('Failed to fetch product IDs');

      const savedProducts = await response.json();
      const productIds = selectedItems.map(index => savedProducts[parseInt(index)]?.id).filter(Boolean);

      if (productIds.length === 0) {
        throw new Error('No valid product IDs found');
      }

      // Batch categorize
      const categorizeResponse = await fetch('/api/products/batch-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds,
          categoryId: batchCategoryId,
        }),
      });

      if (!categorizeResponse.ok) {
        throw new Error('Failed to categorize products');
      }

      const result = await categorizeResponse.json();
      setLogs(prev => [...prev, `✔ ${result.message}`]);
      setSelectedItems([]); // Clear selection after categorization
      setBatchCategoryId(''); // Reset category selection
    } catch (error: any) {
      setLogs(prev => [...prev, `✖ Failed to categorize items: ${error.message}`]);
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-3xl"></div>
        <Card className="relative glass shadow-soft-xl border border-white/40 rounded-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-sky-400/20 to-transparent rounded-full blur-3xl"></div>
          <CardContent className="relative p-8 md:p-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Welcome back, {session.user.name || session.user.email}!</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 bg-clip-text text-transparent mb-4">
                Ready to extract some data?
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                Create a new scraping job or manage your existing ones. Your data is automatically saved and organized.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Smart Search */}
      <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl card-hover">
        <CardContent className="p-6 md:p-8">
          <SmartSearchInput minSources={20} />
        </CardContent>
      </Card>

      {/* Scraper Form */}
      <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl card-hover">
        <CardContent className="p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Scraping Job</h2>
            <p className="text-slate-600">Enter a URL and goal to start extracting data. Results will be saved to your dashboard.</p>
          </div>
          <ScraperForm onSubmit={runScrape} loading={loading} />
        </CardContent>
      </Card>

      {/* Results Section */}
      {(rows.length > 0 || logs.length > 0) && (
        <>
          {/* Action Bar */}
          {rows.length > 0 && (
            <Card className="glass shadow-soft border border-white/40 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Save & Organize Results</h3>
                    <p className="text-sm text-slate-600">Save this job to your dashboard and assign it to a category</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Category Selector */}
                    {categories.length > 0 && (
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors bg-white"
                        disabled={saving || !!savedJobId}
                        title="Select category for this job"
                      >
                        <option value="">No Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Save Button */}
                    {!savedJobId ? (
                      <button
                        onClick={handleSaveJob}
                        disabled={saving}
                        className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-sky-600 hover:to-blue-700 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {saving ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                            </svg>
                            Save Job
                          </>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={`/dashboard/jobs/${savedJobId}`}
                        className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-md flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        View in Dashboard
                      </Link>
                    )}

                    {/* Export Buttons */}
                    <button
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      CSV
                    </button>

                    <button
                      onClick={handleExportJSON}
                      className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      JSON
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white/80 to-white/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Extracted Products ({rows.length})
                      {selectedItems.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-sky-100 text-sky-700 text-sm rounded-lg">
                          {selectedItems.length} selected
                        </span>
                      )}
                    </h2>
                    
                    {selectedItems.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Batch Category Selector */}
                        {categories.length > 0 && (
                          <select
                            value={batchCategoryId}
                            onChange={(e) => setBatchCategoryId(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 transition-colors bg-white"
                            title="Select category for batch operation"
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        )}

                        {/* Batch Categorize Button */}
                        {categories.length > 0 && (
                          <button
                            onClick={handleBatchCategorize}
                            disabled={!batchCategoryId || !savedJobId}
                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title={
                              !savedJobId 
                                ? "Please save the job first before categorizing" 
                                : !batchCategoryId 
                                ? "Please select a category first" 
                                : "Categorize selected products"
                            }
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a2 2 0 012-2z" />
                            </svg>
                            Categorize ({selectedItems.length})
                          </button>
                        )}

                        {/* Batch Export Buttons */}
                        <button
                          onClick={handleBatchExportCSV}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-all duration-200 shadow-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          CSV ({selectedItems.length})
                        </button>

                        <button
                          onClick={handleBatchExportJSON}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 shadow-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          JSON ({selectedItems.length})
                        </button>

                        {/* Clear Selection */}
                        <button
                          onClick={() => setSelectedItems([])}
                          className="px-3 py-1.5 bg-slate-500 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-sm flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <ResultsTable 
                  rows={rows} 
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectAll={handleSelectAll}
                />
              </CardContent>
            </Card>
          <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white/80 to-white/40">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
                  Execution Log
                </h2>
              </div>
              <LogView logs={logs} />
            </CardContent>
          </Card>
          </div>
        </>
      )}
    </div>
  );
}
