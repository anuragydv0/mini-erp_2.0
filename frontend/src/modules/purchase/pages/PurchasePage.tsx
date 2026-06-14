import { useState, useEffect, useMemo } from 'react'
import ErpSidebar from '@/components/layout/ErpSidebar'
import PurchaseHeader from '@/modules/purchase/components/PurchaseHeader'
import VendorStatCards from '@/modules/purchase/components/VendorStatCards'
import VendorDirectory from '@/modules/purchase/components/VendorDirectory'
import VendorIntelligence from '@/modules/purchase/components/VendorIntelligence'
import VendorActivity from '@/modules/purchase/components/VendorActivity'
import SupplierHeatmap from '@/modules/purchase/components/SupplierHeatmap'
import Pagination from '@/modules/purchase/components/PurchasePagination'
import { toast } from 'react-hot-toast'
import { erpNavItems, erpFooterNavItems } from '@/constants/navigation'
import { useErp } from '@/context/ErpContext'
import type { PageProps, Vendor, VendorStatCardData, VendorMetric, VendorActivityItem } from '@/types'
import apiClient from '@/api/client'
import { useAuth } from '@/context/AuthContext'

const PAGE_SIZE = 5

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const getInitialsBg = (name: string) => {
  const colors = ['bg-indigo-600', 'bg-blue-600', 'bg-purple-600', 'bg-teal-600', 'bg-emerald-600', 'bg-rose-600', 'bg-orange-600'];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
}

const mapVendor = (v: any): Vendor => {
  return {
    id: v._id,
    name: v.name,
    code: v.code || `VEN-${v._id.slice(-4).toUpperCase()}`,
    initials: getInitials(v.name),
    initialsBg: getInitialsBg(v.name),
    contactPerson: v.responsible_person || 'N/A',
    email: v.email || 'N/A',
    phone: v.phone || 'N/A',
    category: (v.category || 'Raw Material') as any,
  }
}

