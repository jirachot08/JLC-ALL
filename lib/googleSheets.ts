import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

let auth: JWT | null = null;

function getAuth() {
  if (auth) return auth;

  try {
    // ตรวจสอบว่ามี Environment Variables หรือไม่ (สำหรับ production)
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey) {
      // ใช้ Environment Variables (สำหรับ Vercel/Production)
      auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return auth;
    }

    // ถ้าไม่มี Environment Variables ให้อ่านจากไฟล์ (สำหรับ local development)
    const credentialsPath = path.join(process.cwd(), 'google-credentials.json');

    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Google credentials not found. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables, or add google-credentials.json file.');
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
  } catch (error) {
    console.error('Error loading Google Sheets credentials:', error);
    throw new Error('Google Sheets credentials not configured. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables, or add google-credentials.json file.');
  }
}

export async function getSheets() {
  const authClient = getAuth();
  return google.sheets({ version: 'v4', auth: authClient });
}

export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';

// Sheet names (ค่าเริ่มต้น — ชีต users อาจระบุด้วย GOOGLE_SHEET_USERS_GID หรือ GOOGLE_SHEET_USERS_NAME)
export const SHEETS = {
  DEPARTMENTS: 'departments',
  ASSETS: 'assets',
  USERS: 'users',
};

let usersSheetTitleCache: string | null = null;

/** รีเซ็ตแคชชื่อแท็บ users (เช่น หลังเปลี่ยน env ในเทส) */
export function clearUsersSheetTitleCache() {
  usersSheetTitleCache = null;
}

/**
 * ชื่อแท็บชีต users สำหรับ Sheets API
 * - GOOGLE_SHEET_USERS_NAME = ชื่อแท็บตรงๆ
 * - GOOGLE_SHEET_USERS_GID = gid จาก URL (เช่น 866934488) จะดึงชื่อแท็บจริงจาก API
 * - ไม่ระบุ → ใช้ชื่อ "users"
 */
export async function getUsersSheetTitle(): Promise<string> {
  if (usersSheetTitleCache) return usersSheetTitleCache;

  const explicit = process.env.GOOGLE_SHEET_USERS_NAME?.trim();
  if (explicit) {
    usersSheetTitleCache = explicit;
    return explicit;
  }

  const gidStr = process.env.GOOGLE_SHEET_USERS_GID?.trim();
  if (gidStr && SPREADSHEET_ID) {
    const targetGid = parseInt(gidStr, 10);
    if (!Number.isNaN(targetGid)) {
      const api = await getSheets();
      const res = await api.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const found = res.data.sheets?.find((s) => s.properties?.sheetId === targetGid);
      if (found?.properties?.title) {
        usersSheetTitleCache = found.properties.title;
        return found.properties.title;
      }
    }
  }

  usersSheetTitleCache = SHEETS.USERS;
  return SHEETS.USERS;
}

/** สร้าง range แบบ 'ชื่อแท็บ'!A2:D */
async function usersValuesRange(a1Range: string): Promise<string> {
  const title = await getUsersSheetTitle();
  const quoted = `'${title.replace(/'/g, "''")}'`;
  return `${quoted}!${a1Range}`;
}

/** sheetId สำหรับ batchUpdate (เท่ากับ gid ใน URL) */
async function getUsersSheetIdForBatch(): Promise<number> {
  const gidStr = process.env.GOOGLE_SHEET_USERS_GID?.trim();
  if (gidStr) {
    const n = parseInt(gidStr, 10);
    if (!Number.isNaN(n)) return n;
  }
  return getSheetId(await getUsersSheetTitle());
}

// Forecast Stock Config
export const FORECAST_SPREADSHEET_ID = '15hAf_tG2jqiEGT71Bo6Yfp75E7OGw6wUTJhOWcocbtI';
export const FORECAST_SHEETS = {
  Q1: 'FC Q1',
  Q2: 'FC Q2',
};

