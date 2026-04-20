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

// Helper to map frontend payload to Supabase schema
function mapToSupabase(table: string, payload: any) {
  const sbTable = TABLE_MAP[table];
  if (!sbTable) return { table: null, payload: null };

  let sbPayload: any = {};
  if (sbTable === 'users') {
    if (payload.wallet) sbPayload.wallet_address = payload.wallet;
    if (payload.wallet_address) sbPayload.wallet_address = payload.wallet_address;
    if (payload.name)   sbPayload.display_name = payload.name;
    if (payload.email)  sbPayload.email = payload.email;
    if (payload.avatar_url) sbPayload.avatar_url = payload.avatar_url;
    // Add password support if columns exist (ignoring if not)
    if (payload.password) sbPayload.password = payload.password;
  } else if (sbTable === 'asset_metadata') {
    if (payload.id)           sbPayload.asset_id = payload.id;
    if (payload.asset_id)     sbPayload.asset_id = payload.asset_id;
    if (payload.name)         sbPayload.asset_name = payload.name;
    if (payload.asset_name)   sbPayload.asset_name = payload.asset_name;
    if (payload.category)     sbPayload.category = payload.category;
    if (payload.status)       sbPayload.status = payload.status;
    if (payload.valuation)    sbPayload.valuation = payload.valuation;
    if (payload.ownerEmail)   sbPayload.owner_email = payload.ownerEmail;
    if (payload.owner_email)  sbPayload.owner_email = payload.owner_email;
    if (payload.owner)        sbPayload.owner_wallet = payload.owner;
    if (payload.owner_wallet) sbPayload.owner_wallet = payload.owner_wallet;
    if (payload.documentHash) sbPayload.document_hash = payload.documentHash;
    if (payload.document_hash) sbPayload.document_hash = payload.document_hash;
    if (payload.documentUrl)  sbPayload.document_url = payload.documentUrl;
    if (payload.document_url) sbPayload.document_url = payload.document_url;
    if (payload.txHash)       sbPayload.tx_hash = payload.txHash;
    if (payload.date)         sbPayload.created_at = payload.date;
  } else {
    sbPayload = { ...payload };
  }
  return { table: sbTable, payload: sbPayload };
}

function getSbKey(sbTable: string, key: string) {
  if (sbTable === 'asset_metadata' && key === 'id') return 'asset_id';
  if (sbTable === 'users' && (key === 'wallet' || key === 'wallet_address')) return 'wallet_address';
  return key;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const table = url.searchParams.get('table');

  if (SUPABASE_READY && table && TABLE_MAP[table]) {
    const sbTable = TABLE_MAP[table];
    let query = supabase.from(sbTable).select('*');
    
    if (table === 'pending_verificators') query = query.eq('status', 'pending');
    if (table === 'active_verificators') query = query.eq('status', 'approved');

    const { data, error } = await query;
    if (!error && data) {
      const mappedData = data.map((item: any) => {
        const newItem = { ...item };
        if (item.asset_id) { newItem.id = item.asset_id; delete newItem.asset_id; }
        if (item.asset_name) { newItem.name = item.asset_name; delete newItem.asset_name; }
        if (item.owner_wallet) { newItem.owner = item.owner_wallet; delete newItem.owner_wallet; }
        if (item.owner_email) { newItem.ownerEmail = item.owner_email; delete newItem.owner_email; }
        if (item.document_hash) { newItem.documentHash = item.document_hash; delete newItem.document_hash; }
        if (item.document_url) { newItem.documentUrl = item.document_url; delete newItem.document_url; }
        if (item.wallet_address) { newItem.wallet = item.wallet_address; delete newItem.wallet_address; }
        if (item.display_name) { newItem.name = item.display_name; delete newItem.display_name; }
        return newItem;
      });
      return NextResponse.json(mappedData);
    }
  }

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
          const { table: sbTable, payload: sbPayload } = mapToSupabase(op.table, op.payload);
          if (!sbTable) return;

          if (op.action === 'insert') return supabase.from(sbTable).insert(sbPayload);
          if (op.action === 'update') {
             const key = op.payload.id ? 'id' : (op.payload.wallet ? 'wallet' : (op.payload.username ? 'username' : (op.payload.email ? 'email' : 'id')));
             const sbKey = getSbKey(sbTable, key);
             return supabase.from(sbTable).update(sbPayload).eq(sbKey, op.payload[key]);
          }
          if (op.action === 'delete') {
             const key = Object.keys(op.payload)[0];
             const sbKey = getSbKey(sbTable, key);
             return supabase.from(sbTable).delete().eq(sbKey, op.payload[key]);
          }
        });
        await Promise.all(ops);
        return NextResponse.json({ success: true });
      }

      const { table: sbTable, payload: sbPayload } = mapToSupabase(table, payload);
      if (sbTable) {
        if (action === 'insert') {
          const { error } = await supabase.from(sbTable).insert(sbPayload);
          if (!error) return NextResponse.json({ success: true });
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (action === 'update') {
          const key = payload.id ? 'id' : (payload.wallet ? 'wallet' : (payload.username ? 'username' : (payload.email ? 'email' : 'id')));
          const sbKey = getSbKey(sbTable, key);
          const { error } = await supabase.from(sbTable).update(sbPayload).eq(sbKey, payload[key]);
          if (!error) return NextResponse.json({ success: true });
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
        if (action === 'delete') {
          const key = Object.keys(payload)[0];
          const sbKey = getSbKey(sbTable, key);
          const { error } = await supabase.from(sbTable).delete().eq(sbKey, payload[key]);
          if (!error) return NextResponse.json({ success: true });
          return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }
      }
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
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
