'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Package,
  Globe,
  Star,
  Clock,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/badge'

interface SearchSource {
  id: string
  url: string
  domain: string
  title: string
  snippet: string
  isProductPage: boolean
  productScore: number
  metadata: {
    hasPrice: boolean
    hasAddToCart: boolean
    hasProductImages: boolean
    hasStructuredData: boolean
    schemaType?: string
  }
}

interface SmartSearchQuery {
  id: string
  query: string
  status: 'pending' | 'searching' | 'completed' | 'failed'
  sourcesFound: number
  productPagesFound: number
  startedAt: string
  completedAt: string | null
  error: string | null
  sources: SearchSource[]
}

export default function SmartSearchResultsPage({
  params,
}: {
  params: Promise<{ searchId: string }>
}) {
  const router = useRouter()
  const [searchData, setSearchData] = useState<SmartSearchQuery | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set())
  const [searchId, setSearchId] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setSearchId(p.searchId)
      fetchSearchData(p.searchId)
    })
  }, [params])

  useEffect(() => {
    if (!searchId) return

    const interval = setInterval(() => {
      fetchSearchData(searchId)
    }, 3000) // Poll every 3 seconds while searching

    return () => clearInterval(interval)
  }, [searchId])

  const fetchSearchData = async (id: string) => {
    try {
      const res = await fetch(`/api/smart-search/${id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch search data')
      }

      const data = await res.json()
      setSearchData(data)

      // Stop polling if completed or failed
      if (data.status === 'completed' || data.status === 'failed') {
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const handleToggleSource = (sourceId: string) => {
    const newSelected = new Set(selectedSources)
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId)
    } else {
      newSelected.add(sourceId)
    }
    setSelectedSources(newSelected)
  }

  const handleScrapeSelected = async () => {
    if (selectedSources.size === 0) return

    const sourcesToScrape = searchData?.sources.filter(s => selectedSources.has(s.id))
    if (!sourcesToScrape) return

    // For now, just open each URL in a new tab (user can manually scrape)
    // TODO: Create a batch scrape endpoint
    alert(`Selected ${selectedSources.size} sources. This will be implemented to create batch scraping jobs.`)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="shadow-soft border border-white/40 rounded-2xl">
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Error Loading Search</h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!searchData) {
    return (
      <div className="min-h-screen grid place-content-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const isSearching = searchData.status === 'searching' || searchData.status === 'pending'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Button variant="ghost" className="mb-4" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 grid place-content-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Smart Search Results</h1>
              <p className="text-slate-600">{searchData.query}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          {searchData.status === 'completed' && (
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </Badge>
          )}
          {searchData.status === 'failed' && (
            <Badge className="bg-red-100 text-red-800 px-4 py-2">
              <XCircle className="w-4 h-4 mr-2" />
              Failed
            </Badge>
          )}
          {isSearching && (
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-soft border border-white/40 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Total Sources</p>
                <p className="text-3xl font-bold text-slate-900">{searchData.sourcesFound}</p>
              </div>
              <Globe className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border border-white/40 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Product Pages</p>
                <p className="text-3xl font-bold text-green-600">{searchData.productPagesFound}</p>
              </div>
              <Package className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border border-white/40 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Selected</p>
                <p className="text-3xl font-bold text-purple-600">{selectedSources.size}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {searchData.error && (
        <Card className="shadow-soft border border-red-200 rounded-2xl bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Search Failed</h3>
                <p className="text-sm text-red-700">{searchData.error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchData.sources.length > 0 ? (
        <>
          {/* Action Bar */}
          <Card className="shadow-soft border border-white/40 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {selectedSources.size > 0
                    ? `${selectedSources.size} source${selectedSources.size > 1 ? 's' : ''} selected`
                    : 'Select sources to scrape'}
                </div>
                <div className="flex gap-3">
                  {selectedSources.size > 0 && (
                    <>
                      <Button variant="outline" onClick={() => setSelectedSources(new Set())}>
                        Clear Selection
                      </Button>
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        onClick={handleScrapeSelected}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Scrape Selected ({selectedSources.size})
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchData.sources.map(source => (
              <Card
                key={source.id}
                className={`shadow-soft border rounded-2xl cursor-pointer transition-all ${
                  selectedSources.has(source.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-white/40 hover:shadow-lg'
                }`}
                onClick={() => handleToggleSource(source.id)}
              >
                <CardContent className="p-6">
                  {/* Selection Checkbox */}
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedSources.has(source.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedSources.has(source.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>

                    {/* Product Score Badge */}
                    <Badge
                      className={
                        source.productScore >= 70
                          ? 'bg-green-100 text-green-800'
                          : source.productScore >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-slate-100 text-slate-600'
                      }
                    >
                      <Star className="w-3 h-3 mr-1" />
                      {source.productScore}% match
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">
                    {source.title}
                  </h3>

                  {/* Domain */}
                  <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {source.domain}
                  </p>

                  {/* Snippet */}
                  {source.snippet && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">{source.snippet}</p>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {source.metadata.hasPrice && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700">Price</Badge>
                    )}
                    {source.metadata.hasAddToCart && (
                      <Badge className="text-xs bg-blue-100 text-blue-700">Cart</Badge>
                    )}
                    {source.metadata.hasProductImages && (
                      <Badge className="text-xs bg-purple-100 text-purple-700">Images</Badge>
                    )}
                    {source.metadata.hasStructuredData && (
                      <Badge className="text-xs bg-orange-100 text-orange-700">Schema</Badge>
                    )}
                  </div>

                  {/* Link */}
                  <Link
                    href={source.url}
                    target="_blank"
                    onClick={e => e.stopPropagation()}
                    className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                  >
                    Visit page
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : isSearching ? (
        <Card className="shadow-soft border border-white/40 rounded-2xl">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-16 h-16 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Searching the web...</h3>
            <p className="text-slate-600">
              We're scanning multiple sources to find product pages for "{searchData.query}".
              This typically takes 1-2 minutes.
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Found {searchData.sourcesFound} sources so far ({searchData.productPagesFound}{' '}
              product pages)
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-soft border border-white/40 rounded-2xl">
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Results Found</h3>
            <p className="text-slate-600">
              No product pages were found for this search. Try a different query.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
