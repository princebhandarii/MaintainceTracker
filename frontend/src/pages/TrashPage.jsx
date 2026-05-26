import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MONTHS = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function TrashPage() {
  const [data, setData] = useState({ payments: [], flats: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trash');
      setData(res.data.data || { payments: [], flats: [] });
    } catch { toast.error('Failed to load trash'); }
    setLoading(false);
  };

  const restore = async (id) => {
    try {
      await api.put(`/trash/payments/${id}/restore`);
      toast.success('Payment restored');
      load();
    } catch { toast.error('Failed to restore'); }
  };

  const permanentDelete = async (id) => {
    if (!confirm('Permanently delete? This cannot be undone!')) return;
    try {
      await api.delete(`/trash/payments/${id}/permanent`);
      toast.success('Permanently deleted');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🗑️ Trash</h1>
        <p className="text-gray-500 text-sm mt-1">Restore or permanently delete records</p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Deleted Payments ({data.payments.length})</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="skeleton h-12 rounded-lg"/>)}</div>
        ) : data.payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <p className="text-gray-500 dark:text-gray-400">Trash is empty</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Flat','Wing','Month/Year','Status','Amount','Deleted By','Deleted At','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.payments.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{p.flatNumber}</td>
                    <td className="px-4 py-3">Wing {p.wing}</td>
                    <td className="px-4 py-3">{MONTHS[p.month]} {p.year}</td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
                    <td className="px-4 py-3">₹{p.amount || 0}</td>
                    <td className="px-4 py-3 text-gray-500">{p.deletedByName || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {p.deletedAt ? new Date(p.deletedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => restore(p._id)}
                          className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 transition-colors whitespace-nowrap">
                          ↩ Restore
                        </button>
                        <button onClick={() => permanentDelete(p._id)}
                          className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 transition-colors">
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
