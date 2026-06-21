import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mcfavdollxnpihkmnnry.supabase.co';
const SUPABASE_ANON = 'sb_publishable_cX9xILppcsZ1048_0sZ85w_mKKmqD_7';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

async function testRLS() {
  const address = '0xCb60C2C082E57f5a22bB2393929d93e56eC366C0'; 
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('wallet_address', address)
    .single();

  if (error) {
    console.error("Read Error:", error.message);
  } else {
    console.log("Read Success:", data.role);
  }

  // Test Update
  if (data) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name + " test" })
      .eq('id', data.id);
    
    if (updateError) {
      console.error("Update Error:", updateError.message);
    } else {
      console.log("Update Success for anonymous user!");
    }
  }
}

testRLS().catch(console.error);
