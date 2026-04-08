import { NextRequest, NextResponse } from 'next/server';
import { getSheets, SPREADSHEET_ID, SHEETS } from '@/lib/googleSheets';
import { getCurrentUser } from '@/lib/auth-server';

async function getSheetId(sheetName: string): Promise<number> {
    const sheets = await getSheets();
    const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === sheetName);
    if (!sheet?.properties?.sheetId) {
        throw new Error(`Sheet ${sheetName} not found`);
    }

    return sheet.properties.sheetId;
}

export async function DELETE(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser(request);
        if (!currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (currentUser.role !== 'admin') {
            return NextResponse.json(
                { error: 'คุณไม่มีสิทธิ์ลบทรัพย์สินทั้งหมด (เฉพาะ Admin เท่านั้น)' },
                { status: 403 }
            );
        }

        const sheets = await getSheets();

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEETS.ASSETS}!A2:I`,
        });

        const rows = response.data.values || [];

        if (rows.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'ไม่มีข้อมูลทรัพย์สินที่ต้องลบ',
                deletedCount: 0,
            });
        }

        const startRow = 2;
        const endRow = rows.length + 1;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: await getSheetId(SHEETS.ASSETS),
                                dimension: 'ROWS',
                                startIndex: startRow - 1,
                                endIndex: endRow,
                            },
                        },
                    },
                ],
            },
        });

        return NextResponse.json({
            success: true,
            message: `ลบทรัพย์สินทั้งหมด ${rows.length} รายการสำเร็จ`,
            deletedCount: rows.length,
        });
    } catch (error: any) {
        console.error('Error deleting all assets:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to delete all assets' },
            { status: 500 }
        );
    }
}
