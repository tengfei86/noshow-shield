"use client";

import { useEffect, useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { updateBookingStatus } from "@/app/actions/bookings";
import type { Booking } from "@/types/database";

export default function CalendarPage() {
  const [date, setDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [merchantId, setMerchantId] = useState("");

  const load = async (d: Date) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: m } = await supabase
      .from("merchants")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!m) return;
    setMerchantId(m.id);
    const dateStr = format(d, "yyyy-MM-dd");
    const { data } = await supabase
      .from("bookings")
      .select("*, service:services(*), customer:customers(*)")
      .eq("merchant_id", m.id)
      .eq("date", dateStr)
      .order("start_time");
    setBookings(data || []);
  };

  useEffect(() => { load(date); }, [date]);

  const handleStatus = async (id: string, status: string) => {
    await updateBookingStatus(id, status);
    load(date);
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    no_show: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" onClick={() => setDate(subDays(date, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px]">
              <CalendarDays className="mr-2 h-4 w-4" />
              {format(date, "EEEE, MMM d, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
            />
          </PopoverContent>
        </Popover>
        <Button size="icon" variant="outline" onClick={() => setDate(addDays(date, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDate(new Date())}
          className="text-violet-600"
        >
          Today
        </Button>
      </div>

      {/* Bookings */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            No bookings on this day
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{b.customer?.name || "Guest"}</h3>
                      <Badge variant="secondary" className={statusColor[b.status] || ""}>
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {b.service?.name} · {b.start_time} – {b.end_time}
                    </p>
                  </div>
                  {(b.status === "confirmed" || b.status === "pending") && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => handleStatus(b.id, "completed")}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleStatus(b.id, "no_show")}
                      >
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        No-Show
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
