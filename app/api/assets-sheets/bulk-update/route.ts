import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID, SHEETS } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { caretakers, usage_type } = body;

        if (!caretakers || !Array.isArray(caretakers) || caretakers.length === 0) {
            return NextResponse.json(
                { error: 'กรุณาระบุชื่อผู้ดูแล (caretakers) เป็น array' },
                { status: 400 }
            );
        }

        if (!usage_type) {
            return NextResponse.json(
                { error: 'กรุณาระบุประเภทการใช้งาน (usage_type)' },
                { status: 400 }
            );
        }

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

        const updates = [];
        let updatedCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            if (row.length < 6) {
                continue;
            }

            const caretakerIndex = i % caretakers.length;
            const newCaretaker = caretakers[caretakerIndex];

            const updatedRow = [...row];
            while (updatedRow.length < 9) {
                updatedRow.push('');
            }

            updatedRow[5] = newCaretaker;
            updatedRow[6] = usage_type;
            updatedRow[8] = new Date().toISOString();

            updates.push({
                range: `${SHEETS.ASSETS}!A${rowNumber}:I${rowNumber}`,
                values: [updatedRow],
            });

            updatedCount++;
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { error: 'ไม่มีข้อมูลที่ต้องอัพเดท' },
                { status: 400 }
            );
        }

        const batchSize = 100;
        for (let i = 0; i < updates.length; i += batchSize) {
            const batch = updates.slice(i, i + batchSize);

            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    valueInputOption: 'USER_ENTERED',
                    data: batch,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: `อัพเดทเสร็จสิ้น! อัพเดททั้งหมด ${updatedCount} รายการ`,
            updatedCount,
            caretakers,
            usage_type,
        });
    } catch (error: any) {
        console.error('Error bulk updating assets:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to bulk update assets' },
            { status: 500 }
        );
    }
}
