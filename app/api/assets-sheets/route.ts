import { NextRequest, NextResponse } from 'next/server';
import { getAllAssets, createAsset } from '@/lib/googleSheets';

export async function GET() {
    try {
        const assets = await getAllAssets();
        return NextResponse.json(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
        return NextResponse.json(
            { error: 'Failed to fetch assets from Google Sheets' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, image_url, description, purchase_cost, department_id, caretaker, usage_type } = body;

        if (!name || !purchase_cost || !department_id || !caretaker || !usage_type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await createAsset({
            name,
            image_url: image_url || '',
            description: description || '',
            purchase_cost: parseFloat(purchase_cost),
            department_id: parseInt(department_id),
            caretaker,
            usage_type,
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Error creating asset:', error);
        return NextResponse.json(
            { error: 'Failed to create asset in Google Sheets' },
            { status: 500 }
        );
    }
}
