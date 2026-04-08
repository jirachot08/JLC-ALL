/**
 * ตั้ง GOOGLE_SHEET_USERS_GID=866934488 บน Vercel ผ่าน API (ไม่ต้องคลิกในเว็บ)
 *
 * 1) สร้าง Token: https://vercel.com/account/tokens
 * 2) ในโปรเจกต์ Vercel → Settings → General → Project ID
 * 3) สร้างไฟล์ .env.vercel.local (อย่า commit) หรือ export ในเทอร์มินัล:
 *    VERCEL_TOKEN=vercel_xxx...
 *    VERCEL_PROJECT_ID=prj_xxx...
 *    (ถ้ามีทีม) VERCEL_TEAM_ID=team_xxx... หรือรัน `npx vercel link` ให้มี .vercel/project.json
 *
 * รัน: node scripts/vercel-add-users-gid.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

dotenv.config({ path: path.join(root, '.env.vercel.local') });
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

const GID = '866934488';
const KEY = 'GOOGLE_SHEET_USERS_GID';

let projectId = process.env.VERCEL_PROJECT_ID?.trim();
let teamId = process.env.VERCEL_TEAM_ID?.trim();

const vercelJson = path.join(root, '.vercel', 'project.json');
if (fs.existsSync(vercelJson)) {
  const j = JSON.parse(fs.readFileSync(vercelJson, 'utf8'));
  if (!projectId && j.projectId) projectId = j.projectId;
  if (!teamId && j.orgId) teamId = j.orgId;
}

const token = process.env.VERCEL_TOKEN?.trim();

if (!token) {
  console.error(`
ไม่พบ VERCEL_TOKEN
1) ไปสร้างที่ https://vercel.com/account/tokens
2) สร้างไฟล์ .env.vercel.local ในโฟลเดอร์โปรเจกต์ ใส่:
   VERCEL_TOKEN=vercel_...
   VERCEL_PROJECT_ID=prj_...
   (ถ้าโปรเจกต์อยู่ทีม) VERCEL_TEAM_ID=team_...
   หรือรัน: npx vercel link
`);
  process.exit(1);
}

if (!projectId) {
  console.error(`
ไม่พบ VERCEL_PROJECT_ID — ดูที่ Vercel → Project → Settings → General → Project ID
หรือรัน npx vercel link แล้วให้มีไฟล์ .vercel/project.json
`);
  process.exit(1);
}

let url = `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env`;
if (teamId) url += `?teamId=${encodeURIComponent(teamId)}`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: KEY,
    value: GID,
    type: 'plain',
    target: ['production', 'preview', 'development'],
  }),
});

const text = await res.text();
let data;
try {
  data = JSON.parse(text);
} catch {
  data = { raw: text };
}

if (!res.ok) {
  if (res.status === 409 || (data.error?.code === 'ENV_ALREADY_EXISTS')) {
    console.log('มีตัวแปรนี้อยู่แล้ว — ลองแก้ค่าใน Vercel Dashboard หรือลบแล้วรันใหม่');
  }
  console.error('Vercel API:', res.status, data);
  process.exit(1);
}

console.log(`ตั้งค่า ${KEY}=${GID} บน Vercel สำเร็จ`);
console.log('ไปที่ Vercel → Deployments → Redeploy โปรเจกต์หนึ่งครั้ง');
