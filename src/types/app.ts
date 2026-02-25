export type TabType = 'dashboard' | 'customers' | 'dealers' | 'brands' | 'products' | 'inventory' | 'billing';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface Dealer {
  id: string;
  name: string;
  company: string;
  phone: string;
  address: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  pack: string;
  type: string;
  hsn: string;
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

export interface AppData {
  customers: Customer[];
  dealers: Dealer[];
  brands: Brand[];
  products: Product[];
  inventory: InventoryItem[];
  sales: Sale[];
}
