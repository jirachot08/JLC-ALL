import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID, SHEETS } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { caretaker_mapping, default_caretaker, usage_type } = body;

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
            const assetId = i + 1;

            if (row.length < 6) {
                continue;
            }

            const updatedRow = [...row];
            while (updatedRow.length < 9) {
                updatedRow.push('');
            }

            let newCaretaker = null;

            if (caretaker_mapping) {
                if (typeof caretaker_mapping === 'object' && !Array.isArray(caretaker_mapping)) {
                    newCaretaker = caretaker_mapping[assetId.toString()] || caretaker_mapping[i.toString()];
                } else if (Array.isArray(caretaker_mapping)) {
                    const caretakerIndex = i % caretaker_mapping.length;
                    newCaretaker = caretaker_mapping[caretakerIndex];
                }
            }

            if (!newCaretaker && default_caretaker) {
                newCaretaker = default_caretaker;
            }

            if (newCaretaker) {
                updatedRow[5] = newCaretaker;
            }

            if (usage_type && usage_type !== 'keep') {
                updatedRow[6] = usage_type;
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
            message: `อัพเดทเสร็จสิ้น! อัพเดททั้งหมด ${updatedCount} รายการ`,
            updatedCount,
        });
    } catch (error: any) {
        console.error('Error restoring caretakers:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to restore caretakers' },
            { status: 500 }
        );
    }
}
