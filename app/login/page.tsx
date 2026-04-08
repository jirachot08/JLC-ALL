'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/');
            } else {
                setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
            }
        } catch {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a1a]">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]" />
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="absolute rounded-full bg-white/5 animate-float" style={{
                        width: `${8 + i * 4}px`, height: `${8 + i * 4}px`,
                        top: `${15 + i * 15}%`, left: `${10 + i * 14}%`,
                        animationDelay: `${i * 0.8}s`, animationDuration: `${4 + i}s`,
                    }} />
                ))}
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md mx-4 animate-scaleIn">
                <div className="relative">
                    {/* Glow behind card */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl blur-lg opacity-30 animate-gradient" />

                    <div className="relative bg-white/[0.07] backdrop-blur-2xl rounded-3xl border border-white/[0.12] shadow-2xl p-10">
                        {/* Logo */}
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-5 animate-float">
                                <span className="text-white text-3xl font-black">J</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                                JLC Portal
                            </h1>
                            <p className="text-gray-400 text-sm font-medium">
                                ระบบจัดการรวมศูนย์ สำหรับองค์กร
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm text-center animate-slideDown">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                                    ชื่อผู้ใช้
                                </label>
                                <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'username' ? 'ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : ''}`}>
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className={`w-5 h-5 transition-colors ${focusedField === 'username' ? 'text-indigo-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input type="text" value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField('')}
                                        className="w-full pl-12 pr-4 py-4 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.1] transition-all text-sm"
                                        placeholder="กรอกชื่อผู้ใช้" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">
                                    รหัสผ่าน
                                </label>
                                <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10' : ''}`}>
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg className={`w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-indigo-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input type="password" value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')}
                                        className="w-full pl-12 pr-4 py-4 bg-white/[0.06] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.1] transition-all text-sm"
                                        placeholder="กรอกรหัสผ่าน" required />
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full relative group overflow-hidden py-4 rounded-2xl font-bold text-white text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                                {/* Button gradient background */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 group-hover:from-blue-500 group-hover:via-indigo-500 group-hover:to-purple-500 transition-all" />
                                {/* Shimmer effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <span className="relative flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            กำลังเข้าสู่ระบบ...
                                        </>
                                    ) : (
                                        <>
                                            เข้าสู่ระบบ
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                            </svg>
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-xs">
                                Jula&apos;s Herb — Internal Management System
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
