'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import { useTheme } from '@/components/ThemeProvider';

interface KOLEvent {
    id: number; date: string; month: string; agency: string; accountName: string;
    originalDate: string; days: string; product: string; linkPost: string;
    codeExpire: string; statusCodeExpire: string; expireDaysCode: string;
}
interface DayCell {
    date: number; fullDate: Date; isCurrentMonth: boolean; isToday: boolean; events: KOLEvent[];
}

const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const DAYS_OF_WEEK = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function parsePostDate(pd: string): string | null {
    if (!pd || !pd.includes('/')) return null;
    try {
        const p = pd.split('/');
        if (p.length !== 3) return null;
        const d = p[0].padStart(2, '0'), m = p[1].padStart(2, '0');
        let y = parseInt(p[2]);
        if (p[2].length === 2) y = Math.floor(new Date().getFullYear() / 100) * 100 + y;
        const f = `${y}-${m}-${d}`;
        const td = new Date(f);
        if (td.getFullYear() == y && td.getMonth() == parseInt(m) - 1 && td.getDate() == parseInt(d)) return f;
        return null;
    } catch { return null; }
}

function parseCSV(csv: string): string[][] {
    const lines = csv.split('\n'), result: string[][] = [];
    for (const line of lines) {
        if (!line.trim()) continue;
        const row: string[] = []; let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') inQ = !inQ;
            else if (c === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
            else cur += c;
        }
        row.push(cur.trim()); result.push(row);
    }
    return result;
}

