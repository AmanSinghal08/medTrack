import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, MapPin,
  Search, X, Building2, Truck, IndianRupee,
  Briefcase, Loader2
} from 'lucide-react';
import { DealerService } from '../api/services/dealerService';
import { type Dealer, type DealerPayload } from '../types/app';

export default function Dealer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDealers = async () => {
    setLoading(true);
    try {
      const response = await DealerService.getAll();
      setDealers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch dealers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const filteredDealers = useMemo(() => {
    return dealers.filter((d) => {
      const companyName = d.company_name || d.companyName || '';
      const contactName = d.contact_name || d.contactName || '';
      const city = d.city || '';

      return (
        companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [dealers, searchTerm]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload: DealerPayload = {
      contactName: data.name as string,
      companyName: data.companyName as string,
      mobileNo: data.mobileNo as string,
      address: (data.address as string) || null,
      city: (data.city as string) || null,
      outstandingBalance: Number(data.outstandingBalance || 0),
      isActive: data.isActive === 'on',
    };

    try {
      if (editingDealer) {
        await DealerService.update(editingDealer.id, payload);
      } else {
        await DealerService.create(payload);
      }
      setIsModalOpen(false);
      setEditingDealer(null);
      await loadDealers();
    } catch (error) {
      alert('Error saving dealer: ' + error);
    }
  };

  const deleteDealer = async (id: string) => {
    if (!window.confirm('Remove this dealer?')) {
      return;
    }
    try {
      await DealerService.delete(id);
      setDealers((prev) => prev.filter((d) => d.id !== id));
    } catch (error) {
      alert('Error deleting dealer: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Dealers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dealer Network</h1>
          <p className="text-sm text-slate-500 font-medium">Manage suppliers and procurement channels</p>
        </div>
        <button
          onClick={() => { setEditingDealer(null); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95"
        >
          <Plus size={20} /> Add New Dealer
        </button>
      </div>

      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search company, contact or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Company & Contact</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable Balance</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDealers.map((dealer) => {
                const companyName = dealer.company_name || dealer.companyName || '-';
                const contactName = dealer.contact_name || dealer.contactName || '-';
                const mobileNo = dealer.mobile_no || dealer.mobileNo || '-';
                const city = dealer.city || '-';
                const isActive = dealer.is_active ?? dealer.isActive ?? true;
                const outstandingBalance = dealer.outstanding_balance ?? dealer.outstandingBalance ?? 0;

                return (
                  <tr key={dealer.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{companyName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                            <Briefcase size={12} /> {contactName} • {mobileNo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-bold text-slate-600 flex items-center gap-1">
                        <MapPin size={14} className="text-slate-300" /> {city}
                      </div>
                      <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                        isActive ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isActive ? 'Verified Dealer' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-black text-slate-800">
                        ₹{outstandingBalance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => { setEditingDealer(dealer); setIsModalOpen(true); }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteDealer(dealer.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        >
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-indigo-50/30">
              <div>
                <h3 className="font-black text-xl text-slate-800">
                  {editingDealer ? 'Update Dealer' : 'Partner Registration'}
                </h3>
                <p className="text-xs text-indigo-600/50 font-bold uppercase tracking-widest mt-1">Vendor Management</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Company / Firm Name</label>
                  <input name="companyName" defaultValue={editingDealer?.company_name || editingDealer?.companyName || ''} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Person</label>
                  <input name="name" defaultValue={editingDealer?.contact_name || editingDealer?.contactName || ''} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                  <input name="mobileNo" defaultValue={editingDealer?.mobile_no || editingDealer?.mobileNo || ''} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City</label>
                  <input name="city" defaultValue={editingDealer?.city || ''} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Outstanding Balance</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="number" name="outstandingBalance" defaultValue={editingDealer?.outstanding_balance ?? editingDealer?.outstandingBalance ?? 0} className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none font-bold text-slate-700" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Business Address</label>
                <textarea name="address" defaultValue={editingDealer?.address || ''} rows={2} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium resize-none" />
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-5 rounded-4xl border border-slate-100">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Truck size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Active Supplier</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name="isActive" defaultChecked={editingDealer?.is_active ?? editingDealer?.isActive ?? true} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-2 tracking-widest uppercase text-xs">
                {editingDealer ? 'Update Record' : 'Register Dealer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
