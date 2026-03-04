"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, CheckCircle, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Booking, Merchant } from "@/types/database";

export default function DashboardPage() {
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ today: 0, weeklyRate: 0, totalNoShows: 0 });
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: m } = await supabase
        .from("merchants")
        .select("*")
        .eq("user_id", user.id)
        .single();
      setMerchant(m);
      if (!m) return;

      const today = format(new Date(), "yyyy-MM-dd");
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, service:services(*), customer:customers(*)")
        .eq("merchant_id", m.id)
        .eq("date", today)
        .order("start_time");
      setTodayBookings(bookings || []);

      const todayCount = bookings?.length || 0;

      // Weekly completed rate
      const weekAgo = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");
      const { data: weekBookings } = await supabase
        .from("bookings")
        .select("status")
        .eq("merchant_id", m.id)
        .gte("date", weekAgo)
        .lte("date", today);
      const total = weekBookings?.length || 0;
      const completed = weekBookings?.filter((b) => b.status === "completed").length || 0;
      const weeklyRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Total no-shows
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("merchant_id", m.id)
        .eq("status", "no_show");

      setStats({ today: todayCount, weeklyRate, totalNoShows: count || 0 });
    };
    load();
  }, []);

  const copyLink = () => {
    if (!merchant) return;
    navigator.clipboard.writeText(`${window.location.origin}/${merchant.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          {copied ? <CheckCircle className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied!" : "Copy Booking Link"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today&apos;s Bookings</CardTitle>
            <CalendarDays className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Weekly Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.weeklyRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total No-Shows</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalNoShows}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayBookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No bookings today</p>
          ) : (
            <div className="space-y-3">
              {todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.customer?.name || "Guest"}</p>
                    <p className="text-sm text-gray-500">
                      {b.service?.name} · {b.start_time} – {b.end_time}
                    </p>
                  </div>
                  <Badge variant="secondary" className={statusColor[b.status] || ""}>
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {merchant && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ExternalLink className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Booking page:{" "}
              <a
                href={`/${merchant.slug}`}
                target="_blank"
                className="text-violet-600 underline"
              >
                {typeof window !== "undefined" && window.location.origin}/{merchant.slug}
              </a>
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
