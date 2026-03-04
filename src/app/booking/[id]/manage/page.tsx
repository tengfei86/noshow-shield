"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cancelBooking } from "@/app/actions/bookings";
import type { Booking } from "@/types/database";

export default function ManageBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("*, service:services(*), customer:customers(*)")
        .eq("id", id)
        .single();
      setBooking(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleCancel = async () => {
    if (!booking || !confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(true);
    await cancelBooking(booking.id, "Cancelled by customer");
    setBooking((prev) => prev ? { ...prev, status: "cancelled" } : null);
    setCancelling(false);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    no_show: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="py-12">
            <h2 className="text-lg font-semibold">Booking Not Found</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white p-4">
      <div className="mx-auto max-w-lg space-y-6 py-8">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold text-gray-900">Manage Booking</h1>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{booking.service?.name}</h2>
              <Badge variant="secondary" className={statusColor[booking.status] || ""}>
                {booking.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <CalendarDays className="h-4 w-4" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{booking.start_time} – {booking.end_time}</span>
              </div>
            </div>

            {booking.customer && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium">{booking.customer.name}</p>
                <p className="text-xs text-gray-500">{booking.customer.email}</p>
              </div>
            )}

            {booking.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500">Notes</p>
                <p className="text-sm">{booking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {(booking.status === "pending" || booking.status === "confirmed") && (
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
