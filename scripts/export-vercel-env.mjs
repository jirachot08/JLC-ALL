/**
 * สร้างไฟล์ vercel-env-import.env จาก .env (เฉพาะคีย์ที่ deploy ต้องใช้)
 * นำไปวางใน Vercel → Settings → Environment Variables → หรือใช้คู่กับ vercel env
 * รัน: node scripts/export-vercel-env.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env');
const outPath = path.join(root, 'vercel-env-import.env');

const KEYS = [
  'GOOGLE_CLIENT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SHEETS_SPREADSHEET_ID',
  'IMGBB_API_KEY',
  'GOOGLE_SHEET_CSV_URL',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
];

if (!fs.existsSync(envPath)) {
  console.error('ไม่พบ .env — รัน merge-google-into-env.mjs ก่อน');
  process.exit(1);
}

const raw = fs.readFileSync(envPath, 'utf8');
const lines = raw.split(/\r?\n/);
const map = new Map();
for (const line of lines) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (!m) continue;
  let val = m[2];
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  map.set(m[1], val.replace(/\\n/g, '\n').replace(/\\"/g, '"'));
}

let out = '# คัดลอกทีละตัวไป Vercel → Production (และ Preview ถ้าต้องการ)\n';
out += '# DB_HOST=localhost ไม่ใช้บน Vercel — ต้องมี MySQL บนคลาวด์แยกถ้าใช้ฟีเจอร์ที่ต้องมี DB\n\n';

for (const k of KEYS) {
  if (!map.has(k) || map.get(k) === '') continue;
  const v = map.get(k);
  const esc = String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
  out += `${k}="${esc}"\n`;
}

fs.writeFileSync(outPath, out, 'utf8');
console.log('สร้างแล้ว:', outPath);
console.log('เปิดไฟล์นี้ → Vercel → Project → Settings → Environment Variables → เพิ่มทีละตัว');
