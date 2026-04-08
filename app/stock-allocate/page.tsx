'use client';

import { useEffect, useState, useCallback } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

interface SKU { qty: number; percent: number; allocated: number; }
interface Platform { name: string; icon: string; percent: number; allocated: number; skuExpanded: boolean; skus: SKU[]; color: string; }
interface AllocationResult { productName: string; totalQty: number; unit: string; platforms: { name: string; percent: number; allocated: number; skus: { qty: number; percent: number; allocated: number; }[]; }[]; date: string; }
interface HistoryItem { id: string; data: AllocationResult; }

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ2z8ormGR5j6hOONKUBhtGPPW8YLE-yOqC2iBSV_Il7xXwx_I6cinFRgQkBuyXjhmCPvEsQTppbFCD/pub?output=csv';

const defaultPlatforms: Platform[] = [
    { name: 'TikTok Shop', icon: '🎵', percent: 50, allocated: 0, skuExpanded: false, color: 'from-pink-500 to-rose-500', skus: [{ qty: 1, percent: 30, allocated: 0 }, { qty: 2, percent: 30, allocated: 0 }, { qty: 3, percent: 20, allocated: 0 }, { qty: 5, percent: 20, allocated: 0 }] },
    { name: 'Shopee', icon: '🛒', percent: 30, allocated: 0, skuExpanded: false, color: 'from-orange-500 to-red-500', skus: [{ qty: 1, percent: 30, allocated: 0 }, { qty: 2, percent: 30, allocated: 0 }, { qty: 3, percent: 20, allocated: 0 }, { qty: 5, percent: 20, allocated: 0 }] },
    { name: 'Lazada', icon: '🛍️', percent: 20, allocated: 0, skuExpanded: false, color: 'from-blue-500 to-indigo-500', skus: [{ qty: 1, percent: 30, allocated: 0 }, { qty: 2, percent: 30, allocated: 0 }, { qty: 3, percent: 20, allocated: 0 }, { qty: 5, percent: 20, allocated: 0 }] },
];

