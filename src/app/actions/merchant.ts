"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function getMerchantId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data } = await supabase
    .from("merchants")
    .select("id")
    .eq("user_id", user.id)
    .single();
  return { supabase, userId: user.id, merchantId: data?.id };
}

export async function updateMerchant(fields: Record<string, unknown>) {
  const { supabase, merchantId } = await getMerchantId();
  if (!merchantId) throw new Error("No merchant");
  const { error } = await supabase
    .from("merchants")
    .update(fields)
    .eq("id", merchantId);
  if (error) throw error;
  revalidatePath("/dashboard/settings");
}

export async function createMerchantOnboarding(fields: {
  business_name: string;
  slug: string;
  timezone: string;
}) {
  const { supabase, userId } = await getMerchantId();
  const { data, error } = await supabase
    .from("merchants")
    .insert({ user_id: userId, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}
