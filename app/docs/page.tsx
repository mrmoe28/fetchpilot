"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Code2, 
  Copy, 
  CheckCircle, 
  ExternalLink,
  Play,
  Settings,
  Zap,
  Globe,
  Key,
  ArrowRight,
  BookOpen,
  Terminal
} from 'lucide-react'

export default function APIDocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'authentication' | 'endpoints' | 'examples'>('overview')

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(id)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const CodeBlock = ({ children, id, language = 'bash' }: { children: string, id: string, language?: string }) => (
    <div className="relative">
      <div className="absolute top-3 right-3 z-10">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => copyToClipboard(children, id)}
          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
        >
          {copiedCode === id ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-sm">
        <code className={`language-${language}`}>{children}</code>
      </pre>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'endpoints', label: 'API Endpoints', icon: Code2 },
    { id: 'examples', label: 'Examples', icon: Terminal }
  ] as const

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
          <Code2 className="w-4 h-4" />
          API Documentation
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 bg-clip-text text-transparent mb-4">
          FetchPilot API
        </h1>
        <p className="text-xl text-slate-600">
          Integrate web scraping and product extraction into your applications with our powerful REST API.
        </p>
      </div>

      {/* Navigation Tabs */}
      <Card className="glass shadow-soft border border-white/40 rounded-2xl overflow-hidden">
        <div className="border-b border-slate-200/60">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <CardContent className="p-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Getting Started</h2>
                <p className="text-slate-600 mb-6">
                  The FetchPilot API allows you to programmatically scrape websites and extract structured product data. 
                  Our intelligent system automatically categorizes products and enriches them with metadata.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border border-slate-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 grid place-content-center mb-4">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Lightning Fast</h3>
                    <p className="text-sm text-slate-600">
                      Optimized extraction pipeline with intelligent caching and concurrent processing.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 rounded-xl">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 grid place-content-center mb-4">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">Universal</h3>
                    <p className="text-sm text-slate-600">
                      Works with any website. Automatically adapts to different page structures and formats.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Base URL</h3>
                <CodeBlock id="base-url">
{`https://your-domain.com/api/v1`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Rate Limits</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 grid place-content-center flex-shrink-0 mt-0.5">
                      <Settings className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900 mb-1">Current Limits</p>
                      <p className="text-sm text-blue-700">
                        100 requests per minute per API key. For higher limits, contact our support team.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Tab */}
          {activeTab === 'authentication' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
                <p className="text-slate-600 mb-6">
                  The FetchPilot API uses session-based authentication. You need to be signed in to make API requests.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Session Authentication</h3>
                <p className="text-slate-600 mb-4">
                  API requests are authenticated using your browser session. Make sure you're signed in to FetchPilot.
                </p>
                
                <CodeBlock id="auth-example" language="javascript">
{`// Making authenticated requests from your frontend
const response = await fetch('/api/v1/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com/products',
    goal: 'Extract product cards, prices, details, model numbers and canonical links'
  })
})

const data = await response.json()`}
                </CodeBlock>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 grid place-content-center flex-shrink-0 mt-0.5">
                    <Key className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900 mb-1">API Key Authentication (Coming Soon)</p>
                    <p className="text-sm text-amber-700">
                      We're working on API key authentication for server-to-server integration. 
                      This will allow you to make requests from your backend without browser sessions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Endpoints Tab */}
          {activeTab === 'endpoints' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">API Endpoints</h2>
              </div>

              {/* Scrape Endpoint */}
              <div className="border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-green-100 text-green-700 font-mono">POST</Badge>
                  <code className="text-lg font-mono">/api/v1/scrape</code>
                </div>
                <p className="text-slate-600 mb-4">
                  Start a new scraping job with automatic product categorization and metadata enrichment.
                </p>

                <h4 className="font-semibold text-slate-900 mb-3">Request Body</h4>
                <CodeBlock id="scrape-request" language="json">
{`{
  "url": "https://example.com/products",
  "goal": "Extract product cards, prices, details, model numbers and canonical links",
  "config": {
    "maxTotalPages": 5,
    "browserEnabled": false
  }
}`}
                </CodeBlock>

                <h4 className="font-semibold text-slate-900 mb-3 mt-6">Response</h4>
                <CodeBlock id="scrape-response" language="json">
{`{
  "success": true,
  "data": {
    "jobId": "abc123",
    "products": [
      {
        "url": "https://example.com/product/1",
        "title": "Sample Product",
        "price": "$29.99",
        "image": "https://example.com/image.jpg",
        "categoryId": "cat_xyz",
        "description": "Product description",
        "brand": "BrandName",
        "rating": "4.5",
        "inStock": true
      }
    ],
    "stats": {
      "pagesProcessed": 3,
      "productsFound": 15,
      "duration": 12500
    }
  }
}`}
                </CodeBlock>
              </div>

              {/* Jobs Endpoint */}
              <div className="border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-blue-100 text-blue-700 font-mono">GET</Badge>
                  <code className="text-lg font-mono">/api/jobs</code>
                </div>
                <p className="text-slate-600 mb-4">
                  Retrieve your recent scraping jobs and their status.
                </p>

                <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
                <CodeBlock id="jobs-response" language="json">
{`[
  {
    "id": "job_123",
    "url": "https://example.com/products",
    "goal": "Extract products",
    "status": "completed",
    "productsFound": 25,
    "createdAt": "2024-01-15T10:30:00Z",
    "completedAt": "2024-01-15T10:32:15Z"
  }
]`}
                </CodeBlock>
              </div>

              {/* Categories Endpoint */}
              <div className="border border-slate-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-purple-100 text-purple-700 font-mono">GET</Badge>
                  <code className="text-lg font-mono">/api/categories</code>
                </div>
                <p className="text-slate-600 mb-4">
                  Get all your product categories with item counts.
                </p>

                <h4 className="font-semibold text-slate-900 mb-3">Response</h4>
                <CodeBlock id="categories-response" language="json">
{`[
  {
    "id": "cat_123",
    "name": "Electronics",
    "description": "Electronic devices and gadgets",
    "color": "#3B82F6",
    "icon": "laptop",
    "_count": {
      "scrapedProducts": 42
    },
    "createdAt": "2024-01-10T09:15:00Z"
  }
]`}
                </CodeBlock>
              </div>
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Integration Examples</h2>
                <p className="text-slate-600 mb-6">
                  Here are some practical examples of how to integrate FetchPilot into your applications.
                </p>
              </div>

              {/* JavaScript Example */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">JavaScript/TypeScript</h3>
                <CodeBlock id="js-example" language="typescript">
{`// FetchPilot API Client
class FetchPilotClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  async scrapeWebsite(url: string, goal?: string) {
    const response = await fetch(\`\${this.baseUrl}/scrape\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        goal: goal || 'Extract product cards, prices, details, model numbers and canonical links',
        config: {
          maxTotalPages: 10,
          browserEnabled: false
        }
      })
    })

    if (!response.ok) {
      throw new Error(\`Scraping failed: \${response.statusText}\`)
    }

    return response.json()
  }

  async getJobs() {
    const response = await fetch('/api/jobs')
    return response.json()
  }

  async getCategories() {
    const response = await fetch('/api/categories')
    return response.json()
  }
}

// Usage
const client = new FetchPilotClient()

try {
  const result = await client.scrapeWebsite('https://example.com/products')
  console.log(\`Found \${result.data.products.length} products\`)
  console.log('Products:', result.data.products)
} catch (error) {
  console.error('Scraping failed:', error)
}`}
                </CodeBlock>
              </div>

              {/* React Hook Example */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">React Hook</h3>
                <CodeBlock id="react-example" language="typescript">
{`import { useState, useEffect } from 'react'

interface Product {
  id: string
  title: string
  price: string
  url: string
  categoryId?: string
}

export function useFetchPilot() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

  const scrapeWebsite = async (url: string, goal?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/v1/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, goal })
      })

      if (!response.ok) {
        throw new Error('Scraping failed')
      }

      const result = await response.json()
      setProducts(result.data.products)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    scrapeWebsite,
    products,
    loading,
    error,
    clearProducts: () => setProducts([]),
    clearError: () => setError(null)
  }
}

// Usage in component
function ProductScraper() {
  const { scrapeWebsite, products, loading, error } = useFetchPilot()
  const [url, setUrl] = useState('')

  const handleScrape = async () => {
    if (!url) return
    
    try {
      await scrapeWebsite(url)
    } catch (error) {
      console.error('Scraping failed:', error)
    }
  }

  return (
    <div>
      <input 
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter URL to scrape"
      />
      <button onClick={handleScrape} disabled={loading}>
        {loading ? 'Scraping...' : 'Scrape'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      <div className="products">
        {products.map(product => (
          <div key={product.id}>
            <h3>{product.title}</h3>
            <p>{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}`}
                </CodeBlock>
              </div>

              {/* Python Example */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">Python (requests)</h3>
                <CodeBlock id="python-example" language="python">
{`import requests
import json
from typing import Dict, List, Optional

class FetchPilotClient:
    def __init__(self, base_url: str = "http://localhost:3000/api/v1"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def scrape_website(self, url: str, goal: Optional[str] = None) -> Dict:
        """Scrape a website and extract products"""
        endpoint = f"{self.base_url}/scrape"
        
        payload = {
            "url": url,
            "goal": goal or "Extract product cards, prices, details, model numbers and canonical links",
            "config": {
                "maxTotalPages": 10,
                "browserEnabled": False
            }
        }
        
        response = self.session.post(endpoint, json=payload)
        response.raise_for_status()
        
        return response.json()
    
    def get_jobs(self) -> List[Dict]:
        """Get all scraping jobs"""
        response = self.session.get(f"{self.base_url}/jobs")
        response.raise_for_status()
        return response.json()
    
    def get_categories(self) -> List[Dict]:
        """Get all categories with product counts"""
        response = self.session.get(f"{self.base_url}/categories")
        response.raise_for_status()
        return response.json()

# Usage example
if __name__ == "__main__":
    client = FetchPilotClient()
    
    try:
        # Scrape a website
        result = client.scrape_website("https://example.com/products")
        
        print(f"Found {len(result['data']['products'])} products")
        
        # Print first few products
        for product in result['data']['products'][:3]:
            print(f"- {product['title']}: {product['price']}")
            
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")`}
                </CodeBlock>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Start CTA */}
      <Card className="glass shadow-soft border border-emerald-200/60 rounded-3xl bg-gradient-to-br from-emerald-50/50 to-green-50/30">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white grid place-content-center mx-auto mb-6">
            <Play className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to start scraping?</h3>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Try the API directly from your dashboard or integrate it into your applications using the examples above.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Start Scraping
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://github.com/your-org/fetchpilot-examples', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Examples
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
