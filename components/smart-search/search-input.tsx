'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Search, Sparkles, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SmartSearchInputProps {
  minSources?: number
  className?: string
}

export function SmartSearchInput({ minSources = 20, className = '' }: SmartSearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const handleSmartSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query')
      return
    }

    setError('')
    setSearching(true)

    try {
      const res = await fetch('/api/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), minSources }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Search failed')
      }

      const data = await res.json()

      // Redirect to search results page
      router.push(`/dashboard/smart-search/${data.searchId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start smart search')
      setSearching(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 grid place-content-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-lg text-slate-900">Smart Product Search</h3>
          <p className="text-xs text-slate-500">AI-powered product discovery</p>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Let AI find product pages for you across the web. Just describe what you're looking for!
      </p>

      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="E.g., search for solar batteries"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !searching && handleSmartSearch()}
            disabled={searching}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <Button
          onClick={handleSmartSearch}
          disabled={searching || !query.trim()}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-w-[120px]"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-purple-900">
          <strong>How it works:</strong> We'll search {minSources}+ sources (Google, Bing, Amazon, eBay)
          and use AI to filter for actual product pages. Results typically take 1-2 minutes.
        </div>
      </div>
    </div>
  )
}
