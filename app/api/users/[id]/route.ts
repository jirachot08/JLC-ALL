import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser, getAllUsers } from '@/lib/googleSheets';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const users = await getAllUsers();
        const user = users.find((u) => u.id === id);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user from Google Sheets' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const resolvedParams = await Promise.resolve(params);
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const users = await getAllUsers();
        const targetUser = users.find((u) => u.id === id);

        if (!targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (currentUser.role !== 'admin' && currentUser.id !== id) {
            return NextResponse.json(
                { error: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้นี้' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { username, password, name, role } = body;

        if (username) {
            const existingUser = users.find((u) => u.username === username && u.id !== id);

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Username already exists' },
                    { status: 400 }
                );
            }
        }

        const updateData: {
            username?: string;
            password?: string;
            name?: string;
            role?: string;
        } = {
            username,
            name,
            role,
        };

        if (password && password.trim() !== '') {
            updateData.password = password;
        }

        await updateUser(id, updateData);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating user:', error);
        const errorMessage = error?.message || 'Failed to update user in Google Sheets';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const resolvedParams = await Promise.resolve(params);
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        const users = await getAllUsers();
        const targetUser = users.find((u) => u.id === id);

        if (!targetUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { error: 'คุณไม่มีสิทธิ์ลบผู้ใช้' },
                { status: 403 }
            );
        }

        if (currentUser.id === id) {
            return NextResponse.json(
                { error: 'คุณไม่สามารถลบตัวเองได้' },
                { status: 400 }
            );
        }

        await deleteUser(id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        const errorMessage = error?.message || 'Failed to delete user from Google Sheets';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
