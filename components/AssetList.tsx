'use client';

interface Asset {
    id: number; name: string; image_url?: string; description: string;
    purchase_cost: number; department_id: number; department_name: string; caretaker: string;
    usage_type: 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE';
    created_at: string;
}

interface AssetListProps {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
    onDelete: (id: number) => void;
}

const usageTypeLabels = { LIVE: 'LIVE', PRODUCTION: 'PRODUCTION', OTHER: 'OTHER', EDITOR: 'EDITOR', GRAPHIC: 'GRAPHIC', CREATIVE: 'CREATIVE' };

const usageTypeColors = {
    LIVE: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 dark:border-green-700',
    PRODUCTION: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-300 dark:border-blue-700',
    OTHER: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200 dark:from-gray-800/30 dark:to-slate-800/30 dark:text-gray-300 dark:border-gray-600',
    EDITOR: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:border-purple-700',
    GRAPHIC: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-300 dark:border-orange-700',
    CREATIVE: 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border border-teal-200 dark:from-teal-900/30 dark:to-cyan-900/30 dark:text-teal-300 dark:border-teal-700',
};

function normalizeUsageType(ut: string | undefined): keyof typeof usageTypeColors {
    const u = String(ut ?? 'OTHER').trim().toUpperCase();
    if (u in usageTypeColors) return u as keyof typeof usageTypeColors;
    return 'OTHER';
}

export default function AssetList({ assets, onEdit, onDelete }: AssetListProps) {
    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number.isFinite(amount) ? amount : 0);
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (assets.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="inline-block p-8 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl mb-6">
                    <div className="text-8xl mb-4 animate-bounce">📦</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">ยังไม่มีข้อมูลทรัพย์สิน</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg">คลิกปุ่ม &quot;เพิ่มทรัพย์สิน&quot; เพื่อเริ่มต้นบันทึกข้อมูล</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto p-6">
            <div className="min-w-full">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-1 mb-4">
                    <div className="bg-white dark:bg-[#0f0f2e] rounded-xl p-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <div className="col-span-1">🖼️ รูปภาพ</div>
                            <div className="col-span-2">📦 ชื่อทรัพย์สิน</div>
                            <div className="col-span-2">📝 รายละเอียด</div>
                            <div className="col-span-1">💰 ราคา</div>
                            <div className="col-span-1">🏢 แผนก</div>
                            <div className="col-span-1">👤 ผู้ดูแล</div>
                            <div className="col-span-1">🏷️ ประเภท</div>
                            <div className="col-span-1">📅 วันที่</div>
                            <div className="col-span-2">⚙️ การจัดการ</div>
                        </div>
                    </div>
                </div>

                {/* Table Body */}
                <div className="space-y-3">
                    {assets.map((asset, index) => (
                        <div key={asset.id}
                            className="bg-gradient-to-r from-white to-gray-50 dark:from-white/[0.04] dark:to-white/[0.02] rounded-2xl p-4 shadow-lg dark:shadow-black/10 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-white/[0.06] hover:border-indigo-300 dark:hover:border-indigo-500/30 transform hover:-translate-y-1"
                            style={{ animationDelay: `${index * 50}ms` }}>
                            <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1">
                                    {asset.image_url ? (
                                        <div className="relative group">
                                            <img src={asset.image_url} alt={asset.name}
                                                className="h-20 w-20 object-cover rounded-2xl border-2 border-gray-200 dark:border-white/10 shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110"
                                                onError={(e) => { e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect fill="%23e5e7eb" width="80" height="80" rx="16"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E'; }} />
                                        </div>
                                    ) : (
                                        <div className="h-20 w-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center border-2 border-gray-200 dark:border-white/10 shadow-sm">
                                            <span className="text-2xl">📷</span>
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2"><div className="font-bold text-gray-900 dark:text-white text-base mb-1">{asset.name}</div></div>
                                <div className="col-span-2"><div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{asset.description || <span className="text-gray-400 dark:text-gray-500 italic">ไม่มีรายละเอียด</span>}</div></div>
                                <div className="col-span-1"><div className="text-base font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{formatCurrency(asset.purchase_cost)}</div></div>
                                <div className="col-span-1"><div className="inline-block px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-semibold border border-blue-200 dark:border-blue-700">{asset.department_name}</div></div>
                                <div className="col-span-1"><div className="text-sm font-medium text-gray-700 dark:text-gray-300">{asset.caretaker}</div></div>
                                <div className="col-span-1"><span className={`px-3 py-2 inline-flex text-xs leading-5 font-bold rounded-xl shadow-md ${usageTypeColors[normalizeUsageType(asset.usage_type)]}`}>{usageTypeLabels[normalizeUsageType(asset.usage_type)]}</span></div>
                                <div className="col-span-1"><div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{formatDate(asset.created_at)}</div></div>
                                <div className="col-span-2">
                                    <div className="flex gap-2">
                                        <button onClick={() => onEdit(asset)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105">✏️ แก้ไข</button>
                                        <button onClick={() => onDelete(asset.id)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-105">🗑️ ลบ</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