export async function getForecastData(sheetName: string) {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: FORECAST_SPREADSHEET_ID,
    range: `'${sheetName}'`,
  });

  const allRows = response.data.values || [];
  if (allRows.length === 0) {
    return { headers: [], rows: [], sheetName };
  }

  const headers = allRows[0].map((h: string) => (h || '').toString().trim());
  const rows = allRows.slice(1).map((row: string[]) =>
    headers.map((_: string, i: number) => (row[i] || '').toString().trim())
  );

  return { headers, rows, sheetName };
}

export async function updateForecastCell(
  sheetName: string,
  rowIndex: number,
  colIndex: number,
  value: string
) {
  const sheets = await getSheets();
  // rowIndex is 0-based data row index, +2 for header row + 1-based
  const rowNumber = rowIndex + 2;
  // Convert colIndex to column letter (A, B, C, ... Z, AA, AB, ...)
  let colLetter = '';
  let col = colIndex;
  while (col >= 0) {
    colLetter = String.fromCharCode((col % 26) + 65) + colLetter;
    col = Math.floor(col / 26) - 1;
  }
  const cellRange = `'${sheetName}'!${colLetter}${rowNumber}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: FORECAST_SPREADSHEET_ID,
    range: cellRange,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });

  return { success: true, cell: cellRange, value };
}

// Helper functions
export async function getAllDepartments() {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.DEPARTMENTS}!A2:C`,
  });

  const rows = response.data.values || [];
  return rows.map((row, index) => ({
    id: index + 1,
    name: row[0] || '',
    created_at: row[1] || new Date().toISOString(),
  }));
}

export async function getAllAssets() {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.ASSETS}!A2:I`,
  });

  const rows = response.data.values || [];
  const departments = await getAllDepartments();

  return rows.map((row, index) => {
    const departmentId = parseInt(row[4]) || 0;
    const department = departments.find((d) => d.id === departmentId);

    return {
      id: index + 1,
      name: row[0] || '',
      image_url: row[1] || '',
      description: row[2] || '',
      purchase_cost: parseFloat(row[3]) || 0,
      department_id: departmentId,
      department_name: department?.name || '',
      caretaker: row[5] || '',
      usage_type: (row[6] || 'OTHER') as 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE',
      created_at: row[7] || new Date().toISOString(),
      updated_at: row[8] || new Date().toISOString(),
    };
  });
}

export async function getAssetById(id: number) {
  const assets = await getAllAssets();
  return assets.find((asset) => asset.id === id);
}

export async function createAsset(data: {
  name: string;
  image_url?: string;
  description: string;
  purchase_cost: number;
  department_id: number;
  caretaker: string;
  usage_type: 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE';
}) {
  const sheets = await getSheets();
  const now = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.ASSETS}!A:I`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          data.name,
          data.image_url || '',
          data.description,
          data.purchase_cost,
          data.department_id,
          data.caretaker,
          data.usage_type,
          now,
          now,
        ],
      ],
    },
  });

  return { success: true };
}

export async function updateAsset(
  id: number,
  data: {
    name: string;
    image_url?: string;
    description: string;
    purchase_cost: number;
    department_id: number;
    caretaker: string;
    usage_type: 'LIVE' | 'PRODUCTION' | 'OTHER' | 'EDITOR' | 'GRAPHIC' | 'CREATIVE';
  }
) {
  const sheets = await getSheets();
  const now = new Date().toISOString();

  // ดึงข้อมูล assets ทั้งหมดเพื่อหา row ที่ถูกต้อง
  const assets = await getAllAssets();
  const assetToUpdate = assets.find((a) => a.id === id);

  if (!assetToUpdate) {
    throw new Error(`Asset with id ${id} not found`);
  }

  // ดึงข้อมูลทั้งหมดจาก Google Sheets เพื่อหา row number ที่ถูกต้อง
  const allRowsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.ASSETS}!A2:I`,
  });

  const allRows = allRowsResponse.data.values || [];

  // หา row index จากข้อมูลเดิม (ใช้ชื่อเดิมเพื่อหา row)
  let rowIndex = -1;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i][0] === assetToUpdate.name) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    rowIndex = id - 1;
  }

  // rowNumber = rowIndex + 2 (header row + 1-based index)
  const rowNumber = rowIndex + 2;

  // ดึงข้อมูลเดิมเพื่อเก็บ created_at
  const existingRowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.ASSETS}!A${rowNumber}:I${rowNumber}`,
  });

  const existingRow = existingRowResponse.data.values?.[0] || [];
  const created_at = existingRow[7] || assetToUpdate.created_at || new Date().toISOString();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEETS.ASSETS}!A${rowNumber}:I${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [
        [
          data.name,
          data.image_url || '',
          data.description,
          data.purchase_cost,
          data.department_id,
          data.caretaker,
          data.usage_type,
          created_at,
          now,
        ],
      ],
    },
  });

  return { success: true };
}

