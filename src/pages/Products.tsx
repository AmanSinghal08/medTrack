import { useState, useMemo } from 'react';
import { Plus, Package, Tag, Edit2, Trash2, Search, X } from 'lucide-react';
import { getBrandColorStyles } from '../utils/colors';

interface Product {
  id: string;
  name: string;
  brandId: string;
  type: string; // syrup, tablet, capsule, etc.
  hsn: string;
  pack: string; // e.g. 10x10, 100ml
}

export default function Products() {
  // 1. Mock Data (Normally these would come from your state/API)
  const [brands] = useState([
    { id: 'b1', name: 'Dolo' },
    { id: 'b2', name: 'Crocin' },
    { id: 'b3', name: 'Becosules' },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: 'Paracetamol 650', brandId: 'b1', type: 'Tablet', hsn: '3004', pack: '15s' },
    { id: '2', name: 'Cold & Flu Relief', brandId: 'b2', type: 'Capsule', hsn: '3004', pack: '10s' },
  ]);

  // 2. State for Filters & UI
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // 3. Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.hsn.includes(searchTerm);
      const matchBrand = brandFilter === '' || p.brandId === brandFilter;
      return matchSearch && matchBrand;
    });
  }, [products, searchTerm, brandFilter]);

  // 4. Handlers
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    const newProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      name: data.name,
      brandId: data.brandId,
      type: data.type,
      hsn: data.hsn,
      pack: data.pack,
    };

    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts([...products, newProduct]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Product Catalog</h1>
          <p className="text-sm text-slate-500 font-medium">Manage pharmaceutical inventory and SKU details</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          <Plus size={20} /> Register Product
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or HSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-all"
          />
        </div>
        <select 
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none font-bold text-slate-600 cursor-pointer"
        >
          <option value="">All Brands</option>
          {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Molecule / Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Identifier</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Packaging</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map((p) => {
                const brand = brands.find(b => b.id === p.brandId);
                const colors = getBrandColorStyles(brand?.name);
                
                return (
                  <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center border ${colors.border}`}>
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="text-slate-800 font-bold text-sm">{p.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">HSN {p.hsn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[10px] ${colors.bg} ${colors.text} px-3 py-1.5 rounded-xl font-black uppercase tracking-widest border ${colors.border} inline-flex items-center gap-1.5`}>
                        <Tag size={12} /> {brand?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="text-sm font-bold text-slate-700">{p.pack}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight bg-slate-100 inline-block px-2 py-0.5 rounded-lg mt-1">{p.type}</div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-xl text-slate-800">{editingProduct ? 'Edit Product' : 'New Registration'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Product / Molecule Name</label>
                  <input name="name" defaultValue={editingProduct?.name} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-bold text-slate-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Brand</label>
                  <select name="brandId" defaultValue={editingProduct?.brandId} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-bold text-slate-600">
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category Type</label>
                  <select name="type" defaultValue={editingProduct?.type || 'Tablet'} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-bold text-slate-600">
                    <option>Tablet</option>
                    <option>Syrup</option>
                    <option>Capsule</option>
                    <option>Injection</option>
                    <option>Ointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">HSN Code</label>
                  <input name="hsn" defaultValue={editingProduct?.hsn} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Packaging (e.g. 10x10)</label>
                  <input name="pack" defaultValue={editingProduct?.pack} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98] mt-2 tracking-widest uppercase text-xs">
                {editingProduct ? 'Update Product' : 'Register SKU'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}