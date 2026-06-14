import { useState, useEffect } from 'react'
import ErpSidebar from '@/components/layout/ErpSidebar'
import PODetailHeader from '@/modules/purchase/components/PODetailHeader'
import POBreadcrumbActions from '@/modules/purchase/components/POBreadcrumbActions'
import VendorInfoCards from '@/modules/purchase/components/VendorInfoCards'
import PurchaseItemsTable from '@/modules/purchase/components/PurchaseItemsTable'
import OrderHistory from '@/modules/purchase/components/OrderHistory'
import AdditionalNotes from '@/modules/purchase/components/AdditionalNotes'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { erpNavItems, erpFooterNavItems } from '@/constants/navigation'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'

import type { HeaderTab, PageProps, PurchaseItem } from '@/types'
import { toast } from 'react-hot-toast'
import { useErp } from '@/context/ErpContext'
import { generateInvoicePDF, type InvoiceData } from '@/utils/pdfGenerator'
import apiClient from '@/api/client'
import { purchaseApi } from '@/api/purchaseApi'
import { useAuth } from '@/context/AuthContext'

export default function PurchaseOrderDetailPage({
  onNavigate,
}: PageProps) {
  const { purchaseOrders, activeOrderId, confirmPurchaseOrder, receivePurchaseOrder, products, refreshData } = useErp()
  const { user } = useAuth()
  
  const activeOrder = purchaseOrders.find(o => o.id === activeOrderId)

  const [vendorList, setVendorList] = useState<any[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState<string>('')
  const [createdItems, setCreatedItems] = useState<any[]>([])

  useEffect(() => {
    if (!activeOrder) {
      const fetchVendors = async () => {
        try {
          const res = await apiClient.get('/vendors')
          const vendors = (res as any) || []
          setVendorList(vendors)
          
          const preSelectedId = localStorage.getItem('create_po_vendor_id')
          if (preSelectedId) {
            setSelectedVendorId(preSelectedId)
            localStorage.removeItem('create_po_vendor_id')
          } else if (vendors.length > 0) {
            setSelectedVendorId(vendors[0]._id)
          }
        } catch (e) {
          toast.error('Failed to load vendors')
        }
      }
      fetchVendors()
    }
  }, [activeOrder])

  const handleAddCreatedItem = () => {
    const newItem = {
      id: String(Date.now() + Math.random()),
      productId: '',
      quantity: 1,
      price: 0,
    }
    setCreatedItems([...createdItems, newItem])
  }

  const handleRemoveCreatedItem = (id: string) => {
    setCreatedItems(createdItems.filter(item => item.id !== id))
  }

  const handleUpdateCreatedItem = (id: string, fields: any) => {
    setCreatedItems(createdItems.map(item => item.id === id ? { ...item, ...fields } : item))
  }

  const handleSavePO = async () => {
    if (!selectedVendorId) {
      toast.error('Please select a vendor')
      return
    }
    if (createdItems.length === 0) {
      toast.error('At least one product is required')
      return
    }
    const invalidItem = createdItems.find(item => !item.productId)
    if (invalidItem) {
      toast.error('Please select a product for all rows')
      return
    }
    const invalidQty = createdItems.find(item => item.quantity <= 0)
    if (invalidQty) {
      toast.error('Quantity must be greater than 0')
      return
    }

    const payload = {
      vendor_id: selectedVendorId,
      responsible_person: user?.id || undefined,
      products: createdItems.map(item => ({
        product_id: item.productId,
        ordered_quantity: item.quantity,
        cost_price: item.price
      }))
    }

    try {
      setLoading(true)
      await purchaseApi.createOrder(payload)
      toast.success('Purchase Order created successfully')
      await refreshData()
      onNavigate('purchase')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Purchase Order')
    } finally {
      setLoading(false)
    }
  }

  // Header state
  const [activeTab, setActiveTab] = useState<HeaderTab>('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Loading state
  const [loading, setLoading] = useState(true)

  // Order state
  const [orderStatus, setOrderStatus] = useState<string>(
    activeOrder?.status || 'Draft'
  )
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [notes, setNotes] = useState('')
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    if (activeOrder) {
      setOrderStatus(activeOrder.status)
      const mapped = activeOrder.items?.map((item: any) => {
        const product = products.find(p => p.id === item.productId)
        return {
          id: item.id,
          product: product?.name || `Product ${item.productId}`,
          sku: product?.code || `SKU-${item.productId}`,
          ordered: item.quantity,
          received: item.receivedQuantity || 0,
          uom: 'Units',
          unitPrice: item.price,
          subtotal: item.quantity * item.price,
          iconBg: 'bg-indigo-500'
        }
      }) || []
      setItems(mapped)

      // Fetch audit logs for this record from backend
      const fetchLogs = async () => {
        try {
          const res = await apiClient.get(`/audit-logs?recordId=${activeOrder.id}`)
          setAuditLogs((res as any) || [])
        } catch (e) {
          // ignore
        }
      }
      fetchLogs()
    } else {
      setOrderStatus('Draft')
      setItems([])
      setCreatedItems([])
    }
  }, [activeOrder, products])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleButtonClick = () => {
    toast('Action triggered')
  }

  const handleCancel = async () => {
    try {
      await apiClient.post(`/purchase/${activeOrder.id}/cancel`)
      setOrderStatus('Cancelled')
      toast.error('Order cancelled')
      onNavigate('purchase')
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel')
    }
  }

  const handleConfirm = async () => {
    await confirmPurchaseOrder(activeOrder.id)
  }

  const handleReceive = async () => {
    await receivePurchaseOrder(activeOrder.id)
  }

  const handleDownloadPDF = () => {
    const invoiceData: InvoiceData = {
      reference: activeOrder?.reference || 'Unknown',
      status: activeOrder?.status || 'Draft',
      customerName: (activeOrder as any)?.vendorName || 'Vendor',
      billingAddress: (activeOrder as any)?.vendorAddress || 'Vendor Address',
      orderDate: activeOrder?.createdAt ? new Date(activeOrder.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
      salesPerson: (activeOrder as any)?.responsiblePerson || 'Procurement Dept',
      lineItems: items.map(li => ({
        product: li.product,
        quantity: li.ordered,
        price: li.unitPrice,
        total: li.subtotal
      })),
      subtotal: activeOrder?.totalAmount || 0,
      taxAmount: 0,
      total: activeOrder?.totalAmount || 0
    }
    
    generateInvoicePDF(invoiceData)
    toast.success('PO PDF Downloaded')
  }

  const handleAddProduct = () => {
    toast.error('Products cannot be added to an active purchase order directly from details.')
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <ErpSidebar
        navItems={erpNavItems}
        footerItems={erpFooterNavItems}
        activePage="purchase"
        onNavigate={onNavigate}
        onNewRecordClick={handleButtonClick}
      />

      <div className="ml-60 flex min-h-screen flex-col">
        <PODetailHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {loading ? (
          <LoadingSpinner className="mt-32" />
        ) : (
          <main className="flex-1 p-6">
            {!activeOrder ? (
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="mb-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <button
                      type="button"
                      onClick={() => onNavigate('purchase')}
                      className="transition-colors hover:text-indigo-600"
                    >
                      Purchase Orders
                    </button>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="font-medium text-slate-800">New Purchase Order</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">New Purchase Order</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('purchase')}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePO}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    Save Record
                  </button>
                </div>
              </div>
            ) : (
              <POBreadcrumbActions 
                reference={activeOrder?.reference || 'Unknown'} 
                status={orderStatus}
                onDownloadPDF={handleDownloadPDF}
                onBackToPurchase={() => onNavigate('purchase')}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                onReceive={handleReceive}
              />
            )}
            
            <div className="flex gap-6">
              {/* Main content area */}
              <div className="min-w-0 flex-1 space-y-5">
                {!activeOrder && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Select Vendor</label>
                    <select
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                    >
                      <option value="" disabled>Choose a vendor...</option>
                      {vendorList.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.name} ({v.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <VendorInfoCards
                  vendorName={activeOrder ? (activeOrder as any)?.vendorName : (vendorList.find(v => v._id === selectedVendorId)?.name || 'Vendor')}
                  vendorCode={activeOrder ? 'VEN-DB' : (vendorList.find(v => v._id === selectedVendorId)?.code || 'VEN-NEW')}
                  vendorAddress={activeOrder ? (activeOrder as any)?.vendorAddress : (vendorList.find(v => v._id === selectedVendorId)?.vendor_address || 'Vendor Address')}
                  responsiblePerson={activeOrder ? (activeOrder as any)?.responsiblePerson : (vendorList.find(v => v._id === selectedVendorId)?.responsible_person || 'Purchase Rep')}
                  responsibleRole="Purchase Representative"
                />
                
                {!activeOrder ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Purchase Items ({createdItems.length})</h2>
                        <p className="text-sm text-slate-500">Items ordered from vendor</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCreatedItem}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Product
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[600px]">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">Product</th>
                            <th className="w-28 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ordered Qty</th>
                            <th className="w-24 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">UOM</th>
                            <th className="w-32 px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Unit Price</th>
                            <th className="w-32 px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Subtotal</th>
                            <th className="w-12 px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {createdItems.map((item) => {
                            const subtotal = item.quantity * item.price

                            return (
                              <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                                <td className="px-4 py-4">
                                  <select
                                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                    value={item.productId}
                                    onChange={(e) => {
                                      const prod = products.find(p => p.id === e.target.value)
                                      handleUpdateCreatedItem(item.id, {
                                        productId: e.target.value,
                                        price: prod?.costPrice || 0
                                      })
                                    }}
                                  >
                                    <option value="" disabled>Select Product...</option>
                                    {products.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.code}) - ${p.costPrice}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-4">
                                  <input
                                    type="number"
                                    min="1"
                                    className="w-full rounded-lg border border-slate-200 p-2 text-center text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const qty = Math.max(1, Number(e.target.value))
                                      handleUpdateCreatedItem(item.id, { quantity: qty })
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-4 text-center text-sm text-slate-500">
                                  Units
                                </td>
                                <td className="px-4 py-4 text-right text-sm text-slate-700">
                                  ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900">
                                  ${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCreatedItem(item.id)}
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

                    <div className="border-t border-slate-200 px-6 py-4">
                      <div className="ml-auto w-72 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Untaxed Amount</span>
                          <span className="font-medium text-slate-700">
                            ${createdItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">Taxes (0%)</span>
                          <span className="font-medium text-slate-700">$0.00</span>
                        </div>
                        <div className="border-t border-slate-200 pt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-bold text-slate-900">Total</span>
                            <span className="text-base font-bold text-indigo-600">
                              ${createdItems.reduce((sum, item) => sum + (item.quantity * item.price), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">Products ({items.length})</h2>
                        <p className="text-sm text-slate-500">Items ordered from vendor</p>
                      </div>
                    </div>
                    
                    <PurchaseItemsTable
                      items={items}
                      untaxedAmount={activeOrder?.totalAmount || 0}
                      taxRate={0}
                      taxAmount={0}
                      total={activeOrder?.totalAmount || 0}
                      onAddProduct={handleAddProduct}
                    />
                  </div>
                )}

                <AdditionalNotes
                  notes={notes}
                  onNotesChange={setNotes}
                />
              </div>

              {/* Right sidebar */}
              <div className="w-72 shrink-0">
                {activeOrder ? (
                  <OrderHistory 
                    history={auditLogs.map((log: any, idx: number) => ({
                      id: log._id || String(idx),
                      type: log.action === 'Created' ? 'created' : 'updated',
                      label: log.action,
                      description: log.fieldChanged ? `Changed ${log.fieldChanged} from "${log.oldValue}" to "${log.newValue}"` : `Order was ${log.action.toLowerCase()}`,
                      date: new Date(log.createdAt).toLocaleDateString()
                    }))} 
                    onViewLogs={() => onNavigate('audit-logs')}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-950 mb-3">Order Information</h3>
                    <p className="text-xs text-slate-500">This Purchase Order is currently in draft mode. Click Save Record to create the order.</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
