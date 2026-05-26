import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PAYMENT_MODES = ['cash', 'upi', 'bank_transfer', 'cheque', 'online', 'other'];

export default function PaymentModal({ data, onClose, onSaved }) {
  const { flat, month, year } = data;
  const [payment, setPayment] = useState(null);
  const [form, setForm] = useState({ status: 'unpaid', amount: flat.monthlyAmount || 2000, paymentDate: '', paymentMode: 'cash', remarks: '' });
  const [note, setNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('details');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPayment();
  }, [flat._id, month, year]);

  const loadPayment = async () => {
    setLoading(true);
    try {
      const [payRes, notesRes] = await Promise.all([
        api.get(`/payments/${flat._id}/${year}/${month}`),
        api.get('/notes', { params: { flatId: flat._id, year, month } })
      ]);
      if (payRes.data.data) {
        const p = payRes.data.data;
        setPayment(p);
        setForm({
          status: p.status,
          amount: p.amount || flat.monthlyAmount || 2000,
          paymentDate: p.paymentDate ? p.paymentDate.split('T')[0] : '',
          paymentMode: p.paymentMode || 'cash',
          remarks: p.remarks || ''
        });
      }
      setNotes(notesRes.data.data || []);
    } catch {}
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/payments/${flat._id}/${year}/${month}`, form);
      toast.success(payment ? 'Payment updated!' : 'Payment saved!');
      onSaved();
      loadPayment();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    if (!confirm('Move this payment to trash?')) return;
    setDeleting(true);
    try {
      await api.delete(`/payments/${payment._id}`);
      toast.success('Moved to trash');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post('/notes', { flatId: flat._id, year, month, content: note, noteType });
      setNote('');
      loadPayment();
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {flat.flatNumber} — {MONTHS[month - 1]} {year}
            </h2>
            {flat.ownerName && <p className="text-sm text-gray-500 dark:text-gray-400">{flat.ownerName}</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-5">
          {['details', 'history', 'notes'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}>
              {t} {t === 'history' && payment?.history?.length ? `(${payment.history.length})` : ''}
              {t === 'notes' && notes.length ? `(${notes.length})` : ''}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
            </div>
          ) : tab === 'details' ? (
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Status</label>
                <div className="flex gap-2">
                  {['paid', 'unpaid', 'overdue'].map(s => (
                    <button key={s} onClick={() => setForm({ ...form, status: s })}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all border-2 ${
                        form.status === s
                          ? s === 'paid' ? 'bg-green-500 border-green-500 text-white'
                          : s === 'unpaid' ? 'bg-red-500 border-red-500 text-white'
                          : 'bg-orange-500 border-orange-500 text-white'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                <input type="number" className="input-field" value={form.amount}
                  onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date</label>
                <input type="date" className="input-field" value={form.paymentDate}
                  onChange={e => setForm({ ...form, paymentDate: e.target.value })} />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode</label>
                <select className="input-field" value={form.paymentMode}
                  onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
                  {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                <textarea className="input-field resize-none" rows={2} value={form.remarks}
                  onChange={e => setForm({ ...form, remarks: e.target.value })}
                  placeholder="Optional notes..." />
              </div>
            </div>
          ) : tab === 'history' ? (
            <div className="space-y-3">
              {!payment?.history?.length ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No history yet</p>
              ) : (
                [...payment.history].reverse().map((h, i) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                        h.action === 'created' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        h.action === 'deleted' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        h.action === 'restored' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>{h.action}</span>
                      <span className="text-xs text-gray-400">{new Date(h.updatedAt).toLocaleString('en-IN')}</span>
                    </div>
                    {/* Show old values with strikethrough if it's an update */}
                    {i > 0 && payment.history[payment.history.length - 1 - i + 1] && (
                      <div className="text-xs space-y-1 mb-1">
                        {h.amount !== payment.history[payment.history.length - 2 - i + 1]?.amount && (
                          <div>
                            <span className="strike-old text-xs">₹{payment.history[payment.history.length - 2 - i + 1]?.amount}</span>
                            <span className="text-green-600 dark:text-green-400 ml-2 text-xs">→ ₹{h.amount}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 mt-1">
                      <p>Status: <span className="font-medium capitalize">{h.status}</span> | Amount: <span className="font-medium">₹{h.amount}</span></p>
                      {h.remarks && <p>Remarks: {h.remarks}</p>}
                      <p className="text-gray-400">By: {h.updatedByName || 'System'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // Notes tab
            <div className="space-y-4">
              <div className="space-y-2">
                <select className="input-field text-sm" value={noteType} onChange={e => setNoteType(e.target.value)}>
                  <option value="general">General Note</option>
                  <option value="pending_reason">Pending Reason</option>
                  <option value="admin_comment">Admin Comment</option>
                </select>
                <textarea className="input-field resize-none text-sm" rows={3} value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. Owner out of station, will pay next month..." />
                <button onClick={handleAddNote} className="btn-primary text-sm py-2 w-full">+ Add Note</button>
              </div>
              <div className="space-y-2">
                {notes.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No notes yet</p>
                ) : notes.map(n => (
                  <div key={n._id} className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400 capitalize">{n.noteType.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{n.content}</p>
                    <p className="text-xs text-gray-400 mt-1">— {n.createdByName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'details' && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            {payment && (
              <button onClick={handleDelete} disabled={deleting} className="btn-danger px-3 py-2 text-sm">
                🗑️
              </button>
            )}
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? 'Saving...' : payment ? 'Update' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
