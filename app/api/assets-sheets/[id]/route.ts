import { NextRequest, NextResponse } from 'next/server';
import { getAssetById, updateAsset, deleteAsset } from '@/lib/googleSheets';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid asset ID' },
                { status: 400 }
            );
        }

        const asset = await getAssetById(id);

        if (!asset) {
            return NextResponse.json(
                { error: 'Asset not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(asset);
    } catch (error) {
        console.error('Error fetching asset:', error);
        return NextResponse.json(
            { error: 'Failed to fetch asset from Google Sheets' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid asset ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, image_url, description, purchase_cost, department_id, caretaker, usage_type } = body;

        if (!name || !purchase_cost || !department_id || !caretaker || !usage_type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await updateAsset(id, {
            name,
            image_url: image_url || '',
            description: description || '',
            purchase_cost: parseFloat(purchase_cost),
            department_id: parseInt(department_id),
            caretaker,
            usage_type,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating asset:', error);
        const errorMessage = error?.message || 'Failed to update asset in Google Sheets';
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
        const resolvedParams = await Promise.resolve(params);
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: 'Invalid asset ID' },
                { status: 400 }
            );
        }

        await deleteAsset(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting asset:', error);
        const errorMessage = error?.message || 'Failed to delete asset from Google Sheets';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
