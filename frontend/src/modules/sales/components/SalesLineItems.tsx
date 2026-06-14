import { LayoutGrid, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/utils/formatters'
import type { CreateLineItem } from '@/types'
import type { ErpProduct } from '@/types/erp'
import { useState } from 'react'

interface SalesLineItemsProps {
  items: CreateLineItem[]
  products: ErpProduct[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  onAddRow: () => void
  onDeleteRow: (id: string) => void
  onChangeRow: (id: string, updatedFields: Partial<CreateLineItem>) => void
}

// Map product id → free qty (on_hand - reserved)
const getAvailability = (product: ErpProduct | undefined): number => {
  if (!product) return 0
  const onHand = product.onHandQty ?? 0
  const reserved = product.reservedQty ?? 0
  return Math.max(0, onHand - reserved)
}

export default function SalesLineItems({
  items,
  products,
  subtotal,
  taxRate,
  taxAmount,
  total,
  onAddRow,
  onDeleteRow,
  onChangeRow,
}: SalesLineItemsProps) {
  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="h-5 w-5 text-indigo-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Line Items
          </h3>
        </div>
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/60">
              <th className="w-12 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                #
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Product
              </th>
              <th className="w-28 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Availability
              </th>
              <th className="w-28 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Ord. Qty
              </th>
              <th className="w-24 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Del. Qty
              </th>
              <th className="w-32 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Unit Price
              </th>
              <th className="w-32 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total
              </th>
              <th className="w-12 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const selectedProduct = products.find(p => p.id === item.sku)
              const availability = getAvailability(selectedProduct)
              const isShort = item.sku && item.orderedQty > availability

              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-slate-50/50"
                >
                  <td className="px-4 py-4 text-center text-sm text-slate-500">
                    {item.rowNum}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                      value={item.sku}
                      onChange={(e) => {
                        const selectedProd = products.find(p => p.id === e.target.value)
                        if (selectedProd) {
                          onChangeRow(item.id, {
                            product: selectedProd.name,
                            sku: selectedProd.id,
                            unitPrice: selectedProd.salesPrice,
                            total: item.orderedQty * selectedProd.salesPrice
                          })
                        } else {
                          onChangeRow(item.id, {
                            product: '',
                            sku: '',
                            unitPrice: 0,
                            total: 0
                          })
                        }
                      }}
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) - ₹{p.salesPrice}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Availability badge */}
                  <td className="px-4 py-4 text-center">
                    {item.sku ? (
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isShort
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {availability} in stock
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="1"
                      className={`w-full rounded-lg border p-2 text-center text-sm text-slate-800 focus:outline-none ${
                        isShort ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-indigo-500'
                      }`}
                      value={item.orderedQty || ''}
                      onChange={(e) => {
                        const qty = Math.max(0, Number(e.target.value))
                        onChangeRow(item.id, {
                          orderedQty: qty,
                          total: qty * item.unitPrice
                        })
                      }}
                    />
                    {isShort && (
                      <p className="mt-0.5 text-center text-[10px] text-red-500">Exceeds stock!</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-sm text-slate-500">
                    0
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-700">
                    {item.sku ? formatCurrency(item.unitPrice) : '—'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-bold text-indigo-600">
                      {item.sku ? formatCurrency(item.total) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => onDeleteRow(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t border-slate-200 px-6 py-4">
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Tax ({taxRate}%)</span>
              <span className="font-medium text-slate-700">
                {formatCurrency(taxAmount)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">Total</span>
                <span className="text-lg font-bold text-indigo-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