export default function CalendaKOLPage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [events, setEvents] = useState<KOLEvent[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sheetId, setSheetId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastSync, setLastSync] = useState('');
    const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
    const { isDark } = useTheme();

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchUser();
        const s = localStorage.getItem('kolSheetId');
        if (s) setSheetId(s);
    }, []);

    useEffect(() => { if (sheetId && events.length === 0) syncSheet(); }, [sheetId]);

    const fetchUser = async () => { try { const r = await fetch('/api/auth/me'); if (r.ok) setCurrentUser(await r.json()); } catch { } };

    const syncSheet = async () => {
        let id = sheetId.trim();
        if (!id) return;
        if (id.includes('docs.google.com')) { const m = id.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/); if (m) id = m[1]; }
        setIsLoading(true);
        localStorage.setItem('kolSheetId', sheetId);
        try {
            const res = await fetch(`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=0`);
            const csv = await res.text();
            const data = parseCSV(csv);
            const newEvents: KOLEvent[] = [];
            if (data.length > 1) {
                for (let i = 1; i < data.length; i++) {
                    const r = data[i];
                    if (r && r.length >= 4) {
                        const pd = r[3]?.trim();
                        if (pd) {
                            const d = parsePostDate(pd);
                            if (d) newEvents.push({ id: i, date: d, month: r[0] || '', agency: r[1] || 'ไม่ระบุ', accountName: r[2] || '', originalDate: pd, days: r[4] || '', product: r[5] || '', linkPost: r[6] || '', codeExpire: r[7] || '', statusCodeExpire: r[8] || '', expireDaysCode: r[9] || '' });
                        }
                    }
                }
            }
            setEvents(newEvents);
            setLastSync(new Date().toLocaleString('th-TH'));
        } catch (err: any) {
            alert('เกิดข้อผิดพลาด: ' + err.message);
        } finally { setIsLoading(false); }
    };

    const searchResults = searchTerm ? events.filter(e =>
        e.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.product.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

    const getCalendarDays = (): DayCell[] => {
        const year = 2025, firstDay = new Date(year, currentMonth, 1);
        const start = new Date(firstDay); start.setDate(start.getDate() - firstDay.getDay());
        const today = new Date(), days: DayCell[] = [], src = searchTerm ? searchResults : events;
        for (let i = 0; i < 42; i++) {
            const cd = new Date(start); cd.setDate(start.getDate() + i);
            const de = src.filter(e => new Date(e.date).toDateString() === cd.toDateString());
            days.push({ date: cd.getDate(), fullDate: new Date(cd), isCurrentMonth: cd.getMonth() === currentMonth, isToday: cd.toDateString() === today.toDateString(), events: de });
        }
        return days;
    };

    const statusColor = (s: string) => { const l = s?.toLowerCase() || ''; return l.includes('active') ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700' : l.includes('expired') ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700' : l.includes('pending') ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'; };
    const expireColor = (d: string) => { const n = parseInt(d); return n <= 3 ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400' : n <= 7 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'; };

    const jumpToEvent = (ev: KOLEvent) => {
        const d = new Date(ev.date); setCurrentMonth(d.getMonth()); setSearchTerm('');
        setSelectedDay({ date: d.getDate(), fullDate: d, isCurrentMonth: true, isToday: d.toDateString() === new Date().toDateString(), events: [ev] });
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors duration-300">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                {/* Ambient blobs */}
                <div className={`fixed top-20 right-10 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none ${isDark ? 'bg-amber-500/5' : 'bg-amber-300/5'}`} />
                <div className={`fixed bottom-10 left-1/3 w-[300px] h-[300px] rounded-full blur-[100px] pointer-events-none ${isDark ? 'bg-orange-500/5' : 'bg-orange-300/5'}`} />

                <div className="relative p-8 max-w-[1400px] mx-auto">
                    {/* Header */}
                    <div className="mb-6 animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">📅 Calenda KOL</h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">Jula&apos;s Herb — ปฏิทิน KOL พ.ศ. 2568</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="glass-card rounded-2xl px-4 py-2">
                                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{events.length}</span>
                                    <span className="text-xs text-gray-400 ml-1">กิจกรรม</span>
                                </div>
                                {lastSync && (
                                    <div className="glass-card rounded-2xl px-4 py-2">
                                        <span className="text-xs text-gray-400">ซิงก์: </span>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{lastSync}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="glass-card rounded-3xl p-5 mb-6 animate-slideUp">
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 w-full">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </div>
                                    <input type="text" value={sheetId} onChange={e => setSheetId(e.target.value)} placeholder="Google Sheets ID หรือ URL"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm text-gray-900 dark:text-white" />
                                </div>
                                <button onClick={syncSheet} disabled={isLoading}
                                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 whitespace-nowrap">
                                    {isLoading ? '⏳ โหลด...' : '🔄 ซิงก์'}
                                </button>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))} className="p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm min-w-[140px] text-center">
                                    {MONTHS[currentMonth]} 68
                                </div>
                                <button onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))} className="p-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="mt-3 flex items-center gap-2">
                            <div className="relative flex-1">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                </div>
                                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ค้นหา Agency, Account, Product..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 text-sm text-gray-900 dark:text-white" />
                            </div>
                            {searchTerm && (
                                <>
                                    <button onClick={() => setSearchTerm('')} className="p-2.5 bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400">✕</button>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{searchResults.length} รายการ</span>
                                </>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchTerm && searchResults.length > 0 && (
                            <div className="mt-3 bg-white dark:bg-[#1a1a2e] rounded-xl border border-gray-100 dark:border-white/10 max-h-60 overflow-y-auto custom-scrollbar shadow-lg">
                                {searchResults.slice(0, 10).map(ev => (
                                    <div key={ev.id} onClick={() => jumpToEvent(ev)} className="p-3 hover:bg-amber-50 dark:hover:bg-amber-500/10 cursor-pointer border-b border-gray-50 dark:border-white/5 last:border-0 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-gray-800 dark:text-gray-200 text-sm">{ev.agency}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{ev.accountName} · {ev.product}</div>
                                            </div>
                                            {ev.statusCodeExpire && <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold border ${statusColor(ev.statusCodeExpire)}`}>{ev.statusCodeExpire}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Legend */}
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full font-bold border border-emerald-200 dark:border-emerald-700">Active</span>
                            <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 rounded-full font-bold border border-red-200 dark:border-red-700">Expired</span>
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-full font-bold border border-amber-200 dark:border-amber-700">Pending</span>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="glass-card rounded-3xl overflow-hidden mb-8 animate-slideUp animation-delay-200">
                        {/* Week header */}
                        <div className="grid grid-cols-7 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500">
                            {DAYS_OF_WEEK.map((d, i) => (
                                <div key={d} className={`py-3 text-center text-white font-bold text-sm ${i === 0 ? 'text-red-200' : i === 6 ? 'text-orange-200' : ''}`}>{d}</div>
                            ))}
                        </div>
                        {/* Grid */}
                        <div className="grid grid-cols-7">
                            {getCalendarDays().map((day, i) => (
                                <div key={i} onClick={() => day.events.length > 0 && setSelectedDay(day)}
                                    className={`min-h-[120px] border-r border-b border-gray-100 dark:border-white/5 last:border-r-0 p-2 transition-all relative group
                    ${!day.isCurrentMonth ? 'bg-gray-50/50 dark:bg-white/[0.02] text-gray-300 dark:text-gray-600' : 'hover:bg-amber-50/50 dark:hover:bg-amber-500/5 cursor-pointer text-gray-700 dark:text-gray-300'}
                    ${day.isToday ? 'bg-amber-50 dark:bg-amber-500/10 ring-1 ring-inset ring-amber-200 dark:ring-amber-500/30' : ''}`}>
                                    <div className={`text-xs font-bold mb-1 ${day.isToday ? 'w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center' : ''}`}>
                                        {day.date}
                                    </div>
                                    <div className="space-y-0.5">
                                        {day.events.slice(0, 2).map(ev => (
                                            <div key={ev.id} className="text-[10px] p-1 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-700/30 truncate leading-tight">
                                                <div className="font-bold text-gray-800 dark:text-gray-200 truncate">{ev.agency}</div>
                                                <div className="text-gray-500 dark:text-gray-400 truncate">{ev.accountName}</div>
                                                {ev.statusCodeExpire && <span className={`inline-block mt-0.5 px-1.5 py-0 rounded-full text-[8px] font-bold border ${statusColor(ev.statusCodeExpire)}`}>{ev.statusCodeExpire}</span>}
                                            </div>
                                        ))}
                                    </div>
                                    {day.events.length > 2 && (
                                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                            +{day.events.length - 2}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedDay && (
                <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={e => { if (e.target === e.currentTarget) setSelectedDay(null) }}>
                    <div className="bg-white dark:bg-[#1a1a2e] rounded-3xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl animate-scaleIn custom-scrollbar border border-transparent dark:border-white/10">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">{selectedDay.date} {MONTHS[selectedDay.fullDate.getMonth()]}</h3>
                                <p className="text-xs text-gray-400 font-medium">พ.ศ. {selectedDay.fullDate.getFullYear() + 543}</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all">✕</button>
                        </div>
                        {selectedDay.events.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDay.events.map(ev => (
                                    <div key={ev.id} className="border border-gray-100 dark:border-white/10 rounded-2xl p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/10 hover-magnetic">
                                        <div className="font-bold text-lg text-gray-900 dark:text-white mb-3">{ev.agency}</div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2"><span className="text-gray-400">👤</span><span className="text-blue-600 dark:text-blue-400 font-medium">{ev.accountName}</span></div>
                                            <div className="flex items-center gap-2"><span className="text-gray-400">📅</span><span className="text-gray-600 dark:text-gray-300">{ev.originalDate}</span></div>
                                            {ev.days && <div className="flex items-center gap-2"><span className="text-gray-400">⏰</span><span className="text-gray-600 dark:text-gray-300">{ev.days} วัน</span></div>}
                                            {ev.product && <div className="flex items-center gap-2"><span className="text-gray-400">🏷️</span><span className="text-indigo-600 dark:text-indigo-400 font-medium">{ev.product}</span></div>}
                                            {ev.linkPost && <div className="flex items-center gap-2"><span className="text-gray-400">🔗</span><a href={ev.linkPost} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline text-xs truncate">{ev.linkPost.length > 40 ? ev.linkPost.substring(0, 40) + '...' : ev.linkPost}</a></div>}
                                            {ev.codeExpire && <div className="flex items-center gap-2"><span className="text-gray-400">⏳</span><span className="text-gray-600 dark:text-gray-300">{ev.codeExpire}</span></div>}
                                            {ev.statusCodeExpire && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">📊</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${statusColor(ev.statusCodeExpire)}`}>{ev.statusCodeExpire}</span>
                                                </div>
                                            )}
                                            {ev.expireDaysCode && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">🔥</span>
                                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${expireColor(ev.expireDaysCode)}`}>เหลือ {ev.expireDaysCode} วัน</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <div className="text-4xl mb-3">🗓️</div>
                                <p className="text-gray-400 font-medium">ไม่มีกิจกรรมในวันนี้</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
