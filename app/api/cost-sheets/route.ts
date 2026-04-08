import { NextRequest, NextResponse } from 'next/server';

const SPREADSHEET_ID = '1cFnle7-557TOR3Sv8HqriV6C1eBUJ-qj48AvEZoVzzs';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const gid = searchParams.get('gid');

        if (!gid) {
            return NextResponse.json({ error: 'Missing gid parameter' }, { status: 400 });
        }

        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            redirect: 'follow',
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Google Sheets returned ${response.status}` },
                { status: 502 }
            );
        }

        const csvText = await response.text();

        return new NextResponse(csvText, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Error fetching cost sheet data:', error);
        return NextResponse.json(
            { error: 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้' },
            { status: 500 }
        );
    }
}
