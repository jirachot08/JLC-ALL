import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/googleSheets';

export async function GET() {
    try {
        const users = await getAllUsers();
        const safeUsers = users.map(({ password, ...user }) => user);
        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users from Google Sheets' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password, name, role } = body;

        if (!username || !password || !name) {
            return NextResponse.json(
                { error: 'Missing required fields: username, password, name' },
                { status: 400 }
            );
        }

        const users = await getAllUsers();
        const existingUser = users.find((u) => u.username === username);

        if (existingUser) {
            return NextResponse.json(
                { error: 'Username already exists' },
                { status: 400 }
            );
        }

        await createUser({
            username,
            password,
            name,
            role: role || 'user',
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json(
            { error: 'Failed to create user in Google Sheets' },
            { status: 500 }
        );
    }
}
