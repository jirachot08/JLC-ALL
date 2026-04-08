/**
 * อ่าน google-credentials.json แล้วใส่ GOOGLE_CLIENT_EMAIL / GOOGLE_PRIVATE_KEY ใน .env
 * รัน: node scripts/merge-google-into-env.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const credPath = path.join(root, 'google-credentials.json');
const envPath = path.join(root, '.env');

if (!fs.existsSync(credPath)) {
  console.error('ไม่พบ google-credentials.json');
  process.exit(1);
}

const cred = JSON.parse(fs.readFileSync(credPath, 'utf8'));
const email = cred.client_email;
const key = cred.private_key;
if (!email || !key) {
  console.error('credentials ไม่มี client_email หรือ private_key');
  process.exit(1);
}

/** ค่าในเครื่องหมายคำพูดสำหรับ .env — dotenv จะแปลง \\n เป็น newline */
function escapeEnvQuoted(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n');
}

let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

function upsertEnv(content, name, valueEscaped) {
  const line = `${name}="${valueEscaped}"`;
  const re = new RegExp(`^${name}=.*$`, 'm');
  if (re.test(content)) {
    return content.replace(re, line);
  }
  const sep = content.length && !content.endsWith('\n') ? '\n' : '';
  return content + sep + line + '\n';
}

env = upsertEnv(env, 'GOOGLE_CLIENT_EMAIL', escapeEnvQuoted(email));
env = upsertEnv(env, 'GOOGLE_PRIVATE_KEY', escapeEnvQuoted(key));

fs.writeFileSync(envPath, env, 'utf8');
console.log('อัปเดต .env แล้ว: GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY');
console.log('(อย่า commit .env — ถูก ignore อยู่แล้ว)');
