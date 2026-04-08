'use client';

import { useEffect, useState, useRef } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Asset { id: number; name: string; caretaker: string; purchase_cost: number; }
interface CaretakerSummary { caretaker: string; count: number; totalValue: number; assets: Asset[]; }

export default function SummaryPage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<CaretakerSummary[]>([]);
    const pdfRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchCurrentUser(); fetchAssets();
    }, []);

    const fetchCurrentUser = async () => { try { const r = await fetch('/api/auth/me'); if (r.ok) setCurrentUser(await r.json()); } catch (e) { console.error(e); } };
    const fetchAssets = async () => { try { const r = await fetch('/api/assets-sheets'); setAssets(await r.json()); } catch (e) { console.error(e); } finally { setLoading(false); } };

    useEffect(() => {
        const m = new Map<string, CaretakerSummary>();
        assets.forEach(a => { const c = a.caretaker || 'ไม่ระบุ'; if (!m.has(c)) m.set(c, { caretaker: c, count: 0, totalValue: 0, assets: [] }); const s = m.get(c)!; s.count++; s.totalValue += a.purchase_cost || 0; s.assets.push(a); });
        setSummary(Array.from(m.values()).sort((a, b) => b.count - a.count));
    }, [assets]);

    const fmtC = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n);
    const fmtN = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

    const exportToPDF = async () => {
        if (!pdfRef.current) return;
        const el = document.createElement('div');
        el.textContent = 'กำลังสร้าง PDF...';
        Object.assign(el.style, { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(0,0,0,.8)', color: '#fff', padding: '20px', borderRadius: '10px', zIndex: '9999' });
        document.body.appendChild(el);
        try {
            const orig = { p: pdfRef.current.style.position, l: pdfRef.current.style.left, w: pdfRef.current.style.width, v: pdfRef.current.style.visibility, d: pdfRef.current.style.display };
            Object.assign(pdfRef.current.style, { position: 'relative', left: '0', width: '210mm', visibility: 'visible', display: 'block' });
            await new Promise(r => setTimeout(r, 150));
            const pages = Array.from(pdfRef.current.querySelectorAll('.pdf-page')) as HTMLElement[];
            if (!pages.length) throw new Error('No pages');
            const doc = new jsPDF('p', 'mm', 'a4');
            for (let i = 0; i < pages.length; i++) {
                const pg = pages[i];
                const pv = { v: pg.style.visibility, d: pg.style.display, p: pg.style.position, l: pg.style.left, w: pg.style.width, b: pg.style.background };
                Object.assign(pg.style, { visibility: 'visible', display: 'block', position: 'relative', left: '0', width: '210mm', background: '#fff' });
                await new Promise(r => setTimeout(r, 50));
                const cv = await html2canvas(pg, { scale: 2, useCORS: true, backgroundColor: '#fff', logging: false });
                Object.assign(pg.style, { visibility: pv.v, display: pv.d, position: pv.p, left: pv.l, width: pv.w, background: pv.b });
                const img = cv.toDataURL('image/png'), ww = 210; let hh = (cv.height * ww) / cv.width, x = 0, y = 0;
                if (hh > 297) { const s = 297 / hh; hh = 297; const nw = ww * s; x = (210 - nw) / 2; doc.addImage(img, 'PNG', x, y, nw, hh); }
                else { y = (297 - hh) / 2; doc.addImage(img, 'PNG', x, y, ww, hh); }
                if (i < pages.length - 1) doc.addPage();
            }
            Object.assign(pdfRef.current.style, { position: orig.p || 'absolute', left: orig.l || '-9999px', width: orig.w || '210mm', visibility: orig.v || 'hidden', display: orig.d || 'none' });
            doc.save(`สรุปรวมทรัพย์สิน_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err: any) {
            if (pdfRef.current) Object.assign(pdfRef.current.style, { position: 'absolute', left: '-9999px', width: '210mm', visibility: 'hidden', display: 'none' });
            alert(`Error: ${err?.message || 'Unknown'}`);
        } finally { if (el.parentNode) document.body.removeChild(el); }
    };

    const totalAssets = assets.length, totalValue = assets.reduce((s, a) => s + (a.purchase_cost || 0), 0);

    if (loading) return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center"><div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-indigo-800 border-t-blue-600 dark:border-t-indigo-400 mb-4"></div><p className="text-gray-600 dark:text-gray-400 text-lg font-semibold">กำลังโหลด...</p></div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                <div className="p-8 relative">
                    {/* Hidden PDF content */}
                    <div ref={pdfRef} style={{ position: 'absolute', left: '-9999px', width: '210mm', visibility: 'hidden', display: 'none' }}>
                        <div className="pdf-page" style={{ padding: '20px 40px', backgroundColor: '#fff', fontFamily: 'Arial' }}>
                            <div style={{ textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '15px', marginBottom: '20px' }}>
                                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e40af' }}>สรุปรวมทรัพย์สิน</h1>
                                <p style={{ fontSize: '12px', color: '#666' }}>วันที่: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '10px' }}>
                                <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>{totalAssets}</div><div style={{ fontSize: '12px', color: '#666' }}>ทรัพย์สินทั้งหมด</div></div>
                                <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>{fmtN(totalValue)} บาท</div><div style={{ fontSize: '12px', color: '#666' }}>มูลค่ารวม</div></div>
                            </div>
                        </div>
                        {summary.map(item => (
                            <div key={item.caretaker} className="pdf-page" style={{ padding: '20px 40px', backgroundColor: '#fff', fontFamily: 'Arial' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e40af', textAlign: 'center', borderBottom: '2px solid #1e40af', paddingBottom: '12px', marginBottom: '16px' }}>ผู้ดูแล: {item.caretaker}</h2>
                                <div style={{ fontSize: '14px', marginBottom: '6px' }}><strong>จำนวน:</strong> {item.count} | <strong>มูลค่า:</strong> {fmtN(item.totalValue)} บาท</div>
                                <div style={{ fontSize: '12px', lineHeight: 1.8 }}>{item.assets.map((a, i) => <div key={a.id}>{i + 1}. {a.name} - {fmtN(a.purchase_cost || 0)} บาท</div>)}</div>
                            </div>
                        ))}
                    </div>

                    {/* Visible */}
                    <div className="relative z-10 animate-fadeIn">
                        <div className="bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 p-8 mb-8 border border-white/30 dark:border-white/[0.08]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">สรุปรวมทรัพย์สิน</h1>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">สรุปตามผู้ดูแล</p>
                                    </div>
                                </div>
                                {summary.length > 0 && (
                                    <button onClick={exportToPDF} className="bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transition-all hover:scale-105 flex items-center gap-2">📄 Export PDF</button>
                                )}
                            </div>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl p-6 text-white shadow-xl"><div className="text-5xl font-extrabold mb-2">{totalAssets}</div><div className="text-blue-100 text-sm font-semibold uppercase">ทรัพย์สินทั้งหมด</div></div>
                                <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl p-6 text-white shadow-xl"><div className="text-4xl font-extrabold mb-2">{fmtC(totalValue)}</div><div className="text-emerald-100 text-sm font-semibold uppercase">มูลค่ารวม</div></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {summary.map((item, i) => (
                                <div key={item.caretaker} className="group bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-black/20 p-6 border border-white/30 dark:border-white/[0.08] hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 animate-slideUp" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl group-hover:rotate-12 transition-transform">{item.caretaker.charAt(0).toUpperCase()}</div>
                                        <div><h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{item.caretaker}</h3><p className="text-sm text-gray-500 dark:text-gray-400">ผู้ดูแล</p></div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-lg"><div className="text-2xl font-extrabold">{item.count}</div><div className="text-xs text-blue-100 uppercase">จำนวน</div></div>
                                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-4 text-white shadow-lg"><div className="text-xl font-extrabold">{fmtC(item.totalValue)}</div><div className="text-xs text-emerald-100 uppercase">มูลค่า</div></div>
                                    </div>
                                    {item.assets.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-white/[0.06]">
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">รายการ ({item.assets.length})</div>
                                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                                {item.assets.map((a, j) => (
                                                    <div key={a.id} className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.04] rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                                                        <span className="w-5 h-5 bg-indigo-500 rounded text-white text-xs flex items-center justify-center font-bold">{j + 1}</span>
                                                        <span className="flex-1 truncate">{a.name}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{fmtN(a.purchase_cost || 0)}฿</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {summary.length === 0 && <div className="bg-white/90 dark:bg-white/[0.05] rounded-3xl shadow-2xl dark:shadow-black/20 p-16 text-center border border-white/30 dark:border-white/[0.08]"><div className="text-6xl mb-4">📊</div><h3 className="text-2xl font-bold text-gray-700 dark:text-white mb-2">ยังไม่มีข้อมูล</h3><p className="text-gray-500 dark:text-gray-400">เพิ่มทรัพย์สินเพื่อดูสรุป</p></div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
