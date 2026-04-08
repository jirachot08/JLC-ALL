'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { logout } from '@/lib/auth';
import { useTheme } from '@/components/ThemeProvider';

interface SidebarProps {
    currentUser?: { name: string; role: string } | null;
}

const menuItems = [
    {
        label: 'ภาพรวม', href: '/',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" /></svg>,
    },
    {
        label: 'ทรัพย์สินบริษัท', href: '/company-property',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
    },

    {
        label: 'จัดสรรสต็อก', href: '/stock-allocate',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
    },
    {
        label: 'ปฏิทิน KOL', href: '/calenda-kol',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
        label: 'Cost Dashboard', href: '/cost-dashboard',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        label: 'Forecast Stock', href: '/forecast-stock',
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    },

    {
        label: 'จัดการผู้ใช้', href: '/admin/users', adminOnly: true,
        icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    },
];

export default function Sidebar({ currentUser }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { isDark, toggleTheme } = useTheme();

    const handleLogout = async () => {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { }
            logout();
        }
    };

    const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
    const filteredMenuItems = menuItems.filter(item => !item.adminOnly || currentUser?.role === 'admin');

    return (
        <div className={`${collapsed ? 'w-[72px]' : 'w-[260px]'} min-h-screen bg-[#0c0f1a] flex flex-col transition-all duration-400 flex-shrink-0 relative`}>
            {/* Subtle side glow */}
            <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent" />

            {/* Header */}
            <div className="p-4 mb-2">
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <div className="flex items-center gap-3 animate-fadeIn">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span className="text-white text-lg font-black">J</span>
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-base tracking-tight">JLC Portal</h2>
                                <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">Management</p>
                            </div>
                        </div>
                    )}
                    <button onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-xl hover:bg-white/5 text-gray-500 hover:text-white transition-all">
                        <svg className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-4 mb-3">
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {!collapsed && <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">เมนูหลัก</p>}
                {filteredMenuItems.map((item) => (
                    <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive(item.href)
                            ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/10 text-white'
                            : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'
                            }`}>
                        {isActive(item.href) && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full shadow-lg shadow-indigo-500/50" />
                        )}
                        <div className={`flex-shrink-0 ${isActive(item.href) ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'} transition-colors`}>
                            {item.icon}
                        </div>
                        {!collapsed && (
                            <span className={`text-sm ${isActive(item.href) ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Theme Toggle + User & Logout */}
            <div className="p-3">
                <div className="mx-1 mb-3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Night Mode Toggle */}
                <button onClick={toggleTheme} title={collapsed ? (isDark ? 'Light Mode' : 'Night Mode') : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/[0.08] transition-all duration-200 mb-1 group">
                    <div className="flex-shrink-0 relative w-5 h-5">
                        {/* Sun icon */}
                        <svg className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {/* Moon icon */}
                        <svg className={`w-5 h-5 absolute inset-0 transition-all duration-500 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                            <span className="font-medium text-sm">{isDark ? 'Night Mode' : 'Light Mode'}</span>
                            {/* Toggle pill */}
                            <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-indigo-600' : 'bg-gray-600'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isDark ? 'left-5' : 'left-0.5'}`} />
                            </div>
                        </div>
                    )}
                </button>

                {currentUser && !collapsed && (
                    <div className="px-3 py-3 mb-2 rounded-xl bg-white/[0.03]">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold truncate">{currentUser.name}</p>
                                <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">{currentUser.role === 'admin' ? '👑 Admin' : '👤 User'}</p>
                            </div>
                        </div>
                    </div>
                )}
                <button onClick={handleLogout} title={collapsed ? 'ออกจากระบบ' : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span className="font-medium text-sm">ออกจากระบบ</span>}
                </button>
            </div>
        </div>
    );
}
