import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import PaymentModal from '../components/dashboard/PaymentModal';
import StatsCards from '../components/dashboard/StatsCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WINGS = ['A','B','C','D','E','F'];

const statusColors = {
  paid:    'bg-green-500 hover:bg-green-600 text-white',
  unpaid:  'bg-red-500 hover:bg-red-600 text-white',
  overdue: 'bg-orange-500 hover:bg-orange-600 text-white',
  no_data: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flats, setFlats] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedWing, setSelectedWing] = useState(user?.role === 'wing_admin' ? user.wing : 'A');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalData, setModalData] = useState(null);
  const [exporting, setExporting] = useState('');

  // Inline owner-name editing state
  const [editingOwner, setEditingOwner] = useState(null); // { flatId, name }
  const [savingOwner, setSavingOwner] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flatsRes, statsRes] = await Promise.all([
        api.get('/flats/dashboard', { params: { wing: selectedWing, year } }),
        api.get('/payments/stats',  { params: { wing: selectedWing, year } })
      ]);
      setFlats(flatsRes.data.data || []);
      setStats(statsRes.data.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedWing, year]);

  // ── Owner name editing ──────────────────────────────────────────────────────
  const startEditOwner = (flat) => {
    setEditingOwner({ flatId: flat._id, name: flat.ownerName || '' });
  };

  const cancelEditOwner = () => setEditingOwner(null);

  const saveOwnerName = async () => {
    if (!editingOwner) return;
    setSavingOwner(true);
    try {
      await api.put(`/flats/${editingOwner.flatId}`, { ownerName: editingOwner.name.trim() });
      toast.success('Owner name updated');
      setEditingOwner(null);
      fetchData();
    } catch {
      toast.error('Failed to update owner name');
    } finally {
      setSavingOwner(false);
    }
  };

  // ── Export helpers (auth-safe — sends JWT via axios) ────────────────────────
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a  = document.createElement('a');
    a.href   = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const res = await api.get('/export/pdf', {
        params: { wing: selectedWing, year },
        responseType: 'blob'
      });
      downloadBlob(new Blob([res.data], { type: 'application/pdf' }),
        `society-report-${selectedWing}-${year}.pdf`);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setExporting('');
    }
  };

  const handleExportExcel = async () => {
    setExporting('excel');
    try {
      const res = await api.get('/export/csv', {
        params: { wing: selectedWing, year },
        responseType: 'blob'
      });
      downloadBlob(new Blob([res.data], { type: 'text/csv' }),
        `maintenance-${selectedWing}-${year}.csv`);
      toast.success('Excel/CSV downloaded');
    } catch {
      toast.error('Excel export failed');
    } finally {
      setExporting('');
    }
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filteredFlats = useMemo(() => {
    return flats.filter(flat => {
      const matchSearch = !search ||
        flat.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
        flat.ownerName?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filterStatus === 'all') return true;
      if (filterStatus === 'has_pending') return flat.pendingCount > 0;
      return Object.values(flat.monthStatuses).includes(filterStatus);
    });
  }, [flats, search, filterStatus]);

  const openModal = (flat, monthIndex) => {
    setModalData({ flat, month: monthIndex + 1, year, status: flat.monthStatuses[monthIndex + 1] });
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Track society maintenance payments</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Year selector */}
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="input-field w-28 py-1.5 text-sm">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* PDF export — uses axios with auth token */}
          <button
            onClick={handleExportPDF}
            disabled={exporting === 'pdf'}
            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1 disabled:opacity-60">
            {exporting === 'pdf' ? '⏳' : '📄'} PDF
          </button>

          {/* Excel/CSV export — uses axios with auth token */}
          <button
            onClick={handleExportExcel}
            disabled={exporting === 'excel'}
            className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1 disabled:opacity-60">
            {exporting === 'excel' ? '⏳' : '📊'} Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && <StatsCards stats={stats} />}

      {/* Chart */}
      {stats && <MonthlyChart data={stats.monthlyData} />}

      {/* Wing Tabs */}
      {user?.role === 'super_admin' && (
        <div className="flex gap-2 flex-wrap">
          {WINGS.map(w => (
            <button key={w} onClick={() => setSelectedWing(w)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedWing === w
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-400'
              }`}>
              Wing {w}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="🔍 Search flat or owner..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field flex-1" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="input-field w-full sm:w-48">
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
          <option value="has_pending">Has Pending</option>
        </select>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs flex-wrap">
        {[['paid','bg-green-500','Paid'],['unpaid','bg-red-500','Unpaid'],['overdue','bg-orange-500','Overdue'],['no_data','bg-gray-300','No Data']].map(([k,c,l]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${c}`}></div>
            <span className="text-gray-600 dark:text-gray-400">{l}</span>
          </div>
        ))}
        <span className="text-gray-400 dark:text-gray-500 ml-2">✏️ Click owner name to edit</span>
      </div>

      {/* Flats Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_,i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
        </div>
      ) : filteredFlats.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-gray-500 dark:text-gray-400">No flats found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Flat</th>
                  <th className="text-left px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">Owner</th>
                  {MONTHS.map(m => (
                    <th key={m} className="px-1 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center min-w-[36px]">{m}</th>
                  ))}
                  <th className="text-center px-3 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredFlats.map(flat => (
                  <tr key={flat._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <button onClick={() => navigate(`/flat/${flat._id}`)}
                        className="font-semibold text-primary-600 dark:text-primary-400 hover:underline whitespace-nowrap">
                        {flat.flatNumber}
                      </button>
                    </td>

                    {/* ── Inline owner-name cell ── */}
                    <td className="px-3 py-2 hidden sm:table-cell min-w-[160px]">
                      {editingOwner?.flatId === flat._id ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            className="input-field py-0.5 px-2 text-xs h-7 flex-1 min-w-0"
                            value={editingOwner.name}
                            onChange={e => setEditingOwner({ ...editingOwner, name: e.target.value })}
                            onKeyDown={e => { if (e.key === 'Enter') saveOwnerName(); if (e.key === 'Escape') cancelEditOwner(); }}
                            placeholder="Owner name"
                          />
                          <button onClick={saveOwnerName} disabled={savingOwner}
                            className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 transition-colors disabled:opacity-50">
                            {savingOwner ? '…' : '✓'}
                          </button>
                          <button onClick={cancelEditOwner}
                            className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded hover:bg-gray-200 transition-colors">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditOwner(flat)}
                          className="group flex items-center gap-1 text-left w-full max-w-[160px] truncate text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Click to edit owner name">
                          <span className="truncate">
                            {flat.ownerName || <span className="italic text-gray-400 dark:text-gray-500 text-xs">Add name…</span>}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-xs transition-opacity flex-shrink-0">✏️</span>
                        </button>
                      )}
                    </td>

                    {[...Array(12)].map((_,i) => {
                      const status = flat.monthStatuses[i+1] || 'no_data';
                      return (
                        <td key={i} className="px-1 py-2 text-center">
                          <button
                            onClick={() => openModal(flat, i)}
                            className={`w-8 h-7 rounded text-xs font-medium transition-all hover:scale-110 ${statusColors[status]}`}
                            title={`${flat.flatNumber} - ${MONTHS[i]}: ${status}`}>
                            {status === 'paid' ? '✓' : status === 'overdue' ? '!' : status === 'unpaid' ? '✗' : '–'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-center">
                      {flat.pendingCount > 0 ? (
                        <span className="badge-unpaid">{flat.pendingCount}m</span>
                      ) : (
                        <span className="badge-paid">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {modalData && (
        <PaymentModal data={modalData} onClose={() => setModalData(null)} onSaved={fetchData} />
      )}
    </div>
  );
}
