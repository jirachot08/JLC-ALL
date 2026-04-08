'use client';

import { useState, useEffect } from 'react';

interface Department { id: number; name: string; }
interface Asset { id: number; name: string; image_url?: string; description: string; purchase_cost: number; department_id: number; caretaker: string; usage_type: 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE'; }
interface AssetFormProps { departments: Department[]; asset?: Asset | null; onClose: () => void; onSuccess: () => void; }

export default function AssetForm({ departments, asset, onClose, onSuccess }: AssetFormProps) {
    const [formData, setFormData] = useState({ name: '', image_url: '', description: '', purchase_cost: '', department_id: '', caretaker: '', usage_type: 'LIVE' as 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE' });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<{ name: string; username: string } | null>(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try { const res = await fetch('/api/auth/me'); if (res.ok) { const user = await res.json(); setCurrentUser(user); if (user.name) setFormData(prev => ({ ...prev, caretaker: user.name })); } } catch (error) { console.error('Error fetching current user:', error); }
        };
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (asset) {
            setFormData({ name: asset.name, image_url: asset.image_url || '', description: asset.description || '', purchase_cost: asset.purchase_cost.toString(), department_id: asset.department_id.toString(), caretaker: currentUser?.name || asset.caretaker, usage_type: asset.usage_type });
            setPreviewImage(asset.image_url || '');
        }
    }, [asset, currentUser]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        if (!file.type.startsWith('image/')) { alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('ขนาดไฟล์ต้องไม่เกิน 5MB'); return; }
        setUploading(true);
        try {
            const reader = new FileReader(); reader.onloadend = () => { setPreviewImage(reader.result as string); }; reader.readAsDataURL(file);
            const uploadFormData = new FormData(); uploadFormData.append('image', file);
            const response = await fetch('/api/upload-image-cloudinary', { method: 'POST', body: uploadFormData });
            if (!response.ok) throw new Error('Failed to upload image');
            const data = await response.json();
            if (data.success && data.url) { setFormData({ ...formData, image_url: data.url }); alert('อัปโหลดรูปภาพสำเร็จ!'); }
            else throw new Error('Invalid response from server');
        } catch (error) { console.error('Error uploading image:', error); alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'); setPreviewImage(''); } finally { setUploading(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            if (asset && (!asset.id || isNaN(asset.id))) { alert('เกิดข้อผิดพลาด: ไม่พบ ID ของทรัพย์สิน'); setLoading(false); return; }
            const url = asset ? `/api/assets-sheets/${asset.id}` : '/api/assets-sheets';
            const method = asset ? 'PUT' : 'POST';
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formData.name, image_url: formData.image_url, description: formData.description, purchase_cost: parseFloat(formData.purchase_cost), department_id: parseInt(formData.department_id), caretaker: formData.caretaker, usage_type: formData.usage_type }) });
            if (response.ok) onSuccess();
            else { const error = await response.json(); alert(error.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'); }
        } catch (error) { console.error('Error saving asset:', error); alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล'); } finally { setLoading(false); }
    };

    const inputCls = "w-full px-4 py-3 border-2 border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200";
    const labelCls = "block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white/95 dark:bg-[#1a1a2e]/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-white/10 animate-slideUp">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-t-3xl p-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-extrabold text-white mb-1">{asset ? '✏️ แก้ไขทรัพย์สิน' : '➕ เพิ่มทรัพย์สินใหม่'}</h2>
                            <p className="text-blue-100 text-sm font-medium">{asset ? 'แก้ไขข้อมูลทรัพย์สิน' : 'กรอกข้อมูลทรัพย์สินใหม่'}</p>
                        </div>
                        <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200 text-3xl w-12 h-12 flex items-center justify-center hover:rotate-90">×</button>
                    </div>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className={labelCls}>📦 ชื่อทรัพย์สิน <span className="text-red-500">*</span></label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputCls} placeholder="กรอกชื่อทรัพย์สิน" />
                        </div>
                        <div>
                            <label className={labelCls}>🖼️ รูปภาพ</label>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <label className="cursor-pointer group">
                                    <div className="px-6 py-4 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white text-center rounded-2xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📁</div><div>เลือกไฟล์</div>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                </label>
                                <label className="cursor-pointer group">
                                    <div className="px-6 py-4 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 text-white text-center rounded-2xl hover:from-green-600 hover:via-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 font-bold text-lg">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📷</div><div>ถ่ายรูป</div>
                                    </div>
                                    <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                                </label>
                            </div>
                            {uploading && (<div className="text-center py-4"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div><p className="text-blue-600 dark:text-blue-400 font-medium">กำลังอัปโหลด...</p></div>)}
                            {(previewImage || formData.image_url) && !uploading && (
                                <div className="relative mt-6 group">
                                    <div className="relative overflow-hidden rounded-2xl border-4 border-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 dark:from-blue-800 dark:via-indigo-800 dark:to-purple-800 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-2">
                                        <img src={previewImage || formData.image_url} alt="Preview" className="w-full max-h-72 object-contain rounded-xl shadow-lg" />
                                        <button type="button" onClick={() => { setFormData({ ...formData, image_url: '' }); setPreviewImage(''); }} className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl shadow-2xl transition-all duration-200 text-sm font-bold transform hover:scale-110">🗑️ ลบรูป</button>
                                    </div>
                                </div>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">รองรับไฟล์: JPG, PNG, GIF (สูงสุด 5MB)</p>
                        </div>
                        <div>
                            <label className={labelCls}>📝 รายละเอียด</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="กรอกรายละเอียดเพิ่มเติม (ถ้ามี)" />
                        </div>
                        <div>
                            <label className={labelCls}>💰 ราคาซื้อ (บาท) <span className="text-red-500">*</span></label>
                            <input type="number" step="0.01" min="0" required value={formData.purchase_cost} onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })} className={inputCls} placeholder="0.00" />
                        </div>
                        <div>
                            <label className={labelCls}>🏢 แผนก <span className="text-red-500">*</span></label>
                            <select required value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })} className={`${inputCls} bg-white dark:bg-white/5 text-gray-900 dark:text-white`}>
                                <option value="" className="text-gray-900 bg-white">เลือกแผนก</option>
                                {departments.map((dept) => (<option key={dept.id} value={dept.id} className="text-gray-900 bg-white">{dept.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>
                                👤 ผู้ดูแล <span className="text-red-500">*</span>
                                {currentUser && <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(ใช้ชื่อผู้ใช้ที่ล็อกอิน: {currentUser.name})</span>}
                            </label>
                            <input type="text" required value={formData.caretaker} onChange={(e) => setFormData({ ...formData, caretaker: e.target.value })} className={`${inputCls} bg-gray-50 dark:bg-white/[0.03]`} placeholder={currentUser ? currentUser.name : "กรอกชื่อผู้ดูแล"} readOnly={true} title="ชื่อผู้ดูแลจะใช้ชื่อผู้ใช้ที่ล็อกอินอัตโนมัติ" />
                        </div>
                        <div>
                            <label className={labelCls}>🏷️ ประเภทการใช้งาน <span className="text-red-500">*</span></label>
                            <select required value={formData.usage_type} onChange={(e) => setFormData({ ...formData, usage_type: e.target.value as any })} className={`${inputCls} bg-white dark:bg-white/5 text-gray-900 dark:text-white`}>
                                <option value="LIVE" className="text-gray-900 bg-white">🟢 LIVE</option>
                                <option value="PRODUCTION" className="text-gray-900 bg-white">🔵 PRODUCTION</option>
                                <option value="OTHER" className="text-gray-900 bg-white">⚪ OTHER</option>
                                <option value="EDITOR" className="text-gray-900 bg-white">🟣 EDITOR</option>
                                <option value="GRAPHIC" className="text-gray-900 bg-white">🎨 GRAPHIC</option>
                                <option value="CREATIVE" className="text-gray-900 bg-white">✨ CREATIVE</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-4 pt-8 mt-8 border-t-2 dark:border-white/10">
                            <button type="button" onClick={onClose} className="px-8 py-4 border-2 border-gray-300 dark:border-white/10 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-bold transition-all duration-200">ยกเลิก</button>
                            <button type="submit" disabled={loading} className="px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 disabled:transform-none text-lg">
                                {loading ? (<span className="flex items-center gap-3"><span className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></span>กำลังบันทึก...</span>) : asset ? (<span className="flex items-center gap-2"><span>✅</span><span>อัพเดต</span></span>) : (<span className="flex items-center gap-2"><span>💾</span><span>บันทึก</span></span>)}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
