import { useState, useEffect, useMemo } from 'react'
import { Package } from 'lucide-react'
import { toast } from 'react-hot-toast'
import ErpSidebar from '@/components/layout/ErpSidebar'
import ProductsHeader from '@/modules/products/components/ProductsHeader'
import ProductStatCards from '@/modules/products/components/ProductStatCards'
import ProductFilterBar from '@/modules/products/components/ProductFilterBar'
import ProductTable from '@/modules/products/components/ProductTable'
import ProductPagination from '@/modules/products/components/ProductPagination'
import { erpNavItems, erpFooterNavItems } from '@/constants/navigation'
const defaultFilters: any = [];
const PRODUCTS_PAGE_SIZE = 5;
import type { PageProps, ActiveFilter } from '@/types'
import { useErp } from '@/context/ErpContext'
import { useAuth } from '@/context/AuthContext'

export default function ProductsPage({ activePage, onNavigate }: PageProps) {
  const { products: erpProducts, isLoading, setActiveOrderId } = useErp()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ActiveFilter[]>(defaultFilters)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  const productStatCards = useMemo(() => [
    { id: '1', label: 'Total Products', value: erpProducts.length.toString(), subValue: 'in catalog', subValueClass: 'text-slate-500', variant: 'default' as const },
    { id: '2', label: 'Low Stock', value: erpProducts.filter(p => p.onHandQty < 10).length.toString(), subValue: 'need reorder', subValueClass: 'text-red-500', variant: 'critical' as const },
    { id: '3', label: 'Out of Stock', value: erpProducts.filter(p => p.onHandQty === 0).length.toString(), subValue: 'items unavailable', subValueClass: 'text-red-600', variant: 'critical' as const },
    { id: '4', label: 'Avg Cost Price', value: erpProducts.length > 0 ? `₹${(erpProducts.reduce((a,p) => a + p.costPrice, 0) / erpProducts.length).toFixed(0)}` : '₹0', subValue: 'per unit avg', subValueClass: 'text-slate-500', variant: 'money' as const },
  ], [erpProducts])

  // Loading is now handled by useErp

  const handleButtonClick = () => {
    toast('Action triggered')
  }

  const handleNewProduct = () => {
    setActiveOrderId(null)
    onNavigate('product-detail')
  }

  const handleProductClick = (productId: string) => {
    setActiveOrderId(productId)
    onNavigate('product-detail')
  }

  const handleRemoveFilter = (filterId: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== filterId))
  }

  const handleClearAllFilters = () => {
    setFilters([])
  }

  const filteredProducts = useMemo(() => {
    // Map ErpProducts to UI products structure
    const mapped = erpProducts.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.code,
      reference: p.id,
      category: p.id.includes('PRD') ? 'Finished Goods' : 'Components',
      price: p.salesPrice,
      salesPrice: p.salesPrice,
      costPrice: p.costPrice,
      cost: p.costPrice,
      onHand: p.onHandQty,
      onHandQty: p.onHandQty,
      reservedQty: p.reservedQty || 0,
      freeToUse: (p.onHandQty || 0) - (p.reservedQty || 0),
      status: (p.onHandQty > 10 ? 'In Stock' : p.onHandQty > 0 ? 'Low Stock' : 'Out of Stock') as any,
      imageBg: 'bg-indigo-100',
      imageIcon: Package,
      imageUrl: p.imageUrl
    }))

    if (searchQuery === '') return mapped
    const query = searchQuery.toLowerCase()
    return mapped.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    )
  }, [searchQuery, erpProducts])

  const totalPages = Math.max(
    1,
    Math.ceil(erpProducts.length / PRODUCTS_PAGE_SIZE),
  )

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    const allSelected = filteredProducts.every((p) => selectedIds.has(p.id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <ErpSidebar
        navItems={erpNavItems}
        footerItems={erpFooterNavItems}
        activePage={activePage}
        onNavigate={onNavigate}
        onNewRecordClick={handleNewProduct}
        userName={user?.email ?? 'Admin'}
        userRole={String(user?.role ?? 'ADMIN')}
        userInitials={(user?.email ?? 'A').slice(0, 2).toUpperCase()}
      />

      <div className="ml-60 flex min-h-screen flex-col">
        <ProductsHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewProductClick={handleNewProduct}
          onButtonClick={handleButtonClick}
        />

        <main className="flex-1 p-6">
          <ProductStatCards cards={productStatCards} />

          <ProductFilterBar
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            onExport={handleButtonClick}
            onPrint={handleButtonClick}
          />

          <ProductTable
            products={filteredProducts}
            loading={isLoading}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onProductClick={handleProductClick}
          />

          {!isLoading && (
            <ProductPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={erpProducts.length}
              pageSize={PRODUCTS_PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </main>
      </div>
    </div>
  )
}
