import { Table, THead, TRow, TH, TD } from "@/components/ui/table"
import Image from "next/image"
import { ExternalLink, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultsTableProps {
  rows: any[];
  selectedItems?: string[];
  onSelectItem?: (index: string) => void;
  onSelectAll?: (selected: boolean) => void;
  onDelete?: (productId: string, index: number) => void;
  showDelete?: boolean;
}

export default function ResultsTable({ 
  rows, 
  selectedItems = [], 
  onSelectItem, 
  onSelectAll,
  onDelete,
  showDelete = false
}: ResultsTableProps) {
  const allSelected = rows.length > 0 && selectedItems.length === rows.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < rows.length;
  return (
    <div className="overflow-auto max-h-[600px]">
      {rows.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 grid place-content-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">No products extracted yet</p>
          <p className="text-sm text-slate-400 mt-1">Start a scrape to see results here</p>
        </div>
      ) : (
        <Table>
          <THead>
            <TRow className="bg-slate-50/50">
              <TH className="font-semibold w-12">
                {onSelectAll && (
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 text-sky-600 bg-white border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
                    title="Select all items"
                  />
                )}
              </TH>
              <TH className="font-semibold">Image</TH>
              <TH className="font-semibold">Title</TH>
              <TH className="font-semibold">Price</TH>
              <TH className="font-semibold">Brand</TH>
              <TH className="font-semibold">Rating</TH>
              <TH className="font-semibold">Category</TH>
              <TH className="font-semibold">Stock</TH>
              <TH className="font-semibold">URL</TH>
              {showDelete && <TH className="font-semibold">Actions</TH>}
            </TRow>
          </THead>
          <tbody>
            {rows.map((r, i) => (
              <TRow key={i} className="hover:bg-sky-50/30 transition-colors animate-fade-in" style={{animationDelay: `${i * 0.05}s`}}>
                <TD>
                  {onSelectItem && (
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(i.toString())}
                      onChange={() => onSelectItem(i.toString())}
                      className="w-4 h-4 text-sky-600 bg-white border-slate-300 rounded focus:ring-sky-500 focus:ring-2"
                      aria-label={`Select ${r.title || 'product'}`}
                    />
                  )}
                </TD>
                <TD>
                  {r.image ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shadow-sm">
                      <Image
                        src={r.image}
                        alt={r.title || 'Product image'}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 grid place-content-center">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </TD>
                <TD className="font-medium text-slate-900 max-w-md">
                  <div className="line-clamp-2">{r.title || "-"}</div>
                </TD>
                <TD>
                  {r.price ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 text-green-700 font-semibold text-sm">
                      {r.price}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TD>
                <TD>
                  {(r as any).brand ? (
                    <span className="text-sm text-slate-700 font-medium">
                      {(r as any).brand}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TD>
                <TD>
                  {(r as any).rating ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-sm">
                      <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      {(r as any).rating}
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TD>
                <TD>
                  {(r as any).category?.name ? (
                    <span 
                      className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: (r as any).category.color }}
                    >
                      {(r as any).category.name}
                    </span>
                  ) : (r as any).categoryId ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                      Categorized
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TD>
                <TD>
                  {r.inStock === true ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      In Stock
                    </div>
                  ) : r.inStock === false ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-sm font-medium">
                      <XCircle className="w-3.5 h-3.5" />
                      Out
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TD>
                <TD>
                  <a
                    className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-medium text-sm transition-colors"
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </a>
                </TD>
                {showDelete && onDelete && (
                  <TD>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm('Are you sure you want to delete this product?')) {
                          onDelete(r.id, i)
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TD>
                )}
              </TRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
