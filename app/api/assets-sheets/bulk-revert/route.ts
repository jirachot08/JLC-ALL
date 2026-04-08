import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID, SHEETS } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { revert_to_original = false, original_caretakers, original_usage_type } = body;

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

        if (!original_caretakers && !original_usage_type) {
            const currentData = rows.map((row, index) => ({
                id: index + 1,
                name: row[0] || '',
                current_caretaker: row[5] || '',
                current_usage_type: row[6] || '',
            }));

            return NextResponse.json({
                message: 'กรุณาระบุข้อมูลเดิมที่ต้องการย้อนกลับ',
                current_data: currentData,
                instructions: {
                    original_caretakers: 'ระบุชื่อผู้ดูแลเดิม (array) หรือ "keep" เพื่อคงไว้',
                    original_usage_type: 'ระบุประเภทการใช้งานเดิม หรือ "keep" เพื่อคงไว้',
                },
            });
        }

        const updates = [];
        let updatedCount = 0;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2;

            if (row.length < 6) {
                continue;
            }

            const updatedRow = [...row];
            while (updatedRow.length < 9) {
                updatedRow.push('');
            }

            if (original_caretakers && original_caretakers !== 'keep') {
                if (Array.isArray(original_caretakers)) {
                    const caretakerIndex = i % original_caretakers.length;
                    updatedRow[5] = original_caretakers[caretakerIndex];
                } else {
                    updatedRow[5] = original_caretakers;
                }
            }

            if (original_usage_type && original_usage_type !== 'keep') {
                updatedRow[6] = original_usage_type;
            }

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
            message: `ย้อนกลับเสร็จสิ้น! อัพเดททั้งหมด ${updatedCount} รายการ`,
            updatedCount,
            original_caretakers: original_caretakers || 'keep',
            original_usage_type: original_usage_type || 'keep',
        });
    } catch (error: any) {
        console.error('Error reverting assets:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to revert assets' },
            { status: 500 }
        );
    }
}