export default function StockAllocatePage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
    const [productName, setProductName] = useState('');
    const [totalQty, setTotalQty] = useState<number>(0);
    const [unit, setUnit] = useState('หลอด');
    const [platforms, setPlatforms] = useState<Platform[]>(JSON.parse(JSON.stringify(defaultPlatforms)));
    const [result, setResult] = useState<AllocationResult | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [sheetProducts, setSheetProducts] = useState<{ name: string; qty: number }[]>([]);
    const [sheetLoading, setSheetLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchUser();
        const h = localStorage.getItem('stockHistory');
        if (h) try { setHistory(JSON.parse(h)); } catch (e) { }
    }, []);

    const fetchUser = async () => { try { const r = await fetch('/api/auth/me'); if (r.ok) setCurrentUser(await r.json()); } catch (e) { } };
    const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
    const totalPercent = platforms.reduce((s, p) => s + p.percent, 0);

    const updatePlatform = (idx: number, field: string, val: any) => { setPlatforms(prev => { const n = [...prev]; n[idx] = { ...n[idx], [field]: val }; return n; }); };
    const updateSKU = (pIdx: number, sIdx: number, field: string, val: number) => { setPlatforms(prev => { const n = JSON.parse(JSON.stringify(prev)); n[pIdx].skus[sIdx][field] = val; return n; }); };
    const addSKU = (pIdx: number) => { setPlatforms(prev => { const n = JSON.parse(JSON.stringify(prev)); n[pIdx].skus.push({ qty: 1, percent: 0, allocated: 0 }); return n; }); };
    const removeSKU = (pIdx: number, sIdx: number) => { setPlatforms(prev => { const n = JSON.parse(JSON.stringify(prev)); n[pIdx].skus.splice(sIdx, 1); return n; }); };

    const calculate = () => {
        if (!productName.trim()) { showToast('กรุณากรอกชื่อสินค้า', 'error'); return; }
        if (totalQty <= 0) { showToast('กรุณากรอกจำนวนสินค้า', 'error'); return; }
        if (totalPercent !== 100) { showToast('เปอร์เซ็นต์รวมต้องเท่ากับ 100%', 'error'); return; }
        const newPlatforms = platforms.map(p => {
            const allocated = Math.floor(totalQty * p.percent / 100);
            const skuTotal = p.skus.reduce((s, sk) => s + sk.percent, 0);
            const skus = p.skus.map(sk => ({ qty: sk.qty, percent: sk.percent, allocated: skuTotal > 0 ? Math.floor(allocated * sk.percent / skuTotal / sk.qty) : 0 }));
            return { ...p, allocated, skus };
        });
        setPlatforms(newPlatforms);
        const res: AllocationResult = { productName, totalQty, unit, platforms: newPlatforms.map(p => ({ name: p.name, percent: p.percent, allocated: p.allocated, skus: p.skus })), date: new Date().toLocaleString('th-TH') };
        setResult(res); showToast('คำนวณเรียบร้อย!');
    };

    const saveToHistory = () => { if (!result) return; const item: HistoryItem = { id: Date.now().toString(), data: result }; const newH = [item, ...history]; setHistory(newH); localStorage.setItem('stockHistory', JSON.stringify(newH)); showToast('บันทึกประวัติสำเร็จ!'); };
    const deleteHistoryItem = (id: string) => { const newH = history.filter(h => h.id !== id); setHistory(newH); localStorage.setItem('stockHistory', JSON.stringify(newH)); };
    const clearHistory = () => { if (!confirm('ต้องการล้างประวัติทั้งหมด?')) return; setHistory([]); localStorage.removeItem('stockHistory'); showToast('ล้างประวัติแล้ว'); };
    const loadHistory = (data: AllocationResult) => { setProductName(data.productName); setTotalQty(data.totalQty); setUnit(data.unit); setPlatforms(data.platforms.map((p, i) => ({ ...defaultPlatforms[i], ...p, skuExpanded: false }))); setResult(data); showToast('โหลดข้อมูลแล้ว'); };
    const copyResults = () => { if (!result) return; let text = `📦 ${result.productName}\n📊 จำนวนรวม: ${result.totalQty.toLocaleString()} ${result.unit}\n\n`; result.platforms.forEach(p => { text += `${p.name}: ${p.allocated.toLocaleString()} ${result.unit} (${p.percent}%)\n`; p.skus.forEach(s => { text += `  SKU ${s.qty}${result.unit}: ${s.allocated.toLocaleString()} ชุด\n`; }); text += '\n'; }); navigator.clipboard.writeText(text).then(() => showToast('คัดลอกแล้ว!')); };

    const loadSheet = async () => {
        setSheetLoading(true);
        try {
            const res = await fetch(GOOGLE_SHEET_CSV_URL); const csv = await res.text(); const lines = csv.split('\n').filter(l => l.trim());
            const products: { name: string; qty: number }[] = [];
            for (let i = 1; i < lines.length; i++) { const cols = lines[i].split(','); if (cols.length >= 7 && cols[2]?.trim()) { const name = cols[2].trim().replace(/"/g, ''); const qty = parseInt(cols[6]?.trim().replace(/"/g, '')) || 0; if (name && qty > 0) products.push({ name, qty }); } }
            setSheetProducts(products); showToast(`โหลดข้อมูลจาก Google Sheet สำเร็จ (${products.length} รายการ)`);
        } catch (e) { showToast('ไม่สามารถโหลดข้อมูลได้', 'error'); } finally { setSheetLoading(false); }
    };

    const applyProduct = (p: { name: string; qty: number }) => { setProductName(p.name); setTotalQty(p.qty); showToast(`เลือก ${p.name} (${p.qty.toLocaleString()})`); };
    const fmtNum = (n: number) => n.toLocaleString();

    // Shared dark card class
    const card = "bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-black/20 p-6 mb-6 border border-white/30 dark:border-white/[0.08]";
    const input = "w-full px-4 py-3 border-2 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
    const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-6xl mx-auto">
                    {/* Toast */}
                    {toast && (<div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-white animate-slideUp ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>{toast.msg}</div>)}

                    {/* Header */}
                    <div className={card}>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl">📦</div>
                            <div>
                                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Stock Allocate Ecommerce</h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">ระบบจัดสรรสินค้าให้แต่ละแพลตฟอร์ม</p>
                            </div>
                        </div>
                    </div>

                    {/* Google Sheet */}
                    <div className={card}>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xl">📊</span>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">โหลดจาก Google Sheet</h2>
                            <button onClick={loadSheet} disabled={sheetLoading} className="ml-auto px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50">{sheetLoading ? 'กำลังโหลด...' : '🔄 โหลดข้อมูล'}</button>
                        </div>
                        {sheetProducts.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {sheetProducts.map((p, i) => (
                                    <button key={i} onClick={() => applyProduct(p)} className="text-left px-4 py-3 bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/30 transition-all text-sm">
                                        <div className="font-bold text-gray-800 dark:text-white truncate">{p.name}</div>
                                        <div className="text-gray-500 dark:text-gray-400 text-xs">{p.qty.toLocaleString()} ชิ้น</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Input */}
                    <div className={card}>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">🏷️ ข้อมูลสินค้า</h2>
                        <div className="mb-4"><label className={labelCls}>ชื่อสินค้า</label><input value={productName} onChange={e => setProductName(e.target.value)} className={input} placeholder="เช่น ดีดีครีมแตง" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className={labelCls}>จำนวนทั้งหมด</label><input type="number" value={totalQty || ''} onChange={e => setTotalQty(parseInt(e.target.value) || 0)} className={input} placeholder="1000" /></div>
                            <div><label className={labelCls}>หน่วย</label><input value={unit} onChange={e => setUnit(e.target.value)} className={input} /></div>
                        </div>
                    </div>

                    {/* Platform Allocation */}
                    <div className={card}>
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">📊 กำหนดเปอร์เซ็นต์</h2>
                        <div className={`mb-4 text-center text-xl font-bold ${totalPercent === 100 ? 'text-green-600' : 'text-red-600'}`}>รวม: {totalPercent}% {totalPercent === 100 ? '✅' : '❌'}</div>
                        <div className="space-y-4">
                            {platforms.map((p, pIdx) => (
                                <div key={pIdx} className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl p-5 border border-gray-200 dark:border-white/[0.08]">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 bg-gradient-to-br ${p.color} rounded-xl flex items-center justify-center text-xl shadow-lg`}>{p.icon}</div>
                                        <h3 className="font-bold text-gray-800 dark:text-white flex-1">{p.name}</h3>
                                        <button onClick={() => updatePlatform(pIdx, 'skuExpanded', !p.skuExpanded)} className="px-3 py-1 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors">{p.skuExpanded ? '▲' : '▼'} SKU</button>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="100" value={p.percent} onChange={e => updatePlatform(pIdx, 'percent', parseInt(e.target.value))} className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                                        <div className="flex items-center gap-1 min-w-[80px]">
                                            <input type="number" min="0" max="100" value={p.percent} onChange={e => updatePlatform(pIdx, 'percent', parseInt(e.target.value) || 0)} className="w-16 px-2 py-1 border border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-lg text-center font-bold" />
                                            <span className="font-bold text-gray-600 dark:text-gray-400">%</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">จัดสรร: <span className="font-bold text-gray-900 dark:text-white">{fmtNum(Math.floor(totalQty * p.percent / 100))}</span> {unit}</div>
                                    {p.skuExpanded && (
                                        <div className="mt-4 bg-white dark:bg-white/[0.04] rounded-xl p-4 border border-gray-200 dark:border-white/[0.08]">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">🏷️ SKU แบ่งตามจำนวน</h4>
                                                <span className={`text-sm font-bold ${p.skus.reduce((s, sk) => s + sk.percent, 0) === 100 ? 'text-green-600' : 'text-orange-600'}`}>รวม: {p.skus.reduce((s, sk) => s + sk.percent, 0)}%</span>
                                            </div>
                                            <div className="space-y-2">
                                                {p.skus.map((sk, sIdx) => {
                                                    const platformAlloc = Math.floor(totalQty * p.percent / 100);
                                                    const skuTotal = p.skus.reduce((s, sk) => s + sk.percent, 0);
                                                    const skuAlloc = skuTotal > 0 ? Math.floor(platformAlloc * sk.percent / skuTotal / sk.qty) : 0;
                                                    return (
                                                        <div key={sIdx} className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.04] rounded-lg p-2">
                                                            <div className="flex items-center gap-1 min-w-[80px]"><input type="number" min="1" value={sk.qty} onChange={e => updateSKU(pIdx, sIdx, 'qty', parseInt(e.target.value) || 1)} className="w-14 px-2 py-1 border border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded text-center text-sm" /><span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span></div>
                                                            <div className="flex items-center gap-1"><input type="number" min="0" max="100" value={sk.percent} onChange={e => updateSKU(pIdx, sIdx, 'percent', parseInt(e.target.value) || 0)} className="w-14 px-2 py-1 border border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded text-center text-sm" /><span className="text-xs text-gray-500 dark:text-gray-400">%</span></div>
                                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-1 text-right">{fmtNum(skuAlloc)} ชุด</span>
                                                            {sIdx >= 3 && <button onClick={() => removeSKU(pIdx, sIdx)} className="text-red-400 hover:text-red-600 text-lg">✕</button>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button onClick={() => addSKU(pIdx)} className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500/30 transition-colors font-medium text-sm">+ เพิ่ม SKU</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button onClick={calculate} className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/25 transition-all transform hover:scale-[1.02]">✨ คำนวณการจัดสรร</button>
                    </div>

                    {/* Results */}
                    {result && (
                        <div className={`${card} animate-slideUp`}>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">📋 สรุปผลการจัดสรร</h2>
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-4 text-white mb-4">
                                <div className="text-xl font-bold">{result.productName}</div>
                                <div className="text-blue-100">จำนวนรวม: {fmtNum(result.totalQty)} {result.unit}</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {result.platforms.map((p, i) => (
                                    <div key={i} className={`bg-gradient-to-br ${platforms[i]?.color || 'from-gray-500 to-gray-600'} rounded-2xl p-4 text-white shadow-lg`}>
                                        <div className="text-2xl mb-1">{platforms[i]?.icon}</div>
                                        <div className="font-bold text-lg">{p.name}</div>
                                        <div className="text-3xl font-extrabold">{fmtNum(p.allocated)}</div>
                                        <div className="text-sm opacity-80">{p.percent}% | {result.unit}</div>
                                        {p.skus.length > 0 && (<div className="mt-2 pt-2 border-t border-white/30 space-y-1">{p.skus.map((s, j) => (<div key={j} className="flex justify-between text-xs"><span>SKU {s.qty}{result.unit}</span><span className="font-bold">{fmtNum(s.allocated)} ชุด</span></div>))}</div>)}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={copyResults} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl font-bold text-gray-700 dark:text-gray-300 transition-colors">📋 คัดลอก</button>
                                <button onClick={() => window.print()} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-xl font-bold text-gray-700 dark:text-gray-300 transition-colors">🖨️ พิมพ์</button>
                                <button onClick={saveToHistory} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all">💾 บันทึก</button>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    <div className={card}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">📚 ประวัติ ({history.length})</h2>
                            {history.length > 0 && <button onClick={clearHistory} className="text-red-500 hover:text-red-700 text-sm font-bold">🗑️ ล้างทั้งหมด</button>}
                        </div>
                        {history.length === 0 ? (
                            <p className="text-gray-400 text-center py-8">ยังไม่มีประวัติ</p>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                                {history.map(h => (
                                    <div key={h.id} className="flex items-center gap-3 bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 border border-gray-200 dark:border-white/[0.08] hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors">
                                        <div className="flex-1 cursor-pointer" onClick={() => loadHistory(h.data)}>
                                            <div className="font-bold text-gray-800 dark:text-white text-sm">{h.data.productName}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{h.data.totalQty.toLocaleString()} {h.data.unit} | {h.data.date}</div>
                                        </div>
                                        <button onClick={() => deleteHistoryItem(h.id)} className="text-red-400 hover:text-red-600">✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
