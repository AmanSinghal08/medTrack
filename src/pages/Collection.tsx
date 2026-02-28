import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign, Search, Calendar, Receipt,
  Plus, X, Check, Clock, AlertCircle, Loader2
} from 'lucide-react';
import { CustomerCollectionService } from '../api/services/customerCollectionService';
import { SalesOrderService } from '../api/services/salesOrderService';
import { type CustomerCollection, type CustomerCollectionPayload, type SalesOrder } from '../types/app';

interface PendingOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
  remainingAmount: number;
}

export default function Collection() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [collections, setCollections] = useState<CustomerCollection[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'due-soon'>('all');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orderId: '',
    amount: '',
    comment: '',
    paymentMode: 'Cash' as 'Cash' | 'UPI' | 'Card' | 'Cheque',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, collectionRes] = await Promise.all([
        SalesOrderService.getAll(),
        CustomerCollectionService.getAll(),
      ]);
      setSalesOrders(salesRes.data || []);
      setCollections(collectionRes.data || []);
    } catch (error) {
      console.error('Failed to fetch collection data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const paymentStatusMap = useMemo(() => {
    const map: Record<string, { totalCollected: number; totalAmount: number; remainingAmount: number }> = {};

    salesOrders.forEach((order) => {
      const totalCollected = collections
        .filter((c) => c.sales_order_id === order.id)
        .reduce((acc, c) => acc + Number(c.amount || 0), 0);

      const totalAmount = Number(order.total_amount || 0);
      map[order.id] = {
        totalCollected,
        totalAmount,
        remainingAmount: Math.max(0, totalAmount - totalCollected),
      };
    });

    return map;
  }, [salesOrders, collections]);

  const getOrderPaymentStatus = (orderId: string) => {
    return paymentStatusMap[orderId] || { totalCollected: 0, remainingAmount: 0, totalAmount: 0 };
  };

  const pendingOrdersWithBalance = useMemo<PendingOrder[]>(() => {
    return salesOrders
      .map((order) => {
        const status = getOrderPaymentStatus(order.id);
        return {
          id: order.id,
          orderNumber: order.order_number,
          customerId: order.customer_id || '',
          customerName: order.customer_name || 'Unknown Customer',
          totalAmount: Number(order.total_amount || 0),
          dueDate: order.due_date || order.order_date,
          remainingAmount: status.remainingAmount,
        };
      })
      .filter((order) => order.remainingAmount > 0);
  }, [salesOrders, paymentStatusMap]);

  const filteredPendingOrders = useMemo(() => {
    let filtered = pendingOrdersWithBalance.filter((order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterStatus === 'overdue') {
      filtered = filtered.filter((order) => new Date(order.dueDate) < today);
    } else if (filterStatus === 'due-soon') {
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((order) => {
        const dueDate = new Date(order.dueDate);
        return dueDate >= today && dueDate <= sevenDaysFromNow;
      });
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [pendingOrdersWithBalance, searchTerm, filterStatus]);

  const handleAddCollection = async () => {
    if (!formData.orderId || !formData.amount) {
      return;
    }

    const order = pendingOrdersWithBalance.find((o) => o.id === formData.orderId);
    if (!order) {
      return;
    }

    const paymentAmount = parseFloat(formData.amount);
    const paymentStatus = getOrderPaymentStatus(order.id);

    if (paymentAmount > paymentStatus.remainingAmount) {
      alert(`Amount cannot exceed remaining balance of ₹${paymentStatus.remainingAmount.toLocaleString('en-IN')}`);
      return;
    }

    if (paymentAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const payload: CustomerCollectionPayload = {
      salesOrderId: order.id,
      customerId: order.customerId || null,
      paymentDate: formData.date,
      amount: paymentAmount,
      paymentMode: formData.paymentMode,
      comment: formData.comment || null,
    };

    try {
      await CustomerCollectionService.create(payload);
      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        orderId: '',
        amount: '',
        comment: '',
        paymentMode: 'Cash',
      });
      await loadData();
    } catch (error) {
      alert('Error saving collection: ' + error);
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'rose';
    if (daysUntilDue <= 7) return 'amber';
    return 'blue';
  };

  const stats = useMemo(() => {
    const totalPending = pendingOrdersWithBalance.reduce((acc, order) => acc + order.remainingAmount, 0);
    const totalCollected = collections.reduce((acc, col) => acc + Number(col.amount || 0), 0);
    const overdueOrders = pendingOrdersWithBalance.filter((order) => new Date(order.dueDate) < new Date());
    const totalOverdue = overdueOrders.reduce((acc, order) => acc + order.remainingAmount, 0);

    return {
      totalPending,
      totalCollected,
      totalOverdue,
      overdueCount: overdueOrders.length,
    };
  }, [pendingOrdersWithBalance, collections]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Collections...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Payment Collections</h1>
          <p className="text-sm text-slate-500 font-medium">Track and manage customer payments</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
        >
          <Plus size={18} /> Add Collection
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><DollarSign size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
          </div>
          <p className="text-2xl font-black text-slate-800">₹{stats.totalPending.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Check size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collected</span>
          </div>
          <p className="text-2xl font-black text-slate-800">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600"><AlertCircle size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overdue</span>
          </div>
          <p className="text-2xl font-black text-slate-800">₹{stats.totalOverdue.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600"><Clock size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders Due</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.overdueCount}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by order number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilterStatus('all')} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>All</button>
            <button onClick={() => setFilterStatus('overdue')} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'overdue' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>Overdue</button>
            <button onClick={() => setFilterStatus('due-soon')} className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'due-soon' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>Due Soon</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><Receipt size={18} className="text-blue-600" /> Pending Payments</h3>
          </div>
          <div className="p-4 space-y-3 max-h-150 overflow-y-auto">
            {filteredPendingOrders.map((order) => {
              const daysUntilDue = getDaysUntilDue(order.dueDate);
              const color = getStatusColor(daysUntilDue);
              const isOverdue = daysUntilDue < 0;
              const paymentStatus = getOrderPaymentStatus(order.id);
              const paymentProgress = paymentStatus.totalAmount > 0 ? ((paymentStatus.totalCollected / paymentStatus.totalAmount) * 100).toFixed(0) : '0';

              return (
                <div key={order.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${color === 'rose' ? 'bg-rose-50/50 border-rose-100' : color === 'amber' ? 'bg-amber-50/50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{order.customerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1"><Receipt size={10} /> {order.orderNumber}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase border ${color === 'rose' ? 'bg-rose-100 text-rose-700 border-rose-200' : color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {isOverdue ? `Overdue ${Math.abs(daysUntilDue)}d` : `${daysUntilDue}d left`}
                    </span>
                  </div>

                  {paymentStatus.totalCollected > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                        <span>Paid: ₹{paymentStatus.totalCollected.toLocaleString('en-IN')}</span>
                        <span>{paymentProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${paymentProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar size={10} /> Due: {new Date(order.dueDate).toLocaleDateString()}</p>
                      <div className="mt-1">
                        <p className="text-lg font-black text-slate-800">₹{order.remainingAmount.toLocaleString('en-IN')}</p>
                        {paymentStatus.totalCollected > 0 && <p className="text-[9px] text-slate-400 font-bold">of ₹{paymentStatus.totalAmount.toLocaleString('en-IN')}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, orderId: order.id, amount: order.remainingAmount.toString() });
                        setShowAddModal(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${color === 'rose' ? 'bg-rose-600 text-white hover:bg-rose-700' : color === 'amber' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      Collect
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredPendingOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Check size={48} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No Pending Payments</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><Check size={18} className="text-emerald-600" /> Collection History</h3>
          </div>
          <div className="p-4 space-y-3 max-h-150 overflow-y-auto">
            {collections.map((collection) => (
              <div key={collection.id} className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{collection.customer_name || 'Unknown Customer'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1"><Receipt size={10} /> {collection.order_number || '-'}</p>
                  </div>
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full uppercase border border-emerald-200">{collection.payment_mode}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar size={10} /> {new Date(collection.payment_date).toLocaleDateString()}</p>
                    <p className="text-lg font-black text-emerald-600 mt-1">₹{Number(collection.amount).toLocaleString('en-IN')}</p>
                  </div>
                  {collection.comment && <p className="text-[10px] text-slate-500 italic max-w-37.5 text-right">"{collection.comment}"</p>}
                </div>
              </div>
            ))}
            {collections.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <DollarSign size={48} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No Collections Yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center"><Plus size={20} /></div>
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Add Collection</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Collection Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Order</label>
                <select
                  value={formData.orderId}
                  onChange={(e) => {
                    const order = pendingOrdersWithBalance.find((o) => o.id === e.target.value);
                    if (order) {
                      const status = getOrderPaymentStatus(order.id);
                      setFormData({ ...formData, orderId: e.target.value, amount: status.remainingAmount.toString() });
                    } else {
                      setFormData({ ...formData, orderId: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none cursor-pointer"
                >
                  <option value="">Choose an order...</option>
                  {pendingOrdersWithBalance.map((order) => {
                    const status = getOrderPaymentStatus(order.id);
                    return (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.customerName} - Remaining: ₹{status.remainingAmount.toLocaleString('en-IN')}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  max={formData.orderId ? getOrderPaymentStatus(formData.orderId).remainingAmount : undefined}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10"
                />
                {formData.orderId && (
                  <p className="text-[10px] text-slate-500 mt-1 ml-1">Maximum: ₹{getOrderPaymentStatus(formData.orderId).remainingAmount.toLocaleString('en-IN')}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'Cash' | 'UPI' | 'Card' | 'Cheque' })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Comment (Optional)</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Add any notes or comments..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button
                onClick={handleAddCollection}
                disabled={!formData.orderId || !formData.amount}
                className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:bg-slate-200 disabled:text-slate-400"
              >
                Save Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
