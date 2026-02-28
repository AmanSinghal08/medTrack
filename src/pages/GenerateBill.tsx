import { useState, useMemo } from 'react';
import { 
  Plus, Search, Receipt, UserPlus, 
  Package, ShoppingCart, Save,
} from 'lucide-react';

// --- Interfaces ---
interface BasketItem {
  id: string;
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
  amount: number;
}

export default function GenerateBill() {
  // 1. Data States
  const [customers] = useState([{ id: 'c1', name: 'Rahul Sharma' }, { id: 'c2', name: 'City Hospital' }]);
  const [stock] = useState([
    { id: 's1', productId: 'p1', name: 'Paracetamol 650', batch: 'BT99', expiry: '12/26', pack: '15s', hsn: '3004', mrp: 45, purchaseRate: 28.50, qty: 500 },
    { id: 's2', productId: 'p2', name: 'Amoxicillin 500', batch: 'AX22', expiry: '05/25', pack: '10s', hsn: '3004', mrp: 120, purchaseRate: 92.00, qty: 150 },
    { id: 's3', productId: 'p3', name: 'Dolo 650', batch: 'DL55', expiry: '01/27', pack: '15s', hsn: '3004', mrp: 30, purchaseRate: 18.00, qty: 1000 },
  ]);

  // 2. UI & Filter States
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [dueDate, setDueDate] = useState('');

  // 3. Filtered Stock List
  const filteredStock = useMemo(() => {
    return stock.filter(item => 
      item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      item.batch.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
      item.hsn.includes(stockSearchQuery)
    );
  }, [stockSearchQuery, stock]);

  // 4. Calculations (Updated with Tax Breakup)
  const totals = useMemo(() => {
    const taxableValue = basket.reduce((acc, item) => acc + (item.sellingRate * item.quantity), 0);
    const sgstTotal = basket.reduce((acc, item) => acc + ((item.sellingRate * item.quantity) * (item.sgst / 100)), 0);
    const cgstTotal = basket.reduce((acc, item) => acc + ((item.sellingRate * item.quantity) * (item.cgst / 100)), 0);
    
    return { 
      taxableValue, 
      sgstTotal, 
      cgstTotal, 
      gstTotal: sgstTotal + cgstTotal, 
      netPayable: taxableValue + sgstTotal + cgstTotal 
    };
  }, [basket]);

  // 5. Handlers
  const addToBasket = (stockItem: any) => {
    const exists = basket.find(item => item.batch === stockItem.batch);
    if (exists) return;

    const newItem: BasketItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: stockItem.productId,
      productName: stockItem.name,
      batch: stockItem.batch,
      expiry: stockItem.expiry,
      pack: stockItem.pack,
      hsn: stockItem.hsn,
      mrp: stockItem.mrp,
      purchaseRate: stockItem.purchaseRate,
      sellingRate: stockItem.mrp, 
      quantity: 1,
      sgst: 6,
      cgst: 6,
      amount: 0 // Handled by totals calculation
    };
    setBasket([...basket, newItem]);
  };

  const updateItem = (id: string, field: keyof BasketItem, value: any) => {
    setBasket(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-500">
      
      {/* LEFT: Selection Area */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        
        {/* Customer Select */}
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
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Due Date Select */}
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

        {/* Stock Search & List */}
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
            {filteredStock.map(item => (
              <button 
                key={item.id}
                onClick={() => addToBasket(item)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition-all group text-left"
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{item.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded border border-slate-100">Batch {item.batch}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Exp {item.expiry}</span>
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

      {/* RIGHT: Live Invoice (Updated Footer with SGST/CGST) */}
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
                    <div className="text-[9px] font-bold text-slate-400 uppercase">{item.batch} • {item.sgst+item.cgst}% GST</div>
                  </td>
                  <td className="py-4">
                    <input 
                      type="number" 
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full p-2 bg-slate-100 rounded-xl text-center font-black text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-4">
                    <input 
                      type="number" 
                      value={item.sellingRate}
                      onChange={(e) => updateItem(item.id, 'sellingRate', Number(e.target.value))}
                      className="w-full p-2 bg-blue-50 border border-blue-100 rounded-xl text-center font-bold text-xs outline-none"
                    />
                  </td>
                  <td className="py-4 text-right pr-2">
                    <div className="text-xs font-black text-slate-800">₹{(item.sellingRate * item.quantity).toFixed(2)}</div>
                    <button onClick={() => setBasket(basket.filter(i => i.id !== item.id))} className="text-[9px] text-rose-500 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
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

        {/* FOOTER SUMMARY: TAX BREAKUP FROM SECOND CODE INTEGRATED HERE */}
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
                <span className="text-3xl font-black text-emerald-600 tracking-tighter">
                  ₹{totals.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
           </div>
           
           <button 
             disabled={basket.length === 0 || !selectedCustomerId || !dueDate}
             className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:bg-slate-200 disabled:text-slate-400"
           >
             <Save size={18} /> CONFIRM & SAVE ORDER
           </button>
        </div>
      </div>
    </div>
  );
}