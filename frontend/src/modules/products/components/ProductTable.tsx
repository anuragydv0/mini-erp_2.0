import type { Product } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

interface ProductTableProps {
  products: Product[]
  loading: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onProductClick: (id: string) => void
}

// statusConfig removed

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

export default function ProductTable({
  products,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onProductClick,
}: ProductTableProps) {
  if (loading) return <LoadingSpinner />

  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id))

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Reference
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Product
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sales Price
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Cost Price
            </th>
            <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              On hand Qty
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const Icon = product.imageIcon
            const isSelected = selectedIds.has(product.id)

            return (
              <tr
                key={product.id}
                className={`transition-colors hover:bg-slate-50/50 ${
                  isSelected ? 'bg-indigo-50/30' : ''
                }`}
              >
                <td className="w-12 px-4 py-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(product.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <span className="font-mono text-sm font-medium text-indigo-600">
                    {product.reference || product.sku}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => onProductClick(product.id)}
                    className="flex items-center gap-3 text-left"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 border border-slate-200"
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {product.category}
                      </p>
                    </div>
                  </button>
                </td>
                <td className="px-4 py-4 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(product.salesPrice)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right text-sm text-slate-600">
                  {formatCurrency(product.costPrice)}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span
                      className={`text-sm font-medium ${
                        product.status === 'Low Stock'
                          ? 'text-red-600 font-bold'
                          : 'text-slate-700'
                      }`}
                    >
                      {formatNumber(product.onHand)}
                    </span>
                    <span className="text-[10px] text-slate-400">Units</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
