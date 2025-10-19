'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react'
import Button from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Input from '@/components/ui/input'
import Label from '@/components/ui/label'

interface Category {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  createdAt: string
  updatedAt: string
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
]

const DEFAULT_ICONS = [
  { id: 'folder', label: 'Folder', icon: '📁' },
  { id: 'tag', label: 'Tag', icon: '🏷️' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'heart', label: 'Heart', icon: '❤️' },
  { id: 'fire', label: 'Fire', icon: '🔥' },
  { id: 'rocket', label: 'Rocket', icon: '🚀' },
  { id: 'target', label: 'Target', icon: '🎯' },
  { id: 'gem', label: 'Gem', icon: '💎' },
]

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchCategories()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCategories()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'folder',
    })
    setShowCreateForm(false)
    setEditingCategory(null)
  }

  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon,
    })
    setEditingCategory(category)
    setShowCreateForm(true)
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading categories...</div>
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingCategory ? 'Edit Category' : 'Create New Category'}
                </h3>
                <Button 
                  type="button" 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., E-commerce, Real Estate"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEFAULT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-400' : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                        title={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Icon</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DEFAULT_ICONS.map((iconItem) => (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconItem.id })}
                        className={`p-2 rounded-lg border-2 text-lg ${
                          formData.icon === iconItem.id 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        title={iconItem.label}
                      >
                        {iconItem.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button type="button" onClick={resetForm} className="bg-gray-200 hover:bg-gray-300">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Button */}
      {!showCreateForm && (
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      )}

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const iconItem = DEFAULT_ICONS.find(i => i.id === category.icon)
          
          return (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: category.color }}
                    >
                      {iconItem?.icon || '📁'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created {new Date(category.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => startEdit(category)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first category to start organizing your scraping jobs
          </p>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Category
          </Button>
        </div>
      )}
    </div>
  )
}
