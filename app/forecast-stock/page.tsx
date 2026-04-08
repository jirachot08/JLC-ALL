'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

interface ForecastData {
    headers: string[];
    rows: string[][];
    sheetName: string;
}

interface EditingCell {
    rowIdx: number; // original row index in forecastData.rows
    colIdx: number;
}

export default function ForecastStockPage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'q1' | 'q2'>('q1');
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState<number | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [editValue, setEditValue] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        fetchForecast(activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (editingCell && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingCell]);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) setCurrentUser(await res.json());
        } catch (e) {
            console.error('Error:', e);
        } finally { setLoading(false); }
    };

    const fetchForecast = async (tab: string) => {
        setDataLoading(true);
        setError(null);
        setEditingCell(null);
        try {
            const res = await fetch(`/api/forecast-stock?sheet=${tab}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to fetch');
            }
            const data = await res.json();
            setForecastData(data);
        } catch (e: any) {
            setError(e.message || 'ไม่สามารถดึงข้อมูลได้');
            setForecastData(null);
        } finally { setDataLoading(false); }
    };

    const showToast = (msg: string, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSort = (colIdx: number) => {
        if (sortCol === colIdx) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(colIdx);
            setSortDir('asc');
        }
    };

    // Build filtered/sorted rows with original index for mapping edits back
    const filteredAndSortedRows = useMemo(() => {
        if (!forecastData) return [];
        let indexedRows = forecastData.rows.map((row, idx) => ({ row, origIdx: idx }));

        if (search.trim()) {
            const q = search.toLowerCase();
            indexedRows = indexedRows.filter(({ row }) => row.some(cell => cell.toLowerCase().includes(q)));
        }

        if (sortCol !== null) {
            indexedRows = [...indexedRows].sort((a, b) => {
                const valA = a.row[sortCol] || '';
                const valB = b.row[sortCol] || '';
                const numA = parseFloat(valA.replace(/,/g, ''));
                const numB = parseFloat(valB.replace(/,/g, ''));
                if (!isNaN(numA) && !isNaN(numB)) {
                    return sortDir === 'asc' ? numA - numB : numB - numA;
                }
                return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            });
        }

        return indexedRows;
    }, [forecastData, search, sortCol, sortDir]);

    const startEditing = (origRowIdx: number, colIdx: number, currentValue: string) => {
        setEditingCell({ rowIdx: origRowIdx, colIdx });
        setEditValue(currentValue);
    };

    const cancelEditing = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const saveCell = useCallback(async () => {
        if (!editingCell || !forecastData) return;
        const { rowIdx, colIdx } = editingCell;
        const oldValue = forecastData.rows[rowIdx][colIdx] || '';

        // No change — just close
        if (editValue === oldValue) {
            cancelEditing();
            return;
        }

        setSaving(true);
        try {
            const res = await fetch('/api/forecast-stock', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sheet: activeTab,
                    rowIndex: rowIdx,
                    colIndex: colIdx,
                    value: editValue,
                }),
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Save failed');
            }
            // Update local data
            setForecastData(prev => {
                if (!prev) return prev;
                const newRows = prev.rows.map(r => [...r]);
                newRows[rowIdx][colIdx] = editValue;
                return { ...prev, rows: newRows };
            });
            showToast('✅ บันทึกสำเร็จ');
        } catch (e: any) {
            showToast(e.message || 'บันทึกไม่สำเร็จ', 'error');
        } finally {
            setSaving(false);
            cancelEditing();
        }
    }, [editingCell, editValue, forecastData, activeTab]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveCell();
        } else if (e.key === 'Escape') {
            cancelEditing();
        }
    };

    const card = "bg-white/90 dark:bg-white/[0.05] backdrop-blur-xl rounded-3xl shadow-xl dark:shadow-black/20 p-6 mb-6 border border-white/30 dark:border-white/[0.08]";

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] flex items-center justify-center transition-colors duration-300">
                <div className="text-center">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-800" />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลด...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                <div className="p-8 max-w-[1400px] mx-auto">

                    {/* Toast */}
                    {toast && (
                        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-2xl shadow-2xl font-bold text-white animate-slideUp ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
                            {toast.msg}
                        </div>
                    )}

                    {/* Header */}
                    <div className={card}>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-purple-500/20">📈</div>
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Forecast Stock</h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">พยากรณ์สต็อกสินค้า — คลิกที่เซลล์เพื่อแก้ไข กด Enter เพื่อบันทึก</p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className={card}>
                        <div className="flex items-center gap-3 mb-5">
                            <button
                                onClick={() => setActiveTab('q1')}
                                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === 'q1'
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105'
                                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                📊 FC Q1
                            </button>
                            <button
                                onClick={() => setActiveTab('q2')}
                                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === 'q2'
                                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105'
                                    : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                    }`}
                            >
                                📊 FC Q2
                            </button>
                            <div className="ml-auto flex items-center gap-3">
                                <button
                                    onClick={() => fetchForecast(activeTab)}
                                    disabled={dataLoading}
                                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all disabled:opacity-50 text-sm"
                                >
                                    {dataLoading ? '⏳ กำลังโหลด...' : '🔄 รีเฟรช'}
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ค้นหาข้อมูล..."
                                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className={card}>
                        {dataLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="relative w-16 h-16 mx-auto mb-4">
                                        <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800" />
                                        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">กำลังโหลดข้อมูล Forecast...</p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center max-w-md">
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">⚠️</div>
                                    <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">เกิดข้อผิดพลาด</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{error}</p>
                                    <button onClick={() => fetchForecast(activeTab)} className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors">ลองใหม่</button>
                                </div>
                            </div>
                        ) : forecastData && forecastData.headers.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        📋 {forecastData.sheetName}
                                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                                            ({filteredAndSortedRows.length} แถว)
                                        </span>
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                                            ✏️ คลิกเซลล์เพื่อแก้ไข
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                                            ⏎ Enter = บันทึก
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-lg">
                                            Esc = ยกเลิก
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/[0.08]">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                                                {forecastData.headers.map((h, i) => (
                                                    <th
                                                        key={i}
                                                        onClick={() => handleSort(i)}
                                                        className="px-4 py-3 text-left font-bold whitespace-nowrap cursor-pointer hover:bg-white/10 transition-colors select-none"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {h || `Col ${i + 1}`}
                                                            {sortCol === i && (
                                                                <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAndSortedRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={forecastData.headers.length} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                                        {search ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAndSortedRows.map(({ row, origIdx }, rIdx) => (
                                                    <tr
                                                        key={origIdx}
                                                        className={`border-t border-gray-100 dark:border-white/[0.04] transition-colors hover:bg-violet-50/50 dark:hover:bg-violet-500/[0.06] ${rIdx % 2 === 0
                                                            ? 'bg-white dark:bg-transparent'
                                                            : 'bg-gray-50/50 dark:bg-white/[0.02]'
                                                            }`}
                                                    >
                                                        {row.map((cell, cIdx) => {
                                                            const isEditing = editingCell?.rowIdx === origIdx && editingCell?.colIdx === cIdx;
                                                            return (
                                                                <td
                                                                    key={cIdx}
                                                                    className={`px-4 py-2 whitespace-nowrap ${isEditing ? '' : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
                                                                    onClick={() => {
                                                                        if (!isEditing && !saving) startEditing(origIdx, cIdx, cell);
                                                                    }}
                                                                >
                                                                    {isEditing ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                ref={editInputRef}
                                                                                value={editValue}
                                                                                onChange={e => setEditValue(e.target.value)}
                                                                                onKeyDown={handleKeyDown}
                                                                                onBlur={saveCell}
                                                                                disabled={saving}
                                                                                className="w-full min-w-[60px] px-2 py-1 border-2 border-purple-500 bg-white dark:bg-[#1a1a3a] dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                                                            />
                                                                            {saving && (
                                                                                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-700 dark:text-gray-300 group-hover:text-blue-600">
                                                                            {cell || '-'}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📭</div>
                                    <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-1">ไม่มีข้อมูล</h3>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm">ยังไม่มีข้อมูลในชีตนี้</p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
