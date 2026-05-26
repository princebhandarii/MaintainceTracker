import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import PaymentModal from '../components/dashboard/PaymentModal';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const statusColors = {
  paid:    'bg-green-500 text-white',
  unpaid:  'bg-red-500 text-white',
  overdue: 'bg-orange-500 text-white',
  no_data: 'bg-gray-200 dark:bg-gray-700 text-gray-500'
};

export default function FlatDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(null);

  // Owner name edit state
  const [editingOwner, setEditingOwner] = useState(false);
  const [ownerInput, setOwnerInput] = useState('');
  const [savingOwner, setSavingOwner] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/flats/${id}/payments`, { params: { year } });
      setData(res.data.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, year]);

  const startEditOwner = () => {
    setOwnerInput(data?.flat?.ownerName || '');
    setEditingOwner(true);
  };

  const saveOwnerName = async () => {
    setSavingOwner(true);
    try {
      await api.put(`/flats/${id}`, { ownerName: ownerInput.trim() });
      toast.success('Owner name updated');
      setEditingOwner(false);
      load();
    } catch {
      toast.error('Failed to update owner name');
    } finally {
      setSavingOwner(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-48 w-full rounded-xl" />
    </div>
  );
  if (!data) return <div className="text-center py-12 text-gray-500">Flat not found</div>;

  const { flat, months, pendingCount } = data;
  const paidMonths = months.filter(m => m.payment?.status === 'paid').length;
  const totalCollected = months.reduce((s, m) => s + (m.payment?.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors mt-0.5">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Flat {flat.flatNumber}</h1>

          {/* Owner name — inline editable */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {editingOwner ? (
              <>
                <input
                  autoFocus
                  className="input-field py-0.5 px-2 text-sm h-8 w-52"
                  value={ownerInput}
                  onChange={e => setOwnerInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveOwnerName(); if (e.key === 'Escape') setEditingOwner(false); }}
                  placeholder="Enter owner name"
                />
                <button onClick={saveOwnerName} disabled={savingOwner}
                  className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 transition-colors disabled:opacity-50">
                  {savingOwner ? 'Saving…' : '✓ Save'}
                </button>
                <button onClick={() => setEditingOwner(false)}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={startEditOwner}
                className="group flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm"
                title="Click to edit owner name">
                <span>
                  {flat.ownerName
                    ? flat.ownerName
                    : <span className="italic text-gray-400 dark:text-gray-500">No owner — click to add</span>}
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs">✏️</span>
              </button>
            )}
            <span className="text-gray-400 text-sm">• Wing {flat.wing} • Floor {flat.floor}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Paid Months',     value: paidMonths,                              color: 'text-green-600 dark:text-green-400' },
          { label: 'Pending Months',  value: pendingCount,                            color: 'text-red-600 dark:text-red-400' },
          { label: 'Total Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: 'text-blue-600 dark:text-blue-400' },
          { label: 'Monthly Amount',  value: `₹${flat.monthlyAmount}`,               color: 'text-gray-600 dark:text-gray-300' },
        ].map((s,i) => (
          <div key={i} className="card p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3">
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className="input-field w-28">
          {[2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-sm">
            ⚠️ <span className="font-medium">{pendingCount} months pending</span>
          </div>
        )}
      </div>

      {/* Month grid */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment History — {year}</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {months.map(({ month, payment }) => {
            const status = payment?.status || 'no_data';
            return (
              <button key={month} onClick={() => setModal({ flat, month, year })}
                className={`p-3 rounded-xl text-center transition-all hover:scale-105 hover:shadow-md ${statusColors[status]}`}>
                <p className="font-semibold">{MONTHS[month - 1]}</p>
                <p className="text-xs mt-1 opacity-80 capitalize">{status.replace('_',' ')}</p>
                {payment?.amount > 0 && <p className="text-xs mt-0.5 font-medium">₹{payment.amount}</p>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent payments */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Payments</h3>
        {months.filter(m => m.payment).length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No payments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {months.filter(m => m.payment?.status === 'paid').map(({ month, payment }) => (
              <div key={month} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="badge-paid">{MONTHS[month - 1]}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{payment.paymentMode?.replace('_',' ')}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">₹{payment.amount}</p>
                  {payment.paymentDate && (
                    <p className="text-xs text-gray-400">{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && <PaymentModal data={modal} onClose={() => setModal(null)} onSaved={load} />}
    </div>
  );
}
