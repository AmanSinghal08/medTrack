
import mockData from '../data';
import { formatCurrency } from '../utils/currency';

import { Clock, Calendar, TrendingUp, ArrowUpRight, AlertCircle, Package } from 'lucide-react';



export default function Dashboard() {
  const data = mockData;
  const now = new Date();

  const getSalesInPeriod = (days: number) => {
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return data.sales
      .filter(s => new Date(s.date) >= periodStart)
      .reduce((acc, s) => acc + s.total, 0);
  };

  const salesStats = [
    {
      label: 'Daily Sales', value: getSalesInPeriod(1), trend: '+12%', icon: <Clock size={20} />,
      bgColor: 'bg-blue-50', textColor: 'text-blue-600'
    },
    {
      label: 'Weekly Sales', value: getSalesInPeriod(7), trend: '+5.4%', icon: <Calendar size={20} />,
      bgColor: 'bg-emerald-50', textColor: 'text-emerald-600'
    },
    {
      label: 'Monthly Sales', value: getSalesInPeriod(30), trend: '-2.1%', icon: <TrendingUp size={20} />,
      bgColor: 'bg-indigo-50', textColor: 'text-indigo-600'
    },
    {
      label: 'Yearly Target', value: getSalesInPeriod(365), trend: '78%', icon: <ArrowUpRight size={20} />,
      bgColor: 'bg-orange-50', textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesStats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              {/* Fix: Use pre-defined string classes instead of dynamic templates */}
              <div className={`p-3 rounded-2xl ${s.bgColor} ${s.textColor}`}>
                {s.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {s.trend}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(s.value)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Due Payments */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" /> Due Payments
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {data.sales
              .filter(sale => sale.dueDate)
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 6)
              .map(sale => {
                const customer = data.customers.find(c => c.id === sale.customerId);
                const dueDate = new Date(sale.dueDate);
                const today = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = daysUntilDue < 0;
                const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;
                
                return (
                  <div key={sale.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-[10px] ${
                        isOverdue ? 'bg-rose-100 text-rose-600' : isDueSoon ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                          <Calendar size={12} /> Due: {dueDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">{formatCurrency(sale.total)}</p>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                        isOverdue 
                          ? 'bg-rose-100 text-rose-700 border-rose-200' 
                          : isDueSoon 
                            ? 'bg-amber-100 text-amber-700 border-amber-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {isOverdue ? `Overdue ${Math.abs(daysUntilDue)}d` : `${daysUntilDue}d left`}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Critical Inventory */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package size={18} className="text-orange-500" /> Critical Inventory
          </h3>
          <div className="space-y-4 flex-1">
            {data.inventory.filter(i => i.qty < 100).map(item => (
              <div key={item.id} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm text-slate-800">
                    {data.products.find(p => p.id === item.productId)?.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Batch {item.batch}</span>
                    <span className="text-orange-600 font-black">{item.qty} Units Left</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">
                    Expires: {new Date(item.expiry).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
