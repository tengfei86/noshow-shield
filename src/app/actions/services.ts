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

export async function createService(formData: {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  deposit_amount: number;
}) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase.from("services").insert({
    merchant_id: merchantId,
    ...formData,
  });
  if (error) throw error;
  revalidatePath("/dashboard/services");
}

export async function updateService(
  id: string,
  formData: {
    name: string;
    description?: string;
    duration_minutes: number;
    price: number;
    deposit_amount: number;
  }
) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase
    .from("services")
    .update(formData)
    .eq("id", id)
    .eq("merchant_id", merchantId);
  if (error) throw error;
  revalidatePath("/dashboard/services");
}

export async function deleteService(id: string) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("merchant_id", merchantId);
  if (error) throw error;
  revalidatePath("/dashboard/services");
}
