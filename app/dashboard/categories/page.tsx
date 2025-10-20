"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ResultsTable from '@/components/results-table'
import { 
  FolderOpen, 
  Package, 
  ArrowLeft, 
  Search,
  SortAsc,
  SortDesc,
  Grid3X3,
  List
} from 'lucide-react'
import Input from '@/components/ui/input'

interface Category {
  id: string
  name: string
  description: string
  color: string
  icon: string
  createdAt: string
  _count: {
    scrapedProducts: number
  }
}

interface Product {
  id: string
  title: string
  price: string | null
  image: string | null
  url: string
  brand: string | null
  rating: string | null
  description: string | null
  inStock: boolean | null
  sku: string | null
  createdAt: string
  categoryId: string | null
  category?: {
    name: string
    color: string
  }
}

export default function CategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategoryId = searchParams.get('categoryId')
  
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'recent'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Fetch categories
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch products when category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      fetchCategoryProducts(selectedCategoryId)
    } else {
      setProducts([])
    }
  }, [selectedCategoryId])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      setProductsLoading(true)
      const res = await fetch(`/api/categories/${categoryId}/products`)
      if (!res.ok) throw new Error('Failed to fetch category products')
      
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching category products:', error)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  // Filter and sort categories
  const filteredCategories = categories
    .filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'count':
          comparison = a._count.scrapedProducts - b._count.scrapedProducts
          break
        case 'recent':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId)

  const handleSelectItem = (index: string) => {
    setSelectedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(products.map((_, i) => i.toString()))
    } else {
      setSelectedItems([])
    }
  }

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-content-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 grid place-content-center animate-pulse mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-sky-600" />
          </div>
          <p className="text-slate-600">Loading categories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Categories</h1>
          <p className="text-slate-600 mt-1">
            {selectedCategory 
              ? `Viewing products in "${selectedCategory.name}"`
              : 'Browse your product categories and organize your scraped data'
            }
          </p>
        </div>
        
        {selectedCategory && (
          <Button
            onClick={() => router.push('/dashboard/categories')}
            variant="outline"
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
        )}
      </div>

      {/* Category View */}
      {!selectedCategoryId && (
        <>
          {/* Filters and Search */}
          <Card className="glass shadow-soft border border-white/40 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('name')}
                    className={sortBy === 'name' ? 'bg-sky-50 text-sky-700 border-sky-200' : ''}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('count')}
                    className={sortBy === 'count' ? 'bg-sky-50 text-sky-700 border-sky-200' : ''}
                  >
                    Items {sortBy === 'count' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSort('recent')}
                    className={sortBy === 'recent' ? 'bg-sky-50 text-sky-700 border-sky-200' : ''}
                  >
                    Recent {sortBy === 'recent' && (sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />)}
                  </Button>
                </div>

                {/* View Mode */}
                <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-none border-0"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-none border-0"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Grid/List */}
          {filteredCategories.length === 0 ? (
            <Card className="glass shadow-soft border border-white/40 rounded-3xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 grid place-content-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">No Categories Found</h3>
                <p className="text-slate-600">
                  {searchTerm ? 'No categories match your search.' : 'Start scraping to automatically create categories for your products.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredCategories.map((category) => (
                <Card
                  key={category.id}
                  className="glass shadow-soft border border-white/40 rounded-2xl hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => router.push(`/dashboard/categories?categoryId=${category.id}`)}
                >
                  <CardContent className={viewMode === 'grid' ? "p-6" : "p-4 flex items-center gap-4"}>
                    <div 
                      className={`${viewMode === 'grid' ? 'w-12 h-12 mb-4' : 'w-10 h-10'} rounded-xl text-white grid place-content-center shadow-md flex-shrink-0`}
                      style={{ backgroundColor: category.color }}
                    >
                      <Package className={viewMode === 'grid' ? 'w-6 h-6' : 'w-5 h-5'} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">{category.name}</h3>
                      <p className={`text-sm text-slate-600 mb-3 ${viewMode === 'list' ? 'truncate' : ''}`}>
                        {category.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {category._count.scrapedProducts} {category._count.scrapedProducts === 1 ? 'item' : 'items'}
                        </Badge>
                        
                        {viewMode === 'grid' && (
                          <div className="text-xs text-slate-500">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {viewMode === 'list' && (
                      <div className="text-xs text-slate-500 flex-shrink-0">
                        {new Date(category.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Products View */}
      {selectedCategoryId && selectedCategory && (
        <Card className="glass shadow-soft-lg border border-white/40 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-200/60 bg-gradient-to-r from-white/80 to-white/40">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl text-white grid place-content-center shadow-md"
                  style={{ backgroundColor: selectedCategory.color }}
                >
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCategory.name}</h2>
                  <p className="text-slate-600">{selectedCategory.description}</p>
                </div>
                <div className="ml-auto">
                  <Badge variant="secondary">
                    {products.length} {products.length === 1 ? 'product' : 'products'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {productsLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 grid place-content-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600">No products found in this category.</p>
              </div>
            ) : (
              <ResultsTable 
                rows={products.map(p => ({
                  ...p,
                  title: p.title || 'Untitled',
                  price: p.price,
                  image: p.image,
                  url: p.url || '',
                  inStock: p.inStock
                }))}
                selectedItems={selectedItems}
                onSelectItem={handleSelectItem}
                onSelectAll={handleSelectAll}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}