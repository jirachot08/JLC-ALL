import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const [rows] = await pool.execute(
            `SELECT 
        a.*,
        d.name as department_name
      FROM assets a
      JOIN departments d ON a.department_id = d.id
      WHERE a.id = ?`,
            [params.id]
        );

        const assets = rows as any[];
        if (assets.length === 0) {
            return NextResponse.json(
                { error: 'Asset not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(assets[0]);
    } catch (error) {
        console.error('Error fetching asset:', error);
        return NextResponse.json(
            { error: 'Failed to fetch asset' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, description, purchase_cost, department_id, caretaker, usage_type } = body;

        if (!name || !purchase_cost || !department_id || !caretaker || !usage_type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await pool.execute(
            'UPDATE assets SET name = ?, description = ?, purchase_cost = ?, department_id = ?, caretaker = ?, usage_type = ? WHERE id = ?',
            [name, description || null, purchase_cost, department_id, caretaker, usage_type, params.id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating asset:', error);
        return NextResponse.json(
            { error: 'Failed to update asset' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await pool.execute('DELETE FROM assets WHERE id = ?', [params.id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting asset:', error);
        return NextResponse.json(
            { error: 'Failed to delete asset' },
            { status: 500 }
        );
    }
}
