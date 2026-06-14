import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import type { 
  ErpProduct, BillOfMaterial, SalesOrder, PurchaseOrder, 
  ManufacturingOrder, StockLedgerEntry 
} from '@/types/erp'
import { productApi } from '@/api/productApi'
import { salesApi } from '@/api/salesApi'
import { purchaseApi } from '@/api/purchaseApi'
import { manufacturingApi } from '@/api/manufacturingApi'
import { bomApi } from '@/api/bomApi'
import { inventoryApi } from '@/api/inventoryApi'

interface ErpContextType {
  products: ErpProduct[]
  boms: BillOfMaterial[]
  salesOrders: SalesOrder[]
  purchaseOrders: PurchaseOrder[]
  manufacturingOrders: ManufacturingOrder[]
  stockLedger: StockLedgerEntry[]
  
  isLoading: boolean
  error: string | null

  // UI State for simple routing without URL params
  activeOrderId: string | null
  setActiveOrderId: (id: string | null) => void
  
  // Actions
  createProduct: (data: Partial<ErpProduct>) => Promise<void>
  createSalesOrder: (customerName: string, items: {productId: string, quantity: string|number, price: number}[], customerAddress?: string) => Promise<void>
  confirmSalesOrder: (orderId: string) => Promise<void>
  deliverSalesOrder: (orderId: string) => Promise<void>
  confirmPurchaseOrder: (orderId: string) => Promise<void>
  receivePurchaseOrder: (orderId: string) => Promise<void>
  confirmManufacturingOrder: (orderId: string) => Promise<void>
  startManufacturingOrder: (orderId: string) => Promise<void>
  completeManufacturingOrder: (orderId: string) => Promise<void>
  cancelManufacturingOrder: (orderId: string) => Promise<void>
  createManufacturingOrder: (data: any) => Promise<void>
  refreshData: () => Promise<void>
}

const ErpContext = createContext<ErpContextType | undefined>(undefined)

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

const mapProduct = (p: any): ErpProduct => ({
  id: p._id,
  name: p.name,
  code: p.sku,
  salesPrice: p.sales_price,
  costPrice: p.cost_price,
  onHandQty: p.on_hand_qty,
  reservedQty: p.reserved_qty,
  freeToUseQty: Math.max(0, (p.on_hand_qty || 0) - (p.reserved_qty || 0)),
  procurementType: p.procurement_strategy || 'MTS',
  procurementMethod: p.procure_on_demand ? 'Manufacturing' : 'Purchase',
  vendorId: p.vendor_id?._id || p.vendor_id || undefined,
  imageUrl: p.image?.url || undefined,
})

const mapSalesOrder = (so: any): SalesOrder => ({
  id: so._id,
  reference: so.so_number,
  customerName: so.customer,
  status: so.status === 'Fully Delivered' ? 'Completed' : (so.status === 'Partially Delivered' ? 'Partially Processed' : so.status),
  items: (so.products || []).map((p: any, idx: number) => ({
    id: p._id || String(idx),
    productId: p.product_id?._id || p.product_id,
    quantity: p.ordered_quantity,
    price: p.sales_unit_price,
    deliveredQuantity: p.delivered_quantity || 0,
  })),
  totalAmount: so.products?.reduce((sum: number, p: any) => sum + ((p.ordered_quantity || 0) * (p.sales_unit_price || 0)), 0) || 0,
  createdAt: so.createdAt,
  billingAddress: so.customer_address || 'Billing Address Not Available',
} as any)

const mapPurchaseOrder = (po: any): PurchaseOrder => ({
  id: po._id,
  reference: po.po_number,
  vendorId: po.vendor_name || (po.vendor_id?.name || po.vendor_id),
  status: po.status === 'Fully Received' ? 'Completed' : (po.status === 'Partially Received' ? 'Partially Processed' : po.status),
  items: (po.products || []).map((p: any, idx: number) => ({
    id: p._id || String(idx),
    productId: p.product_id?._id || p.product_id,
    quantity: p.ordered_quantity,
    price: p.cost_price,
    receivedQuantity: p.received_quantity || 0,
  })),
  totalAmount: po.products?.reduce((sum: number, p: any) => sum + ((p.ordered_quantity || 0) * (p.cost_price || 0)), 0) || 0,
  createdAt: po.createdAt,
  vendorName: po.vendor_name,
  vendorAddress: po.vendor_address || 'Vendor Address',
  responsiblePerson: po.responsible_person || 'Purchase Representative',
} as any)

