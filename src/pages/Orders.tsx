import { useEffect, useMemo, useState } from 'react';
import {
  FileText, Search, Eye, Calendar, User,
  Receipt, Download, Printer,
  X, Loader2
} from 'lucide-react';
import { SalesOrderService } from '../api/services/salesOrderService';
import { SalesOrderItemService } from '../api/services/salesOrderItemService';
import { type SalesOrder, type SalesOrderItem } from '../types/app';

const formatMoney = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const getDueInfo = (dueDate: string) => {
  const due = new Date(dueDate);
  const today = new Date();
  const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return `Overdue ${Math.abs(days)}d`;
  }
  return `${days} days left`;
};

export default function OrderHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [orderItems, setOrderItems] = useState<SalesOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderRes, itemRes] = await Promise.all([
        SalesOrderService.getAll(),
        SalesOrderItemService.getAll(),
      ]);
      setOrders(orderRes.data || []);
      setOrderItems(itemRes.data || []);
    } catch (error) {
      console.error('Failed to fetch order history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) =>
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, orders]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const selectedOrderItems = useMemo(() => {
    if (!selectedOrder) {
      return [];
    }
    return orderItems.filter((item) => item.sales_order_id === selectedOrder.id);
  }, [orderItems, selectedOrder]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Sales History...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sales History</h1>
          <p className="text-sm text-slate-500 font-medium">View and manage customer invoices</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => {
                const dueDate = order.due_date || order.order_date;
                return (
                  <tr
                    key={order.id}
                    className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                    onClick={() => setSelectedOrderId(order.id)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Receipt size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{order.order_number}</div>
                          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <Calendar size={10} /> {new Date(order.order_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <User size={14} className="text-slate-300" /> {order.customer_name || 'Unknown Customer'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-slate-800">{formatMoney(Number(order.total_amount || 0))}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-xs font-bold text-slate-600">{new Date(dueDate).toLocaleDateString()}</div>
                      <div className="text-[9px] font-black text-amber-600 uppercase">{getDueInfo(dueDate)}</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-300 group-hover:text-emerald-600 transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end p-0 md:p-4">
          <div className="bg-white h-full md:h-[95vh] w-full max-w-5xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{selectedOrder.order_number}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Invoice Details • {new Date(selectedOrder.order_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 hover:bg-white text-slate-400 hover:text-emerald-600 transition-all">
                  <Printer size={20} />
                </button>
                <button onClick={() => setSelectedOrderId(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Name</span>
                  <h4 className="text-lg font-bold text-slate-800">{selectedOrder.customer_name || 'Unknown Customer'}</h4>
                </div>
                <div className="text-right space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Due Date</span>
                    <div className="text-sm font-bold text-slate-800">{new Date(selectedOrder.due_date || selectedOrder.order_date).toLocaleDateString()}</div>
                    <div className="text-[9px] font-black text-amber-600 uppercase">{getDueInfo(selectedOrder.due_date || selectedOrder.order_date)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Payable</span>
                    <div className="text-2xl font-black text-emerald-600">{formatMoney(Number(selectedOrder.total_amount || 0))}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Batch/Exp</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tax (S+C)</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{item.product_name || item.product_master_name || '-'}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {item.pack || '-'} • HSN {item.hsn || '-'} • MRP ₹{Number(item.mrp || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs font-bold text-slate-600">{item.batch_no || '-'}</div>
                          <div className="text-[9px] text-amber-600 font-black">{item.expiry_date || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-black text-slate-800">{item.qty}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs font-bold text-slate-600">{item.sgst}% + {item.cgst}%</div>
                          <div className="text-[10px] text-slate-400 font-bold">@ ₹{item.rate}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-black text-emerald-600">₹{Number(item.line_amount || 0).toLocaleString('en-IN')}</div>
                        </td>
                      </tr>
                    ))}
                    {selectedOrderItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm font-medium">No line items found for this order.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t flex justify-end gap-3">
              <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
                <Download size={16} /> Export PDF
              </button>
              <button onClick={() => setSelectedOrderId(null)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
