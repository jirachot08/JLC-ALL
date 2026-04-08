'use client';

import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function CostDashboardPage() {
    const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) { window.location.href = '/login'; return; }
        fetchCurrentUser();
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

    return (
        <div className="flex min-h-screen bg-[#0a0a1a]">
            <Sidebar currentUser={currentUser} />
            <div className="flex-1 overflow-hidden">
                <iframe
                    src="/cost-dashboard/index.html"
                    className="w-full h-screen border-0"
                    title="Cost Dashboard - TikTok & Facebook Ads"
                    allow="clipboard-write"
                />
            </div>
        </div>
    );
}
