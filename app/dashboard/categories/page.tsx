import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoriesManager } from '@/components/categories-manager'
import { Plus, FolderOpen } from 'lucide-react'

export default function CategoriesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">
            Organize your scraping jobs into categories for better management
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Most Used</p>
                <p className="text-lg font-semibold text-gray-900">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FolderOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Uncategorized Jobs</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Manage Categories</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading categories...</div>}>
            <CategoriesManager />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
