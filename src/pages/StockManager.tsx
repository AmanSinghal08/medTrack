import { useState, useMemo } from 'react';
import {
  Plus, Clock, Edit2, Search, X, AlertTriangle, Landmark,
  Truck
} from 'lucide-react';

// Currency Formatter Utility
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);

interface StockItem {
  id: string;
  productId: string;
  dealerId: string,
  quantity: number;
  pack: string;
  batch: string;
  expiryDate: string;
  hsn: string;
  mrp: number;
  purchaseRate: number;
  sgst: number;
  cgst: number;
  totalPurchaseAmount: number;
  purchaseId: string;
}

export default function StockManager() {
  // 1. Data States (Usually from your DB/API)

  const [dealers] = useState([
    { id: 'd1', companyName: 'HealthCare Pharma' },
    { id: 'd2', companyName: 'LifeLine Medicos' },
  ]);

  const [products] = useState([
    { id: 'p1', name: 'Paracetamol 650', hsn: '3004' },
    { id: 'p2', name: 'Amoxicillin 500', hsn: '3004' },
    { id: 'p3', name: 'Dolo 650', hsn: '3004' },
  ]);

  const [inventory, setInventory] = useState<StockItem[]>([
    {
      id: 's1', productId: 'p1', quantity: 120, pack: '15s', batch: 'B2204', dealerId: 'd1', purchaseId: 'p1',
      expiryDate: '12/26', hsn: '3004', mrp: 45, purchaseRate: 28.50, sgst: 6, cgst: 6, totalPurchaseAmount: 3420
    },
    {
      id: 's2', productId: 'p2', quantity: 15, pack: '10s', batch: 'AMX-99', dealerId: 'd2', purchaseId: 'p2',
      expiryDate: '05/25', hsn: '3004', mrp: 120, purchaseRate: 92.00, sgst: 6, cgst: 6, totalPurchaseAmount: 1380
    }
  ]);

  // 2. UI & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // 3. FIXED SEARCH LOGIC
  const filtered = useMemo(() => {
    return inventory.filter((item) => {
      // Find the product linked to this stock item to search by name
      const product = products.find(p => p.id === item.productId);
      const productName = product?.name.toLowerCase() || "";
      const batchNumber = item.batch.toLowerCase();
      const hsnNumber = item.hsn.toLowerCase();
      const query = searchTerm.toLowerCase();
      const dealer = dealers.find(d => d.id === item.dealerId);
      const dealerName = dealer?.companyName.toLowerCase() || "";



      // Check if search query matches Product Name OR Batch OR HSN
      const matchesSearch = productName.includes(query) ||
        batchNumber.includes(query) ||
        dealerName.includes(query) ||
        hsnNumber.includes(query);

      // Check if dropdown filter matches
      const matchesDropdown = productFilter === '' || item.productId === productFilter;

      return matchesSearch && matchesDropdown;
    });
  }, [inventory, searchTerm, productFilter, products]);

  // 4. Handlers
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());

    const qty = Number(data.quantity);
    const rate = Number(data.purchaseRate);

    const newItem: StockItem = {
      id: editingItem?.id || Math.random().toString(36).substr(2, 9),
      productId: data.productId,
      dealerId: data.dealerId,
      batch: data.batch,
      quantity: qty,
      pack: data.pack,
      expiryDate: data.expiryDate,
      hsn: data.hsn,
      mrp: Number(data.mrp),
      purchaseRate: rate,
      sgst: Number(data.sgst),
      cgst: Number(data.cgst),
      totalPurchaseAmount: qty * rate,
      purchaseId: data.purchaseId,
    };

    if (editingItem) {
      setInventory(inventory.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      setInventory([...inventory, newItem]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Stock & Purchase</h1>
          <p className="text-sm text-slate-500 font-medium">Manage inbound inventory and purchase costs</p>
        </div>
        <button
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={20} /> Add Purchase Entry
        </button>
      </div>

      {/* Filter Section */}
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
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Table Card */}
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
                const product = products.find(p => p.id === item.productId);
                const dealer = dealers.find(d => d.id === item.dealerId);
                return (
                  <tr key={item.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-800 text-sm">{product?.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        HSN {item.hsn} • {item.pack}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-slate-700">{item.batch}</div>
                      <div className="text-[10px] text-amber-600 font-black uppercase mt-1 flex items-center gap-1.5">
                        <Clock size={10} /> Exp {item.expiryDate}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Truck size={14} className="text-blue-400" />
                        {dealer?.companyName || 'Unknown Dealer'}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-blue-600">{formatCurrency(item.purchaseRate)}</div>
                      <div className="text-[10px] text-slate-400 font-bold">MRP: {formatCurrency(item.mrp)}</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${item.quantity < 20 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'}`}>
                        {item.quantity < 20 && <AlertTriangle size={12} />}
                        <span className="text-sm font-black">{item.quantity}</span>
                        <span className="text-[10px] font-bold uppercase">Units</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                        className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                    No stock records found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Section */}
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
                <select name="productId" defaultValue={editingItem?.productId} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Supplier (Dealer)</label>
                <select name="dealerId" defaultValue={editingItem?.dealerId} required className="w-full px-5 py-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl font-bold text-blue-800">
                  <option value="">Select Dealer...</option>
                  {dealers.map(d => <option key={d.id} value={d.id}>{d.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Batch Number</label>
                <input name="batch" defaultValue={editingItem?.batch} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="e.g. BT-992" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Expiry (MM/YY)</label>
                <input name="expiryDate" defaultValue={editingItem?.expiryDate} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="12/26" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Inbound Quantity</label>
                <input type="number" name="quantity" defaultValue={editingItem?.quantity} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-black text-blue-600" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Pack Size</label>
                <input name="pack" defaultValue={editingItem?.pack} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="10x15" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Pack Size</label>
                <input name="pack" defaultValue={editingItem?.purchaseId} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold" placeholder="10x15" />
              </div>

              <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-4xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Purchase Rate</label>
                  <input type="number" step="0.01" name="purchaseRate" defaultValue={editingItem?.purchaseRate} className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none font-black text-blue-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">MRP</label>
                  <input type="number" step="0.01" name="mrp" defaultValue={editingItem?.mrp} className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none font-bold text-slate-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">SGST (%)</label>
                  <input type="number" name="sgst" defaultValue={editingItem?.sgst || 6} className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">CGST (%)</label>
                  <input type="number" name="cgst" defaultValue={editingItem?.cgst || 6} className="w-full bg-white px-4 py-2 rounded-xl border border-slate-100 focus:outline-none" />
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