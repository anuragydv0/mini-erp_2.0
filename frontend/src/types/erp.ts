export type ProcurementType = 'MTO' | 'MTS'
export type ProcurementMethod = 'Purchase' | 'Manufacturing'

export interface ErpProduct {
  id: string
  name: string
  code: string
  salesPrice: number
  costPrice: number
  onHandQty: number
  reservedQty: number
  freeToUseQty: number
  procurementType: ProcurementType
  procurementMethod: ProcurementMethod
  vendorId?: string
  imageUrl?: string
}

export type OrderStatus = 'Draft' | 'Confirmed' | 'Partially Processed' | 'Completed' | 'Cancelled'

export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
}

export interface SalesOrder {
  id: string
  reference: string
  customerName: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  createdAt: string
}

export interface PurchaseOrder {
  id: string
  reference: string
  vendorId: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  createdAt: string
}

export interface ManufacturingOrder {
  id: string
  reference: string
  productId: string
  quantityToProduce: number
  status: OrderStatus
  bomId?: string
  createdAt: string
}

export interface BomComponent {
  productId: string
  quantity: number
}

export interface BillOfMaterial {
  id: string
  reference: string
  productId: string
  components: BomComponent[]
}

export interface StockLedgerEntry {
  id: string
  date: string
  productId: string
  movementType: 'In' | 'Out'
  quantity: number
  balance: number
  reference: string // e.g., 'SO-001' or 'MO-002'
}
