"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Merchant } from "@/types/database";

export async function getMerchant(): Promise<Merchant | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("merchants")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function createMerchant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const businessName = formData.get("business_name") as string;
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await supabase.from("merchants").insert({
    user_id: user.id,
    business_name: businessName,
    slug,
    timezone: (formData.get("timezone") as string) || "America/New_York",
    cancellation_policy_hours: Number(formData.get("cancellation_policy_hours")) || 24,
    no_show_penalty_amount: Number(formData.get("no_show_penalty_amount")) || 0,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

export async function updateMerchant(formData: FormData) {
  const supabase = await createClient();
  const merchantId = formData.get("id") as string;

  const { error } = await supabase
    .from("merchants")
    .update({
      business_name: formData.get("business_name") as string,
      timezone: formData.get("timezone") as string,
      booking_buffer_minutes: Number(formData.get("booking_buffer_minutes")),
      cancellation_policy_hours: Number(formData.get("cancellation_policy_hours")),
      no_show_penalty_amount: Number(formData.get("no_show_penalty_amount")),
    })
    .eq("id", merchantId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}
