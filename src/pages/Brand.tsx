import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, X,
  Award, Factory, Tag, LayoutGrid, Loader2
} from 'lucide-react';
import { BrandService } from '../api/services/brandService';
import { type Brand, type BrandPayload } from '../types/app';

export default function Brand() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const response = await BrandService.getAll();
      setBrands(response.data || []);
    } catch (error) {
      console.error('Failed to fetch brands', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const companyName = b.company_name || b.companyName || '';
      return (
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        companyName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [brands, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload: BrandPayload = {
      name: data.name as string,
      companyName: data.companyName as string,
    };

    try {
      if (editingBrand) {
        await BrandService.update(editingBrand.id, payload);
      } else {
        await BrandService.create(payload);
      }
      setIsModalOpen(false);
      setEditingBrand(null);
      await loadBrands();
    } catch (error) {
      alert('Error saving brand: ' + error);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!window.confirm('Remove this brand?')) {
      return;
    }
    try {
      await BrandService.delete(id);
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      alert('Error deleting brand: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Brands...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Brand Registry</h1>
          <p className="text-sm text-slate-500 font-medium">Categorize products by manufacturing labels</p>
        </div>
        <button
          onClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-100 active:scale-95"
        >
          <Plus size={20} /> Add New Brand
        </button>
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search brand or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Brand Name</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Manufacturing Company</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBrands.map((brand) => {
                const companyName = brand.company_name || brand.companyName || '-';
                return (
                  <tr key={brand.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                          <Tag size={18} />
                        </div>
                        <div className="font-bold text-slate-800 text-lg tracking-tight">{brand.name}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                        <Factory size={16} className="text-slate-300" />
                        {companyName}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => { setEditingBrand(brand); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteBrand(brand.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center text-slate-300">
                      <LayoutGrid size={48} className="mb-2 opacity-20" />
                      <p className="font-bold">No brands found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-violet-50/30">
              <div>
                <h3 className="font-black text-xl text-slate-800">
                  {editingBrand ? 'Edit Brand' : 'New Brand'}
                </h3>
                <p className="text-xs text-violet-600/50 font-bold uppercase tracking-widest mt-1">Product Labeling</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Brand Name</label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-300" size={18} />
                  <input
                    name="name"
                    defaultValue={editingBrand?.name}
                    required
                    placeholder="e.g. Dolo"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Company Name</label>
                <div className="relative">
                  <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input
                    name="companyName"
                    defaultValue={editingBrand?.company_name || editingBrand?.companyName || ''}
                    required
                    placeholder="e.g. Micro Labs Ltd"
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium text-slate-600"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-violet-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-violet-100 hover:bg-violet-700 transition-all active:scale-[0.98] mt-2 tracking-widest uppercase text-xs">
                {editingBrand ? 'Save Changes' : 'Register Brand'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
