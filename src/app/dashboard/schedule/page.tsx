"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { saveSchedule, addBlockedDate, removeBlockedDate } from "@/app/actions/schedule";
import type { Schedule, BlockedDate } from "@/types/database";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DaySchedule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map((_, i) => ({
      day_of_week: i,
      start_time: "09:00",
      end_time: "17:00",
      is_active: i >= 1 && i <= 5,
    }))
  );
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [merchantId, setMerchantId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
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

      const { data: scheds } = await supabase
        .from("schedules")
        .select("*")
        .eq("merchant_id", m.id);
      if (scheds && scheds.length > 0) {
        setSchedule((prev) =>
          prev.map((d) => {
            const found = scheds.find((s) => s.day_of_week === d.day_of_week);
            return found
              ? { day_of_week: found.day_of_week, start_time: found.start_time, end_time: found.end_time, is_active: found.is_active }
              : d;
          })
        );
      }

      const { data: bd } = await supabase
        .from("blocked_dates")
        .select("*")
        .eq("merchant_id", m.id)
        .order("date");
      setBlocked(bd || []);
    };
    load();
  }, []);

  const updateDay = (idx: number, fields: Partial<DaySchedule>) => {
    setSchedule((prev) => prev.map((d, i) => (i === idx ? { ...d, ...fields } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSchedule(schedule);
    setSaving(false);
  };

  const handleAddBlocked = async () => {
    if (!selectedDate) return;
    await addBlockedDate(format(selectedDate, "yyyy-MM-dd"));
    setSelectedDate(undefined);
    // Reload
    const supabase = createClient();
    const { data } = await supabase
      .from("blocked_dates")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("date");
    setBlocked(data || []);
  };

  const handleRemoveBlocked = async (id: string) => {
    await removeBlockedDate(id);
    setBlocked((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
        <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
          {saving ? "Saving..." : "Save Schedule"}
        </Button>
      </div>

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Working Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((day, idx) => (
            <div
              key={day.day_of_week}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"
            >
              <div className="flex w-32 items-center gap-3">
                <Switch
                  checked={day.is_active}
                  onCheckedChange={(v) => updateDay(idx, { is_active: v })}
                />
                <span className="text-sm font-medium">{DAYS[day.day_of_week]}</span>
              </div>
              {day.is_active && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={day.start_time}
                    onChange={(e) => updateDay(idx, { start_time: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-gray-400">to</span>
                  <Input
                    type="time"
                    value={day.end_time}
                    onChange={(e) => updateDay(idx, { end_time: e.target.value })}
                    className="w-32"
                  />
                </div>
              )}
              {!day.is_active && (
                <span className="text-sm text-gray-400">Closed</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Blocked dates */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-start gap-4">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              <Button
                size="sm"
                onClick={handleAddBlocked}
                disabled={!selectedDate}
                className="mt-2 w-full bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Block Date
              </Button>
            </div>
            <div className="flex-1 space-y-2">
              {blocked.length === 0 && (
                <p className="text-sm text-gray-400">No blocked dates</p>
              )}
              {blocked.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-medium">{b.date}</span>
                    {b.reason && (
                      <span className="ml-2 text-xs text-gray-400">{b.reason}</span>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => handleRemoveBlocked(b.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
