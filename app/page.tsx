'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useTheme } from '@/components/ThemeProvider';

export default function OverviewPage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [time, setTime] = useState(new Date());
    const { isDark } = useTheme();

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchCurrentUser();
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) setCurrentUser(await res.json());
        } catch (error) {
            console.error('Error fetching current user:', error);
        } finally { setLoading(false); }
    };

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

    const modules = [
        {
            title: 'ทรัพย์สินบริษัท', description: 'ระบบบันทึกและจัดการข้อมูลทรัพย์สินของบริษัท',
            icon: '🏢', href: '/company-property',
            gradient: 'from-blue-500 to-indigo-600', bgGlow: 'bg-blue-500/20',
            features: ['บันทึกทรัพย์สิน', 'จัดการแผนก', 'ผู้ดูแลทรัพย์สิน', 'Export PDF'],
            stats: { label: 'Assets', value: '—' },
        },
        {
            title: 'จัดสรรสต็อก', description: 'ระบบจัดสรรและกระจายสต็อกสินค้า E-commerce',
            icon: '📦', href: '/stock-allocate',
            gradient: 'from-emerald-500 to-teal-600', bgGlow: 'bg-emerald-500/20',
            features: ['จัดสรร 3 แพลตฟอร์ม', 'SKU Breakdown', 'Google Sheets', 'ประวัติการจัดสรร'],
            stats: { label: 'Platforms', value: '3' },
        },
        {
            title: 'ปฏิทิน KOL', description: 'ระบบปฏิทินจัดการแคมเปญ KOL ครบวงจร',
            icon: '📅', href: '/calenda-kol',
            gradient: 'from-amber-500 to-orange-600', bgGlow: 'bg-amber-500/20',
            features: ['ปฏิทินรายเดือน', 'ซิงก์ Google Sheets', 'ค้นหาแคมเปญ', 'ติดตาม Code'],
            stats: { label: 'Year', value: '2568' },
        },
        {
            title: 'Cost Dashboard', description: 'ติดตามค่าใช้จ่ายโฆษณา TikTok & Facebook Ads',
            icon: '💰', href: '/cost-dashboard',
            gradient: 'from-rose-500 to-pink-600', bgGlow: 'bg-rose-500/20',
            features: ['TikTok Ads', 'Facebook Ads', 'Budget Tracking', 'Google Sheets'],
            stats: { label: 'Platforms', value: '2' },
        },
    ];

    const greeting = () => {
        const h = time.getHours();
        if (h < 12) return '🌅 สวัสดีตอนเช้า';
        if (h < 17) return '☀️ สวัสดีตอนบ่าย';
        return '🌙 สวัสดีตอนเย็น';
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/50 dark:from-[#0a0a1a] dark:via-[#0f0f2e] dark:to-[#0a0a1a] transition-colors duration-300">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-auto">
                {/* Ambient blobs */}
                <div className={`fixed top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none ${isDark ? 'bg-indigo-600/5' : 'bg-blue-400/5'}`} />
                <div className={`fixed bottom-0 left-1/3 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none ${isDark ? 'bg-purple-600/5' : 'bg-purple-400/5'}`} />

                <div className="relative p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-10 animate-fadeIn">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mb-1">{greeting()}</p>
                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                                    {currentUser?.name || 'ผู้ใช้'}
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">เลือกระบบที่ต้องการใช้งาน</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="glass-card rounded-2xl px-5 py-3">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">เวลาปัจจุบัน</div>
                                    <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                                        {time.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="glass-card rounded-2xl px-5 py-3">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">วันที่</div>
                                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                                        {time.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {modules.map((mod, i) => (
                            <Link key={mod.title} href={mod.href}
                                className="group relative glass-card rounded-3xl p-7 hover-lift overflow-hidden animate-slideUp"
                                style={{ animationDelay: `${i * 120}ms` }}>
                                {/* Hover glow */}
                                <div className={`absolute -top-20 -right-20 w-48 h-48 ${mod.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                                <div className="relative z-10">
                                    {/* Icon + Stats */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${mod.gradient} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            {mod.icon}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-gray-900 dark:text-white">{mod.stats.value}</div>
                                            <div className="text-xs text-gray-400 font-medium">{mod.stats.label}</div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1">{mod.title}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 leading-relaxed">{mod.description}</p>

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-2 mb-6">
                                        {mod.features.map(f => (
                                            <div key={f} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${mod.gradient}`} />
                                                {f}
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <div className={`flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${mod.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}>
                                        <span>เข้าใช้งาน</span>
                                        <svg className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Quick Stats Bar */}
                    <div className="glass-card rounded-3xl p-6 animate-slideUp animation-delay-500">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">สรุปภาพรวม</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { value: '4', label: 'ระบบทั้งหมด', color: 'from-blue-500 to-indigo-600' },
                                { value: '🏢', label: 'ทรัพย์สินบริษัท', color: 'from-blue-500 to-cyan-600' },
                                { value: '📦', label: 'จัดสรรสต็อก', color: 'from-emerald-500 to-teal-600' },
                                { value: '📅', label: 'ปฏิทิน KOL', color: 'from-amber-500 to-orange-600' },
                                { value: '💰', label: 'Cost Dashboard', color: 'from-rose-500 to-pink-600' },
                            ].map(stat => (
                                <div key={stat.label} className={`relative overflow-hidden bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg hover-magnetic`}>
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative">
                                        <div className="text-2xl font-black mb-1">{stat.value}</div>
                                        <div className="text-white/80 text-xs font-medium">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
