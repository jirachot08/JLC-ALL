import { NextResponse } from 'next/server';
import { getAllDepartments } from '@/lib/googleSheets';

export async function GET() {
    try {
        const departments = await getAllDepartments();
        return NextResponse.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch departments from Google Sheets' },
            { status: 500 }
        );
    }
}