export async function deleteAsset(id: number) {
  const sheets = await getSheets();

  const assets = await getAllAssets();
  const assetToDelete = assets.find((a) => a.id === id);

  if (!assetToDelete) {
    throw new Error(`Asset with id ${id} not found`);
  }

  const rowIndex = id - 1;
  const rowNumber = rowIndex + 2;

  if (rowNumber < 2) {
    throw new Error(`Invalid row number: ${rowNumber}`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getSheetId(SHEETS.ASSETS),
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  return { success: true };
}

// User management functions
export async function getAllUsers() {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: await usersValuesRange('A2:D'),
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: index + 1,
      username: row[0] || '',
      password: row[1] || '',
      name: row[2] || '',
      role: row[3] || 'user',
    }));
  } catch (error) {
    // ไม่มี credentials / Sheet ดึงไม่ได้ (เช่น บน Vercel ยังไม่ตั้ง GOOGLE_*) → ใช้บัญชีจาก env
    console.error('getAllUsers fallback:', error);
    return [
      {
        id: 1,
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: 'Administrator',
        role: 'admin',
      },
    ];
  }
}

export async function getUserByUsername(username: string) {
  const users = await getAllUsers();
  return users.find((u) => u.username === username);
}

export async function createUser(data: {
  username: string;
  password: string;
  name: string;
  role?: string;
}) {
  const sheets = await getSheets();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: await usersValuesRange('A:D'),
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [
          data.username,
          data.password,
          data.name,
          data.role || 'user',
        ],
      ],
    },
  });

  return { success: true };
}

export async function updateUser(
  id: number,
  data: {
    username?: string;
    password?: string;
    name?: string;
    role?: string;
  }
) {
  const sheets = await getSheets();

  const users = await getAllUsers();
  const userToUpdate = users.find((u) => u.id === id);

  if (!userToUpdate) {
    throw new Error(`User with id ${id} not found`);
  }

  const rowIndex = id - 1;
  const rowNumber = rowIndex + 2;

  if (rowNumber < 2) {
    throw new Error(`Invalid row number: ${rowNumber}`);
  }

  const existingRowResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: await usersValuesRange(`A${rowNumber}:D${rowNumber}`),
  });

  const existingRow = existingRowResponse.data.values?.[0] || [];

  const passwordToUse = (data.password !== undefined && data.password.trim() !== '')
    ? data.password
    : existingRow[1];

  const updatedData = [
    data.username !== undefined ? data.username : existingRow[0],
    passwordToUse,
    data.name !== undefined ? data.name : existingRow[2],
    data.role !== undefined ? data.role : existingRow[3] || 'user',
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: await usersValuesRange(`A${rowNumber}:D${rowNumber}`),
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [updatedData],
    },
  });

  return { success: true };
}

export async function deleteUser(id: number) {
  const sheets = await getSheets();

  const users = await getAllUsers();
  const userToDelete = users.find((u) => u.id === id);

  if (!userToDelete) {
    throw new Error(`User with id ${id} not found`);
  }

  const allRowsResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: await usersValuesRange('A2:D'),
  });

  const allRows = allRowsResponse.data.values || [];

  let rowIndex = -1;
  for (let i = 0; i < allRows.length; i++) {
    if (allRows[i][0] === userToDelete.username) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`User row not found for id ${id}`);
  }

  const rowNumber = rowIndex + 2;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: await getUsersSheetIdForBatch(),
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });

  return { success: true };
}

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
