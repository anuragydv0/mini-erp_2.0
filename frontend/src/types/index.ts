import type { LucideIcon } from 'lucide-react'

export type PageId =
  | 'dashboard'
  | 'products'
  | 'product-detail'
  | 'sales'
  | 'sales-order-detail'
  | 'sales-order-create'
  | 'purchase'
  | 'purchase-order-detail'
  | 'manufacturing'
  | 'mo-form'
  | 'bom'
  | 'bom-detail'
  | 'audit-logs'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'stock-ledger'
  | 'audit-logs'
  | 'audit-logs'
  | 'audit-logs'
  | 'user-management'
  | 'user-management-detail'
  | 'inventory'

export interface PageProps {
  activePage: PageId
  onNavigate: (pageId: PageId) => void
}

export interface NavItem {
  id: PageId
  label: string
  icon: LucideIcon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export type HeaderTab = 'overview' | 'reports' | 'analytics'

export type TrendDirection = 'up' | 'down' | 'neutral'

export interface StatCardData {
  id: string
  label: string
  value: string
  trend: string
  trendDirection: TrendDirection
  icon: LucideIcon
  iconBg: string
  iconColor: string
  variant?: 'default' | 'alert'
}

export interface ChartDataPoint {
  day: string
  base: number
  top: number
}

export type ChartPeriod = 'weekly' | 'monthly'

export interface PendingOrder {
  id: string
  customer: string
  items: string
  total: string
  status: 'Processing' | 'Pending' | 'Shipped'
}

export type AlertSeverity = 'critical' | 'delayed'

export interface StockAlert {
  id: string
  severity: AlertSeverity
  title: string
  message: string
}

export type ActivityType = 'sales' | 'manufacturing' | 'stock'

export interface ActivityItem {
  id: string
  type: ActivityType
  title: string
  time: string
}

export type OrderStatus =
  | 'Confirmed'
  | 'Draft'
  | 'Partially Delivered'
  | 'Delivered'
  | 'Cancelled'

export interface SalesOrder {
  id: string
  reference: string
  date: string
  customerName: string
  customerInitials: string
  customerColor: string
  total: number
  status: OrderStatus
}

export interface StatusOption {
  value: string
  label: string
}

export interface DateRangeOption {
  value: string
  label: string
}

export type WorkCenterStatus = 'RUNNING' | 'HIGH LOAD' | 'IDLE'

export type ViewMode = 'board' | 'list'

export type KanbanColumnId = 'draft' | 'planned' | 'in-progress'

export interface WorkCenter {
  id: string
  name: string
  loadPercent: number
  status: WorkCenterStatus
  barColor: string
  badgeClass: string
}

export interface ManufacturingOrder {
  id: string
  reference: string
  title: string
  bom: string
  quantity: number
  columnId: KanbanColumnId
  assigneeInitials?: string
  assigneeColor?: string
  badge?: string
  badgeClass?: string
  workCenter?: string
  progress?: number
  timeRemaining?: string
  hasWarning?: boolean
  hasCheck?: boolean
  hasInfo?: boolean
  featured?: boolean
}

export interface KanbanColumnData {
  id: KanbanColumnId
  title: string
  iconColor: string
  countBadgeClass: string
  columnBorder?: string
  orders: ManufacturingOrder[]
}

// --- Sales Order Detail Types ---

export type TimelineStatus = 'completed' | 'current' | 'pending'

export interface LineItem {
  id: string
  product: string
  orderedQty: number
  deliveredQty: number
  costPrice: number
  salesPrice: number
  total: number
}

export interface TimelineStep {
  id: string
  label: string
  description: string
  status: TimelineStatus
}

export interface RecentActivityItem {
  id: string
  title: string
  description: string
}

export type OrderDetailStatus = 'Draft' | 'Confirmed' | 'Cancelled' | 'Delivered'

export interface SalesOrderDetail {
  id: string
  reference: string
  status: OrderDetailStatus
  customerName: string
  billingAddress: string
  orderDate: string
  salesPerson: string
  lineItems: LineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  timeline: TimelineStep[]
  recentActivity: RecentActivityItem[]
}

// --- Products Page Types ---

export type ProductStatus = 'In Stock' | 'Low Stock' | 'Internal Use' | 'Out of Stock'

export interface Product {
  id: string
  reference: string
  name: string
  version?: string
  category: string
  sku: string
  salesPrice: number
  costPrice: number
  onHand: number
  freeToUse: number
  status: ProductStatus
  imageBg: string
  imageIcon: LucideIcon
  procureOnDemand?: boolean
  procurementType?: 'Purchase' | 'Manufacturing'
  vendor?: string
  bom?: string
  imageUrl?: string
}

export interface ProductStatCardData {
  id: string
  label: string
  value: string
  subValue: string
  subValueClass: string
  variant: 'default' | 'critical' | 'money' | 'efficiency'
}

export interface ActiveFilter {
  id: string
  label: string
  values: string[]
}

// --- Sales Order Create Types ---

export interface CreateLineItem {
  id: string
  rowNum: number
  product: string
  sku: string
  orderedQty: number
  deliveredQty: number
  unitPrice: number
  total: number
}

export interface AssignedUser {
  name: string
  initials: string
  role: string
}

export interface SalesOrderCreateData {
  reference: string
  status: 'Draft' | 'Confirmed' | 'Cancelled'
  customerName: string
  orderDate: string
  billingAddress: string
  assignedUser: AssignedUser
  stockReadiness: number
  stockReadinessTrend: string
  lineItems: CreateLineItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  attachmentCount: number
}

// --- Product Detail Types ---

export interface ProductLog {
  id: string
  title: string
  detail: string
  time: string
}

export interface RecordMetadata {
  lifecycle: string
  lastAudit: string
  createdBy: string
  inventoryHealth: number
  healthDescription: string
}

export interface InventoryBreakdownItem {
  label: string
  value: string
  isPositive?: boolean
}

export interface InventoryCard {
  label: string
  value: string
  unit: string
  valueColor: string
  breakdown: InventoryBreakdownItem[]
  hasInfo?: boolean
}

export interface ProcurementConfig {
  procureOnDemand?: boolean
  procurementType?: 'Purchase' | 'Manufacturing'
  vendor?: string
  bom?: string
  vendorOptions: string[]
  bomOptions?: string[]
  isActive?: boolean
  route?: string
  routeOptions?: string[]
}

export interface ProductDetailData {
  reference: string
  productName: string
  salesPrice: number
  costPrice: number
  isDraft: boolean
  inventory: InventoryCard[]
  procurement: ProcurementConfig
  record: RecordMetadata
  logs: ProductLog[]
  productImagePath: string
}

// --- Purchase / Vendor Hub Types ---

export type VendorCategory = 'Manufacturing' | 'Logistics' | 'Raw Material' | 'Technology' | 'Services'

export interface Vendor {
  id: string
  name: string
  code: string
  initials: string
  initialsBg: string
  contactPerson: string
  email: string
  phone: string
  category: VendorCategory
}

export interface VendorStatCardData {
  id: string
  label: string
  value: string
  sub: string
  subClass: string
  iconClass: string
}

export interface VendorMetric {
  label: string
  value: string
  sub: string
  valueClass: string
}

export interface VendorActivityItem {
  id: string
  text: string
  detail: string
  dotColor: string
}

// --- Purchase Order Detail Types ---

export interface PurchaseItem {
  id: string
  product: string
  sku: string
  ordered: number
  received: number
  uom: string
  unitPrice: number
  subtotal: number
  iconBg: string
}

export type POHistoryType = 'created' | 'updated' | 'notification'

export interface PurchaseOrderHistoryItem {
  id: string
  type: POHistoryType
  label: string
  description: string
  date: string
}

export interface PurchaseOrderData {
  reference: string
  status: 'Draft' | 'Confirmed' | 'Cancelled'
  vendorName: string
  vendorCode: string
  vendorAddress: string
  responsiblePerson: string
  responsibleRole: string
  items: PurchaseItem[]
  untaxedAmount: number
  taxRate: number
  taxAmount: number
  total: number
  history: PurchaseOrderHistoryItem[]
}

// --- Manufacturing Order Form Types ---

export type MOStatus = 'Draft' | 'Confirmed' | 'In Progress' | 'Done' | 'Cancelled'

export type ComponentStatus = 'Available' | 'Not Available' | 'Partially Available'

export interface MOComponent {
  id: string
  product: string
  description: string
  quantity: number
  uom: string
  status: ComponentStatus
}

export type WOStatus = 'Pending' | 'Ready' | 'In Progress' | 'Finished'

export interface MOWorkOrderEntry {
  id: string
  workCenter: string
  operation: string
  expectedDuration: string
  realDuration: string
  status: WOStatus
}

export interface MOFormData {
  reference: string
  status: MOStatus
  finishedProduct: string
  billOfMaterials: string
  quantityToProduce: number
  uom: string
  responsible: string
  deadline: string
  scheduledDate: string
  sourceDocument: string
  components: MOComponent[]
  workOrders: MOWorkOrderEntry[]
  availability: 'available' | 'partial' | 'unavailable'
  consumedQty: number
  producedQty: number
  notes: string
}

// --- BOM Types ---

export type BOMStatus = 'Active' | 'Draft' | 'Archived'

export interface BOMListItem {
  id: string
  reference: string
  product: string
  productCode: string
  quantity: number
  uom: string
  componentCount: number
  operationCount: number
  status: BOMStatus
  lastModified: string
  createdBy: string
}

export interface BOMComponent {
  id: string
  product: string
  description: string
  quantity: number
  uom: string
  cost: number
}

export interface BOMOperation {
  id: string
  workCenter: string
  operation: string
  duration: string
  description: string
}

export interface BOMDetailData {
  reference: string
  status: BOMStatus
  finishedProduct: string
  quantity: number
  uom: string
  notes: string
  components: BOMComponent[]
  operations: BOMOperation[]
  createdBy: string
  createdDate: string
  lastModified: string
  auditLogs: { id: string; action: string; user: string; date: string }[]
}

// --- Audit Logs Types ---

export interface AuditLogEntry {
  id: string
  dateTime: string
  user: string
  module: string
  recordType: string
  recordId: string
  action: 'Created' | 'Updated' | 'Deleted'
  fieldChanged: string | '-'
  oldValue: string | '-'
  newValue: string | '-'
}

export * from '@/types/auth'

// --- Dashboard Redesign Types ---

export interface StatusCount {
  label: string
  count: number
  isActive?: boolean
}

export interface ModuleMetrics {
  title: string
  all: StatusCount[]
  my: StatusCount[]
}

export interface UserProfile {
  name: string
  address: string
  mobile: string
  email: string
  position: string
  avatarUrl?: string
}

// --- User Management Types ---

export type PermissionValue = 'yes' | 'no' | string

export interface FieldPermission {
  field: string
  create: PermissionValue
  view: PermissionValue
  edit: PermissionValue
  delete: PermissionValue
}

export interface ModulePermissions {
  sales: FieldPermission[]
  purchase: FieldPermission[]
  manufacturing: FieldPermission[]
  product: FieldPermission[]
}

export interface SystemUser {
  id: string
  name: string
  address: string
  mobile: string
  email: string
  position: string
  avatarUrl?: string
  permissions: ModulePermissions
}

