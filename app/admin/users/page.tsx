'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

interface User { id: number; username: string; name: string; role: string; }

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'user' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchCurrentUser(); fetchUsers();
    }, []);

    const fetchCurrentUser = async () => { try { const r = await fetch('/api/auth/me'); if (r.ok) setCurrentUser(await r.json()); } catch (e) { console.error(e); } };
    const fetchUsers = async () => {
        try {
            const r = await fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } });
            const data = await r.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSubmitting(true);
        try {
            if (editingUser) {
                const updateData: any = { ...formData };
                if (currentUser?.id === editingUser.id && currentUser?.role !== 'admin') delete updateData.role;
                const r = await fetch(`/api/users/${editingUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
                if (r.ok) { alert('แก้ไขสำเร็จ!'); setFormData({ username: '', password: '', name: '', role: 'user' }); setShowForm(false); setEditingUser(null); fetchUsers(); }
                else { const err = await r.json(); alert(err.error || 'เกิดข้อผิดพลาด'); }
            } else {
                const r = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                if (r.ok) { alert('เพิ่มผู้ใช้สำเร็จ!'); setFormData({ username: '', password: '', name: '', role: 'user' }); setShowForm(false); fetchUsers(); }
                else { const err = await r.json(); alert(err.error || 'เกิดข้อผิดพลาด'); }
            }
        } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการบันทึก'); } finally { setSubmitting(false); }
    };

    const handleEdit = (u: User) => { setEditingUser(u); setFormData({ username: u.username, password: '', name: u.name, role: u.role }); setShowForm(true); };
    const handleCancel = () => { setShowForm(false); setEditingUser(null); setFormData({ username: '', password: '', name: '', role: 'user' }); };
    const handleDelete = async (u: User) => {
        if (!confirm(`ต้องการลบ "${u.name}" (${u.username})?`)) return;
        try { const r = await fetch(`/api/users/${u.id}`, { method: 'DELETE' }); if (r.ok) { alert('ลบสำเร็จ!'); fetchUsers(); } else { const e = await r.json(); alert(e.error || 'Error'); } } catch (e) { alert('Error'); }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 flex items-center justify-center"><div className="text-center"><div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-indigo-800 border-t-blue-600 dark:border-t-indigo-400 mb-4"></div><p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">กำลังโหลด...</p></div></div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-4xl mx-auto">
                    <div className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 p-8 mb-6 border border-white/30 dark:border-white/[0.08]">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">👥 จัดการผู้ใช้</h1>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">เพิ่มและจัดการผู้ใช้ระบบ</p>
                            </div>
                            <button onClick={() => setShowForm(!showForm)} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">+ เพิ่มผู้ใช้</button>
                        </div>
                    </div>

                    {showForm && (
                        <div className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 p-8 mb-6 border border-white/30 dark:border-white/[0.08] animate-slideUp">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{editingUser ? '✏️ แก้ไขผู้ใช้' : '➕ เพิ่มผู้ใช้ใหม่'}</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">👤 Username *</label><input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="username" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🔑 Password {editingUser ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}</label><input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">📝 ชื่อ *</label><input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500" /></div>
                                {(currentUser?.role === 'admin' || !editingUser) && (
                                    <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">🏷️ สิทธิ์</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500"><option value="user">User</option><option value="admin">Admin</option></select></div>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={handleCancel} className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold">ยกเลิก</button>
                                    <button type="submit" disabled={submitting} className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50">{submitting ? (editingUser ? 'กำลังแก้ไข...' : 'กำลังเพิ่ม...') : (editingUser ? '💾 บันทึก' : '💾 เพิ่มผู้ใช้')}</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 border border-white/30 dark:border-white/[0.08] overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">รายชื่อผู้ใช้ ({users.length})</h2>
                            {users.length === 0 ? (
                                <div className="text-center py-12"><div className="text-6xl mb-4">👥</div><p className="text-gray-500 dark:text-gray-400 text-lg">ยังไม่มีผู้ใช้</p></div>
                            ) : (
                                <div className="space-y-3">
                                    {users.map(u => (
                                        <div key={u.id} className="bg-gradient-to-r from-white to-gray-50 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl p-6 shadow-lg dark:shadow-black/10 hover:shadow-xl transition-all border border-gray-100 dark:border-white/[0.06]">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">{u.name.charAt(0).toUpperCase()}</div>
                                                    <div><div className="font-bold text-lg text-gray-900 dark:text-white">{u.name}</div><div className="text-sm text-gray-600 dark:text-gray-400">@{u.username}</div></div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-4 py-2 rounded-xl font-semibold text-sm ${u.role === 'admin' ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700' : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'}`}>{u.role === 'admin' ? '👑 Admin' : '👤 User'}</span>
                                                    {(currentUser?.role === 'admin' || currentUser?.id === u.id) && <button onClick={() => handleEdit(u)} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:scale-105 transition-all">✏️ แก้ไข</button>}
                                                    {currentUser?.role === 'admin' && currentUser?.id !== u.id && <button onClick={() => handleDelete(u)} className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold text-sm shadow-lg hover:scale-105 transition-all">🗑️ ลบ</button>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
