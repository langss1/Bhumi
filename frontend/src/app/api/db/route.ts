import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, SUPABASE_READY } from '@/lib/supabase';

const dbPath = path.join(process.cwd(), 'data_db.json');

function initDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
      assets: [],
      logs: [],
      verificators: [],
      pending_verificators: [],
      active_verificators: [],
      users: [],
      verificator_whitelist: {}
    }, null, 2));
  }
}

// Map JSON table names to Supabase table names
const TABLE_MAP: Record<string, string> = {
  'assets': 'asset_metadata',
  'users': 'users',
  'logs': 'activity_log',
  'verificators': 'verificator_accounts',
  'pending_verificators': 'verificator_accounts', // Filtered by status
  'active_verificators': 'verificator_accounts',  // Filtered by status
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const table = url.searchParams.get('table');

  if (SUPABASE_READY && table && TABLE_MAP[table]) {
    const sbTable = TABLE_MAP[table];
    let query = supabase.from(sbTable).select('*');
    
    // Specical handling for status-based tables
    if (table === 'pending_verificators') query = query.eq('status', 'pending');
    if (table === 'active_verificators') query = query.eq('status', 'approved');

    const { data, error } = await query;
    if (!error && data) {
      // Map back to frontend expected keys
      const mappedData = data.map((item: any) => {
        const newItem = { ...item };
        if (item.asset_id) { newItem.id = item.asset_id; delete newItem.asset_id; }
        if (item.wallet_address) { newItem.wallet = item.wallet_address; delete newItem.wallet_address; }
        return newItem;
      });
      return NextResponse.json(mappedData);
    }
    console.error(`Supabase error fetching ${table}:`, error);
  }

  // Fallback to Local JSON
  initDB();
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (table) return NextResponse.json(data[table] || []);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { table, action, payload } = body;

  if (SUPABASE_READY && (table && TABLE_MAP[table] || action === 'batch')) {
    try {
      if (action === 'batch') {
        const ops = payload.map(async (op: any) => {
          const sbTable = TABLE_MAP[op.table];
          if (!sbTable) return;

          if (op.action === 'insert') return supabase.from(sbTable).insert(op.payload);
          if (op.action === 'update') {
             const key = op.payload.id ? 'id' : (op.payload.wallet ? 'wallet' : (op.payload.username ? 'username' : (op.payload.email ? 'email' : 'id')));
             // Fix for assets mapping: asset_id vs id
             const sbKey = (sbTable === 'asset_metadata' && key === 'id') ? 'asset_id' : (sbTable === 'users' && key === 'wallet' ? 'wallet_address' : key);
             return supabase.from(sbTable).update(op.payload).eq(sbKey, op.payload[key]);
          }
          if (op.action === 'delete') {
             const key = Object.keys(op.payload)[0];
             const sbKey = (sbTable === 'asset_metadata' && key === 'id') ? 'asset_id' : (sbTable === 'users' && (key === 'wallet' || key === 'wallet_address') ? 'wallet_address' : key);
             return supabase.from(sbTable).delete().eq(sbKey, op.payload[key]);
          }
        });
        await Promise.all(ops);
        return NextResponse.json({ success: true });
      }

      const sbTable = TABLE_MAP[table];
      if (sbTable) {
        // Map payload keys to match Supabase schema
        let sbPayload = { ...payload };
        if (sbTable === 'asset_metadata' && payload.id) {
          sbPayload.asset_id = payload.id;
          delete (sbPayload as any).id;
        }
        if (sbTable === 'users' && payload.wallet) {
          sbPayload.wallet_address = payload.wallet;
          delete (sbPayload as any).wallet;
        }

        if (action === 'insert') {
          const { error } = await supabase.from(sbTable).insert(sbPayload);
          if (!error) return NextResponse.json({ success: true });
          console.error("Insert error:", error);
        }
        if (action === 'update') {
          const key = payload.id ? 'id' : (payload.wallet ? 'wallet' : (payload.username ? 'username' : (payload.email ? 'email' : 'id')));
          const sbKey = (sbTable === 'asset_metadata' && key === 'id') ? 'asset_id' : (sbTable === 'users' && key === 'wallet' ? 'wallet_address' : key);
          const { error } = await supabase.from(sbTable).update(sbPayload).eq(sbKey, payload[key]);
          if (!error) return NextResponse.json({ success: true });
          console.error("Update error:", error);
        }
        if (action === 'delete') {
          const key = Object.keys(payload)[0];
          const sbKey = (sbTable === 'asset_metadata' && key === 'id') ? 'asset_id' : (sbTable === 'users' && (key === 'wallet' || key === 'wallet_address') ? 'wallet_address' : key);
          const { error } = await supabase.from(sbTable).delete().eq(sbKey, payload[key]);
          if (!error) return NextResponse.json({ success: true });
          console.error("Delete error:", error);
        }
      }
    } catch (e) {
      console.error("Supabase POST error:", e);
    }
  }

  // Fallback to Local JSON
  initDB();
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  if (!data[table]) data[table] = (table === 'verificator_whitelist' ? {} : []);

  if (action === 'insert') {
    if (Array.isArray(data[table])) data[table].push(payload);
  } else if (action === 'update') {
    if (Array.isArray(data[table])) {
      const index = data[table].findIndex((item: any) => 
        (item.id && item.id === payload.id) || 
        (item.wallet && item.wallet === payload.wallet) ||
        (item.username && item.username === payload.username) ||
        (item.email && item.email === payload.email)
      );
      if (index !== -1) data[table][index] = { ...data[table][index], ...payload };
    } else {
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
  } else if (action === 'batch') {
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
