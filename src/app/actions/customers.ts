"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getMerchantId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!data) throw new Error("No merchant");
  return { supabase, merchantId: data.id };
}

export async function toggleBlacklist(customerId: string, blocked: boolean) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase
    .from("customers")
    .update({ is_blocked: blocked })
    .eq("id", customerId)
    .eq("merchant_id", merchantId);
  if (error) throw error;
  revalidatePath("/dashboard/customers");
}
