import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Receipt, UserPlus,
  Package, ShoppingCart, Save, Loader2,
} from 'lucide-react';
import { CustomerService } from '../api/services/customerService';
import { InventoryService } from '../api/services/inventoryService';
import { SalesOrderService } from '../api/services/salesOrderService';
import { SalesOrderItemService } from '../api/services/salesOrderItemService';
import {
  type Customer,
  type InventoryBatch,
  type SalesOrderItemPayload,
  type SalesOrderPayload,
} from '../types/app';

interface BasketItem {
  id: string;
  inventoryBatchId: string;
  productId: string;
  productName: string;
  batch: string;
  expiry: string;
  pack: string;
  hsn: string;
  mrp: number;
  purchaseRate: number;
  sellingRate: number;
  quantity: number;
  sgst: number;
  cgst: number;
}

const getCustomerName = (customer: Customer) => customer.name;

export default function GenerateBill() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stock, setStock] = useState<InventoryBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [dueDate, setDueDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [customerRes, stockRes] = await Promise.all([
        CustomerService.getAll(),
        InventoryService.getAll(),
      ]);

      setCustomers(customerRes.data || []);
      setStock((stockRes.data || []).filter((s) => Number(s.qty || 0) > 0));
    } catch (error) {
      console.error('Failed to fetch billing data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStock = useMemo(() => {
    return stock.filter((item) =>
      (item.product_name || '').toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      item.batch_no.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      item.hsn.includes(stockSearchQuery),
    );
  }, [stockSearchQuery, stock]);

  const totals = useMemo(() => {
    const taxableValue = basket.reduce((acc, item) => acc + (item.sellingRate * item.quantity), 0);
    const sgstTotal = basket.reduce((acc, item) => acc + ((item.sellingRate * item.quantity) * (item.sgst / 100)), 0);
    const cgstTotal = basket.reduce((acc, item) => acc + ((item.sellingRate * item.quantity) * (item.cgst / 100)), 0);

    return {
      taxableValue,
      sgstTotal,
      cgstTotal,
      gstTotal: sgstTotal + cgstTotal,
      netPayable: taxableValue + sgstTotal + cgstTotal,
    };
  }, [basket]);

  const addToBasket = (stockItem: InventoryBatch) => {
    const exists = basket.find((item) => item.inventoryBatchId === stockItem.id);
    if (exists) {
      return;
    }

    const newItem: BasketItem = {
      id: `${Date.now()}_${stockItem.id}`,
      inventoryBatchId: stockItem.id,
      productId: stockItem.product_id,
      productName: stockItem.product_name || 'Unknown Product',
      batch: stockItem.batch_no,
      expiry: stockItem.expiry_date || '-',
      pack: stockItem.pack,
      hsn: stockItem.hsn,
      mrp: Number(stockItem.mrp || 0),
      purchaseRate: Number(stockItem.purchase_rate || 0),
      sellingRate: Number(stockItem.mrp || 0),
      quantity: 1,
      sgst: Number(stockItem.sgst || 0),
      cgst: Number(stockItem.cgst || 0),
    };

    setBasket((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, field: keyof BasketItem, value: number) => {
    setBasket((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    setBasket((prev) => prev.filter((i) => i.id !== id));
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const suffix = Date.now().toString().slice(-6);
    return `SO/${year}/${suffix}`;
  };

  const handleSaveOrder = async () => {
    if (!selectedCustomerId || !dueDate || basket.length === 0) {
      return;
    }

    // Validate quantity against available stock
    for (const item of basket) {
      const stockItem = stock.find((s) => s.id === item.inventoryBatchId);
      const availableQty = Number(stockItem?.qty || 0);
      if (item.quantity <= 0) {
        alert(`Quantity should be greater than 0 for ${item.productName}`);
        return;
      }
      if (item.quantity > availableQty) {
        alert(`Insufficient stock for ${item.productName}. Available: ${availableQty}`);
        return;
      }
    }

    setSaving(true);
    try {
      const orderPayload: SalesOrderPayload = {
        orderNumber: generateOrderNumber(),
        customerId: selectedCustomerId,
        orderDate: new Date().toISOString().split('T')[0],
        dueDate,
        taxableValue: Number(totals.taxableValue.toFixed(2)),
        sgstTotal: Number(totals.sgstTotal.toFixed(2)),
        cgstTotal: Number(totals.cgstTotal.toFixed(2)),
        totalAmount: Number(totals.netPayable.toFixed(2)),
        paymentStatus: 'PENDING',
      };

      const orderRes = await SalesOrderService.create(orderPayload);
      const salesOrderId = orderRes.data?.id;

      if (!salesOrderId) {
        throw new Error('Order creation failed');
      }

      const itemPayloads: SalesOrderItemPayload[] = basket.map((item) => {
        const lineBase = item.sellingRate * item.quantity;
        const lineTax = lineBase * ((item.sgst + item.cgst) / 100);
        return {
          salesOrderId,
          inventoryBatchId: item.inventoryBatchId,
          productId: item.productId,
          productName: item.productName,
          batchNo: item.batch,
          expiryDate: item.expiry === '-' ? null : item.expiry,
          pack: item.pack,
          hsn: item.hsn,
          qty: item.quantity,
          mrp: item.mrp,
          rate: item.sellingRate,
          sgst: item.sgst,
          cgst: item.cgst,
          lineAmount: Number((lineBase + lineTax).toFixed(2)),
        };
      });

      await Promise.all(itemPayloads.map((payload) => SalesOrderItemService.create(payload)));

      // Decrement stock in inventory batches
      await Promise.all(
        basket.map(async (item) => {
          const stockItem = stock.find((s) => s.id === item.inventoryBatchId);
          const availableQty = Number(stockItem?.qty || 0);
          const newQty = Math.max(0, availableQty - item.quantity);
          await InventoryService.update(item.inventoryBatchId, { qty: newQty });
        }),
      );

      alert('Order saved successfully');
      setBasket([]);
      setSelectedCustomerId('');
      setDueDate('');
      setStockSearchQuery('');
      await loadData();
    } catch (error) {
      alert(`Error saving order: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Billing Data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        <div className="bg-white p-5 rounded-4xl border border-slate-100 shadow-sm shrink-0">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Billing To</label>
          <div className="relative">
            <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
            <select
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">Choose Customer...</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{getCustomerName(c)}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white p-5 rounded-4xl border border-slate-100 shadow-sm shrink-0">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Payment Due Date</label>
          <div className="relative">
            <input
              type="date"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div className="bg-white flex-1 rounded-4xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-50 bg-slate-50/30">
            <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2 mb-4">
              <Package size={18} className="text-blue-500" /> Inventory Selector
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search Product, Batch or HSN..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
            {filteredStock.map((item) => (
              <button
                key={item.id}
                onClick={() => addToBasket(item)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group text-left"
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{item.product_name || 'Unknown Product'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded border border-slate-100">Batch {item.batch_no}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Exp {item.expiry_date || '-'}</span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div>
                    <div className="text-xs font-black text-slate-700">{item.qty}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Stock</div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Plus size={16} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[55%] bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <Receipt size={20} className="text-emerald-400" />
            <h2 className="font-black tracking-tight uppercase text-xs">Live Invoice Generation</h2>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold">INV-{Date.now().toString().slice(-4)}</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 text-[10px] font-black text-slate-400 uppercase pl-2">Description</th>
                <th className="py-3 text-[10px] font-black text-slate-400 uppercase text-center w-20">Qty</th>
                <th className="py-3 text-[10px] font-black text-slate-400 uppercase text-center w-24">Sell Rate</th>
                <th className="py-3 text-[10px] font-black text-slate-400 uppercase text-right w-24 pr-2">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {basket.map((item) => (
                <tr key={item.id} className="group animate-in slide-in-from-right-2">
                  <td className="py-4 pl-2">
                    <div className="font-bold text-slate-800 text-xs">{item.productName}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{item.batch} • {item.sgst + item.cgst}% GST</div>
                  </td>
                  <td className="py-4">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full p-2 bg-slate-100 rounded-xl text-center font-black text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.sellingRate}
                      onChange={(e) => updateItem(item.id, 'sellingRate', Number(e.target.value))}
                      className="w-full p-2 bg-blue-50 border border-blue-100 rounded-xl text-center font-bold text-xs outline-none"
                    />
                  </td>
                  <td className="py-4 text-right pr-2">
                    <div className="text-xs font-black text-slate-800">₹{(item.sellingRate * item.quantity).toFixed(2)}</div>
                    <button onClick={() => removeItem(item.id)} className="text-[9px] text-rose-500 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {basket.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-300">
              <ShoppingCart size={48} className="mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest">No Items Added</p>
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-tighter">
              <span>Taxable Value (Base)</span>
              <span>₹{totals.taxableValue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[11px] font-bold text-blue-600/70 italic">
              <span>SGST Total</span>
              <span>+ ₹{totals.sgstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-blue-600/70 italic">
              <span>CGST Total</span>
              <span>+ ₹{totals.cgstTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200">
              <span className="font-black text-slate-800 text-sm uppercase">Amount Payable</span>
              <span className="text-3xl font-black text-emerald-600 tracking-tighter">₹{totals.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <button
            onClick={handleSaveOrder}
            disabled={saving || basket.length === 0 || !selectedCustomerId || !dueDate}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} CONFIRM & SAVE ORDER
          </button>
        </div>
      </div>
    </div>
  );
}
