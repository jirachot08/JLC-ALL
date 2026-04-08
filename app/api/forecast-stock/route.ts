import { NextRequest, NextResponse } from 'next/server';
import { getForecastData, updateForecastCell, FORECAST_SHEETS } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sheet = searchParams.get('sheet') || 'q1';

        let sheetName: string;
        if (sheet.toLowerCase() === 'q2') {
            sheetName = FORECAST_SHEETS.Q2;
        } else {
            sheetName = FORECAST_SHEETS.Q1;
        }

        const data = await getForecastData(sheetName);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching forecast data:', error);
        return NextResponse.json(
            { error: 'ไม่สามารถดึงข้อมูล Forecast ได้ กรุณาตรวจสอบว่าได้แชร์ Google Sheet ให้ service account แล้ว' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { sheet, rowIndex, colIndex, value } = body;

        if (rowIndex === undefined || colIndex === undefined || value === undefined || !sheet) {
            return NextResponse.json(
                { error: 'Missing required fields: sheet, rowIndex, colIndex, value' },
                { status: 400 }
            );
        }

        let sheetName: string;
        if (sheet.toLowerCase() === 'q2') {
            sheetName = FORECAST_SHEETS.Q2;
        } else {
            sheetName = FORECAST_SHEETS.Q1;
        }

        const result = await updateForecastCell(sheetName, rowIndex, colIndex, value);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error updating forecast cell:', error);
        return NextResponse.json(
            { error: 'ไม่สามารถบันทึกข้อมูลได้' },
            { status: 500 }
        );
    }
}

