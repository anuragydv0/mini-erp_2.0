import { useState, useEffect } from 'react'
import ErpSidebar from '@/components/layout/ErpSidebar'
import ProductDetailHeader from '@/modules/products/components/ProductDetailHeader'
import ProductDetailActions from '@/modules/products/components/ProductDetailActions'
import ProductForm from '@/modules/products/components/ProductForm'
import RecordInfo from '@/modules/products/components/RecordInfo'
import RecentLogs from '@/modules/products/components/RecentLogs'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { erpNavItems, erpFooterNavItems } from '@/constants/navigation'
import { useErp } from '@/context/ErpContext'
import type { PageProps, ProcurementConfig } from '@/types'
import { toast } from 'react-hot-toast'

export default function ProductDetailPage({ onNavigate }: PageProps) {
  const { createProduct, activeOrderId, products, isLoading } = useErp()
  const activeProduct = products.find(p => p.id === activeOrderId)
  const [loading, setLoading] = useState(true)

  // Form state — pre-fill if editing an existing product
  const [productName, setProductName] = useState(activeProduct?.name || '')
  const [salesPrice, setSalesPrice] = useState(activeProduct?.salesPrice ?? 0)
  const [costPrice, setCostPrice] = useState(activeProduct?.costPrice ?? 0)
  const [onHandQty, setOnHandQty] = useState(String(activeProduct?.onHandQty ?? 0))
  const [freeToUseQty, setFreeToUseQty] = useState(String((activeProduct?.onHandQty ?? 0) - (activeProduct?.reservedQty ?? 0)))
  const [productImage, setProductImage] = useState<string | null>(activeProduct?.imageUrl || null)
  const [procurement, setProcurement] = useState<ProcurementConfig>({
    procureOnDemand: activeProduct?.procurementType === 'MTO',
    procurementType: (activeProduct?.procurementMethod as any) || 'Purchase',
    vendor: activeProduct?.vendorId,
    bom: undefined,
    vendorOptions: [],
    bomOptions: [],
    isActive: true,
    route: undefined,
    routeOptions: [],
  })

  useEffect(() => {
    if (activeProduct) {
      setProductName(activeProduct.name || '')
      setSalesPrice(activeProduct.salesPrice ?? 0)
      setCostPrice(activeProduct.costPrice ?? 0)
      setOnHandQty(String(activeProduct.onHandQty ?? 0))
      setFreeToUseQty(String((activeProduct.onHandQty ?? 0) - (activeProduct.reservedQty ?? 0)))
      setProductImage(activeProduct.imageUrl || null)
      setProcurement({
        procureOnDemand: activeProduct.procurementType === 'MTO',
        procurementType: (activeProduct.procurementMethod as any) || 'Purchase',
        vendor: activeProduct.vendorId,
        bom: undefined,
        vendorOptions: [],
        bomOptions: [],
        isActive: true,
        route: undefined,
        routeOptions: [],
      })
    } else {
      setProductName('')
      setSalesPrice(0)
      setCostPrice(0)
      setOnHandQty('0')
      setFreeToUseQty('0')
      setProductImage(null)
      setProcurement({
        procureOnDemand: false,
        procurementType: 'Purchase',
        vendor: undefined,
        bom: undefined,
        vendorOptions: [],
        bomOptions: [],
        isActive: true,
        route: undefined,
        routeOptions: [],
      })
    }
  }, [activeProduct])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleBack = () => {
    onNavigate('products')
  }

  const handleCancel = () => {
    toast('Edit Cancelled')
    onNavigate('products')
  }

  const handleSave = async () => {
    try {
      await createProduct({
        id: activeProduct?.id,
        name: productName,
        salesPrice: salesPrice,
        costPrice: costPrice,
        onHandQty: parseFloat(onHandQty) || 0,
        freeToUseQty: parseFloat(freeToUseQty) || 0,
        procurementType: procurement.procureOnDemand ? 'MTO' : 'MTS',
        procurementMethod: procurement.procurementType || 'Purchase',
        vendorId: procurement.vendor,
        imageUrl: productImage || undefined
      })
      onNavigate('products')
    } catch (err) {
      // Error handled in context
    }
  }

  const handleButtonClick = () => {
    toast('Action triggered')
  }

  const handleProcurementTypeChange = (type: 'Purchase' | 'Manufacturing') => {
    setProcurement((prev) => ({ ...prev, procurementType: type, vendor: undefined, bom: undefined }))
  }

  const handleVendorChange = (vendor: string) => {
    setProcurement((prev) => ({ ...prev, vendor }))
  }

  const handleBomChange = (bom: string) => {
    setProcurement((prev) => ({ ...prev, bom }))
  }

  const handleSalesPriceChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num)) setSalesPrice(num)
  }

  const handleCostPriceChange = (value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num)) setCostPrice(num)
  }

  const handleImageChange = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setProductImage(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <ErpSidebar
        navItems={erpNavItems}
        footerItems={erpFooterNavItems}
        activePage="products"
        onNavigate={onNavigate}
        onNewRecordClick={() => onNavigate('product-detail')}
      />

      <div className="ml-60 flex min-h-screen flex-col">
        <ProductDetailHeader
          productName={productName || 'New Product'}
          reference={activeProduct?.id || 'NEW'}
          onBack={handleBack}
          onButtonClick={handleButtonClick}
        />

        {loading ? (
          <LoadingSpinner className="mt-32" />
        ) : (
          <main className="flex-1 p-6">
            <ProductDetailActions
              onCancel={handleCancel}
              onSave={handleSave}
              onViewAudit={() => onNavigate('audit-logs')}
            />

            <div className="flex gap-6">
              {/* Main form area */}
              <div className="min-w-0 flex-1">
                <ProductForm
                  productName={productName}
                  salesPrice={salesPrice}
                  costPrice={costPrice}
                  onHandQty={onHandQty}
                  freeToUseQty={freeToUseQty}
                  productImage={productImage}
                  procurement={procurement}
                  onProductNameChange={setProductName}
                  onSalesPriceChange={handleSalesPriceChange}
                  onCostPriceChange={handleCostPriceChange}
                  onOnHandQtyChange={setOnHandQty}
                  onFreeToUseQtyChange={setFreeToUseQty}
                  onImageChange={handleImageChange}
                  onToggleProcurement={() => setProcurement(prev => ({ ...prev, procureOnDemand: !prev.procureOnDemand }))}
                  onProcurementTypeChange={handleProcurementTypeChange}
                  onVendorChange={handleVendorChange}
                  onBomChange={handleBomChange}
                />
              </div>

              {/* Right sidebar panels */}
              <div className="w-80 shrink-0 space-y-4">
                <RecordInfo record={{
                  lifecycle: 'Active',
                  lastAudit: new Date().toISOString(),
                  createdBy: 'System',
                  inventoryHealth: 100,
                  healthDescription: 'Healthy'
                }} />
                <RecentLogs
                  logs={[]}
                  onViewAll={() => onNavigate('audit-logs')}
                />
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