const mapManufacturingOrder = (mo: any): ManufacturingOrder => ({
  id: mo._id,
  reference: mo.mo_number,
  productId: mo.finished_product_id?._id || mo.finished_product_id,
  quantityToProduce: mo.quantity,
  status: mo.status === 'In Progress' ? 'Confirmed' : mo.status,
  bomId: mo.bom_id?._id || mo.bom_id || undefined,
  createdAt: mo.createdAt,
  // Attach raw collections for detail screens
  rawComponents: mo.components || [],
  rawOperations: mo.operations || [],
} as any)

const mapBom = (bom: any): BillOfMaterial => ({
  id: bom._id,
  reference: bom.bom_number,
  productId: bom.finished_product_id?._id || bom.finished_product_id,
  components: (bom.components || []).map((c: any) => ({
    productId: c.component_product_id?._id || c.component_product_id,
    quantity: c.to_consume_qty,
  })),
  rawOperations: bom.operations || [],
} as any)

const mapStockLedger = (item: any): StockLedgerEntry => ({
  id: item._id,
  date: item.createdAt,
  productId: item.product_id?._id || item.product_id,
  movementType: ['purchase_receipt', 'manufacturing_produce'].includes(item.transaction_type) || (item.transaction_type === 'manual_adjustment' && item.quantity > 0) ? 'In' : 'Out',
  quantity: Math.abs(item.quantity),
  balance: item.balance_after || 0,
  reference: item.notes || item.reference_type || 'Adjustment',
})

// ─── PROVIDER ─────────────────────────────────────────────────────────────────

