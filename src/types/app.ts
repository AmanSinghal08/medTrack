export type TabType = 'dashboard' | 'customers' | 'dealers' | 'brands' | 'products' | 'inventory' | 'billing';

export interface Customer {
  id: string;
  name: string;
  mobile_no?: string | null;
  mobileNo?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  current_balance?: number;
  currentBalance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerPayload {
  name: string;
  mobileNo: string;
  address?: string | null;
  city?: string | null;
  isActive?: boolean;
  currentBalance?: number;
}

export interface Dealer {
  id: string;
  contact_name?: string | null;
  contactName?: string | null;
  company_name?: string | null;
  companyName?: string | null;
  mobile_no?: string | null;
  mobileNo?: string | null;
  address?: string | null;
  city?: string | null;
  is_active?: boolean;
  isActive?: boolean;
  outstanding_balance?: number;
  outstandingBalance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DealerPayload {
  contactName: string;
  companyName: string;
  mobileNo: string;
  address?: string | null;
  city?: string | null;
  isActive?: boolean;
  outstandingBalance?: number;
}

export interface Brand {
  id: string;
  name: string;
  company_name?: string | null;
  companyName?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface BrandPayload {
  name: string;
  companyName: string;
}

export interface PurchaseOrder {
  id: string;
  purchase_order_number: string;
  dealer_id?: string | null;
  dealer_company_name?: string | null;
  dealer_contact_name?: string | null;
  order_date?: string;
  due_date?: string | null;
  total_amount?: number;
  payment_status?: string;
}

export interface PurchaseOrderPayload {
  purchaseOrderNumber: string;
  dealerId?: string | null;
  orderDate: string;
  dueDate?: string | null;
  totalAmount?: number;
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  notes?: string | null;
}

export interface Product {
  id: string;
  name: string;
  brand_id: string | null;
  product_type: string; // syrup, tablet, capsule, etc.
  hsn: string;
  pack: string; // e.g. 10x10, 100ml
  brand_name?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPayload {
  name: string;
  brand_id?: string | null;
  product_type: string;
  hsn: string;
  pack: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  batch: string;
  expiry: string;
  qty: number;
  mrp: number;
  dis: number;
  sgst: number;
  cgst: number;
  hsn: string;
}

export interface InventoryBatch {
  id: string;
  product_id: string;
  dealer_id?: string | null;
  purchase_order_id?: string | null;
  batch_no: string;
  expiry_date?: string | null;
  hsn: string;
  pack: string;
  qty: number;
  mrp: number;
  purchase_rate: number;
  sgst: number;
  cgst: number;
  total_purchase_amount: number;
  product_name?: string;
  dealer_company_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InventoryBatchPayload {
  productId: string;
  dealerId?: string | null;
  purchaseOrderId?: string | null;
  batchNo: string;
  expiryDate?: string | null;
  hsn: string;
  pack: string;
  qty: number;
  mrp: number;
  purchaseRate: number;
  sgst?: number;
  cgst?: number;
  totalPurchaseAmount?: number;
}

export interface SaleItem {
  id: number;
  inventoryId: string;
  name: string;
  batch: string;
  price: number;
  mrp: number;
  saleQty: number;
}

export interface Sale {
  id: string;
  customerId: string;
  date: string;
  total: number;
  items: SaleItem[];
}

export interface SalesOrder {
  id: string;
  order_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  order_date: string;
  due_date?: string | null;
  total_amount: number;
  payment_status?: string;
}

export interface SalesOrderPayload {
  orderNumber: string;
  customerId?: string | null;
  orderDate: string;
  dueDate?: string | null;
  taxableValue?: number;
  sgstTotal?: number;
  cgstTotal?: number;
  totalAmount?: number;
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';
  notes?: string | null;
}

export interface SalesOrderItem {
  id: number;
  sales_order_id: string;
  inventory_batch_id?: string | null;
  product_id?: string | null;
  product_name: string;
  product_master_name?: string | null;
  batch_no?: string | null;
  expiry_date?: string | null;
  pack?: string | null;
  hsn?: string | null;
  qty: number;
  mrp: number;
  rate: number;
  sgst: number;
  cgst: number;
  line_amount: number;
}

export interface SalesOrderItemPayload {
  salesOrderId: string;
  inventoryBatchId?: string | null;
  productId?: string | null;
  productName: string;
  batchNo?: string | null;
  expiryDate?: string | null;
  pack?: string | null;
  hsn?: string | null;
  qty: number;
  mrp: number;
  rate: number;
  sgst?: number;
  cgst?: number;
  lineAmount?: number;
}

export interface CustomerCollection {
  id: string;
  sales_order_id: string;
  customer_id?: string | null;
  customer_name?: string | null;
  order_number?: string | null;
  payment_date: string;
  amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
  comment?: string | null;
  created_at?: string;
}

export interface CustomerCollectionPayload {
  salesOrderId: string;
  customerId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Cheque';
  comment?: string | null;
}

export interface DealerPayment {
  id: string;
  purchase_order_id: string;
  dealer_id?: string | null;
  payment_date: string;
  amount: number;
  payment_mode: 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank Transfer';
  comment?: string | null;
  purchase_order_number?: string | null;
  dealer_company_name?: string | null;
  created_at?: string;
}

export interface DealerPaymentPayload {
  purchaseOrderId: string;
  dealerId?: string | null;
  paymentDate: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank Transfer';
  comment?: string | null;
}

export interface AppData {
  customers: Customer[];
  dealers: Dealer[];
  brands: Brand[];
  products: Product[];
  inventory: InventoryItem[];
  sales: Sale[];
}

export interface IResponseData<T> {
  statusCode: number;
  status: string;
  data: T;           // This holds your actual database rows
  msg: string;       // "Product added successfully"
  msgCode?: string;  // "1005"
}
