"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Schedule, BlockedDate } from "@/types/database";

export async function getSchedules(merchantId: string): Promise<Schedule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schedules")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("day_of_week");

  return data ?? [];
}

export async function upsertSchedule(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const payload = {
    merchant_id: formData.get("merchant_id") as string,
    day_of_week: Number(formData.get("day_of_week")),
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    is_active: formData.get("is_active") !== "false",
  };

  if (id) {
    const { error } = await supabase.from("schedules").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("schedules").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/schedule");
}

export async function deleteSchedule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/schedule");
}

export async function getBlockedDates(merchantId: string): Promise<BlockedDate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blocked_dates")
    .select("*")
    .eq("merchant_id", merchantId)
    .order("date");

  return data ?? [];
}

export async function addBlockedDate(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("blocked_dates").insert({
    merchant_id: formData.get("merchant_id") as string,
    date: formData.get("date") as string,
    reason: (formData.get("reason") as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/schedule");
}

export async function removeBlockedDate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/schedule");
}
