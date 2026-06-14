require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const address = '0xF39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('wallet_address', address);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Profile data for wallet:', address);
    console.log(data);
  }
}

run();
