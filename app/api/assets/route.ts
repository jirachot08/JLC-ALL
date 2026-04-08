import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.execute(`
      SELECT 
        a.*,
        d.name as department_name
      FROM assets a
      JOIN departments d ON a.department_id = d.id
      ORDER BY a.created_at DESC
    `);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching assets:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assets' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, purchase_cost, department_id, caretaker, usage_type } = body;

        if (!name || !purchase_cost || !department_id || !caretaker || !usage_type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const [result] = await pool.execute(
            'INSERT INTO assets (name, description, purchase_cost, department_id, caretaker, usage_type) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description || null, purchase_cost, department_id, caretaker, usage_type]
        );

        return NextResponse.json({ success: true, id: (result as any).insertId }, { status: 201 });
    } catch (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json(
            { error: 'Failed to create asset' },
            { status: 500 }
        );
    }
}
