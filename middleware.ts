import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token');
    const isLoginPage = request.nextUrl.pathname === '/login';

    // ถ้าอยู่ที่หน้า login และมี token แล้ว ให้ redirect ไปหน้าแรก
    if (isLoginPage && token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // ถ้าไม่ใช่หน้า login และไม่มี token ให้ redirect ไปหน้า login
    if (!isLoginPage && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
