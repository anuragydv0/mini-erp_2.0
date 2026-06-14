import { useState, useEffect } from 'react'
import ErpSidebar from '@/components/layout/ErpSidebar'
import SalesOrderCreateHeader from '@/modules/sales/components/SalesOrderCreateHeader'
import SalesOrderBanner from '@/modules/sales/components/SalesOrderBanner'
import EntityInformation from '@/modules/sales/components/EntityInformation'
import InternalControl from '@/modules/sales/components/InternalControl'
import OrderHealth from '@/modules/sales/components/OrderHealth'
import AttachmentsPanel from '@/modules/sales/components/AttachmentsPanel'
import SalesLineItems from '@/modules/sales/components/SalesLineItems'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { erpNavItems, erpFooterNavItems } from '@/constants/navigation'
import type { PageProps, CreateLineItem, AssignedUser } from '@/types'
import { toast } from 'react-hot-toast'
import { useErp } from '@/context/ErpContext'

export default function SalesOrderCreatePage({
  onNavigate,
}: PageProps) {
  const { createSalesOrder, products } = useErp()
  const [loading, setLoading] = useState(false)
  const TAX_RATE = 18
  const customerOptions = ['Rahul Verma', 'Priya Sharma', 'Amit Patel', 'Sita Devi']
  const salesRepOptions = ['John Doe', 'Jane Smith', 'Mahesh Gupta']

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [assignedUser, setAssignedUser] = useState<AssignedUser>({
    name: 'John Doe',
    initials: 'JD',
    role: 'Account Executive',
  })
  const [lineItems, setLineItems] = useState<CreateLineItem[]>([])
  const [status, setStatus] = useState('Draft')
  const [billingAddress, setBillingAddress] = useState('')

  // Computed
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxAmount = subtotal * (TAX_RATE / 100)
  const total = subtotal + taxAmount

  const handleBack = () => {
    onNavigate('sales')
  }

  const handleCancel = () => {
    setStatus('Cancelled')
    toast.error('Order cancelled')
  }

  const handleDeliver = () => {
    toast.success('Deliver clicked')
  }

  const handleConfirm = async () => {
    if (!customerName) {
      toast.error('Customer name is required')
      return
    }
    if (lineItems.length === 0) {
      toast.error('At least one product is required')
      return
    }
    const invalidItem = lineItems.find(item => !item.sku)
    if (invalidItem) {
      toast.error('Please select a product for all rows')
      return
    }
    const invalidQty = lineItems.find(item => item.orderedQty <= 0)
    if (invalidQty) {
      toast.error('Ordered quantity must be greater than 0')
      return
    }

    const mappedItems = lineItems.map(item => ({
      productId: item.sku, // Actually stores product _id
      quantity: item.orderedQty,
      price: item.unitPrice
    }))
    try {
      setLoading(true)
      await createSalesOrder(customerName, mappedItems, billingAddress)
      onNavigate('sales')
    } catch (err) {
      // Error handled in context
    } finally {
      setLoading(false)
    }
  }

  const handleAssignedUserChange = (name: string) => {
    setAssignedUser({
      name,
      initials: name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2),
      role: 'Account Executive',
    })
  }

  const handleAddRow = () => {
    const newItem: CreateLineItem = {
      id: String(Date.now() + Math.random()),
      rowNum: lineItems.length + 1,
      product: '',
      sku: '',
      orderedQty: 1,
      deliveredQty: 0,
      unitPrice: 0,
      total: 0,
    }
    setLineItems([...lineItems, newItem])
    toast.success('Row added')
  }

  const handleDeleteRow = (id: string) => {
    setLineItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, idx) => ({ ...item, rowNum: idx + 1 })),
    )
    toast.error(`Row deleted`)
  }

  const handleChangeRow = (id: string, updatedFields: Partial<CreateLineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
    )
  }

  const handleButtonClick = () => {
    toast('Action triggered')
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <ErpSidebar
        navItems={erpNavItems}
        footerItems={erpFooterNavItems}
        activePage="sales"
        onNavigate={onNavigate}
        onNewRecordClick={handleButtonClick}
      />

      <div className="ml-60 flex min-h-screen flex-col">
        <SalesOrderCreateHeader
          reference={'SO-NEW'}
          status={status}
          onBack={handleBack}
          onCancel={handleCancel}
          onDeliver={handleDeliver}
          onConfirm={handleConfirm}
        />

        {loading ? (
          <LoadingSpinner className="mt-32" />
        ) : (
          <main className="flex-1 p-6">
            <SalesOrderBanner />

            <div className="flex gap-6">
              {/* Main form area */}
              <div className="min-w-0 flex-1">
                <EntityInformation
                  customerName={customerName}
                  orderDate={orderDate}
                  billingAddress={billingAddress}
                  customerOptions={customerOptions}
                  onCustomerChange={setCustomerName}
                  onDateChange={setOrderDate}
                  onAddressChange={setBillingAddress}
                />

                <SalesLineItems
                  items={lineItems}
                  products={products}
                  subtotal={subtotal}
                  taxRate={TAX_RATE}
                  taxAmount={taxAmount}
                  total={total}
                  onAddRow={handleAddRow}
                  onDeleteRow={handleDeleteRow}
                  onChangeRow={handleChangeRow}
                />
              </div>

              {/* Right sidebar panels */}
              <div className="w-64 shrink-0 space-y-4">
                <InternalControl
                  assignedUser={assignedUser}
                  salesRepOptions={salesRepOptions}
                  onAssignedUserChange={handleAssignedUserChange}
                />

                <OrderHealth
                  stockReadiness={100}
                  trend={'stable'}
                />

                <AttachmentsPanel
                  count={0}
                  onBrowse={handleButtonClick}
                />
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
