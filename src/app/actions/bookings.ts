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

export async function updateBookingStatus(bookingId: string, status: string) {
  const { supabase, merchantId } = await getMerchantId();
  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .eq("merchant_id", merchantId);
  if (error) throw error;
  // If no_show, increment customer no_show_count
  if (status === "no_show") {
    const { data: booking } = await supabase
      .from("bookings")
      .select("customer_id")
      .eq("id", bookingId)
      .single();
    if (booking) {
      await supabase.rpc("increment_no_show", { cid: booking.customer_id });
    }
  }
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const { supabase } = await getMerchantId();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled", notes: reason || null })
    .eq("id", bookingId);
  if (error) throw error;
  revalidatePath("/dashboard/calendar");
}
