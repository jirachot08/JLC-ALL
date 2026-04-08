import { NextRequest } from 'next/server';
import { getUserByUsername } from './googleSheets';

/**
 * ดึงข้อมูลผู้ใช้ปัจจุบันจาก auth token ใน cookie
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    // Decode token (format: base64(username:timestamp))
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username] = decoded.split(':');

    if (!username) {
      return null;
    }

    // ดึงข้อมูลผู้ใช้จาก Google Sheets
    const user = await getUserByUsername(username);

    if (!user) {
      return null;
    }

    // ไม่ส่ง password กลับไป
    const { password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * ตรวจสอบว่าผู้ใช้ปัจจุบันเป็น Admin หรือไม่
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user?.role === 'admin';
}
