import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://c--87dab0ec-7977-4177-b7c6-82f2f4e7bfbb-prod.lovable.cloud";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_b-bn3gCDARtYVK-azU8sKQ_34FCSSbn";

function isNewSupabaseApiKey(value) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey) {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: { fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY) },
});

async function test() {
  const { data: villas, error: villaError } = await supabase
    .from("villas")
    .select("id, name")
    .limit(1);
  console.log("Villas query:", { villas, villaError });

  if (villas && villas.length > 0) {
    const villaId = villas[0].id;
    console.log("Testing insert reservation for villa:", villaId);
    const testRef = "TEST-" + Math.floor(Math.random() * 10000);
    const { data: res, error: insertError } = await supabase
      .from("reservations")
      .insert({
        reference: testRef,
        villa_id: villaId,
        guest_name: "Test User",
        guest_email: "test@example.com",
        guest_phone: "0600000000",
        guests: 2,
        check_in: "2026-11-01",
        check_out: "2026-11-05",
        nights: 4,
        price_per_night: 100,
        price_per_person: 50,
        cleaning_fee: 50,
        deposit: 200,
        total_amount: 450,
        amount_due_now: 450,
        amount_paid: 0,
        payment_option: "full_no_deposit",
        deposit_required: false,
        status: "pending",
      })
      .select()
      .single();

    console.log("Insert result:", { res, insertError });
    if (res?.id) {
      console.log("Deleting test reservation...");
      await supabase.from("reservations").delete().eq("id", res.id);
    }
  }
}

test().catch(console.error);
