
import mockData from '../data';
import { formatCurrency } from '../utils/currency';

import { Clock, Calendar, TrendingUp, ArrowUpRight, Receipt, Package } from 'lucide-react';



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
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Receipt size={18} className="text-emerald-600" /> Recent Transactions
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {data.sales.slice(-6).reverse().map(sale => {
              const customer = data.customers.find(c => c.id === sale.customerId);
              return (
                <div key={sale.id} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 h-11 w-11 rounded-2xl flex items-center justify-center font-black text-slate-400 text-[10px]">#INV</div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{customer?.name || 'Walk-in Customer'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Clock size={12} /> {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-600">{formatCurrency(sale.total)}</p>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-200">Settled</span>
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
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                  <span>Batch {item.batch}</span>
                  <span className="text-orange-600 font-black">{item.qty} Units Left</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
