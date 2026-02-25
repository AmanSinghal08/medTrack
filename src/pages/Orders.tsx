import { useState, useMemo } from 'react';
import { 
  FileText, Search, Eye, Calendar, User, 
  Receipt, Download, Printer, 
  X
} from 'lucide-react';

// --- Interfaces ---
interface OrderItem {
  productName: string;
  quantity: number;
  pack: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  rate: number; // Selling Rate for this specific customer
  sgst: number;
  cgst: number;
  amount: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  date: string;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // 1. Mock Data
  const [orders] = useState<Order[]>([
    {
      id: 'inv-101',
      orderNumber: 'INV/2024/001',
      customerName: 'Rahul Sharma',
      totalAmount: 4500.50,
      date: '2024-03-20',
      items: [
        { productName: 'Paracetamol 650', quantity: 10, pack: '15s', batch: 'BT99', expiry: '12/26', hsn: '3004', mrp: 45, rate: 38.50, sgst: 6, cgst: 6, amount: 431.20 },
        { productName: 'Amoxicillin 500', quantity: 5, pack: '10s', batch: 'AX22', expiry: '05/25', hsn: '3004', mrp: 120, rate: 105.00, sgst: 6, cgst: 6, amount: 588.00 },
      ]
    },
    {
      id: 'inv-102',
      orderNumber: 'INV/2024/002',
      customerName: 'City Hospital',
      totalAmount: 12400.00,
      date: '2024-03-21',
      items: [
        { productName: 'Dolo 650', quantity: 100, pack: '15s', batch: 'DL01', expiry: '01/27', hsn: '3004', mrp: 30, rate: 22.00, sgst: 6, cgst: 6, amount: 2464.00 },
      ]
    }
  ]);

  // 2. Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, orders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Sales History</h1>
          <p className="text-sm text-slate-500 font-medium">View and manage customer invoices</p>
        </div>
      </div>

      {/* Search Bar */}
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

      {/* Orders List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Details</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="group hover:bg-slate-50/80 transition-all cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Receipt size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Calendar size={10} /> {new Date(order.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <User size={14} className="text-slate-300" /> {order.customerName}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-black text-slate-800">
                      ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-slate-300 group-hover:text-emerald-600 transition-colors">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal/Slide-over */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end p-0 md:p-4">
          <div className="bg-white h-full md:h-[95vh] w-full max-w-5xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">{selectedOrder.orderNumber}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Invoice Details • {selectedOrder.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 hover:bg-white text-slate-400 hover:text-emerald-600 transition-all">
                  <Printer size={20}/>
                </button>
                <button onClick={() => setSelectedOrder(null)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-all">
                  <X size={20}/>
                </button>
              </div>
            </div>

            {/* Modal Content - Product Table */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="mb-6 flex justify-between items-end">
                 <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Name</span>
                    <h4 className="text-lg font-bold text-slate-800">{selectedOrder.customerName}</h4>
                 </div>
                 <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Payable</span>
                    <div className="text-2xl font-black text-emerald-600">₹{selectedOrder.totalAmount.toLocaleString()}</div>
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
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 text-sm">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            {item.pack} • HSN {item.hsn} • MRP ₹{item.mrp}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-xs font-bold text-slate-600">{item.batch}</div>
                          <div className="text-[9px] text-amber-600 font-black">{item.expiry}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-black text-slate-800">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs font-bold text-slate-600">{item.sgst}% + {item.cgst}%</div>
                          <div className="text-[10px] text-slate-400 font-bold">@ ₹{item.rate}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-black text-emerald-600">₹{item.amount.toLocaleString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-50/50 border-t flex justify-end gap-3">
               <button className="bg-white border border-slate-200 text-slate-600 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2">
                 <Download size={16} /> Export PDF
               </button>
               <button onClick={() => setSelectedOrder(null)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                 Close View
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}