import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  // Simplified form — only the essentials
  const emptyForm = { name: '', username: '', password: '', wing: 'A' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats')
      ]);
      setUsers(uRes.data.data || []);
      setStats(sRes.data.data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, username: u.username, password: '', wing: u.wing || 'A' });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditUser(null); setForm(emptyForm); };

  const handleSave = async () => {
    if (!form.name.trim())     return toast.error('Full name is required');
    if (!form.username.trim()) return toast.error('Username (ID) is required');
    if (!editUser && !form.password) return toast.error('Password is required');

    try {
      const payload = {
        name:     form.name.trim(),
        username: form.username.trim().toLowerCase(),
        wing:     form.wing,
        role:     'wing_admin',               // new users are always wing admins
        ...(form.password ? { password: form.password } : {})
      };

      if (editUser) {
        await api.put(`/admin/users/${editUser._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/admin/users', payload);
        toast.success('User created');
      }
      closeForm();
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deactivated');
      loadData();
    } catch { toast.error('Failed'); }
  };

  const handleResetPassword = async (id) => {
    const pwd = prompt('Enter new password (min 6 chars):');
    if (!pwd || pwd.length < 6) { if (pwd !== null) toast.error('Password too short'); return; }
    try {
      await api.put(`/admin/users/${id}/reset-password`, { newPassword: pwd });
      toast.success('Password reset successfully');
    } catch { toast.error('Reset failed'); }
  };

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <button onClick={openCreate} className="btn-primary text-sm">+ Add User</button>
      </div>

      {/* Wing stats */}
      {stats && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Wing Summary — {new Date().getFullYear()}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Wing','Flats','Paid','Unpaid','Overdue','Collected'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {stats.wingStats?.map(w => (
                  <tr key={w.wing} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-bold text-primary-600">Wing {w.wing}</td>
                    <td className="px-4 py-3">{w.flats}</td>
                    <td className="px-4 py-3 text-green-600 dark:text-green-400">{w.paid}</td>
                    <td className="px-4 py-3 text-red-600 dark:text-red-400">{w.unpaid}</td>
                    <td className="px-4 py-3 text-orange-600 dark:text-orange-400">{w.overdue}</td>
                    <td className="px-4 py-3 font-semibold">₹{w.collected.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3">{stats.totalFlats}</td>
                  <td colSpan={3}></td>
                  <td className="px-4 py-3 text-primary-600">₹{stats.totalCollected?.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users list */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">System Users</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Name','User ID (Username)','Role','Wing','Status','Seeded / Created','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{u.username}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {u.role === 'super_admin' ? '🔐 Super Admin' : '🏠 Wing Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{u.wing ? `Wing ${u.wing}` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={u.isActive ? 'badge-paid' : 'badge-unpaid'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Seed time = createdAt */}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(u)}
                          className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleResetPassword(u._id)}
                          className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-200 transition-colors">
                          Reset Pwd
                        </button>
                        {u.role !== 'super_admin' && (
                          <button onClick={() => handleDelete(u._id)}
                            className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded hover:bg-red-200 transition-colors">
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Minimal user form modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-1">{editUser ? 'Edit User' : 'Add Wing Admin'}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              {editUser ? 'Update name, username, or wing.' : 'New user will be created as a Wing Admin.'}
            </p>

            <div className="space-y-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Rajesh Patel"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Username / ID */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">User ID (Username) *</label>
                <input
                  className="input-field font-mono"
                  placeholder="e.g. winga"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g,'') })}
                />
              </div>

              {/* Password — only on create, or if editing wants to change */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Password {editUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder={editUser ? 'Leave blank to keep current' : 'Min 6 characters'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>

              {/* Wing */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Assigned Wing *</label>
                <select
                  className="input-field"
                  value={form.wing}
                  onChange={e => setForm({ ...form, wing: e.target.value })}>
                  {['A','B','C','D','E','F'].map(w => (
                    <option key={w} value={w}>Wing {w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={closeForm} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1">
                {editUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
