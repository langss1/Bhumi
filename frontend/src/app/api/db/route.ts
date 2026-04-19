import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data_db.json');

function initDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
      assets: [],
      logs: [],
      verificators: [],
      pending_verificators: [],
      active_verificators: [],
      verificator_whitelist: {}
    }, null, 2));
  }
}

export async function GET(request: Request) {
  initDB();
  const url = new URL(request.url);
  const table = url.searchParams.get('table');
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (table) return NextResponse.json(data[table] || []);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  initDB();
  const body = await request.json();
  const { table, action, payload } = body;
  
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (!data[table]) data[table] = (table === 'verificator_whitelist' ? {} : []);

  if (action === 'insert') {
    if (Array.isArray(data[table])) {
      data[table].push(payload);
    }
  } else if (action === 'update') {
    if (Array.isArray(data[table])) {
      const index = data[table].findIndex((item: any) => 
        (item.id && item.id === payload.id) || 
        (item.wallet && item.wallet === payload.wallet) ||
        (item.username && item.username === payload.username)
      );
      if (index !== -1) {
        data[table][index] = { ...data[table][index], ...payload };
      }
    } else {
      // For objects like whitelist
      data[table] = { ...data[table], ...payload };
    }
  } else if (action === 'delete') {
    if (Array.isArray(data[table])) {
      data[table] = data[table].filter((item: any) => {
        const matchId       = payload.id && item.id === payload.id;
        const matchWallet   = payload.wallet && item.wallet === payload.wallet;
        const matchUsername = payload.username && item.username === payload.username;
        const matchEmail    = payload.email && item.email === payload.email;
        return !(matchId || matchWallet || matchUsername || matchEmail);
      });
    }
  } else if (action === 'replace') {
    data[table] = payload;
  } else if (action === 'batch') {
    // payload: [{ table, action, payload }, ...]
    payload.forEach((op: any) => {
      const { table: opTable, action: opAction, payload: opPayload } = op;
      if (!data[opTable]) data[opTable] = (opTable === 'verificator_whitelist' ? {} : []);
      
      if (opAction === 'insert') {
        if (Array.isArray(data[opTable])) data[opTable].push(opPayload);
      } else if (opAction === 'update') {
        if (Array.isArray(data[opTable])) {
          const idx = data[opTable].findIndex((item: any) => 
            (opPayload.id && item.id === opPayload.id) || 
            (opPayload.wallet && item.wallet === opPayload.wallet) ||
            (opPayload.username && item.username === opPayload.username) ||
            (opPayload.email && item.email === opPayload.email)
          );
          if (idx !== -1) data[opTable][idx] = { ...data[opTable][idx], ...opPayload };
        } else {
          data[opTable] = { ...data[opTable], ...opPayload };
        }
      } else if (opAction === 'delete') {
        if (Array.isArray(data[opTable])) {
          data[opTable] = data[opTable].filter((item: any) => {
            const mId = opPayload.id && item.id === opPayload.id;
            const mWa = opPayload.wallet && item.wallet === opPayload.wallet;
            const mUs = opPayload.username && item.username === opPayload.username;
            const mEm = opPayload.email && item.email === opPayload.email;
            return !(mId || mWa || mUs || mEm);
          });
        }
      }
    });
  }

  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  return NextResponse.json({ success: true, data: data[table] });
}
