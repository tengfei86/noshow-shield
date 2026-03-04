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

export async function saveSchedule(
  schedules: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[]
) {
  const { supabase, merchantId } = await getMerchantId();
  // Delete existing and re-insert
  await supabase.from("schedules").delete().eq("merchant_id", merchantId);
  const rows = schedules.map((s) => ({ merchant_id: merchantId, ...s }));
  const { error } = await supabase.from("schedules").insert(rows);
  if (error) throw error;
  revalidatePath("/dashboard/schedule");
}

export async function addBlockedDate(date: string, reason?: string) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase
    .from("blocked_dates")
    .insert({ merchant_id: merchantId, date, reason: reason || null });
  if (error) throw error;
  revalidatePath("/dashboard/schedule");
}

export async function removeBlockedDate(id: string) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase
    .from("blocked_dates")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchantId);
  if (error) throw error;
  revalidatePath("/dashboard/schedule");
}
