import { useState, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, MapPin, Phone, 
  Search, X, UserCheck, UserMinus, IndianRupee 
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  mobileNo: string;
  isActive: boolean;
  address: string;
  city: string;
  currentBalance: number;
}

export default function Customers() {

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Rahul Sharma', mobileNo: '9876543210', isActive: true, address: 'Sector 45', city: 'Gurugram', currentBalance: 2500 },
    { id: '2', name: 'Priya Patel', mobileNo: '9123456789', isActive: true, address: 'MG Road', city: 'Ahmedabad', currentBalance: 0 },
  ]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.mobileNo.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(formData.entries());
    
    const newCustomer: Customer = {
      id: editingCustomer?.id || Math.random().toString(36).substr(2, 9),
      name: data.name,
      mobileNo: data.mobileNo,
      address: data.address,
      city: data.city,
      currentBalance: Number(data.currentBalance),
      isActive: data.isActive === 'on',
    };

    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? newCustomer : c));
    } else {
      setCustomers([...customers, newCustomer]);
    }
    setIsModalOpen(false);
  };

  const deleteCustomer = (id: string) => {
    if(window.confirm("Delete this customer?")) {
      setCustomers(customers.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500 font-medium">Manage your client base and outstanding balances</p>
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          <Plus size={20} /> Add New Customer
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-6 border-b border-slate-50">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search by name, phone or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Details</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location & Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{customer.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Phone size={12} /> {customer.mobileNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-sm font-bold text-slate-600 flex items-center gap-1">
                      <MapPin size={14} className="text-slate-300" /> {customer.city}
                    </div>
                    <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                      customer.isActive 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {customer.isActive ? <UserCheck size={10}/> : <UserMinus size={10}/>}
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className={`text-sm font-black ${customer.currentBalance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      ₹{customer.currentBalance.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteCustomer(customer.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl text-slate-800">
                  {editingCustomer ? 'Edit Profile' : 'New Customer'}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Customer Information</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-100 text-slate-400 hover:text-rose-500 transition-colors shadow-sm">
                <X size={20}/>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input name="name" defaultValue={editingCustomer?.name} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                  <input name="mobileNo" defaultValue={editingCustomer?.mobileNo} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">City</label>
                  <input name="city" defaultValue={editingCustomer?.city} required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Address</label>
                <textarea name="address" defaultValue={editingCustomer?.address} rows={2} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none transition-all font-medium resize-none" />
              </div>

              <div className="flex items-center justify-between bg-emerald-50/50 p-5 rounded-4xl border border-emerald-100/50">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2.5 rounded-xl shadow-sm text-emerald-600">
                    <IndianRupee size={20} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-emerald-700/50 uppercase tracking-widest">Opening Balance</label>
                    <input type="number" name="currentBalance" defaultValue={editingCustomer?.currentBalance || 0} className="bg-transparent font-black text-emerald-700 text-lg focus:outline-none w-24" />
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Active</span>
                  <div className="relative">
                    <input type="checkbox" name="isActive" defaultChecked={editingCustomer?.isActive ?? true} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </div>
                </label>
              </div>

              <button type="submit" className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-[0.98] mt-2 tracking-widest uppercase text-xs">
                {editingCustomer ? 'Update Customer' : 'Create Customer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}