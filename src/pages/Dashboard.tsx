import { useEffect, useMemo, useState } from 'react';
import { Clock, Calendar, TrendingUp, ArrowUpRight, AlertCircle, Package, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { SalesOrderService } from '../api/services/salesOrderService';
import { CustomerCollectionService } from '../api/services/customerCollectionService';
import { InventoryService } from '../api/services/inventoryService';
import { CustomerService } from '../api/services/customerService';
import { ProductService } from '../api/services/productService';
import {
  type Customer,
  type CustomerCollection,
  type InventoryBatch,
  type Product,
  type SalesOrder,
} from '../types/app';

export default function Dashboard() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [collections, setCollections] = useState<CustomerCollection[]>([]);
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, collectionsRes, inventoryRes, customersRes, productsRes] = await Promise.all([
        SalesOrderService.getAll(),
        CustomerCollectionService.getAll(),
        InventoryService.getAll(),
        CustomerService.getAll(),
        ProductService.getAll(),
      ]);

      setSalesOrders(salesRes.data || []);
      setCollections(collectionsRes.data || []);
      setInventory(inventoryRes.data || []);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();

  const collectionByOrderId = useMemo(() => {
    const map: Record<string, number> = {};
    collections.forEach((c) => {
      map[c.sales_order_id] = (map[c.sales_order_id] || 0) + Number(c.amount || 0);
    });
    return map;
  }, [collections]);

  const getSalesInPeriod = (days: number) => {
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return salesOrders
      .filter((s) => new Date(s.order_date) >= periodStart)
      .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);
  };

  const yearlySales = getSalesInPeriod(365);
  const monthlySales = getSalesInPeriod(30);
  const monthlySalesPrev = salesOrders
    .filter((s) => {
      const d = new Date(s.order_date);
      const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const end = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return d >= start && d < end;
    })
    .reduce((acc, s) => acc + Number(s.total_amount || 0), 0);

  const monthTrend = monthlySalesPrev > 0
    ? `${(((monthlySales - monthlySalesPrev) / monthlySalesPrev) * 100 >= 0 ? '+' : '')}${(((monthlySales - monthlySalesPrev) / monthlySalesPrev) * 100).toFixed(1)}%`
    : '+0.0%';

  const weeklySales = getSalesInPeriod(7);
  const dailySales = getSalesInPeriod(1);

  const salesStats = [
    {
      label: 'Daily Sales', value: dailySales, trend: '+0.0%', icon: <Clock size={20} />,
      bgColor: 'bg-blue-50', textColor: 'text-blue-600',
    },
    {
      label: 'Weekly Sales', value: weeklySales, trend: '+0.0%', icon: <Calendar size={20} />,
      bgColor: 'bg-emerald-50', textColor: 'text-emerald-600',
    },
    {
      label: 'Monthly Sales', value: monthlySales, trend: monthTrend, icon: <TrendingUp size={20} />,
      bgColor: 'bg-indigo-50', textColor: 'text-indigo-600',
    },
    {
      label: 'Yearly Sales', value: yearlySales, trend: 'Live', icon: <ArrowUpRight size={20} />,
      bgColor: 'bg-orange-50', textColor: 'text-orange-600',
    },
  ];

  const dueSales = useMemo(() => {
    return salesOrders
      .filter((sale) => !!sale.due_date)
      .map((sale) => {
        const paid = collectionByOrderId[sale.id] || 0;
        const total = Number(sale.total_amount || 0);
        const remaining = Math.max(0, total - paid);
        return {
          ...sale,
          remaining,
        };
      })
      .filter((sale) => sale.remaining > 0)
      .sort((a, b) => new Date(a.due_date || a.order_date).getTime() - new Date(b.due_date || b.order_date).getTime())
      .slice(0, 6);
  }, [salesOrders, collectionByOrderId]);

  const criticalInventory = useMemo(() => {
    return inventory
      .filter((i) => Number(i.qty || 0) < 100)
      .sort((a, b) => Number(a.qty || 0) - Number(b.qty || 0))
      .slice(0, 8);
  }, [inventory]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesStats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${s.bgColor} ${s.textColor}`}>
                {s.icon}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-lg ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : s.trend.startsWith('-') ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
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
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" /> Due Payments
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {dueSales.map((sale) => {
              const customerName = sale.customer_name || customers.find((c) => c.id === sale.customer_id)?.name || 'Walk-in Customer';
              const dueDate = new Date(sale.due_date || sale.order_date);
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
                      <p className="font-bold text-sm text-slate-800">{customerName}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar size={12} /> Due: {dueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{formatCurrency(sale.remaining)}</p>
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
            {dueSales.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">No due payments found.</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package size={18} className="text-orange-500" /> Critical Inventory
          </h3>
          <div className="space-y-4 flex-1">
            {criticalInventory.map((item) => (
              <div key={item.id} className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm text-slate-800">
                    {item.product_name || products.find((p) => p.id === item.product_id)?.name || 'Unknown Product'}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Batch {item.batch_no}</span>
                    <span className="text-orange-600 font-black">{item.qty} Units Left</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">
                    Expires: {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-'}
                  </div>
                </div>
              </div>
            ))}
            {criticalInventory.length === 0 && (
              <div className="text-center text-slate-400 text-sm font-medium py-8">No critical inventory alerts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