export function ErpProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ErpProduct[]>([])
  const [boms, setBoms] = useState<BillOfMaterial[]>([])
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [manufacturingOrders, setManufacturingOrders] = useState<ManufacturingOrder[]>([])
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>([])

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [pRes, sRes, mRes, poRes, bRes, slRes] = await Promise.all([
        productApi.getProducts(),
        salesApi.getOrders(),
        manufacturingApi.getOrders(),
        purchaseApi.getOrders(),
        bomApi.getBoms(),
        inventoryApi.getStockLedger()
      ])

      setProducts((pRes?.data || pRes || []).map(mapProduct))
      setSalesOrders((sRes?.data || sRes || []).map(mapSalesOrder))
      setManufacturingOrders((mRes?.data || mRes || []).map(mapManufacturingOrder))
      setPurchaseOrders((poRes?.data || poRes || []).map(mapPurchaseOrder))
      setBoms((bRes?.data || bRes || []).map(mapBom))
      setStockLedger((slRes?.data || slRes || []).map(mapStockLedger))
    } catch (err: any) {
      console.error('Failed to fetch ERP data', err)
      setError(err.message || 'Failed to connect to backend')
      toast.error('Failed to load ERP data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const generateId = (prefix: string) => `${prefix}-${Math.floor(Math.random() * 10000)}`

  // --- ACTIONS ---

  const createProduct = async (data: Partial<ErpProduct>) => {
    try {
      const payload: any = {
        name: data.name,
        sku: data.code,
        sales_price: data.salesPrice || 0,
        cost_price: data.costPrice || 0,
        on_hand_qty: data.onHandQty || 0,
        reserved_qty: data.reservedQty || 0,
        procurement_strategy: data.procurementType || 'MTS',
        procure_on_demand: data.procurementMethod === 'Manufacturing' || false,
        vendor_id: data.vendorId || null,
        is_active: true,
        image: data.imageUrl ? { url: data.imageUrl } : undefined
      };
      
      if (!payload.sku) {
        payload.sku = generateId('PCODE');
      }

      if (data.id) {
        await productApi.updateProduct(data.id, payload);
        toast.success(`Product ${data.name} updated!`)
      } else {
        const newRawProduct = await productApi.createProduct(payload);
        const newProduct = mapProduct(newRawProduct);
        setProducts(prev => [newProduct, ...prev])
        toast.success(`Product ${newProduct.name} saved!`)
      }
      fetchData() // Refresh stock/levels
    } catch (err: any) {
      toast.error(err.message || 'Network Error')
      throw err
    }
  }

  const createSalesOrder = async (customerName: string, items: {productId: string, quantity: string|number, price: number}[], customerAddress?: string) => {
    const payload = {
      customer: customerName,
      customer_address: customerAddress,
      products: items.map(i => ({
        product_id: i.productId,
        ordered_quantity: Number(i.quantity),
        sales_unit_price: i.price
      }))
    }

    try {
      const newOrderRaw = await salesApi.createOrder(payload);
      const newOrder = mapSalesOrder(newOrderRaw);
      setSalesOrders(prev => [newOrder, ...prev])
      setActiveOrderId(newOrder.id)
      toast.success(`Sales Order ${newOrder.reference} created`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Network Error')
      throw err
    }
  }

  const confirmSalesOrder = async (orderId: string) => {
    try {
      await salesApi.confirmOrder(orderId);
      toast.success('Order confirmed')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm order')
    }
  }

  const deliverSalesOrder = async (orderId: string) => {
    try {
      const targetOrder = salesOrders.find(so => so.id === orderId)
      if (!targetOrder) throw new Error('Order not found')
      
      const payload = {
        products: targetOrder.items.map(item => ({
          product_id: item.productId,
          delivered_quantity: item.quantity
        }))
      }

      await salesApi.deliverOrder(orderId, payload);
      toast.success('Sales Order delivered.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to deliver order')
    }
  }

  const confirmPurchaseOrder = async (orderId: string) => {
    try {
      await purchaseApi.confirmOrder(orderId);
      toast.success('Purchase Order confirmed.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm')
    }
  }

  const receivePurchaseOrder = async (orderId: string) => {
    try {
      const targetOrder = purchaseOrders.find(po => po.id === orderId)
      if (!targetOrder) throw new Error('Order not found')

      const payload = {
        products: targetOrder.items.map(item => ({
          product_id: item.productId,
          received_quantity: item.quantity
        }))
      }

      await purchaseApi.receiveOrder(orderId, payload);
      toast.success('Purchase Order received.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to receive')
    }
  }

  const confirmManufacturingOrder = async (orderId: string) => {
    try {
      await manufacturingApi.confirmOrder(orderId);
      toast.success('Manufacturing Order confirmed.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm')
    }
  }

  const startManufacturingOrder = async (orderId: string) => {
    try {
      await manufacturingApi.startOrder(orderId);
      toast.success('Manufacturing Order started.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to start')
    }
  }

  const completeManufacturingOrder = async (orderId: string) => {
    try {
      await manufacturingApi.completeOrder(orderId);
      toast.success('Manufacturing Order completed.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete')
    }
  }

  const cancelManufacturingOrder = async (orderId: string) => {
    try {
      await manufacturingApi.cancelOrder(orderId);
      toast.success('Manufacturing Order cancelled.')
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel')
    }
  }

  const createManufacturingOrder = async (data: any) => {
    try {
      const newOrderRaw = await manufacturingApi.createOrder(data);
      const newOrder = mapManufacturingOrder(newOrderRaw);
      setManufacturingOrders(prev => [newOrder, ...prev])
      setActiveOrderId(newOrder.id)
      toast.success(`Manufacturing Order ${newOrder.reference} created`)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create Manufacturing Order')
      throw err
    }
  }

  return (
    <ErpContext.Provider value={{
      products, boms, salesOrders, purchaseOrders, manufacturingOrders, stockLedger,
      isLoading, error,
      activeOrderId, setActiveOrderId,
      createProduct,
      createSalesOrder, confirmSalesOrder, deliverSalesOrder, confirmPurchaseOrder, receivePurchaseOrder,
      confirmManufacturingOrder, startManufacturingOrder, completeManufacturingOrder,
      cancelManufacturingOrder, createManufacturingOrder,
      refreshData: fetchData,
    }}>
      {children}
    </ErpContext.Provider>
  )
}

export function useErp() {
  const context = useContext(ErpContext)
  if (context === undefined) {
    throw new Error('useErp must be used within an ErpProvider')
  }
  return context
}
