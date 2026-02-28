import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign, Search, Calendar, Receipt,
  Plus, X, Check, Clock, AlertCircle, Truck, Loader2
} from 'lucide-react';
import { DealerPaymentService } from '../api/services/dealerPaymentService';
import { PurchaseOrderService } from '../api/services/purchaseOrderService';
import { type DealerPayment, type DealerPaymentPayload, type PurchaseOrder } from '../types/app';

interface PendingPurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  dealerId: string;
  dealerName: string;
  totalAmount: number;
  dueDate: string;
  remainingAmount: number;
}

export default function DealerPaymentPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [dealerPayments, setDealerPayments] = useState<DealerPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'due-soon'>('all');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purchaseOrderId: '',
    amount: '',
    comment: '',
    paymentMode: 'Cash' as 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank Transfer',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [poRes, paymentRes] = await Promise.all([
        PurchaseOrderService.getAll(),
        DealerPaymentService.getAll(),
      ]);
      setPurchaseOrders(poRes.data || []);
      setDealerPayments(paymentRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dealer payment data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getPurchaseOrderPaymentStatus = (purchaseOrderId: string) => {
    const purchaseOrder = purchaseOrders.find((po) => po.id === purchaseOrderId);
    if (!purchaseOrder) {
      return { totalPaid: 0, remainingAmount: 0, totalAmount: 0 };
    }

    const totalPaid = dealerPayments
      .filter((payment) => payment.purchase_order_id === purchaseOrderId)
      .reduce((acc, payment) => acc + Number(payment.amount || 0), 0);

    const totalAmount = Number(purchaseOrder.total_amount || 0);
    const remainingAmount = totalAmount - totalPaid;

    return {
      totalPaid,
      remainingAmount: Math.max(0, remainingAmount),
      totalAmount,
    };
  };

  const pendingPurchaseOrdersWithBalance = useMemo<PendingPurchaseOrder[]>(() => {
    return purchaseOrders
      .map((po) => {
        const status = getPurchaseOrderPaymentStatus(po.id);
        return {
          id: po.id,
          purchaseOrderNumber: po.purchase_order_number,
          dealerId: po.dealer_id || '',
          dealerName: po.dealer_company_name || 'Unknown Dealer',
          totalAmount: Number(po.total_amount || 0),
          dueDate: po.due_date || po.order_date || new Date().toISOString().split('T')[0],
          remainingAmount: status.remainingAmount,
        };
      })
      .filter((po) => po.remainingAmount > 0);
  }, [purchaseOrders, dealerPayments]);

  const filteredPendingPurchaseOrders = useMemo(() => {
    let filtered = pendingPurchaseOrdersWithBalance.filter(
      (purchaseOrder) =>
        purchaseOrder.purchaseOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchaseOrder.dealerName.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterStatus === 'overdue') {
      filtered = filtered.filter((purchaseOrder) => new Date(purchaseOrder.dueDate) < today);
    } else if (filterStatus === 'due-soon') {
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((purchaseOrder) => {
        const dueDate = new Date(purchaseOrder.dueDate);
        return dueDate >= today && dueDate <= sevenDaysFromNow;
      });
    }

    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [pendingPurchaseOrdersWithBalance, searchTerm, filterStatus]);

  const handleAddDealerPayment = async () => {
    if (!formData.purchaseOrderId || !formData.amount) {
      return;
    }

    const purchaseOrder = pendingPurchaseOrdersWithBalance.find((po) => po.id === formData.purchaseOrderId);
    if (!purchaseOrder) {
      return;
    }

    const paymentAmount = parseFloat(formData.amount);
    const paymentStatus = getPurchaseOrderPaymentStatus(purchaseOrder.id);

    if (paymentAmount > paymentStatus.remainingAmount) {
      alert(`Amount cannot exceed remaining payable of ₹${paymentStatus.remainingAmount.toLocaleString('en-IN')}`);
      return;
    }

    if (paymentAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    const payload: DealerPaymentPayload = {
      purchaseOrderId: purchaseOrder.id,
      dealerId: purchaseOrder.dealerId || null,
      paymentDate: formData.date,
      amount: paymentAmount,
      paymentMode: formData.paymentMode,
      comment: formData.comment || null,
    };

    try {
      await DealerPaymentService.create(payload);
      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        purchaseOrderId: '',
        amount: '',
        comment: '',
        paymentMode: 'Cash',
      });
      await loadData();
    } catch (error) {
      alert(`Error saving dealer payment: ${error}`);
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
    const totalPayable = pendingPurchaseOrdersWithBalance.reduce(
      (acc, purchaseOrder) => acc + purchaseOrder.remainingAmount,
      0,
    );
    const totalPaid = dealerPayments.reduce((acc, payment) => acc + Number(payment.amount || 0), 0);
    const overduePurchaseOrders = pendingPurchaseOrdersWithBalance.filter(
      (purchaseOrder) => new Date(purchaseOrder.dueDate) < new Date(),
    );
    const totalOverdue = overduePurchaseOrders.reduce(
      (acc, purchaseOrder) => acc + purchaseOrder.remainingAmount,
      0,
    );

    return {
      totalPayable,
      totalPaid,
      totalOverdue,
      overdueCount: overduePurchaseOrders.length,
    };
  }, [pendingPurchaseOrdersWithBalance, dealerPayments]);

  const sortedDealerPayments = useMemo(() => {
    return [...dealerPayments].sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime(),
    );
  }, [dealerPayments]);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-4">
        <Loader2 className="animate-spin" size={40} />
        <p className="font-bold tracking-widest uppercase text-xs">Loading Dealer Payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dealer Payments</h1>
          <p className="text-sm text-slate-500 font-medium">Track and manage payments made against purchase orders</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Add Payment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><DollarSign size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payable</span>
          </div>
          <p className="text-2xl font-black text-slate-800">₹{stats.totalPayable.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600"><Check size={20} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</span>
          </div>
          <p className="text-2xl font-black text-slate-800">₹{stats.totalPaid.toLocaleString('en-IN')}</p>
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO Due</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{stats.overdueCount}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by purchase order or dealer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
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
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><Receipt size={18} className="text-blue-600" /> Pending Dealer Payments</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {filteredPendingPurchaseOrders.map((purchaseOrder) => {
              const daysUntilDue = getDaysUntilDue(purchaseOrder.dueDate);
              const color = getStatusColor(daysUntilDue);
              const isOverdue = daysUntilDue < 0;
              const paymentStatus = getPurchaseOrderPaymentStatus(purchaseOrder.id);
              const paymentProgress = paymentStatus.totalAmount > 0 ? ((paymentStatus.totalPaid / paymentStatus.totalAmount) * 100).toFixed(0) : '0';

              return (
                <div key={purchaseOrder.id} className={`p-4 rounded-2xl border transition-all hover:shadow-md ${color === 'rose' ? 'bg-rose-50/50 border-rose-100' : color === 'amber' ? 'bg-amber-50/50 border-amber-100' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{purchaseOrder.dealerName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1"><Receipt size={10} /> {purchaseOrder.purchaseOrderNumber}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase border ${color === 'rose' ? 'bg-rose-100 text-rose-700 border-rose-200' : color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {isOverdue ? `Overdue ${Math.abs(daysUntilDue)}d` : `${daysUntilDue}d left`}
                    </span>
                  </div>

                  {paymentStatus.totalPaid > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                        <span>Paid: ₹{paymentStatus.totalPaid.toLocaleString('en-IN')}</span>
                        <span>{paymentProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full transition-all ${color === 'rose' ? 'bg-rose-500' : color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${paymentProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar size={10} /> Due: {new Date(purchaseOrder.dueDate).toLocaleDateString()}</p>
                      <div className="mt-1">
                        <p className="text-lg font-black text-slate-800">₹{purchaseOrder.remainingAmount.toLocaleString('en-IN')}</p>
                        {paymentStatus.totalPaid > 0 && <p className="text-[9px] text-slate-400 font-bold">of ₹{paymentStatus.totalAmount.toLocaleString('en-IN')}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({ ...formData, purchaseOrderId: purchaseOrder.id, amount: purchaseOrder.remainingAmount.toString() });
                        setShowAddModal(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${color === 'rose' ? 'bg-rose-600 text-white hover:bg-rose-700' : color === 'amber' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      Pay
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredPendingPurchaseOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <Check size={48} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No Pending Dealer Payments</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2"><Check size={18} className="text-indigo-600" /> Dealer Payment History</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {sortedDealerPayments.map((payment) => (
              <div key={payment.id} className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-2"><Truck size={14} className="text-indigo-500" /> {payment.dealer_company_name || 'Unknown Dealer'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 mt-1"><Receipt size={10} /> {payment.purchase_order_number || '-'}</p>
                  </div>
                  <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full uppercase border border-indigo-200">{payment.payment_mode}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Calendar size={10} /> {new Date(payment.payment_date).toLocaleDateString()}</p>
                    <p className="text-lg font-black text-indigo-600 mt-1">₹{Number(payment.amount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  {payment.comment && <p className="text-[10px] text-slate-500 italic max-w-[160px] text-right">"{payment.comment}"</p>}
                </div>
              </div>
            ))}
            {sortedDealerPayments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                <DollarSign size={48} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">No Payments Yet</p>
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
                <div className="h-10 w-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center"><Plus size={20} /></div>
                <h3 className="font-black text-lg text-slate-800 uppercase tracking-tight">Add Payment</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Payment Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Select Purchase Order</label>
                <select
                  value={formData.purchaseOrderId}
                  onChange={(e) => {
                    const purchaseOrder = pendingPurchaseOrdersWithBalance.find((po) => po.id === e.target.value);
                    if (purchaseOrder) {
                      const status = getPurchaseOrderPaymentStatus(purchaseOrder.id);
                      setFormData({ ...formData, purchaseOrderId: e.target.value, amount: status.remainingAmount.toString() });
                    } else {
                      setFormData({ ...formData, purchaseOrderId: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                >
                  <option value="">Choose purchase order...</option>
                  {pendingPurchaseOrdersWithBalance.map((purchaseOrder) => {
                    const status = getPurchaseOrderPaymentStatus(purchaseOrder.id);
                    return (
                      <option key={purchaseOrder.id} value={purchaseOrder.id}>
                        {purchaseOrder.purchaseOrderNumber} - {purchaseOrder.dealerName} - Remaining: ₹{status.remainingAmount.toLocaleString('en-IN')}
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
                  max={formData.purchaseOrderId ? getPurchaseOrderPaymentStatus(formData.purchaseOrderId).remainingAmount : undefined}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
                {formData.purchaseOrderId && <p className="text-[10px] text-slate-500 mt-1 ml-1">Maximum: ₹{getPurchaseOrderPaymentStatus(formData.purchaseOrderId).remainingAmount.toLocaleString('en-IN')}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value as 'Cash' | 'UPI' | 'Card' | 'Cheque' | 'Bank Transfer' })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Comment (Optional)</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Add notes for this payment..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button
                onClick={handleAddDealerPayment}
                disabled={!formData.purchaseOrderId || !formData.amount}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:bg-slate-200 disabled:text-slate-400"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
