import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Clock, Edit2, Search, X, AlertTriangle, Landmark,
  Truck, Loader2, Trash2
} from 'lucide-react';
import { InventoryService } from '../api/services/inventoryService';
import { ProductService } from '../api/services/productService';
import { DealerService } from '../api/services/dealerService';
import { PurchaseOrderService } from '../api/services/purchaseOrderService';
import { type Dealer, type InventoryBatch, type InventoryBatchPayload, type Product, type PurchaseOrder, type PurchaseOrderPayload } from '../types/app';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

export default function StockManager() {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryBatch | null>(null);
  const [selectedDealerForEntry, setSelectedDealerForEntry] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState({
    purchaseOrderNumber: '',
    dealerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    totalAmount: '',
    paymentStatus: 'PENDING' as 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, productRes, dealerRes, purchaseOrderRes] = await Promise.all([
        InventoryService.getAll(),
        ProductService.getAll(),
        DealerService.getAll(),
        PurchaseOrderService.getAll(),
      ]);

      setInventory(inventoryRes.data || []);
      setProducts(productRes.data || []);
      setDealers(dealerRes.data || []);
      setPurchaseOrders(purchaseOrderRes.data || []);
    } catch (error) {
      console.error('Failed to fetch stock data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      const productName = (item.product_name || products.find((p) => p.id === item.product_id)?.name || '').toLowerCase();
      const batchNumber = item.batch_no.toLowerCase();
      const hsnNumber = item.hsn.toLowerCase();
      const dealerName = (item.dealer_company_name || dealers.find((d) => d.id === item.dealer_id)?.company_name || '').toLowerCase();
      const query = searchTerm.toLowerCase();

      const matchesSearch =
        productName.includes(query) ||
        batchNumber.includes(query) ||
        dealerName.includes(query) ||
        hsnNumber.includes(query);

      const matchesDropdown = productFilter === '' || item.product_id === productFilter;

      return matchesSearch && matchesDropdown;
    });
  }, [inventory, searchTerm, productFilter, products, dealers]);

  const purchaseOrdersForSelectedDealer = useMemo(() => {
    if (!selectedDealerForEntry) {
      return [];
    }
    return purchaseOrders.filter((po) => po.dealer_id === selectedDealerForEntry);
  }, [purchaseOrders, selectedDealerForEntry]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const qty = Number(data.qty);
    const purchaseRate = Number(data.purchaseRate);

    const payload: InventoryBatchPayload = {
      productId: data.productId as string,
      dealerId: (data.dealerId as string) || null,
      purchaseOrderId: (data.purchaseOrderId as string) || null,
      batchNo: data.batchNo as string,
      expiryDate: (data.expiryDate as string) || null,
      hsn: data.hsn as string,
      pack: data.pack as string,
      qty,
      mrp: Number(data.mrp),
      purchaseRate,
      sgst: Number(data.sgst || 0),
      cgst: Number(data.cgst || 0),
      totalPurchaseAmount: qty * purchaseRate,
    };

    try {
      if (editingItem) {
        await InventoryService.update(editingItem.id, payload);
      } else {
        await InventoryService.create(payload);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      alert('Error saving inventory: ' + error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this stock entry?')) {
      return;
    }

    try {
      await InventoryService.delete(id);
      setInventory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert('Error deleting inventory: ' + error);
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!purchaseOrderForm.purchaseOrderNumber || !purchaseOrderForm.orderDate) {
      return;
    }

    const payload: PurchaseOrderPayload = {
      purchaseOrderNumber: purchaseOrderForm.purchaseOrderNumber,
      dealerId: purchaseOrderForm.dealerId || null,
      orderDate: purchaseOrderForm.orderDate,
      dueDate: purchaseOrderForm.dueDate || null,
      totalAmount: purchaseOrderForm.totalAmount ? Number(purchaseOrderForm.totalAmount) : 0,
      paymentStatus: purchaseOrderForm.paymentStatus,
      notes: purchaseOrderForm.notes || null,
    };

    setCreatingOrder(true);
    try {
      await PurchaseOrderService.create(payload);
      setPurchaseOrderForm({
        purchaseOrderNumber: '',
        dealerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        totalAmount: '',
        paymentStatus: 'PENDING',
        notes: '',
      });
      const poRes = await PurchaseOrderService.getAll();
      setPurchaseOrders(poRes.data || []);
      alert('Dealer order created successfully');
    } catch (error) {
      alert(`Error creating dealer order: ${error}`);
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Stock...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-black text-slate-800">Create Dealer Order</h2>
            <p className="text-xs text-slate-500 font-medium">Add a purchase order entry for supplier billing</p>
          </div>
        </div>
        <form onSubmit={handleCreatePurchaseOrder} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">PO Number</label>
            <input
              value={purchaseOrderForm.purchaseOrderNumber}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, purchaseOrderNumber: e.target.value }))}
              required
              placeholder="PO/2026/001"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Dealer</label>
            <select
              value={purchaseOrderForm.dealerId}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, dealerId: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700"
            >
              <option value="">No Dealer</option>
              {dealers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company_name || d.companyName || d.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Order Date</label>
            <input
              type="date"
              value={purchaseOrderForm.orderDate}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, orderDate: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Due Date</label>
            <input
              type="date"
              value={purchaseOrderForm.dueDate}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Total Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={purchaseOrderForm.totalAmount}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, totalAmount: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Payment Status</label>
            <select
              value={purchaseOrderForm.paymentStatus}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, paymentStatus: e.target.value as 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED' }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700"
            >
              <option value="PENDING">PENDING</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="PAID">PAID</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Notes</label>
            <input
              value={purchaseOrderForm.notes}
              onChange={(e) => setPurchaseOrderForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-medium text-slate-700"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creatingOrder}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
            >
              {creatingOrder ? 'Creating...' : 'Create Dealer Order'}
            </button>
          </div>
        </form>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Stock & Purchase</h1>
          <p className="text-sm text-slate-500 font-medium">Manage inbound inventory and purchase costs</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setSelectedDealerForEntry('');
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={20} /> Add Purchase Entry
        </button>
      </div>

      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search product, batch or HSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all font-medium"
          />
        </div>
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold text-slate-600 cursor-pointer"
        >
          <option value="">All Products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item & Packaging</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch/Expiry</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier (Dealer)</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Rate</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => {
                const product = products.find((p) => p.id === item.product_id);
                const dealer = dealers.find((d) => d.id === item.dealer_id);
                const qty = Number(item.qty || 0);

                return (
                  <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800 text-sm">{item.product_name || product?.name || '-'}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        HSN {item.hsn} • {item.pack}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-slate-700">{item.batch_no}</div>
                      <div className="text-[10px] text-amber-600 font-black uppercase mt-1 flex items-center gap-1.5">
                        <Clock size={10} /> Exp {item.expiry_date || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Truck size={14} className="text-blue-400" />
                        {item.dealer_company_name || dealer?.company_name || dealer?.companyName || 'Unknown Dealer'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-blue-600">{formatCurrency(Number(item.purchase_rate || 0))}</div>
                      <div className="text-[10px] text-slate-400 font-bold">MRP: {formatCurrency(Number(item.mrp || 0))}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${qty < 20 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                        {qty < 20 && <AlertTriangle size={12} />}
                        <span className="text-sm font-black">{qty}</span>
                        <span className="text-[10px] font-bold uppercase">Units</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setSelectedDealerForEntry(item.dealer_id || '');
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                    No stock records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-blue-50/30">
              <div>
                <h3 className="font-black text-xl text-slate-800">
                  {editingItem ? 'Edit Purchase Entry' : 'New Stock Inbound'}
                </h3>
                <p className="text-xs text-blue-600/50 font-bold uppercase tracking-widest mt-1">Inventory Management</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Select Product</label>
                <select name="productId" defaultValue={editingItem?.product_id || ''} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700">
                  <option value="">Select Product...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Supplier (Dealer)</label>
                <select
                  name="dealerId"
                  value={selectedDealerForEntry}
                  onChange={(e) => setSelectedDealerForEntry(e.target.value)}
                  className="w-full px-5 py-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl font-bold text-blue-800"
                >
                  <option value="">Select Dealer...</option>
                  {dealers.map((d) => {
                    const label = d.company_name || d.companyName || d.id;
                    return <option key={d.id} value={d.id}>{label}</option>;
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Batch Number</label>
                <input name="batchNo" defaultValue={editingItem?.batch_no} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="e.g. BT-992" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Expiry Date</label>
                <input type="date" name="expiryDate" defaultValue={editingItem?.expiry_date || ''} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Inbound Quantity</label>
                <input type="number" min="0" name="qty" defaultValue={editingItem?.qty} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-black text-blue-600" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Pack Size</label>
                <input name="pack" defaultValue={editingItem?.pack} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="10x15" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">HSN</label>
                <input name="hsn" defaultValue={editingItem?.hsn} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="3004" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Purchase Order (Optional)</label>
                <select name="purchaseOrderId" defaultValue={editingItem?.purchase_order_id || ''} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700">
                  <option value="">No Purchase Order</option>
                  {purchaseOrdersForSelectedDealer.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.purchase_order_number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-4xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Purchase Rate</label>
                  <input type="number" step="0.01" min="0" name="purchaseRate" defaultValue={editingItem?.purchase_rate} required className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none font-black text-blue-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">MRP</label>
                  <input type="number" step="0.01" min="0" name="mrp" defaultValue={editingItem?.mrp} required className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none font-bold text-slate-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">SGST (%)</label>
                  <input type="number" min="0" step="0.01" name="sgst" defaultValue={editingItem?.sgst ?? 0} className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">CGST (%)</label>
                  <input type="number" min="0" step="0.01" name="cgst" defaultValue={editingItem?.cgst ?? 0} className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none" />
                </div>
              </div>

              <button type="submit" className="md:col-span-3 w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-3 tracking-widest uppercase text-xs">
                <Landmark size={18} /> Record Purchase Entry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
