import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID, SHEETS } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
    try {
        const sheets = await getSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEETS.ASSETS}!A2:I`,
        });

        const rows = response.data.values || [];

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'ไม่พบข้อมูลทรัพย์สิน' },
                { status: 404 }
            );
        }

        const assets = rows.map((row, index) => ({
            id: index + 1,
            name: row[0] || '',
            current_caretaker: row[5] || '',
            current_usage_type: row[6] || '',
            created_at: row[7] || '',
            updated_at: row[8] || '',
        }));

        return NextResponse.json({
            message: 'ข้อมูลทรัพย์สินทั้งหมด',
            total: assets.length,
            assets,
            note: 'กรุณาระบุชื่อผู้ดูแลเดิมสำหรับแต่ละทรัพย์สิน หรือระบุชื่อผู้ดูแลที่ต้องการย้อนกลับ',
        });
    } catch (error: any) {
        console.error('Error fetching assets:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch assets' },
            { status: 500 }
        );
    }
}