export default function PurchasePage({ activePage, onNavigate }: PageProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [vendors, setVendors] = useState<Vendor[]>([])

  const { purchaseOrders, setActiveOrderId } = useErp()

  useEffect(() => {
    const fetchVendorsData = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/vendors')
        const mappedVendors = ((response as any) || []).map((v: any) => mapVendor(v))
        setVendors(mappedVendors)
        if (mappedVendors.length > 0) {
          setSelectedVendorId(mappedVendors[0].id)
        }
      } catch (err: any) {
        toast.error('Failed to load vendors')
      } finally {
        setLoading(false)
      }
    }
    fetchVendorsData()
  }, [])

  const handleButtonClick = () => {
    toast('Action triggered')
  }

  const handleNewRecord = () => {
    setActiveOrderId(null)
    localStorage.removeItem('create_po_vendor_id')
    onNavigate('purchase-order-detail')
  }

  const handleIssuePO = () => {
    setActiveOrderId(null)
    if (selectedVendorId) {
      localStorage.setItem('create_po_vendor_id', selectedVendorId)
    } else {
      localStorage.removeItem('create_po_vendor_id')
    }
    onNavigate('purchase-order-detail')
  }

  const filteredVendors = useMemo(() => {
    if (searchQuery === '') return vendors
    const query = searchQuery.toLowerCase()
    return vendors.filter(
      (v: any) =>
        v.name.toLowerCase().includes(query) ||
        v.code.toLowerCase().includes(query) ||
        v.contactPerson.toLowerCase().includes(query) ||
        v.category.toLowerCase().includes(query),
    )
  }, [searchQuery, vendors])

  const selectedVendor = vendors.find((v: any) => v.id === selectedVendorId)
  const vendorDisplayName = selectedVendor?.name ?? 'No Vendor Selected'

  const totalPages = Math.max(1, Math.ceil(purchaseOrders.length / PAGE_SIZE))

  const vendorStatCards = useMemo((): VendorStatCardData[] => {
    const activeSuppliersCount = vendors.length
    const openPOsCount = purchaseOrders.filter(po => ['Draft', 'Confirmed', 'Partially Received', 'Partially Processed'].includes(po.status)).length
    
    return [
      { id: '1', label: 'Active Suppliers', value: String(activeSuppliersCount), sub: 'Verified partners', subClass: 'text-green-600', iconClass: 'bg-indigo-50 text-indigo-600' },
      { id: '2', label: 'Open POs', value: String(openPOsCount), sub: 'Awaiting fulfillment', subClass: 'text-amber-600', iconClass: 'bg-indigo-50 text-indigo-600' },
      { id: '3', label: 'Avg Lead Time', value: '4.2 Days', sub: '-0.5 days from last month', subClass: 'text-green-600', iconClass: 'bg-indigo-50 text-indigo-600' },
      { id: '4', label: 'Quality Rating', value: '98.5%', sub: 'Target: 95.0% minimum', subClass: 'text-green-600', iconClass: 'bg-indigo-50 text-indigo-600' },
    ]
  }, [vendors, purchaseOrders])

  const vendorMetrics = useMemo((): VendorMetric[] => {
    if (!selectedVendorId) return []
    return [
      { label: 'On-Time delivery', value: '97.2%', sub: 'Target: >95.0%', valueClass: 'text-green-600' },
      { label: 'Quality rate', value: '99.4%', sub: 'Target: >99.0%', valueClass: 'text-green-600' },
      { label: 'Open Orders', value: `${purchaseOrders.filter(po => po.vendorId === vendorDisplayName && ['Draft', 'Confirmed', 'Partially Received'].includes(po.status)).length} Orders`, sub: 'Fulfillment in progress', valueClass: 'text-slate-900' },
      { label: 'Spend YTD', value: `₹${(purchaseOrders.filter(po => po.vendorId === vendorDisplayName).reduce((acc, curr) => acc + curr.totalAmount, 0) / 1000).toFixed(1)}k`, sub: 'Total order value', valueClass: 'text-slate-900' },
    ]
  }, [selectedVendorId, purchaseOrders, vendorDisplayName])

  const vendorActivity = useMemo((): VendorActivityItem[] => {
    if (!selectedVendorId) return []
    const matchingPOs = purchaseOrders.filter(po => po.vendorId === vendorDisplayName)
    if (matchingPOs.length === 0) {
      return [
        { id: '1', text: 'No recent activity', detail: 'This vendor has no associated purchase orders yet.', dotColor: 'bg-slate-300' }
      ]
    }
    return matchingPOs.slice(0, 3).map((po, idx) => ({
      id: String(idx),
      text: `Order ${po.reference} ${po.status}`,
      detail: `Total value of ₹${po.totalAmount} was placed on ${new Date(po.createdAt).toLocaleDateString()}`,
      dotColor: po.status === 'Completed' ? 'bg-green-500' : (po.status === 'Cancelled' ? 'bg-rose-500' : 'bg-amber-500')
    }))
  }, [selectedVendorId, purchaseOrders, vendorDisplayName])

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <ErpSidebar
        navItems={erpNavItems}
        footerItems={erpFooterNavItems}
        activePage={activePage}
        onNavigate={onNavigate}
        onNewRecordClick={handleNewRecord}
        userName={user?.email ?? 'Admin'}
        userRole={String(user?.role ?? 'ADMIN')}
        userInitials={(user?.email ?? 'A').slice(0, 2).toUpperCase()}
      />

      <div className="ml-60 flex min-h-screen flex-col">
        <PurchaseHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onButtonClick={handleButtonClick}
        />

        <main className="flex-1 p-6">
          <VendorStatCards cards={vendorStatCards} />

          {/* Main content: Directory + Intelligence */}
          <div className="mb-6 flex gap-6">
            <div className="flex flex-[3] flex-col">
              <VendorDirectory
                vendors={filteredVendors}
                selectedVendorId={selectedVendorId}
                onVendorClick={setSelectedVendorId}
                loading={loading}
              />
              {!loading && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={purchaseOrders.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>

            <VendorIntelligence
              vendorName={vendorDisplayName}
              metrics={vendorMetrics}
              onIssuePO={handleIssuePO}
            />
          </div>

          {/* Bottom row: Activity + Heatmap */}
          <div className="flex gap-6">
            <VendorActivity activities={vendorActivity} />
            <SupplierHeatmap />
          </div>
        </main>
      </div>
    </div>
  )
}
