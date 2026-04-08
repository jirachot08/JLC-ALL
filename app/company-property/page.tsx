'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import AssetList from '@/components/AssetList';
import AssetForm from '@/components/AssetForm';

interface Asset {
    id: number; name: string; image_url?: string; description: string;
    purchase_cost: number; department_id: number; department_name: string;
    caretaker: string; usage_type: 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE';
    created_at: string;
}
interface Department { id: number; name: string; }

export default function CompanyPropertyPage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string; username: string } | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterUsageType, setFilterUsageType] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchCurrentUser(); fetchAssets(); fetchDepartments();
    }, []);

    const fetchCurrentUser = async () => { try { const r = await fetch('/api/auth/me'); if (r.ok) setCurrentUser(await r.json()); } catch (e) { console.error(e); } };
    const fetchAssets = async () => {
        try {
            const r = await fetch('/api/assets-sheets');
            const data = await r.json();
            setAssets(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); setAssets([]); } finally { setLoading(false); }
    };
    const fetchDepartments = async () => {
        try {
            const r = await fetch('/api/departments-sheets');
            const data = await r.json();
            setDepartments(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); setDepartments([]); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('คุณต้องการลบทรัพย์สินนี้ใช่หรือไม่?')) return;
        try { const r = await fetch(`/api/assets-sheets/${id}`, { method: 'DELETE' }); if (r.ok) fetchAssets(); else alert('เกิดข้อผิดพลาดในการลบข้อมูล'); } catch (e) { console.error(e); alert('เกิดข้อผิดพลาดในการลบข้อมูล'); }
    };
    const handleEdit = (asset: Asset) => { setEditingAsset(asset); setShowForm(true); };
    const handleFormSuccess = () => { setShowForm(false); setEditingAsset(null); fetchAssets(); };

    const filteredAssets = assets.filter((asset) => {
        const matchesSearch = !searchTerm || (asset.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (asset.caretaker ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || ((asset.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept = !filterDepartment || asset.department_name === filterDepartment;
        const matchesUsage = !filterUsageType || asset.usage_type === filterUsageType;
        return matchesSearch && matchesDept && matchesUsage;
    });

    if (loading) return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-indigo-800 border-t-blue-600 dark:border-t-indigo-400 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">กำลังโหลดข้อมูลทรัพย์สิน...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    {/* Header */}
                    <div className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 p-8 mb-8 border border-white/30 dark:border-white/[0.08] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                            <div>
                                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">🏢 ทรัพย์สินบริษัท</h1>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">จัดการข้อมูลทรัพย์สินของบริษัท ({assets.length} รายการ)</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <a href="/company-property/summary"
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white rounded-2xl shadow-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2">
                                    📊 สรุปทรัพย์สินบริษัท
                                </a>
                                <button onClick={() => { setEditingAsset(null); setShowForm(true); }}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105">
                                    ➕ เพิ่มทรัพย์สิน
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            <input type="text" placeholder="🔍 ค้นหาชื่อ, ผู้ดูแล, รายละเอียด..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="px-4 py-3 border-2 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
                            <select value={filterDepartment} onChange={(e) => setFilterDepartment(e.target.value)}
                                className="px-4 py-3 border-2 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white [&>option]:text-black">
                                <option value="">🏢 ทุกแผนก</option>
                                {departments.map((dept) => (<option key={dept.id} value={dept.name}>{dept.name}</option>))}
                            </select>
                            <select value={filterUsageType} onChange={(e) => setFilterUsageType(e.target.value)}
                                className="px-4 py-3 border-2 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white [&>option]:text-black">
                                <option value="">🏷️ ทุกประเภท</option>
                                <option value="LIVE">🟢 LIVE</option>
                                <option value="PRODUCTION">🔵 PRODUCTION</option>
                                <option value="OTHER">⚪ OTHER</option>
                                <option value="EDITOR">🟣 EDITOR</option>
                                <option value="GRAPHIC">🎨 GRAPHIC</option>
                                <option value="CREATIVE">✨ CREATIVE</option>
                            </select>
                        </div>
                    </div>

                    {/* Asset List */}
                    <div className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 border border-white/30 dark:border-white/[0.08] overflow-hidden">
                        <AssetList assets={filteredAssets} onEdit={handleEdit} onDelete={handleDelete} />
                    </div>
                </div>
            </div>

            {showForm && (
                <AssetForm departments={departments} asset={editingAsset} onClose={() => { setShowForm(false); setEditingAsset(null); }} onSuccess={handleFormSuccess} />
            )}
        </div>
    );
}
